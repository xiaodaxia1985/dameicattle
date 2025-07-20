import { Router } from 'express';
import { FeedingController } from '@/controllers/FeedingController';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { dataPermission } from '@/middleware/dataPermission';
import { validate } from '@/middleware/validation';
import { operationLog } from '@/middleware/operationLog';
import {
  createFeedFormulaValidator,
  updateFeedFormulaValidator,
  getFeedFormulaValidator,
  getFeedFormulasValidator,
  createFeedingRecordValidator,
  updateFeedingRecordValidator,
  getFeedingRecordValidator,
  getFeedingRecordsValidator,
  getFeedingStatisticsValidator,
  batchCreateFeedingRecordsValidator
} from '@/validators/feeding';

const router = Router();

// Apply authentication to all routes
router.use(auth);

// Feed Formula routes
router.get(
  '/formulas',
  permission('feeding:read'),
  validate(getFeedFormulasValidator),
  FeedingController.getFeedFormulas
);

router.get(
  '/formulas/:id',
  permission('feeding:read'),
  validate(getFeedFormulaValidator),
  FeedingController.getFeedFormula
);

router.post(
  '/formulas',
  permission('feeding:create'),
  validate(createFeedFormulaValidator),
  operationLog('创建饲料配方'),
  FeedingController.createFeedFormula
);

router.put(
  '/formulas/:id',
  permission('feeding:update'),
  validate(updateFeedFormulaValidator),
  operationLog('更新饲料配方'),
  FeedingController.updateFeedFormula
);

router.delete(
  '/formulas/:id',
  permission('feeding:delete'),
  validate(getFeedFormulaValidator),
  operationLog('删除饲料配方'),
  FeedingController.deleteFeedFormula
);

// Feeding Record routes
router.get(
  '/records',
  permission('feeding:read'),
  dataPermission('base_id'),
  validate(getFeedingRecordsValidator),
  FeedingController.getFeedingRecords
);

router.get(
  '/records/:id',
  permission('feeding:read'),
  validate(getFeedingRecordValidator),
  FeedingController.getFeedingRecord
);

router.post(
  '/records',
  permission('feeding:create'),
  dataPermission('base_id'),
  validate(createFeedingRecordValidator),
  operationLog('创建饲喂记录'),
  FeedingController.createFeedingRecord
);

router.put(
  '/records/:id',
  permission('feeding:update'),
  validate(updateFeedingRecordValidator),
  operationLog('更新饲喂记录'),
  FeedingController.updateFeedingRecord
);

router.delete(
  '/records/:id',
  permission('feeding:delete'),
  validate(getFeedingRecordValidator),
  operationLog('删除饲喂记录'),
  FeedingController.deleteFeedingRecord
);

// Batch operations
router.post(
  '/records/batch',
  permission('feeding:create'),
  validate(batchCreateFeedingRecordsValidator),
  operationLog('批量创建饲喂记录'),
  FeedingController.batchCreateFeedingRecords
);

// Statistics and analytics
router.get(
  '/statistics',
  permission('feeding:read'),
  dataPermission('base_id'),
  validate(getFeedingStatisticsValidator),
  FeedingController.getFeedingStatistics
);

// Feeding recommendations
router.get(
  '/recommendations',
  permission('feeding:read'),
  dataPermission('base_id'),
  FeedingController.getFeedingRecommendations
);

// Formula efficiency analysis
router.get(
  '/formulas/:id/efficiency',
  permission('feeding:read'),
  validate(getFeedFormulaValidator),
  FeedingController.getFormulaEfficiency
);

// Feeding plans (future feature)
router.get(
  '/plans',
  permission('feeding:read'),
  dataPermission('base_id'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: '饲喂计划功能即将推出'
    });
  }
);

router.post(
  '/plans/generate',
  permission('feeding:create'),
  dataPermission('base_id'),
  operationLog('生成饲喂计划'),
  FeedingController.generateFeedingPlan
);

export default router;