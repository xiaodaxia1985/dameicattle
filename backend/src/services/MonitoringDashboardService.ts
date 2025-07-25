import { SystemMonitoringService } from './SystemMonitoringService';
import { LogAnalysisService } from './LogAnalysisService';
import { logger, createContextLogger } from '@/utils/logger';

export interface DashboardMetrics {
  system_health: {
    status: string;
    score: number;
    components: any;
    last_check: Date;
  };
  system_metrics: {
    cpu: any;
    memory: any;
    disk: any;
    network: any;
    uptime_seconds: number;
  };
  alerts: {
    active_count: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    recent_alerts: any[];
  };
  logs: {
    total_entries_24h: number;
    error_rate_24h: number;
    top_errors: Array<{ message: string; count: number }>;
    level_distribution: Record<string, number>;
  };
  performance: {
    avg_response_time: number;
    slow_queries_count: number;
    database_health: string;
    redis_health: string;
  };
  trends: {
    health_trend_24h: Array<{ timestamp: Date; score: number }>;
    error_trend_24h: Array<{ timestamp: Date; count: number }>;
    performance_trend_24h: Array<{ timestamp: Date; avg_response_time: number }>;
  };
}

export interface MonitoringReport {
  id: string;
  generated_at: Date;
  period: {
    start: Date;
    end: Date;
    duration_hours: number;
  };
  summary: {
    overall_health_score: number;
    total_requests: number;
    error_rate: number;
    avg_response_time: number;
    uptime_percentage: number;
  };
  incidents: Array<{
    id: string;
    type: 'system' | 'application' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    occurred_at: Date;
    resolved_at?: Date;
    duration_minutes?: number;
  }>;
  recommendations: Array<{
    category: 'performance' | 'security' | 'reliability';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    action_items: string[];
  }>;
}

export class MonitoringDashboardService {
  private static readonly CACHE_TTL = 60 * 1000; // 1分钟缓存
  private static cachedMetrics: { data: DashboardMetrics; timestamp: number } | null = null;

  /**
   * 获取监控仪表盘指标
   */
  static async getDashboardMetrics(useCache: boolean = true): Promise<DashboardMetrics> {
    const contextLogger = createContextLogger({
      module: 'MonitoringDashboardService',
      action: 'getDashboardMetrics'
    });

    try {
      // 检查缓存
      if (useCache && this.cachedMetrics) {
        const age = Date.now() - this.cachedMetrics.timestamp;
        if (age < this.CACHE_TTL) {
          contextLogger.debug('返回缓存的仪表盘指标', { cacheAge: age });
          return this.cachedMetrics.data;
        }
      }

      contextLogger.info('生成新的仪表盘指标');

      // 并行获取各种指标
      const [
        systemHealth,
        systemMetrics,
        dashboardData,
        logStats
      ] = await Promise.all([
        SystemMonitoringService.performHealthCheck(),
        SystemMonitoringService.getSystemMetrics(),
        SystemMonitoringService.getDashboardData(),
        LogAnalysisService.getLogStatistics(1) // 最近24小时
      ]);

      // 构建仪表盘指标
      const metrics: DashboardMetrics = {
        system_health: {
          status: systemHealth.status,
          score: systemHealth.overall_score,
          components: systemHealth.components,
          last_check: systemHealth.timestamp
        },
        system_metrics: {
          cpu: systemMetrics.cpu,
          memory: systemMetrics.memory,
          disk: systemMetrics.disk,
          network: systemMetrics.network,
          uptime_seconds: systemMetrics.uptime_seconds
        },
        alerts: {
          active_count: dashboardData.active_alerts_count,
          critical_count: dashboardData.recent_alerts.filter(a => a.severity === 'critical').length,
          high_count: dashboardData.recent_alerts.filter(a => a.severity === 'high').length,
          medium_count: dashboardData.recent_alerts.filter(a => a.severity === 'medium').length,
          low_count: dashboardData.recent_alerts.filter(a => a.severity === 'low').length,
          recent_alerts: dashboardData.recent_alerts.slice(0, 5)
        },
        logs: {
          total_entries_24h: logStats.total_entries,
          error_rate_24h: logStats.error_rate,
          top_errors: logStats.top_errors.slice(0, 5),
          level_distribution: logStats.level_distribution
        },
        performance: {
          avg_response_time: await this.calculateAverageResponseTime(),
          slow_queries_count: await this.getSlowQueriesCount(),
          database_health: systemHealth.components.database.status,
          redis_health: systemHealth.components.redis.status
        },
        trends: {
          health_trend_24h: dashboardData.health_trend,
          error_trend_24h: logStats.recent_trends,
          performance_trend_24h: await this.getPerformanceTrend()
        }
      };

      // 更新缓存
      this.cachedMetrics = {
        data: metrics,
        timestamp: Date.now()
      };

      contextLogger.info('仪表盘指标生成完成', {
        systemStatus: metrics.system_health.status,
        activeAlerts: metrics.alerts.active_count,
        errorRate: metrics.logs.error_rate_24h
      });

      return metrics;
    } catch (error) {
      contextLogger.error('获取仪表盘指标失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 生成监控报告
   */
  static async generateMonitoringReport(
    startDate: Date,
    endDate: Date
  ): Promise<MonitoringReport> {
    const contextLogger = createContextLogger({
      module: 'MonitoringDashboardService',
      action: 'generateMonitoringReport'
    });

    try {
      contextLogger.info('开始生成监控报告', { startDate, endDate });

      const durationHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));

      // 获取历史数据
      const [
        healthHistory,
        logStats,
        alerts
      ] = await Promise.all([
        SystemMonitoringService.getHealthHistory(1000),
        LogAnalysisService.getLogStatistics(durationHours / 24),
        SystemMonitoringService.getAllAlerts(1000)
      ]);

      // 过滤时间范围内的数据
      const periodHealthHistory = healthHistory.filter(h => 
        h.timestamp >= startDate && h.timestamp <= endDate
      );

      const periodAlerts = alerts.filter(a => 
        a.triggered_at >= startDate && a.triggered_at <= endDate
      );

      // 计算汇总指标
      const totalHealthChecks = periodHealthHistory.length;
      const healthyChecks = periodHealthHistory.filter(h => h.status === 'healthy').length;
      const uptimePercentage = totalHealthChecks > 0 ? (healthyChecks / totalHealthChecks) * 100 : 0;

      const avgHealthScore = periodHealthHistory.length > 0 
        ? periodHealthHistory.reduce((sum, h) => sum + h.overall_score, 0) / periodHealthHistory.length
        : 0;

      // 构建事件列表
      const incidents = periodAlerts.map(alert => ({
        id: alert.id,
        type: this.categorizeAlertType(alert.rule_id),
        severity: alert.severity,
        title: alert.title,
        description: alert.message,
        occurred_at: alert.triggered_at,
        resolved_at: alert.resolved_at,
        duration_minutes: alert.resolved_at 
          ? Math.round((alert.resolved_at.getTime() - alert.triggered_at.getTime()) / (1000 * 60))
          : undefined
      }));

      // 生成建议
      const recommendations = await this.generateRecommendations(
        periodHealthHistory,
        logStats,
        incidents
      );

      const report: MonitoringReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        generated_at: new Date(),
        period: {
          start: startDate,
          end: endDate,
          duration_hours: durationHours
        },
        summary: {
          overall_health_score: Math.round(avgHealthScore),
          total_requests: logStats.total_entries,
          error_rate: logStats.error_rate,
          avg_response_time: await this.calculateAverageResponseTime(startDate, endDate),
          uptime_percentage: Math.round(uptimePercentage * 100) / 100
        },
        incidents: incidents.sort((a, b) => b.occurred_at.getTime() - a.occurred_at.getTime()),
        recommendations
      };

      contextLogger.info('监控报告生成完成', {
        reportId: report.id,
        incidentsCount: incidents.length,
        recommendationsCount: recommendations.length,
        healthScore: report.summary.overall_health_score
      });

      return report;
    } catch (error) {
      contextLogger.error('生成监控报告失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 获取系统健康趋势
   */
  static async getHealthTrend(hours: number = 24): Promise<Array<{ timestamp: Date; score: number; status: string }>> {
    const contextLogger = createContextLogger({
      module: 'MonitoringDashboardService',
      action: 'getHealthTrend'
    });

    try {
      const history = SystemMonitoringService.getHealthHistory(1000);
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const trend = history
        .filter(h => h.timestamp >= cutoffTime)
        .map(h => ({
          timestamp: h.timestamp,
          score: h.overall_score,
          status: h.status
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      contextLogger.debug('健康趋势获取完成', { dataPoints: trend.length, hours });

      return trend;
    } catch (error) {
      contextLogger.error('获取健康趋势失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 获取性能指标摘要
   */
  static async getPerformanceSummary(): Promise<{
    avg_response_time: number;
    p95_response_time: number;
    p99_response_time: number;
    slow_queries_count: number;
    database_avg_response: number;
    redis_avg_response: number;
  }> {
    const contextLogger = createContextLogger({
      module: 'MonitoringDashboardService',
      action: 'getPerformanceSummary'
    });

    try {
      const [
        avgResponseTime,
        performanceAnalysis,
        systemHealth
      ] = await Promise.all([
        this.calculateAverageResponseTime(),
        LogAnalysisService.analyzeLogData('performance'),
        SystemMonitoringService.performHealthCheck()
      ]);

      const summary = {
        avg_response_time: avgResponseTime,
        p95_response_time: 0,
        p99_response_time: 0,
        slow_queries_count: await this.getSlowQueriesCount(),
        database_avg_response: systemHealth.components.database.response_time_ms,
        redis_avg_response: systemHealth.components.redis.response_time_ms
      };

      // 从性能分析中提取P95和P99
      if (performanceAnalysis.operation_stats && performanceAnalysis.operation_stats.length > 0) {
        const allP95 = performanceAnalysis.operation_stats.map((op: any) => op.p95_ms).filter((p: number) => p > 0);
        const allP99 = performanceAnalysis.operation_stats.map((op: any) => op.p99_ms).filter((p: number) => p > 0);

        if (allP95.length > 0) {
          summary.p95_response_time = Math.round(allP95.reduce((sum: number, p: number) => sum + p, 0) / allP95.length);
        }

        if (allP99.length > 0) {
          summary.p99_response_time = Math.round(allP99.reduce((sum: number, p: number) => sum + p, 0) / allP99.length);
        }
      }

      contextLogger.debug('性能摘要获取完成', summary);

      return summary;
    } catch (error) {
      contextLogger.error('获取性能摘要失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    this.cachedMetrics = null;
    logger.info('监控仪表盘缓存已清除');
  }

  // 私有辅助方法

  private static async calculateAverageResponseTime(startDate?: Date, endDate?: Date): Promise<number> {
    try {
      const searchOptions = {
        startDate: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: endDate || new Date(),
        limit: 1000
      };

      const { entries } = await LogAnalysisService.searchLogs(searchOptions);
      
      const responseTimes = entries
        .filter(entry => entry.metadata?.duration_ms !== undefined)
        .map(entry => entry.metadata.duration_ms);

      if (responseTimes.length === 0) {
        return 0;
      }

      return Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
    } catch (error) {
      logger.warn('计算平均响应时间失败', { error: error instanceof Error ? error.message : error });
      return 0;
    }
  }

  private static async getSlowQueriesCount(): Promise<number> {
    try {
      const searchOptions = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        keyword: '慢查询',
        limit: 1000
      };

      const { entries } = await LogAnalysisService.searchLogs(searchOptions);
      return entries.length;
    } catch (error) {
      logger.warn('获取慢查询数量失败', { error: error instanceof Error ? error.message : error });
      return 0;
    }
  }

  private static async getPerformanceTrend(): Promise<Array<{ timestamp: Date; avg_response_time: number }>> {
    try {
      const trend: Array<{ timestamp: Date; avg_response_time: number }> = [];
      const now = new Date();

      // 获取最近24小时的每小时平均响应时间
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now);
        hourStart.setHours(now.getHours() - i, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourStart.getHours() + 1);

        const avgResponseTime = await this.calculateAverageResponseTime(hourStart, hourEnd);
        
        trend.push({
          timestamp: hourStart,
          avg_response_time: avgResponseTime
        });
      }

      return trend;
    } catch (error) {
      logger.warn('获取性能趋势失败', { error: error instanceof Error ? error.message : error });
      return [];
    }
  }

  private static categorizeAlertType(ruleId: string): 'system' | 'application' | 'security' {
    if (ruleId.includes('cpu') || ruleId.includes('memory') || ruleId.includes('disk')) {
      return 'system';
    } else if (ruleId.includes('security') || ruleId.includes('auth')) {
      return 'security';
    } else {
      return 'application';
    }
  }

  private static async generateRecommendations(
    healthHistory: any[],
    logStats: any,
    incidents: any[]
  ): Promise<MonitoringReport['recommendations']> {
    const recommendations: MonitoringReport['recommendations'] = [];

    // 性能建议
    if (logStats.error_rate > 5) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        title: '错误率过高',
        description: `当前错误率为 ${logStats.error_rate.toFixed(2)}%，超过了建议的5%阈值`,
        action_items: [
          '检查应用程序日志中的常见错误模式',
          '优化数据库查询性能',
          '增加错误处理和重试机制',
          '考虑增加服务器资源'
        ]
      });
    }

    // 系统资源建议
    const recentHealth = healthHistory.slice(-10);
    const avgCpuUsage = recentHealth.reduce((sum, h) => 
      sum + (h.components?.system?.metrics?.cpu?.usage_percent || 0), 0
    ) / recentHealth.length;

    if (avgCpuUsage > 80) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        title: 'CPU使用率持续偏高',
        description: `平均CPU使用率为 ${avgCpuUsage.toFixed(1)}%，建议优化或扩容`,
        action_items: [
          '分析CPU密集型操作',
          '优化算法和数据结构',
          '考虑水平扩展',
          '实施缓存策略'
        ]
      });
    }

    // 安全建议
    const securityIncidents = incidents.filter(i => i.type === 'security');
    if (securityIncidents.length > 0) {
      recommendations.push({
        category: 'security',
        priority: 'high',
        title: '检测到安全事件',
        description: `在报告期间检测到 ${securityIncidents.length} 个安全相关事件`,
        action_items: [
          '审查安全日志和访问模式',
          '更新安全策略和规则',
          '加强身份验证和授权',
          '考虑实施额外的安全监控'
        ]
      });
    }

    // 可靠性建议
    const criticalIncidents = incidents.filter(i => i.severity === 'critical');
    if (criticalIncidents.length > 2) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        title: '关键事件频发',
        description: `报告期间发生了 ${criticalIncidents.length} 个关键级别事件`,
        action_items: [
          '建立更完善的监控和告警机制',
          '实施自动故障恢复',
          '增加系统冗余和备份',
          '制定详细的事件响应计划'
        ]
      });
    }

    return recommendations;
  }
}