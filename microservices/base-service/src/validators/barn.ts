import Joi from 'joi';

export const createBarnSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': '牛舍名称不能为空',
      'string.min': '牛舍名称至少2个字符',
      'string.max': '牛舍名称最多100个字符',
      'any.required': '牛舍名称是必填项',
    }),
  code: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[A-Z0-9_-]+$/i)
    .required()
    .messages({
      'string.empty': '牛舍编码不能为空',
      'string.min': '牛舍编码至少2个字符',
      'string.max': '牛舍编码最多50个字符',
      'string.pattern.base': '牛舍编码只能包含字母、数字、下划线和短横线',
      'any.required': '牛舍编码是必填项',
    }),
  base_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': '基地ID必须是数字',
      'number.integer': '基地ID必须是整数',
      'number.positive': '基地ID必须是正数',
      'any.required': '基地ID是必填项',
    }),
  capacity: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'number.base': '容量必须是数字',
      'number.integer': '容量必须是整数',
      'number.min': '容量至少为1',
      'number.max': '容量最多为1000',
      'any.required': '容量是必填项',
    }),
  barn_type: Joi.string()
    .valid('育肥棚', '繁殖棚', '隔离棚', '治疗棚', '其他', 'fattening', 'breeding', 'isolation', 'treatment', 'other')
    .optional()
    .messages({
      'any.only': '牛舍类型必须是有效值',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': '描述最多500个字符',
    }),
  facilities: Joi.object()
    .optional()
    .messages({
      'object.base': '设施信息必须是对象格式',
    }),
});

export const updateBarnSchema = createBarnSchema.fork(
  ['name', 'code', 'base_id', 'capacity'], 
  (schema) => schema.optional()
);