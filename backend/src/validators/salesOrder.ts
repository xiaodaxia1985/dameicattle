import { body, query, param } from 'express-validator';

export const salesOrderValidators = {
  // 创建销售订单验证
  create: [
    body('customer_id')
      .isInt({ min: 1 })
      .withMessage('客户ID必须是正整数'),
    
    body('base_id')
      .isInt({ min: 1 })
      .withMessage('基地ID必须是正整数'),
    
    body('order_date')
      .isISO8601()
      .withMessage('订单日期格式无效'),
    
    body('delivery_date')
      .optional()
      .isISO8601()
      .withMessage('预计交付日期格式无效'),
    
    body('payment_method')
      .optional()
      .isIn(['cash', 'transfer', 'check', 'credit'])
      .withMessage('付款方式无效'),
    
    body('tax_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('税额必须大于等于0'),
    
    body('discount_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('折扣金额必须大于等于0'),
    
    body('items')
      .isArray({ min: 1 })
      .withMessage('订单明细不能为空'),
    
    body('items.*.cattle_id')
      .isInt({ min: 1 })
      .withMessage('牛只ID必须是正整数'),
    
    body('items.*.unit_price')
      .isFloat({ min: 0 })
      .withMessage('单价必须大于等于0')
  ],

  // 更新销售订单验证
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数'),
    
    body('delivery_date')
      .optional()
      .isISO8601()
      .withMessage('预计交付日期格式无效'),
    
    body('payment_method')
      .optional()
      .isIn(['cash', 'transfer', 'check', 'credit'])
      .withMessage('付款方式无效'),
    
    body('tax_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('税额必须大于等于0'),
    
    body('discount_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('折扣金额必须大于等于0'),
    
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('订单明细不能为空'),
    
    body('items.*.cattle_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('牛只ID必须是正整数'),
    
    body('items.*.unit_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('单价必须大于等于0')
  ],

  // 获取销售订单列表验证
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    
    query('customer_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('客户ID必须是正整数'),
    
    query('base_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('基地ID必须是正整数'),
    
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'delivered', 'completed', 'cancelled'])
      .withMessage('订单状态无效'),
    
    query('payment_status')
      .optional()
      .isIn(['unpaid', 'partial', 'paid'])
      .withMessage('付款状态无效'),
    
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效'),
    
    query('sort_by')
      .optional()
      .isIn(['id', 'order_number', 'total_amount', 'order_date', 'created_at', 'updated_at'])
      .withMessage('排序字段无效'),
    
    query('sort_order')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('排序方向无效')
  ],

  // 获取销售订单详情验证
  detail: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数')
  ],

  // 审批销售订单验证
  approve: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数')
  ],

  // 取消销售订单验证
  cancel: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数'),
    
    body('reason')
      .notEmpty()
      .withMessage('取消原因不能为空')
      .isLength({ max: 500 })
      .withMessage('取消原因不能超过500个字符')
  ],

  // 更新订单交付状态验证
  updateDelivery: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数'),
    
    body('actual_delivery_date')
      .optional()
      .isISO8601()
      .withMessage('实际交付日期格式无效'),
    
    body('logistics_company')
      .optional()
      .isLength({ max: 100 })
      .withMessage('物流公司名称不能超过100个字符'),
    
    body('tracking_number')
      .optional()
      .isLength({ max: 100 })
      .withMessage('物流单号不能超过100个字符'),
    
    body('delivery_items')
      .optional()
      .isArray()
      .withMessage('交付明细必须是数组'),
    
    body('delivery_items.*.id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('明细ID必须是正整数')
  ],

  // 更新订单付款状态验证
  updatePayment: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数'),
    
    body('payment_status')
      .isIn(['unpaid', 'partial', 'paid'])
      .withMessage('付款状态无效'),
    
    body('payment_method')
      .optional()
      .isIn(['cash', 'transfer', 'check', 'credit'])
      .withMessage('付款方式无效'),
    
    body('payment_date')
      .optional()
      .isISO8601()
      .withMessage('付款日期格式无效'),
    
    body('payment_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('付款金额必须大于等于0'),
    
    body('payment_reference')
      .optional()
      .isLength({ max: 100 })
      .withMessage('付款参考号不能超过100个字符')
  ],

  // 获取销售统计数据验证
  statistics: [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效'),
    
    query('base_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('基地ID必须是正整数')
  ]
};