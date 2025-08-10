import { Router } from 'express';
import { ProcurementController } from '../controllers/ProcurementController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// 采购订单路由
router.get('/orders', dataPermissionMiddleware, ProcurementController.getProcurementOrders);
router.post('/orders', dataPermissionMiddleware, ProcurementController.createProcurementOrder);
router.put('/orders/:id', dataPermissionMiddleware, ProcurementController.updateProcurementOrder);
router.delete('/orders/:id', dataPermissionMiddleware, ProcurementController.deleteProcurementOrder);

// 供应商路由
router.get('/suppliers', ProcurementController.getSuppliers);
router.post('/suppliers', ProcurementController.createSupplier);
router.put('/suppliers/:id', ProcurementController.updateSupplier);
router.delete('/suppliers/:id', ProcurementController.deleteSupplier);

// 统计路由
router.get('/statistics', dataPermissionMiddleware, ProcurementController.getProcurementStatistics);

export default router;