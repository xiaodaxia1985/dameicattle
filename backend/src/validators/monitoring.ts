import { body, param, query } from 'express-validator';

// 创建警报规则验证
export const createAlertRuleValidation = [
  body('name')
    .notEmpty()
    .withMessage('规则名称不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('规则名称长度必须在1-100字符之间'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述长度不能超过500字符'),
  
  body('metric')
    .notEmpty()
    .withMessage('监控指标不能为空')
    .matches(/^[a-zA-Z_][a-zA-Z0-9_.]*$/)
    .withMessage('监控指标格式不正确'),
  
  body('operator')
    .isIn(['>', '<', '>=', '<=', '==', '!='])
    .withMessage('操作符必须是 >, <, >=, <=, ==, != 中的一个'),
  
  body('threshold')
    .isNumeric()
    .withMessage('阈值必须是数字'),
  
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('严重程度必须是 low, medium, high, critical 中的一个'),
  
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('启用状态必须是布尔值'),
  
  body('cooldown_minutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('冷却时间必须是1-1440分钟之间的整数'),
  
  body('notification_channels')
    .isArray()
    .withMessage('通知渠道必须是数组')
    .custom((channels) => {
      const validChannels = ['email', 'sms', 'log', 'webhook'];
      return channels.every((channel: string) => validChannels.includes(channel));
    })
    .withMessage('通知渠道只能包含 email, sms, log, webhook')
];

// 更新警报规则验证
export const updateAlertRuleValidation = [
  param('id')
    .notEmpty()
    .withMessage('规则ID不能为空'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('规则名称长度必须在1-100字符之间'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述长度不能超过500字符'),
  
  body('metric')
    .optional()
    .matches(/^[a-zA-Z_][a-zA-Z0-9_.]*$/)
    .withMessage('监控指标格式不正确'),
  
  body('operator')
    .optional()
    .isIn(['>', '<', '>=', '<=', '==', '!='])
    .withMessage('操作符必须是 >, <, >=, <=, ==, != 中的一个'),
  
  body('threshold')
    .optional()
    .isNumeric()
    .withMessage('阈值必须是数字'),
  
  body('severity')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('严重程度必须是 low, medium, high, critical 中的一个'),
  
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('启用状态必须是布尔值'),
  
  body('cooldown_minutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('冷却时间必须是1-1440分钟之间的整数'),
  
  body('notification_channels')
    .optional()
    .isArray()
    .withMessage('通知渠道必须是数组')
    .custom((channels) => {
      const validChannels = ['email', 'sms', 'log', 'webhook'];
      return channels.every((channel: string) => validChannels.includes(channel));
    })
    .withMessage('通知渠道只能包含 email, sms, log, webhook')
];

// 确认警报验证
export const acknowledgeAlertValidation = [
  param('id')
    .notEmpty()
    .withMessage('警报ID不能为空')
];

// 解决警报验证
export const resolveAlertValidation = [
  param('id')
    .notEmpty()
    .withMessage('警报ID不能为空')
];

// 获取健康历史验证
export const getHealthHistoryValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('限制数量必须是1-1000之间的整数')
];

// 获取所有警报验证
export const getAllAlertsValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('限制数量必须是1-1000之间的整数')
];

// 删除警报规则验证
export const deleteAlertRuleValidation = [
  param('id')
    .notEmpty()
    .withMessage('规则ID不能为空')
];

// 系统健康检查验证（无需特殊验证）
export const getSystemHealthValidation = [];

// 系统指标验证（无需特殊验证）
export const getSystemMetricsValidation = [];

// 仪表盘数据验证（无需特殊验证）
export const getDashboardDataValidation = [];

// 获取警报规则验证（无需特殊验证）
export const getAlertRulesValidation = [];

// 获取活跃警报验证（无需特殊验证）
export const getActiveAlertsValidation = [];