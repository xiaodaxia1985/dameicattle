import { QueryTypes } from 'sequelize';
import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';
import { logger } from '@/utils/logger';
import os from 'os';
import fs from 'fs';
import path from 'path';

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down';
  timestamp: Date;
  components: {
    database: ComponentHealth;
    redis: ComponentHealth;
    application: ComponentHealth;
    system: ComponentHealth;
  };
  overall_score: number;
}

export interface ComponentHealth {
  status: 'healthy' | 'warning' | 'critical' | 'down';
  response_time_ms: number;
  error_rate: number;
  metrics: Record<string, any>;
  last_check: Date;
  message?: string;
}

export interface SystemMetrics {
  cpu: {
    usage_percent: number;
    load_average: number[];
    cores: number;
  };
  memory: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    usage_percent: number;
  };
  disk: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    usage_percent: number;
  };
  network: {
    bytes_sent: number;
    bytes_received: number;
    packets_sent: number;
    packets_received: number;
  };
  uptime_seconds: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown_minutes: number;
  last_triggered?: Date;
  notification_channels: string[];
}

export interface Alert {
  id: string;
  rule_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metric_value: number;
  threshold: number;
  triggered_at: Date;
  resolved_at?: Date;
  status: 'active' | 'resolved' | 'acknowledged';
  acknowledged_by?: string;
  acknowledged_at?: Date;
}

export class SystemMonitoringService {
  private static healthHistory: SystemHealth[] = [];
  private static alertRules: AlertRule[] = [];
  private static activeAlerts: Alert[] = [];
  private static readonly MAX_HISTORY_SIZE = 1000;

  /**
   * 初始化默认监控规则
   */
  static initializeDefaultRules(): void {
    this.alertRules = [
      {
        id: 'cpu_high',
        name: 'CPU使用率过高',
        description: 'CPU使用率超过80%',
        metric: 'cpu.usage_percent',
        operator: '>',
        threshold: 80,
        severity: 'high',
        enabled: true,
        cooldown_minutes: 5,
        notification_channels: ['email', 'log']
      },
      {
        id: 'memory_high',
        name: '内存使用率过高',
        description: '内存使用率超过85%',
        metric: 'memory.usage_percent',
        operator: '>',
        threshold: 85,
        severity: 'high',
        enabled: true,
        cooldown_minutes: 5,
        notification_channels: ['email', 'log']
      },
      {
        id: 'disk_high',
        name: '磁盘使用率过高',
        description: '磁盘使用率超过90%',
        metric: 'disk.usage_percent',
        operator: '>',
        threshold: 90,
        severity: 'critical',
        enabled: true,
        cooldown_minutes: 10,
        notification_channels: ['email', 'sms', 'log']
      },
      {
        id: 'db_response_slow',
        name: '数据库响应缓慢',
        description: '数据库响应时间超过1000ms',
        metric: 'database.response_time_ms',
        operator: '>',
        threshold: 1000,
        severity: 'medium',
        enabled: true,
        cooldown_minutes: 3,
        notification_channels: ['log']
      },
      {
        id: 'redis_response_slow',
        name: 'Redis响应缓慢',
        description: 'Redis响应时间超过100ms',
        metric: 'redis.response_time_ms',
        operator: '>',
        threshold: 100,
        severity: 'medium',
        enabled: true,
        cooldown_minutes: 3,
        notification_channels: ['log']
      },
      {
        id: 'error_rate_high',
        name: '错误率过高',
        description: '应用程序错误率超过5%',
        metric: 'application.error_rate',
        operator: '>',
        threshold: 5,
        severity: 'high',
        enabled: true,
        cooldown_minutes: 5,
        notification_channels: ['email', 'log']
      }
    ];

    logger.info('默认监控规则初始化完成', { rulesCount: this.alertRules.length });
  }

  /**
   * 执行系统健康检查
   */
  static async performHealthCheck(): Promise<SystemHealth> {
    try {
      const startTime = Date.now();

      const [databaseHealth, redisHealth, applicationHealth, systemHealth] = await Promise.all([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
        this.checkApplicationHealth(),
        this.checkSystemHealth()
      ]);

      const components = {
        database: databaseHealth,
        redis: redisHealth,
        application: applicationHealth,
        system: systemHealth
      };

      // 计算整体健康评分
      const scores = {
        healthy: 100,
        warning: 70,
        critical: 30,
        down: 0
      };

      const componentScores = Object.values(components).map(comp => scores[comp.status]);
      const overallScore = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length;

      // 确定整体状态
      let overallStatus: SystemHealth['status'] = 'healthy';
      if (overallScore < 30) {
        overallStatus = 'critical';
      } else if (overallScore < 70) {
        overallStatus = 'warning';
      } else if (componentScores.some(score => score === 0)) {
        overallStatus = 'critical';
      }

      const health: SystemHealth = {
        status: overallStatus,
        timestamp: new Date(),
        components,
        overall_score: overallScore
      };

      // 保存到历史记录
      this.healthHistory.push(health);
      if (this.healthHistory.length > this.MAX_HISTORY_SIZE) {
        this.healthHistory.shift();
      }

      // 检查警报规则
      await this.checkAlertRules(health);

      logger.debug('系统健康检查完成', {
        status: overallStatus,
        score: overallScore,
        duration: Date.now() - startTime
      });

      return health;
    } catch (error) {
      logger.error('系统健康检查失败:', error);
      
      const criticalHealth: SystemHealth = {
        status: 'critical',
        timestamp: new Date(),
        components: {
          database: { status: 'down', response_time_ms: 0, error_rate: 100, metrics: {}, last_check: new Date() },
          redis: { status: 'down', response_time_ms: 0, error_rate: 100, metrics: {}, last_check: new Date() },
          application: { status: 'down', response_time_ms: 0, error_rate: 100, metrics: {}, last_check: new Date() },
          system: { status: 'down', response_time_ms: 0, error_rate: 100, metrics: {}, last_check: new Date() }
        },
        overall_score: 0
      };

      return criticalHealth;
    }
  }

  /**
   * 获取系统指标
   */
  static async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const cpus = os.cpus();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // 获取磁盘使用情况
      const diskUsage = await this.getDiskUsage();

      // 获取网络统计（简化版本）
      const networkStats = await this.getNetworkStats();

      const metrics: SystemMetrics = {
        cpu: {
          usage_percent: await this.getCpuUsage(),
          load_average: os.loadavg(),
          cores: cpus.length
        },
        memory: {
          total_mb: Math.round(totalMem / 1024 / 1024),
          used_mb: Math.round(usedMem / 1024 / 1024),
          free_mb: Math.round(freeMem / 1024 / 1024),
          usage_percent: Math.round((usedMem / totalMem) * 100)
        },
        disk: diskUsage,
        network: networkStats,
        uptime_seconds: os.uptime()
      };

      return metrics;
    } catch (error) {
      logger.error('获取系统指标失败:', error);
      throw error;
    }
  }

  /**
   * 添加警报规则
   */
  static addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.alertRules.push(newRule);
    logger.info('添加警报规则', { ruleId: newRule.id, name: newRule.name });

    return newRule;
  }

  /**
   * 更新警报规则
   */
  static updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return false;
    }

    this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
    logger.info('更新警报规则', { ruleId, updates });

    return true;
  }

  /**
   * 删除警报规则
   */
  static deleteAlertRule(ruleId: string): boolean {
    const ruleIndex = this.alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return false;
    }

    this.alertRules.splice(ruleIndex, 1);
    logger.info('删除警报规则', { ruleId });

    return true;
  }

  /**
   * 获取警报规则列表
   */
  static getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * 获取活跃警报
   */
  static getActiveAlerts(): Alert[] {
    return this.activeAlerts.filter(alert => alert.status === 'active');
  }

  /**
   * 获取所有警报
   */
  static getAllAlerts(limit: number = 100): Alert[] {
    return this.activeAlerts
      .sort((a, b) => b.triggered_at.getTime() - a.triggered_at.getTime())
      .slice(0, limit);
  }

  /**
   * 确认警报
   */
  static acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (!alert || alert.status !== 'active') {
      return false;
    }

    alert.status = 'acknowledged';
    alert.acknowledged_by = acknowledgedBy;
    alert.acknowledged_at = new Date();

    logger.info('警报已确认', { alertId, acknowledgedBy });
    return true;
  }

  /**
   * 解决警报
   */
  static resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (!alert) {
      return false;
    }

    alert.status = 'resolved';
    alert.resolved_at = new Date();

    logger.info('警报已解决', { alertId });
    return true;
  }

  /**
   * 获取健康历史
   */
  static getHealthHistory(limit: number = 100): SystemHealth[] {
    return this.healthHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 获取监控仪表盘数据
   */
  static async getDashboardData(): Promise<{
    current_health: SystemHealth;
    system_metrics: SystemMetrics;
    active_alerts_count: number;
    recent_alerts: Alert[];
    health_trend: Array<{ timestamp: Date; score: number }>;
  }> {
    try {
      const [currentHealth, systemMetrics] = await Promise.all([
        this.performHealthCheck(),
        this.getSystemMetrics()
      ]);

      const activeAlerts = this.getActiveAlerts();
      const recentAlerts = this.getAllAlerts(10);

      // 获取健康趋势（最近24小时）
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const healthTrend = this.healthHistory
        .filter(h => h.timestamp > oneDayAgo)
        .map(h => ({
          timestamp: h.timestamp,
          score: h.overall_score
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return {
        current_health: currentHealth,
        system_metrics: systemMetrics,
        active_alerts_count: activeAlerts.length,
        recent_alerts: recentAlerts,
        health_trend: healthTrend
      };
    } catch (error) {
      logger.error('获取监控仪表盘数据失败:', error);
      throw error;
    }
  }

  // 私有辅助方法

  private static async checkDatabaseHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // 执行简单的数据库查询
      await sequelize.query('SELECT 1', { type: QueryTypes.SELECT });
      
      const responseTime = Date.now() - startTime;
      
      // 获取数据库连接信息
      const [connectionStats] = await sequelize.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
      `, { type: QueryTypes.SELECT }) as any[];

      const metrics = {
        total_connections: parseInt(connectionStats.total_connections) || 0,
        active_connections: parseInt(connectionStats.active_connections) || 0,
        idle_connections: parseInt(connectionStats.idle_connections) || 0
      };

      let status: ComponentHealth['status'] = 'healthy';
      if (responseTime > 1000) {
        status = 'critical';
      } else if (responseTime > 500) {
        status = 'warning';
      }

      return {
        status,
        response_time_ms: responseTime,
        error_rate: 0,
        metrics,
        last_check: new Date()
      };
    } catch (error) {
      logger.error('数据库健康检查失败:', error);
      
      return {
        status: 'down',
        response_time_ms: Date.now() - startTime,
        error_rate: 100,
        metrics: {},
        last_check: new Date(),
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private static async checkRedisHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // 执行Redis ping命令
      await redisClient.ping();
      
      const responseTime = Date.now() - startTime;
      
      // 获取Redis信息
      const info = await redisClient.info();
      const lines = info.split('\r\n');
      const metrics: any = {};

      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          if (key === 'used_memory') {
            metrics.memory_usage_mb = parseInt(value) / (1024 * 1024);
          } else if (key === 'connected_clients') {
            metrics.connected_clients = parseInt(value);
          } else if (key === 'total_commands_processed') {
            metrics.total_commands = parseInt(value);
          }
        }
      });

      let status: ComponentHealth['status'] = 'healthy';
      if (responseTime > 100) {
        status = 'warning';
      } else if (responseTime > 500) {
        status = 'critical';
      }

      return {
        status,
        response_time_ms: responseTime,
        error_rate: 0,
        metrics,
        last_check: new Date()
      };
    } catch (error) {
      logger.error('Redis健康检查失败:', error);
      
      return {
        status: 'down',
        response_time_ms: Date.now() - startTime,
        error_rate: 100,
        metrics: {},
        last_check: new Date(),
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private static async checkApplicationHealth(): Promise<ComponentHealth> {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const metrics = {
        heap_used_mb: memUsage.heapUsed / (1024 * 1024),
        heap_total_mb: memUsage.heapTotal / (1024 * 1024),
        external_mb: memUsage.external / (1024 * 1024),
        cpu_user: cpuUsage.user,
        cpu_system: cpuUsage.system,
        uptime_seconds: process.uptime()
      };

      // 简单的健康状态判断
      let status: ComponentHealth['status'] = 'healthy';
      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (heapUsagePercent > 90) {
        status = 'critical';
      } else if (heapUsagePercent > 80) {
        status = 'warning';
      }

      return {
        status,
        response_time_ms: 0, // 应用程序内部检查，响应时间为0
        error_rate: 0, // 这里可以从实际的错误监控中获取
        metrics,
        last_check: new Date()
      };
    } catch (error) {
      logger.error('应用程序健康检查失败:', error);
      
      return {
        status: 'down',
        response_time_ms: 0,
        error_rate: 100,
        metrics: {},
        last_check: new Date(),
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private static async checkSystemHealth(): Promise<ComponentHealth> {
    try {
      const metrics = await this.getSystemMetrics();

      let status: ComponentHealth['status'] = 'healthy';
      
      // 根据系统指标判断健康状态
      if (metrics.cpu.usage_percent > 90 || metrics.memory.usage_percent > 95 || metrics.disk.usage_percent > 95) {
        status = 'critical';
      } else if (metrics.cpu.usage_percent > 80 || metrics.memory.usage_percent > 85 || metrics.disk.usage_percent > 90) {
        status = 'warning';
      }

      return {
        status,
        response_time_ms: 0,
        error_rate: 0,
        metrics,
        last_check: new Date()
      };
    } catch (error) {
      logger.error('系统健康检查失败:', error);
      
      return {
        status: 'down',
        response_time_ms: 0,
        error_rate: 100,
        metrics: {},
        last_check: new Date(),
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private static async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = Date.now();
        
        const totalTime = (endTime - startTime) * 1000; // 转换为微秒
        const cpuPercent = ((endUsage.user + endUsage.system) / totalTime) * 100;
        
        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  private static async getDiskUsage(): Promise<SystemMetrics['disk']> {
    try {
      const stats = fs.statSync(process.cwd());
      // 这是一个简化的实现，实际应该使用更准确的磁盘使用情况检查
      return {
        total_gb: 100, // 模拟值
        used_gb: 50,   // 模拟值
        free_gb: 50,   // 模拟值
        usage_percent: 50 // 模拟值
      };
    } catch (error) {
      return {
        total_gb: 0,
        used_gb: 0,
        free_gb: 0,
        usage_percent: 0
      };
    }
  }

  private static async getNetworkStats(): Promise<SystemMetrics['network']> {
    // 这是一个简化的实现，实际应该从系统获取网络统计
    return {
      bytes_sent: 0,
      bytes_received: 0,
      packets_sent: 0,
      packets_received: 0
    };
  }

  private static async checkAlertRules(health: SystemHealth): Promise<void> {
    const now = new Date();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      // 检查冷却时间
      if (rule.last_triggered) {
        const cooldownMs = rule.cooldown_minutes * 60 * 1000;
        if (now.getTime() - rule.last_triggered.getTime() < cooldownMs) {
          continue;
        }
      }

      // 获取指标值
      const metricValue = this.getMetricValue(health, rule.metric);
      if (metricValue === undefined) continue;

      // 检查阈值
      const triggered = this.evaluateCondition(metricValue, rule.operator, rule.threshold);
      
      if (triggered) {
        await this.triggerAlert(rule, metricValue);
      }
    }
  }

  private static getMetricValue(health: SystemHealth, metricPath: string): number | undefined {
    const parts = metricPath.split('.');
    let value: any = health.components;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return typeof value === 'number' ? value : undefined;
  }

  private static evaluateCondition(value: number, operator: AlertRule['operator'], threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  private static async triggerAlert(rule: AlertRule, metricValue: number): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rule_id: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: `${rule.description} - 当前值: ${metricValue}, 阈值: ${rule.threshold}`,
      metric_value: metricValue,
      threshold: rule.threshold,
      triggered_at: new Date(),
      status: 'active'
    };

    this.activeAlerts.push(alert);
    rule.last_triggered = new Date();

    // 发送通知
    await this.sendAlertNotifications(alert, rule.notification_channels);

    logger.warn('触发系统警报', {
      alertId: alert.id,
      ruleId: rule.id,
      severity: alert.severity,
      message: alert.message
    });
  }

  private static async sendAlertNotifications(alert: Alert, channels: string[]): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'log':
            logger.error('系统警报', alert);
            break;
          case 'email':
            // 这里可以集成邮件发送服务
            logger.info('发送邮件警报', { alertId: alert.id });
            break;
          case 'sms':
            // 这里可以集成短信发送服务
            logger.info('发送短信警报', { alertId: alert.id });
            break;
          default:
            logger.warn('未知的通知渠道', { channel });
        }
      } catch (error) {
        logger.error(`发送警报通知失败 (${channel}):`, error);
      }
    }
  }
}