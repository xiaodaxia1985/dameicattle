import { Router } from 'express';
import { FeedingController } from '../controllers/FeedingController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Feeding record routes
router.get('/records', dataPermissionMiddleware, FeedingController.getFeedingRecords);
router.get('/records/:id', dataPermissionMiddleware, FeedingController.getFeedingRecordById);
router.post('/records', dataPermissionMiddleware, FeedingController.createFeedingRecord);
router.put('/records/:id', dataPermissionMiddleware, FeedingController.updateFeedingRecord);
router.delete('/records/:id', dataPermissionMiddleware, FeedingController.deleteFeedingRecord);

// Feed formula routes
router.get('/formulas', dataPermissionMiddleware, FeedingController.getFormulas);
router.get('/formulas/:id', dataPermissionMiddleware, FeedingController.getFormulaById);
router.post('/formulas', dataPermissionMiddleware, FeedingController.createFormula);
router.put('/formulas/:id', dataPermissionMiddleware, FeedingController.updateFormula);
router.delete('/formulas/:id', dataPermissionMiddleware, FeedingController.deleteFormula);

// Statistics and analysis routes
router.get('/statistics', dataPermissionMiddleware, FeedingController.getFeedingStatistics);
router.get('/efficiency', dataPermissionMiddleware, FeedingController.getFeedingEfficiency);
router.get('/trend', dataPermissionMiddleware, FeedingController.getFeedingTrend);

export default router;