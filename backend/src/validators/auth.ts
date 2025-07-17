import Joi from 'joi';

export const loginSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.empty': '用户名不能为空',
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多50个字符',
      'any.required': '用户名是必填项',
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.empty': '密码不能为空',
      'string.min': '密码至少6个字符',
      'string.max': '密码最多100个字符',
      'any.required': '密码是必填项',
    }),
});

export const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.empty': '用户名不能为空',
      'string.min': '用户名至少3个字符',
      'string.max': '用户名最多50个字符',
      'string.pattern.base': '用户名只能包含字母、数字和下划线',
      'any.required': '用户名是必填项',
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
    .required()
    .messages({
      'string.empty': '密码不能为空',
      'string.min': '密码至少6个字符',
      'string.max': '密码最多100个字符',
      'string.pattern.base': '密码必须包含大小写字母和数字',
      'any.required': '密码是必填项',
    }),
  real_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': '真实姓名不能为空',
      'string.min': '真实姓名至少2个字符',
      'string.max': '真实姓名最多100个字符',
      'any.required': '真实姓名是必填项',
    }),
  email: Joi.string()
    .email()
    .max(100)
    .optional()
    .messages({
      'string.email': '邮箱格式不正确',
      'string.max': '邮箱最多100个字符',
    }),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]+$/)
    .max(20)
    .optional()
    .messages({
      'string.pattern.base': '手机号格式不正确',
      'string.max': '手机号最多20个字符',
    }),
});