import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

declare global {
  namespace Express {
    interface Response {
      success<T>(data?: T, message?: string, statusCode?: number): Response;
      error(message: string, statusCode?: number, code?: string, errors?: ValidationError[]): Response;
    }
    interface Request {
      requestId?: string;
      startTime?: number;
      user?: any;
    }
  }
}

export const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  req.startTime = Date.now();

  res.success = function<T>(data?: T, message?: string, statusCode: number = 200): Response {
    const response: StandardApiResponse<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0',
      },
    };

    logger.info('API Success Response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      responseTime: Date.now() - (req.startTime || Date.now()),
    });

    return this.status(statusCode).json(response);
  };

  res.error = function(
    message: string, 
    statusCode: number = 500, 
    code?: string, 
    errors?: ValidationError[]
  ): Response {
    const response: StandardApiResponse = {
      success: false,
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: '1.0.0',
      },
    };

    if (code) {
      (response as any).code = code;
    }

    logger.error('API Error Response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      message,
      code,
      errors,
      responseTime: Date.now() - (req.startTime || Date.now()),
    });

    return this.status(statusCode).json(response);
  };

  next();
};