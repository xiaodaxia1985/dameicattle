import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { User, Role } from '../models';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// 认证中间件
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    // 检查授权头是否存在
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.error('缺少认证令牌', 401, 'MISSING_TOKEN');
      return;
    }

    const token = authHeader.substring(7);
    
    // 验证token格式
    if (!token || token.length < 10) {
      res.error('无效的令牌格式', 401, 'INVALID_TOKEN_FORMAT');
      return;
    }

    // 验证JWT token
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (jwtError: any) {
      let errorCode = 'INVALID_TOKEN';
      let errorMessage = '无效的认证令牌';
      
      if (jwtError.name === 'TokenExpiredError') {
        errorCode = 'TOKEN_EXPIRED';
        errorMessage = '令牌已过期';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorCode = 'INVALID_TOKEN';
        errorMessage = '无效的令牌';
      }
      
      res.error(errorMessage, 401, errorCode);
      return;
    }

    // 检查token是否在Redis中存在
    try {
      const storedToken = await redisClient.get(`token:${payload.id}`);
      if (!storedToken) {
        res.error('令牌已过期或被撤销', 401, 'TOKEN_EXPIRED');
        return;
      }
      
      if (storedToken !== token) {
        res.error('令牌不匹配当前会话', 401, 'TOKEN_MISMATCH');
        return;
      }
    } catch (redisError) {
      logger.error('Redis token verification error:', redisError);
      // 如果Redis不可用，继续验证但记录警告
      logger.warn('Redis unavailable, skipping token session check');
    }

    // 查找用户及其角色
    const user = await User.findByPk(payload.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ 
        model: Role, 
        as: 'role',
        attributes: ['id', 'name', 'description', 'permissions']
      }],
    });
    
    if (!user) {
      res.error('用户不存在', 404, 'USER_NOT_FOUND');
      return;
    }

    // 检查用户状态
    if (user.status !== 'active') {
      res.error('用户账户未激活', 403, 'ACCOUNT_INACTIVE');
      return;
    }

    // 检查账户是否被锁定
    if (user.isAccountLocked()) {
      res.error('用户账户已被锁定', 423, 'ACCOUNT_LOCKED');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.error('认证过程中发生错误', 500, 'AUTH_ERROR');
  }
};

// 权限检查中间件
export const requirePermission = (permission: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    
    // 检查用户是否已认证
    if (!user) {
      res.error('需要认证才能访问此资源', 401, 'UNAUTHORIZED');
      return;
    }

    // 检查用户是否有角色信息
    if (!user.role) {
      logger.warn(`User ${user.username} has no role assigned`);
      res.error('用户未分配角色', 403, 'NO_ROLE_ASSIGNED');
      return;
    }

    // 检查角色是否有权限配置
    if (!user.role.permissions || !Array.isArray(user.role.permissions)) {
      logger.warn(`Role ${user.role.name} has no permissions configured`);
      res.error('角色未配置权限', 403, 'NO_PERMISSIONS_CONFIGURED');
      return;
    }

    const userPermissions = user.role.permissions as string[];
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];
    
    // 检查是否有通配符权限（管理员权限）
    if (userPermissions.includes('*')) {
      next();
      return;
    }
    
    // 检查用户是否拥有所有必需的权限
    const missingPermissions = requiredPermissions.filter(perm => !userPermissions.includes(perm));
    
    if (missingPermissions.length > 0) {
      logger.warn(`User ${user.username} missing permissions: ${missingPermissions.join(', ')}`);
      res.error(`缺少必需权限: ${missingPermissions.join(', ')}`, 403, 'INSUFFICIENT_PERMISSIONS');
      return;
    }

    next();
  };
};

// 角色检查中间件
export const requireRole = (roleName: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    
    if (!user) {
      res.error('需要认证才能访问此资源', 401, 'UNAUTHORIZED');
      return;
    }

    if (!user.role) {
      res.error('用户未分配角色', 403, 'NO_ROLE_ASSIGNED');
      return;
    }

    const requiredRoles = Array.isArray(roleName) ? roleName : [roleName];
    const userRole = user.role.name;
    
    if (!requiredRoles.includes(userRole)) {
      logger.warn(`User ${user.username} with role ${userRole} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`);
      res.error(`需要以下角色之一: ${requiredRoles.join(', ')}`, 403, 'INSUFFICIENT_ROLE');
      return;
    }

    next();
  };
};

// 生成JWT token
export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// 验证JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};