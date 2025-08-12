import { Router } from 'express';
import { ProcurementController } from '../controllers/ProcurementController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// 采购订单路由
router.get('/orders', dataPermissionMiddleware, ProcurementController.getProcurementOrders);
router.get('/orders/:id', dataPermissionMiddleware, ProcurementController.getProcurementOrderById);
router.post('/orders', dataPermissionMiddleware, ProcurementController.createProcurementOrder);
router.put('/orders/:id', dataPermissionMiddleware, ProcurementController.updateProcurementOrder);
router.delete('/orders/:id', dataPermissionMiddleware, ProcurementController.deleteProcurementOrder);

// 采购订单状态管理
router.post('/orders/:id/approve', dataPermissionMiddleware, ProcurementController.approveProcurementOrder);
router.post('/orders/:id/cancel', dataPermissionMiddleware, ProcurementController.cancelProcurementOrder);
router.post('/orders/:id/delivery', dataPermissionMiddleware, ProcurementController.confirmDelivery);

// 供应商路由
router.get('/suppliers', ProcurementController.getSuppliers);
router.get('/suppliers/:id', ProcurementController.getSupplierById);
router.post('/suppliers', ProcurementController.createSupplier);
router.put('/suppliers/:id', ProcurementController.updateSupplier);
router.delete('/suppliers/:id', ProcurementController.deleteSupplier);

// 供应商统计和评价
router.get('/suppliers/:id/statistics', ProcurementController.getSupplierStatistics);

// 采购趋势分析
router.get('/trend', dataPermissionMiddleware, ProcurementController.getProcurementTrend);

// 导出功能
router.get('/orders/export', dataPermissionMiddleware, ProcurementController.exportProcurementOrders);
router.get('/suppliers/export', ProcurementController.exportSuppliers);

// 统计路由
router.get('/statistics', dataPermissionMiddleware, ProcurementController.getProcurementStatistics);

export default router;