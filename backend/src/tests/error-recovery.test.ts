import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  ErrorRecoveryService, 
  CircuitBreaker, 
  RetryManager,
  CircuitState 
} from '@/services/ErrorRecoveryService';
import { ServiceDegradationManager } from '@/services/ServiceDegradationManager';
import { SelfHealingService } from '@/services/SelfHealingService';

// Mock dependencies
jest.mock('@/utils/logger');
jest.mock('@/config/DatabaseManager');
jest.mock('@/config/RedisManager');

describe('Error Recovery System', () => {
  let errorRecoveryService: ErrorRecoveryService;
  let serviceDegradationManager: ServiceDegradationManager;
  let selfHealingService: SelfHealingService;

  beforeEach(() => {
    // Reset singletons for testing
    (ErrorRecoveryService as any).instance = null;
    (ServiceDegradationManager as any).instance = null;
    (SelfHealingService as any).instance = null;

    errorRecoveryService = ErrorRecoveryService.getInstance();
    serviceDegradationManager = ServiceDegradationManager.getInstance();
    selfHealingService = SelfHealingService.getInstance();
  });

  afterEach(() => {
    errorRecoveryService.shutdown();
    serviceDegradationManager.shutdown();
    selfHealingService.shutdown();
  });

  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        halfOpenMaxCalls: 2
      });
    });

    it('should start in CLOSED state', () => {
      const status = circuitBreaker.getStatus();
      expect(status.state).toBe(CircuitState.CLOSED);
      expect(status.failureCount).toBe(0);
    });

    it('should open after failure threshold is reached', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));

      // Execute failing operations to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      const status = circuitBreaker.getStatus();
      expect(status.state).toBe(CircuitState.OPEN);
      expect(status.failureCount).toBe(3);
    });

    it('should reject calls when OPEN', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));

      // Trigger circuit breaker to open
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      // Now circuit should be open and reject calls
      await expect(circuitBreaker.execute(jest.fn())).rejects.toThrow('Circuit breaker test-service is OPEN');
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getStatus().state).toBe(CircuitState.OPEN);

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next call should transition to HALF_OPEN
      const successfulOperation = jest.fn().mockResolvedValue('success');
      const result = await circuitBreaker.execute(successfulOperation);

      expect(result).toBe('success');
      expect(circuitBreaker.getStatus().state).toBe(CircuitState.HALF_OPEN);
    });

    it('should reset to CLOSED after successful calls in HALF_OPEN', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('Test error'));
      const successfulOperation = jest.fn().mockResolvedValue('success');

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Execute successful operations in HALF_OPEN state
      await circuitBreaker.execute(successfulOperation);
      await circuitBreaker.execute(successfulOperation);

      expect(circuitBreaker.getStatus().state).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getStatus().failureCount).toBe(0);
    });
  });

  describe('RetryManager', () => {
    let retryManager: RetryManager;

    beforeEach(() => {
      retryManager = new RetryManager({
        maxRetries: 3,
        baseDelay: 100,
        maxDelay: 1000,
        exponentialBase: 2,
        jitter: false
      });
    });

    it('should succeed on first attempt if operation succeeds', async () => {
      const successfulOperation = jest.fn().mockResolvedValue('success');

      const result = await retryManager.executeWithRetry(successfulOperation);

      expect(result).toBe('success');
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retriable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Retriable error'))
        .mockRejectedValueOnce(new Error('Retriable error'))
        .mockResolvedValueOnce('success');

      const result = await retryManager.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retriable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Non-retriable error'));
      const isRetriableError = jest.fn().mockReturnValue(false);

      await expect(retryManager.executeWithRetry(operation, isRetriableError)).rejects.toThrow('Non-retriable error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw last error', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(retryManager.executeWithRetry(operation)).rejects.toThrow('Persistent error');
      expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('ErrorRecoveryService', () => {
    it('should create circuit breakers for services', () => {
      const circuitBreaker = errorRecoveryService.getCircuitBreaker('test-service');
      expect(circuitBreaker).toBeInstanceOf(CircuitBreaker);
    });

    it('should execute operations with circuit breaker protection', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await errorRecoveryService.executeWithCircuitBreaker('test-service', operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should execute operations with retry logic', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('success');

      const result = await errorRecoveryService.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should execute operations with full protection', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const fallback = jest.fn().mockResolvedValue('fallback');

      const result = await errorRecoveryService.executeWithFullProtection('test-service', operation, {
        fallback
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(fallback).not.toHaveBeenCalled();
    });

    it('should use fallback when circuit breaker is open', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Service error'));
      const fallback = jest.fn().mockResolvedValue('fallback');

      // Open the circuit breaker
      const circuitBreaker = errorRecoveryService.getCircuitBreaker('test-service', {
        failureThreshold: 1
      });

      try {
        await circuitBreaker.execute(operation);
      } catch (error) {
        // Expected to fail and open circuit
      }

      // Now the circuit should be open, so fallback should be used
      const result = await errorRecoveryService.executeWithFullProtection('test-service', operation, {
        fallback
      });

      expect(result).toBe('fallback');
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it('should add and execute recovery actions', async () => {
      const mockAction = {
        id: 'test-action',
        name: 'Test Action',
        description: 'Test recovery action',
        priority: 'medium' as const,
        autoExecute: false,
        execute: jest.fn().mockResolvedValue(true)
      };

      errorRecoveryService.addRecoveryAction(mockAction);

      const success = await errorRecoveryService.executeRecoveryAction('test-action');

      expect(success).toBe(true);
      expect(mockAction.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('ServiceDegradationManager', () => {
    it('should register service dependencies', () => {
      const dependency = {
        name: 'test-service',
        critical: false,
        fallbackAvailable: true,
        timeout: 5000
      };

      serviceDegradationManager.registerService(dependency);

      const status = serviceDegradationManager.getServiceStatus('test-service');
      expect(status).toBeDefined();
      expect((status as any).name).toBe('test-service');
    });

    it('should update service status', () => {
      serviceDegradationManager.registerService({
        name: 'test-service',
        critical: false,
        fallbackAvailable: true,
        timeout: 5000
      });

      serviceDegradationManager.updateServiceStatus('test-service', {
        status: 'degraded',
        responseTime: 2000,
        errorRate: 5
      });

      const status = serviceDegradationManager.getServiceStatus('test-service') as any;
      expect(status.status).toBe('degraded');
      expect(status.responseTime).toBe(2000);
      expect(status.errorRate).toBe(5);
    });

    it('should check feature flags', () => {
      const isEnabled = serviceDegradationManager.isFeatureEnabled('cache');
      expect(typeof isEnabled).toBe('boolean');
    });

    it('should get feature degradation levels', () => {
      const level = serviceDegradationManager.getFeatureDegradationLevel('cache');
      expect(typeof level).toBe('number');
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(100);
    });

    it('should manually trigger degradation rules', () => {
      const success = serviceDegradationManager.triggerDegradation('redis_unavailable');
      expect(typeof success).toBe('boolean');
    });

    it('should get degradation dashboard data', () => {
      const dashboard = serviceDegradationManager.getDegradationDashboard();
      
      expect(dashboard).toHaveProperty('services');
      expect(dashboard).toHaveProperty('activeDegradations');
      expect(dashboard).toHaveProperty('featureFlags');
      expect(dashboard).toHaveProperty('degradationRules');
      
      expect(Array.isArray(dashboard.services)).toBe(true);
      expect(Array.isArray(dashboard.activeDegradations)).toBe(true);
      expect(Array.isArray(dashboard.featureFlags)).toBe(true);
      expect(Array.isArray(dashboard.degradationRules)).toBe(true);
    });
  });

  describe('SelfHealingService', () => {
    it('should get system health', async () => {
      const health = await selfHealingService.getSystemHealth();
      
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('components');
      expect(health).toHaveProperty('activeHealing');
      expect(health).toHaveProperty('healingHistory');
      
      expect(['healthy', 'degraded', 'critical', 'healing']).toContain(health.overall);
      expect(health.components).toHaveProperty('database');
      expect(health.components).toHaveProperty('redis');
      expect(health.components).toHaveProperty('memory');
      expect(health.components).toHaveProperty('cpu');
      expect(health.components).toHaveProperty('disk');
    });

    it('should get healing rules', () => {
      const rules = selfHealingService.getHealingRules();
      expect(rules).toBeInstanceOf(Map);
      expect(rules.size).toBeGreaterThan(0);
    });

    it('should get healing history', () => {
      const history = selfHealingService.getHealingHistory(10);
      expect(Array.isArray(history)).toBe(true);
    });

    it('should manually trigger healing', async () => {
      const rules = selfHealingService.getHealingRules();
      const firstRuleId = Array.from(rules.keys())[0];
      
      if (firstRuleId) {
        const healingId = await selfHealingService.manualHeal(firstRuleId, 'Test trigger');
        expect(typeof healingId).toBe('string');
        expect(healingId).toMatch(/^healing_/);
      }
    });

    it('should start and stop monitoring', () => {
      expect(() => {
        selfHealingService.startMonitoring(5000);
        selfHealingService.stopMonitoring();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle cascading failures', async () => {
      // Simulate database failure
      serviceDegradationManager.updateServiceStatus('database', {
        status: 'unavailable',
        responseTime: 30000,
        errorRate: 100
      });

      // This should trigger degradation rules
      await new Promise(resolve => setTimeout(resolve, 100));

      const dashboard = serviceDegradationManager.getDegradationDashboard();
      const dbService = dashboard.services.find(s => s.name === 'database');
      
      expect(dbService?.status).toBe('unavailable');
    });

    it('should recover from failures', async () => {
      // Simulate service recovery
      serviceDegradationManager.updateServiceStatus('redis', {
        status: 'available',
        responseTime: 50,
        errorRate: 0
      });

      const status = serviceDegradationManager.getServiceStatus('redis') as any;
      expect(status.status).toBe('available');
    });

    it('should provide comprehensive monitoring data', async () => {
      const [
        systemHealth,
        recoveryDashboard,
        degradationDashboard
      ] = await Promise.all([
        selfHealingService.getSystemHealth(),
        Promise.resolve(errorRecoveryService.getRecoveryDashboard()),
        Promise.resolve(serviceDegradationManager.getDegradationDashboard())
      ]);

      expect(systemHealth).toBeDefined();
      expect(recoveryDashboard).toBeDefined();
      expect(degradationDashboard).toBeDefined();

      // Verify structure
      expect(systemHealth).toHaveProperty('overall');
      expect(recoveryDashboard).toHaveProperty('circuitBreakers');
      expect(recoveryDashboard).toHaveProperty('serviceHealth');
      expect(degradationDashboard).toHaveProperty('services');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle invalid recovery action execution', async () => {
      const success = await errorRecoveryService.executeRecoveryAction('non-existent-action');
      expect(success).toBe(false);
    });

    it('should handle invalid healing rule trigger', async () => {
      await expect(selfHealingService.manualHeal('non-existent-rule')).rejects.toThrow();
    });

    it('should handle invalid degradation rule trigger', () => {
      const success = serviceDegradationManager.triggerDegradation('non-existent-rule');
      expect(success).toBe(false);
    });

    it('should handle service status update for unknown service', () => {
      expect(() => {
        serviceDegradationManager.updateServiceStatus('unknown-service', {
          status: 'available'
        });
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-frequency circuit breaker operations', async () => {
      const circuitBreaker = errorRecoveryService.getCircuitBreaker('perf-test');
      const operation = jest.fn().mockResolvedValue('success');

      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(circuitBreaker.execute(operation));
      }

      await Promise.all(promises);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(operation).toHaveBeenCalledTimes(100);
    });

    it('should handle concurrent recovery operations', async () => {
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const operation = jest.fn().mockResolvedValue(`result-${i}`);
        promises.push(errorRecoveryService.executeWithRetry(operation));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBe(`result-${index}`);
      });
    });
  });
});

describe('Error Recovery Middleware', () => {
  // These tests would require setting up Express app and request/response mocks
  // For brevity, including basic structure tests

  it('should initialize recovery context', () => {
    const { initializeRecoveryContext } = require('@/middleware/errorRecoveryMiddleware');
    expect(typeof initializeRecoveryContext).toBe('function');
  });

  it('should provide request recovery middleware', () => {
    const { requestRecovery } = require('@/middleware/errorRecoveryMiddleware');
    expect(typeof requestRecovery).toBe('function');
  });

  it('should provide error recovery handler', () => {
    const { errorRecoveryHandler } = require('@/middleware/errorRecoveryMiddleware');
    expect(typeof errorRecoveryHandler).toBe('function');
  });

  it('should provide wrapper functions', () => {
    const { 
      wrapDatabaseOperation,
      wrapRedisOperation,
      wrapExternalApiOperation,
      wrapFileOperation
    } = require('@/middleware/errorRecoveryMiddleware');

    expect(typeof wrapDatabaseOperation).toBe('function');
    expect(typeof wrapRedisOperation).toBe('function');
    expect(typeof wrapExternalApiOperation).toBe('function');
    expect(typeof wrapFileOperation).toBe('function');
  });
});