import { body, query, param } from 'express-validator';

export const purchaseOrderValidators = {
  // 创建采购订单验证
  create: [
    body('supplier_id')
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数'),
    
    body('base_id')
      .isInt({ min: 1 })
      .withMessage('基地ID必须是正整数'),
    
    body('order_type')
      .isIn(['cattle', 'material', 'equipment', 'mixed'])
      .withMessage('订单类型无效'),
    
    body('expected_delivery_date')
      .optional()
      .isISO8601()
      .withMessage('预期交付日期格式无效'),
    
    body('payment_method')
      .optional()
      .isIn(['现金', '银行转账', '支票', '承兑汇票', '信用证'])
      .withMessage('付款方式无效'),
    
    body('contract_number')
      .optional()
      .isLength({ max: 100 })
      .withMessage('合同编号不能超过100个字符'),
    
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
    
    body('items.*.item_type')
      .isIn(['cattle', 'material', 'equipment'])
      .withMessage('物品类型无效'),
    
    body('items.*.item_name')
      .notEmpty()
      .withMessage('物品名称不能为空')
      .isLength({ max: 200 })
      .withMessage('物品名称不能超过200个字符'),
    
    body('items.*.quantity')
      .isFloat({ min: 0.01 })
      .withMessage('数量必须大于0'),
    
    body('items.*.unit')
      .notEmpty()
      .withMessage('单位不能为空')
      .isLength({ max: 20 })
      .withMessage('单位不能超过20个字符'),
    
    body('items.*.unit_price')
      .isFloat({ min: 0 })
      .withMessage('单价必须大于等于0'),
    
    body('items.*.item_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('物品ID必须是正整数')
  ],

  // 更新采购订单验证
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数'),
    
    body('supplier_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数'),
    
    body('base_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('基地ID必须是正整数'),
    
    body('order_type')
      .optional()
      .isIn(['cattle', 'material', 'equipment', 'mixed'])
      .withMessage('订单类型无效'),
    
    body('expected_delivery_date')
      .optional()
      .isISO8601()
      .withMessage('预期交付日期格式无效'),
    
    body('payment_method')
      .optional()
      .isIn(['现金', '银行转账', '支票', '承兑汇票', '信用证'])
      .withMessage('付款方式无效'),
    
    body('payment_status')
      .optional()
      .isIn(['unpaid', 'partial_paid', 'paid'])
      .withMessage('付款状态无效'),
    
    body('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'partial_received', 'completed', 'cancelled'])
      .withMessage('订单状态无效'),
    
    body('items')
      .optional()
      .isArray({ min: 1 })
      .withMessage('订单明细不能为空'),
    
    body('items.*.item_type')
      .optional()
      .isIn(['cattle', 'material', 'equipment'])
      .withMessage('物品类型无效'),
    
    body('items.*.item_name')
      .optional()
      .notEmpty()
      .withMessage('物品名称不能为空'),
    
    body('items.*.quantity')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('数量必须大于0'),
    
    body('items.*.unit_price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('单价必须大于等于0')
  ],

  // 获取采购订单列表验证
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    
    query('supplier_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数'),
    
    query('base_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('基地ID必须是正整数'),
    
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'partial_received', 'completed', 'cancelled'])
      .withMessage('订单状态无效'),
    
    query('order_type')
      .optional()
      .isIn(['cattle', 'material', 'equipment', 'mixed'])
      .withMessage('订单类型无效'),
    
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
      .isIn(['id', 'order_number', 'order_date', 'total_amount', 'status', 'created_at'])
      .withMessage('排序字段无效'),
    
    query('sort_order')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('排序方向无效')
  ],

  // 获取订单详情验证
  detail: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数')
  ],

  // 删除订单验证
  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数')
  ],

  // 审批订单验证
  approve: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数'),
    
    body('action')
      .isIn(['approve', 'reject'])
      .withMessage('审批操作无效'),
    
    body('comment')
      .optional()
      .isLength({ max: 500 })
      .withMessage('审批意见不能超过500个字符')
  ],

  // 确认收货验证
  confirmReceipt: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('订单ID必须是正整数'),
    
    body('actual_delivery_date')
      .optional()
      .isISO8601()
      .withMessage('实际交付日期格式无效'),
    
    body('items')
      .isArray({ min: 1 })
      .withMessage('收货明细不能为空'),
    
    body('items.*.id')
      .isInt({ min: 1 })
      .withMessage('明细ID必须是正整数'),
    
    body('items.*.received_quantity')
      .isFloat({ min: 0 })
      .withMessage('收货数量必须大于等于0'),
    
    body('items.*.quality_status')
      .optional()
      .isIn(['pending', 'passed', 'failed'])
      .withMessage('质量状态无效')
  ],

  // 采购统计验证
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
      .withMessage('基地ID必须是正整数'),
    
    query('supplier_id')
      .optional()
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数')
  ]
};