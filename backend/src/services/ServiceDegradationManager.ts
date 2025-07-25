import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';

export interface ServiceDependency {
  name: string;
  critical: boolean;
  fallbackAvailable: boolean;
  healthCheckUrl?: string;
  timeout: number;
}

export interface DegradationRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    service: string;
    condition: 'unavailable' | 'slow' | 'error_rate_high';
    threshold?: number;
  };
  actions: DegradationAction[];
  enabled: boolean;
  priority: number;
}

export interface DegradationAction {
  type: 'disable_feature' | 'use_fallback' | 'reduce_functionality' | 'cache_response' | 'queue_request';
  target: string;
  parameters?: Record<string, any>;
}

export interface ServiceStatus {
  name: string;
  status: 'available' | 'degraded' | 'unavailable';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  degradationLevel: number; // 0-100, where 0 is fully functional, 100 is completely degraded
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  degradationLevel: number;
  fallbackBehavior?: string;
  dependencies: string[];
}

/**
 * Service Degradation Manager for graceful degradation
 */
export class ServiceDegradationManager extends EventEmitter {
  private static instance: ServiceDegradationManager;
  private services = new Map<string, ServiceStatus>();
  private dependencies = new Map<string, ServiceDependency>();
  private degradationRules = new Map<string, DegradationRule>();
  private featureFlags = new Map<string, FeatureFlag>();
  private activeDegradations = new Map<string, { rule: DegradationRule; startTime: Date }>();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  private constructor() {
    super();
    this.initializeDefaultDependencies();
    this.initializeDefaultRules();
    this.initializeDefaultFeatures();
  }

  public static getInstance(): ServiceDegradationManager {
    if (!ServiceDegradationManager.instance) {
      ServiceDegradationManager.instance = new ServiceDegradationManager();
    }
    return ServiceDegradationManager.instance;
  }

  /**
   * Initialize default service dependencies
   */
  private initializeDefaultDependencies(): void {
    const defaultDependencies: ServiceDependency[] = [
      {
        name: 'database',
        critical: true,
        fallbackAvailable: false,
        timeout: 5000
      },
      {
        name: 'redis',
        critical: false,
        fallbackAvailable: true,
        timeout: 2000
      },
      {
        name: 'file_storage',
        critical: false,
        fallbackAvailable: true,
        timeout: 10000
      },
      {
        name: 'external_api',
        critical: false,
        fallbackAvailable: true,
        timeout: 15000
      },
      {
        name: 'email_service',
        critical: false,
        fallbackAvailable: true,
        timeout: 30000
      }
    ];

    defaultDependencies.forEach(dep => {
      this.dependencies.set(dep.name, dep);
      this.services.set(dep.name, {
        name: dep.name,
        status: 'available',
        responseTime: 0,
        errorRate: 0,
        lastCheck: new Date(),
        degradationLevel: 0
      });
    });
  }

  /**
   * Initialize default degradation rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: DegradationRule[] = [
      {
        id: 'redis_unavailable',
        name: 'Redis Cache Unavailable',
        description: 'When Redis is unavailable, disable caching features',
        trigger: {
          service: 'redis',
          condition: 'unavailable'
        },
        actions: [
          {
            type: 'use_fallback',
            target: 'cache',
            parameters: { fallback: 'memory' }
          },
          {
            type: 'disable_feature',
            target: 'session_cache'
          }
        ],
        enabled: true,
        priority: 1
      },
      {
        id: 'database_slow',
        name: 'Database Performance Degradation',
        description: 'When database is slow, enable aggressive caching',
        trigger: {
          service: 'database',
          condition: 'slow',
          threshold: 2000 // 2 seconds
        },
        actions: [
          {
            type: 'cache_response',
            target: 'database_queries',
            parameters: { ttl: 300, aggressive: true }
          },
          {
            type: 'reduce_functionality',
            target: 'complex_queries'
          }
        ],
        enabled: true,
        priority: 2
      },
      {
        id: 'file_storage_unavailable',
        name: 'File Storage Unavailable',
        description: 'When file storage is unavailable, queue upload requests',
        trigger: {
          service: 'file_storage',
          condition: 'unavailable'
        },
        actions: [
          {
            type: 'queue_request',
            target: 'file_uploads'
          },
          {
            type: 'use_fallback',
            target: 'static_files',
            parameters: { fallback: 'cdn' }
          }
        ],
        enabled: true,
        priority: 3
      },
      {
        id: 'external_api_error_rate',
        name: 'External API High Error Rate',
        description: 'When external API has high error rate, use cached responses',
        trigger: {
          service: 'external_api',
          condition: 'error_rate_high',
          threshold: 10 // 10% error rate
        },
        actions: [
          {
            type: 'cache_response',
            target: 'external_api_calls',
            parameters: { ttl: 3600, stale_while_revalidate: true }
          },
          {
            type: 'reduce_functionality',
            target: 'real_time_updates'
          }
        ],
        enabled: true,
        priority: 4
      },
      {
        id: 'email_service_unavailable',
        name: 'Email Service Unavailable',
        description: 'When email service is unavailable, queue email requests',
        trigger: {
          service: 'email_service',
          condition: 'unavailable'
        },
        actions: [
          {
            type: 'queue_request',
            target: 'email_notifications'
          },
          {
            type: 'disable_feature',
            target: 'real_time_email_alerts'
          }
        ],
        enabled: true,
        priority: 5
      }
    ];

    defaultRules.forEach(rule => {
      this.degradationRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize default feature flags
   */
  private initializeDefaultFeatures(): void {
    const defaultFeatures: FeatureFlag[] = [
      {
        name: 'cache',
        enabled: true,
        degradationLevel: 0,
        fallbackBehavior: 'memory_cache',
        dependencies: ['redis']
      },
      {
        name: 'session_cache',
        enabled: true,
        degradationLevel: 0,
        dependencies: ['redis']
      },
      {
        name: 'file_uploads',
        enabled: true,
        degradationLevel: 0,
        fallbackBehavior: 'queue_for_later',
        dependencies: ['file_storage']
      },
      {
        name: 'real_time_updates',
        enabled: true,
        degradationLevel: 0,
        fallbackBehavior: 'polling',
        dependencies: ['external_api']
      },
      {
        name: 'email_notifications',
        enabled: true,
        degradationLevel: 0,
        fallbackBehavior: 'queue_for_later',
        dependencies: ['email_service']
      },
      {
        name: 'complex_queries',
        enabled: true,
        degradationLevel: 0,
        fallbackBehavior: 'simplified_results',
        dependencies: ['database']
      }
    ];

    defaultFeatures.forEach(feature => {
      this.featureFlags.set(feature.name, feature);
    });
  }

  /**
   * Register a service dependency
   */
  registerService(dependency: ServiceDependency): void {
    this.dependencies.set(dependency.name, dependency);
    
    if (!this.services.has(dependency.name)) {
      this.services.set(dependency.name, {
        name: dependency.name,
        status: 'available',
        responseTime: 0,
        errorRate: 0,
        lastCheck: new Date(),
        degradationLevel: 0
      });
    }

    logger.info(`Service dependency registered: ${dependency.name}`);
  }

  /**
   * Update service status
   */
  updateServiceStatus(serviceName: string, status: Partial<ServiceStatus>): void {
    const existing = this.services.get(serviceName);
    if (!existing) {
      logger.warn(`Attempted to update unknown service: ${serviceName}`);
      return;
    }

    const updated: ServiceStatus = {
      ...existing,
      ...status,
      lastCheck: new Date()
    };

    this.services.set(serviceName, updated);
    this.emit('serviceStatusUpdate', { serviceName, status: updated });

    // Check if degradation rules should be triggered
    this.evaluateDegradationRules(serviceName, updated);
  }

  /**
   * Evaluate degradation rules for a service
   */
  private evaluateDegradationRules(serviceName: string, status: ServiceStatus): void {
    const applicableRules = Array.from(this.degradationRules.values())
      .filter(rule => rule.enabled && rule.trigger.service === serviceName)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      const shouldTrigger = this.shouldTriggerRule(rule, status);
      const isActive = this.activeDegradations.has(rule.id);

      if (shouldTrigger && !isActive) {
        this.activateDegradation(rule);
      } else if (!shouldTrigger && isActive) {
        this.deactivateDegradation(rule.id);
      }
    }
  }

  /**
   * Check if a degradation rule should be triggered
   */
  private shouldTriggerRule(rule: DegradationRule, status: ServiceStatus): boolean {
    switch (rule.trigger.condition) {
      case 'unavailable':
        return status.status === 'unavailable';
      
      case 'slow':
        return rule.trigger.threshold ? status.responseTime > rule.trigger.threshold : false;
      
      case 'error_rate_high':
        return rule.trigger.threshold ? status.errorRate > rule.trigger.threshold : false;
      
      default:
        return false;
    }
  }

  /**
   * Activate a degradation rule
   */
  private activateDegradation(rule: DegradationRule): void {
    logger.warn(`Activating degradation rule: ${rule.name}`);
    
    this.activeDegradations.set(rule.id, {
      rule,
      startTime: new Date()
    });

    // Execute degradation actions
    for (const action of rule.actions) {
      this.executeDegradationAction(action, rule);
    }

    this.emit('degradationActivated', { rule });
  }

  /**
   * Deactivate a degradation rule
   */
  private deactivateDegradation(ruleId: string): void {
    const degradation = this.activeDegradations.get(ruleId);
    if (!degradation) return;

    logger.info(`Deactivating degradation rule: ${degradation.rule.name}`);
    
    // Reverse degradation actions
    for (const action of degradation.rule.actions) {
      this.reverseDegradationAction(action, degradation.rule);
    }

    this.activeDegradations.delete(ruleId);
    this.emit('degradationDeactivated', { rule: degradation.rule });
  }

  /**
   * Execute a degradation action
   */
  private executeDegradationAction(action: DegradationAction, rule: DegradationRule): void {
    logger.info(`Executing degradation action: ${action.type} on ${action.target}`);

    switch (action.type) {
      case 'disable_feature':
        this.disableFeature(action.target);
        break;
      
      case 'use_fallback':
        this.enableFallback(action.target, action.parameters);
        break;
      
      case 'reduce_functionality':
        this.reduceFunctionality(action.target, action.parameters);
        break;
      
      case 'cache_response':
        this.enableAggressiveCaching(action.target, action.parameters);
        break;
      
      case 'queue_request':
        this.enableRequestQueuing(action.target, action.parameters);
        break;
      
      default:
        logger.warn(`Unknown degradation action type: ${action.type}`);
    }
  }

  /**
   * Reverse a degradation action
   */
  private reverseDegradationAction(action: DegradationAction, rule: DegradationRule): void {
    logger.info(`Reversing degradation action: ${action.type} on ${action.target}`);

    switch (action.type) {
      case 'disable_feature':
        this.enableFeature(action.target);
        break;
      
      case 'use_fallback':
        this.disableFallback(action.target);
        break;
      
      case 'reduce_functionality':
        this.restoreFunctionality(action.target);
        break;
      
      case 'cache_response':
        this.disableAggressiveCaching(action.target);
        break;
      
      case 'queue_request':
        this.disableRequestQueuing(action.target);
        break;
    }
  }

  /**
   * Disable a feature
   */
  private disableFeature(featureName: string): void {
    const feature = this.featureFlags.get(featureName);
    if (feature) {
      feature.enabled = false;
      feature.degradationLevel = 100;
      this.featureFlags.set(featureName, feature);
      this.emit('featureDisabled', { feature: featureName });
    }
  }

  /**
   * Enable a feature
   */
  private enableFeature(featureName: string): void {
    const feature = this.featureFlags.get(featureName);
    if (feature) {
      feature.enabled = true;
      feature.degradationLevel = 0;
      this.featureFlags.set(featureName, feature);
      this.emit('featureEnabled', { feature: featureName });
    }
  }

  /**
   * Enable fallback behavior
   */
  private enableFallback(target: string, parameters?: Record<string, any>): void {
    logger.info(`Enabling fallback for ${target}`, parameters);
    this.emit('fallbackEnabled', { target, parameters });
  }

  /**
   * Disable fallback behavior
   */
  private disableFallback(target: string): void {
    logger.info(`Disabling fallback for ${target}`);
    this.emit('fallbackDisabled', { target });
  }

  /**
   * Reduce functionality
   */
  private reduceFunctionality(target: string, parameters?: Record<string, any>): void {
    logger.info(`Reducing functionality for ${target}`, parameters);
    this.emit('functionalityReduced', { target, parameters });
  }

  /**
   * Restore functionality
   */
  private restoreFunctionality(target: string): void {
    logger.info(`Restoring functionality for ${target}`);
    this.emit('functionalityRestored', { target });
  }

  /**
   * Enable aggressive caching
   */
  private enableAggressiveCaching(target: string, parameters?: Record<string, any>): void {
    logger.info(`Enabling aggressive caching for ${target}`, parameters);
    this.emit('aggressiveCachingEnabled', { target, parameters });
  }

  /**
   * Disable aggressive caching
   */
  private disableAggressiveCaching(target: string): void {
    logger.info(`Disabling aggressive caching for ${target}`);
    this.emit('aggressiveCachingDisabled', { target });
  }

  /**
   * Enable request queuing
   */
  private enableRequestQueuing(target: string, parameters?: Record<string, any>): void {
    logger.info(`Enabling request queuing for ${target}`, parameters);
    this.emit('requestQueuingEnabled', { target, parameters });
  }

  /**
   * Disable request queuing
   */
  private disableRequestQueuing(target: string): void {
    logger.info(`Disabling request queuing for ${target}`);
    this.emit('requestQueuingDisabled', { target });
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureName: string): boolean {
    const feature = this.featureFlags.get(featureName);
    return feature ? feature.enabled : false;
  }

  /**
   * Get feature degradation level
   */
  getFeatureDegradationLevel(featureName: string): number {
    const feature = this.featureFlags.get(featureName);
    return feature ? feature.degradationLevel : 0;
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName?: string): ServiceStatus | Map<string, ServiceStatus> {
    if (serviceName) {
      return this.services.get(serviceName) || {
        name: serviceName,
        status: 'unavailable',
        responseTime: 0,
        errorRate: 100,
        lastCheck: new Date(),
        degradationLevel: 100
      };
    }
    return new Map(this.services);
  }

  /**
   * Get active degradations
   */
  getActiveDegradations(): Map<string, { rule: DegradationRule; startTime: Date }> {
    return new Map(this.activeDegradations);
  }

  /**
   * Get all feature flags
   */
  getFeatureFlags(): Map<string, FeatureFlag> {
    return new Map(this.featureFlags);
  }

  /**
   * Get degradation dashboard data
   */
  getDegradationDashboard(): {
    services: Array<ServiceStatus>;
    activeDegradations: Array<{ rule: DegradationRule; startTime: Date; duration: number }>;
    featureFlags: Array<FeatureFlag>;
    degradationRules: Array<DegradationRule>;
  } {
    const services = Array.from(this.services.values());
    
    const activeDegradations = Array.from(this.activeDegradations.values()).map(degradation => ({
      ...degradation,
      duration: Date.now() - degradation.startTime.getTime()
    }));

    const featureFlags = Array.from(this.featureFlags.values());
    const degradationRules = Array.from(this.degradationRules.values());

    return {
      services,
      activeDegradations,
      featureFlags,
      degradationRules
    };
  }

  /**
   * Start monitoring services
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);

    logger.info('Service degradation monitoring started');
  }

  /**
   * Stop monitoring services
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    logger.info('Service degradation monitoring stopped');
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    for (const [serviceName, dependency] of this.dependencies) {
      try {
        const startTime = Date.now();
        
        // This would typically make actual health check calls
        // For now, we'll simulate the health check
        const isHealthy = await this.simulateHealthCheck(serviceName);
        
        const responseTime = Date.now() - startTime;
        
        this.updateServiceStatus(serviceName, {
          status: isHealthy ? 'available' : 'unavailable',
          responseTime,
          errorRate: isHealthy ? 0 : 100
        });
        
      } catch (error) {
        logger.error(`Health check failed for ${serviceName}:`, error);
        this.updateServiceStatus(serviceName, {
          status: 'unavailable',
          responseTime: dependency.timeout,
          errorRate: 100
        });
      }
    }
  }

  /**
   * Simulate health check (replace with actual implementation)
   */
  private async simulateHealthCheck(serviceName: string): Promise<boolean> {
    // This is a placeholder - in real implementation, you would:
    // - Make HTTP requests to health check endpoints
    // - Check database connectivity
    // - Verify Redis connection
    // - Test file system access
    // etc.
    
    return Math.random() > 0.1; // 90% success rate for simulation
  }

  /**
   * Manually trigger degradation rule
   */
  triggerDegradation(ruleId: string): boolean {
    const rule = this.degradationRules.get(ruleId);
    if (!rule) {
      logger.error(`Degradation rule not found: ${ruleId}`);
      return false;
    }

    if (this.activeDegradations.has(ruleId)) {
      logger.warn(`Degradation rule already active: ${ruleId}`);
      return false;
    }

    this.activateDegradation(rule);
    return true;
  }

  /**
   * Manually deactivate degradation rule
   */
  deactivateDegradationRule(ruleId: string): boolean {
    if (!this.activeDegradations.has(ruleId)) {
      logger.warn(`Degradation rule not active: ${ruleId}`);
      return false;
    }

    this.deactivateDegradation(ruleId);
    return true;
  }

  /**
   * Shutdown the service degradation manager
   */
  shutdown(): void {
    this.stopMonitoring();
    
    // Deactivate all degradations
    for (const ruleId of this.activeDegradations.keys()) {
      this.deactivateDegradation(ruleId);
    }
    
    this.services.clear();
    this.dependencies.clear();
    this.degradationRules.clear();
    this.featureFlags.clear();
    this.activeDegradations.clear();
    this.removeAllListeners();
    
    logger.info('Service degradation manager shutdown complete');
  }
}

// Export singleton instance
export const serviceDegradationManager = ServiceDegradationManager.getInstance();