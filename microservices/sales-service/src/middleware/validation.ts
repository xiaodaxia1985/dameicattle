import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail: Joi.ValidationErrorItem) => ({
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

    req.body = value;
    next();
  };
};