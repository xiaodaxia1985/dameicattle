import { Request, Response, NextFunction } from 'express';
import Redis from 'redis';

const redis = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});

redis.connect().catch(console.error);

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15分钟
  maxRequests: 100 // 每15分钟最多100个请求
};

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `rate_limit:${clientIp}`;
    const now = Date.now();
    const window = Math.floor(now / defaultConfig.windowMs);
    const windowKey = `${key}:${window}`;

    const current = await redis.incr(windowKey);
    
    if (current === 1) {
      await redis.expire(windowKey, Math.ceil(defaultConfig.windowMs / 1000));
    }

    if (current > defaultConfig.maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        errorCode: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(defaultConfig.windowMs / 1000)
      });
    }

    // 添加速率限制头
    res.setHeader('X-RateLimit-Limit', defaultConfig.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, defaultConfig.maxRequests - current));
    res.setHeader('X-RateLimit-Reset', new Date(now + defaultConfig.windowMs));

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    // 如果Redis出错，不阻塞请求
    next();
  }
};