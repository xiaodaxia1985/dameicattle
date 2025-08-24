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
  // 如果响应已经发送或连接已断开，直接返回
  if (res.headersSent || error.code === 'ECONNABORTED') {
    return next(error);
  }

  // 记录错误日志
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

  // 确定状态码
  const statusCode = error.statusCode || 500;
  
  // 确定错误消息
  let message = error.message;
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = '服务器内部错误';
  }

  // 发送错误响应
  if (res.error && typeof res.error === 'function') {
    res.error(message, statusCode, error.code);
  } else {
    // Fallback if res.error is not available
    res.status(statusCode).json({
      success: false,
      message,
      code: error.code,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'unknown',
        version: '1.0.0'
      }
    });
  }
};