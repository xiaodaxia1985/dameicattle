import { body, query, param } from 'express-validator';

export const supplierValidators = {
  // 创建供应商验证
  create: [
    body('name')
      .notEmpty()
      .withMessage('供应商名称不能为空')
      .isLength({ max: 100 })
      .withMessage('供应商名称不能超过100个字符'),
    
    body('contact_person')
      .optional()
      .isLength({ max: 100 })
      .withMessage('联系人姓名不能超过100个字符'),
    
    body('phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('请输入有效的邮箱地址'),
    
    body('supplier_type')
      .optional()
      .isIn(['牛只供应商', '物资供应商', '设备供应商', '综合供应商'])
      .withMessage('供应商类型无效'),
    
    body('business_license')
      .optional()
      .isLength({ max: 100 })
      .withMessage('营业执照号不能超过100个字符'),
    
    body('tax_number')
      .optional()
      .isLength({ max: 100 })
      .withMessage('税号不能超过100个字符'),
    
    body('credit_limit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('信用额度必须大于等于0'),
    
    body('rating')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('评级必须在0-5之间')
  ],

  // 更新供应商验证
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数'),
    
    body('name')
      .optional()
      .notEmpty()
      .withMessage('供应商名称不能为空')
      .isLength({ max: 100 })
      .withMessage('供应商名称不能超过100个字符'),
    
    body('contact_person')
      .optional()
      .isLength({ max: 100 })
      .withMessage('联系人姓名不能超过100个字符'),
    
    body('phone')
      .optional()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('请输入有效的邮箱地址'),
    
    body('supplier_type')
      .optional()
      .isIn(['牛只供应商', '物资供应商', '设备供应商', '综合供应商'])
      .withMessage('供应商类型无效'),
    
    body('credit_limit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('信用额度必须大于等于0'),
    
    body('rating')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('评级必须在0-5之间'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('状态值无效')
  ],

  // 获取供应商列表验证
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    
    query('supplier_type')
      .optional()
      .isIn(['牛只供应商', '物资供应商', '设备供应商', '综合供应商'])
      .withMessage('供应商类型无效'),
    
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('状态值无效'),
    
    query('sort_by')
      .optional()
      .isIn(['id', 'name', 'rating', 'created_at', 'updated_at'])
      .withMessage('排序字段无效'),
    
    query('sort_order')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('排序方向无效')
  ],

  // 获取供应商详情验证
  detail: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数')
  ],

  // 删除供应商验证
  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数')
  ],

  // 供应商统计验证
  statistics: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数'),
    
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效')
  ],

  // 更新评级验证
  updateRating: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数'),
    
    body('rating')
      .isInt({ min: 0, max: 5 })
      .withMessage('评级必须在0-5之间'),
    
    body('comment')
      .optional()
      .isLength({ max: 500 })
      .withMessage('评价内容不能超过500个字符')
  ],

  // 供应商对比验证
  compare: [
    body('supplier_ids')
      .isArray({ min: 2 })
      .withMessage('请选择至少2个供应商进行对比'),
    
    body('supplier_ids.*')
      .isInt({ min: 1 })
      .withMessage('供应商ID必须是正整数'),
    
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效')
  ]
};