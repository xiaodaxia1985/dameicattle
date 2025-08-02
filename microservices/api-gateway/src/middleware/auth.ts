import { Request, Response, NextFunction } from 'express';
import { verifyToken, createHttpClient } from '@cattle-management/shared';

const authServiceClient = createHttpClient(process.env.AUTH_SERVICE_URL || 'http://auth-service:3001');

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.error('Access token required', 401, 'TOKEN_REQUIRED');
    }

    // 验证token
    try {
      const payload = verifyToken(token, process.env.JWT_SECRET || 'your-jwt-secret-key');
      
      // 可选：向认证服务验证token有效性
      // const response = await authServiceClient.post('/api/v1/verify', { token });
      
      // 将用户信息添加到请求头，传递给下游服务
      req.headers['x-user-id'] = payload.userId.toString();
      req.headers['x-user-role'] = payload.role;
      req.headers['x-user-base-id'] = payload.baseId?.toString() || '';
      
      next();
    } catch (jwtError) {
      return res.error('Invalid token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.error('Authentication failed', 500, 'AUTH_ERROR');
  }
};