import Joi from 'joi';

export const roleSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': '角色名称不能为空',
      'string.min': '角色名称至少2个字符',
      'string.max': '角色名称最多50个字符',
      'any.required': '角色名称是必填项',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': '角色描述最多500个字符',
    }),
  permissions: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': '权限必须是数组格式',
    }),
});

export const roleUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.empty': '角色名称不能为空',
      'string.min': '角色名称至少2个字符',
      'string.max': '角色名称最多50个字符',
    }),
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': '角色描述最多500个字符',
    }),
  permissions: Joi.array()
    .items(Joi.string())
    .optional()
    .messages({
      'array.base': '权限必须是数组格式',
    }),
});

export const assignUsersSchema = Joi.object({
  userIds: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .required()
    .messages({
      'array.base': '用户ID必须是数组格式',
      'array.min': '至少选择一个用户',
      'any.required': '用户ID是必填项',
    }),
});