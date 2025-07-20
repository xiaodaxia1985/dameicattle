import { Router } from 'express';
import { FeedingController } from '@/controllers/FeedingController';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { dataPermission } from '@/middleware/dataPermission';
import { validation } from '@/middleware/validation';
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
  validation(getFeedFormulasValidator),
  FeedingController.getFeedFormulas
);

router.get(
  '/formulas/:id',
  permission('feeding:read'),
  validation(getFeedFormulaValidator),
  FeedingController.getFeedFormula
);

router.post(
  '/formulas',
  permission('feeding:create'),
  validation(createFeedFormulaValidator),
  operationLog('创建饲料配方'),
  FeedingController.createFeedFormula
);

router.put(
  '/formulas/:id',
  permission('feeding:update'),
  validation(updateFeedFormulaValidator),
  operationLog('更新饲料配方'),
  FeedingController.updateFeedFormula
);

router.delete(
  '/formulas/:id',
  permission('feeding:delete'),
  validation(getFeedFormulaValidator),
  operationLog('删除饲料配方'),
  FeedingController.deleteFeedFormula
);

// Feeding Record routes
router.get(
  '/records',
  permission('feeding:read'),
  dataPermission('base_id'),
  validation(getFeedingRecordsValidator),
  FeedingController.getFeedingRecords
);

router.get(
  '/records/:id',
  permission('feeding:read'),
  validation(getFeedingRecordValidator),
  FeedingController.getFeedingRecord
);

router.post(
  '/records',
  permission('feeding:create'),
  dataPermission('base_id'),
  validation(createFeedingRecordValidator),
  operationLog('创建饲喂记录'),
  FeedingController.createFeedingRecord
);

router.put(
  '/records/:id',
  permission('feeding:update'),
  validation(updateFeedingRecordValidator),
  operationLog('更新饲喂记录'),
  FeedingController.updateFeedingRecord
);

router.delete(
  '/records/:id',
  permission('feeding:delete'),
  validation(getFeedingRecordValidator),
  operationLog('删除饲喂记录'),
  FeedingController.deleteFeedingRecord
);

// Batch operations
router.post(
  '/records/batch',
  permission('feeding:create'),
  validation(batchCreateFeedingRecordsValidator),
  operationLog('批量创建饲喂记录'),
  FeedingController.batchCreateFeedingRecords
);

// Statistics and analytics
router.get(
  '/statistics',
  permission('feeding:read'),
  dataPermission('base_id'),
  validation(getFeedingStatisticsValidator),
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
  validation(getFeedFormulaValidator),
  FeedingController.getFormulaEfficiency
);

// Feeding plans (future feature)
router.get(
  '/plans',
  permission('feeding:read'),
  dataPermission('base_id'),
  FeedingController.getFeedingPlans || ((req, res) => {
    res.status(501).json({
      success: false,
      message: '饲喂计划功能即将推出'
    });
  })
);

router.post(
  '/plans/generate',
  permission('feeding:create'),
  dataPermission('base_id'),
  operationLog('生成饲喂计划'),
  FeedingController.generateFeedingPlan
);

export default router;