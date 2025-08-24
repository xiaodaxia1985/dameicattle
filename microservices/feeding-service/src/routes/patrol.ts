import { Router } from 'express';
import { PatrolController } from '../controllers/PatrolController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Patrol record routes
router.get('/records', dataPermissionMiddleware, PatrolController.getPatrolRecords);
router.get('/records/:id', dataPermissionMiddleware, PatrolController.getPatrolRecordById);
router.post('/records', dataPermissionMiddleware, PatrolController.createPatrolRecord);
router.put('/records/:id', dataPermissionMiddleware, PatrolController.updatePatrolRecord);
router.delete('/records/:id', dataPermissionMiddleware, PatrolController.deletePatrolRecord);

// Statistics and analysis routes
router.get('/statistics', dataPermissionMiddleware, PatrolController.getPatrolStatistics);
router.get('/tasks/today', dataPermissionMiddleware, PatrolController.getTodayPatrolTasks);

// IoT device data routes
router.get('/iot/device-data', dataPermissionMiddleware, PatrolController.getIoTDeviceData);

export default router;