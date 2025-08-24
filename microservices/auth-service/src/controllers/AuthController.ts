import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { User, Role, SecurityLog } from '../models';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';
import crypto from 'crypto';

const generateToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-jwt-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  } as jwt.SignOptions);
};

export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.error('用户名和密码不能为空', 400, 'MISSING_CREDENTIALS');
        return;
      }
      
      const user = await User.findOne({ where: { username } });
      
      if (!user) {
        res.error('用户名或密码错误', 401, 'INVALID_CREDENTIALS');
        return;
      }
      
      // Verify password using User model method
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        res.error('用户名或密码错误', 401, 'INVALID_CREDENTIALS');
        return;
      }
      
      if (user.status !== 'active') {
        res.error('账户已被禁用', 403, 'ACCOUNT_DISABLED');
        return;
      }

      // Update last login time
      await user.update({ last_login_at: new Date() });
      
      const token = generateToken({ 
        id: user.id, 
        username: user.username,
        role: user.role,
        base_id: user.base_id
      });
      
      const userData = {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        role: user.role,
        base_id: user.base_id,
        status: user.status
      };
      
      res.success({ token, user: userData }, '登录成功');
    } catch (error) {
      next(error);
    }
  }

  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password, real_name, role = 'employee', base_id } = req.body;
      
      if (!username || !password) {
        res.error('用户名和密码不能为空', 400, 'MISSING_FIELDS');
        return;
      }
      
      // Check if user already exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        res.error('用户名已存在', 409, 'USERNAME_EXISTS');
        return;
      }
      
      // Create user (password will be hashed automatically by model hook)
      const user = await User.create({ 
        username, 
        password_hash: password, // Will be hashed by model hook
        real_name: real_name || username,
        role,
        base_id,
        status: 'active'
      });
      
      const userData = {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        role: user.role,
        base_id: user.base_id,
        status: user.status
      };
      
      res.success(userData, '注册成功', 201);
    } catch (error) {
      next(error);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, just return success
      res.success(null, '退出成功');
    } catch (error) {
      next(error);
    }
  }
}