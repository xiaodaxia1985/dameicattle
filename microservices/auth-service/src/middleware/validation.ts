import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

// Joi验证中间件
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 返回所有错误
      allowUnknown: false, // 不允许未知字段
      stripUnknown: true, // 移除未知字段
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type,
        value: detail.context?.value,
      }));

      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors: details,
        requestId: req.requestId,
      });

      res.error('请求数据验证失败', 400, 'VALIDATION_ERROR', details);
      return;
    }

    // 使用验证后的值替换原始请求体
    req.body = value;
    next();
  };
};