import { Router } from 'express';
import { SalesController } from '../controllers/SalesController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// 销售订单路由
router.get('/orders', dataPermissionMiddleware, SalesController.getSalesOrders);
router.get('/orders/:id', dataPermissionMiddleware, SalesController.getSalesOrderById);
router.post('/orders', dataPermissionMiddleware, SalesController.createSalesOrder);
router.put('/orders/:id', dataPermissionMiddleware, SalesController.updateSalesOrder);
router.delete('/orders/:id', dataPermissionMiddleware, SalesController.deleteSalesOrder);

// 销售订单状态管理
router.post('/orders/:id/approve', dataPermissionMiddleware, SalesController.approveSalesOrder);
router.post('/orders/:id/cancel', dataPermissionMiddleware, SalesController.cancelSalesOrder);
router.post('/orders/:id/delivery', dataPermissionMiddleware, SalesController.updateDeliveryStatus);
router.post('/orders/:id/payment', dataPermissionMiddleware, SalesController.updatePaymentStatus);

// 客户路由
router.get('/customers', SalesController.getCustomers);
router.get('/customers/:id', SalesController.getCustomerById);
router.post('/customers', SalesController.createCustomer);
router.put('/customers/:id', SalesController.updateCustomer);
router.delete('/customers/:id', SalesController.deleteCustomer);

// 客户信用评级
router.put('/customers/:id/rating', SalesController.updateCustomerRating);

// 客户统计信息
router.get('/customers/:id/statistics', SalesController.getCustomerStatistics);

// 客户回访记录
router.get('/customers/:customerId/visits', SalesController.getCustomerVisits);
router.post('/customers/:customerId/visits', SalesController.createCustomerVisit);
router.put('/customers/visits/:id', SalesController.updateCustomerVisit);

// 客户类型管理
router.get('/customers/types', SalesController.getCustomerTypes);

// 客户价值分析
router.get('/customers/value-analysis', SalesController.getCustomerValueAnalysis);

// 基地和牛只数据（用于销售订单）
router.get('/bases', SalesController.getBases);
router.get('/cattle', SalesController.getCattle);

// 统计路由
router.get('/statistics', dataPermissionMiddleware, SalesController.getSalesStatistics);

export default router;