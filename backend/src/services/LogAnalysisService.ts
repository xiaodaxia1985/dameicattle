import fs from 'fs';
import path from 'path';
import { logger, createContextLogger } from '@/utils/logger';

export interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  service?: string;
  module?: string;
  requestId?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

export interface LogSearchOptions {
  level?: string;
  startDate?: Date;
  endDate?: Date;
  module?: string;
  userId?: string;
  requestId?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
}

export interface LogStatistics {
  total_entries: number;
  level_distribution: Record<string, number>;
  module_distribution: Record<string, number>;
  error_rate: number;
  top_errors: Array<{ message: string; count: number }>;
  hourly_distribution: Array<{ hour: number; count: number }>;
  recent_trends: Array<{ timestamp: Date; count: number }>;
}

export interface LogAlert {
  id: string;
  name: string;
  description: string;
  pattern: string;
  level?: string;
  threshold: number;
  time_window_minutes: number;
  enabled: boolean;
  last_triggered?: Date;
  notification_channels: string[];
}

export class LogAnalysisService {
  private static readonly LOG_DIR = path.join(process.cwd(), 'logs');
  private static logAlerts: LogAlert[] = [];
  private static alertCounts: Map<string, { count: number; windowStart: Date }> = new Map();
  private static initialized = false;

  /**
   * 初始化日志分析服务
   */
  static initialize(): void {
    if (this.initialized) {
      return;
    }

    const contextLogger = createContextLogger({
      module: 'LogAnalysisService',
      action: 'initialize'
    });

    try {
      // 初始化默认日志警报规则
      this.initializeDefaultLogAlerts();

      // 启动定期检查任务
      this.startPeriodicChecks();

      this.initialized = true;
      contextLogger.info('日志分析服务初始化完成');
    } catch (error) {
      contextLogger.error('日志分析服务初始化失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 初始化默认日志警报规则
   */
  private static initializeDefaultLogAlerts(): void {
    const defaultAlerts: Omit<LogAlert, 'id'>[] = [
      {
        name: '高错误率警报',
        description: '5分钟内错误日志超过10条',
        pattern: 'error',
        level: 'error',
        threshold: 10,
        time_window_minutes: 5,
        enabled: true,
        notification_channels: ['log', 'email']
      },
      {
        name: '安全事件警报',
        description: '检测到安全相关事件',
        pattern: 'security',
        threshold: 1,
        time_window_minutes: 1,
        enabled: true,
        notification_channels: ['log', 'email', 'sms']
      },
      {
        name: '数据库连接失败警报',
        description: '数据库连接失败事件',
        pattern: '数据库.*失败',
        level: 'error',
        threshold: 3,
        time_window_minutes: 5,
        enabled: true,
        notification_channels: ['log', 'email']
      },
      {
        name: '慢查询警报',
        description: '慢查询检测',
        pattern: '慢查询',
        level: 'warn',
        threshold: 5,
        time_window_minutes: 10,
        enabled: true,
        notification_channels: ['log']
      }
    ];

    defaultAlerts.forEach(alert => {
      this.addLogAlert(alert);
    });

    logger.info('默认日志警报规则初始化完成', { count: defaultAlerts.length });
  }

  /**
   * 启动定期检查任务
   */
  private static startPeriodicChecks(): void {
    // 每分钟检查一次日志警报
    setInterval(async () => {
      try {
        await this.checkLogAlerts();
      } catch (error) {
        logger.error('定期日志警报检查失败', { error: error instanceof Error ? error.message : error });
      }
    }, 60 * 1000);

    logger.info('日志警报定期检查任务已启动');
  }

  /**
   * 搜索日志条目
   */
  static async searchLogs(options: LogSearchOptions): Promise<{
    entries: LogEntry[];
    total: number;
    hasMore: boolean;
  }> {
    const contextLogger = createContextLogger({
      module: 'LogAnalysisService',
      action: 'searchLogs'
    });

    try {
      contextLogger.info('开始搜索日志', options);

      const logFiles = await this.getLogFiles();
      const entries: LogEntry[] = [];
      let totalCount = 0;

      for (const logFile of logFiles) {
        const fileEntries = await this.parseLogFile(logFile, options);
        entries.push(...fileEntries);
        totalCount += fileEntries.length;
      }

      // 按时间戳排序
      entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // 应用分页
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const paginatedEntries = entries.slice(offset, offset + limit);
      const hasMore = entries.length > offset + limit;

      contextLogger.info('日志搜索完成', {
        totalFound: entries.length,
        returned: paginatedEntries.length,
        hasMore
      });

      return {
        entries: paginatedEntries,
        total: entries.length,
        hasMore
      };
    } catch (error) {
      contextLogger.error('日志搜索失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 获取日志统计信息
   */
  static async getLogStatistics(days: number = 7): Promise<LogStatistics> {
    const contextLogger = createContextLogger({
      module: 'LogAnalysisService',
      action: 'getLogStatistics'
    });

    try {
      contextLogger.info('开始获取日志统计', { days });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const searchOptions: LogSearchOptions = {
        startDate,
        limit: 10000 // 获取更多数据用于统计
      };

      const { entries } = await this.searchLogs(searchOptions);

      const statistics: LogStatistics = {
        total_entries: entries.length,
        level_distribution: {},
        module_distribution: {},
        error_rate: 0,
        top_errors: [],
        hourly_distribution: Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 })),
        recent_trends: []
      };

      // 计算级别分布
      const levelCounts: Record<string, number> = {};
      const moduleCounts: Record<string, number> = {};
      const errorMessages: Record<string, number> = {};
      let errorCount = 0;

      entries.forEach(entry => {
        // 级别分布
        levelCounts[entry.level] = (levelCounts[entry.level] || 0) + 1;

        // 模块分布
        if (entry.module) {
          moduleCounts[entry.module] = (moduleCounts[entry.module] || 0) + 1;
        }

        // 错误统计
        if (entry.level === 'error') {
          errorCount++;
          const errorMsg = entry.message.substring(0, 100); // 截取前100字符
          errorMessages[errorMsg] = (errorMessages[errorMsg] || 0) + 1;
        }

        // 小时分布
        const hour = entry.timestamp.getHours();
        statistics.hourly_distribution[hour].count++;
      });

      statistics.level_distribution = levelCounts;
      statistics.module_distribution = moduleCounts;
      statistics.error_rate = entries.length > 0 ? (errorCount / entries.length) * 100 : 0;

      // 获取前10个错误
      statistics.top_errors = Object.entries(errorMessages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([message, count]) => ({ message, count }));

      // 计算最近趋势（按小时）
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now);
        hourStart.setHours(now.getHours() - i, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourStart.getHours() + 1);

        const hourCount = entries.filter(entry => 
          entry.timestamp >= hourStart && entry.timestamp < hourEnd
        ).length;

        statistics.recent_trends.push({
          timestamp: hourStart,
          count: hourCount
        });
      }

      contextLogger.info('日志统计获取完成', {
        totalEntries: statistics.total_entries,
        errorRate: statistics.error_rate
      });

      return statistics;
    } catch (error) {
      contextLogger.error('获取日志统计失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 分析日志数据
   */
  static async analyzeLogData(analysisType: 'errors' | 'performance' | 'security' | 'trends', options?: any): Promise<any> {
    const contextLogger = createContextLogger({
      module: 'LogAnalysisService',
      action: 'analyzeLogData'
    });

    try {
      contextLogger.info('开始日志数据分析', { analysisType, options });

      switch (analysisType) {
        case 'errors':
          return await this.analyzeErrors(options);
        case 'performance':
          return await this.analyzePerformance(options);
        case 'security':
          return await this.analyzeSecurity(options);
        case 'trends':
          return await this.analyzeTrends(options);
        default:
          throw new Error(`不支持的分析类型: ${analysisType}`);
      }
    } catch (error) {
      contextLogger.error('日志数据分析失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 获取实时日志
   */
  static async getRealtimeLogs(limit: number = 50): Promise<LogEntry[]> {
    const contextLogger = createContextLogger({
      module: 'LogAnalysisService',
      action: 'getRealtimeLogs'
    });

    try {
      contextLogger.debug('获取实时日志', { limit });

      const searchOptions: LogSearchOptions = {
        limit,
        offset: 0
      };

      const { entries } = await this.searchLogs(searchOptions);
      return entries;
    } catch (error) {
      contextLogger.error('获取实时日志失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 导出日志
   */
  static async exportLogs(options: LogSearchOptions, format: 'json' | 'csv' = 'json'): Promise<string> {
    const contextLogger = createContextLogger({
      module: 'LogAnalysisService',
      action: 'exportLogs'
    });

    try {
      contextLogger.info('开始导出日志', { format, options });

      const { entries } = await this.searchLogs({ ...options, limit: 10000 });

      if (format === 'json') {
        return JSON.stringify(entries, null, 2);
      } else if (format === 'csv') {
        return this.convertToCSV(entries);
      }

      throw new Error(`不支持的导出格式: ${format}`);
    } catch (error) {
      contextLogger.error('导出日志失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 清理旧日志
   */
  static async cleanupOldLogs(daysToKeep: number = 30): Promise<{ deletedFiles: string[]; totalSize: number }> {
    const contextLogger = createContextLogger({
      module: 'LogAnalysisService',
      action: 'cleanupOldLogs'
    });

    try {
      contextLogger.info('开始清理旧日志', { daysToKeep });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const logFiles = await this.getLogFiles();
      const deletedFiles: string[] = [];
      let totalSize = 0;

      for (const logFile of logFiles) {
        const stats = fs.statSync(logFile);
        if (stats.mtime < cutoffDate) {
          totalSize += stats.size;
          fs.unlinkSync(logFile);
          deletedFiles.push(path.basename(logFile));
        }
      }

      contextLogger.info('旧日志清理完成', {
        deletedCount: deletedFiles.length,
        totalSizeMB: Math.round(totalSize / (1024 * 1024))
      });

      return { deletedFiles, totalSize };
    } catch (error) {
      contextLogger.error('清理旧日志失败', { error: error instanceof Error ? error.message : error });
      throw error;
    }
  }

  /**
   * 添加日志警报规则
   */
  static addLogAlert(alert: Omit<LogAlert, 'id'>): LogAlert {
    const newAlert: LogAlert = {
      ...alert,
      id: `log_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.logAlerts.push(newAlert);
    logger.info('添加日志警报规则', { alertId: newAlert.id, name: newAlert.name });

    return newAlert;
  }

  /**
   * 更新日志警报规则
   */
  static updateLogAlert(alertId: string, updates: Partial<LogAlert>): boolean {
    const alertIndex = this.logAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) {
      return false;
    }

    this.logAlerts[alertIndex] = { ...this.logAlerts[alertIndex], ...updates };
    logger.info('更新日志警报规则', { alertId, updates });

    return true;
  }

  /**
   * 删除日志警报规则
   */
  static deleteLogAlert(alertId: string): boolean {
    const alertIndex = this.logAlerts.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) {
      return false;
    }

    this.logAlerts.splice(alertIndex, 1);
    logger.info('删除日志警报规则', { alertId });

    return true;
  }

  /**
   * 获取日志警报规则
   */
  static getLogAlerts(): LogAlert[] {
    return [...this.logAlerts];
  }

  /**
   * 检查日志警报
   */
  static async checkLogAlerts(): Promise<void> {
    const contextLogger = createContextLogger({
      module: 'LogAnalysisService',
      action: 'checkLogAlerts'
    });

    try {
      for (const alert of this.logAlerts) {
        if (!alert.enabled) continue;

        await this.checkSingleLogAlert(alert);
      }
    } catch (error) {
      contextLogger.error('检查日志警报失败', { error: error instanceof Error ? error.message : error });
    }
  }

  // 私有辅助方法

  private static async getLogFiles(): Promise<string[]> {
    if (!fs.existsSync(this.LOG_DIR)) {
      return [];
    }

    const files = fs.readdirSync(this.LOG_DIR);
    return files
      .filter(file => file.endsWith('.log'))
      .map(file => path.join(this.LOG_DIR, file));
  }

  private static async parseLogFile(filePath: string, options: LogSearchOptions): Promise<LogEntry[]> {
    const entries: LogEntry[] = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as LogEntry;
          entry.timestamp = new Date(entry.timestamp);

          // 应用过滤条件
          if (this.matchesSearchOptions(entry, options)) {
            entries.push(entry);
          }
        } catch (parseError) {
          // 跳过无法解析的行
          continue;
        }
      }
    } catch (error) {
      logger.warn('解析日志文件失败', { filePath, error: error instanceof Error ? error.message : error });
    }

    return entries;
  }

  private static matchesSearchOptions(entry: LogEntry, options: LogSearchOptions): boolean {
    if (options.level && entry.level !== options.level) {
      return false;
    }

    if (options.startDate && entry.timestamp < options.startDate) {
      return false;
    }

    if (options.endDate && entry.timestamp > options.endDate) {
      return false;
    }

    if (options.module && entry.module !== options.module) {
      return false;
    }

    if (options.userId && entry.userId !== options.userId) {
      return false;
    }

    if (options.requestId && entry.requestId !== options.requestId) {
      return false;
    }

    if (options.keyword) {
      const keyword = options.keyword.toLowerCase();
      const searchText = `${entry.message} ${JSON.stringify(entry.metadata || {})}`.toLowerCase();
      if (!searchText.includes(keyword)) {
        return false;
      }
    }

    return true;
  }

  private static async analyzeErrors(options?: any): Promise<any> {
    const searchOptions: LogSearchOptions = {
      level: 'error',
      startDate: options?.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
      limit: 1000
    };

    const { entries } = await this.searchLogs(searchOptions);

    const errorPatterns: Record<string, number> = {};
    const errorModules: Record<string, number> = {};

    entries.forEach(entry => {
      // 分析错误模式
      const pattern = entry.message.replace(/\d+/g, 'N').replace(/['"]/g, '');
      errorPatterns[pattern] = (errorPatterns[pattern] || 0) + 1;

      // 分析错误模块
      if (entry.module) {
        errorModules[entry.module] = (errorModules[entry.module] || 0) + 1;
      }
    });

    return {
      total_errors: entries.length,
      error_patterns: Object.entries(errorPatterns)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([pattern, count]) => ({ pattern, count })),
      error_modules: Object.entries(errorModules)
        .sort(([, a], [, b]) => b - a)
        .map(([module, count]) => ({ module, count }))
    };
  }

  private static async analyzePerformance(options?: any): Promise<any> {
    const searchOptions: LogSearchOptions = {
      startDate: options?.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
      limit: 1000
    };

    const { entries } = await this.searchLogs(searchOptions);

    const performanceEntries = entries.filter(entry => 
      entry.metadata?.type === 'performance' || 
      entry.metadata?.duration_ms !== undefined
    );

    const operationTimes: Record<string, number[]> = {};

    performanceEntries.forEach(entry => {
      const operation = entry.metadata?.operation || 'unknown';
      const duration = entry.metadata?.duration_ms;

      if (duration !== undefined) {
        if (!operationTimes[operation]) {
          operationTimes[operation] = [];
        }
        operationTimes[operation].push(duration);
      }
    });

    const performanceStats = Object.entries(operationTimes).map(([operation, times]) => {
      times.sort((a, b) => a - b);
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const p95 = times[Math.floor(times.length * 0.95)];
      const p99 = times[Math.floor(times.length * 0.99)];

      return {
        operation,
        count: times.length,
        avg_ms: Math.round(avg),
        p95_ms: p95,
        p99_ms: p99,
        min_ms: times[0],
        max_ms: times[times.length - 1]
      };
    });

    return {
      total_performance_entries: performanceEntries.length,
      operation_stats: performanceStats.sort((a, b) => b.avg_ms - a.avg_ms)
    };
  }

  private static async analyzeSecurity(options?: any): Promise<any> {
    const searchOptions: LogSearchOptions = {
      startDate: options?.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
      keyword: 'security',
      limit: 1000
    };

    const { entries } = await this.searchLogs(searchOptions);

    const securityEvents: Record<string, number> = {};
    const suspiciousIPs: Record<string, number> = {};

    entries.forEach(entry => {
      if (entry.metadata?.type === 'security') {
        const event = entry.metadata.event || 'unknown';
        securityEvents[event] = (securityEvents[event] || 0) + 1;

        const ip = entry.metadata.ip;
        if (ip) {
          suspiciousIPs[ip] = (suspiciousIPs[ip] || 0) + 1;
        }
      }
    });

    return {
      total_security_events: entries.length,
      security_events: Object.entries(securityEvents)
        .sort(([, a], [, b]) => b - a)
        .map(([event, count]) => ({ event, count })),
      suspicious_ips: Object.entries(suspiciousIPs)
        .filter(([, count]) => count > 5)
        .sort(([, a], [, b]) => b - a)
        .map(([ip, count]) => ({ ip, count }))
    };
  }

  private static async analyzeTrends(options?: any): Promise<any> {
    const days = options?.days || 7;
    const searchOptions: LogSearchOptions = {
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      limit: 10000
    };

    const { entries } = await this.searchLogs(searchOptions);

    const dailyTrends: Record<string, Record<string, number>> = {};

    entries.forEach(entry => {
      const date = entry.timestamp.toISOString().split('T')[0];
      const level = entry.level;

      if (!dailyTrends[date]) {
        dailyTrends[date] = {};
      }

      dailyTrends[date][level] = (dailyTrends[date][level] || 0) + 1;
    });

    return {
      daily_trends: Object.entries(dailyTrends)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, levels]) => ({ date, levels }))
    };
  }

  private static convertToCSV(entries: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'message', 'service', 'module', 'requestId', 'userId', 'action'];
    const csvLines = [headers.join(',')];

    entries.forEach(entry => {
      const row = [
        entry.timestamp.toISOString(),
        entry.level,
        `"${entry.message.replace(/"/g, '""')}"`,
        entry.service || '',
        entry.module || '',
        entry.requestId || '',
        entry.userId || '',
        entry.action || ''
      ];
      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  }

  private static async checkSingleLogAlert(alert: LogAlert): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - alert.time_window_minutes * 60 * 1000);

    const searchOptions: LogSearchOptions = {
      startDate: windowStart,
      level: alert.level,
      keyword: alert.pattern,
      limit: 1000
    };

    const { entries } = await this.searchLogs(searchOptions);
    const matchCount = entries.length;

    const alertKey = alert.id;
    const currentWindow = this.alertCounts.get(alertKey);

    // 检查是否需要重置窗口
    if (!currentWindow || now.getTime() - currentWindow.windowStart.getTime() > alert.time_window_minutes * 60 * 1000) {
      this.alertCounts.set(alertKey, { count: matchCount, windowStart: now });
    } else {
      this.alertCounts.set(alertKey, { ...currentWindow, count: matchCount });
    }

    // 检查是否触发警报
    if (matchCount >= alert.threshold) {
      const timeSinceLastTrigger = alert.last_triggered ? 
        now.getTime() - alert.last_triggered.getTime() : 
        Infinity;

      // 避免频繁触发（至少间隔5分钟）
      if (timeSinceLastTrigger > 5 * 60 * 1000) {
        await this.triggerLogAlert(alert, matchCount);
        alert.last_triggered = now;
      }
    }
  }

  private static async triggerLogAlert(alert: LogAlert, matchCount: number): Promise<void> {
    const alertMessage = `日志警报触发: ${alert.name} - 在${alert.time_window_minutes}分钟内检测到${matchCount}次匹配（阈值: ${alert.threshold}）`;

    logger.warn('日志警报触发', {
      alertId: alert.id,
      alertName: alert.name,
      matchCount,
      threshold: alert.threshold,
      timeWindow: alert.time_window_minutes
    });

    // 这里可以集成通知服务
    for (const channel of alert.notification_channels) {
      try {
        switch (channel) {
          case 'log':
            logger.error(alertMessage);
            break;
          case 'email':
            // 集成邮件发送
            logger.info('发送邮件警报', { alertId: alert.id });
            break;
          case 'sms':
            // 集成短信发送
            logger.info('发送短信警报', { alertId: alert.id });
            break;
          default:
            logger.warn('未知的通知渠道', { channel });
        }
      } catch (error) {
        logger.error(`发送日志警报通知失败 (${channel}):`, error);
      }
    }
  }
}