import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { errorRecoveryService } from '@/services/ErrorRecoveryService';
import { serviceDegradationManager } from '@/services/ServiceDegradationManager';
import { selfHealingService } from '@/services/SelfHealingService';

export interface RecoveryContext {
  requestId: string;
  endpoint: string;
  method: string;
  userId?: string | number;
  startTime: number;
  retryCount: number;
  circuitBreakerUsed: boolean;
  fallbackUsed: boolean;
}

/**
 * Middleware for automatic error recovery and resilience
 */
export class ErrorRecoveryMiddleware {
  private static requestContexts = new Map<string, RecoveryContext>();

  /**
   * Initialize recovery context for request
   */
  static initializeContext() {
    return (req: Request, res: Response, next: NextFunction) => {
      const context: RecoveryContext = {
        requestId: req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        endpoint: req.path,
        method: req.method,
        userId: req.user?.id,
        startTime: Date.now(),
        retryCount: 0,
        circuitBreakerUsed: false,
        fallbackUsed: false
      };

      // Store context
      this.requestContexts.set(context.requestId, context);
      req.requestId = context.requestId;

      // Clean up context after response
      res.on('finish', () => {
        this.requestContexts.delete(context.requestId);
      });

      next();
    };
  }

  /**
   * Database operation wrapper with recovery
   */
  static wrapDatabaseOperation<T>(operation: () => Promise<T>, context?: string) {
    return async (): Promise<T> => {
      return errorRecoveryService.executeWithFullProtection(
        'database',
        operation,
        {
          circuitBreakerConfig: {
            failureThreshold: 5,
            resetTimeout: 60000,
            monitoringPeriod: 300000
          },
          retryConfig: {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            exponentialBase: 2,
            jitter: true
          },
          isRetriableError: (error: Error) => {
            // Retry on connection errors, timeouts, but not on validation errors
            const retriablePatterns = [
              /connection.*terminated/i,
              /connection.*refused/i,
              /connection.*timeout/i,
              /connection.*reset/i,
              /timeout/i,
              /ECONNRESET/i,
              /ECONNREFUSED/i,
              /ETIMEDOUT/i
            ];
            
            return retriablePatterns.some(pattern => pattern.test(error.message));
          },
          fallback: async () => {
            logger.warn(`Database fallback triggered for ${context || 'operation'}`);
            throw new Error('Database service temporarily unavailable');
          }
        }
      );
    };
  }

  /**
   * Redis operation wrapper with recovery
   */
  static wrapRedisOperation<T>(operation: () => Promise<T>, fallbackValue?: T) {
    return async (): Promise<T> => {
      return errorRecoveryService.executeWithFullProtection(
        'redis',
        operation,
        {
          circuitBreakerConfig: {
            failureThreshold: 3,
            resetTimeout: 30000,
            monitoringPeriod: 180000
          },
          retryConfig: {
            maxRetries: 2,
            baseDelay: 500,
            maxDelay: 5000,
            exponentialBase: 2,
            jitter: true
          },
          isRetriableError: (error: Error) => {
            const retriablePatterns = [
              /connection.*lost/i,
              /connection.*refused/i,
              /timeout/i,
              /ECONNRESET/i,
              /ECONNREFUSED/i
            ];
            
            return retriablePatterns.some(pattern => pattern.test(error.message));
          },
          fallback: async () => {
            if (fallbackValue !== undefined) {
              logger.info('Redis fallback value used');
              return fallbackValue;
            }
            logger.warn('Redis operation failed, no fallback available');
            throw new Error('Cache service temporarily unavailable');
          }
        }
      );
    };
  }

  /**
   * External API operation wrapper with recovery
   */
  static wrapExternalApiOperation<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ) {
    return async (): Promise<T> => {
      return errorRecoveryService.executeWithFullProtection(
        `external_api_${serviceName}`,
        operation,
        {
          circuitBreakerConfig: {
            failureThreshold: 5,
            resetTimeout: 120000,
            monitoringPeriod: 600000
          },
          retryConfig: {
            maxRetries: 3,
            baseDelay: 2000,
            maxDelay: 30000,
            exponentialBase: 2,
            jitter: true
          },
          isRetriableError: (error: Error) => {
            // Retry on network errors and 5xx status codes, but not on 4xx
            const retriablePatterns = [
              /network.*error/i,
              /timeout/i,
              /5\d\d/,
              /ECONNRESET/i,
              /ECONNREFUSED/i,
              /ETIMEDOUT/i
            ];
            
            return retriablePatterns.some(pattern => pattern.test(error.message));
          },
          fallback
        }
      );
    };
  }

  /**
   * File operation wrapper with recovery
   */
  static wrapFileOperation<T>(operation: () => Promise<T>, context?: string) {
    return async (): Promise<T> => {
      return errorRecoveryService.executeWithFullProtection(
        'file_system',
        operation,
        {
          circuitBreakerConfig: {
            failureThreshold: 3,
            resetTimeout: 60000,
            monitoringPeriod: 300000
          },
          retryConfig: {
            maxRetries: 2,
            baseDelay: 1000,
            maxDelay: 5000,
            exponentialBase: 2,
            jitter: false
          },
          isRetriableError: (error: Error) => {
            const retriablePatterns = [
              /EBUSY/i,
              /EMFILE/i,
              /ENFILE/i,
              /temporarily.*unavailable/i
            ];
            
            return retriablePatterns.some(pattern => pattern.test(error.message));
          },
          fallback: async () => {
            logger.warn(`File operation fallback triggered for ${context || 'operation'}`);
            throw new Error('File system temporarily unavailable');
          }
        }
      );
    };
  }

  /**
   * Feature flag check with degradation support
   */
  static checkFeatureFlag(featureName: string): boolean {
    return serviceDegradationManager.isFeatureEnabled(featureName);
  }

  /**
   * Get feature degradation level
   */
  static getFeatureDegradationLevel(featureName: string): number {
    return serviceDegradationManager.getFeatureDegradationLevel(featureName);
  }

  /**
   * Middleware for automatic request recovery
   */
  static requestRecovery() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const context = this.requestContexts.get(req.requestId || '');
      if (!context) {
        return next();
      }

      // Check if critical features are available
      const criticalFeatures = ['database', 'authentication'];
      const unavailableFeatures = criticalFeatures.filter(
        feature => !this.checkFeatureFlag(feature)
      );

      if (unavailableFeatures.length > 0) {
        logger.warn(`Critical features unavailable: ${unavailableFeatures.join(', ')}`);
        
        if (res.error) {
          return res.error(
            'Service temporarily unavailable due to system maintenance',
            503,
            'SERVICE_UNAVAILABLE'
          );
        } else {
          return res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable',
            code: 'SERVICE_UNAVAILABLE'
          });
        }
      }

      // Add recovery helpers to request
      (req as any).recovery = {
        wrapDatabaseOperation: (op: () => Promise<any>, ctx?: string) => 
          this.wrapDatabaseOperation(op, ctx),
        wrapRedisOperation: (op: () => Promise<any>, fallback?: any) => 
          this.wrapRedisOperation(op, fallback),
        wrapExternalApiOperation: (service: string, op: () => Promise<any>, fallback?: () => Promise<any>) => 
          this.wrapExternalApiOperation(service, op, fallback),
        wrapFileOperation: (op: () => Promise<any>, ctx?: string) => 
          this.wrapFileOperation(op, ctx),
        checkFeatureFlag: (feature: string) => this.checkFeatureFlag(feature),
        getDegradationLevel: (feature: string) => this.getFeatureDegradationLevel(feature)
      };

      next();
    };
  }

  /**
   * Error recovery handler
   */
  static errorRecoveryHandler() {
    return async (error: Error, req: Request, res: Response, next: NextFunction) => {
      const context = this.requestContexts.get(req.requestId || '');
      
      if (!context) {
        return next(error);
      }

      // Track error for self-healing
      selfHealingService.emit('errorOccurred', {
        error,
        context,
        endpoint: req.path,
        method: req.method
      });

      // Check if error is recoverable
      const isRecoverable = this.isRecoverableError(error);
      
      if (isRecoverable && context.retryCount < 3) {
        context.retryCount++;
        
        logger.warn(`Attempting request recovery for ${req.path} (attempt ${context.retryCount})`, {
          error: error.message,
          requestId: context.requestId
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * context.retryCount));
        
        // Retry the request (this would need to be implemented based on your routing structure)
        // For now, we'll just pass the error along
        return next(error);
      }

      // Check for fallback responses
      const fallbackResponse = await this.getFallbackResponse(req, error);
      if (fallbackResponse) {
        logger.info(`Using fallback response for ${req.path}`, {
          requestId: context.requestId
        });
        
        context.fallbackUsed = true;
        return res.json(fallbackResponse);
      }

      // No recovery possible, pass error to next handler
      next(error);
    };
  }

  /**
   * Check if error is recoverable
   */
  private static isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /connection.*timeout/i,
      /connection.*refused/i,
      /connection.*reset/i,
      /timeout/i,
      /temporary.*failure/i,
      /service.*unavailable/i,
      /ECONNRESET/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i
    ];

    return recoverablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Get fallback response for failed requests
   */
  private static async getFallbackResponse(req: Request, error: Error): Promise<any> {
    const endpoint = req.path;
    const method = req.method;

    // Define fallback responses for common endpoints
    const fallbackResponses: Record<string, any> = {
      'GET:/api/dashboard': {
        success: true,
        data: {
          message: 'Dashboard data temporarily unavailable',
          cached: true
        }
      },
      'GET:/api/health': {
        success: true,
        data: {
          status: 'degraded',
          message: 'Some services are temporarily unavailable'
        }
      }
    };

    const key = `${method}:${endpoint}`;
    return fallbackResponses[key] || null;
  }

  /**
   * Health check endpoint with recovery status
   */
  static healthCheckEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        const [
          systemHealth,
          recoveryDashboard,
          degradationDashboard
        ] = await Promise.all([
          selfHealingService.getSystemHealth(),
          errorRecoveryService.getRecoveryDashboard(),
          serviceDegradationManager.getDegradationDashboard()
        ]);

        const healthStatus = {
          status: systemHealth.overall,
          timestamp: new Date().toISOString(),
          system: {
            overall: systemHealth.overall,
            components: systemHealth.components,
            activeHealing: systemHealth.activeHealing.length,
            lastHealing: systemHealth.lastHealingAttempt
          },
          recovery: {
            circuitBreakers: recoveryDashboard.circuitBreakers.length,
            activeRecovery: recoveryDashboard.serviceHealth.filter(s => s.status === 'recovering').length,
            totalServices: recoveryDashboard.serviceHealth.length
          },
          degradation: {
            activeDegradations: degradationDashboard.activeDegradations.length,
            disabledFeatures: degradationDashboard.featureFlags.filter(f => !f.enabled).length,
            totalFeatures: degradationDashboard.featureFlags.length
          }
        };

        if (res.success) {
          res.success(healthStatus, 'System health check completed');
        } else {
          res.json({
            success: true,
            data: healthStatus,
            message: 'System health check completed'
          });
        }

      } catch (error) {
        logger.error('Health check endpoint error:', error);
        
        if (res.error) {
          res.error('Health check failed', 500, 'HEALTH_CHECK_ERROR');
        } else {
          res.status(500).json({
            success: false,
            message: 'Health check failed',
            error: (error as Error).message
          });
        }
      }
    };
  }

  /**
   * Recovery dashboard endpoint
   */
  static recoveryDashboardEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        const [
          systemHealth,
          recoveryDashboard,
          degradationDashboard,
          healingHistory
        ] = await Promise.all([
          selfHealingService.getSystemHealth(),
          errorRecoveryService.getRecoveryDashboard(),
          serviceDegradationManager.getDegradationDashboard(),
          selfHealingService.getHealingHistory(20)
        ]);

        const dashboard = {
          system: systemHealth,
          recovery: recoveryDashboard,
          degradation: degradationDashboard,
          healing: {
            history: healingHistory,
            rules: Array.from(selfHealingService.getHealingRules().values()),
            active: Array.from(selfHealingService.getActiveHealing().values())
          },
          timestamp: new Date().toISOString()
        };

        if (res.success) {
          res.success(dashboard, 'Recovery dashboard data retrieved');
        } else {
          res.json({
            success: true,
            data: dashboard,
            message: 'Recovery dashboard data retrieved'
          });
        }

      } catch (error) {
        logger.error('Recovery dashboard endpoint error:', error);
        
        if (res.error) {
          res.error('Failed to retrieve recovery dashboard', 500, 'DASHBOARD_ERROR');
        } else {
          res.status(500).json({
            success: false,
            message: 'Failed to retrieve recovery dashboard',
            error: (error as Error).message
          });
        }
      }
    };
  }

  /**
   * Manual recovery trigger endpoint
   */
  static manualRecoveryEndpoint() {
    return async (req: Request, res: Response) => {
      try {
        const { action, target, reason } = req.body;

        let result: any = {};

        switch (action) {
          case 'trigger_healing':
            if (!target) {
              throw new Error('Healing rule ID required');
            }
            result.healingId = await selfHealingService.manualHeal(target, reason || 'Manual trigger');
            break;

          case 'reset_circuit_breaker':
            if (!target) {
              throw new Error('Service name required');
            }
            const circuitBreaker = errorRecoveryService.getCircuitBreaker(target);
            circuitBreaker.forceReset();
            result.message = `Circuit breaker reset for ${target}`;
            break;

          case 'trigger_degradation':
            if (!target) {
              throw new Error('Degradation rule ID required');
            }
            const success = serviceDegradationManager.triggerDegradation(target);
            result.message = success ? 
              `Degradation rule ${target} triggered` : 
              `Failed to trigger degradation rule ${target}`;
            break;

          case 'execute_recovery_action':
            if (!target) {
              throw new Error('Recovery action ID required');
            }
            const actionSuccess = await errorRecoveryService.executeRecoveryAction(target);
            result.message = actionSuccess ? 
              `Recovery action ${target} executed successfully` : 
              `Recovery action ${target} failed`;
            break;

          default:
            throw new Error(`Unknown recovery action: ${action}`);
        }

        if (res.success) {
          res.success(result, `Recovery action ${action} completed`);
        } else {
          res.json({
            success: true,
            data: result,
            message: `Recovery action ${action} completed`
          });
        }

      } catch (error) {
        logger.error('Manual recovery endpoint error:', error);
        
        if (res.error) {
          res.error((error as Error).message, 400, 'RECOVERY_ACTION_ERROR');
        } else {
          res.status(400).json({
            success: false,
            message: (error as Error).message,
            code: 'RECOVERY_ACTION_ERROR'
          });
        }
      }
    };
  }

  /**
   * Get request context
   */
  static getRequestContext(requestId: string): RecoveryContext | undefined {
    return this.requestContexts.get(requestId);
  }

  /**
   * Clear all request contexts (for cleanup)
   */
  static clearRequestContexts(): void {
    this.requestContexts.clear();
  }
}

// Export middleware functions
export const initializeRecoveryContext = ErrorRecoveryMiddleware.initializeContext();
export const requestRecovery = ErrorRecoveryMiddleware.requestRecovery();
export const errorRecoveryHandler = ErrorRecoveryMiddleware.errorRecoveryHandler();
export const healthCheckEndpoint = ErrorRecoveryMiddleware.healthCheckEndpoint();
export const recoveryDashboardEndpoint = ErrorRecoveryMiddleware.recoveryDashboardEndpoint();
export const manualRecoveryEndpoint = ErrorRecoveryMiddleware.manualRecoveryEndpoint();

// Export wrapper functions
export const wrapDatabaseOperation = ErrorRecoveryMiddleware.wrapDatabaseOperation;
export const wrapRedisOperation = ErrorRecoveryMiddleware.wrapRedisOperation;
export const wrapExternalApiOperation = ErrorRecoveryMiddleware.wrapExternalApiOperation;
export const wrapFileOperation = ErrorRecoveryMiddleware.wrapFileOperation;