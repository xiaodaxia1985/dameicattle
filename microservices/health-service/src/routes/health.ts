import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication and data permission middleware to all routes
router.use(authMiddleware);
router.use(dataPermissionMiddleware);

// Health record routes
router.get('/records', HealthController.getHealthRecords);
router.post('/records', HealthController.createHealthRecord);
router.put('/records/:id', HealthController.updateHealthRecord);
router.delete('/records/:id', HealthController.deleteHealthRecord);

// Statistics routes
router.get('/statistics', HealthController.getHealthStatistics);

export default router;