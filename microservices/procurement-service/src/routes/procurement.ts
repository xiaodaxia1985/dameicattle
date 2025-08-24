import { Router } from 'express';
import { ProcurementController } from '../controllers/ProcurementController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// 采购订单路由
router.get('/orders', authMiddleware, dataPermissionMiddleware, ProcurementController.getProcurementOrders);
router.post('/orders', authMiddleware, dataPermissionMiddleware, ProcurementController.createProcurementOrder);
router.get('/orders/:id', authMiddleware, dataPermissionMiddleware, ProcurementController.getProcurementOrderById);
router.put('/orders/:id', authMiddleware, dataPermissionMiddleware, ProcurementController.updateProcurementOrder);
router.delete('/orders/:id', authMiddleware, dataPermissionMiddleware, ProcurementController.deleteProcurementOrder);

// 订单操作
router.post('/orders/:id/approve', authMiddleware, dataPermissionMiddleware, ProcurementController.approveProcurementOrder);
router.post('/orders/:id/cancel', authMiddleware, dataPermissionMiddleware, ProcurementController.cancelProcurementOrder);
router.post('/orders/:id/confirm-delivery', authMiddleware, dataPermissionMiddleware, ProcurementController.confirmDelivery);

// 供应商路由
router.get('/suppliers', authMiddleware, ProcurementController.getSuppliers);
router.post('/suppliers', authMiddleware, ProcurementController.createSupplier);
router.get('/suppliers/:id', authMiddleware, ProcurementController.getSupplierById);
router.put('/suppliers/:id', authMiddleware, ProcurementController.updateSupplier);
router.delete('/suppliers/:id', authMiddleware, ProcurementController.deleteSupplier);

// 统计和报表
router.get('/suppliers/statistics', authMiddleware, ProcurementController.getSupplierStatistics);

// 趋势分析
router.get('/trend', authMiddleware, dataPermissionMiddleware, ProcurementController.getProcurementTrend);

// 导出功能
router.get('/export/orders', authMiddleware, dataPermissionMiddleware, ProcurementController.exportProcurementOrders);
router.get('/export/suppliers', authMiddleware, ProcurementController.exportSuppliers);

// 统计数据
router.get('/statistics', authMiddleware, dataPermissionMiddleware, ProcurementController.getProcurementStatistics);

export default router;