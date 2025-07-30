import { Router } from 'express';
import { MonitoringController } from '@/controllers/MonitoringController';
import { auth as authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/permission';
import { dataPermissionMiddleware } from '@/middleware/dataPermission';
import { validate } from '@/middleware/validation';

const router = Router();

// 所有监控路由都需要认证和数据权限检查
router.use(authenticate);
router.use(dataPermissionMiddleware);

// 系统监控路由
router.get('/health', 
  authorize(['monitoring:read']), 
  MonitoringController.getSystemHealth
);

router.get('/metrics', 
  authorize(['monitoring:read']), 
  MonitoringController.getSystemMetrics
);

router.get('/dashboard', 
  authorize(['monitoring:read']), 
  MonitoringController.getDashboardData
);

// 警报管理路由
router.get('/alerts', 
  authorize(['monitoring:read']), 
  MonitoringController.getActiveAlerts
);

router.get('/alerts/all', 
  authorize(['monitoring:read']),
  MonitoringController.getAllAlerts
);

router.post('/alerts/:id/acknowledge', 
  authorize(['monitoring:update']),
  MonitoringController.acknowledgeAlert
);

router.post('/alerts/:id/resolve', 
  authorize(['monitoring:update']),
  MonitoringController.resolveAlert
);

// 警报规则管理路由
router.get('/alert-rules', 
  authorize(['monitoring:read']), 
  MonitoringController.getAlertRules
);

router.post('/alert-rules', 
  authorize(['monitoring:create']),
  MonitoringController.createAlertRule
);

router.put('/alert-rules/:id', 
  authorize(['monitoring:update']),
  MonitoringController.updateAlertRule
);

router.delete('/alert-rules/:id', 
  authorize(['monitoring:delete']), 
  MonitoringController.deleteAlertRule
);

// 历史数据路由
router.get('/history', 
  authorize(['monitoring:read']),
  MonitoringController.getHealthHistory
);

// 初始化路由
router.post('/initialize', 
  authorize(['monitoring:admin']), 
  MonitoringController.initializeDefaultRules
);

export default router;