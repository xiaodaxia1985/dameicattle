import { Router } from 'express';
import { ProcurementOrderController } from '../controllers/ProcurementOrderController';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, ProcurementOrderController.getProcurementOrders);
router.post('/', authMiddleware, ProcurementOrderController.createProcurementOrder);
router.get('/:id', authMiddleware, ProcurementOrderController.getProcurementOrderById);
router.put('/:id', authMiddleware, ProcurementOrderController.updateProcurementOrder);
router.delete('/:id', authMiddleware, ProcurementOrderController.deleteProcurementOrder);

export default router;