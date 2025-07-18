import { Request, Response, NextFunction } from 'express';
import { User, Role, SecurityLog } from '@/models';
import { generateToken } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { redisClient } from '@/config/redis';
import crypto from 'crypto';

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      // Find user with role
      const user = await User.findOne({
        where: { username },
        include: [{ model: Role, as: 'role' }],
      });

      // Log failed login attempt if user not found
      if (!user) {
        await SecurityLog.logEvent({
          username,
          event_type: 'login_failed',
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { reason: 'user_not_found' },
        });

        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '用户名或密码错误',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        await SecurityLog.logEvent({
          user_id: user.id,
          username: user.username,
          event_type: 'login_failed',
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { reason: 'account_locked', locked_until: user.locked_until },
        });

        return res.status(423).json({
          success: false,
          error: {
            code: 'ACCOUNT_LOCKED',
            message: `账户已被锁定，请在 ${user.locked_until?.toLocaleString()} 后重试`,
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        await SecurityLog.logEvent({
          user_id: user.id,
          username: user.username,
          event_type: 'login_failed',
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { reason: 'account_disabled', status: user.status },
        });

        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: '账户已被禁用',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        // Increment failed login attempts
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

        // Check if account should be locked after this attempt
        if (user.failed_login_attempts + 1 >= 5) {
          await SecurityLog.logEvent({
            user_id: user.id,
            username: user.username,
            event_type: 'account_locked',
            ip_address: ipAddress,
            user_agent: userAgent,
            details: { reason: 'max_failed_attempts_reached' },
          });
        }

        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '用户名或密码错误',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Reset failed attempts on successful login
      await user.resetFailedAttempts();

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
      });

      // Store token in Redis for session management
      await redisClient.setEx(`token:${user.id}`, 24 * 60 * 60, token);

      // Log successful login
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

      res.json({
        success: true,
        data: {
          token,
          user: user.toJSON(),
          permissions: user.role?.permissions || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password, real_name, email, phone } = req.body;

      // Check if username already exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_EXISTS',
            message: '用户名已存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Create new user
      const user = await User.create({
        username,
        password_hash: password, // Will be hashed by the model hook
        real_name,
        email,
        phone,
        status: 'active',
      });

      logger.info(`New user registered: ${username}`, {
        userId: user.id,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
        },
        message: '用户注册成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: '缺少认证令牌',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      const token = authHeader.substring(7);
      
      // Verify token exists in Redis
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: '无效的认证令牌',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      const storedToken = await redisClient.get(`token:${userId}`);
      if (storedToken !== token) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_MISMATCH',
            message: '令牌不匹配',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Generate new token
      const user = req.user as any;
      const newToken = generateToken({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
      });

      // Update token in Redis
      await redisClient.setEx(`token:${user.id}`, 24 * 60 * 60, newToken);

      // Log token refresh
      await SecurityLog.logEvent({
        user_id: user.id,
        username: user.username,
        event_type: 'token_refresh',
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      res.json({
        success: true,
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      if (userId) {
        // Remove token from Redis
        await redisClient.del(`token:${userId}`);
        
        // Log logout event
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

      res.json({
        success: true,
        message: '退出登录成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      // Find user by email
      const user = await User.findOne({ where: { email } });
      
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: '如果该邮箱存在，重置密码链接已发送',
        });
      }

      // Generate password reset token
      const resetToken = await user.generatePasswordResetToken();

      // Log password reset request
      await SecurityLog.logEvent({
        user_id: user.id,
        username: user.username,
        event_type: 'password_reset',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { action: 'request', email },
      });

      // In a real application, you would send an email here
      // For now, we'll just log the token (remove this in production)
      logger.info(`Password reset requested for user ${user.username}`, {
        userId: user.id,
        resetToken, // Remove this in production
        email,
      });

      res.json({
        success: true,
        message: '重置密码链接已发送到您的邮箱',
        // Remove this in production - only for testing
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      });
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      // Find user by reset token
      const user = await User.findByResetToken(token);
      
      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RESET_TOKEN',
            message: '重置令牌无效或已过期',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Reset password
      const success = await user.resetPassword(token, password);
      
      if (!success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'RESET_FAILED',
            message: '密码重置失败',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Log successful password reset
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

      res.json({
        success: true,
        message: '密码重置成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async wechatLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, userInfo, encryptedData, iv } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      // Exchange code for session_key and openid
      const wechatUserInfo = await this.getWechatUserInfo(code);
      
      if (!wechatUserInfo) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'WECHAT_AUTH_FAILED',
            message: '微信授权失败，请重试',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Find existing user by openid
      let user = await User.findOne({
        where: { wechat_openid: wechatUserInfo.openid },
        include: [{ model: Role, as: 'role' }],
      });

      let isNewUser = false;
      let needsBinding = false;

      if (!user) {
        // Create new user for WeChat login
        user = await User.create({
          username: `wx_${wechatUserInfo.openid.substring(0, 10)}`,
          password_hash: crypto.randomBytes(32).toString('hex'), // Random password
          real_name: userInfo?.nickName || '微信用户',
          wechat_openid: wechatUserInfo.openid,
          wechat_unionid: wechatUserInfo.unionid,
          status: 'active',
          // Default role for new WeChat users (employee role)
          role_id: 3, // Assuming role_id 3 is for employees
        });
        isNewUser = true;
        needsBinding = true; // New users need to bind to a base

        logger.info(`New WeChat user created: ${user.username}`, {
          userId: user.id,
          openid: wechatUserInfo.openid,
        });
      } else {
        // Check if user needs base binding
        needsBinding = !user.base_id;
      }

      // Check if user is active
      if (user.status !== 'active') {
        await SecurityLog.logEvent({
          user_id: user.id,
          username: user.username,
          event_type: 'login_failed',
          ip_address: ipAddress,
          user_agent: userAgent,
          details: { reason: 'account_disabled', login_type: 'wechat' },
        });

        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: '账户已被禁用，请联系管理员',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Update user info if provided
      if (userInfo && userInfo.nickName) {
        user.real_name = userInfo.nickName;
      }
      user.last_login = new Date();
      await user.save();

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
        base_id: user.base_id,
      });

      // Store token in Redis with session info
      await redisClient.setEx(`token:${user.id}`, 24 * 60 * 60, token);
      await redisClient.setEx(`wechat_session:${user.id}`, 24 * 60 * 60, JSON.stringify({
        session_key: wechatUserInfo.session_key,
        openid: wechatUserInfo.openid,
      }));

      // Log successful WeChat login
      await SecurityLog.logEvent({
        user_id: user.id,
        username: user.username,
        event_type: 'login_success',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { 
          login_type: 'wechat', 
          is_new_user: isNewUser,
          needs_binding: needsBinding,
        },
      });

      res.json({
        success: true,
        data: {
          token,
          user: user.toJSON(),
          permissions: user.role?.permissions || [],
          isNewUser,
          needsBinding,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async bindUserToBase(req: Request, res: Response, next: NextFunction) {
    try {
      const { baseId, inviteCode } = req.body;
      const userId = req.user?.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户未登录',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Verify invite code if provided
      if (inviteCode) {
        const isValidCode = await this.verifyInviteCode(inviteCode, baseId);
        if (!isValidCode) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INVITE_CODE',
              message: '邀请码无效或已过期',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
        }
      }

      // Update user's base
      user.base_id = baseId;
      await user.save();

      // Log binding event
      await SecurityLog.logEvent({
        user_id: user.id,
        username: user.username,
        event_type: 'user_binding',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { base_id: baseId, invite_code: inviteCode },
      });

      logger.info(`User ${user.username} bound to base ${baseId}`, {
        userId: user.id,
        baseId,
      });

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
        message: '绑定成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async getWechatUserProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '用户未登录',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      const user = await User.findByPk(userId, {
        include: [{ model: Role, as: 'role' }],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          permissions: user.role?.permissions || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper method to simulate WeChat API call
  private async getWechatUserInfo(code: string): Promise<any> {
    // In a real application, you would make HTTP requests to WeChat API
    // For now, we'll simulate the response
    
    if (!code || code.length < 10) {
      return null;
    }

    // Simulate WeChat API response
    return {
      openid: `openid_${code}_${Date.now()}`,
      unionid: `unionid_${code}_${Date.now()}`,
      session_key: `session_${code}`,
    };
  }

  // Helper method to verify invite codes
  private async verifyInviteCode(inviteCode: string, baseId: number): Promise<boolean> {
    // In a real application, you would verify the invite code against a database
    // For now, we'll simulate verification
    
    // Simple validation: invite code should be at least 6 characters
    if (!inviteCode || inviteCode.length < 6) {
      return false;
    }

    // Check if invite code exists in Redis (temporary storage)
    const storedCode = await redisClient.get(`invite_code:${inviteCode}`);
    if (storedCode) {
      const codeData = JSON.parse(storedCode);
      return codeData.baseId === baseId && new Date() < new Date(codeData.expiresAt);
    }

    // For demo purposes, accept codes that start with 'BASE' followed by the base ID
    return inviteCode.startsWith(`BASE${baseId}`);
  }
}