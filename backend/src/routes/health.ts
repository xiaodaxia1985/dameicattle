import { Router } from 'express';
import { HealthController } from '@/controllers/HealthController';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/permission';
import { validate } from '@/middleware/validation';
import { dataPermission } from '@/middleware/dataPermission';
import {
  createHealthRecordValidation,
  updateHealthRecordValidation,
  createVaccinationRecordValidation,
  updateVaccinationRecordValidation,
  getHealthRecordsValidation,
  getVaccinationRecordsValidation,
  getHealthStatisticsValidation,
  getCattleHealthProfileValidation,
  deleteHealthRecordValidation,
  deleteVaccinationRecordValidation
} from '@/validators/health';

const router = Router();

// 所有健康管理路由都需要认证
router.use(authenticate);

// 健康记录相关路由
router.get(
  '/records',
  authorize(['health:read']),
  getHealthRecordsValidation,
  validate,
  dataPermission,
  HealthController.getHealthRecords
);

router.post(
  '/records',
  authorize(['health:create']),
  createHealthRecordValidation,
  validate,
  dataPermission,
  HealthController.createHealthRecord
);

router.put(
  '/records/:id',
  authorize(['health:update']),
  updateHealthRecordValidation,
  validate,
  dataPermission,
  HealthController.updateHealthRecord
);

router.delete(
  '/records/:id',
  authorize(['health:delete']),
  deleteHealthRecordValidation,
  validate,
  dataPermission,
  HealthController.deleteHealthRecord
);

// 疫苗接种记录相关路由
router.get(
  '/vaccinations',
  authorize(['health:read']),
  getVaccinationRecordsValidation,
  validate,
  dataPermission,
  HealthController.getVaccinationRecords
);

router.post(
  '/vaccinations',
  authorize(['health:create']),
  createVaccinationRecordValidation,
  validate,
  dataPermission,
  HealthController.createVaccinationRecord
);

router.put(
  '/vaccinations/:id',
  authorize(['health:update']),
  updateVaccinationRecordValidation,
  validate,
  dataPermission,
  HealthController.updateVaccinationRecord
);

router.delete(
  '/vaccinations/:id',
  authorize(['health:delete']),
  deleteVaccinationRecordValidation,
  validate,
  dataPermission,
  HealthController.deleteVaccinationRecord
);

// 健康统计和分析路由
router.get(
  '/statistics',
  authorize(['health:read']),
  getHealthStatisticsValidation,
  validate,
  dataPermission,
  HealthController.getHealthStatistics
);

// 单个牛只健康档案
router.get(
  '/cattle/:cattle_id/profile',
  authorize(['health:read']),
  getCattleHealthProfileValidation,
  validate,
  dataPermission,
  HealthController.getCattleHealthProfile
);

// 健康预警相关路由
router.get(
  '/alerts',
  authorize(['health:read']),
  getHealthStatisticsValidation,
  validate,
  dataPermission,
  HealthController.getHealthAlerts
);

router.get(
  '/trend',
  authorize(['health:read']),
  getHealthStatisticsValidation,
  validate,
  dataPermission,
  HealthController.getHealthTrend
);

router.post(
  '/alerts/notify',
  authorize(['health:create']),
  validate,
  dataPermission,
  HealthController.sendHealthAlertNotifications
);

export default router;