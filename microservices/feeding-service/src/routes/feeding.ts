import { Router } from 'express';
import { FeedingController } from '../controllers/FeedingController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Feed Formula routes
router.get('/formulas', FeedingController.getFeedFormulas);
router.get('/formulas/:id', FeedingController.getFeedFormula);
router.post('/formulas', FeedingController.createFeedFormula);
router.put('/formulas/:id', FeedingController.updateFeedFormula);
router.delete('/formulas/:id', FeedingController.deleteFeedFormula);

// Feeding Record routes
router.get('/records', dataPermissionMiddleware, FeedingController.getFeedingRecords);
router.post('/records', dataPermissionMiddleware, FeedingController.createFeedingRecord);

// Statistics routes
router.get('/statistics', dataPermissionMiddleware, FeedingController.getFeedingStatistics);

export default router;