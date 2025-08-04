import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const operationLogMiddleware = (operation: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log the operation
    logger.info(`Operation: ${operation} ${resource}`, {
      userId: req.user?.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Override res.end to log completion
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - startTime;
      logger.info(`Operation completed: ${operation} ${resource}`, {
        userId: req.user?.id,
        statusCode: res.statusCode,
        duration,
      });
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};