import { Router } from 'express';
import { DataIntegrationController } from '@/controllers/DataIntegrationController';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';

const router = Router();

// 所有路由都需要认证
router.use(auth);

// 数据流转相关路由
router.get('/data-flow/history', 
  permission('system:read'), 
  DataIntegrationController.getDataFlowHistory
);

router.get('/data-flow/pending', 
  permission('system:read'), 
  DataIntegrationController.getPendingDataFlowEvents
);

// 手动触发数据流转
router.post('/data-flow/purchase-order/:orderId', 
  permission('system:write'), 
  DataIntegrationController.triggerPurchaseOrderFlow
);

router.post('/data-flow/sales-order/:orderId', 
  permission('system:write'), 
  DataIntegrationController.triggerSalesOrderFlow
);

router.post('/data-flow/feeding-record/:recordId', 
  permission('system:write'), 
  DataIntegrationController.triggerFeedingRecordFlow
);

router.post('/data-flow/health-record/:recordId', 
  permission('system:write'), 
  DataIntegrationController.triggerHealthRecordFlow
);

// 数据一致性检查相关路由
router.post('/consistency/check', 
  permission('system:read'), 
  DataIntegrationController.performConsistencyCheck
);

router.get('/consistency/quality-score', 
  permission('system:read'), 
  DataIntegrationController.getDataQualityScore
);

router.post('/consistency/fix', 
  permission('system:write'), 
  DataIntegrationController.fixDataInconsistencies
);

// 数据同步和备份相关路由
router.post('/sync/backup', 
  permission('system:write'), 
  DataIntegrationController.createBackup
);

router.post('/sync/restore/:backupId', 
  permission('system:write'), 
  DataIntegrationController.restoreBackup
);

router.get('/sync/status', 
  permission('system:read'), 
  DataIntegrationController.getSyncStatus
);

router.get('/sync/backup-history', 
  permission('system:read'), 
  DataIntegrationController.getBackupHistory
);

router.delete('/sync/backup/:backupId', 
  permission('system:write'), 
  DataIntegrationController.deleteBackup
);

// 数据迁移相关路由
router.post('/migration/run', 
  permission('system:write'), 
  DataIntegrationController.runMigrations
);

router.post('/migration/rollback/:migrationId', 
  permission('system:write'), 
  DataIntegrationController.rollbackMigration
);

router.get('/migration/history', 
  permission('system:read'), 
  DataIntegrationController.getMigrationHistory
);

// 数据导入导出相关路由
router.post('/import/:tableName', 
  permission('system:write'), 
  ...DataIntegrationController.importData
);

router.get('/export/:tableName', 
  permission('system:read'), 
  DataIntegrationController.exportData
);

router.post('/transform', 
  permission('system:write'), 
  DataIntegrationController.transformData
);

export default router;