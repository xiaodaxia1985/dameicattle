import { redisManager, CacheInterface } from './RedisManager';
import { logger } from '@/utils/logger';

// Initialize Redis manager
let isInitialized = false;

const initializeRedis = async () => {
  if (isInitialized) return;
  
  try {
    await redisManager.initialize();
    isInitialized = true;
    logger.info('Redis manager initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis manager:', error);
    // RedisManager will fallback to memory cache automatically
  }
};

// Only initialize if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initializeRedis();
}

// Export the cache interface for backward compatibility
export const getCache = (): CacheInterface => {
  return redisManager.getCache();
};

// Export Redis manager for advanced usage
export { redisManager };

// Legacy export for backward compatibility with extended Redis methods
export const redisClient = {
  get: (key: string) => redisManager.getCache().get(key),
  set: async (key: string, value: string, options?: any) => {
    if (typeof options === 'object' && options.EX) {
      await redisManager.getCache().set(key, value, options.EX);
      return 'OK';
    }
    await redisManager.getCache().set(key, value);
    return 'OK';
  },
  setEx: (key: string, ttl: number, value: string) => redisManager.getCache().set(key, value, ttl),
  del: (key: string | string[]) => {
    if (Array.isArray(key)) {
      return Promise.all(key.map(k => redisManager.getCache().del(k))).then(results => results.length);
    }
    return redisManager.getCache().del(key).then(() => 1);
  },
  exists: (key: string) => redisManager.getCache().exists(key),
  keys: (pattern: string) => redisManager.getCache().keys(pattern),
  get isOpen() { return redisManager.isRedisConnected(); },
  quit: () => redisManager.shutdown(),
  ping: () => redisManager.healthCheck().then(status => status.status === 'healthy' ? 'PONG' : Promise.reject(new Error(status.message))),
  
  // Additional Redis methods used in the codebase
  hIncrBy: async (key: string, field: string, increment: number) => {
    // Fallback implementation for hash increment
    const current = await redisManager.getCache().get(`${key}:${field}`) || '0';
    const newValue = parseInt(current) + increment;
    await redisManager.getCache().set(`${key}:${field}`, newValue.toString());
    return newValue;
  },
  
  expire: async (key: string, ttl: number) => {
    // This is a simplified implementation - in a real Redis client this would set TTL on existing key
    const value = await redisManager.getCache().get(key);
    if (value) {
      await redisManager.getCache().set(key, value, ttl);
      return 1;
    }
    return 0;
  },
  
  ttl: async (key: string) => {
    // Simplified TTL implementation - returns -1 for no TTL, -2 for non-existent key
    const exists = await redisManager.getCache().exists(key);
    return exists ? -1 : -2;
  },
  
  info: async (section?: string) => {
    // Mock Redis info command
    return `redis_version:6.2.0\r\nused_memory:1024000\r\nconnected_clients:1\r\n`;
  },
  
  flushDb: () => redisManager.getCache().clear(),
  
  mGet: async (keys: string[]) => {
    return Promise.all(keys.map(key => redisManager.getCache().get(key)));
  },
  
  multi: () => {
    // Mock Redis multi/pipeline - returns a simple object with exec method
    const commands: Array<() => Promise<any>> = [];
    const pipeline = {
      set: (key: string, value: string) => {
        commands.push(() => redisManager.getCache().set(key, value));
        return pipeline;
      },
      del: (key: string) => {
        commands.push(() => redisManager.getCache().del(key));
        return pipeline;
      },
      exec: () => Promise.all(commands.map(cmd => cmd()))
    };
    return pipeline;
  },
  
  eval: async (script: string, options?: any) => {
    // Mock Redis eval - just return null for now
    return null;
  },
  
  configSet: async (parameter: string, value: string) => {
    // Mock Redis config set
    return 'OK';
  }
};

export default redisClient;