import { Request, Response } from 'express';
import Joi from 'joi';
import { AuthService } from '../services/AuthService';
import { createLogger } from '@cattle-management/shared';

const logger = createLogger('auth-controller');
const authService = new AuthService();

// 验证schemas
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'manager', 'operator', 'viewer').optional(),
  baseId: Joi.number().integer().optional()
});

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.error(error.details[0].message, 400, 'VALIDATION_ERROR');
      }

      const { username, password } = value;
      const result = await authService.login(username, password);

      res.success(result, 'Login successful');
    } catch (error) {
      logger.error('Login error', { error: (error as Error).message });
      res.error('Login failed', 401, 'LOGIN_FAILED');
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.error(error.details[0].message, 400, 'VALIDATION_ERROR');
      }

      const user = await authService.register(value);
      res.success(user, 'User registered successfully');
    } catch (error) {
      logger.error('Registration error', { error: (error as Error).message });
      
      if ((error as Error).message === 'User already exists') {
        res.error('User already exists', 409, 'USER_EXISTS');
      } else {
        res.error('Registration failed', 500, 'REGISTRATION_FAILED');
      }
    }
  }

  async verify(req: Request, res: Response) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.error('Token required', 401, 'MISSING_TOKEN');
      }

      const user = await authService.verifyToken(token);
      res.success({ user }, 'Token verified');
    } catch (error) {
      logger.error('Token verification error', { error: (error as Error).message });
      res.error('Invalid token', 401, 'INVALID_TOKEN');
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.error('Refresh token required', 400, 'MISSING_REFRESH_TOKEN');
      }

      const result = await authService.refreshToken(refreshToken);
      res.success(result, 'Token refreshed');
    } catch (error) {
      logger.error('Token refresh error', { error: (error as Error).message });
      res.error('Token refresh failed', 401, 'REFRESH_FAILED');
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // 在实际应用中，这里可以将token加入黑名单
      res.success(null, 'Logout successful');
    } catch (error) {
      logger.error('Logout error', { error: (error as Error).message });
      res.error('Logout failed', 500, 'LOGOUT_FAILED');
    }
  }
}