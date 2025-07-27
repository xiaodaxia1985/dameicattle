import { RedisManager, CacheInterface, HealthStatus } from '@/config/RedisManager';
import { configManager } from '@/config/ConfigManager';
import { logger } from '@/utils/logger';

// Mock dependencies
jest.mock('@/config/ConfigManager');
jest.mock('@/utils/logger');
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

const mockConfigManager = configManager as jest.Mocked<typeof configManager>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('RedisManager', () => {
  let mockRedisClient: any;
  let redisManager: RedisManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Initialize redisManager
    RedisManager.resetInstance();
    redisManager = RedisManager.getInstance();
    
    // Mock Redis client
    mockRedisClient = {
      connect: jest.fn(),
      quit: jest.fn(),
      ping: jest.fn(),
      info: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      flushDb: jest.fn(),
      keys: jest.fn(),
      isOpen: true,
      on: jest.fn(),
    };

    // Mock createClient to return our mock
    const { createClient } = require('redis');
    (createClient as jest.Mock).mockReturnValue(mockRedisClient);

    // Mock config manager
    mockConfigManager.validate.mockReturnValue({
      isValid: true,
      config: {
        redis: {
          host: 'localhost',
          port: 6379,
          password: undefined,
          db: 0,
        },
      } as any,
      errors: [],
      warnings: [],
    });

    mockConfigManager.getRedisConfig.mockReturnValue({
      host: 'localhost',
      port: 6379,
      password: undefined,
      db: 0,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with valid configuration', async () => {
      const redisManager = RedisManager.getInstance();
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockConfigManager.getRedisConfig.mockReturnValue({
        host: 'localhost',
        port: 6379,
        db: 0
      });
      
      await redisManager.initialize();

      expect(mockConfigManager.getRedisConfig).toHaveBeenCalled();
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should fallback to environment variables when config is invalid', async () => {
      mockConfigManager.validate.mockReturnValue({
        isValid: false,
        config: undefined,
        errors: ['Invalid config'],
        warnings: [],
      });

      process.env.REDIS_HOST = 'test-host';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'test-password';
      process.env.REDIS_DB = '1';

      await redisManager.initialize();

      expect(mockRedisClient.connect).toHaveBeenCalled();
      
      // Clean up env vars
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.REDIS_PASSWORD;
      delete process.env.REDIS_DB;
    });

    it('should handle connection failures gracefully', async () => {
      const connectionError = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValue(connectionError);

      // The initialize method catches errors and handles them gracefully
      await redisManager.initialize();
      
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize Redis:', connectionError);
      expect(redisManager.isRedisConnected()).toBe(false);
    });
  });

  describe('cache operations', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockRedisClient.ping.mockResolvedValue('PONG');
      await redisManager.initialize();
    });

    it('should perform get operation', async () => {
      const testValue = 'test-value';
      mockRedisClient.get.mockResolvedValue(testValue);

      const cache = redisManager.getCache();
      const result = await cache.get('test-key');

      expect(result).toBe(testValue);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should perform set operation without TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');

      const cache = redisManager.getCache();
      await cache.set('test-key', 'test-value');

      expect(mockRedisClient.set).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should perform set operation with TTL', async () => {
      mockRedisClient.setEx.mockResolvedValue('OK');

      const cache = redisManager.getCache();
      await cache.set('test-key', 'test-value', 300);

      expect(mockRedisClient.setEx).toHaveBeenCalledWith('test-key', 300, 'test-value');
    });

    it('should perform delete operation', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const cache = redisManager.getCache();
      await cache.del('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should check key existence', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const cache = redisManager.getCache();
      const exists = await cache.exists('test-key');

      expect(exists).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key');
    });

    it('should get keys by pattern', async () => {
      const testKeys = ['key1', 'key2', 'key3'];
      mockRedisClient.keys.mockResolvedValue(testKeys);

      const cache = redisManager.getCache();
      const keys = await cache.keys('test:*');

      expect(keys).toEqual(testKeys);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('test:*');
    });

    it('should clear all keys', async () => {
      mockRedisClient.flushDb.mockResolvedValue('OK');

      const cache = redisManager.getCache();
      await cache.clear();

      expect(mockRedisClient.flushDb).toHaveBeenCalled();
    });
  });

  describe('fallback to memory cache', () => {
    it('should fallback to memory cache when Redis connection fails', async () => {
      const connectionError = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValue(connectionError);

      try {
        await redisManager.initialize();
      } catch (error) {
        // Expected to fail
      }

      const cache = redisManager.getCache();
      
      // Should be able to use memory cache
      await cache.set('test-key', 'test-value');
      const result = await cache.get('test-key');
      
      expect(result).toBe('test-value');
      expect(redisManager.isRedisConnected()).toBe(false);
    });

    it('should handle memory cache TTL correctly', async () => {
      jest.useFakeTimers();
      
      const connectionError = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValue(connectionError);

      try {
        await redisManager.initialize();
      } catch (error) {
        // Expected to fail
      }

      const cache = redisManager.getCache();
      
      // Set with short TTL
      await cache.set('test-key', 'test-value', 1);
      
      // Should exist immediately
      expect(await cache.exists('test-key')).toBe(true);
      expect(await cache.get('test-key')).toBe('test-value');
      
      // Fast-forward time to trigger expiration
      jest.advanceTimersByTime(1100);
      
      // Should be expired
      expect(await cache.exists('test-key')).toBe(false);
      expect(await cache.get('test-key')).toBe(null);
      
      jest.useRealTimers();
    });
  });

  describe('health checks', () => {
    beforeEach(async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockRedisClient.ping.mockResolvedValue('PONG');
      mockRedisClient.info.mockResolvedValue('used_memory:1048576\nother_info:value');
      await redisManager.initialize();
    });

    it('should return healthy status when Redis is connected', async () => {
      const healthStatus = await redisManager.healthCheck();

      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.message).toBe('Redis connection healthy');
      expect(healthStatus.responseTime).toBeGreaterThanOrEqual(0);
      expect(healthStatus.memoryUsage).toBe(1048576);
      expect(mockRedisClient.ping).toHaveBeenCalled();
      expect(mockRedisClient.info).toHaveBeenCalledWith('memory');
    });

    it('should return degraded status when Redis is not connected', async () => {
      // Simulate disconnection
      Object.defineProperty(redisManager, 'isRedisConnected', {
        value: jest.fn().mockReturnValue(false),
      });

      const healthStatus = await redisManager.healthCheck();

      expect(healthStatus.status).toBe('degraded');
      expect(healthStatus.message).toBe('Redis not connected, using memory cache');
    });

    it('should return unhealthy status when health check fails', async () => {
      const pingError = new Error('Ping failed');
      mockRedisClient.ping.mockRejectedValue(pingError);

      const healthStatus = await redisManager.healthCheck();

      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.message).toBe('Health check failed: Ping failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Redis health check failed:', pingError);
    });
  });

  describe('connection management', () => {
    it('should report connection status correctly', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      await redisManager.initialize();

      const status = redisManager.getConnectionStatus();

      expect(status.connected).toBe(true);
      expect(status.usingRedis).toBe(true);
      expect(status.reconnectAttempts).toBe(0);
    });

    it('should handle reconnection', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockRedisClient.quit.mockResolvedValue('OK');
      await redisManager.initialize();

      await redisManager.reconnect();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(mockRedisClient.connect).toHaveBeenCalledTimes(2); // Initial + reconnect
    });

    it('should emit events on connection state changes', async () => {
      const connectSpy = jest.fn();
      const errorSpy = jest.fn();
      const fallbackSpy = jest.fn();

      redisManager.on('connected', connectSpy);
      redisManager.on('error', errorSpy);
      redisManager.on('fallback', fallbackSpy);

      mockRedisClient.connect.mockResolvedValue(undefined);
      await redisManager.initialize();

      expect(connectSpy).toHaveBeenCalled();
    });
  });

  describe('graceful shutdown', () => {
    it('should shutdown gracefully', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      mockRedisClient.quit.mockResolvedValue('OK');
      await redisManager.initialize();

      await redisManager.shutdown();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Shutting down Redis manager...');
      expect(mockLogger.info).toHaveBeenCalledWith('Redis manager shutdown complete');
    });

    it('should handle shutdown errors gracefully', async () => {
      mockRedisClient.connect.mockResolvedValue(undefined);
      const shutdownError = new Error('Shutdown failed');
      mockRedisClient.quit.mockRejectedValue(shutdownError);
      await redisManager.initialize();

      await redisManager.shutdown();

      expect(mockLogger.error).toHaveBeenCalledWith('Error during Redis shutdown:', shutdownError);
    });
  });
});

describe('MemoryCache', () => {
  let cache: CacheInterface;
  let mockRedisClient: any;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock Redis client
    mockRedisClient = {
      connect: jest.fn(),
      quit: jest.fn(),
      ping: jest.fn(),
      info: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      keys: jest.fn(),
      flushDb: jest.fn(),
      on: jest.fn(),
      isOpen: false,
    };

    (require('redis').createClient as jest.Mock).mockReturnValue(mockRedisClient);
    
    // Get memory cache by forcing Redis connection to fail
    RedisManager.resetInstance();
    const redisManager = RedisManager.getInstance();
    mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
    
    try {
      await redisManager.initialize();
    } catch (error) {
      // Expected to fail
    }
    
    cache = redisManager.getCache();
  });

  it('should store and retrieve values', async () => {
    await cache.set('test-key', 'test-value');
    const result = await cache.get('test-key');
    expect(result).toBe('test-value');
  });

  it('should handle TTL expiration', async () => {
    await cache.set('test-key', 'test-value', 1);
    
    // Should exist immediately
    expect(await cache.exists('test-key')).toBe(true);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should be expired
    expect(await cache.exists('test-key')).toBe(false);
    expect(await cache.get('test-key')).toBe(null);
  });

  it('should delete keys', async () => {
    await cache.set('test-key', 'test-value');
    expect(await cache.exists('test-key')).toBe(true);
    
    await cache.del('test-key');
    expect(await cache.exists('test-key')).toBe(false);
  });

  it('should match keys by pattern', async () => {
    await cache.set('user:1', 'value1');
    await cache.set('user:2', 'value2');
    await cache.set('post:1', 'value3');
    
    const userKeys = await cache.keys('user:.*');
    expect(userKeys).toHaveLength(2);
    expect(userKeys).toContain('user:1');
    expect(userKeys).toContain('user:2');
  });

  it('should clear all keys', async () => {
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    
    await cache.clear();
    
    expect(await cache.exists('key1')).toBe(false);
    expect(await cache.exists('key2')).toBe(false);
  });
});