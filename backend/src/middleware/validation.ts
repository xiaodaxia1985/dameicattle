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
    // Debug: Log the request body being validated
    console.log('Validation middleware - Request body:', JSON.stringify(req.body, null, 2));
    console.log('Validation middleware - Request body type:', typeof req.body);
    console.log('Validation middleware - Request body keys:', Object.keys(req.body || {}));
    console.log('Validation middleware - Content-Type:', req.get('Content-Type'));
    
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      console.log('Validation middleware - Validation failed:', {
        error: error.message,
        details: error.details,
        requestBody: req.body
      });

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

    console.log('Validation middleware - Validation passed');
    next();
  };
};