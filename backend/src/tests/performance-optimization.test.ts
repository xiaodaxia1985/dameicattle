import { PerformanceOptimizationService } from '@/services/PerformanceOptimizationService';
import { CacheService } from '@/services/CacheService';
import { PerformanceMonitor } from '@/middleware/performanceMonitoring';
import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';

describe('Performance Optimization Services', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
    await redisClient.quit();
  });

  describe('PerformanceOptimizationService', () => {
    describe('getPerformanceMetrics', () => {
      it('should return performance metrics', async () => {
        const metrics = await PerformanceOptimizationService.getPerformanceMetrics();

        expect(metrics).toBeTruthy();
        expect(metrics.database).toBeTruthy();
        expect(metrics.redis).toBeTruthy();
        expect(metrics.application).toBeTruthy();

        // 验证数据库指标
        expect(typeof metrics.database.connection_count).toBe('number');
        expect(typeof metrics.database.active_queries).toBe('number');
        expect(typeof metrics.database.slow_queries).toBe('number');
        expect(typeof metrics.database.cache_hit_ratio).toBe('number');
        expect(typeof metrics.database.index_usage).toBe('number');

        // 验证Redis指标
        expect(typeof metrics.redis.memory_usage_mb).toBe('number');
        expect(typeof metrics.redis.connected_clients).toBe('number');
        expect(typeof metrics.redis.operations_per_second).toBe('number');
        expect(typeof metrics.redis.hit_ratio).toBe('number');
        expect(typeof metrics.redis.evicted_keys).toBe('number');

        // 验证应用程序指标
        expect(typeof metrics.application.response_time_avg_ms).toBe('number');
        expect(typeof metrics.application.requests_per_second).toBe('number');
        expect(typeof metrics.application.error_rate).toBe('number');
        expect(typeof metrics.application.memory_usage_mb).toBe('number');
        expect(typeof metrics.application.cpu_usage_percent).toBe('number');
      });
    });

    describe('analyzeIndexUsage', () => {
      it('should analyze database index usage', async () => {
        const indexes = await PerformanceOptimizationService.analyzeIndexUsage();

        expect(Array.isArray(indexes)).toBe(true);
        
        if (indexes.length > 0) {
          const index = indexes[0];
          expect(index.table_name).toBeTruthy();
          expect(index.index_name).toBeTruthy();
          expect(Array.isArray(index.column_names)).toBe(true);
          expect(typeof index.is_unique).toBe('boolean');
          expect(typeof index.is_primary).toBe('boolean');
          expect(typeof index.size_mb).toBe('number');
          expect(typeof index.usage_count).toBe('number');
        }
      });
    });

    describe('getOptimizationRecommendations', () => {
      it('should provide optimization recommendations', async () => {
        const recommendations = await PerformanceOptimizationService.getOptimizationRecommendations();

        expect(Array.isArray(recommendations)).toBe(true);
        
        if (recommendations.length > 0) {
          const recommendation = recommendations[0];
          expect(['index', 'query', 'cache', 'configuration']).toContain(recommendation.type);
          expect(['low', 'medium', 'high', 'critical']).toContain(recommendation.priority);
          expect(recommendation.title).toBeTruthy();
          expect(recommendation.description).toBeTruthy();
          expect(recommendation.impact).toBeTruthy();
          expect(recommendation.implementation).toBeTruthy();
          expect(recommendation.estimated_improvement).toBeTruthy();
        }
      });

      it('should sort recommendations by priority', async () => {
        const recommendations = await PerformanceOptimizationService.getOptimizationRecommendations();
        
        if (recommendations.length > 1) {
          const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
          
          for (let i = 1; i < recommendations.length; i++) {
            const currentPriority = priorityOrder[recommendations[i].priority];
            const previousPriority = priorityOrder[recommendations[i - 1].priority];
            expect(currentPriority).toBeGreaterThanOrEqual(previousPriority);
          }
        }
      });
    });

    describe('getCachedQuery', () => {
      it('should cache and retrieve query results', async () => {
        const testKey = 'test_query_key';
        const testData = { id: 1, name: 'test' };
        
        // 模拟查询函数
        const queryFn = jest.fn().mockResolvedValue(testData);

        // 第一次调用应该执行查询函数
        const result1 = await PerformanceOptimizationService.getCachedQuery(
          testKey, 
          queryFn, 
          1000 // 1秒TTL
        );

        expect(result1).toEqual(testData);
        expect(queryFn).toHaveBeenCalledTimes(1);

        // 第二次调用应该从缓存获取
        const result2 = await PerformanceOptimizationService.getCachedQuery(
          testKey, 
          queryFn, 
          1000
        );

        expect(result2).toEqual(testData);
        expect(queryFn).toHaveBeenCalledTimes(1); // 仍然只调用一次
      });

      it('should handle cache miss gracefully', async () => {
        const testKey = 'non_existent_key';
        const testData = { id: 2, name: 'test2' };
        
        const queryFn = jest.fn().mockResolvedValue(testData);

        const result = await PerformanceOptimizationService.getCachedQuery(
          testKey, 
          queryFn
        );

        expect(result).toEqual(testData);
        expect(queryFn).toHaveBeenCalledTimes(1);
      });
    });

    describe('clearQueryCache', () => {
      it('should clear all query cache when no pattern provided', async () => {
        // 先设置一些缓存
        await PerformanceOptimizationService.getCachedQuery(
          'test_key_1', 
          async () => ({ data: 'test1' })
        );
        
        await PerformanceOptimizationService.getCachedQuery(
          'test_key_2', 
          async () => ({ data: 'test2' })
        );

        // 清理所有缓存
        await PerformanceOptimizationService.clearQueryCache();

        // 验证缓存已清理（通过重新执行查询函数来验证）
        const queryFn = jest.fn().mockResolvedValue({ data: 'new' });
        await PerformanceOptimizationService.getCachedQuery('test_key_1', queryFn);
        
        expect(queryFn).toHaveBeenCalledTimes(1);
      });

      it('should clear cache by pattern', async () => {
        // 设置不同模式的缓存
        await PerformanceOptimizationService.getCachedQuery(
          'user_cache_1', 
          async () => ({ data: 'user1' })
        );
        
        await PerformanceOptimizationService.getCachedQuery(
          'cattle_cache_1', 
          async () => ({ data: 'cattle1' })
        );

        // 只清理用户相关缓存
        await PerformanceOptimizationService.clearQueryCache('user');

        // 验证用户缓存被清理，牛只缓存保留
        const userQueryFn = jest.fn().mockResolvedValue({ data: 'new_user' });
        const cattleQueryFn = jest.fn().mockResolvedValue({ data: 'new_cattle' });

        await PerformanceOptimizationService.getCachedQuery('user_cache_1', userQueryFn);
        await PerformanceOptimizationService.getCachedQuery('cattle_cache_1', cattleQueryFn);

        expect(userQueryFn).toHaveBeenCalledTimes(1); // 缓存被清理，重新执行
        // cattle缓存可能仍然存在，这取决于具体实现
      });
    });

    describe('getPerformanceHistory', () => {
      it('should return performance history', () => {
        const history = PerformanceOptimizationService.getPerformanceHistory(10);

        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeLessThanOrEqual(10);
      });

      it('should limit history results', () => {
        const limit = 5;
        const history = PerformanceOptimizationService.getPerformanceHistory(limit);

        expect(history.length).toBeLessThanOrEqual(limit);
      });
    });
  });

  describe('CacheService', () => {
    beforeEach(async () => {
      // 清理测试前的缓存
      await CacheService.flush('test');
      CacheService.resetStats();
    });

    describe('set and get', () => {
      it('should set and get cache values', async () => {
        const key = 'test_key';
        const value = { id: 1, name: 'test' };

        await CacheService.set(key, value, { prefix: 'test', ttl: 60 });
        const result = await CacheService.get(key, { prefix: 'test' });

        expect(result).toEqual(value);
      });

      it('should return null for non-existent keys', async () => {
        const result = await CacheService.get('non_existent_key', { prefix: 'test' });
        expect(result).toBeNull();
      });

      it('should handle different data types', async () => {
        const testCases = [
          { key: 'string_test', value: 'hello world' },
          { key: 'number_test', value: 42 },
          { key: 'boolean_test', value: true },
          { key: 'array_test', value: [1, 2, 3] },
          { key: 'object_test', value: { nested: { data: 'test' } } }
        ];

        for (const testCase of testCases) {
          await CacheService.set(testCase.key, testCase.value, { prefix: 'test' });
          const result = await CacheService.get(testCase.key, { prefix: 'test' });
          expect(result).toEqual(testCase.value);
        }
      });
    });

    describe('delete', () => {
      it('should delete cache entries', async () => {
        const key = 'delete_test';
        const value = 'test_value';

        await CacheService.set(key, value, { prefix: 'test' });
        
        const deleted = await CacheService.delete(key, 'test');
        expect(deleted).toBe(true);

        const result = await CacheService.get(key, { prefix: 'test' });
        expect(result).toBeNull();
      });

      it('should return false for non-existent keys', async () => {
        const deleted = await CacheService.delete('non_existent', 'test');
        expect(deleted).toBe(false);
      });
    });

    describe('deletePattern', () => {
      it('should delete multiple keys by pattern', async () => {
        // 设置多个测试键
        await CacheService.set('user:1', { id: 1 }, { prefix: 'test' });
        await CacheService.set('user:2', { id: 2 }, { prefix: 'test' });
        await CacheService.set('cattle:1', { id: 1 }, { prefix: 'test' });

        // 删除所有用户相关的键
        const deletedCount = await CacheService.deletePattern('user:*', 'test');
        expect(deletedCount).toBe(2);

        // 验证用户键被删除，牛只键保留
        const user1 = await CacheService.get('user:1', { prefix: 'test' });
        const user2 = await CacheService.get('user:2', { prefix: 'test' });
        const cattle1 = await CacheService.get('cattle:1', { prefix: 'test' });

        expect(user1).toBeNull();
        expect(user2).toBeNull();
        expect(cattle1).toEqual({ id: 1 });
      });
    });

    describe('exists', () => {
      it('should check if cache key exists', async () => {
        const key = 'exists_test';
        
        const existsBefore = await CacheService.exists(key, 'test');
        expect(existsBefore).toBe(false);

        await CacheService.set(key, 'test_value', { prefix: 'test' });
        
        const existsAfter = await CacheService.exists(key, 'test');
        expect(existsAfter).toBe(true);
      });
    });

    describe('expire and ttl', () => {
      it('should set and get TTL', async () => {
        const key = 'ttl_test';
        
        await CacheService.set(key, 'test_value', { prefix: 'test', ttl: 60 });
        
        const ttl = await CacheService.ttl(key, 'test');
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(60);
      });

      it('should update TTL', async () => {
        const key = 'expire_test';
        
        await CacheService.set(key, 'test_value', { prefix: 'test', ttl: 60 });
        
        const updated = await CacheService.expire(key, 120, 'test');
        expect(updated).toBe(true);

        const newTtl = await CacheService.ttl(key, 'test');
        expect(newTtl).toBeGreaterThan(60);
        expect(newTtl).toBeLessThanOrEqual(120);
      });
    });

    describe('batch operations', () => {
      it('should support batch get operations', async () => {
        const testData = [
          { key: 'batch1', value: { id: 1 } },
          { key: 'batch2', value: { id: 2 } },
          { key: 'batch3', value: { id: 3 } }
        ];

        // 设置测试数据
        for (const item of testData) {
          await CacheService.set(item.key, item.value, { prefix: 'test' });
        }

        // 批量获取
        const keys = testData.map(item => item.key);
        const results = await CacheService.mget(keys, { prefix: 'test' });

        expect(results).toHaveLength(3);
        expect(results[0]).toEqual({ id: 1 });
        expect(results[1]).toEqual({ id: 2 });
        expect(results[2]).toEqual({ id: 3 });
      });

      it('should support batch set operations', async () => {
        const keyValuePairs = [
          { key: 'mset1', value: { id: 1 } },
          { key: 'mset2', value: { id: 2 } },
          { key: 'mset3', value: { id: 3 } }
        ];

        await CacheService.mset(keyValuePairs, { prefix: 'test', ttl: 60 });

        // 验证所有键都被设置
        for (const pair of keyValuePairs) {
          const result = await CacheService.get(pair.key, { prefix: 'test' });
          expect(result).toEqual(pair.value);
        }
      });
    });

    describe('distributed lock', () => {
      it('should acquire and release distributed lock', async () => {
        const lockKey = 'test_lock';
        
        // 获取锁
        const lockValue = await CacheService.lock(lockKey, 30, 'test');
        expect(lockValue).toBeTruthy();

        // 尝试再次获取同一个锁应该失败
        const lockValue2 = await CacheService.lock(lockKey, 30, 'test');
        expect(lockValue2).toBeNull();

        // 释放锁
        const released = await CacheService.unlock(lockKey, lockValue!, 'test');
        expect(released).toBe(true);

        // 现在应该能够再次获取锁
        const lockValue3 = await CacheService.lock(lockKey, 30, 'test');
        expect(lockValue3).toBeTruthy();

        // 清理
        await CacheService.unlock(lockKey, lockValue3!, 'test');
      });

      it('should not release lock with wrong value', async () => {
        const lockKey = 'test_lock_2';
        
        const lockValue = await CacheService.lock(lockKey, 30, 'test');
        expect(lockValue).toBeTruthy();

        // 尝试用错误的值释放锁
        const released = await CacheService.unlock(lockKey, 'wrong_value', 'test');
        expect(released).toBe(false);

        // 用正确的值释放锁
        const releasedCorrect = await CacheService.unlock(lockKey, lockValue!, 'test');
        expect(releasedCorrect).toBe(true);
      });
    });

    describe('cache statistics', () => {
      it('should track cache statistics', async () => {
        CacheService.resetStats();

        // 执行一些缓存操作
        await CacheService.set('stats_test_1', 'value1', { prefix: 'test' });
        await CacheService.set('stats_test_2', 'value2', { prefix: 'test' });
        
        await CacheService.get('stats_test_1', { prefix: 'test' }); // hit
        await CacheService.get('stats_test_2', { prefix: 'test' }); // hit
        await CacheService.get('non_existent', { prefix: 'test' }); // miss

        const stats = await CacheService.getStats();

        expect(stats.sets).toBe(2);
        expect(stats.hits).toBe(2);
        expect(stats.misses).toBe(1);
        expect(stats.hit_rate).toBeCloseTo(66.67, 1); // 2/3 * 100
      });
    });

    describe('cache warmup', () => {
      it('should warm up cache with provided tasks', async () => {
        const warmupTasks = [
          {
            key: 'warmup_1',
            loader: async () => ({ data: 'warmup_data_1' }),
            options: { prefix: 'test', ttl: 60 }
          },
          {
            key: 'warmup_2',
            loader: async () => ({ data: 'warmup_data_2' }),
            options: { prefix: 'test', ttl: 60 }
          }
        ];

        await CacheService.warmup(warmupTasks);

        // 验证缓存已预热
        const result1 = await CacheService.get('warmup_1', { prefix: 'test' });
        const result2 = await CacheService.get('warmup_2', { prefix: 'test' });

        expect(result1).toEqual({ data: 'warmup_data_1' });
        expect(result2).toEqual({ data: 'warmup_data_2' });
      });

      it('should not overwrite existing cache during warmup', async () => {
        const key = 'existing_warmup';
        const existingValue = { data: 'existing' };
        const warmupValue = { data: 'warmup' };

        // 先设置现有值
        await CacheService.set(key, existingValue, { prefix: 'test' });

        // 尝试预热
        await CacheService.warmup([{
          key,
          loader: async () => warmupValue,
          options: { prefix: 'test' }
        }]);

        // 验证现有值没有被覆盖
        const result = await CacheService.get(key, { prefix: 'test' });
        expect(result).toEqual(existingValue);
      });
    });
  });

  describe('PerformanceMonitor', () => {
    describe('getPerformanceStats', () => {
      it('should return performance statistics', () => {
        const stats = PerformanceMonitor.getPerformanceStats();

        expect(stats).toBeTruthy();
        expect(typeof stats.request_count).toBe('number');
        expect(typeof stats.avg_response_time).toBe('number');
        expect(typeof stats.error_rate).toBe('number');
        expect(typeof stats.slow_request_count).toBe('number');
        expect(Array.isArray(stats.top_slow_endpoints)).toBe(true);
        expect(typeof stats.status_code_distribution).toBe('object');
      });
    });

    describe('getAlerts', () => {
      it('should return performance alerts', () => {
        const alerts = PerformanceMonitor.getAlerts();

        expect(Array.isArray(alerts)).toBe(true);
      });

      it('should limit alerts results', () => {
        const limit = 10;
        const alerts = PerformanceMonitor.getAlerts(limit);

        expect(alerts.length).toBeLessThanOrEqual(limit);
      });
    });

    describe('getRealTimeMetrics', () => {
      it('should return real-time metrics', () => {
        const metrics = PerformanceMonitor.getRealTimeMetrics();

        expect(metrics).toBeTruthy();
        expect(typeof metrics.current_requests).toBe('number');
        expect(typeof metrics.avg_response_time_1min).toBe('number');
        expect(typeof metrics.error_rate_1min).toBe('number');
        expect(typeof metrics.memory_usage).toBe('object');
        expect(typeof metrics.cpu_usage).toBe('object');

        // 验证内存使用信息
        expect(typeof metrics.memory_usage.heapUsed).toBe('number');
        expect(typeof metrics.memory_usage.heapTotal).toBe('number');
        expect(typeof metrics.memory_usage.external).toBe('number');
        expect(typeof metrics.memory_usage.rss).toBe('number');
      });
    });

    describe('exportMetrics', () => {
      it('should export metrics in JSON format', () => {
        const jsonData = PerformanceMonitor.exportMetrics('json');
        
        expect(typeof jsonData).toBe('string');
        
        const parsed = JSON.parse(jsonData);
        expect(parsed.metrics).toBeTruthy();
        expect(parsed.alerts).toBeTruthy();
        expect(parsed.exported_at).toBeTruthy();
      });

      it('should export metrics in CSV format', () => {
        const csvData = PerformanceMonitor.exportMetrics('csv');
        
        expect(typeof csvData).toBe('string');
        expect(csvData).toContain('timestamp,method,path,status_code,response_time');
      });
    });

    describe('clearAlerts', () => {
      it('should clear all alerts when no date provided', () => {
        PerformanceMonitor.clearAlerts();
        
        const alerts = PerformanceMonitor.getAlerts();
        expect(alerts).toHaveLength(0);
      });

      it('should clear alerts older than specified date', () => {
        const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        
        PerformanceMonitor.clearAlerts(cutoffDate);
        
        const alerts = PerformanceMonitor.getAlerts();
        alerts.forEach(alert => {
          expect(alert.timestamp.getTime()).toBeGreaterThan(cutoffDate.getTime());
        });
      });
    });
  });
});

describe('Performance Integration Tests', () => {
  // 这里可以添加集成测试，测试各个服务之间的协作
  it.skip('should integrate performance monitoring with cache service', async () => {
    // 集成测试将在完整的应用程序测试中实现
  });

  it.skip('should integrate performance optimization with database operations', async () => {
    // 集成测试将在完整的应用程序测试中实现
  });
});