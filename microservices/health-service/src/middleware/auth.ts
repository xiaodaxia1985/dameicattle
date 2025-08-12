import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.error('访问令牌缺失', 401, 'TOKEN_MISSING');
    }

    // 使用与auth-service相同的JWT密钥
    const JWT_SECRET = process.env.JWT_SECRET || 'cattle-management-secret-key-2024';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // 简化版本：直接使用token中的用户信息，不查询数据库
    const user = {
      id: decoded.id,
      username: decoded.username,
      role_id: decoded.role_id,
      base_id: decoded.base_id,
      status: 'active' // 假设token有效则用户状态正常
    };

    (req as any).user = user;
    next();
  } catch (error) {
    return res.error('无效的访问令牌', 401, 'INVALID_TOKEN');
  }
};

export const dataPermissionMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.error('未认证', 401, 'UNAUTHORIZED');
    }

    // Set data permission context
    (req as any).dataPermission = {
      userId: user.id,
      baseId: user.base_id,
      canAccessAllBases: user.base_id === null, // Assume null base_id means admin
    };

    next();
  } catch (error) {
    return res.error('权限检查失败', 500, 'PERMISSION_CHECK_FAILED');
  }
};