import { Router } from 'express';
import { PurchaseOrderController } from '@/controllers/PurchaseOrderController';
import { purchaseOrderValidators } from '@/validators/purchaseOrder';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { validation } from '@/middleware/validation';

const router = Router();

// 所有路由都需要认证
router.use(auth);

// 获取采购订单列表
router.get('/',
  purchaseOrderValidators.list,
  validation,
  permission('purchase_order:read'),
  PurchaseOrderController.getPurchaseOrders
);

// 获取待处理订单
router.get('/pending',
  permission('purchase_order:read'),
  PurchaseOrderController.getPendingOrders
);

// 获取采购统计
router.get('/statistics',
  purchaseOrderValidators.statistics,
  validation,
  permission('purchase_order:read'),
  PurchaseOrderController.getPurchaseStatistics
);

// 获取采购订单详情
router.get('/:id',
  purchaseOrderValidators.detail,
  validation,
  permission('purchase_order:read'),
  PurchaseOrderController.getPurchaseOrder
);

// 创建采购订单
router.post('/',
  purchaseOrderValidators.create,
  validation,
  permission('purchase_order:create'),
  PurchaseOrderController.createPurchaseOrder
);

// 更新采购订单
router.put('/:id',
  purchaseOrderValidators.update,
  validation,
  permission('purchase_order:update'),
  PurchaseOrderController.updatePurchaseOrder
);

// 删除采购订单
router.delete('/:id',
  purchaseOrderValidators.delete,
  validation,
  permission('purchase_order:delete'),
  PurchaseOrderController.deletePurchaseOrder
);

// 审批采购订单
router.post('/:id/approve',
  purchaseOrderValidators.approve,
  validation,
  permission('purchase_order:approve'),
  PurchaseOrderController.approvePurchaseOrder
);

// 确认收货
router.post('/:id/receipt',
  purchaseOrderValidators.confirmReceipt,
  validation,
  permission('purchase_order:receipt'),
  PurchaseOrderController.confirmReceipt
);

export default router;