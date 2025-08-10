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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // 模拟用户信息（实际应该从数据库获取）
    req.user = {
      id: decoded.id || decoded.userId,
      username: decoded.username,
      real_name: decoded.real_name || decoded.realName,
      base_id: decoded.base_id || decoded.baseId,
      role: decoded.role,
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