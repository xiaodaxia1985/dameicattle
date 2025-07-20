import Joi from 'joi';

export const createBaseSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': '基地名称不能为空',
      'string.min': '基地名称至少2个字符',
      'string.max': '基地名称最多100个字符',
      'any.required': '基地名称是必填项',
    }),
  code: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[A-Z0-9_-]+$/i)
    .required()
    .messages({
      'string.empty': '基地编码不能为空',
      'string.min': '基地编码至少2个字符',
      'string.max': '基地编码最多50个字符',
      'string.pattern.base': '基地编码只能包含字母、数字、下划线和短横线',
      'any.required': '基地编码是必填项',
    }),
  address: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': '地址最多500个字符',
    }),
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .precision(8)
    .optional()
    .allow(null)
    .messages({
      'number.base': '纬度必须是数字',
      'number.min': '纬度必须在-90到90之间',
      'number.max': '纬度必须在-90到90之间',
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .precision(8)
    .optional()
    .allow(null)
    .messages({
      'number.base': '经度必须是数字',
      'number.min': '经度必须在-180到180之间',
      'number.max': '经度必须在-180到180之间',
    }),
  area: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .allow(null)
    .messages({
      'number.base': '面积必须是数字',
      'number.min': '面积必须大于等于0',
    }),
  manager_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': '管理员ID必须是数字',
      'number.integer': '管理员ID必须是整数',
      'number.positive': '管理员ID必须是正数',
    }),
});

export const updateBaseSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.empty': '基地名称不能为空',
      'string.min': '基地名称至少2个字符',
      'string.max': '基地名称最多100个字符',
    }),
  code: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[A-Z0-9_-]+$/i)
    .optional()
    .messages({
      'string.empty': '基地编码不能为空',
      'string.min': '基地编码至少2个字符',
      'string.max': '基地编码最多50个字符',
      'string.pattern.base': '基地编码只能包含字母、数字、下划线和短横线',
    }),
  address: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': '地址最多500个字符',
    }),
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .precision(8)
    .optional()
    .allow(null)
    .messages({
      'number.base': '纬度必须是数字',
      'number.min': '纬度必须在-90到90之间',
      'number.max': '纬度必须在-90到90之间',
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .precision(8)
    .optional()
    .allow(null)
    .messages({
      'number.base': '经度必须是数字',
      'number.min': '经度必须在-180到180之间',
      'number.max': '经度必须在-180到180之间',
    }),
  area: Joi.number()
    .min(0)
    .precision(2)
    .optional()
    .allow(null)
    .messages({
      'number.base': '面积必须是数字',
      'number.min': '面积必须大于等于0',
    }),
  manager_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': '管理员ID必须是数字',
      'number.integer': '管理员ID必须是整数',
      'number.positive': '管理员ID必须是正数',
    }),
});

export const baseQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': '页码必须是数字',
      'number.integer': '页码必须是整数',
      'number.min': '页码必须大于0',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.base': '每页数量必须是数字',
      'number.integer': '每页数量必须是整数',
      'number.min': '每页数量必须大于0',
      'number.max': '每页数量不能超过100',
    }),
  search: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': '搜索关键词最多100个字符',
    }),
  manager_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': '管理员ID必须是数字',
      'number.integer': '管理员ID必须是整数',
      'number.positive': '管理员ID必须是正数',
    }),
});

export const bulkImportBasesSchema = Joi.object({
  bases: Joi.array()
    .items(
      Joi.object({
        name: Joi.string()
          .min(2)
          .max(100)
          .required()
          .messages({
            'string.empty': '基地名称不能为空',
            'string.min': '基地名称至少2个字符',
            'string.max': '基地名称最多100个字符',
            'any.required': '基地名称是必填项',
          }),
        code: Joi.string()
          .min(2)
          .max(50)
          .pattern(/^[A-Z0-9_-]+$/i)
          .required()
          .messages({
            'string.empty': '基地编码不能为空',
            'string.min': '基地编码至少2个字符',
            'string.max': '基地编码最多50个字符',
            'string.pattern.base': '基地编码只能包含字母、数字、下划线和短横线',
            'any.required': '基地编码是必填项',
          }),
        address: Joi.string()
          .max(500)
          .optional()
          .allow('')
          .messages({
            'string.max': '地址最多500个字符',
          }),
        latitude: Joi.number()
          .min(-90)
          .max(90)
          .precision(8)
          .optional()
          .allow(null)
          .messages({
            'number.base': '纬度必须是数字',
            'number.min': '纬度必须在-90到90之间',
            'number.max': '纬度必须在-90到90之间',
          }),
        longitude: Joi.number()
          .min(-180)
          .max(180)
          .precision(8)
          .optional()
          .allow(null)
          .messages({
            'number.base': '经度必须是数字',
            'number.min': '经度必须在-180到180之间',
            'number.max': '经度必须在-180到180之间',
          }),
        area: Joi.number()
          .min(0)
          .precision(2)
          .optional()
          .allow(null)
          .messages({
            'number.base': '面积必须是数字',
            'number.min': '面积必须大于等于0',
          }),
        manager_id: Joi.number()
          .integer()
          .positive()
          .optional()
          .allow(null)
          .messages({
            'number.base': '管理员ID必须是数字',
            'number.integer': '管理员ID必须是整数',
            'number.positive': '管理员ID必须是正数',
          }),
      })
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.base': '基地数据必须是数组',
      'array.min': '至少需要导入1个基地',
      'array.max': '一次最多导入100个基地',
      'any.required': '基地数据是必填项',
    }),
});

export const validateLocationSchema = Joi.object({
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .precision(8)
    .required()
    .messages({
      'number.base': '纬度必须是数字',
      'number.min': '纬度必须在-90到90之间',
      'number.max': '纬度必须在-90到90之间',
      'any.required': '纬度是必填项',
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .precision(8)
    .required()
    .messages({
      'number.base': '经度必须是数字',
      'number.min': '经度必须在-180到180之间',
      'number.max': '经度必须在-180到180之间',
      'any.required': '经度是必填项',
    }),
  address: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': '地址最多500个字符',
    }),
});

export const exportBasesSchema = Joi.object({
  format: Joi.string()
    .valid('json', 'csv')
    .optional()
    .default('json')
    .messages({
      'any.only': '导出格式只能是json或csv',
    }),
});