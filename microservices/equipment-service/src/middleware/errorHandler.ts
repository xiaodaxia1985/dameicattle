import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('API Error', {
    requestId: req.requestId,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  const statusCode = error.statusCode || 500;
  
  let message = error.message;
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = '服务器内部错误';
  }

  res.error(message, statusCode, error.code);
};