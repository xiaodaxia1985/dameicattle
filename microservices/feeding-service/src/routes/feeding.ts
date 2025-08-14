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
router.get('/records/:id', dataPermissionMiddleware, FeedingController.getFeedingRecordById);
router.post('/records', dataPermissionMiddleware, FeedingController.createFeedingRecord);
router.put('/records/:id', dataPermissionMiddleware, FeedingController.updateFeedingRecord);
router.delete('/records/:id', dataPermissionMiddleware, FeedingController.deleteFeedingRecord);

// Feeding Plan routes (TODO: 待实现)
// router.get('/plans', dataPermissionMiddleware, FeedingController.getFeedingPlans);
// router.get('/plans/:id', dataPermissionMiddleware, FeedingController.getFeedingPlanById);
// router.post('/plans', dataPermissionMiddleware, FeedingController.createFeedingPlan);
// router.put('/plans/:id', dataPermissionMiddleware, FeedingController.updateFeedingPlan);
// router.delete('/plans/:id', dataPermissionMiddleware, FeedingController.deleteFeedingPlan);
// router.post('/plans/generate', dataPermissionMiddleware, FeedingController.generateFeedingPlan);

// Feeding Trend Analysis routes (TODO: 待实现)
// router.get('/trend', dataPermissionMiddleware, FeedingController.getFeedingTrend);

// Statistics routes
router.get('/statistics', dataPermissionMiddleware, FeedingController.getFeedingStatistics);

// Patrol Record routes
import { PatrolController } from '../controllers/PatrolController';

router.get('/patrol/records', dataPermissionMiddleware, PatrolController.getPatrolRecords);
router.get('/patrol/records/:id', dataPermissionMiddleware, PatrolController.getPatrolRecordById);
router.post('/patrol/records', dataPermissionMiddleware, PatrolController.createPatrolRecord);
router.put('/patrol/records/:id', dataPermissionMiddleware, PatrolController.updatePatrolRecord);
router.delete('/patrol/records/:id', dataPermissionMiddleware, PatrolController.deletePatrolRecord);

// Patrol Statistics routes
router.get('/patrol/statistics', dataPermissionMiddleware, PatrolController.getPatrolStatistics);
router.get('/patrol/tasks/today', dataPermissionMiddleware, PatrolController.getTodayPatrolTasks);
router.get('/patrol/iot/device-data', dataPermissionMiddleware, PatrolController.getIoTDeviceData);

export default router;