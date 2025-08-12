import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    real_name: string;
    base_id?: number;
    role?: string;
    permissions?: string[];
  };
}

interface DataPermission {
  canAccessAllBases: boolean;
  baseId?: number;
}

interface DataPermissionRequest extends AuthenticatedRequest {
  dataPermission?: DataPermission;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失',
        error: 'TOKEN_MISSING'
      });
    }

    // 使用与auth-service相同的JWT密钥
    const JWT_SECRET = process.env.JWT_SECRET || 'cattle-management-secret-key-2024';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // 使用token中的用户信息
    req.user = {
      id: decoded.id,
      username: decoded.username,
      real_name: decoded.real_name || decoded.username,
      base_id: decoded.base_id,
      role: decoded.role || 'admin',
      permissions: decoded.permissions || []
    };

    next();
  } catch (error) {
    logger.error('认证失败:', error);
    return res.status(401).json({
      success: false,
      message: '访问令牌无效',
      error: 'TOKEN_INVALID'
    });
  }
};

export const dataPermissionMiddleware = (req: DataPermissionRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        error: 'USER_NOT_AUTHENTICATED'
      });
    }

    // 检查用户是否有访问所有基地的权限（超级管理员）
    const canAccessAllBases = user.role === 'super_admin' || 
                             (user.permissions && user.permissions.includes('access_all_bases'));

    req.dataPermission = {
      canAccessAllBases,
      baseId: user.base_id
    };

    next();
  } catch (error) {
    logger.error('数据权限检查失败:', error);
    return res.status(500).json({
      success: false,
      message: '数据权限检查失败',
      error: 'DATA_PERMISSION_ERROR'
    });
  }
};