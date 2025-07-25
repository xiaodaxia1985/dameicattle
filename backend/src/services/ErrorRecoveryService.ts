import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { databaseManager } from '@/config/DatabaseManager';
import { redisManager } from '@/config/RedisManager';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialBase: number;
  jitter: boolean;
}

export interface RecoveryAction {
  id: string;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  autoExecute: boolean;
  execute: () => Promise<boolean>;
  rollback?: () => Promise<void>;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'recovering';
  lastCheck: Date;
  consecutiveFailures: number;
  totalFailures: number;
  uptime: number;
  responseTime: number;
  errorRate: number;
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Circuit Breaker implementation for external service calls
 */
export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: Date;
  private nextAttemptTime?: Date;
  private halfOpenCallCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private readonly config: CircuitBreakerConfig;
  private readonly serviceName: string;

  constructor(serviceName: string, config: Partial<CircuitBreakerConfig> = {}) {
    super();
    this.serviceName = serviceName;
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      halfOpenMaxCalls: 3,
      ...config
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenCallCount = 0;
        logger.info(`Circuit breaker ${this.serviceName} transitioning to HALF_OPEN`);
        this.emit('stateChange', { service: this.serviceName, state: this.state });
      } else {
        const error = new Error(`Circuit breaker ${this.serviceName} is OPEN`);
        (error as any).circuitBreakerOpen = true;
        throw error;
      }
    }

    if (this.state === CircuitState.HALF_OPEN && this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
      const error = new Error(`Circuit breaker ${this.serviceName} HALF_OPEN call limit exceeded`);
      (error as any).circuitBreakerOpen = true;
      throw error;
    }

    this.totalCalls++;
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCallCount++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successCount++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        this.reset();
        logger.info(`Circuit breaker ${this.serviceName} reset to CLOSED after successful recovery`);
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === CircuitState.HALF_OPEN) {
      this.open();
      logger.warn(`Circuit breaker ${this.serviceName} failed during HALF_OPEN, returning to OPEN`);
    } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.config.failureThreshold) {
      this.open();
      logger.warn(`Circuit breaker ${this.serviceName} opened due to ${this.failureCount} failures`);
    }
  }

  /**
   * Open the circuit breaker
   */
  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeout);
    this.emit('stateChange', { service: this.serviceName, state: this.state });
    this.emit('circuitOpened', { service: this.serviceName, failureCount: this.failureCount });
  }

  /**
   * Reset the circuit breaker to closed state
   */
  private reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.halfOpenCallCount = 0;
    this.nextAttemptTime = undefined;
    this.emit('stateChange', { service: this.serviceName, state: this.state });
    this.emit('circuitClosed', { service: this.serviceName });
  }

  /**
   * Check if we should attempt to reset the circuit breaker
   */
  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? Date.now() >= this.nextAttemptTime.getTime() : false;
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    totalCalls: number;
    lastFailureTime?: Date;
    nextAttemptTime?: Date;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Force reset the circuit breaker (for manual recovery)
   */
  forceReset(): void {
    logger.info(`Manually resetting circuit breaker ${this.serviceName}`);
    this.reset();
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export class RetryManager {
  private readonly config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      exponentialBase: 2,
      jitter: true,
      ...config
    };
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    isRetriableError: (error: Error) => boolean = () => true,
    context?: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(`Retry attempt ${attempt}/${this.config.maxRetries}${context ? ` for ${context}` : ''}`);
        }
        
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.maxRetries) {
          logger.error(`All retry attempts exhausted${context ? ` for ${context}` : ''}:`, error);
          break;
        }
        
        if (!isRetriableError(lastError)) {
          logger.info(`Non-retriable error encountered${context ? ` for ${context}` : ''}:`, error);
          break;
        }
        
        const delay = this.calculateDelay(attempt);
        logger.warn(`Operation failed${context ? ` for ${context}` : ''}, retrying in ${delay}ms:`, error);
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(this.config.exponentialBase, attempt);
    const delay = Math.min(exponentialDelay, this.config.maxDelay);
    
    if (this.config.jitter) {
      // Add random jitter (±25%)
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      return Math.max(0, delay + jitter);
    }
    
    return delay;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main Error Recovery Service
 */
export class ErrorRecoveryService extends EventEmitter {
  private static instance: ErrorRecoveryService;
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private retryManager: RetryManager;
  private serviceHealthMap = new Map<string, ServiceHealth>();
  private recoveryActions = new Map<string, RecoveryAction>();
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;
  private recoveryInProgress = new Set<string>();

  private constructor() {
    super();
    this.retryManager = new RetryManager();
    this.initializeDefaultRecoveryActions();
  }

  public static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
    }
    return ErrorRecoveryService.instance;
  }

  /**
   * Initialize default recovery actions
   */
  private initializeDefaultRecoveryActions(): void {
    // Database recovery action
    this.addRecoveryAction({
      id: 'database_reconnect',
      name: 'Database Reconnection',
      description: 'Attempt to reconnect to the database',
      priority: 'critical',
      autoExecute: true,
      execute: async () => {
        try {
          await databaseManager.reconnect();
          logger.info('Database reconnection successful');
          return true;
        } catch (error) {
          logger.error('Database reconnection failed:', error);
          return false;
        }
      }
    });

    // Redis recovery action
    this.addRecoveryAction({
      id: 'redis_reconnect',
      name: 'Redis Reconnection',
      description: 'Attempt to reconnect to Redis',
      priority: 'high',
      autoExecute: true,
      execute: async () => {
        try {
          await redisManager.reconnect();
          logger.info('Redis reconnection successful');
          return true;
        } catch (error) {
          logger.error('Redis reconnection failed:', error);
          return false;
        }
      }
    });

    // Memory cleanup action
    this.addRecoveryAction({
      id: 'memory_cleanup',
      name: 'Memory Cleanup',
      description: 'Force garbage collection and memory cleanup',
      priority: 'medium',
      autoExecute: false,
      execute: async () => {
        try {
          if (global.gc) {
            global.gc();
            logger.info('Manual garbage collection executed');
          }
          return true;
        } catch (error) {
          logger.error('Memory cleanup failed:', error);
          return false;
        }
      }
    });

    // Service restart action
    this.addRecoveryAction({
      id: 'service_restart',
      name: 'Service Restart',
      description: 'Restart critical services',
      priority: 'critical',
      autoExecute: false,
      execute: async () => {
        try {
          // This would typically restart the service
          // For now, we'll just log the action
          logger.warn('Service restart action triggered (manual intervention required)');
          return false; // Requires manual intervention
        } catch (error) {
          logger.error('Service restart failed:', error);
          return false;
        }
      }
    });
  }

  /**
   * Get or create circuit breaker for a service
   */
  getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      const circuitBreaker = new CircuitBreaker(serviceName, config);
      
      // Set up event listeners
      circuitBreaker.on('stateChange', (event) => {
        this.emit('circuitBreakerStateChange', event);
        this.updateServiceHealth(serviceName);
      });
      
      circuitBreaker.on('circuitOpened', (event) => {
        this.emit('circuitBreakerOpened', event);
        this.triggerRecoveryActions(serviceName, 'circuit_breaker_opened');
      });
      
      this.circuitBreakers.set(serviceName, circuitBreaker);
    }
    
    return this.circuitBreakers.get(serviceName)!;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(serviceName, config);
    return circuitBreaker.execute(operation);
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>,
    isRetriableError?: (error: Error) => boolean,
    context?: string
  ): Promise<T> {
    const retryManager = retryConfig ? new RetryManager(retryConfig) : this.retryManager;
    return retryManager.executeWithRetry(operation, isRetriableError, context);
  }

  /**
   * Execute operation with both circuit breaker and retry protection
   */
  async executeWithFullProtection<T>(
    serviceName: string,
    operation: () => Promise<T>,
    options: {
      circuitBreakerConfig?: Partial<CircuitBreakerConfig>;
      retryConfig?: Partial<RetryConfig>;
      isRetriableError?: (error: Error) => boolean;
      fallback?: () => Promise<T>;
    } = {}
  ): Promise<T> {
    try {
      return await this.executeWithCircuitBreaker(
        serviceName,
        () => this.executeWithRetry(
          operation,
          options.retryConfig,
          options.isRetriableError,
          serviceName
        ),
        options.circuitBreakerConfig
      );
    } catch (error) {
      if (options.fallback && (error as any).circuitBreakerOpen) {
        logger.warn(`Circuit breaker open for ${serviceName}, executing fallback`);
        return options.fallback();
      }
      throw error;
    }
  }

  /**
   * Add recovery action
   */
  addRecoveryAction(action: RecoveryAction): void {
    this.recoveryActions.set(action.id, action);
    logger.info(`Recovery action added: ${action.name}`);
  }

  /**
   * Remove recovery action
   */
  removeRecoveryAction(actionId: string): boolean {
    const removed = this.recoveryActions.delete(actionId);
    if (removed) {
      logger.info(`Recovery action removed: ${actionId}`);
    }
    return removed;
  }

  /**
   * Execute recovery action
   */
  async executeRecoveryAction(actionId: string): Promise<boolean> {
    const action = this.recoveryActions.get(actionId);
    if (!action) {
      logger.error(`Recovery action not found: ${actionId}`);
      return false;
    }

    if (this.recoveryInProgress.has(actionId)) {
      logger.warn(`Recovery action already in progress: ${actionId}`);
      return false;
    }

    this.recoveryInProgress.add(actionId);
    
    try {
      logger.info(`Executing recovery action: ${action.name}`);
      const success = await action.execute();
      
      if (success) {
        logger.info(`Recovery action successful: ${action.name}`);
        this.emit('recoveryActionSuccess', { actionId, action });
      } else {
        logger.warn(`Recovery action failed: ${action.name}`);
        this.emit('recoveryActionFailed', { actionId, action });
      }
      
      return success;
    } catch (error) {
      logger.error(`Recovery action error: ${action.name}:`, error);
      this.emit('recoveryActionError', { actionId, action, error });
      return false;
    } finally {
      this.recoveryInProgress.delete(actionId);
    }
  }

  /**
   * Trigger recovery actions for a service
   */
  private async triggerRecoveryActions(serviceName: string, trigger: string): Promise<void> {
    logger.info(`Triggering recovery actions for ${serviceName} (trigger: ${trigger})`);
    
    const applicableActions = Array.from(this.recoveryActions.values())
      .filter(action => action.autoExecute)
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    for (const action of applicableActions) {
      try {
        const success = await this.executeRecoveryAction(action.id);
        if (success) {
          logger.info(`Auto-recovery successful for ${serviceName} using ${action.name}`);
          break; // Stop after first successful recovery
        }
      } catch (error) {
        logger.error(`Auto-recovery failed for ${serviceName} using ${action.name}:`, error);
      }
    }
  }

  /**
   * Update service health status
   */
  private updateServiceHealth(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) return;

    const status = circuitBreaker.getStatus();
    const existing = this.serviceHealthMap.get(serviceName);
    
    let healthStatus: ServiceHealth['status'] = 'healthy';
    if (status.state === CircuitState.OPEN) {
      healthStatus = 'unhealthy';
    } else if (status.state === CircuitState.HALF_OPEN) {
      healthStatus = 'recovering';
    } else if (status.failureCount > 0) {
      healthStatus = 'degraded';
    }

    const health: ServiceHealth = {
      name: serviceName,
      status: healthStatus,
      lastCheck: new Date(),
      consecutiveFailures: status.failureCount,
      totalFailures: existing?.totalFailures || 0 + status.failureCount,
      uptime: existing?.uptime || 0,
      responseTime: 0, // Would be calculated from actual metrics
      errorRate: status.totalCalls > 0 ? (status.failureCount / status.totalCalls) * 100 : 0
    };

    this.serviceHealthMap.set(serviceName, health);
    this.emit('serviceHealthUpdate', { serviceName, health });
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName?: string): ServiceHealth | Map<string, ServiceHealth> {
    if (serviceName) {
      return this.serviceHealthMap.get(serviceName) || {
        name: serviceName,
        status: 'healthy',
        lastCheck: new Date(),
        consecutiveFailures: 0,
        totalFailures: 0,
        uptime: 0,
        responseTime: 0,
        errorRate: 0
      };
    }
    return new Map(this.serviceHealthMap);
  }

  /**
   * Get all circuit breaker statuses
   */
  getCircuitBreakerStatuses(): Map<string, any> {
    const statuses = new Map();
    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      statuses.set(serviceName, circuitBreaker.getStatus());
    }
    return statuses;
  }

  /**
   * Get all recovery actions
   */
  getRecoveryActions(): Map<string, RecoveryAction> {
    return new Map(this.recoveryActions);
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

    logger.info('Error recovery monitoring started');
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
    logger.info('Error recovery monitoring stopped');
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    for (const serviceName of this.circuitBreakers.keys()) {
      this.updateServiceHealth(serviceName);
    }
  }

  /**
   * Get recovery dashboard data
   */
  getRecoveryDashboard(): {
    circuitBreakers: Array<{ service: string; status: any }>;
    serviceHealth: Array<ServiceHealth>;
    recoveryActions: Array<RecoveryAction & { inProgress: boolean }>;
    recentEvents: Array<any>;
  } {
    const circuitBreakers = Array.from(this.circuitBreakers.entries()).map(([service, cb]) => ({
      service,
      status: cb.getStatus()
    }));

    const serviceHealth = Array.from(this.serviceHealthMap.values());

    const recoveryActions = Array.from(this.recoveryActions.values()).map(action => ({
      ...action,
      inProgress: this.recoveryInProgress.has(action.id)
    }));

    return {
      circuitBreakers,
      serviceHealth,
      recoveryActions,
      recentEvents: [] // Would be populated with actual event history
    };
  }

  /**
   * Shutdown the error recovery service
   */
  shutdown(): void {
    this.stopMonitoring();
    this.circuitBreakers.clear();
    this.serviceHealthMap.clear();
    this.recoveryInProgress.clear();
    this.removeAllListeners();
    logger.info('Error recovery service shutdown complete');
  }
}

// Export singleton instance
export const errorRecoveryService = ErrorRecoveryService.getInstance();