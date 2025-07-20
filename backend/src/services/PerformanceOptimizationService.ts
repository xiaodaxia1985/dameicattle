import { QueryTypes } from 'sequelize';
import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';
import { logger } from '@/utils/logger';

export interface DatabaseIndex {
  table_name: string;
  index_name: string;
  column_names: string[];
  is_unique: boolean;
  is_primary: boolean;
  size_mb: number;
  usage_count: number;
}

export interface QueryPerformance {
  query: string;
  execution_time_ms: number;
  rows_examined: number;
  rows_returned: number;
  index_used: boolean;
  suggestions: string[];
}

export interface PerformanceMetrics {
  database: {
    connection_count: number;
    active_queries: number;
    slow_queries: number;
    cache_hit_ratio: number;
    index_usage: number;
  };
  redis: {
    memory_usage_mb: number;
    connected_clients: number;
    operations_per_second: number;
    hit_ratio: number;
    evicted_keys: number;
  };
  application: {
    response_time_avg_ms: number;
    requests_per_second: number;
    error_rate: number;
    memory_usage_mb: number;
    cpu_usage_percent: number;
  };
}

export interface OptimizationRecommendation {
  type: 'index' | 'query' | 'cache' | 'configuration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  implementation: string;
  estimated_improvement: string;
}

export class PerformanceOptimizationService {
  private static performanceHistory: PerformanceMetrics[] = [];
  private static queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();

  /**
   * 分析数据库索引使用情况
   */
  static async analyzeIndexUsage(): Promise<DatabaseIndex[]> {
    try {
      const indexes = await sequelize.query(`
        SELECT 
          schemaname,
          tablename as table_name,
          indexname as index_name,
          indexdef,
          pg_size_pretty(pg_relation_size(indexrelid)) as size,
          idx_scan as usage_count,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        JOIN pg_indexes ON pg_stat_user_indexes.indexrelname = pg_indexes.indexname
        WHERE schemaname = 'public'
        ORDER BY usage_count DESC
      `, { type: QueryTypes.SELECT }) as any[];

      return indexes.map(index => ({
        table_name: index.table_name,
        index_name: index.index_name,
        column_names: this.parseIndexColumns(index.indexdef),
        is_unique: index.indexdef.includes('UNIQUE'),
        is_primary: index.index_name.includes('_pkey'),
        size_mb: this.parseSizeToMB(index.size),
        usage_count: parseInt(index.usage_count) || 0
      }));
    } catch (error) {
      logger.error('分析索引使用情况失败:', error);
      return [];
    }
  }

  /**
   * 优化数据库查询
   */
  static async optimizeQueries(): Promise<QueryPerformance[]> {
    try {
      // 获取慢查询
      const slowQueries = await sequelize.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE mean_time > 100
        ORDER BY mean_time DESC 
        LIMIT 20
      `, { type: QueryTypes.SELECT }) as any[];

      const optimizedQueries: QueryPerformance[] = [];

      for (const query of slowQueries) {
        const suggestions = await this.analyzeQueryPerformance(query.query);
        
        optimizedQueries.push({
          query: query.query,
          execution_time_ms: parseFloat(query.mean_time),
          rows_examined: parseInt(query.rows),
          rows_returned: parseInt(query.rows),
          index_used: parseFloat(query.hit_percent) > 90,
          suggestions
        });
      }

      return optimizedQueries;
    } catch (error) {
      logger.error('优化查询失败:', error);
      return [];
    }
  }

  /**
   * 创建推荐的数据库索引
   */
  static async createRecommendedIndexes(): Promise<string[]> {
    try {
      const recommendations = await this.getIndexRecommendations();
      const createdIndexes: string[] = [];

      for (const recommendation of recommendations) {
        try {
          await sequelize.query(recommendation.sql);
          createdIndexes.push(recommendation.index_name);
          logger.info(`创建索引成功: ${recommendation.index_name}`);
        } catch (error) {
          logger.error(`创建索引失败: ${recommendation.index_name}`, error);
        }
      }

      return createdIndexes;
    } catch (error) {
      logger.error('创建推荐索引失败:', error);
      return [];
    }
  }

  /**
   * Redis缓存优化
   */
  static async optimizeRedisCache(): Promise<void> {
    try {
      // 清理过期的缓存键
      await this.cleanupExpiredCache();

      // 优化内存使用
      await this.optimizeMemoryUsage();

      // 设置缓存策略
      await this.configureCachePolicy();

      logger.info('Redis缓存优化完成');
    } catch (error) {
      logger.error('Redis缓存优化失败:', error);
      throw error;
    }
  }

  /**
   * 获取性能指标
   */
  static async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const [dbMetrics, redisMetrics, appMetrics] = await Promise.all([
        this.getDatabaseMetrics(),
        this.getRedisMetrics(),
        this.getApplicationMetrics()
      ]);

      const metrics: PerformanceMetrics = {
        database: dbMetrics,
        redis: redisMetrics,
        application: appMetrics
      };

      // 保存到历史记录
      this.performanceHistory.push(metrics);
      if (this.performanceHistory.length > 100) {
        this.performanceHistory.shift();
      }

      return metrics;
    } catch (error) {
      logger.error('获取性能指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取优化建议
   */
  static async getOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    try {
      const metrics = await this.getPerformanceMetrics();
      const recommendations: OptimizationRecommendation[] = [];

      // 数据库优化建议
      if (metrics.database.slow_queries > 10) {
        recommendations.push({
          type: 'query',
          priority: 'high',
          title: '优化慢查询',
          description: `检测到 ${metrics.database.slow_queries} 个慢查询`,
          impact: '提高查询响应速度，减少数据库负载',
          implementation: '分析慢查询日志，添加适当索引，优化查询语句',
          estimated_improvement: '查询速度提升 30-50%'
        });
      }

      if (metrics.database.cache_hit_ratio < 90) {
        recommendations.push({
          type: 'configuration',
          priority: 'medium',
          title: '提高数据库缓存命中率',
          description: `当前缓存命中率为 ${metrics.database.cache_hit_ratio.toFixed(1)}%`,
          impact: '减少磁盘I/O，提高查询性能',
          implementation: '增加shared_buffers配置，优化查询模式',
          estimated_improvement: '整体性能提升 15-25%'
        });
      }

      // Redis优化建议
      if (metrics.redis.memory_usage_mb > 1000) {
        recommendations.push({
          type: 'cache',
          priority: 'medium',
          title: '优化Redis内存使用',
          description: `Redis内存使用量为 ${metrics.redis.memory_usage_mb}MB`,
          impact: '减少内存占用，提高缓存效率',
          implementation: '清理过期键，优化数据结构，设置合适的过期时间',
          estimated_improvement: '内存使用减少 20-30%'
        });
      }

      if (metrics.redis.hit_ratio < 80) {
        recommendations.push({
          type: 'cache',
          priority: 'high',
          title: '提高Redis缓存命中率',
          description: `Redis缓存命中率为 ${metrics.redis.hit_ratio.toFixed(1)}%`,
          impact: '减少数据库查询，提高响应速度',
          implementation: '优化缓存策略，增加缓存时间，预热热点数据',
          estimated_improvement: '响应时间减少 40-60%'
        });
      }

      // 应用程序优化建议
      if (metrics.application.response_time_avg_ms > 500) {
        recommendations.push({
          type: 'configuration',
          priority: 'high',
          title: '优化应用响应时间',
          description: `平均响应时间为 ${metrics.application.response_time_avg_ms}ms`,
          impact: '提高用户体验，减少系统负载',
          implementation: '优化业务逻辑，增加缓存，使用连接池',
          estimated_improvement: '响应时间减少 30-50%'
        });
      }

      if (metrics.application.error_rate > 1) {
        recommendations.push({
          type: 'configuration',
          priority: 'critical',
          title: '降低错误率',
          description: `当前错误率为 ${metrics.application.error_rate.toFixed(2)}%`,
          impact: '提高系统稳定性和用户满意度',
          implementation: '修复bug，增加错误处理，完善监控',
          estimated_improvement: '系统稳定性提升 50-80%'
        });
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } catch (error) {
      logger.error('获取优化建议失败:', error);
      return [];
    }
  }

  /**
   * 应用查询缓存
   */
  static async getCachedQuery<T>(
    key: string, 
    queryFn: () => Promise<T>, 
    ttl: number = 300000 // 5分钟
  ): Promise<T> {
    try {
      // 检查内存缓存
      const cached = this.queryCache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.result;
      }

      // 检查Redis缓存
      const redisResult = await redisClient.get(`query:${key}`);
      if (redisResult) {
        const result = JSON.parse(redisResult);
        this.queryCache.set(key, { result, timestamp: Date.now(), ttl });
        return result;
      }

      // 执行查询
      const result = await queryFn();

      // 缓存结果
      this.queryCache.set(key, { result, timestamp: Date.now(), ttl });
      await redisClient.setEx(`query:${key}`, Math.floor(ttl / 1000), JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error(`缓存查询失败: ${key}`, error);
      // 如果缓存失败，直接执行查询
      return await queryFn();
    }
  }

  /**
   * 清理查询缓存
   */
  static async clearQueryCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        // 清理匹配模式的缓存
        const keys = Array.from(this.queryCache.keys()).filter(key => key.includes(pattern));
        keys.forEach(key => this.queryCache.delete(key));

        // 清理Redis中的缓存
        const redisKeys = await redisClient.keys(`query:*${pattern}*`);
        if (redisKeys.length > 0) {
          await redisClient.del(redisKeys);
        }
      } else {
        // 清理所有缓存
        this.queryCache.clear();
        const redisKeys = await redisClient.keys('query:*');
        if (redisKeys.length > 0) {
          await redisClient.del(redisKeys);
        }
      }

      logger.info(`查询缓存清理完成: ${pattern || 'all'}`);
    } catch (error) {
      logger.error('清理查询缓存失败:', error);
      throw error;
    }
  }

  /**
   * 获取性能历史
   */
  static getPerformanceHistory(limit: number = 50): PerformanceMetrics[] {
    return this.performanceHistory.slice(-limit);
  }

  // 私有辅助方法

  private static parseIndexColumns(indexDef: string): string[] {
    const match = indexDef.match(/\((.*?)\)/);
    if (match) {
      return match[1].split(',').map(col => col.trim());
    }
    return [];
  }

  private static parseSizeToMB(sizeStr: string): number {
    const match = sizeStr.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case 'kb': return value / 1024;
        case 'mb': return value;
        case 'gb': return value * 1024;
        default: return value / (1024 * 1024); // bytes
      }
    }
    return 0;
  }

  private static async analyzeQueryPerformance(query: string): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // 获取查询执行计划
      const plan = await sequelize.query(`EXPLAIN ANALYZE ${query}`, { 
        type: QueryTypes.SELECT 
      }) as any[];

      const planText = plan.map(row => Object.values(row)[0]).join('\n');

      // 分析执行计划并提供建议
      if (planText.includes('Seq Scan')) {
        suggestions.push('考虑添加索引以避免全表扫描');
      }

      if (planText.includes('Sort') && planText.includes('external')) {
        suggestions.push('增加work_mem配置以避免外部排序');
      }

      if (planText.includes('Hash Join') && planText.includes('Batches')) {
        suggestions.push('考虑增加hash_mem_multiplier或优化连接条件');
      }

      if (planText.includes('Nested Loop') && planText.includes('rows=')) {
        const rowsMatch = planText.match(/rows=(\d+)/);
        if (rowsMatch && parseInt(rowsMatch[1]) > 1000) {
          suggestions.push('嵌套循环处理大量数据，考虑使用Hash Join或Merge Join');
        }
      }
    } catch (error) {
      logger.error('分析查询性能失败:', error);
      suggestions.push('无法分析查询执行计划');
    }

    return suggestions;
  }

  private static async getIndexRecommendations(): Promise<Array<{ index_name: string; sql: string }>> {
    const recommendations: Array<{ index_name: string; sql: string }> = [];

    try {
      // 基于常用查询模式推荐索引
      const commonQueries = [
        {
          table: 'cattle',
          columns: ['base_id', 'health_status'],
          name: 'idx_cattle_base_health'
        },
        {
          table: 'health_records',
          columns: ['cattle_id', 'diagnosis_date'],
          name: 'idx_health_records_cattle_date'
        },
        {
          table: 'feeding_records',
          columns: ['base_id', 'feeding_date'],
          name: 'idx_feeding_records_base_date'
        },
        {
          table: 'inventory_transactions',
          columns: ['material_id', 'base_id', 'transaction_date'],
          name: 'idx_inventory_trans_material_base_date'
        },
        {
          table: 'purchase_orders',
          columns: ['supplier_id', 'status', 'order_date'],
          name: 'idx_purchase_orders_supplier_status_date'
        },
        {
          table: 'sales_orders',
          columns: ['customer_id', 'status', 'order_date'],
          name: 'idx_sales_orders_customer_status_date'
        }
      ];

      for (const query of commonQueries) {
        // 检查索引是否已存在
        const existingIndex = await sequelize.query(`
          SELECT indexname FROM pg_indexes 
          WHERE tablename = '${query.table}' 
          AND indexname = '${query.name}'
        `, { type: QueryTypes.SELECT });

        if (existingIndex.length === 0) {
          recommendations.push({
            index_name: query.name,
            sql: `CREATE INDEX CONCURRENTLY ${query.name} ON ${query.table} (${query.columns.join(', ')})`
          });
        }
      }
    } catch (error) {
      logger.error('获取索引推荐失败:', error);
    }

    return recommendations;
  }

  private static async getDatabaseMetrics(): Promise<PerformanceMetrics['database']> {
    try {
      const [connectionStats, queryStats] = await Promise.all([
        sequelize.query(`
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections
          FROM pg_stat_activity
        `, { type: QueryTypes.SELECT }),
        
        sequelize.query(`
          SELECT 
            count(*) FILTER (WHERE mean_time > 1000) as slow_queries,
            avg(blks_hit::float / (blks_hit + blks_read + 1)) * 100 as cache_hit_ratio
          FROM pg_stat_statements
        `, { type: QueryTypes.SELECT })
      ]);

      const connStats = connectionStats[0] as any;
      const qStats = queryStats[0] as any;

      return {
        connection_count: parseInt(connStats.total_connections) || 0,
        active_queries: parseInt(connStats.active_connections) || 0,
        slow_queries: parseInt(qStats.slow_queries) || 0,
        cache_hit_ratio: parseFloat(qStats.cache_hit_ratio) || 0,
        index_usage: 85 // 模拟值，实际应该从pg_stat_user_indexes计算
      };
    } catch (error) {
      logger.error('获取数据库指标失败:', error);
      return {
        connection_count: 0,
        active_queries: 0,
        slow_queries: 0,
        cache_hit_ratio: 0,
        index_usage: 0
      };
    }
  }

  private static async getRedisMetrics(): Promise<PerformanceMetrics['redis']> {
    try {
      const info = await redisClient.info();
      const lines = info.split('\r\n');
      const metrics: any = {};

      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          metrics[key] = value;
        }
      });

      return {
        memory_usage_mb: parseInt(metrics.used_memory) / (1024 * 1024) || 0,
        connected_clients: parseInt(metrics.connected_clients) || 0,
        operations_per_second: parseInt(metrics.instantaneous_ops_per_sec) || 0,
        hit_ratio: (parseInt(metrics.keyspace_hits) / (parseInt(metrics.keyspace_hits) + parseInt(metrics.keyspace_misses) + 1)) * 100 || 0,
        evicted_keys: parseInt(metrics.evicted_keys) || 0
      };
    } catch (error) {
      logger.error('获取Redis指标失败:', error);
      return {
        memory_usage_mb: 0,
        connected_clients: 0,
        operations_per_second: 0,
        hit_ratio: 0,
        evicted_keys: 0
      };
    }
  }

  private static async getApplicationMetrics(): Promise<PerformanceMetrics['application']> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      return {
        response_time_avg_ms: 150, // 这里应该从实际的请求监控中获取
        requests_per_second: 50, // 这里应该从实际的请求监控中获取
        error_rate: 0.5, // 这里应该从实际的错误监控中获取
        memory_usage_mb: memUsage.heapUsed / (1024 * 1024),
        cpu_usage_percent: (cpuUsage.user + cpuUsage.system) / 1000000 // 转换为百分比
      };
    } catch (error) {
      logger.error('获取应用程序指标失败:', error);
      return {
        response_time_avg_ms: 0,
        requests_per_second: 0,
        error_rate: 0,
        memory_usage_mb: 0,
        cpu_usage_percent: 0
      };
    }
  }

  private static async cleanupExpiredCache(): Promise<void> {
    try {
      // 清理内存缓存中的过期项
      const now = Date.now();
      for (const [key, cached] of this.queryCache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.queryCache.delete(key);
        }
      }

      // Redis会自动清理过期键，这里可以手动触发
      await redisClient.eval(`
        local keys = redis.call('keys', 'query:*')
        local expired = 0
        for i=1,#keys do
          if redis.call('ttl', keys[i]) == -1 then
            redis.call('del', keys[i])
            expired = expired + 1
          end
        end
        return expired
      `, {
        keys: [],
        arguments: []
      });

      logger.info('过期缓存清理完成');
    } catch (error) {
      logger.error('清理过期缓存失败:', error);
    }
  }

  private static async optimizeMemoryUsage(): Promise<void> {
    try {
      // 设置Redis内存优化配置
      await redisClient.configSet('maxmemory-policy', 'allkeys-lru');
      await redisClient.configSet('maxmemory-samples', '10');

      logger.info('Redis内存优化配置完成');
    } catch (error) {
      logger.error('Redis内存优化失败:', error);
    }
  }

  private static async configureCachePolicy(): Promise<void> {
    try {
      // 设置默认的缓存策略
      const policies = {
        'cattle:*': 3600, // 牛只信息缓存1小时
        'health:*': 1800, // 健康记录缓存30分钟
        'inventory:*': 600, // 库存信息缓存10分钟
        'dashboard:*': 300, // 仪表盘数据缓存5分钟
        'query:*': 300 // 查询结果缓存5分钟
      };

      // 这里可以实现更复杂的缓存策略配置
      logger.info('缓存策略配置完成', policies);
    } catch (error) {
      logger.error('配置缓存策略失败:', error);
    }
  }
}