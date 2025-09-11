import Redis from 'redis';
import { createLogger } from '../logger';

const logger = createLogger('cache-service');

export interface CacheOptions {
  ttl?: number;
  prefix?: string;
  serialize?: boolean;
}

export class CacheService {
  private static client: Redis.RedisClientType;
  private static isConnected = false;

  static async initialize(redisUrl?: string): Promise<void> {
    try {
      this.client = Redis.createClient({
        url: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        logger.error('Redis连接错误:', err);
      });

      this.client.on('connect', () => {
        logger.info('Redis连接成功');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('初始化缓存服务失败:', error);
      throw error;
    }
  }

  static async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    if (!this.isConnected) {
      logger.warn('缓存服务未连接，跳过设置');
      return;
    }

    try {
      const {
        ttl = 3600,
        prefix = 'cattle_mgmt',
        serialize = true
      } = options;

      const fullKey = `${prefix}:${key}`;
      const serializedValue = serialize ? JSON.stringify(value) : value as string;

      if (ttl > 0) {
        await this.client.setEx(fullKey, ttl, serializedValue);
      } else {
        await this.client.set(fullKey, serializedValue);
      }

      logger.debug(`缓存设置成功: ${fullKey}`);
    } catch (error) {
      logger.error(`设置缓存失败: ${key}`, error);
    }
  }

  static async get<T>(
    key: string, 
    options: CacheOptions = {}
  ): Promise<T | null> {
    if (!this.isConnected) {
      logger.warn('缓存服务未连接，返回null');
      return null;
    }

    try {
      const {
        prefix = 'cattle_mgmt',
        serialize = true
      } = options;

      const fullKey = `${prefix}:${key}`;
      const value = await this.client.get(fullKey);

      if (value === null) {
        return null;
      }

      const result = serialize ? JSON.parse(value) : value as T;
      logger.debug(`缓存命中: ${fullKey}`);
      return result;
    } catch (error) {
      logger.error(`获取缓存失败: ${key}`, error);
      return null;
    }
  }

  static async delete(key: string, prefix: string = 'cattle_mgmt'): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const fullKey = `${prefix}:${key}`;
      const result = await this.client.del(fullKey);
      logger.debug(`缓存删除: ${fullKey}`);
      return result > 0;
    } catch (error) {
      logger.error(`删除缓存失败: ${key}`, error);
      return false;
    }
  }

  static async exists(key: string, prefix: string = 'cattle_mgmt'): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    try {
      const fullKey = `${prefix}:${key}`;
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      logger.error(`检查缓存存在性失败: ${key}`, error);
      return false;
    }
  }

  static async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        const result = await this.client.del(keys);
        logger.debug(`按模式删除缓存: ${pattern}, 删除数量: ${result}`);
        return result;
      }
      return 0;
    } catch (error) {
      logger.error(`按模式删除缓存失败: ${pattern}`, error);
      return 0;
    }
  }

  static async flush(prefix?: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (prefix) {
        const keys = await this.client.keys(`${prefix}:*`);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        await this.client.flushDb();
      }
      
      logger.info(`缓存清空完成: ${prefix || 'all'}`);
    } catch (error) {
      logger.error('清空缓存失败:', error);
    }
  }

  static async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('缓存服务连接已关闭');
    }
  }

  // 缓存装饰器
  static cache(options: CacheOptions & { keyGenerator?: (...args: any[]) => string } = {}) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const keyGenerator = options.keyGenerator || ((...args) => 
          `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`
        );
        
        const cacheKey = keyGenerator(...args);
        
        // 尝试从缓存获取
        const cached = await CacheService.get(cacheKey, options);
        if (cached !== null) {
          return cached;
        }

        // 执行原方法
        const result = await method.apply(this, args);
        
        // 缓存结果
        await CacheService.set(cacheKey, result, options);
        
        return result;
      };
    };
  }
}