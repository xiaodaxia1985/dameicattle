import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '@/utils/logger';

// Cattle validation schema
const cattleSchema = Joi.object({
  ear_tag: Joi.string().min(3).max(50).required().messages({
    'string.empty': '耳标号不能为空',
    'string.min': '耳标号至少3个字符',
    'string.max': '耳标号不能超过50个字符',
    'any.required': '耳标号是必填项'
  }),
  breed: Joi.string().min(2).max(100).required().messages({
    'string.empty': '品种不能为空',
    'string.min': '品种至少2个字符',
    'string.max': '品种不能超过100个字符',
    'any.required': '品种是必填项'
  }),
  gender: Joi.string().valid('male', 'female').required().messages({
    'any.only': '性别必须是male或female',
    'any.required': '性别是必填项'
  }),
  birth_date: Joi.date().max('now').allow(null).messages({
    'date.max': '出生日期不能是未来日期'
  }),
  weight: Joi.number().min(0).max(2000).allow(null).messages({
    'number.min': '体重不能为负数',
    'number.max': '体重不能超过2000kg'
  }),
  health_status: Joi.string().valid('healthy', 'sick', 'treatment').default('healthy'),
  base_id: Joi.number().integer().positive().required().messages({
    'number.base': '基地ID必须是数字',
    'number.positive': '基地ID必须是正数',
    'any.required': '基地ID是必填项'
  }),
  barn_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': '牛棚ID必须是数字',
    'number.positive': '牛棚ID必须是正数'
  }),
  photos: Joi.array().items(Joi.string().uri()).default([]),
  parent_male_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': '父牛ID必须是数字',
    'number.positive': '父牛ID必须是正数'
  }),
  parent_female_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': '母牛ID必须是数字',
    'number.positive': '母牛ID必须是正数'
  }),
  source: Joi.string().valid('born', 'purchased', 'transferred').default('purchased'),
  purchase_price: Joi.number().min(0).allow(null).messages({
    'number.min': '采购价格不能为负数'
  }),
  purchase_date: Joi.date().allow(null),
  supplier_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': '供应商ID必须是数字',
    'number.positive': '供应商ID必须是正数'
  }),
  status: Joi.string().valid('active', 'sold', 'dead', 'transferred').default('active'),
  notes: Joi.string().max(1000).allow('', null).messages({
    'string.max': '备注不能超过1000个字符'
  })
});

// Cattle event validation schema
const cattleEventSchema = Joi.object({
  cattle_id: Joi.number().integer().positive().required().messages({
    'number.base': '牛只ID必须是数字',
    'number.positive': '牛只ID必须是正数',
    'any.required': '牛只ID是必填项'
  }),
  event_type: Joi.string().valid(
    'birth', 'purchase', 'transfer_in', 'transfer_out',
    'weight_record', 'health_check', 'vaccination',
    'treatment', 'breeding', 'pregnancy_check',
    'calving', 'weaning', 'sale', 'death', 'other'
  ).required().messages({
    'any.only': '事件类型无效',
    'any.required': '事件类型是必填项'
  }),
  event_date: Joi.date().required().messages({
    'date.base': '事件日期格式无效',
    'any.required': '事件日期是必填项'
  }),
  description: Joi.string().max(1000).allow('', null).messages({
    'string.max': '描述不能超过1000个字符'
  }),
  data: Joi.object().default({}),
  operator_id: Joi.number().integer().positive().allow(null).messages({
    'number.base': '操作员ID必须是数字',
    'number.positive': '操作员ID必须是正数'
  })
});

// Cattle validation middleware
export const validateCattle = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = cattleSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    logger.warn('Cattle validation failed:', { errors, body: req.body });

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: errors
      }
    });
    return;
  }

  req.body = value;
  next();
};

// Cattle event validation middleware
export const validateCattleEvent = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = cattleEventSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    logger.warn('Cattle event validation failed:', { errors, body: req.body });

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '数据验证失败',
        details: errors
      }
    });
    return;
  }

  req.body = value;
  next();
};

// Batch cattle validation schema
const batchCattleSchema = Joi.array().items(cattleSchema).min(1).max(100).messages({
  'array.min': '至少需要一条牛只数据',
  'array.max': '批量导入不能超过100条数据'
});

// Batch cattle validation middleware
export const validateBatchCattle = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = batchCattleSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    logger.warn('Batch cattle validation failed:', { errors, body: req.body });

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '批量数据验证失败',
        details: errors
      }
    });
    return;
  }

  req.body = value;
  next();
};