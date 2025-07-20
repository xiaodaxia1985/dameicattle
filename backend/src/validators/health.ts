const { body, query, param } = require('express-validator');

// 健康记录验证规则
export const createHealthRecordValidation = [
  body('cattle_id')
    .isInt({ min: 1 })
    .withMessage('牛只ID必须是正整数'),
  
  body('symptoms')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('症状描述不能超过1000个字符'),
  
  body('diagnosis')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('诊断结果不能超过1000个字符'),
  
  body('treatment')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('治疗方案不能超过1000个字符'),
  
  body('veterinarian_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('兽医ID必须是正整数'),
  
  body('diagnosis_date')
    .isISO8601()
    .withMessage('诊断日期格式不正确'),
  
  body('status')
    .optional()
    .isIn(['ongoing', 'completed', 'cancelled'])
    .withMessage('状态必须是 ongoing、completed 或 cancelled')
];

export const updateHealthRecordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('健康记录ID必须是正整数'),
  
  body('symptoms')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('症状描述不能超过1000个字符'),
  
  body('diagnosis')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('诊断结果不能超过1000个字符'),
  
  body('treatment')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('治疗方案不能超过1000个字符'),
  
  body('veterinarian_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('兽医ID必须是正整数'),
  
  body('diagnosis_date')
    .optional()
    .isISO8601()
    .withMessage('诊断日期格式不正确'),
  
  body('status')
    .optional()
    .isIn(['ongoing', 'completed', 'cancelled'])
    .withMessage('状态必须是 ongoing、completed 或 cancelled')
];

// 疫苗接种记录验证规则
export const createVaccinationRecordValidation = [
  body('cattle_id')
    .isInt({ min: 1 })
    .withMessage('牛只ID必须是正整数'),
  
  body('vaccine_name')
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('疫苗名称不能为空且不能超过100个字符'),
  
  body('vaccination_date')
    .isISO8601()
    .withMessage('接种日期格式不正确'),
  
  body('next_due_date')
    .optional()
    .isISO8601()
    .withMessage('下次接种日期格式不正确'),
  
  body('veterinarian_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('兽医ID必须是正整数'),
  
  body('batch_number')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('批次号不能超过50个字符')
];

export const updateVaccinationRecordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('疫苗接种记录ID必须是正整数'),
  
  body('vaccine_name')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('疫苗名称不能为空且不能超过100个字符'),
  
  body('vaccination_date')
    .optional()
    .isISO8601()
    .withMessage('接种日期格式不正确'),
  
  body('next_due_date')
    .optional()
    .isISO8601()
    .withMessage('下次接种日期格式不正确'),
  
  body('veterinarian_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('兽医ID必须是正整数'),
  
  body('batch_number')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('批次号不能超过50个字符')
];

// 查询参数验证
export const getHealthRecordsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('cattle_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('牛只ID必须是正整数'),
  
  query('status')
    .optional()
    .isIn(['ongoing', 'completed', 'cancelled'])
    .withMessage('状态必须是 ongoing、completed 或 cancelled'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确'),
  
  query('veterinarian_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('兽医ID必须是正整数'),
  
  query('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数')
];

export const getVaccinationRecordsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  
  query('cattle_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('牛只ID必须是正整数'),
  
  query('vaccine_name')
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage('疫苗名称不能超过100个字符'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确'),
  
  query('veterinarian_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('兽医ID必须是正整数'),
  
  query('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  query('due_soon')
    .optional()
    .isBoolean()
    .withMessage('due_soon必须是布尔值')
];

export const getHealthStatisticsValidation = [
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
    .withMessage('结束日期格式不正确')
];

export const getCattleHealthProfileValidation = [
  param('cattle_id')
    .isInt({ min: 1 })
    .withMessage('牛只ID必须是正整数')
];

export const deleteHealthRecordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('健康记录ID必须是正整数')
];

export const deleteVaccinationRecordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('疫苗接种记录ID必须是正整数')
];