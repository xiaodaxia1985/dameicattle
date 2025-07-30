import { Router } from 'express';
import { SalesOrderController } from '@/controllers/SalesOrderController';
import { salesOrderValidators } from '@/validators/salesOrder';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { dataPermissionMiddleware } from '@/middleware/dataPermission';
import { validate } from '@/middleware/validation';

const router = Router();

// 所有路由都需要认证和数据权限检查
router.use(auth);
router.use(dataPermissionMiddleware);

// 获取销售订单列表
router.get('/', 
  salesOrderValidators.list,
  validate(salesOrderValidators.list),
  permission('sales:read'),
  SalesOrderController.getSalesOrders
);

// 获取销售统计数据
router.get('/statistics',
  salesOrderValidators.statistics,
  validate(salesOrderValidators.statistics),
  permission('sales:read'),
  SalesOrderController.getSalesStatistics
);

// 获取销售订单详情
router.get('/:id',
  salesOrderValidators.detail,
  validate(salesOrderValidators.detail),
  permission('sales:read'),
  SalesOrderController.getSalesOrder
);

// 创建销售订单
router.post('/',
  salesOrderValidators.create,
  validate(salesOrderValidators.create),
  permission('sales:create'),
  SalesOrderController.createSalesOrder
);

// 更新销售订单
router.put('/:id',
  salesOrderValidators.update,
  validate(salesOrderValidators.update),
  permission('sales:update'),
  SalesOrderController.updateSalesOrder
);

// 审批销售订单
router.post('/:id/approve',
  salesOrderValidators.approve,
  validate(salesOrderValidators.approve),
  permission('sales:approve'),
  SalesOrderController.approveSalesOrder
);

// 取消销售订单
router.post('/:id/cancel',
  salesOrderValidators.cancel,
  validate(salesOrderValidators.cancel),
  permission('sales:update'),
  SalesOrderController.cancelSalesOrder
);

// 更新订单交付状态
router.post('/:id/delivery',
  salesOrderValidators.updateDelivery,
  validate(salesOrderValidators.updateDelivery),
  permission('sales:update'),
  SalesOrderController.updateDeliveryStatus
);

// 更新订单付款状态
router.post('/:id/payment',
  salesOrderValidators.updatePayment,
  validate(salesOrderValidators.updatePayment),
  permission('sales:update'),
  SalesOrderController.updatePaymentStatus
);

export default router;