import fs from 'fs';
import path from 'path';
import { logger } from '@/utils/logger';
import { redisClient } from '@/config/redis';

export interface LogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  meta?: any;
  source?: string;
  user_id?: number;
  ip_address?: string;
  request_id?: string;
}

export interface LogAnalysis {
  total_entries: number;
  level_distribution: Record<string, number>;
  error_patterns: Array<{
    pattern: string;
    count: number;
    examples: string[];
  }>;
  top_error_messages: Array<{
    message: string;
    count: number;
    first_seen: Date;
    last_seen: Date;
  }>;
  hourly_distribution: Array<{
    hour: number;
    count: number;
    error_count: number;
  }>;
  user_activity: Array<{
    user_id: number;
    action_count: number;
    error_count: number;
  }>;
  performance_insights: {
    slow_operations: Array<{
      operation: string;
      avg_duration: number;
      count: number;
    }>;
    high_frequency_operations: Array<{
      operation: string;
      count: number;
      error_rate: number;
    }>;
  };
}

export interface LogSearchOptions {
  level?: 'error' | 'warn' | 'info' | 'debug';
  start_time?: Date;
  end_time?: Date;
  message_pattern?: string;
  user_id?: number;
  ip_address?: string;
  source?: string;
  limit?: number;
  offset?: number;
}

export interface LogAlert {
  id: string;
  name: string;
  description: string;
  conditions: {
    level?: string;
    message_pattern?: string;
    frequency_threshold?: number;
    time_window_minutes?: number;
  };
  enabled: boolean;
  last_triggered?: Date;
  notification_channels: string[];
}

export class LogAnalysisService {
  private static logBuffer: LogEntry[] = [];
  private static logAlerts: LogAlert[] = [];
  private static readonly MAX_BUFFER_SIZE = 10000;
  private static readonly LOG_RETENTION_DAYS = 30;

  /**
   * 初始化日志分析服务
   */
  static initialize(): void {
    // 初始化默认日志警报
    this.initializeDefaultAlerts();
    
    // 启动日志清理任务
    this.startLogCleanupTask();
    
    logger.info('日志分析服务初始化完成');
  }

  /**
   * 添加日志条目到缓冲区
   */
  static addLogEntry(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // 保持缓冲区大小在限制范围内
    if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logBuffer.shift();
    }

    // 异步保存到Redis
    this.saveLogToRedis(entry).catch(error => {
      console.error('保存日志到Redis失败:', error);
    });

    // 检查日志警报
    this.checkLogAlerts(entry).catch(error => {
      console.error('检查日志警报失败:', error);
    });
  }

  /**
   * 分析日志数据
   */
  static async analyzeLogData(
    startTime?: Date, 
    endTime?: Date
  ): Promise<LogAnalysis> {
    try {
      const logs = await this.getLogEntries({
        start_time: startTime,
        end_time: endTime,
        limit: 50000 // 分析最近5万条日志
      });

      const analysis: LogAnalysis = {
        total_entries: logs.length,
        level_distribution: this.analyzeLevelDistribution(logs),
        error_patterns: this.analyzeErrorPatterns(logs),
        top_error_messages: this.analyzeTopErrorMessages(logs),
        hourly_distribution: this.analyzeHourlyDistribution(logs),
        user_activity: this.analyzeUserActivity(logs),
        performance_insights: this.analyzePerformanceInsights(logs)
      };

      logger.info('日志分析完成', {
        totalEntries: analysis.total_entries,
        errorCount: analysis.level_distribution.error || 0,
        timeRange: { startTime, endTime }
      });

      return analysis;
    } catch (error) {
      logger.error('日志分析失败:', error);
      throw error;
    }
  }

  /**
   * 搜索日志
   */
  static async searchLogs(options: LogSearchOptions): Promise<{
    logs: LogEntry[];
    total: number;
    has_more: boolean;
  }> {
    try {
      const logs = await this.getLogEntries(options);
      const total = await this.countLogEntries(options);
      const hasMore = (options.offset || 0) + logs.length < total;

      return {
        logs,
        total,
        has_more: hasMore
      };
    } catch (error) {
      logger.error('搜索日志失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时日志流
   */
  static getRealtimeLogs(limit: number = 100): LogEntry[] {
    return this.logBuffer
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 导出日志数据
   */
  static async exportLogs(
    options: LogSearchOptions & { format: 'json' | 'csv' }
  ): Promise<string> {
    try {
      const logs = await this.getLogEntries(options);

      if (options.format === 'csv') {
        return this.exportLogsAsCSV(logs);
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      logger.error('导出日志失败:', error);
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
   * 获取日志警报规则列表
   */
  static getLogAlerts(): LogAlert[] {
    return [...this.logAlerts];
  }

  /**
   * 获取日志统计信息
   */
  static async getLogStatistics(timeWindow: number = 24 * 60 * 60 * 1000): Promise<{
    total_logs: number;
    error_logs: number;
    warn_logs: number;
    info_logs: number;
    debug_logs: number;
    error_rate: number;
    top_sources: Array<{ source: string; count: number }>;
    recent_errors: LogEntry[];
  }> {
    try {
      const startTime = new Date(Date.now() - timeWindow);
      const logs = await this.getLogEntries({ start_time: startTime });

      const levelCounts = this.analyzeLevelDistribution(logs);
      const sourceCounts = this.analyzeSourceDistribution(logs);
      const recentErrors = logs
        .filter(log => log.level === 'error')
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      return {
        total_logs: logs.length,
        error_logs: levelCounts.error || 0,
        warn_logs: levelCounts.warn || 0,
        info_logs: levelCounts.info || 0,
        debug_logs: levelCounts.debug || 0,
        error_rate: logs.length > 0 ? ((levelCounts.error || 0) / logs.length) * 100 : 0,
        top_sources: Object.entries(sourceCounts)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        recent_errors: recentErrors
      };
    } catch (error) {
      logger.error('获取日志统计失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期日志
   */
  static async cleanupOldLogs(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - this.LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
      const pattern = 'log:*';
      const keys = await redisClient.keys(pattern);
      
      let deletedCount = 0;
      
      for (const key of keys) {
        try {
          const logData = await redisClient.get(key);
          if (logData) {
            const log = JSON.parse(logData);
            if (new Date(log.timestamp) < cutoffDate) {
              await redisClient.del(key);
              deletedCount++;
            }
          }
        } catch (error) {
          // 忽略单个日志解析错误
          continue;
        }
      }

      logger.info('清理过期日志完成', { deletedCount, cutoffDate });
      return deletedCount;
    } catch (error) {
      logger.error('清理过期日志失败:', error);
      return 0;
    }
  }

  // 私有辅助方法

  private static initializeDefaultAlerts(): void {
    this.logAlerts = [
      {
        id: 'high_error_rate',
        name: '高错误率警报',
        description: '5分钟内错误日志超过10条',
        conditions: {
          level: 'error',
          frequency_threshold: 10,
          time_window_minutes: 5
        },
        enabled: true,
        notification_channels: ['log', 'email']
      },
      {
        id: 'database_errors',
        name: '数据库错误警报',
        description: '数据库相关错误',
        conditions: {
          level: 'error',
          message_pattern: 'database|sequelize|sql',
          frequency_threshold: 3,
          time_window_minutes: 10
        },
        enabled: true,
        notification_channels: ['log', 'email']
      },
      {
        id: 'authentication_failures',
        name: '认证失败警报',
        description: '认证失败次数过多',
        conditions: {
          message_pattern: 'authentication|login.*failed|unauthorized',
          frequency_threshold: 5,
          time_window_minutes: 5
        },
        enabled: true,
        notification_channels: ['log']
      }
    ];
  }

  private static startLogCleanupTask(): void {
    // 每天凌晨2点执行日志清理
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24小时
    
    setInterval(async () => {
      try {
        await this.cleanupOldLogs();
      } catch (error) {
        logger.error('定时日志清理失败:', error);
      }
    }, cleanupInterval);
  }

  private static async saveLogToRedis(entry: LogEntry): Promise<void> {
    try {
      const key = `log:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const ttl = this.LOG_RETENTION_DAYS * 24 * 60 * 60; // 秒
      
      await redisClient.setex(key, ttl, JSON.stringify(entry));
    } catch (error) {
      // 静默处理Redis保存错误，避免影响主要业务流程
      console.error('保存日志到Redis失败:', error);
    }
  }

  private static async checkLogAlerts(entry: LogEntry): Promise<void> {
    for (const alert of this.logAlerts) {
      if (!alert.enabled) continue;

      // 检查条件是否匹配
      if (!this.matchesAlertConditions(entry, alert.conditions)) {
        continue;
      }

      // 检查频率阈值
      if (alert.conditions.frequency_threshold && alert.conditions.time_window_minutes) {
        const recentCount = await this.countRecentMatchingLogs(alert);
        
        if (recentCount >= alert.conditions.frequency_threshold) {
          await this.triggerLogAlert(alert, entry, recentCount);
        }
      } else {
        // 立即触发警报
        await this.triggerLogAlert(alert, entry, 1);
      }
    }
  }

  private static matchesAlertConditions(entry: LogEntry, conditions: LogAlert['conditions']): boolean {
    // 检查日志级别
    if (conditions.level && entry.level !== conditions.level) {
      return false;
    }

    // 检查消息模式
    if (conditions.message_pattern) {
      const regex = new RegExp(conditions.message_pattern, 'i');
      if (!regex.test(entry.message)) {
        return false;
      }
    }

    return true;
  }

  private static async countRecentMatchingLogs(alert: LogAlert): Promise<number> {
    try {
      const timeWindow = (alert.conditions.time_window_minutes || 5) * 60 * 1000;
      const startTime = new Date(Date.now() - timeWindow);
      
      const logs = await this.getLogEntries({
        level: alert.conditions.level as any,
        start_time: startTime,
        message_pattern: alert.conditions.message_pattern,
        limit: 1000
      });

      return logs.length;
    } catch (error) {
      logger.error('统计匹配日志数量失败:', error);
      return 0;
    }
  }

  private static async triggerLogAlert(alert: LogAlert, entry: LogEntry, count: number): Promise<void> {
    // 检查冷却时间（避免重复警报）
    if (alert.last_triggered) {
      const cooldownMs = 10 * 60 * 1000; // 10分钟冷却时间
      if (Date.now() - alert.last_triggered.getTime() < cooldownMs) {
        return;
      }
    }

    alert.last_triggered = new Date();

    const alertMessage = `日志警报触发: ${alert.name} - 匹配条目数: ${count}`;
    
    // 发送通知
    for (const channel of alert.notification_channels) {
      try {
        switch (channel) {
          case 'log':
            logger.warn('日志警报', {
              alertId: alert.id,
              alertName: alert.name,
              count,
              triggerEntry: entry
            });
            break;
          case 'email':
            // 这里可以集成邮件发送服务
            logger.info('发送日志警报邮件', { alertId: alert.id });
            break;
          default:
            logger.warn('未知的通知渠道', { channel });
        }
      } catch (error) {
        logger.error(`发送日志警报通知失败 (${channel}):`, error);
      }
    }
  }

  private static async getLogEntries(options: LogSearchOptions): Promise<LogEntry[]> {
    try {
      // 首先从内存缓冲区获取
      let logs = [...this.logBuffer];

      // 然后从Redis获取更多历史日志
      const redisLogs = await this.getLogsFromRedis(options);
      logs = [...logs, ...redisLogs];

      // 应用过滤条件
      logs = this.filterLogs(logs, options);

      // 排序
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // 应用分页
      const offset = options.offset || 0;
      const limit = options.limit || 100;
      
      return logs.slice(offset, offset + limit);
    } catch (error) {
      logger.error('获取日志条目失败:', error);
      return [];
    }
  }

  private static async getLogsFromRedis(options: LogSearchOptions): Promise<LogEntry[]> {
    try {
      const pattern = 'log:*';
      const keys = await redisClient.keys(pattern);
      const logs: LogEntry[] = [];

      // 批量获取日志数据
      const batchSize = 100;
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const values = await redisClient.mget(...batch);
        
        for (const value of values) {
          if (value) {
            try {
              const log = JSON.parse(value);
              log.timestamp = new Date(log.timestamp);
              logs.push(log);
            } catch (error) {
              // 忽略解析错误的日志
              continue;
            }
          }
        }
      }

      return logs;
    } catch (error) {
      logger.error('从Redis获取日志失败:', error);
      return [];
    }
  }

  private static filterLogs(logs: LogEntry[], options: LogSearchOptions): LogEntry[] {
    return logs.filter(log => {
      // 过滤日志级别
      if (options.level && log.level !== options.level) {
        return false;
      }

      // 过滤时间范围
      if (options.start_time && log.timestamp < options.start_time) {
        return false;
      }
      if (options.end_time && log.timestamp > options.end_time) {
        return false;
      }

      // 过滤消息模式
      if (options.message_pattern) {
        const regex = new RegExp(options.message_pattern, 'i');
        if (!regex.test(log.message)) {
          return false;
        }
      }

      // 过滤用户ID
      if (options.user_id && log.user_id !== options.user_id) {
        return false;
      }

      // 过滤IP地址
      if (options.ip_address && log.ip_address !== options.ip_address) {
        return false;
      }

      // 过滤来源
      if (options.source && log.source !== options.source) {
        return false;
      }

      return true;
    });
  }

  private static async countLogEntries(options: LogSearchOptions): Promise<number> {
    const logs = await this.getLogEntries({ ...options, limit: undefined, offset: undefined });
    return logs.length;
  }

  private static analyzeLevelDistribution(logs: LogEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const log of logs) {
      distribution[log.level] = (distribution[log.level] || 0) + 1;
    }

    return distribution;
  }

  private static analyzeSourceDistribution(logs: LogEntry[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const log of logs) {
      const source = log.source || 'unknown';
      distribution[source] = (distribution[source] || 0) + 1;
    }

    return distribution;
  }

  private static analyzeErrorPatterns(logs: LogEntry[]): LogAnalysis['error_patterns'] {
    const errorLogs = logs.filter(log => log.level === 'error');
    const patterns = new Map<string, { count: number; examples: string[] }>();

    for (const log of errorLogs) {
      // 简单的错误模式识别
      const pattern = this.extractErrorPattern(log.message);
      
      if (!patterns.has(pattern)) {
        patterns.set(pattern, { count: 0, examples: [] });
      }

      const patternData = patterns.get(pattern)!;
      patternData.count++;
      
      if (patternData.examples.length < 3) {
        patternData.examples.push(log.message);
      }
    }

    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({ pattern, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static extractErrorPattern(message: string): string {
    // 简化的错误模式提取
    return message
      .replace(/\d+/g, 'N') // 替换数字
      .replace(/['"]/g, '') // 移除引号
      .replace(/\s+/g, ' ') // 标准化空格
      .substring(0, 100); // 限制长度
  }

  private static analyzeTopErrorMessages(logs: LogEntry[]): LogAnalysis['top_error_messages'] {
    const errorLogs = logs.filter(log => log.level === 'error');
    const messages = new Map<string, { count: number; first_seen: Date; last_seen: Date }>();

    for (const log of errorLogs) {
      if (!messages.has(log.message)) {
        messages.set(log.message, {
          count: 0,
          first_seen: log.timestamp,
          last_seen: log.timestamp
        });
      }

      const messageData = messages.get(log.message)!;
      messageData.count++;
      
      if (log.timestamp < messageData.first_seen) {
        messageData.first_seen = log.timestamp;
      }
      if (log.timestamp > messageData.last_seen) {
        messageData.last_seen = log.timestamp;
      }
    }

    return Array.from(messages.entries())
      .map(([message, data]) => ({ message, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static analyzeHourlyDistribution(logs: LogEntry[]): LogAnalysis['hourly_distribution'] {
    const hourly = new Array(24).fill(0).map((_, hour) => ({
      hour,
      count: 0,
      error_count: 0
    }));

    for (const log of logs) {
      const hour = log.timestamp.getHours();
      hourly[hour].count++;
      
      if (log.level === 'error') {
        hourly[hour].error_count++;
      }
    }

    return hourly;
  }

  private static analyzeUserActivity(logs: LogEntry[]): LogAnalysis['user_activity'] {
    const users = new Map<number, { action_count: number; error_count: number }>();

    for (const log of logs) {
      if (log.user_id) {
        if (!users.has(log.user_id)) {
          users.set(log.user_id, { action_count: 0, error_count: 0 });
        }

        const userData = users.get(log.user_id)!;
        userData.action_count++;
        
        if (log.level === 'error') {
          userData.error_count++;
        }
      }
    }

    return Array.from(users.entries())
      .map(([user_id, data]) => ({ user_id, ...data }))
      .sort((a, b) => b.action_count - a.action_count)
      .slice(0, 20);
  }

  private static analyzePerformanceInsights(logs: LogEntry[]): LogAnalysis['performance_insights'] {
    // 这是一个简化的实现，实际应该从性能日志中提取更详细的信息
    return {
      slow_operations: [],
      high_frequency_operations: []
    };
  }

  private static exportLogsAsCSV(logs: LogEntry[]): string {
    const headers = ['timestamp', 'level', 'message', 'source', 'user_id', 'ip_address'];
    const csvData = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        `"${log.message.replace(/"/g, '""')}"`, // 转义CSV中的引号
        log.source || '',
        log.user_id || '',
        log.ip_address || ''
      ].join(','))
    ];

    return csvData.join('\n');
  }
}