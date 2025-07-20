import { Router } from 'express';
import { MonitoringController } from '@/controllers/MonitoringController';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';

const router = Router();

// 所有路由都需要认证
router.use(auth);

// 系统健康和指标相关路由
router.get('/health', 
  permission('system:read'), 
  MonitoringController.getSystemHealth
);

router.get('/metrics', 
  permission('system:read'), 
  MonitoringController.getSystemMetrics
);

router.get('/health/history', 
  permission('system:read'), 
  MonitoringController.getHealthHistory
);

router.get('/dashboard', 
  permission('system:read'), 
  MonitoringController.getDashboardData
);

// 警报规则相关路由
router.get('/alert-rules', 
  permission('system:read'), 
  MonitoringController.getAlertRules
);

router.post('/alert-rules', 
  permission('system:write'), 
  MonitoringController.addAlertRule
);

router.put('/alert-rules/:ruleId', 
  permission('system:write'), 
  MonitoringController.updateAlertRule
);

router.delete('/alert-rules/:ruleId', 
  permission('system:write'), 
  MonitoringController.deleteAlertRule
);

// 警报管理相关路由
router.get('/alerts/active', 
  permission('system:read'), 
  MonitoringController.getActiveAlerts
);

router.get('/alerts', 
  permission('system:read'), 
  MonitoringController.getAllAlerts
);

router.post('/alerts/:alertId/acknowledge', 
  permission('system:write'), 
  MonitoringController.acknowledgeAlert
);

router.post('/alerts/:alertId/resolve', 
  permission('system:write'), 
  MonitoringController.resolveAlert
);

// 日志分析相关路由
router.post('/logs/analyze', 
  permission('system:read'), 
  MonitoringController.analyzeLogData
);

router.get('/logs/search', 
  permission('system:read'), 
  MonitoringController.searchLogs
);

router.get('/logs/realtime', 
  permission('system:read'), 
  MonitoringController.getRealtimeLogs
);

router.get('/logs/export', 
  permission('system:read'), 
  MonitoringController.exportLogs
);

router.get('/logs/statistics', 
  permission('system:read'), 
  MonitoringController.getLogStatistics
);

// 日志警报相关路由
router.get('/log-alerts', 
  permission('system:read'), 
  MonitoringController.getLogAlerts
);

router.post('/log-alerts', 
  permission('system:write'), 
  MonitoringController.addLogAlert
);

router.put('/log-alerts/:alertId', 
  permission('system:write'), 
  MonitoringController.updateLogAlert
);

router.delete('/log-alerts/:alertId', 
  permission('system:write'), 
  MonitoringController.deleteLogAlert
);

// 日志管理相关路由
router.post('/logs/cleanup', 
  permission('system:write'), 
  MonitoringController.cleanupOldLogs
);

export default router;