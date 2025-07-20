import { Request, Response } from 'express';
import { PerformanceOptimizationService } from '@/services/PerformanceOptimizationService';
import { CacheService } from '@/services/CacheService';
import { PerformanceMonitor } from '@/middleware/performanceMonitoring';
import { logger } from '@/utils/logger';

export class PerformanceController {
  /**
   * 获取性能指标
   */
  static async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await PerformanceOptimizationService.getPerformanceMetrics();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('获取性能指标失败:', error);
      res.status(500).json({
        success: false,
        message: '获取性能指标失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取性能历史
   */
  static async getPerformanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = PerformanceOptimizationService.getPerformanceHistory(limit);

      res.json({
        success: true,
        data: history,
        total: history.length
      });
    } catch (error) {
      logger.error('获取性能历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取性能历史失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 分析数据库索引使用情况
   */
  static async analyzeIndexUsage(req: Request, res: Response): Promise<void> {
    try {
      const indexes = await PerformanceOptimizationService.analyzeIndexUsage();

      res.json({
        success: true,
        data: indexes,
        total: indexes.length
      });
    } catch (error) {
      logger.error('分析索引使用情况失败:', error);
      res.status(500).json({
        success: false,
        message: '分析索引使用情况失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 优化数据库查询
   */
  static async optimizeQueries(req: Request, res: Response): Promise<void> {
    try {
      const optimizedQueries = await PerformanceOptimizationService.optimizeQueries();

      res.json({
        success: true,
        data: optimizedQueries,
        total: optimizedQueries.length
      });
    } catch (error) {
      logger.error('优化查询失败:', error);
      res.status(500).json({
        success: false,
        message: '优化查询失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 创建推荐的数据库索引
   */
  static async createRecommendedIndexes(req: Request, res: Response): Promise<void> {
    try {
      const createdIndexes = await PerformanceOptimizationService.createRecommendedIndexes();

      res.json({
        success: true,
        data: {
          created_indexes: createdIndexes,
          count: createdIndexes.length
        },
        message: `成功创建 ${createdIndexes.length} 个索引`
      });
    } catch (error) {
      logger.error('创建推荐索引失败:', error);
      res.status(500).json({
        success: false,
        message: '创建推荐索引失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 优化Redis缓存
   */
  static async optimizeRedisCache(req: Request, res: Response): Promise<void> {
    try {
      await PerformanceOptimizationService.optimizeRedisCache();

      res.json({
        success: true,
        message: 'Redis缓存优化完成'
      });
    } catch (error) {
      logger.error('Redis缓存优化失败:', error);
      res.status(500).json({
        success: false,
        message: 'Redis缓存优化失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取优化建议
   */
  static async getOptimizationRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const recommendations = await PerformanceOptimizationService.getOptimizationRecommendations();

      res.json({
        success: true,
        data: recommendations,
        total: recommendations.length
      });
    } catch (error) {
      logger.error('获取优化建议失败:', error);
      res.status(500).json({
        success: false,
        message: '获取优化建议失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 清理查询缓存
   */
  static async clearQueryCache(req: Request, res: Response): Promise<void> {
    try {
      const { pattern } = req.body;
      await PerformanceOptimizationService.clearQueryCache(pattern);

      res.json({
        success: true,
        message: `查询缓存清理完成: ${pattern || 'all'}`
      });
    } catch (error) {
      logger.error('清理查询缓存失败:', error);
      res.status(500).json({
        success: false,
        message: '清理查询缓存失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取缓存统计
   */
  static async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await CacheService.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('获取缓存统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取缓存统计失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 重置缓存统计
   */
  static async resetCacheStats(req: Request, res: Response): Promise<void> {
    try {
      CacheService.resetStats();

      res.json({
        success: true,
        message: '缓存统计重置完成'
      });
    } catch (error) {
      logger.error('重置缓存统计失败:', error);
      res.status(500).json({
        success: false,
        message: '重置缓存统计失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 清空缓存
   */
  static async flushCache(req: Request, res: Response): Promise<void> {
    try {
      const { prefix } = req.body;
      await CacheService.flush(prefix);

      res.json({
        success: true,
        message: `缓存清空完成: ${prefix || 'all'}`
      });
    } catch (error) {
      logger.error('清空缓存失败:', error);
      res.status(500).json({
        success: false,
        message: '清空缓存失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取缓存键列表
   */
  static async getCacheKeys(req: Request, res: Response): Promise<void> {
    try {
      const { pattern, prefix } = req.query;
      const keys = await CacheService.getKeys(
        pattern as string || '*',
        prefix as string
      );

      res.json({
        success: true,
        data: keys,
        total: keys.length
      });
    } catch (error) {
      logger.error('获取缓存键列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取缓存键列表失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 缓存预热
   */
  static async warmupCache(req: Request, res: Response): Promise<void> {
    try {
      const { tasks } = req.body;

      if (!Array.isArray(tasks)) {
        res.status(400).json({
          success: false,
          message: '请提供预热任务数组'
        });
        return;
      }

      await CacheService.warmup(tasks);

      res.json({
        success: true,
        message: `缓存预热完成，共 ${tasks.length} 个任务`
      });
    } catch (error) {
      logger.error('缓存预热失败:', error);
      res.status(500).json({
        success: false,
        message: '缓存预热失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取请求性能统计
   */
  static async getRequestStats(req: Request, res: Response): Promise<void> {
    try {
      const timeWindow = parseInt(req.query.timeWindow as string) || 60 * 60 * 1000; // 默认1小时
      const stats = PerformanceMonitor.getPerformanceStats(timeWindow);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('获取请求统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取请求统计失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取性能警报
   */
  static async getPerformanceAlerts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const alerts = PerformanceMonitor.getAlerts(limit);

      res.json({
        success: true,
        data: alerts,
        total: alerts.length
      });
    } catch (error) {
      logger.error('获取性能警报失败:', error);
      res.status(500).json({
        success: false,
        message: '获取性能警报失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 清除性能警报
   */
  static async clearPerformanceAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { olderThan } = req.body;
      const cutoffDate = olderThan ? new Date(olderThan) : undefined;
      
      PerformanceMonitor.clearAlerts(cutoffDate);

      res.json({
        success: true,
        message: '性能警报清除完成'
      });
    } catch (error) {
      logger.error('清除性能警报失败:', error);
      res.status(500).json({
        success: false,
        message: '清除性能警报失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取实时指标
   */
  static async getRealTimeMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = PerformanceMonitor.getRealTimeMetrics();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('获取实时指标失败:', error);
      res.status(500).json({
        success: false,
        message: '获取实时指标失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 导出性能数据
   */
  static async exportPerformanceData(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as 'json' | 'csv' || 'json';
      const data = PerformanceMonitor.exportMetrics(format);

      const filename = `performance_data_${Date.now()}.${format}`;
      const contentType = format === 'csv' ? 'text/csv' : 'application/json';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(data);
    } catch (error) {
      logger.error('导出性能数据失败:', error);
      res.status(500).json({
        success: false,
        message: '导出性能数据失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取分布式锁
   */
  static async acquireLock(req: Request, res: Response): Promise<void> {
    try {
      const { key, ttl } = req.body;

      if (!key) {
        res.status(400).json({
          success: false,
          message: '请提供锁键名'
        });
        return;
      }

      const lockValue = await CacheService.lock(key, ttl);

      if (lockValue) {
        res.json({
          success: true,
          data: {
            lock_key: key,
            lock_value: lockValue,
            ttl: ttl || 30
          },
          message: '获取分布式锁成功'
        });
      } else {
        res.status(409).json({
          success: false,
          message: '锁已被其他进程持有'
        });
      }
    } catch (error) {
      logger.error('获取分布式锁失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分布式锁失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 释放分布式锁
   */
  static async releaseLock(req: Request, res: Response): Promise<void> {
    try {
      const { key, lockValue } = req.body;

      if (!key || !lockValue) {
        res.status(400).json({
          success: false,
          message: '请提供锁键名和锁值'
        });
        return;
      }

      const released = await CacheService.unlock(key, lockValue);

      if (released) {
        res.json({
          success: true,
          message: '释放分布式锁成功'
        });
      } else {
        res.status(400).json({
          success: false,
          message: '锁值不匹配或锁已过期'
        });
      }
    } catch (error) {
      logger.error('释放分布式锁失败:', error);
      res.status(500).json({
        success: false,
        message: '释放分布式锁失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}