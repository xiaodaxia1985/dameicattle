import { Router } from 'express';
import { PatrolController } from '@/controllers/PatrolController';
import { requirePermission } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { dataPermissionMiddleware } from '@/middleware/dataPermission';
import { operationLogMiddleware } from '@/middleware/operationLog';
import {
  createPatrolRecordValidator,
  updatePatrolRecordValidator,
  getPatrolRecordValidator,
  getPatrolRecordsValidator,
  getPatrolStatisticsValidator
} from '@/validators/patrol';

const router = Router();

// 巡圈记录 CRUD
router.get(
  '/records',
  requirePermission('patrol:read'),
  dataPermissionMiddleware,
  ...getPatrolRecordsValidator,
  validate,
  PatrolController.getPatrolRecords
);

router.get(
  '/records/:id',
  requirePermission('patrol:read'),
  dataPermissionMiddleware,
  ...getPatrolRecordValidator,
  validate,
  PatrolController.getPatrolRecord
);

router.post(
  '/records',
  requirePermission('patrol:create'),
  dataPermissionMiddleware,
  ...createPatrolRecordValidator,
  validate,
  operationLogMiddleware('create', 'patrol_record'),
  PatrolController.createPatrolRecord
);

router.put(
  '/records/:id',
  requirePermission('patrol:update'),
  dataPermissionMiddleware,
  ...updatePatrolRecordValidator,
  validate,
  operationLogMiddleware('update', 'patrol_record'),
  PatrolController.updatePatrolRecord
);

router.delete(
  '/records/:id',
  requirePermission('patrol:delete'),
  dataPermissionMiddleware,
  ...getPatrolRecordValidator,
  validate,
  operationLogMiddleware('delete', 'patrol_record'),
  PatrolController.deletePatrolRecord
);

// 统计和分析
router.get(
  '/statistics',
  requirePermission('patrol:read'),
  dataPermissionMiddleware,
  ...getPatrolStatisticsValidator,
  validate,
  PatrolController.getPatrolStatistics
);

// 今日巡圈任务
router.get(
  '/tasks/today',
  requirePermission('patrol:read'),
  dataPermissionMiddleware,
  PatrolController.getTodayPatrolTasks
);

// 物联网设备数据
router.get(
  '/iot/device-data',
  requirePermission('patrol:read'),
  PatrolController.getIoTDeviceData
);

export default router;