import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

// Permission middleware factory
export const authorize = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户未认证'
          }
        });
      }

      // Admin users have all permissions
      if (user.role?.name === 'admin') {
        return next();
      }

      // Check if user has required permissions
      const userPermissions = user.role?.permissions || [];
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission) || userPermissions.includes('*')
      );

      if (!hasPermission) {
        logger.warn('Permission denied:', {
          userId: user.id,
          requiredPermissions,
          userPermissions
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '权限不足'
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_ERROR',
          message: '权限检查失败'
        }
      });
    }
  };
};

// Permission middleware factory
export const permissionMiddleware = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户未认证'
          }
        });
      }

      // Admin users have all permissions
      if (user.role?.name === 'admin') {
        return next();
      }

      // Check if user has required permissions
      const userPermissions = user.role?.permissions || [];
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission) || userPermissions.includes('*')
      );

      if (!hasPermission) {
        logger.warn('Permission denied:', {
          userId: user.id,
          requiredPermissions,
          userPermissions
        });

        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '权限不足'
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_ERROR',
          message: '权限检查失败'
        }
      });
    }
  };
};

// Single permission check function
export const permission = (requiredPermission: string) => {
  return permissionMiddleware([requiredPermission]);
};