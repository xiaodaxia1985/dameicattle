import request from 'supertest';
import express from 'express';
import redisHealthRoutes from '@/routes/redis-health';
import { redisManager } from '@/config/RedisManager';
import { logger } from '@/utils/logger';

// Mock dependencies
jest.mock('@/config/RedisManager');
jest.mock('@/utils/logger');

const mockRedisManager = redisManager as jest.Mocked<typeof redisManager>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('Redis Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/health', redisHealthRoutes);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/health/redis', () => {
    it('should return healthy status when Redis is healthy', async () => {
      const mockHealthStatus = {
        status: 'healthy' as const,
        message: 'Redis connection healthy',
        timestamp: new Date(),
        responseTime: 10,
        memoryUsage: 1048576,
      };

      const mockConnectionStatus = {
        connected: true,
        usingRedis: true,
        reconnectAttempts: 0,
      };

      mockRedisManager.healthCheck.mockResolvedValue(mockHealthStatus);
      mockRedisManager.getConnectionStatus.mockReturnValue(mockConnectionStatus);

      const response = await request(app)
        .get('/api/health/redis')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          health: {
            status: 'healthy',
            message: 'Redis connection healthy',
            responseTime: 10,
            memoryUsage: 1048576,
          },
          connection: mockConnectionStatus,
          cache: {
            type: 'redis',
            fallbackActive: false,
          },
        },
      });

      expect(response.body.meta).toHaveProperty('timestamp');
      expect(response.body.meta).toHaveProperty('requestId');
    });

    it('should return degraded status when Redis is degraded', async () => {
      const mockHealthStatus = {
        status: 'degraded' as const,
        message: 'Redis not connected, using memory cache',
        timestamp: new Date(),
      };

      const mockConnectionStatus = {
        connected: false,
        usingRedis: false,
        reconnectAttempts: 2,
      };

      mockRedisManager.healthCheck.mockResolvedValue(mockHealthStatus);
      mockRedisManager.getConnectionStatus.mockReturnValue(mockConnectionStatus);

      const response = await request(app)
        .get('/api/health/redis')
        .expect(206);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          health: {
            status: 'degraded',
            message: 'Redis not connected, using memory cache',
          },
          connection: mockConnectionStatus,
          cache: {
            type: 'memory',
            fallbackActive: true,
          },
        },
      });
    });

    it('should return unhealthy status when Redis is unhealthy', async () => {
      const mockHealthStatus = {
        status: 'unhealthy' as const,
        message: 'Health check failed: Connection timeout',
        timestamp: new Date(),
      };

      const mockConnectionStatus = {
        connected: false,
        usingRedis: false,
        reconnectAttempts: 5,
      };

      mockRedisManager.healthCheck.mockResolvedValue(mockHealthStatus);
      mockRedisManager.getConnectionStatus.mockReturnValue(mockConnectionStatus);

      const response = await request(app)
        .get('/api/health/redis')
        .expect(503);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          health: {
            status: 'unhealthy',
            message: 'Health check failed: Connection timeout',
          },
          connection: mockConnectionStatus,
          cache: {
            type: 'memory',
            fallbackActive: true,
          },
        },
      });
    });

    it('should handle health check errors', async () => {
      const error = new Error('Health check failed');
      mockRedisManager.healthCheck.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/health/redis')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Failed to check Redis health',
        errors: ['Health check failed'],
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Redis health check endpoint error:', error);
    });

    it('should include request ID from headers', async () => {
      const mockHealthStatus = {
        status: 'healthy' as const,
        message: 'Redis connection healthy',
        timestamp: new Date(),
      };

      const mockConnectionStatus = {
        connected: true,
        usingRedis: true,
        reconnectAttempts: 0,
      };

      mockRedisManager.healthCheck.mockResolvedValue(mockHealthStatus);
      mockRedisManager.getConnectionStatus.mockReturnValue(mockConnectionStatus);

      const response = await request(app)
        .get('/api/health/redis')
        .set('x-request-id', 'test-request-123')
        .expect(200);

      expect(response.body.meta.requestId).toBe('test-request-123');
    });
  });

  describe('POST /api/health/redis/reconnect', () => {
    it('should successfully reconnect to Redis', async () => {
      const mockHealthStatus = {
        status: 'healthy' as const,
        message: 'Redis connection healthy',
        timestamp: new Date(),
      };

      const mockConnectionStatus = {
        connected: true,
        usingRedis: true,
        reconnectAttempts: 0,
      };

      mockRedisManager.reconnect.mockResolvedValue(undefined);
      mockRedisManager.healthCheck.mockResolvedValue(mockHealthStatus);
      mockRedisManager.getConnectionStatus.mockReturnValue(mockConnectionStatus);

      const response = await request(app)
        .post('/api/health/redis/reconnect')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Redis reconnection initiated',
        data: {
          health: {
            status: 'healthy',
            message: 'Redis connection healthy',
          },
          connection: mockConnectionStatus,
        },
      });

      expect(mockRedisManager.reconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Manual Redis reconnection requested');
    });

    it('should handle reconnection failures', async () => {
      const error = new Error('Reconnection failed');
      mockRedisManager.reconnect.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/health/redis/reconnect')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Failed to reconnect to Redis',
        errors: ['Reconnection failed'],
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Redis reconnection endpoint error:', error);
    });
  });

  describe('GET /api/health/redis/cache-stats', () => {
    it('should return cache statistics when using Redis', async () => {
      const mockCache = {
        keys: jest.fn().mockResolvedValue(['key1', 'key2', 'key3']),
      };

      const mockConnectionStatus = {
        connected: true,
        usingRedis: true,
        reconnectAttempts: 0,
      };

      const mockHealthStatus = {
        status: 'healthy' as const,
        message: 'Redis connection healthy',
        timestamp: new Date(),
      };

      mockRedisManager.getCache.mockReturnValue(mockCache as any);
      mockRedisManager.getConnectionStatus.mockReturnValue(mockConnectionStatus);
      mockRedisManager.getLastHealthCheck.mockReturnValue(mockHealthStatus);
      mockRedisManager.isRedisConnected.mockReturnValue(true);

      const response = await request(app)
        .get('/api/health/redis/cache-stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          cacheType: 'redis',
          isRedisConnected: true,
          reconnectAttempts: 0,
          lastHealthCheck: {
            status: 'healthy',
            message: 'Redis connection healthy',
          },
          keyCount: 3,
          sampleKeys: ['key1', 'key2', 'key3'],
        },
      });

      expect(mockCache.keys).toHaveBeenCalledWith('*');
    });

    it('should return cache statistics when using memory cache', async () => {
      const mockCache = {
        keys: jest.fn().mockResolvedValue(['mem-key1', 'mem-key2']),
      };

      const mockConnectionStatus = {
        connected: false,
        usingRedis: false,
        reconnectAttempts: 3,
      };

      const mockHealthStatus = {
        status: 'degraded' as const,
        message: 'Using memory cache',
        timestamp: new Date(),
      };

      mockRedisManager.getCache.mockReturnValue(mockCache as any);
      mockRedisManager.getConnectionStatus.mockReturnValue(mockConnectionStatus);
      mockRedisManager.getLastHealthCheck.mockReturnValue(mockHealthStatus);
      mockRedisManager.isRedisConnected.mockReturnValue(false);

      const response = await request(app)
        .get('/api/health/redis/cache-stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          cacheType: 'memory',
          isRedisConnected: false,
          reconnectAttempts: 3,
          lastHealthCheck: {
            status: 'degraded',
            message: 'Using memory cache',
          },
        },
      });

      // Should not try to get Redis-specific stats
      expect(mockCache.keys).not.toHaveBeenCalled();
    });

    it('should handle cache statistics errors gracefully', async () => {
      const mockCache = {
        keys: jest.fn().mockRejectedValue(new Error('Keys operation failed')),
      };

      const mockConnectionStatus = {
        connected: true,
        usingRedis: true,
        reconnectAttempts: 0,
      };

      const mockHealthStatus = {
        status: 'healthy' as const,
        message: 'Redis connection healthy',
        timestamp: new Date(),
      };

      mockRedisManager.getCache.mockReturnValue(mockCache as any);
      mockRedisManager.getConnectionStatus.mockReturnValue(mockConnectionStatus);
      mockRedisManager.getLastHealthCheck.mockReturnValue(mockHealthStatus);
      mockRedisManager.isRedisConnected.mockReturnValue(true);

      const response = await request(app)
        .get('/api/health/redis/cache-stats')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          cacheType: 'redis',
          isRedisConnected: true,
          reconnectAttempts: 0,
          lastHealthCheck: {
            status: 'healthy',
            message: 'Redis connection healthy',
          },
        },
      });

      // Should not include keyCount or sampleKeys due to error
      expect(response.body.data).not.toHaveProperty('keyCount');
      expect(response.body.data).not.toHaveProperty('sampleKeys');
      expect(mockLogger.warn).toHaveBeenCalledWith('Failed to get Redis key statistics:', expect.any(Error));
    });

    it('should handle general endpoint errors', async () => {
      const error = new Error('General endpoint error');
      mockRedisManager.getCache.mockImplementation(() => {
        throw error;
      });

      const response = await request(app)
        .get('/api/health/redis/cache-stats')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Failed to get cache statistics',
        errors: ['General endpoint error'],
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Redis cache stats endpoint error:', error);
    });

    it('should limit sample keys to first 10', async () => {
      const mockCache = {
        keys: jest.fn().mockResolvedValue(Array.from({ length: 15 }, (_, i) => `key${i + 1}`)),
      };

      const mockConnectionStatus = {
        connected: true,
        usingRedis: true,
        reconnectAttempts: 0,
      };

      const mockHealthStatus = {
        status: 'healthy' as const,
        message: 'Redis connection healthy',
        timestamp: new Date(),
      };

      mockRedisManager.getCache.mockReturnValue(mockCache as any);
      mockRedisManager.getConnectionStatus.mockReturnValue(mockConnectionStatus);
      mockRedisManager.getLastHealthCheck.mockReturnValue(mockHealthStatus);
      mockRedisManager.isRedisConnected.mockReturnValue(true);

      const response = await request(app)
        .get('/api/health/redis/cache-stats')
        .expect(200);

      expect(response.body.data.keyCount).toBe(15);
      expect(response.body.data.sampleKeys).toHaveLength(10);
      expect(response.body.data.sampleKeys).toEqual([
        'key1', 'key2', 'key3', 'key4', 'key5',
        'key6', 'key7', 'key8', 'key9', 'key10'
      ]);
    });
  });
});