import { redisClient } from '@/config/redis';
import { logger } from '@/utils/logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean;
  compress?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hit_rate: number;
  memory_usage: number;
}

export class CacheService {
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hit_rate: 0,
    memory_usage: 0
  };

  private static readonly DEFAULT_TTL = 3600; // 1 hour
  private static readonly DEFAULT_PREFIX = 'cattle_mgmt';

  /**
   * 设置缓存
   */
  static async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const {
        ttl = this.DEFAULT_TTL,
        prefix = this.DEFAULT_PREFIX,
        serialize = true,
        compress = false
      } = options;

      const fullKey = `${prefix}:${key}`;
      let serializedValue: string;

      if (serialize) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = value as string;
      }

      if (compress) {
        serializedValue = await this.compress(serializedValue);
      }

      if (ttl > 0) {
        await redisClient.setEx(fullKey, ttl, serializedValue);
      } else {
        await redisClient.set(fullKey, serializedValue);
      }

      this.stats.sets++;
      this.updateHitRate();

      logger.debug(`缓存设置成功: ${fullKey}`);
    } catch (error) {
      logger.error(`设置缓存失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取缓存
   */
  static async get<T>(
    key: string, 
    options: CacheOptions = {}
  ): Promise<T | null> {
    try {
      const {
        prefix = this.DEFAULT_PREFIX,
        serialize = true,
        compress = false
      } = options;

      const fullKey = `${prefix}:${key}`;
      let value = await redisClient.get(fullKey);

      if (value === null) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      if (compress) {
        value = await this.decompress(value);
      }

      let result: T;
      if (serialize) {
        result = JSON.parse(value);
      } else {
        result = value as T;
      }

      this.stats.hits++;
      this.updateHitRate();

      logger.debug(`缓存命中: ${fullKey}`);
      return result;
    } catch (error) {
      logger.error(`获取缓存失败: ${key}`, error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * 删除缓存
   */
  static async delete(key: string, prefix: string = this.DEFAULT_PREFIX): Promise<boolean> {
    try {
      const fullKey = `${prefix}:${key}`;
      const result = await redisClient.del(fullKey);
      
      this.stats.deletes++;
      
      logger.debug(`缓存删除: ${fullKey}`);
      return result > 0;
    } catch (error) {
      logger.error(`删除缓存失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 批量删除缓存
   */
  static async deletePattern(pattern: string, prefix: string = this.DEFAULT_PREFIX): Promise<number> {
    try {
      const fullPattern = `${prefix}:${pattern}`;
      const keys = await redisClient.keys(fullPattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await redisClient.del(keys);
      this.stats.deletes += result;
      
      logger.info(`批量删除缓存: ${keys.length} 个键`);
      return result;
    } catch (error) {
      logger.error(`批量删除缓存失败: ${pattern}`, error);
      return 0;
    }
  }

  /**
   * 检查缓存是否存在
   */
  static async exists(key: string, prefix: string = this.DEFAULT_PREFIX): Promise<boolean> {
    try {
      const fullKey = `${prefix}:${key}`;
      const result = await redisClient.exists(fullKey);
      return result;
    } catch (error) {
      logger.error(`检查缓存存在性失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 设置缓存过期时间
   */
  static async expire(key: string, ttl: number, prefix: string = this.DEFAULT_PREFIX): Promise<boolean> {
    try {
      const fullKey = `${prefix}:${key}`;
      const result = await redisClient.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      logger.error(`设置缓存过期时间失败: ${key}`, error);
      return false;
    }
  }

  /**
   * 获取缓存剩余过期时间
   */
  static async ttl(key: string, prefix: string = this.DEFAULT_PREFIX): Promise<number> {
    try {
      const fullKey = `${prefix}:${key}`;
      return await redisClient.ttl(fullKey);
    } catch (error) {
      logger.error(`获取缓存TTL失败: ${key}`, error);
      return -1;
    }
  }

  /**
   * 缓存装饰器 - 用于方法缓存
   */
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

  /**
   * 缓存预热
   */
  static async warmup(warmupTasks: Array<{
    key: string;
    loader: () => Promise<any>;
    options?: CacheOptions;
  }>): Promise<void> {
    try {
      logger.info(`开始缓存预热，共 ${warmupTasks.length} 个任务`);

      const promises = warmupTasks.map(async (task) => {
        try {
          const exists = await this.exists(task.key, task.options?.prefix);
          if (!exists) {
            const data = await task.loader();
            await this.set(task.key, data, task.options);
            logger.debug(`缓存预热完成: ${task.key}`);
          }
        } catch (error) {
          logger.error(`缓存预热失败: ${task.key}`, error);
        }
      });

      await Promise.all(promises);
      logger.info('缓存预热完成');
    } catch (error) {
      logger.error('缓存预热失败:', error);
      throw error;
    }
  }

  /**
   * 获取缓存统计信息
   */
  static async getStats(): Promise<CacheStats> {
    try {
      const info = await redisClient.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      return {
        ...this.stats,
        memory_usage: memoryUsage
      };
    } catch (error) {
      logger.error('获取缓存统计失败:', error);
      return this.stats;
    }
  }

  /**
   * 重置统计信息
   */
  static resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hit_rate: 0,
      memory_usage: 0
    };
  }

  /**
   * 清空所有缓存
   */
  static async flush(prefix?: string): Promise<void> {
    try {
      if (prefix) {
        await this.deletePattern('*', prefix);
      } else {
        await redisClient.flushDb();
      }
      
      logger.info(`缓存清空完成: ${prefix || 'all'}`);
    } catch (error) {
      logger.error('清空缓存失败:', error);
      throw error;
    }
  }

  /**
   * 获取缓存键列表
   */
  static async getKeys(pattern: string = '*', prefix: string = this.DEFAULT_PREFIX): Promise<string[]> {
    try {
      const fullPattern = `${prefix}:${pattern}`;
      const keys = await redisClient.keys(fullPattern);
      return keys.map(key => key.replace(`${prefix}:`, ''));
    } catch (error) {
      logger.error(`获取缓存键列表失败: ${pattern}`, error);
      return [];
    }
  }

  /**
   * 批量获取缓存
   */
  static async mget<T>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    try {
      const { prefix = this.DEFAULT_PREFIX, serialize = true } = options;
      const fullKeys = keys.map(key => `${prefix}:${key}`);
      
      const values = await redisClient.mGet(fullKeys);
      
      return values.map(value => {
        if (value === null) {
          this.stats.misses++;
          return null;
        }
        
        this.stats.hits++;
        
        if (serialize) {
          try {
            return JSON.parse(value);
          } catch {
            return value as T;
          }
        }
        
        return value as T;
      });
    } catch (error) {
      logger.error('批量获取缓存失败:', error);
      return keys.map(() => null);
    } finally {
      this.updateHitRate();
    }
  }

  /**
   * 批量设置缓存
   */
  static async mset<T>(
    keyValuePairs: Array<{ key: string; value: T }>, 
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const { 
        ttl = this.DEFAULT_TTL, 
        prefix = this.DEFAULT_PREFIX, 
        serialize = true 
      } = options;

      const pipeline = redisClient.multi();

      for (const { key, value } of keyValuePairs) {
        const fullKey = `${prefix}:${key}`;
        const serializedValue = serialize ? JSON.stringify(value) : value as string;
        
        if (ttl > 0) {
          pipeline.set(fullKey, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      }

      await pipeline.exec();
      this.stats.sets += keyValuePairs.length;
      
      logger.debug(`批量设置缓存完成: ${keyValuePairs.length} 个键`);
    } catch (error) {
      logger.error('批量设置缓存失败:', error);
      throw error;
    }
  }

  /**
   * 分布式锁
   */
  static async lock(
    key: string, 
    ttl: number = 30, 
    prefix: string = this.DEFAULT_PREFIX
  ): Promise<string | null> {
    try {
      const lockKey = `${prefix}:lock:${key}`;
      const lockValue = `${Date.now()}-${Math.random()}`;
      
      const result = await redisClient.set(lockKey, lockValue, {
        EX: ttl,
        NX: true
      });
      
      if (result === 'OK') {
        logger.debug(`获取分布式锁成功: ${lockKey}`);
        return lockValue;
      }
      
      return null;
    } catch (error) {
      logger.error(`获取分布式锁失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 释放分布式锁
   */
  static async unlock(
    key: string, 
    lockValue: string, 
    prefix: string = this.DEFAULT_PREFIX
  ): Promise<boolean> {
    try {
      const lockKey = `${prefix}:lock:${key}`;
      
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await redisClient.eval(script, {
        keys: [lockKey],
        arguments: [lockValue]
      });
      
      if (result === 1) {
        logger.debug(`释放分布式锁成功: ${lockKey}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`释放分布式锁失败: ${key}`, error);
      return false;
    }
  }

  // 私有辅助方法

  private static updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hit_rate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private static async compress(data: string): Promise<string> {
    // 这里可以实现数据压缩逻辑
    // 例如使用 zlib 或其他压缩算法
    return data;
  }

  private static async decompress(data: string): Promise<string> {
    // 这里可以实现数据解压逻辑
    return data;
  }
}