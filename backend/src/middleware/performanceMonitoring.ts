import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { redisClient } from '@/config/redis';

export interface RequestMetrics {
  method: string;
  path: string;
  status_code: number;
  response_time: number;
  timestamp: Date;
  user_id?: number;
  ip_address: string;
  user_agent: string;
  query_count?: number;
  cache_hits?: number;
  cache_misses?: number;
}

export interface PerformanceAlert {
  type: 'slow_request' | 'high_error_rate' | 'memory_usage' | 'database_slow';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
}

class PerformanceMonitor {
  private static metrics: RequestMetrics[] = [];
  private static alerts: PerformanceAlert[] = [];
  private static readonly MAX_METRICS_HISTORY = 10000;
  private static readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second
  private static readonly ERROR_RATE_THRESHOLD = 5; // 5%

  /**
   * 性能监控中间件
   */
  static middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      let queryCount = 0;
      let cacheHits = 0;
      let cacheMisses = 0;

      // 监听数据库查询
      const originalQuery = req.app.locals.sequelize?.query;
      if (originalQuery) {
        req.app.locals.sequelize.query = function (...args: any[]) {
          queryCount++;
          return originalQuery.apply(this, args);
        };
      }

      // 监听缓存操作
      const originalGet = redisClient.get;
      const originalSet = redisClient.set;

      (redisClient as any).get = async function (key: string) {
        const result = await originalGet.call(this, key);
        if (result !== null) {
          cacheHits++;
        } else {
          cacheMisses++;
        }
        return result;
      };

      // 响应结束时记录指标
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        const metrics: RequestMetrics = {
          method: req.method,
          path: req.route?.path || req.path,
          status_code: res.statusCode,
          response_time: responseTime,
          timestamp: new Date(),
          user_id: (req as any).user?.id,
          ip_address: req.ip || req.connection.remoteAddress || '',
          user_agent: req.get('User-Agent') || '',
          query_count: queryCount,
          cache_hits: cacheHits,
          cache_misses: cacheMisses
        };

        this.recordMetrics(metrics);
        this.checkAlerts(metrics);

        // 恢复原始方法
        if (originalQuery) {
          req.app.locals.sequelize.query = originalQuery;
        }
        redisClient.get = originalGet;
        redisClient.set = originalSet;
      });

      next();
    };
  }

  /**
   * 记录请求指标
   */
  private static recordMetrics(metrics: RequestMetrics): void {
    this.metrics.push(metrics);

    // 保持历史记录在限制范围内
    if (this.metrics.length > this.MAX_METRICS_HISTORY) {
      this.metrics.shift();
    }

    // 记录到日志
    if (metrics.response_time > this.SLOW_REQUEST_THRESHOLD) {
      logger.warn('慢请求检测', {
        method: metrics.method,
        path: metrics.path,
        responseTime: metrics.response_time,
        queryCount: metrics.query_count
      });
    }

    // 异步保存到Redis（用于跨实例统计）
    this.saveMetricsToRedis(metrics).catch(error => {
      logger.error('保存性能指标到Redis失败:', error);
    });
  }

  /**
   * 检查性能警报
   */
  private static checkAlerts(metrics: RequestMetrics): void {
    // 检查慢请求
    if (metrics.response_time > this.SLOW_REQUEST_THRESHOLD) {
      this.addAlert({
        type: 'slow_request',
        severity: metrics.response_time > 5000 ? 'critical' : 'high',
        message: `慢请求检测: ${metrics.method} ${metrics.path}`,
        details: {
          response_time: metrics.response_time,
          query_count: metrics.query_count,
          path: metrics.path
        },
        timestamp: new Date()
      });
    }

    // 检查错误率
    const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // 最近5分钟
    const errorCount = recentMetrics.filter(m => m.status_code >= 400).length;
    const errorRate = (errorCount / recentMetrics.length) * 100;

    if (errorRate > this.ERROR_RATE_THRESHOLD && recentMetrics.length > 10) {
      this.addAlert({
        type: 'high_error_rate',
        severity: errorRate > 20 ? 'critical' : 'high',
        message: `高错误率检测: ${errorRate.toFixed(1)}%`,
        details: {
          error_rate: errorRate,
          error_count: errorCount,
          total_requests: recentMetrics.length,
          time_window: '5分钟'
        },
        timestamp: new Date()
      });
    }

    // 检查内存使用
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 500) { // 500MB
      this.addAlert({
        type: 'memory_usage',
        severity: heapUsedMB > 1000 ? 'critical' : 'medium',
        message: `内存使用过高: ${heapUsedMB.toFixed(1)}MB`,
        details: {
          heap_used: heapUsedMB,
          heap_total: memUsage.heapTotal / 1024 / 1024,
          external: memUsage.external / 1024 / 1024
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * 添加警报
   */
  private static addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // 保持警报历史在合理范围内
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }

    // 记录到日志
    logger.warn('性能警报', alert);

    // 发送通知（这里可以集成邮件、短信等通知服务）
    if (alert.severity === 'critical') {
      this.sendCriticalAlert(alert);
    }
  }

  /**
   * 获取性能统计
   */
  static getPerformanceStats(timeWindow: number = 60 * 60 * 1000): {
    request_count: number;
    avg_response_time: number;
    error_rate: number;
    slow_request_count: number;
    top_slow_endpoints: Array<{ path: string; avg_time: number; count: number }>;
    status_code_distribution: Record<string, number>;
  } {
    const recentMetrics = this.getRecentMetrics(timeWindow);
    
    if (recentMetrics.length === 0) {
      return {
        request_count: 0,
        avg_response_time: 0,
        error_rate: 0,
        slow_request_count: 0,
        top_slow_endpoints: [],
        status_code_distribution: {}
      };
    }

    const totalResponseTime = recentMetrics.reduce((sum, m) => sum + m.response_time, 0);
    const errorCount = recentMetrics.filter(m => m.status_code >= 400).length;
    const slowRequestCount = recentMetrics.filter(m => m.response_time > this.SLOW_REQUEST_THRESHOLD).length;

    // 计算慢端点统计
    const endpointStats = new Map<string, { total_time: number; count: number }>();
    recentMetrics.forEach(m => {
      const key = `${m.method} ${m.path}`;
      const existing = endpointStats.get(key) || { total_time: 0, count: 0 };
      endpointStats.set(key, {
        total_time: existing.total_time + m.response_time,
        count: existing.count + 1
      });
    });

    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([path, stats]) => ({
        path,
        avg_time: stats.total_time / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avg_time - a.avg_time)
      .slice(0, 10);

    // 状态码分布
    const statusCodeDistribution: Record<string, number> = {};
    recentMetrics.forEach(m => {
      const statusGroup = `${Math.floor(m.status_code / 100)}xx`;
      statusCodeDistribution[statusGroup] = (statusCodeDistribution[statusGroup] || 0) + 1;
    });

    return {
      request_count: recentMetrics.length,
      avg_response_time: totalResponseTime / recentMetrics.length,
      error_rate: (errorCount / recentMetrics.length) * 100,
      slow_request_count: slowRequestCount,
      top_slow_endpoints: topSlowEndpoints,
      status_code_distribution: statusCodeDistribution
    };
  }

  /**
   * 获取警报列表
   */
  static getAlerts(limit: number = 50): PerformanceAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 清除警报
   */
  static clearAlerts(olderThan?: Date): void {
    if (olderThan) {
      this.alerts = this.alerts.filter(alert => alert.timestamp > olderThan);
    } else {
      this.alerts = [];
    }
  }

  /**
   * 获取实时指标
   */
  static getRealTimeMetrics(): {
    current_requests: number;
    avg_response_time_1min: number;
    error_rate_1min: number;
    memory_usage: NodeJS.MemoryUsage;
    cpu_usage: NodeJS.CpuUsage;
  } {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentMetrics = this.metrics.filter(m => m.timestamp.getTime() > oneMinuteAgo);
    
    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.response_time, 0) / recentMetrics.length
      : 0;

    const errorCount = recentMetrics.filter(m => m.status_code >= 400).length;
    const errorRate = recentMetrics.length > 0 ? (errorCount / recentMetrics.length) * 100 : 0;

    return {
      current_requests: recentMetrics.length,
      avg_response_time_1min: avgResponseTime,
      error_rate_1min: errorRate,
      memory_usage: process.memoryUsage(),
      cpu_usage: process.cpuUsage()
    };
  }

  /**
   * 导出性能数据
   */
  static exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'timestamp', 'method', 'path', 'status_code', 'response_time',
        'user_id', 'ip_address', 'query_count', 'cache_hits', 'cache_misses'
      ];
      
      const csvData = [
        headers.join(','),
        ...this.metrics.map(m => [
          m.timestamp.toISOString(),
          m.method,
          m.path,
          m.status_code,
          m.response_time,
          m.user_id || '',
          m.ip_address,
          m.query_count || 0,
          m.cache_hits || 0,
          m.cache_misses || 0
        ].join(','))
      ];
      
      return csvData.join('\n');
    }

    return JSON.stringify({
      metrics: this.metrics,
      alerts: this.alerts,
      exported_at: new Date().toISOString()
    }, null, 2);
  }

  // 私有辅助方法

  private static getRecentMetrics(timeWindow: number): RequestMetrics[] {
    const cutoff = Date.now() - timeWindow;
    return this.metrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  private static async saveMetricsToRedis(metrics: RequestMetrics): Promise<void> {
    try {
      const key = `performance:metrics:${Date.now()}`;
      await redisClient.setEx(key, 3600, JSON.stringify(metrics)); // 保存1小时
      
      // 更新统计计数器
      const date = new Date().toISOString().split('T')[0];
      await redisClient.hIncrBy(`performance:daily:${date}`, 'request_count', 1);
      await redisClient.hIncrBy(`performance:daily:${date}`, 'total_response_time', metrics.response_time);
      
      if (metrics.status_code >= 400) {
        await redisClient.hIncrBy(`performance:daily:${date}`, 'error_count', 1);
      }
    } catch (error) {
      logger.error('保存性能指标到Redis失败:', error);
    }
  }

  private static async sendCriticalAlert(alert: PerformanceAlert): Promise<void> {
    try {
      // 这里可以集成实际的通知服务
      // 例如：邮件、短信、Slack、钉钉等
      logger.error('关键性能警报', {
        type: alert.type,
        message: alert.message,
        details: alert.details
      });

      // 示例：发送到监控系统
      // await notificationService.sendAlert(alert);
    } catch (error) {
      logger.error('发送关键警报失败:', error);
    }
  }
}

export const performanceMonitoring = PerformanceMonitor.middleware();
export { PerformanceMonitor };