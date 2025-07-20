import { body, query, param } from 'express-validator';

export const customerValidators = {
  // 创建客户验证
  create: [
    body('name')
      .notEmpty()
      .withMessage('客户名称不能为空')
      .isLength({ max: 100 })
      .withMessage('客户名称不能超过100个字符'),
    
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
    
    body('customer_type')
      .optional()
      .isIn(['个人', '企业', '经销商', '合作社'])
      .withMessage('客户类型无效'),
    
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
    
    body('credit_rating')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('信用评级必须在0-5之间')
  ],

  // 更新客户验证
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('客户ID必须是正整数'),
    
    body('name')
      .optional()
      .notEmpty()
      .withMessage('客户名称不能为空')
      .isLength({ max: 100 })
      .withMessage('客户名称不能超过100个字符'),
    
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
    
    body('customer_type')
      .optional()
      .isIn(['个人', '企业', '经销商', '合作社'])
      .withMessage('客户类型无效'),
    
    body('credit_limit')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('信用额度必须大于等于0'),
    
    body('credit_rating')
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage('信用评级必须在0-5之间'),
    
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('状态值无效')
  ],

  // 获取客户列表验证
  list: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    
    query('customer_type')
      .optional()
      .isIn(['个人', '企业', '经销商', '合作社'])
      .withMessage('客户类型无效'),
    
    query('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('状态值无效'),
    
    query('sort_by')
      .optional()
      .isIn(['id', 'name', 'credit_rating', 'created_at', 'updated_at'])
      .withMessage('排序字段无效'),
    
    query('sort_order')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('排序方向无效')
  ],

  // 获取客户详情验证
  detail: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('客户ID必须是正整数')
  ],

  // 删除客户验证
  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('客户ID必须是正整数')
  ],

  // 客户统计验证
  statistics: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('客户ID必须是正整数'),
    
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效')
  ],

  // 更新信用评级验证
  updateRating: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('客户ID必须是正整数'),
    
    body('credit_rating')
      .isInt({ min: 0, max: 5 })
      .withMessage('信用评级必须在0-5之间'),
    
    body('comment')
      .optional()
      .isLength({ max: 500 })
      .withMessage('评价内容不能超过500个字符')
  ],

  // 客户价值分析验证
  valueAnalysis: [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效')
  ],

  // 获取回访记录列表验证
  visitList: [
    param('customer_id')
      .isInt({ min: 1 })
      .withMessage('客户ID必须是正整数'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('页码必须是正整数'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('每页数量必须在1-100之间'),
    
    query('visit_type')
      .optional()
      .isIn(['电话回访', '实地拜访', '邮件回访', '微信回访'])
      .withMessage('回访类型无效'),
    
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('开始日期格式无效'),
    
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('结束日期格式无效')
  ],

  // 创建回访记录验证
  createVisit: [
    param('customer_id')
      .isInt({ min: 1 })
      .withMessage('客户ID必须是正整数'),
    
    body('visit_date')
      .isISO8601()
      .withMessage('回访日期格式无效'),
    
    body('visit_type')
      .isIn(['电话回访', '实地拜访', '邮件回访', '微信回访'])
      .withMessage('回访类型无效'),
    
    body('purpose')
      .notEmpty()
      .withMessage('回访目的不能为空')
      .isLength({ max: 200 })
      .withMessage('回访目的不能超过200个字符'),
    
    body('content')
      .notEmpty()
      .withMessage('回访内容不能为空')
      .isLength({ max: 1000 })
      .withMessage('回访内容不能超过1000个字符'),
    
    body('result')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('回访结果不能超过1000个字符'),
    
    body('next_visit_date')
      .optional()
      .isISO8601()
      .withMessage('下次回访日期格式无效')
  ],

  // 更新回访记录验证
  updateVisit: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('回访记录ID必须是正整数'),
    
    body('visit_date')
      .optional()
      .isISO8601()
      .withMessage('回访日期格式无效'),
    
    body('visit_type')
      .optional()
      .isIn(['电话回访', '实地拜访', '邮件回访', '微信回访'])
      .withMessage('回访类型无效'),
    
    body('purpose')
      .optional()
      .notEmpty()
      .withMessage('回访目的不能为空')
      .isLength({ max: 200 })
      .withMessage('回访目的不能超过200个字符'),
    
    body('content')
      .optional()
      .notEmpty()
      .withMessage('回访内容不能为空')
      .isLength({ max: 1000 })
      .withMessage('回访内容不能超过1000个字符'),
    
    body('result')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('回访结果不能超过1000个字符'),
    
    body('next_visit_date')
      .optional()
      .isISO8601()
      .withMessage('下次回访日期格式无效'),
    
    body('status')
      .optional()
      .isIn(['planned', 'completed', 'cancelled'])
      .withMessage('状态值无效')
  ]
};