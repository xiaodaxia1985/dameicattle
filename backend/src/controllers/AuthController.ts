import { Request, Response, NextFunction } from 'express';
import { User, Role } from '@/models';
import { generateToken } from '@/middleware/auth';
import { logger } from '@/utils/logger';
import { redisClient } from '@/config/redis';

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;

      // Find user with role
      const user = await User.findOne({
        where: { username },
        include: [{ model: Role, as: 'role' }],
      });

      if (!user) {
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

      // Check if user is active
      if (user.status !== 'active') {
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

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        username: user.username,
        role_id: user.role_id,
      });

      // Store token in Redis for session management
      await redisClient.setEx(`token:${user.id}`, 24 * 60 * 60, token);

      // Log successful login
      logger.info(`User ${username} logged in successfully`, {
        userId: user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
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
      if (userId) {
        // Remove token from Redis
        await redisClient.del(`token:${userId}`);
        
        logger.info(`User ${userId} logged out`, {
          userId,
          ip: req.ip,
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
}