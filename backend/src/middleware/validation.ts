import { Request, Response, NextFunction } from 'express';
const { validationResult } = require('express-validator');
import Joi from 'joi';

// Express-validator middleware
export const validate = (validationRules: any[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const details = errors.array().map((error: any) => ({
        field: error.type === 'field' ? error.path : error.type,
        message: error.msg,
        value: error.value,
      }));

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求数据验证失败',
          details,
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    next();
  };
};

// Joi validation middleware (legacy)
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求数据验证失败',
          details,
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    next();
  };
};