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

export const updateBaseSchema = createBaseSchema.fork(
  ['name', 'code'], 
  (schema) => schema.optional()
);