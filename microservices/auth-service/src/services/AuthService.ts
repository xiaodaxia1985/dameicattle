import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { createLogger } from '@cattle-management/shared';

const logger = createLogger('auth-service');

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  async login(username: string, password: string) {
    try {
      // 查找用户
      const user = await User.findOne({
        where: { username, isActive: true }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // 验证密码
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // 更新最后登录时间
      await user.update({ lastLoginAt: new Date() });

      // 生成token
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info('User logged in successfully', {
        userId: user.id,
        username: user.username
      });

      return {
        token,
        refreshToken,
        expiresIn: this.jwtExpiresIn,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          baseId: user.baseId,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      logger.error('Login failed', { username, error: error.message });
      throw error;
    }
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
    baseId?: number;
  }) {
    try {
      // 检查用户是否已存在
      const existingUser = await User.findOne({
        where: {
          $or: [
            { username: userData.username },
            { email: userData.email }
          ]
        }
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // 创建用户
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        role: userData.role || 'viewer'
      });

      logger.info('User registered successfully', {
        userId: user.id,
        username: user.username
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        baseId: user.baseId,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      logger.error('Registration failed', { 
        username: userData.username, 
        error: error.message 
      });
      throw error;
    }
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token.replace('Bearer ', ''), this.jwtSecret) as any;
      
      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid token');
      }

      return user;
    } catch (error) {
      logger.error('Token verification failed', { error: error.message });
      throw new Error('Invalid token');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret + 'refresh') as any;
      
      const user = await User.findByPk(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: this.jwtExpiresIn
      };
    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      throw new Error('Invalid refresh token');
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        baseId: user.baseId
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id },
      this.jwtSecret + 'refresh',
      { expiresIn: '7d' }
    );
  }
}