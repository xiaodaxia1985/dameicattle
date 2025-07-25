import { Router, Request, Response } from 'express';
import { 
  healthCheckEndpoint, 
  recoveryDashboardEndpoint, 
  manualRecoveryEndpoint 
} from '@/middleware/errorRecoveryMiddleware';
import { asyncHandler } from '@/middleware/errorHandler';
import { auth } from '@/middleware/auth';

const router = Router();

/**
 * @route GET /api/error-recovery/health
 * @desc Get system health status with recovery information
 * @access Public
 */
router.get('/health', asyncHandler(healthCheckEndpoint));

/**
 * @route GET /api/error-recovery/dashboard
 * @desc Get comprehensive recovery dashboard data
 * @access Private (Admin)
 */
router.get('/dashboard', auth, asyncHandler(recoveryDashboardEndpoint));

/**
 * @route POST /api/error-recovery/manual
 * @desc Manually trigger recovery actions
 * @access Private (Admin)
 */
router.post('/manual', auth, asyncHandler(manualRecoveryEndpoint));

/**
 * @route GET /api/error-recovery/circuit-breakers
 * @desc Get circuit breaker statuses
 * @access Private (Admin)
 */
router.get('/circuit-breakers', auth, asyncHandler(async (req: Request, res: Response) => {
  const { errorRecoveryService } = await import('@/services/ErrorRecoveryService');
  const statuses = errorRecoveryService.getCircuitBreakerStatuses();
  
  const circuitBreakers = Array.from(statuses.entries()).map(([service, status]) => ({
    service,
    ...status
  }));

  if (res.success) {
    res.success(circuitBreakers, 'Circuit breaker statuses retrieved');
  } else {
    res.json({
      success: true,
      data: circuitBreakers,
      message: 'Circuit breaker statuses retrieved'
    });
  }
}));

/**
 * @route GET /api/error-recovery/service-health
 * @desc Get service health statuses
 * @access Private (Admin)
 */
router.get('/service-health', auth, asyncHandler(async (req: Request, res: Response) => {
  const { errorRecoveryService } = await import('@/services/ErrorRecoveryService');
  const healthMap = errorRecoveryService.getServiceHealth() as Map<string, any>;
  
  const serviceHealth = Array.from(healthMap.values());

  if (res.success) {
    res.success(serviceHealth, 'Service health statuses retrieved');
  } else {
    res.json({
      success: true,
      data: serviceHealth,
      message: 'Service health statuses retrieved'
    });
  }
}));

/**
 * @route GET /api/error-recovery/degradation
 * @desc Get service degradation status
 * @access Private (Admin)
 */
router.get('/degradation', auth, asyncHandler(async (req: Request, res: Response) => {
  const { serviceDegradationManager } = await import('@/services/ServiceDegradationManager');
  const dashboard = serviceDegradationManager.getDegradationDashboard();

  if (res.success) {
    res.success(dashboard, 'Service degradation status retrieved');
  } else {
    res.json({
      success: true,
      data: dashboard,
      message: 'Service degradation status retrieved'
    });
  }
}));

/**
 * @route GET /api/error-recovery/healing
 * @desc Get self-healing system status
 * @access Private (Admin)
 */
router.get('/healing', auth, asyncHandler(async (req: Request, res: Response) => {
  const { selfHealingService } = await import('@/services/SelfHealingService');
  const [systemHealth, healingHistory, healingRules] = await Promise.all([
    selfHealingService.getSystemHealth(),
    selfHealingService.getHealingHistory(50),
    Promise.resolve(Array.from(selfHealingService.getHealingRules().values()))
  ]);

  const healingStatus = {
    systemHealth,
    history: healingHistory,
    rules: healingRules,
    active: Array.from(selfHealingService.getActiveHealing().values())
  };

  if (res.success) {
    res.success(healingStatus, 'Self-healing status retrieved');
  } else {
    res.json({
      success: true,
      data: healingStatus,
      message: 'Self-healing status retrieved'
    });
  }
}));

/**
 * @route POST /api/error-recovery/circuit-breaker/:service/reset
 * @desc Reset circuit breaker for a specific service
 * @access Private (Admin)
 */
router.post('/circuit-breaker/:service/reset', auth, asyncHandler(async (req: Request, res: Response) => {
  const { service } = req.params;
  const { errorRecoveryService } = await import('@/services/ErrorRecoveryService');
  
  const circuitBreaker = errorRecoveryService.getCircuitBreaker(service);
  circuitBreaker.forceReset();

  if (res.success) {
    res.success({ service }, `Circuit breaker reset for ${service}`);
  } else {
    res.json({
      success: true,
      data: { service },
      message: `Circuit breaker reset for ${service}`
    });
  }
}));

/**
 * @route POST /api/error-recovery/degradation/:ruleId/trigger
 * @desc Manually trigger a degradation rule
 * @access Private (Admin)
 */
router.post('/degradation/:ruleId/trigger', auth, asyncHandler(async (req: Request, res: Response) => {
  const { ruleId } = req.params;
  const { serviceDegradationManager } = await import('@/services/ServiceDegradationManager');
  
  const success = serviceDegradationManager.triggerDegradation(ruleId);
  
  if (success) {
    if (res.success) {
      res.success({ ruleId }, `Degradation rule ${ruleId} triggered`);
    } else {
      res.json({
        success: true,
        data: { ruleId },
        message: `Degradation rule ${ruleId} triggered`
      });
    }
  } else {
    if (res.error) {
      res.error(`Failed to trigger degradation rule ${ruleId}`, 400, 'DEGRADATION_TRIGGER_FAILED');
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to trigger degradation rule ${ruleId}`,
        code: 'DEGRADATION_TRIGGER_FAILED'
      });
    }
  }
}));

/**
 * @route POST /api/error-recovery/degradation/:ruleId/deactivate
 * @desc Manually deactivate a degradation rule
 * @access Private (Admin)
 */
router.post('/degradation/:ruleId/deactivate', auth, asyncHandler(async (req: Request, res: Response) => {
  const { ruleId } = req.params;
  const { serviceDegradationManager } = await import('@/services/ServiceDegradationManager');
  
  const success = serviceDegradationManager.deactivateDegradationRule(ruleId);
  
  if (success) {
    if (res.success) {
      res.success({ ruleId }, `Degradation rule ${ruleId} deactivated`);
    } else {
      res.json({
        success: true,
        data: { ruleId },
        message: `Degradation rule ${ruleId} deactivated`
      });
    }
  } else {
    if (res.error) {
      res.error(`Failed to deactivate degradation rule ${ruleId}`, 400, 'DEGRADATION_DEACTIVATE_FAILED');
    } else {
      res.status(400).json({
        success: false,
        message: `Failed to deactivate degradation rule ${ruleId}`,
        code: 'DEGRADATION_DEACTIVATE_FAILED'
      });
    }
  }
}));

/**
 * @route POST /api/error-recovery/healing/:ruleId/trigger
 * @desc Manually trigger a healing rule
 * @access Private (Admin)
 */
router.post('/healing/:ruleId/trigger', auth, asyncHandler(async (req: Request, res: Response) => {
  const { ruleId } = req.params;
  const { reason } = req.body;
  const { selfHealingService } = await import('@/services/SelfHealingService');
  
  try {
    const healingId = await selfHealingService.manualHeal(ruleId, reason || 'Manual trigger');
    
    if (res.success) {
      res.success({ ruleId, healingId }, `Healing rule ${ruleId} triggered`);
    } else {
      res.json({
        success: true,
        data: { ruleId, healingId },
        message: `Healing rule ${ruleId} triggered`
      });
    }
  } catch (error) {
    if (res.error) {
      res.error((error as Error).message, 400, 'HEALING_TRIGGER_FAILED');
    } else {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
        code: 'HEALING_TRIGGER_FAILED'
      });
    }
  }
}));

/**
 * @route GET /api/error-recovery/recovery-actions
 * @desc Get available recovery actions
 * @access Private (Admin)
 */
router.get('/recovery-actions', auth, asyncHandler(async (req: Request, res: Response) => {
  const { errorRecoveryService } = await import('@/services/ErrorRecoveryService');
  const actionsMap = errorRecoveryService.getRecoveryActions();
  
  const actions = Array.from(actionsMap.values());

  if (res.success) {
    res.success(actions, 'Recovery actions retrieved');
  } else {
    res.json({
      success: true,
      data: actions,
      message: 'Recovery actions retrieved'
    });
  }
}));

/**
 * @route POST /api/error-recovery/recovery-action/:actionId/execute
 * @desc Execute a specific recovery action
 * @access Private (Admin)
 */
router.post('/recovery-action/:actionId/execute', auth, asyncHandler(async (req: Request, res: Response) => {
  const { actionId } = req.params;
  const { errorRecoveryService } = await import('@/services/ErrorRecoveryService');
  
  const success = await errorRecoveryService.executeRecoveryAction(actionId);
  
  if (success) {
    if (res.success) {
      res.success({ actionId }, `Recovery action ${actionId} executed successfully`);
    } else {
      res.json({
        success: true,
        data: { actionId },
        message: `Recovery action ${actionId} executed successfully`
      });
    }
  } else {
    if (res.error) {
      res.error(`Recovery action ${actionId} failed`, 500, 'RECOVERY_ACTION_FAILED');
    } else {
      res.status(500).json({
        success: false,
        message: `Recovery action ${actionId} failed`,
        code: 'RECOVERY_ACTION_FAILED'
      });
    }
  }
}));

/**
 * @route GET /api/error-recovery/feature-flags
 * @desc Get current feature flag statuses
 * @access Private (Admin)
 */
router.get('/feature-flags', auth, asyncHandler(async (req: Request, res: Response) => {
  const { serviceDegradationManager } = await import('@/services/ServiceDegradationManager');
  const flagsMap = serviceDegradationManager.getFeatureFlags();
  
  const flags = Array.from(flagsMap.values());

  if (res.success) {
    res.success(flags, 'Feature flags retrieved');
  } else {
    res.json({
      success: true,
      data: flags,
      message: 'Feature flags retrieved'
    });
  }
}));

/**
 * @route GET /api/error-recovery/metrics
 * @desc Get error recovery metrics
 * @access Private (Admin)
 */
router.get('/metrics', auth, asyncHandler(async (req: Request, res: Response) => {
  const { errorRecoveryService } = await import('@/services/ErrorRecoveryService');
  const { serviceDegradationManager } = await import('@/services/ServiceDegradationManager');
  const { selfHealingService } = await import('@/services/SelfHealingService');
  
  const [
    circuitBreakers,
    serviceHealth,
    degradationDashboard,
    systemHealth
  ] = await Promise.all([
    Promise.resolve(errorRecoveryService.getCircuitBreakerStatuses()),
    Promise.resolve(errorRecoveryService.getServiceHealth() as Map<string, any>),
    Promise.resolve(serviceDegradationManager.getDegradationDashboard()),
    selfHealingService.getSystemHealth()
  ]);

  const metrics = {
    circuitBreakers: {
      total: circuitBreakers.size,
      open: Array.from(circuitBreakers.values()).filter(cb => cb.state === 'open').length,
      halfOpen: Array.from(circuitBreakers.values()).filter(cb => cb.state === 'half_open').length,
      closed: Array.from(circuitBreakers.values()).filter(cb => cb.state === 'closed').length
    },
    services: {
      total: serviceHealth.size,
      healthy: Array.from(serviceHealth.values()).filter(s => s.status === 'healthy').length,
      degraded: Array.from(serviceHealth.values()).filter(s => s.status === 'degraded').length,
      unhealthy: Array.from(serviceHealth.values()).filter(s => s.status === 'unhealthy').length,
      recovering: Array.from(serviceHealth.values()).filter(s => s.status === 'recovering').length
    },
    degradation: {
      activeDegradations: degradationDashboard.activeDegradations.length,
      disabledFeatures: degradationDashboard.featureFlags.filter(f => !f.enabled).length,
      totalFeatures: degradationDashboard.featureFlags.length
    },
    healing: {
      overallHealth: systemHealth.overall,
      activeHealing: systemHealth.activeHealing.length,
      criticalComponents: Object.values(systemHealth.components).filter(c => c.status === 'critical').length
    },
    timestamp: new Date().toISOString()
  };

  if (res.success) {
    res.success(metrics, 'Error recovery metrics retrieved');
  } else {
    res.json({
      success: true,
      data: metrics,
      message: 'Error recovery metrics retrieved'
    });
  }
}));

export default router;