import { Router } from 'express';
import { SalesOrderController } from '@/controllers/SalesOrderController';
import { salesOrderValidators } from '@/validators/salesOrder';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { validation } from '@/middleware/validation';

const router = Router();

// 所有路由都需要认证
router.use(auth);

// 获取销售订单列表
router.get('/', 
  salesOrderValidators.list,
  validation,
  permission('sales:read'),
  SalesOrderController.getSalesOrders
);

// 获取销售统计数据
router.get('/statistics',
  salesOrderValidators.statistics,
  validation,
  permission('sales:read'),
  SalesOrderController.getSalesStatistics
);

// 获取销售订单详情
router.get('/:id',
  salesOrderValidators.detail,
  validation,
  permission('sales:read'),
  SalesOrderController.getSalesOrder
);

// 创建销售订单
router.post('/',
  salesOrderValidators.create,
  validation,
  permission('sales:create'),
  SalesOrderController.createSalesOrder
);

// 更新销售订单
router.put('/:id',
  salesOrderValidators.update,
  validation,
  permission('sales:update'),
  SalesOrderController.updateSalesOrder
);

// 审批销售订单
router.post('/:id/approve',
  salesOrderValidators.approve,
  validation,
  permission('sales:approve'),
  SalesOrderController.approveSalesOrder
);

// 取消销售订单
router.post('/:id/cancel',
  salesOrderValidators.cancel,
  validation,
  permission('sales:update'),
  SalesOrderController.cancelSalesOrder
);

// 更新订单交付状态
router.post('/:id/delivery',
  salesOrderValidators.updateDelivery,
  validation,
  permission('sales:update'),
  SalesOrderController.updateDeliveryStatus
);

// 更新订单付款状态
router.post('/:id/payment',
  salesOrderValidators.updatePayment,
  validation,
  permission('sales:update'),
  SalesOrderController.updatePaymentStatus
);

export default router;