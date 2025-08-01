const { body, param, query } = require('express-validator');

// 创建巡圈记录验证
export const createPatrolRecordValidator = [
  body('base_id')
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  body('barn_id')
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
  
  body('patrol_date')
    .isDate()
    .withMessage('巡圈日期格式不正确'),
  
  body('patrol_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('巡圈时间格式不正确，应为HH:MM格式'),
  
  body('patrol_type')
    .isIn(['before_feeding', 'after_feeding', 'routine'])
    .withMessage('巡圈类型必须是before_feeding、after_feeding或routine'),
  
  body('total_cattle_count')
    .isInt({ min: 0 })
    .withMessage('总牛只数必须是非负整数'),
  
  body('standing_cattle_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('站立牛只数必须是非负整数'),
  
  body('lying_cattle_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('躺卧牛只数必须是非负整数'),
  
  body('abnormal_cattle_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('异常牛只数必须是非负整数'),
  
  body('abnormal_cattle_description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('异常牛只描述不能超过1000字符'),
  
  body('feed_trough_clean')
    .optional()
    .isBoolean()
    .withMessage('草料槽清洁状态必须是布尔值'),
  
  body('feed_trough_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('草料槽备注不能超过500字符'),
  
  body('water_trough_clean')
    .optional()
    .isBoolean()
    .withMessage('水槽清洁状态必须是布尔值'),
  
  body('water_trough_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('水槽备注不能超过500字符'),
  
  body('temperature')
    .optional()
    .isFloat({ min: -50, max: 60 })
    .withMessage('温度必须在-50到60摄氏度之间'),
  
  body('humidity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('湿度必须在0到100%之间'),
  
  body('environment_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('环境备注不能超过500字符'),
  
  body('iot_device_id')
    .optional()
    .isLength({ max: 100 })
    .withMessage('物联网设备ID不能超过100字符'),
  
  body('iot_data_source')
    .optional()
    .isIn(['manual', 'iot_sensor', 'api'])
    .withMessage('数据来源必须是manual、iot_sensor或api'),
  
  body('overall_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('总体备注不能超过1000字符'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('图片必须是数组格式'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('图片URL格式不正确'),
  
  // 自定义验证：站立数+躺卧数不能超过总数
  body().custom((value: any) => {
    const { total_cattle_count, standing_cattle_count, lying_cattle_count } = value;
    
    if (standing_cattle_count !== undefined && lying_cattle_count !== undefined) {
      if (standing_cattle_count + lying_cattle_count > total_cattle_count) {
        throw new Error('站立牛只数和躺卧牛只数之和不能超过总牛只数');
      }
    }
    
    if (lying_cattle_count !== undefined && lying_cattle_count > total_cattle_count) {
      throw new Error('躺卧牛只数不能超过总牛只数');
    }
    
    if (standing_cattle_count !== undefined && standing_cattle_count > total_cattle_count) {
      throw new Error('站立牛只数不能超过总牛只数');
    }
    
    return true;
  })
];

// 更新巡圈记录验证
export const updatePatrolRecordValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('记录ID必须是正整数'),
  
  body('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  body('barn_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
  
  body('patrol_date')
    .optional()
    .isDate()
    .withMessage('巡圈日期格式不正确'),
  
  body('patrol_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('巡圈时间格式不正确，应为HH:MM格式'),
  
  body('patrol_type')
    .optional()
    .isIn(['before_feeding', 'after_feeding', 'routine'])
    .withMessage('巡圈类型必须是before_feeding、after_feeding或routine'),
  
  body('total_cattle_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('总牛只数必须是非负整数'),
  
  body('standing_cattle_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('站立牛只数必须是非负整数'),
  
  body('lying_cattle_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('躺卧牛只数必须是非负整数'),
  
  body('abnormal_cattle_count')
    .optional()
    .isInt({ min: 0 })
    .withMessage('异常牛只数必须是非负整数'),
  
  body('abnormal_cattle_description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('异常牛只描述不能超过1000字符'),
  
  body('feed_trough_clean')
    .optional()
    .isBoolean()
    .withMessage('草料槽清洁状态必须是布尔值'),
  
  body('feed_trough_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('草料槽备注不能超过500字符'),
  
  body('water_trough_clean')
    .optional()
    .isBoolean()
    .withMessage('水槽清洁状态必须是布尔值'),
  
  body('water_trough_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('水槽备注不能超过500字符'),
  
  body('temperature')
    .optional()
    .isFloat({ min: -50, max: 60 })
    .withMessage('温度必须在-50到60摄氏度之间'),
  
  body('humidity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('湿度必须在0到100%之间'),
  
  body('environment_notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('环境备注不能超过500字符'),
  
  body('overall_notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('总体备注不能超过1000字符'),
  
  body('iot_device_id')
    .optional()
    .isLength({ max: 100 })
    .withMessage('物联网设备ID不能超过100字符'),
  
  body('iot_data_source')
    .optional()
    .isIn(['manual', 'iot_sensor', 'api'])
    .withMessage('数据来源必须是manual、iot_sensor或api'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('图片必须是数组格式'),
  
  body('images.*')
    .optional()
    .isURL()
    .withMessage('图片URL格式不正确'),
  
  // 自定义验证：站立数+躺卧数不能超过总数
  body().custom((value: any) => {
    const { total_cattle_count, standing_cattle_count, lying_cattle_count } = value;
    
    if (total_cattle_count !== undefined) {
      if (standing_cattle_count !== undefined && standing_cattle_count > total_cattle_count) {
        throw new Error('站立牛只数不能超过总牛只数');
      }
      
      if (lying_cattle_count !== undefined && lying_cattle_count > total_cattle_count) {
        throw new Error('躺卧牛只数不能超过总牛只数');
      }
      
      if (standing_cattle_count !== undefined && lying_cattle_count !== undefined) {
        if (standing_cattle_count + lying_cattle_count > total_cattle_count) {
          throw new Error('站立牛只数和躺卧牛只数之和不能超过总牛只数');
        }
      }
    }
    
    return true;
  })
];

// 获取单个巡圈记录验证
export const getPatrolRecordValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('记录ID必须是正整数')
];

// 获取巡圈记录列表验证
export const getPatrolRecordsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  
  query('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  query('barn_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
  
  query('patrol_type')
    .optional()
    .isIn(['before_feeding', 'after_feeding', 'routine'])
    .withMessage('巡圈类型必须是before_feeding、after_feeding或routine'),
  
  query('start_date')
    .optional()
    .isDate()
    .withMessage('开始日期格式不正确'),
  
  query('end_date')
    .optional()
    .isDate()
    .withMessage('结束日期格式不正确'),
  
  query('patrol_person_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('巡圈人员ID必须是正整数')
];

// 获取巡圈统计验证
export const getPatrolStatisticsValidator = [
  query('base_id')
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  query('start_date')
    .isDate()
    .withMessage('开始日期格式不正确'),
  
  query('end_date')
    .isDate()
    .withMessage('结束日期格式不正确'),
  
  // 自定义验证：结束日期不能早于开始日期
  query().custom((value: any) => {
    const { start_date, end_date } = value;
    if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
      throw new Error('结束日期不能早于开始日期');
    }
    return true;
  })
];