import { Router } from 'express';
import { SecurityController } from '@/controllers/SecurityController';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { dataPermissionMiddleware } from '@/middleware/dataPermission';

const router = Router();

// 所有路由都需要认证
router.use(auth);

// 安全策略相关路由
router.get('/policy', 
  permission('system:read'), 
  SecurityController.getSecurityPolicy
);

router.put('/policy', 
  permission('system:write'), 
  SecurityController.updateSecurityPolicy
);

// 密码和加密相关路由
router.post('/validate-password', 
  permission('system:read'), 
  SecurityController.validatePassword
);

router.post('/encrypt', 
  permission('system:write'), 
  SecurityController.encryptData
);

router.post('/decrypt', 
  permission('system:write'), 
  SecurityController.decryptData
);

router.post('/generate-token', 
  permission('system:write'), 
  SecurityController.generateSecureToken
);

// 审计日志相关路由
router.get('/audit-logs', 
  permission('system:read'), 
  dataPermissionMiddleware,
  SecurityController.getAuditLogs
);

// 威胁管理相关路由
router.get('/threats', 
  permission('system:read'), 
  SecurityController.getDetectedThreats
);

router.put('/threats/:threatId/status', 
  permission('system:write'), 
  SecurityController.updateThreatStatus
);

// 安全报告相关路由
router.get('/report', 
  permission('system:read'), 
  SecurityController.generateSecurityReport
);

router.get('/statistics', 
  permission('system:read'), 
  SecurityController.getSecurityStatistics
);

// IP地址管理相关路由
router.get('/ip/:ipAddress/status', 
  permission('system:read'), 
  SecurityController.checkIpStatus
);

// 安全扫描相关路由
router.post('/scan/trigger', 
  permission('system:write'), 
  SecurityController.triggerSecurityScan
);

export default router;