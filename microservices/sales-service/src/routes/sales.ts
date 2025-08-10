import { Router } from 'express';
import { SalesController } from '../controllers/SalesController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// 销售订单路由
router.get('/orders', dataPermissionMiddleware, SalesController.getSalesOrders);
router.post('/orders', dataPermissionMiddleware, SalesController.createSalesOrder);
router.put('/orders/:id', dataPermissionMiddleware, SalesController.updateSalesOrder);
router.delete('/orders/:id', dataPermissionMiddleware, SalesController.deleteSalesOrder);

// 客户路由
router.get('/customers', SalesController.getCustomers);
router.post('/customers', SalesController.createCustomer);
router.put('/customers/:id', SalesController.updateCustomer);
router.delete('/customers/:id', SalesController.deleteCustomer);

// 统计路由
router.get('/statistics', dataPermissionMiddleware, SalesController.getSalesStatistics);

export default router;