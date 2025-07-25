import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { errorRecoveryService } from './ErrorRecoveryService';
import { serviceDegradationManager } from './ServiceDegradationManager';
import { databaseManager } from '@/config/DatabaseManager';
import { redisManager } from '@/config/RedisManager';

export interface HealingRule {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'error_pattern' | 'performance_degradation' | 'resource_exhaustion' | 'service_failure';
    pattern?: string | RegExp;
    threshold?: number;
    timeWindow?: number; // milliseconds
  };
  diagnosis: {
    checks: DiagnosticCheck[];
    timeout: number;
  };
  healing: {
    actions: HealingAction[];
    maxAttempts: number;
    cooldownPeriod: number; // milliseconds
  };
  enabled: boolean;
  priority: number;
}

export interface DiagnosticCheck {
  name: string;
  type: 'database_connection' | 'redis_connection' | 'memory_usage' | 'disk_space' | 'cpu_usage' | 'custom';
  execute: () => Promise<DiagnosticResult>;
  timeout: number;
}

export interface DiagnosticResult {
  passed: boolean;
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations?: string[];
}

export interface HealingAction {
  name: string;
  type: 'restart_service' | 'clear_cache' | 'garbage_collect' | 'reconnect_database' | 'reconnect_redis' | 'custom';
  execute: () => Promise<HealingResult>;
  rollback?: () => Promise<void>;
  timeout: number;
  retryable: boolean;
}

export interface HealingResult {
  success: boolean;
  message: string;
  details?: any;
  requiresManualIntervention?: boolean;
}

export interface HealingAttempt {
  id: string;
  ruleId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'success' | 'failed' | 'partial';
  diagnostics: Array<{ check: string; result: DiagnosticResult }>;
  actions: Array<{ action: string; result: HealingResult }>;
  error?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical' | 'healing';
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    memory: ComponentHealth;
    cpu: ComponentHealth;
    disk: ComponentHealth;
  };
  activeHealing: HealingAttempt[];
  lastHealingAttempt?: Date;
  healingHistory: HealingAttempt[];
}

export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical';
  metrics: Record<string, number>;
  lastCheck: Date;
  issues: string[];
}

/**
 * Self-Healing Service for automatic system recovery
 */
export class SelfHealingService extends EventEmitter {
  private static instance: SelfHealingService;
  private healingRules = new Map<string, HealingRule>();
  private activeHealing = new Map<string, HealingAttempt>();
  private healingHistory: HealingAttempt[] = [];
  private cooldownTimers = new Map<string, NodeJS.Timeout>();
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private errorPatterns = new Map<string, { count: number; firstSeen: Date; lastSeen: Date }>();
  private readonly maxHistorySize = 1000;

  private constructor() {
    super();
    this.initializeDefaultRules();
    this.setupErrorPatternTracking();
  }

  public static getInstance(): SelfHealingService {
    if (!SelfHealingService.instance) {
      SelfHealingService.instance = new SelfHealingService();
    }
    return SelfHealingService.instance;
  }

  /**
   * Initialize default healing rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: HealingRule[] = [
      {
        id: 'database_connection_failure',
        name: 'Database Connection Failure',
        description: 'Automatically reconnect when database connection is lost',
        trigger: {
          type: 'error_pattern',
          pattern: /database.*connection.*failed|connection.*terminated|connection.*refused/i,
          threshold: 3,
          timeWindow: 60000 // 1 minute
        },
        diagnosis: {
          checks: [
            {
              name: 'database_connectivity',
              type: 'database_connection',
              execute: async () => {
                try {
                  const isConnected = await databaseManager.testConnection();
                  return {
                    passed: isConnected,
                    message: isConnected ? 'Database connection is healthy' : 'Database connection failed',
                    severity: isConnected ? 'low' : 'critical' as const,
                    recommendations: isConnected ? [] : ['Check database server status', 'Verify connection parameters']
                  };
                } catch (error) {
                  return {
                    passed: false,
                    message: `Database check failed: ${(error as Error).message}`,
                    severity: 'critical' as const,
                    recommendations: ['Check database server status', 'Verify network connectivity']
                  };
                }
              },
              timeout: 10000
            }
          ],
          timeout: 15000
        },
        healing: {
          actions: [
            {
              name: 'reconnect_database',
              type: 'reconnect_database',
              execute: async () => {
                try {
                  await databaseManager.reconnect();
                  return {
                    success: true,
                    message: 'Database reconnection successful'
                  };
                } catch (error) {
                  return {
                    success: false,
                    message: `Database reconnection failed: ${(error as Error).message}`,
                    requiresManualIntervention: true
                  };
                }
              },
              timeout: 30000,
              retryable: true
            }
          ],
          maxAttempts: 3,
          cooldownPeriod: 300000 // 5 minutes
        },
        enabled: true,
        priority: 1
      },
      {
        id: 'redis_connection_failure',
        name: 'Redis Connection Failure',
        description: 'Automatically reconnect when Redis connection is lost',
        trigger: {
          type: 'error_pattern',
          pattern: /redis.*connection.*failed|redis.*connection.*lost|redis.*timeout/i,
          threshold: 2,
          timeWindow: 60000
        },
        diagnosis: {
          checks: [
            {
              name: 'redis_connectivity',
              type: 'redis_connection',
              execute: async () => {
                try {
                  const health = await redisManager.healthCheck();
                  return {
                    passed: health.status === 'healthy',
                    message: health.message,
                    severity: health.status === 'healthy' ? 'low' : 'high' as const,
                    details: health,
                    recommendations: health.status === 'healthy' ? [] : ['Check Redis server status', 'Verify Redis configuration']
                  };
                } catch (error) {
                  return {
                    passed: false,
                    message: `Redis check failed: ${(error as Error).message}`,
                    severity: 'high' as const,
                    recommendations: ['Check Redis server status', 'Verify network connectivity']
                  };
                }
              },
              timeout: 5000
            }
          ],
          timeout: 10000
        },
        healing: {
          actions: [
            {
              name: 'reconnect_redis',
              type: 'reconnect_redis',
              execute: async () => {
                try {
                  await redisManager.reconnect();
                  return {
                    success: true,
                    message: 'Redis reconnection successful'
                  };
                } catch (error) {
                  return {
                    success: false,
                    message: `Redis reconnection failed: ${(error as Error).message}`
                  };
                }
              },
              timeout: 15000,
              retryable: true
            }
          ],
          maxAttempts: 2,
          cooldownPeriod: 180000 // 3 minutes
        },
        enabled: true,
        priority: 2
      },
      {
        id: 'memory_exhaustion',
        name: 'Memory Exhaustion',
        description: 'Automatically trigger garbage collection when memory usage is high',
        trigger: {
          type: 'resource_exhaustion',
          threshold: 85, // 85% memory usage
          timeWindow: 120000 // 2 minutes
        },
        diagnosis: {
          checks: [
            {
              name: 'memory_usage',
              type: 'memory_usage',
              execute: async () => {
                const memUsage = process.memoryUsage();
                const totalMem = require('os').totalmem();
                const usedPercent = (memUsage.rss / totalMem) * 100;
                
                return {
                  passed: usedPercent < 90,
                  message: `Memory usage: ${usedPercent.toFixed(2)}%`,
                  severity: usedPercent > 95 ? 'critical' : usedPercent > 85 ? 'high' : 'medium' as const,
                  details: { memUsage, totalMem, usedPercent },
                  recommendations: usedPercent > 85 ? ['Trigger garbage collection', 'Review memory leaks'] : []
                };
              },
              timeout: 1000
            }
          ],
          timeout: 5000
        },
        healing: {
          actions: [
            {
              name: 'garbage_collect',
              type: 'garbage_collect',
              execute: async () => {
                try {
                  if (global.gc) {
                    const beforeMem = process.memoryUsage();
                    global.gc();
                    const afterMem = process.memoryUsage();
                    
                    const freedMB = (beforeMem.heapUsed - afterMem.heapUsed) / (1024 * 1024);
                    
                    return {
                      success: true,
                      message: `Garbage collection completed, freed ${freedMB.toFixed(2)}MB`,
                      details: { beforeMem, afterMem, freedMB }
                    };
                  } else {
                    return {
                      success: false,
                      message: 'Garbage collection not available (--expose-gc flag required)'
                    };
                  }
                } catch (error) {
                  return {
                    success: false,
                    message: `Garbage collection failed: ${(error as Error).message}`
                  };
                }
              },
              timeout: 10000,
              retryable: false
            }
          ],
          maxAttempts: 1,
          cooldownPeriod: 600000 // 10 minutes
        },
        enabled: true,
        priority: 3
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Automatically enable circuit breakers when error rate is high',
        trigger: {
          type: 'performance_degradation',
          threshold: 10, // 10% error rate
          timeWindow: 300000 // 5 minutes
        },
        diagnosis: {
          checks: [
            {
              name: 'error_rate_analysis',
              type: 'custom',
              execute: async () => {
                // This would analyze actual error metrics
                const errorRate = this.calculateRecentErrorRate();
                
                return {
                  passed: errorRate < 5,
                  message: `Current error rate: ${errorRate.toFixed(2)}%`,
                  severity: errorRate > 15 ? 'critical' : errorRate > 10 ? 'high' : 'medium' as const,
                  details: { errorRate },
                  recommendations: errorRate > 10 ? ['Enable circuit breakers', 'Review recent errors'] : []
                };
              },
              timeout: 5000
            }
          ],
          timeout: 10000
        },
        healing: {
          actions: [
            {
              name: 'enable_circuit_breakers',
              type: 'custom',
              execute: async () => {
                try {
                  // Enable circuit breakers for critical services
                  const services = ['database', 'redis', 'external_api'];
                  
                  for (const service of services) {
                    const circuitBreaker = errorRecoveryService.getCircuitBreaker(service, {
                      failureThreshold: 3,
                      resetTimeout: 60000
                    });
                    // Circuit breaker is now available for the service
                  }
                  
                  return {
                    success: true,
                    message: 'Circuit breakers enabled for critical services'
                  };
                } catch (error) {
                  return {
                    success: false,
                    message: `Failed to enable circuit breakers: ${(error as Error).message}`
                  };
                }
              },
              timeout: 5000,
              retryable: false
            }
          ],
          maxAttempts: 1,
          cooldownPeriod: 900000 // 15 minutes
        },
        enabled: true,
        priority: 4
      }
    ];

    defaultRules.forEach(rule => {
      this.healingRules.set(rule.id, rule);
    });

    logger.info(`Initialized ${defaultRules.length} default healing rules`);
  }

  /**
   * Setup error pattern tracking
   */
  private setupErrorPatternTracking(): void {
    // Listen to error events from the error recovery service
    errorRecoveryService.on('circuitBreakerOpened', (event) => {
      this.trackErrorPattern(`circuit_breaker_opened_${event.service}`, event);
    });

    // Listen to service degradation events
    serviceDegradationManager.on('degradationActivated', (event) => {
      this.trackErrorPattern(`degradation_activated_${event.rule.id}`, event);
    });
  }

  /**
   * Track error patterns for healing triggers
   */
  private trackErrorPattern(pattern: string, details?: any): void {
    const now = new Date();
    const existing = this.errorPatterns.get(pattern);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = now;
    } else {
      this.errorPatterns.set(pattern, {
        count: 1,
        firstSeen: now,
        lastSeen: now
      });
    }

    // Check if any healing rules should be triggered
    this.evaluateHealingTriggers(pattern, details);
  }

  /**
   * Evaluate healing triggers based on error patterns
   */
  private evaluateHealingTriggers(pattern: string, details?: any): void {
    for (const rule of this.healingRules.values()) {
      if (!rule.enabled || this.isRuleInCooldown(rule.id)) {
        continue;
      }

      if (this.shouldTriggerHealing(rule, pattern, details)) {
        this.triggerHealing(rule, `Error pattern detected: ${pattern}`);
      }
    }
  }

  /**
   * Check if a healing rule should be triggered
   */
  private shouldTriggerHealing(rule: HealingRule, pattern: string, details?: any): boolean {
    const trigger = rule.trigger;
    
    switch (trigger.type) {
      case 'error_pattern':
        if (trigger.pattern) {
          const regex = trigger.pattern instanceof RegExp ? trigger.pattern : new RegExp(trigger.pattern, 'i');
          if (regex.test(pattern)) {
            const patternData = this.errorPatterns.get(pattern);
            if (patternData && trigger.threshold) {
              const timeWindow = trigger.timeWindow || 300000; // 5 minutes default
              const withinWindow = (Date.now() - patternData.firstSeen.getTime()) <= timeWindow;
              return withinWindow && patternData.count >= trigger.threshold;
            }
          }
        }
        break;
      
      case 'service_failure':
        // This would be triggered by service monitoring
        return false; // Placeholder
      
      case 'performance_degradation':
        // This would be triggered by performance monitoring
        return false; // Placeholder
      
      case 'resource_exhaustion':
        // This would be triggered by resource monitoring
        return false; // Placeholder
    }
    
    return false;
  }

  /**
   * Check if a rule is in cooldown period
   */
  private isRuleInCooldown(ruleId: string): boolean {
    return this.cooldownTimers.has(ruleId);
  }

  /**
   * Trigger healing process for a rule
   */
  async triggerHealing(rule: HealingRule, reason: string): Promise<string> {
    if (this.activeHealing.has(rule.id)) {
      logger.warn(`Healing already in progress for rule: ${rule.name}`);
      return 'already_in_progress';
    }

    const attemptId = `healing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const attempt: HealingAttempt = {
      id: attemptId,
      ruleId: rule.id,
      startTime: new Date(),
      status: 'running',
      diagnostics: [],
      actions: []
    };

    this.activeHealing.set(rule.id, attempt);
    logger.info(`Starting healing process: ${rule.name} (${reason})`);
    this.emit('healingStarted', { rule, attempt, reason });

    try {
      // Run diagnostics
      const diagnosticsPassed = await this.runDiagnostics(rule, attempt);
      
      if (!diagnosticsPassed) {
        attempt.status = 'failed';
        attempt.error = 'Diagnostics failed';
        logger.warn(`Healing diagnostics failed for rule: ${rule.name}`);
      } else {
        // Execute healing actions
        const healingSuccess = await this.executeHealingActions(rule, attempt);
        attempt.status = healingSuccess ? 'success' : 'failed';
      }

    } catch (error) {
      attempt.status = 'failed';
      attempt.error = (error as Error).message;
      logger.error(`Healing process error for rule ${rule.name}:`, error);
    } finally {
      attempt.endTime = new Date();
      this.activeHealing.delete(rule.id);
      
      // Add to history
      this.healingHistory.push(attempt);
      if (this.healingHistory.length > this.maxHistorySize) {
        this.healingHistory.shift();
      }
      
      // Set cooldown
      this.setCooldown(rule);
      
      logger.info(`Healing process completed: ${rule.name} (${attempt.status})`);
      this.emit('healingCompleted', { rule, attempt });
    }

    return attemptId;
  }

  /**
   * Run diagnostic checks
   */
  private async runDiagnostics(rule: HealingRule, attempt: HealingAttempt): Promise<boolean> {
    logger.info(`Running diagnostics for rule: ${rule.name}`);
    
    let allPassed = true;
    
    for (const check of rule.diagnosis.checks) {
      try {
        logger.debug(`Running diagnostic check: ${check.name}`);
        
        const result = await Promise.race([
          check.execute(),
          new Promise<DiagnosticResult>((_, reject) => 
            setTimeout(() => reject(new Error('Diagnostic timeout')), check.timeout)
          )
        ]);
        
        attempt.diagnostics.push({ check: check.name, result });
        
        if (!result.passed) {
          allPassed = false;
          logger.warn(`Diagnostic check failed: ${check.name} - ${result.message}`);
        } else {
          logger.debug(`Diagnostic check passed: ${check.name} - ${result.message}`);
        }
        
      } catch (error) {
        const failedResult: DiagnosticResult = {
          passed: false,
          message: `Diagnostic check error: ${(error as Error).message}`,
          severity: 'critical'
        };
        
        attempt.diagnostics.push({ check: check.name, result: failedResult });
        allPassed = false;
        logger.error(`Diagnostic check error: ${check.name}:`, error);
      }
    }
    
    return allPassed;
  }

  /**
   * Execute healing actions
   */
  private async executeHealingActions(rule: HealingRule, attempt: HealingAttempt): Promise<boolean> {
    logger.info(`Executing healing actions for rule: ${rule.name}`);
    
    let overallSuccess = true;
    
    for (const action of rule.healing.actions) {
      let actionSuccess = false;
      let attempts = 0;
      
      while (attempts < rule.healing.maxAttempts && !actionSuccess) {
        attempts++;
        
        try {
          logger.debug(`Executing healing action: ${action.name} (attempt ${attempts})`);
          
          const result = await Promise.race([
            action.execute(),
            new Promise<HealingResult>((_, reject) => 
              setTimeout(() => reject(new Error('Action timeout')), action.timeout)
            )
          ]);
          
          attempt.actions.push({ action: action.name, result });
          actionSuccess = result.success;
          
          if (result.success) {
            logger.info(`Healing action successful: ${action.name} - ${result.message}`);
          } else {
            logger.warn(`Healing action failed: ${action.name} - ${result.message}`);
            
            if (!action.retryable || attempts >= rule.healing.maxAttempts) {
              break;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
          
        } catch (error) {
          const failedResult: HealingResult = {
            success: false,
            message: `Action error: ${(error as Error).message}`
          };
          
          attempt.actions.push({ action: action.name, result: failedResult });
          logger.error(`Healing action error: ${action.name}:`, error);
          
          if (!action.retryable || attempts >= rule.healing.maxAttempts) {
            break;
          }
        }
      }
      
      if (!actionSuccess) {
        overallSuccess = false;
        
        // Execute rollback if available
        if (action.rollback) {
          try {
            logger.info(`Executing rollback for action: ${action.name}`);
            await action.rollback();
          } catch (rollbackError) {
            logger.error(`Rollback failed for action ${action.name}:`, rollbackError);
          }
        }
      }
    }
    
    return overallSuccess;
  }

  /**
   * Set cooldown period for a rule
   */
  private setCooldown(rule: HealingRule): void {
    if (this.cooldownTimers.has(rule.id)) {
      clearTimeout(this.cooldownTimers.get(rule.id)!);
    }
    
    const timer = setTimeout(() => {
      this.cooldownTimers.delete(rule.id);
      logger.debug(`Cooldown period ended for rule: ${rule.name}`);
    }, rule.healing.cooldownPeriod);
    
    this.cooldownTimers.set(rule.id, timer);
    logger.debug(`Cooldown period set for rule: ${rule.name} (${rule.healing.cooldownPeriod}ms)`);
  }

  /**
   * Calculate recent error rate (placeholder implementation)
   */
  private calculateRecentErrorRate(): number {
    // This would calculate actual error rate from metrics
    // For now, return a simulated value
    return Math.random() * 20; // 0-20% error rate
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const components = {
      database: await this.checkDatabaseHealth(),
      redis: await this.checkRedisHealth(),
      memory: await this.checkMemoryHealth(),
      cpu: await this.checkCpuHealth(),
      disk: await this.checkDiskHealth()
    };

    const componentStatuses = Object.values(components).map(c => c.status);
    let overall: SystemHealth['overall'] = 'healthy';
    
    if (this.activeHealing.size > 0) {
      overall = 'healing';
    } else if (componentStatuses.includes('critical')) {
      overall = 'critical';
    } else if (componentStatuses.includes('warning')) {
      overall = 'degraded';
    }

    return {
      overall,
      components,
      activeHealing: Array.from(this.activeHealing.values()),
      lastHealingAttempt: this.healingHistory.length > 0 ? 
        this.healingHistory[this.healingHistory.length - 1].startTime : undefined,
      healingHistory: this.healingHistory.slice(-10) // Last 10 attempts
    };
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      const healthResult = await databaseManager.performHealthCheck();
      
      return {
        status: healthResult.status === 'healthy' ? 'healthy' : 
                healthResult.status === 'degraded' ? 'warning' : 'critical',
        metrics: {
          responseTime: healthResult.responseTime
        },
        lastCheck: new Date(),
        issues: healthResult.details.error ? [healthResult.details.error] : []
      };
    } catch (error) {
      return {
        status: 'critical',
        metrics: {},
        lastCheck: new Date(),
        issues: [`Database health check failed: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<ComponentHealth> {
    try {
      const health = await redisManager.healthCheck();
      
      return {
        status: health.status === 'healthy' ? 'healthy' : 
                health.status === 'degraded' ? 'warning' : 'critical',
        metrics: {
          responseTime: health.responseTime || 0,
          memoryUsage: health.memoryUsage || 0
        },
        lastCheck: new Date(),
        issues: health.status !== 'healthy' ? [health.message] : []
      };
    } catch (error) {
      return {
        status: 'critical',
        metrics: {},
        lastCheck: new Date(),
        issues: [`Redis health check failed: ${(error as Error).message}`]
      };
    }
  }

  /**
   * Check memory health
   */
  private async checkMemoryHealth(): Promise<ComponentHealth> {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const usedPercent = (memUsage.rss / totalMem) * 100;
    
    let status: ComponentHealth['status'] = 'healthy';
    const issues: string[] = [];
    
    if (usedPercent > 95) {
      status = 'critical';
      issues.push('Memory usage critically high');
    } else if (usedPercent > 85) {
      status = 'warning';
      issues.push('Memory usage high');
    }
    
    return {
      status,
      metrics: {
        heapUsed: memUsage.heapUsed / (1024 * 1024),
        heapTotal: memUsage.heapTotal / (1024 * 1024),
        rss: memUsage.rss / (1024 * 1024),
        external: memUsage.external / (1024 * 1024),
        usedPercent
      },
      lastCheck: new Date(),
      issues
    };
  }

  /**
   * Check CPU health
   */
  private async checkCpuHealth(): Promise<ComponentHealth> {
    // This is a simplified implementation
    const cpuUsage = process.cpuUsage();
    const loadAvg = require('os').loadavg();
    
    let status: ComponentHealth['status'] = 'healthy';
    const issues: string[] = [];
    
    if (loadAvg[0] > 4) {
      status = 'critical';
      issues.push('CPU load critically high');
    } else if (loadAvg[0] > 2) {
      status = 'warning';
      issues.push('CPU load high');
    }
    
    return {
      status,
      metrics: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        loadAvg1: loadAvg[0],
        loadAvg5: loadAvg[1],
        loadAvg15: loadAvg[2]
      },
      lastCheck: new Date(),
      issues
    };
  }

  /**
   * Check disk health
   */
  private async checkDiskHealth(): Promise<ComponentHealth> {
    // This is a simplified implementation
    // In a real implementation, you would check actual disk usage
    
    return {
      status: 'healthy',
      metrics: {
        usedPercent: 50 // Placeholder
      },
      lastCheck: new Date(),
      issues: []
    };
  }

  /**
   * Get healing rules
   */
  getHealingRules(): Map<string, HealingRule> {
    return new Map(this.healingRules);
  }

  /**
   * Get active healing attempts
   */
  getActiveHealing(): Map<string, HealingAttempt> {
    return new Map(this.activeHealing);
  }

  /**
   * Get healing history
   */
  getHealingHistory(limit: number = 50): HealingAttempt[] {
    return this.healingHistory
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Manually trigger healing for a rule
   */
  async manualHeal(ruleId: string, reason: string = 'Manual trigger'): Promise<string> {
    const rule = this.healingRules.get(ruleId);
    if (!rule) {
      throw new Error(`Healing rule not found: ${ruleId}`);
    }
    
    return this.triggerHealing(rule, reason);
  }

  /**
   * Start monitoring for automatic healing
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      await this.performSystemHealthCheck();
    }, intervalMs);

    logger.info('Self-healing monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    logger.info('Self-healing monitoring stopped');
  }

  /**
   * Perform system health check and trigger healing if needed
   */
  private async performSystemHealthCheck(): Promise<void> {
    try {
      const health = await this.getSystemHealth();
      
      // Check for resource exhaustion
      if (health.components.memory.status === 'critical') {
        this.trackErrorPattern('memory_exhaustion', health.components.memory);
      }
      
      if (health.components.cpu.status === 'critical') {
        this.trackErrorPattern('cpu_exhaustion', health.components.cpu);
      }
      
      // Check for service failures
      if (health.components.database.status === 'critical') {
        this.trackErrorPattern('database_failure', health.components.database);
      }
      
      if (health.components.redis.status === 'critical') {
        this.trackErrorPattern('redis_failure', health.components.redis);
      }
      
    } catch (error) {
      logger.error('System health check failed:', error);
    }
  }

  /**
   * Shutdown the self-healing service
   */
  shutdown(): void {
    this.stopMonitoring();
    
    // Clear all cooldown timers
    for (const timer of this.cooldownTimers.values()) {
      clearTimeout(timer);
    }
    this.cooldownTimers.clear();
    
    // Clear data
    this.healingRules.clear();
    this.activeHealing.clear();
    this.errorPatterns.clear();
    this.removeAllListeners();
    
    logger.info('Self-healing service shutdown complete');
  }
}

// Export singleton instance
export const selfHealingService = SelfHealingService.getInstance();