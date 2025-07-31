import { Router } from 'express';
import { FeedingController } from '@/controllers/FeedingController';
import { requirePermission } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { dataPermissionMiddleware } from '@/middleware/dataPermission';
import { operationLogMiddleware } from '@/middleware/operationLog';
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

// Feed Formula routes
router.get(
  '/formulas',
  requirePermission('feeding:read'),
  ...getFeedFormulasValidator,
  validate,
  FeedingController.getFeedFormulas
);

router.get(
  '/formulas/:id',
  requirePermission('feeding:read'),
  ...getFeedFormulaValidator,
  validate,
  FeedingController.getFeedFormula
);

router.post(
  '/formulas',
  requirePermission('feeding:create'),
  ...createFeedFormulaValidator,
  validate,
  operationLogMiddleware('create', 'feed_formula'),
  FeedingController.createFeedFormula
);

router.put(
  '/formulas/:id',
  requirePermission('feeding:update'),
  ...updateFeedFormulaValidator,
  validate,
  operationLogMiddleware('update', 'feed_formula'),
  FeedingController.updateFeedFormula
);

router.delete(
  '/formulas/:id',
  requirePermission('feeding:delete'),
  ...getFeedFormulaValidator,
  validate,
  operationLogMiddleware('delete', 'feed_formula'),
  FeedingController.deleteFeedFormula
);

// Feeding Record routes
router.get(
  '/records',
  requirePermission('feeding:read'),
  dataPermissionMiddleware,
  ...getFeedingRecordsValidator,
  validate,
  FeedingController.getFeedingRecords
);

router.get(
  '/records/:id',
  requirePermission('feeding:read'),
  ...getFeedingRecordValidator,
  validate,
  FeedingController.getFeedingRecord
);

router.post(
  '/records',
  requirePermission('feeding:create'),
  dataPermissionMiddleware,
  ...createFeedingRecordValidator,
  validate,
  operationLogMiddleware('create', 'feeding_record'),
  FeedingController.createFeedingRecord
);

router.put(
  '/records/:id',
  requirePermission('feeding:update'),
  ...updateFeedingRecordValidator,
  validate,
  operationLogMiddleware('update', 'feeding_record'),
  FeedingController.updateFeedingRecord
);

router.delete(
  '/records/:id',
  requirePermission('feeding:delete'),
  ...getFeedingRecordValidator,
  validate,
  operationLogMiddleware('delete', 'feeding_record'),
  FeedingController.deleteFeedingRecord
);

// Batch operations
router.post(
  '/records/batch',
  requirePermission('feeding:create'),
  ...batchCreateFeedingRecordsValidator,
  validate,
  operationLogMiddleware('create', 'feeding_records_batch'),
  FeedingController.batchCreateFeedingRecords
);

// Statistics and analytics
router.get(
  '/statistics',
  requirePermission('feeding:read'),
  dataPermissionMiddleware,
  ...getFeedingStatisticsValidator,
  validate,
  FeedingController.getFeedingStatistics
);

// Feeding recommendations
router.get(
  '/recommendations',
  requirePermission('feeding:read'),
  dataPermissionMiddleware,
  FeedingController.getFeedingRecommendations
);

// Formula efficiency analysis
router.get(
  '/formulas/:id/efficiency',
  requirePermission('feeding:read'),
  ...getFeedFormulaValidator,
  validate,
  FeedingController.getFormulaEfficiency
);

// Feeding plans (future feature)
router.get(
  '/plans',
  requirePermission('feeding:read'),
  dataPermissionMiddleware,
  (req, res) => {
    res.status(501).json({
      success: false,
      message: '饲喂计划功能即将推出'
    });
  }
);

router.post(
  '/plans/generate',
  requirePermission('feeding:create'),
  dataPermissionMiddleware,
  operationLogMiddleware('create', 'feeding_plan'),
  FeedingController.generateFeedingPlan
);

export default router;