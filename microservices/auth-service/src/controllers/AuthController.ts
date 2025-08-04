import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { User, Role, SecurityLog } from '../models';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import crypto from 'crypto';

// JWT工具函数
const generateToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-jwt-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      // 查找用户及其角色
      const user = await User.findOne({
        where: { username },
        include: [{ 
          model: Role, 
          as: 'role',
          attributes: ['id', 'name', 'description', 'permissions']
        }],
      });

      // 用户不存在
      if (!user) {
        await SecurityLog.logEvent({
          username,
          event_type: 'login_failed',
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { reason: 'user_not_found' },
        });

        return res.error('用户名或密码错误', 401, 'INVALID_CREDENTIALS');
      }

      // 检查账户是否被锁定
      if (user.isAccountLocked()) {
        await SecurityLog.logEvent({
          user_id: user.id,
          username: user.username,
          event_type: 'login_failed',
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { reason: 'account_locked', locked_until: user.locked_until },
        });

        return res.error(`账户已被锁定，请在 ${user.locked_until?.toLocaleString()} 后重试`, 423, 'ACCOUNT_LOCKED');
      }

      // 检查账户状态
      if (user.status !== 'active') {
        await SecurityLog.logEvent({
          user_id: user.id,
          username: user.username,
          event_type: 'login_failed',
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { reason: 'account_disabled', status: user.status },
        });

        return res.error('账户已被禁用', 401, 'ACCOUNT_DISABLED');
      }

      // 验证密码
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        await user.incrementFailedAttempts();

        await SecurityLog.logEvent({
          user_id: user.id,
          username: user.username,
          event_type: 'login_failed',
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { 
            reason: 'invalid_password',
            failed_attempts: user.failed_login_attempts + 1,
          },
        });

        return res.error('用户名或密码错误', 401, 'INVALID_CREDENTIALS');
      }

      // 重置失败次数
      await user.resetFailedAttempts();

      // 生成JWT token
      const token = generateToken({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        base_id: user.base_id,
      });

      // 将token存储到Redis
      await redisClient.setEx(`token:${user.id}`, 24 * 60 * 60, token);

      // 记录成功登录
      await SecurityLog.logEvent({
        user_id: user.id,
        username: user.username,
        event_type: 'login_success',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { role_id: user.role_id },
      });

      logger.info(`User ${username} logged in successfully`, {
        userId: user.id,
        ip: ipAddress,
        userAgent,
      });

      res.success({
        token,
        user: user.toJSON(),
        permissions: user.role?.permissions || [],
      }, '登录成功');
    } catch (error) {
      next(error);
    }
  }

  public async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { username, password, real_name, email, phone } = req.body;

      // 检查用户名是否已存在
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.error('用户名已存在', 409, 'USERNAME_EXISTS');
      }

      // 创建新用户
      const user = await User.create({
        username,
        password_hash: password, // 会被模型钩子自动加密
        real_name,
        email,
        phone,
        status: 'active',
      });

      logger.info(`New user registered: ${username}`, {
        userId: user.id,
        ip: req.ip,
      });

      res.success({
        user: user.toJSON(),
      }, '用户注册成功', 201);
    } catch (error) {
      next(error);
    }
  }

  public async refreshToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authHeader = req.headers.authorization;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.error('缺少认证令牌', 401, 'MISSING_TOKEN');
      }

      const currentToken = authHeader.substring(7);
      
      // 验证当前token
      let tokenPayload: any;
      try {
        tokenPayload = jwt.verify(currentToken, process.env.JWT_SECRET || 'your-jwt-secret-key');
      } catch (jwtError: any) {
        if (jwtError.name === 'TokenExpiredError') {
          // 允许在宽限期内刷新过期token
          const gracePeriod = 7 * 24 * 60 * 60 * 1000; // 7天
          const expiredTime = new Date(jwtError.expiredAt).getTime();
          const now = Date.now();
          
          if (now - expiredTime > gracePeriod) {
            return res.error('令牌已过期超过允许的刷新时间，请重新登录', 401, 'TOKEN_EXPIRED_BEYOND_GRACE');
          } else {
            tokenPayload = jwt.decode(currentToken);
          }
        } else {
          return res.error('无效的认证令牌', 401, 'INVALID_TOKEN');
        }
      }

      const userId = tokenPayload.id;
      if (!userId) {
        return res.error('令牌载荷无效', 401, 'INVALID_TOKEN_PAYLOAD');
      }

      // 验证token是否在Redis中存在
      const storedToken = await redisClient.get(`token:${userId}`);
      if (!storedToken || storedToken !== currentToken) {
        return res.error('令牌未在会话中找到，请重新登录', 401, 'TOKEN_NOT_IN_SESSION');
      }

      // 获取最新用户数据
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password_hash'] },
        include: [{ 
          model: Role, 
          as: 'role',
          attributes: ['id', 'name', 'description', 'permissions']
        }],
      });

      if (!user) {
        return res.error('用户不存在', 404, 'USER_NOT_FOUND');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return res.error('用户账户已被禁用', 403, 'ACCOUNT_INACTIVE');
      }

      if (user.isAccountLocked()) {
        return res.error('用户账户已被锁定', 423, 'ACCOUNT_LOCKED');
      }

      // 生成新token
      const newToken = generateToken({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        base_id: user.base_id,
      });

      // 更新Redis中的token
      const tokenExpiry = 24 * 60 * 60; // 24小时
      await redisClient.setEx(`token:${user.id}`, tokenExpiry, newToken);

      // 记录token刷新
      await SecurityLog.logEvent({
        user_id: user.id,
        username: user.username,
        event_type: 'token_refresh',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { 
          old_token_expired: tokenPayload.exp ? new Date(tokenPayload.exp * 1000) : null,
          new_token_expires: new Date(Date.now() + tokenExpiry * 1000)
        },
      });

      logger.info(`Token refreshed for user ${user.username}`, {
        userId: user.id,
        ip: ipAddress,
      });

      res.success({
        token: newToken,
        user: user.toJSON(),
        permissions: user.role?.permissions || [],
        expiresIn: tokenExpiry,
      }, '令牌刷新成功');
    } catch (error) {
      logger.error('Token refresh error:', error);
      next(error);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      if (userId) {
        // 从Redis中删除token
        await redisClient.del(`token:${userId}`);
        
        // 记录登出事件
        await SecurityLog.logEvent({
          user_id: userId,
          event_type: 'logout',
          ip_address: ipAddress,
          user_agent: userAgent,
        });
        
        logger.info(`User ${userId} logged out`, {
          userId,
          ip: ipAddress,
        });
      }

      res.success(null, '退出登录成功');
    } catch (error) {
      next(error);
    }
  }

  public async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      // 查找用户
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        // 不透露邮箱是否存在
        return res.success(null, '如果该邮箱存在，重置密码链接已发送');
      }

      // 生成重置token
      const resetToken = await user.generatePasswordResetToken();

      // 记录密码重置请求
      await SecurityLog.logEvent({
        user_id: user.id,
        username: user.username,
        event_type: 'password_reset',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { action: 'request', email },
      });

      logger.info(`Password reset requested for user ${user.username}`, {
        userId: user.id,
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
        email,
      });

      res.success({
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      }, '重置密码链接已发送到您的邮箱');
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { token, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      // 通过重置token查找用户
      const user = await User.findByResetToken(token);
      
      if (!user) {
        return res.error('重置令牌无效或已过期', 400, 'INVALID_RESET_TOKEN');
      }

      // 重置密码
      const success = await user.resetPassword(token, password);
      
      if (!success) {
        return res.error('密码重置失败', 400, 'RESET_FAILED');
      }

      // 记录成功的密码重置
      await SecurityLog.logEvent({
        user_id: user.id,
        username: user.username,
        event_type: 'password_reset',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { action: 'success' },
      });

      logger.info(`Password reset successful for user ${user.username}`, {
        userId: user.id,
        ip: ipAddress,
      });

      res.success(null, '密码重置成功');
    } catch (error) {
      next(error);
    }
  }

  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.error('用户未登录', 401, 'UNAUTHORIZED');
      }

      const user = await User.findByPk(userId, {
        include: [{ model: Role, as: 'role' }],
      });

      if (!user) {
        return res.error('用户不存在', 404, 'USER_NOT_FOUND');
      }

      res.success({
        user: user.toJSON(),
        permissions: user.role?.permissions || [],
      });
    } catch (error) {
      next(error);
    }
  }
}