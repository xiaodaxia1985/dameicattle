import { Router, Request, Response } from 'express';
import { redisManager } from '@/config/RedisManager';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * GET /api/health/redis
 * Get Redis connection health status
 */
router.get('/redis', async (req: Request, res: Response) => {
  try {
    const healthStatus = await redisManager.healthCheck();
    const connectionStatus = redisManager.getConnectionStatus();
    
    const response = {
      success: true,
      data: {
        health: healthStatus,
        connection: connectionStatus,
        cache: {
          type: connectionStatus.usingRedis ? 'redis' : 'memory',
          fallbackActive: !connectionStatus.usingRedis,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    };

    // Set appropriate HTTP status based on health
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 206 : 503;

    res.status(statusCode).json(response);
    
  } catch (error) {
    logger.error('Redis health check endpoint error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to check Redis health',
      errors: [(error as Error).message],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
});

/**
 * POST /api/health/redis/reconnect
 * Force Redis reconnection
 */
router.post('/redis/reconnect', async (req: Request, res: Response) => {
  try {
    logger.info('Manual Redis reconnection requested');
    
    await redisManager.reconnect();
    
    // Wait a moment for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const healthStatus = await redisManager.healthCheck();
    const connectionStatus = redisManager.getConnectionStatus();
    
    res.json({
      success: true,
      message: 'Redis reconnection initiated',
      data: {
        health: healthStatus,
        connection: connectionStatus,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    
  } catch (error) {
    logger.error('Redis reconnection endpoint error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to reconnect to Redis',
      errors: [(error as Error).message],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
});

/**
 * GET /api/health/redis/cache-stats
 * Get cache statistics and performance metrics
 */
router.get('/redis/cache-stats', async (req: Request, res: Response) => {
  try {
    const cache = redisManager.getCache();
    const connectionStatus = redisManager.getConnectionStatus();
    const healthStatus = redisManager.getLastHealthCheck();
    
    // Basic cache statistics
    const stats: any = {
      cacheType: connectionStatus.usingRedis ? 'redis' : 'memory',
      isRedisConnected: redisManager.isRedisConnected(),
      reconnectAttempts: connectionStatus.reconnectAttempts,
      lastHealthCheck: healthStatus,
    };
    
    // If using Redis, get additional stats
    if (connectionStatus.usingRedis && redisManager.isRedisConnected()) {
      try {
        // Get some sample keys to show cache activity
        const sampleKeys = await cache.keys('*');
        stats.keyCount = sampleKeys.length;
        stats.sampleKeys = sampleKeys.slice(0, 10); // First 10 keys as sample
      } catch (error) {
        logger.warn('Failed to get Redis key statistics:', error);
      }
    }
    
    res.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
    
  } catch (error) {
    logger.error('Redis cache stats endpoint error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      errors: [(error as Error).message],
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
});

export default router;