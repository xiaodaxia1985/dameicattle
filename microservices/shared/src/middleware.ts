import { Request, Response, NextFunction } from 'express';

// 扩展Response接口
declare global {
  namespace Express {
    interface Response {
      success(data?: any, message?: string): void;
      error(message: string, statusCode?: number, errorCode?: string): void;
    }
  }
}

// 响应包装中间件
export const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  res.success = (data?: any, message: string = 'Success') => {
    res.status(200).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  };

  res.error = (message: string, statusCode: number = 500, errorCode?: string) => {
    res.status(statusCode).json({
      success: false,
      message,
      errorCode,
      timestamp: new Date().toISOString()
    });
  };

  next();
};

// 错误处理中间件
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error);
  
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  res.error(message, statusCode, error.code);
};