const { body, param, query } = require('express-validator');

export const createBarnValidator = [
  body('name')
    .notEmpty()
    .withMessage('牛棚名称不能为空')
    .isLength({ min: 2, max: 100 })
    .withMessage('牛棚名称长度必须在2-100个字符之间'),
  
  body('code')
    .notEmpty()
    .withMessage('牛棚编码不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('牛棚编码长度必须在2-50个字符之间')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('牛棚编码只能包含字母、数字、下划线和横线'),
  
  body('base_id')
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  body('capacity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('牛棚容量必须是1-1000之间的整数'),
  
  body('barn_type')
    .optional()
    .isIn(['育肥棚', '繁殖棚', '隔离棚', '治疗棚', '其他'])
    .withMessage('牛棚类型必须是：育肥棚、繁殖棚、隔离棚、治疗棚、其他之一'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述长度不能超过500个字符'),
  
  body('facilities')
    .optional()
    .isObject()
    .withMessage('设施信息必须是对象格式'),
];

export const updateBarnValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
  
  body('name')
    .optional()
    .notEmpty()
    .withMessage('牛棚名称不能为空')
    .isLength({ min: 2, max: 100 })
    .withMessage('牛棚名称长度必须在2-100个字符之间'),
  
  body('code')
    .optional()
    .notEmpty()
    .withMessage('牛棚编码不能为空')
    .isLength({ min: 2, max: 50 })
    .withMessage('牛棚编码长度必须在2-50个字符之间')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('牛棚编码只能包含字母、数字、下划线和横线'),
  
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('牛棚容量必须是1-1000之间的整数'),
  
  body('barn_type')
    .optional()
    .isIn(['育肥棚', '繁殖棚', '隔离棚', '治疗棚', '其他'])
    .withMessage('牛棚类型必须是：育肥棚、繁殖棚、隔离棚、治疗棚、其他之一'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述长度不能超过500个字符'),
  
  body('facilities')
    .optional()
    .isObject()
    .withMessage('设施信息必须是对象格式'),
];

export const getBarnValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
];

export const getBarnListValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  query('barn_type')
    .optional()
    .isIn(['育肥棚', '繁殖棚', '隔离棚', '治疗棚', '其他'])
    .withMessage('牛棚类型必须是：育肥棚、繁殖棚、隔离棚、治疗棚、其他之一'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('搜索关键词长度不能超过100个字符'),
];

export const deleteBarnValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
];

export const getBarnStatisticsValidator = [
  query('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确'),
];