import Joi from 'joi';

export const equipmentValidation = {
  createCategory: Joi.object({
    name: Joi.string().max(100).required().messages({
      'string.empty': '分类名称不能为空',
      'string.max': '分类名称不能超过100个字符',
      'any.required': '分类名称是必填项',
    }),
    code: Joi.string().max(50).required().messages({
      'string.empty': '分类代码不能为空',
      'string.max': '分类代码不能超过50个字符',
      'any.required': '分类代码是必填项',
    }),
    description: Joi.string().allow('', null).messages({
      'string.base': '描述必须是字符串',
    }),
  }),

  updateCategory: Joi.object({
    name: Joi.string().max(100).required().messages({
      'string.empty': '分类名称不能为空',
      'string.max': '分类名称不能超过100个字符',
      'any.required': '分类名称是必填项',
    }),
    code: Joi.string().max(50).required().messages({
      'string.empty': '分类代码不能为空',
      'string.max': '分类代码不能超过50个字符',
      'any.required': '分类代码是必填项',
    }),
    description: Joi.string().allow('', null).messages({
      'string.base': '描述必须是字符串',
    }),
  }),

  createEquipment: Joi.object({
    name: Joi.string().max(100).required().messages({
      'string.empty': '设备名称不能为空',
      'string.max': '设备名称不能超过100个字符',
      'any.required': '设备名称是必填项',
    }),
    code: Joi.string().max(50).required().messages({
      'string.empty': '设备编码不能为空',
      'string.max': '设备编码不能超过50个字符',
      'any.required': '设备编码是必填项',
    }),
    category_id: Joi.number().integer().positive().required().messages({
      'number.base': '设备分类ID必须是数字',
      'number.integer': '设备分类ID必须是整数',
      'number.positive': '设备分类ID必须是正数',
      'any.required': '设备分类是必填项',
    }),
    base_id: Joi.number().integer().positive().required().messages({
      'number.base': '基地ID必须是数字',
      'number.integer': '基地ID必须是整数',
      'number.positive': '基地ID必须是正数',
      'any.required': '基地是必填项',
    }),
    barn_id: Joi.number().integer().positive().allow(null).messages({
      'number.base': '牛棚ID必须是数字',
      'number.integer': '牛棚ID必须是整数',
      'number.positive': '牛棚ID必须是正数',
    }),
    brand: Joi.string().max(100).allow('', null).messages({
      'string.max': '品牌不能超过100个字符',
    }),
    model: Joi.string().max(100).allow('', null).messages({
      'string.max': '型号不能超过100个字符',
    }),
    serial_number: Joi.string().max(100).allow('', null).messages({
      'string.max': '序列号不能超过100个字符',
    }),
    purchase_date: Joi.date().allow(null).messages({
      'date.base': '采购日期格式不正确',
    }),
    purchase_price: Joi.number().min(0).allow(null).messages({
      'number.base': '采购价格必须是数字',
      'number.min': '采购价格不能为负数',
    }),
    warranty_period: Joi.number().integer().min(0).allow(null).messages({
      'number.base': '保修期必须是数字',
      'number.integer': '保修期必须是整数',
      'number.min': '保修期不能为负数',
    }),
    installation_date: Joi.date().allow(null).messages({
      'date.base': '安装日期格式不正确',
    }),
    location: Joi.string().allow('', null).messages({
      'string.base': '安装位置必须是字符串',
    }),
    specifications: Joi.object().allow(null).messages({
      'object.base': '技术规格必须是对象格式',
    }),
    photos: Joi.object().allow(null).messages({
      'object.base': '照片信息必须是对象格式',
    }),
  }),

  updateEquipment: Joi.object({
    name: Joi.string().max(100).messages({
      'string.empty': '设备名称不能为空',
      'string.max': '设备名称不能超过100个字符',
    }),
    code: Joi.string().max(50).messages({
      'string.empty': '设备编码不能为空',
      'string.max': '设备编码不能超过50个字符',
    }),
    category_id: Joi.number().integer().positive().messages({
      'number.base': '设备分类ID必须是数字',
      'number.integer': '设备分类ID必须是整数',
      'number.positive': '设备分类ID必须是正数',
    }),
    base_id: Joi.number().integer().positive().messages({
      'number.base': '基地ID必须是数字',
      'number.integer': '基地ID必须是整数',
      'number.positive': '基地ID必须是正数',
    }),
    barn_id: Joi.number().integer().positive().allow(null).messages({
      'number.base': '牛棚ID必须是数字',
      'number.integer': '牛棚ID必须是整数',
      'number.positive': '牛棚ID必须是正数',
    }),
    brand: Joi.string().max(100).allow('', null).messages({
      'string.max': '品牌不能超过100个字符',
    }),
    model: Joi.string().max(100).allow('', null).messages({
      'string.max': '型号不能超过100个字符',
    }),
    serial_number: Joi.string().max(100).allow('', null).messages({
      'string.max': '序列号不能超过100个字符',
    }),
    purchase_date: Joi.date().allow(null).messages({
      'date.base': '采购日期格式不正确',
    }),
    purchase_price: Joi.number().min(0).allow(null).messages({
      'number.base': '采购价格必须是数字',
      'number.min': '采购价格不能为负数',
    }),
    warranty_period: Joi.number().integer().min(0).allow(null).messages({
      'number.base': '保修期必须是数字',
      'number.integer': '保修期必须是整数',
      'number.min': '保修期不能为负数',
    }),
    installation_date: Joi.date().allow(null).messages({
      'date.base': '安装日期格式不正确',
    }),
    status: Joi.string().valid('normal', 'maintenance', 'broken', 'retired').messages({
      'any.only': '设备状态必须是: normal, maintenance, broken, retired 中的一个',
    }),
    location: Joi.string().allow('', null).messages({
      'string.base': '安装位置必须是字符串',
    }),
    specifications: Joi.object().allow(null).messages({
      'object.base': '技术规格必须是对象格式',
    }),
    photos: Joi.object().allow(null).messages({
      'object.base': '照片信息必须是对象格式',
    }),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('normal', 'maintenance', 'broken', 'retired').required().messages({
      'any.only': '设备状态必须是: normal, maintenance, broken, retired 中的一个',
      'any.required': '设备状态是必填项',
    }),
  }),

  // Maintenance Plan Validations
  createMaintenancePlan: Joi.object({
    equipment_id: Joi.number().integer().positive().required().messages({
      'number.base': '设备ID必须是数字',
      'number.integer': '设备ID必须是整数',
      'number.positive': '设备ID必须是正数',
      'any.required': '设备ID是必填项',
    }),
    maintenance_type: Joi.string().max(50).required().messages({
      'string.empty': '维护类型不能为空',
      'string.max': '维护类型不能超过50个字符',
      'any.required': '维护类型是必填项',
    }),
    frequency_days: Joi.number().integer().min(1).required().messages({
      'number.base': '维护频率必须是数字',
      'number.integer': '维护频率必须是整数',
      'number.min': '维护频率必须大于0',
      'any.required': '维护频率是必填项',
    }),
    description: Joi.string().allow('', null).messages({
      'string.base': '描述必须是字符串',
    }),
    checklist: Joi.object().allow(null).messages({
      'object.base': '检查清单必须是对象格式',
    }),
  }),

  updateMaintenancePlan: Joi.object({
    maintenance_type: Joi.string().max(50).messages({
      'string.empty': '维护类型不能为空',
      'string.max': '维护类型不能超过50个字符',
    }),
    frequency_days: Joi.number().integer().min(1).messages({
      'number.base': '维护频率必须是数字',
      'number.integer': '维护频率必须是整数',
      'number.min': '维护频率必须大于0',
    }),
    description: Joi.string().allow('', null).messages({
      'string.base': '描述必须是字符串',
    }),
    checklist: Joi.object().allow(null).messages({
      'object.base': '检查清单必须是对象格式',
    }),
    is_active: Joi.boolean().messages({
      'boolean.base': '激活状态必须是布尔值',
    }),
  }),

  // Maintenance Record Validations
  createMaintenanceRecord: Joi.object({
    equipment_id: Joi.number().integer().positive().required().messages({
      'number.base': '设备ID必须是数字',
      'number.integer': '设备ID必须是整数',
      'number.positive': '设备ID必须是正数',
      'any.required': '设备ID是必填项',
    }),
    plan_id: Joi.number().integer().positive().allow(null).messages({
      'number.base': '维护计划ID必须是数字',
      'number.integer': '维护计划ID必须是整数',
      'number.positive': '维护计划ID必须是正数',
    }),
    maintenance_date: Joi.date().required().messages({
      'date.base': '维护日期格式不正确',
      'any.required': '维护日期是必填项',
    }),
    maintenance_type: Joi.string().max(50).required().messages({
      'string.empty': '维护类型不能为空',
      'string.max': '维护类型不能超过50个字符',
      'any.required': '维护类型是必填项',
    }),
    duration_hours: Joi.number().min(0).allow(null).messages({
      'number.base': '维护时长必须是数字',
      'number.min': '维护时长不能为负数',
    }),
    cost: Joi.number().min(0).allow(null).messages({
      'number.base': '维护成本必须是数字',
      'number.min': '维护成本不能为负数',
    }),
    parts_replaced: Joi.object().allow(null).messages({
      'object.base': '更换零件信息必须是对象格式',
    }),
    issues_found: Joi.string().allow('', null).messages({
      'string.base': '发现问题必须是字符串',
    }),
    actions_taken: Joi.string().allow('', null).messages({
      'string.base': '采取措施必须是字符串',
    }),
    next_maintenance_date: Joi.date().allow(null).messages({
      'date.base': '下次维护日期格式不正确',
    }),
    photos: Joi.object().allow(null).messages({
      'object.base': '照片信息必须是对象格式',
    }),
  }),

  updateMaintenanceRecord: Joi.object({
    maintenance_date: Joi.date().messages({
      'date.base': '维护日期格式不正确',
    }),
    maintenance_type: Joi.string().max(50).messages({
      'string.empty': '维护类型不能为空',
      'string.max': '维护类型不能超过50个字符',
    }),
    duration_hours: Joi.number().min(0).allow(null).messages({
      'number.base': '维护时长必须是数字',
      'number.min': '维护时长不能为负数',
    }),
    cost: Joi.number().min(0).allow(null).messages({
      'number.base': '维护成本必须是数字',
      'number.min': '维护成本不能为负数',
    }),
    parts_replaced: Joi.object().allow(null).messages({
      'object.base': '更换零件信息必须是对象格式',
    }),
    issues_found: Joi.string().allow('', null).messages({
      'string.base': '发现问题必须是字符串',
    }),
    actions_taken: Joi.string().allow('', null).messages({
      'string.base': '采取措施必须是字符串',
    }),
    next_maintenance_date: Joi.date().allow(null).messages({
      'date.base': '下次维护日期格式不正确',
    }),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').messages({
      'any.only': '维护状态必须是: scheduled, in_progress, completed, cancelled 中的一个',
    }),
    photos: Joi.object().allow(null).messages({
      'object.base': '照片信息必须是对象格式',
    }),
  }),

  // Equipment Failure Validations
  reportFailure: Joi.object({
    equipment_id: Joi.number().integer().positive().required().messages({
      'number.base': '设备ID必须是数字',
      'number.integer': '设备ID必须是整数',
      'number.positive': '设备ID必须是正数',
      'any.required': '设备ID是必填项',
    }),
    failure_type: Joi.string().max(50).allow('', null).messages({
      'string.max': '故障类型不能超过50个字符',
    }),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').messages({
      'any.only': '故障严重程度必须是: low, medium, high, critical 中的一个',
    }),
    description: Joi.string().required().messages({
      'string.empty': '故障描述不能为空',
      'any.required': '故障描述是必填项',
    }),
    impact_description: Joi.string().allow('', null).messages({
      'string.base': '影响描述必须是字符串',
    }),
  }),

  updateFailureStatus: Joi.object({
    status: Joi.string().valid('reported', 'in_repair', 'resolved', 'closed').required().messages({
      'any.only': '故障状态必须是: reported, in_repair, resolved, closed 中的一个',
      'any.required': '故障状态是必填项',
    }),
    repair_start_time: Joi.date().allow(null).messages({
      'date.base': '维修开始时间格式不正确',
    }),
    repair_end_time: Joi.date().allow(null).messages({
      'date.base': '维修结束时间格式不正确',
    }),
    repair_cost: Joi.number().min(0).allow(null).messages({
      'number.base': '维修成本必须是数字',
      'number.min': '维修成本不能为负数',
    }),
    repair_description: Joi.string().allow('', null).messages({
      'string.base': '维修描述必须是字符串',
    }),
    parts_replaced: Joi.object().allow(null).messages({
      'object.base': '更换零件信息必须是对象格式',
    }),
  }),
};