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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.error('用户不存在', 401, 'USER_NOT_FOUND');
    }

    if (user.status !== 'active') {
      return res.error('用户已被禁用', 401, 'USER_DISABLED');
    }

    req.user = user;
    next();
  } catch (error) {
    return res.error('无效的访问令牌', 401, 'INVALID_TOKEN');
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // For now, just check if user is authenticated
    // In a full implementation, you would check user permissions
    if (!req.user) {
      return res.error('未认证', 401, 'UNAUTHORIZED');
    }
    next();
  };
};