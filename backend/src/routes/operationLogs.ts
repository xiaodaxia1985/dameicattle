import { Router } from 'express';
import { OperationLogController } from '@/controllers/OperationLogController';
import { requirePermission } from '@/middleware/auth';

const router = Router();
const operationLogController = new OperationLogController();

// GET /api/v1/operation-logs
router.get('/', requirePermission('system:logs'), operationLogController.getOperationLogs);

// GET /api/v1/operation-logs/statistics
router.get('/statistics', requirePermission('system:logs'), operationLogController.getOperationStatistics);

export default router;