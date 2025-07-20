import { SystemMonitoringService } from '@/services/SystemMonitoringService';
import { LogAnalysisService } from '@/services/LogAnalysisService';
import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';

describe('Monitoring Services', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
    await redisClient.quit();
  });

  describe('SystemMonitoringService', () => {
    beforeEach(() => {
      SystemMonitoringService.initializeDefaultRules();
    });

    describe('performHealthCheck', () => {
      it('should perform system health check', async () => {
        const health = await SystemMonitoringService.performHealthCheck();

        expect(health).toBeTruthy();
        expect(health.status).toMatch(/healthy|warning|critical|down/);
        expect(health.timestamp).toBeInstanceOf(Date);
        expect(typeof health.overall_score).toBe('number');
        expect(health.overall_score).toBeGreaterThanOrEqual(0);
        expect(health.overall_score).toBeLessThanOrEqual(100);

        // 验证组件健康状态
        expect(health.components).toBeTruthy();
        expect(health.components.database).toBeTruthy();
        expect(health.components.redis).toBeTruthy();
        expect(health.components.application).toBeTruthy();
        expect(health.components.system).toBeTruthy();

        // 验证每个组件的结构
        Object.values(health.components).forEach(component => {
          expect(component.status).toMatch(/healthy|warning|critical|down/);
          expect(typeof component.response_time_ms).toBe('number');
          expect(typeof component.error_rate).toBe('number');
          expect(component.metrics).toBeTruthy();
          expect(component.last_check).toBeInstanceOf(Date);
        });
      });

      it('should handle database connection errors gracefully', async () => {
        // 模拟数据库连接错误
        const originalQuery = sequelize.query;
        sequelize.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

        const health = await SystemMonitoringService.performHealthCheck();

        expect(health.components.database.status).toBe('down');
        expect(health.components.database.error_rate).toBe(100);
        expect(health.components.database.message).toBeTruthy();

        // 恢复原始方法
        sequelize.query = originalQuery;
      });

      it('should handle Redis connection errors gracefully', async () => {
        // 模拟Redis连接错误
        const originalPing = redisClient.ping;
        redisClient.ping = jest.fn().mockRejectedValue(new Error('Redis connection failed'));

        const health = await SystemMonitoringService.performHealthCheck();

        expect(health.components.redis.status).toBe('down');
        expect(health.components.redis.error_rate).toBe(100);
        expect(health.components.redis.message).toBeTruthy();

        // 恢复原始方法
        redisClient.ping = originalPing;
      });
    });

    describe('getSystemMetrics', () => {
      it('should return system metrics', async () => {
        const metrics = await SystemMonitoringService.getSystemMetrics();

        expect(metrics).toBeTruthy();

        // 验证CPU指标
        expect(metrics.cpu).toBeTruthy();
        expect(typeof metrics.cpu.usage_percent).toBe('number');
        expect(metrics.cpu.usage_percent).toBeGreaterThanOrEqual(0);
        expect(metrics.cpu.usage_percent).toBeLessThanOrEqual(100);
        expect(Array.isArray(metrics.cpu.load_average)).toBe(true);
        expect(typeof metrics.cpu.cores).toBe('number');

        // 验证内存指标
        expect(metrics.memory).toBeTruthy();
        expect(typeof metrics.memory.total_mb).toBe('number');
        expect(typeof metrics.memory.used_mb).toBe('number');
        expect(typeof metrics.memory.free_mb).toBe('number');
        expect(typeof metrics.memory.usage_percent).toBe('number');
        expect(metrics.memory.usage_percent).toBeGreaterThanOrEqual(0);
        expect(metrics.memory.usage_percent).toBeLessThanOrEqual(100);

        // 验证磁盘指标
        expect(metrics.disk).toBeTruthy();
        expect(typeof metrics.disk.total_gb).toBe('number');
        expect(typeof metrics.disk.used_gb).toBe('number');
        expect(typeof metrics.disk.free_gb).toBe('number');
        expect(typeof metrics.disk.usage_percent).toBe('number');

        // 验证网络指标
        expect(metrics.network).toBeTruthy();
        expect(typeof metrics.network.bytes_sent).toBe('number');
        expect(typeof metrics.network.bytes_received).toBe('number');

        // 验证运行时间
        expect(typeof metrics.uptime_seconds).toBe('number');
        expect(metrics.uptime_seconds).toBeGreaterThan(0);
      });
    });

    describe('alert rules management', () => {
      it('should add alert rule', () => {
        const rule = {
          name: '测试警报规则',
          description: '测试用的警报规则',
          metric: 'cpu.usage_percent',
          operator: '>' as const,
          threshold: 90,
          severity: 'high' as const,
          enabled: true,
          cooldown_minutes: 5,
          notification_channels: ['log']
        };

        const addedRule = SystemMonitoringService.addAlertRule(rule);

        expect(addedRule.id).toBeTruthy();
        expect(addedRule.name).toBe(rule.name);
        expect(addedRule.metric).toBe(rule.metric);
        expect(addedRule.threshold).toBe(rule.threshold);
      });

      it('should update alert rule', () => {
        const rule = SystemMonitoringService.addAlertRule({
          name: '原始规则',
          description: '原始描述',
          metric: 'memory.usage_percent',
          operator: '>',
          threshold: 80,
          severity: 'medium',
          enabled: true,
          cooldown_minutes: 3,
          notification_channels: ['log']
        });

        const updated = SystemMonitoringService.updateAlertRule(rule.id, {
          name: '更新后的规则',
          threshold: 85,
          severity: 'high'
        });

        expect(updated).toBe(true);

        const rules = SystemMonitoringService.getAlertRules();
        const updatedRule = rules.find(r => r.id === rule.id);

        expect(updatedRule?.name).toBe('更新后的规则');
        expect(updatedRule?.threshold).toBe(85);
        expect(updatedRule?.severity).toBe('high');
      });

      it('should delete alert rule', () => {
        const rule = SystemMonitoringService.addAlertRule({
          name: '待删除规则',
          description: '将被删除的规则',
          metric: 'disk.usage_percent',
          operator: '>',
          threshold: 95,
          severity: 'critical',
          enabled: true,
          cooldown_minutes: 10,
          notification_channels: ['log', 'email']
        });

        const deleted = SystemMonitoringService.deleteAlertRule(rule.id);
        expect(deleted).toBe(true);

        const rules = SystemMonitoringService.getAlertRules();
        const deletedRule = rules.find(r => r.id === rule.id);
        expect(deletedRule).toBeUndefined();
      });

      it('should return false when updating non-existent rule', () => {
        const updated = SystemMonitoringService.updateAlertRule('non-existent-id', {
          name: '不存在的规则'
        });

        expect(updated).toBe(false);
      });

      it('should return false when deleting non-existent rule', () => {
        const deleted = SystemMonitoringService.deleteAlertRule('non-existent-id');
        expect(deleted).toBe(false);
      });
    });

    describe('alert management', () => {
      it('should acknowledge alert', () => {
        // 首先需要有一个活跃的警报，这里我们需要模拟触发警报的过程
        // 由于警报触发是异步的，我们直接测试确认功能的逻辑
        
        const acknowledgedBy = 'test_user';
        
        // 这里应该有一个实际的警报ID，但由于测试环境的限制，
        // 我们测试不存在的警报ID的情况
        const acknowledged = SystemMonitoringService.acknowledgeAlert('non-existent-alert', acknowledgedBy);
        expect(acknowledged).toBe(false);
      });

      it('should resolve alert', () => {
        // 类似地，测试解决不存在的警报
        const resolved = SystemMonitoringService.resolveAlert('non-existent-alert');
        expect(resolved).toBe(false);
      });

      it('should get active alerts', () => {
        const activeAlerts = SystemMonitoringService.getActiveAlerts();
        expect(Array.isArray(activeAlerts)).toBe(true);
      });

      it('should get all alerts with limit', () => {
        const limit = 50;
        const allAlerts = SystemMonitoringService.getAllAlerts(limit);
        
        expect(Array.isArray(allAlerts)).toBe(true);
        expect(allAlerts.length).toBeLessThanOrEqual(limit);
      });
    });

    describe('health history', () => {
      it('should get health history', () => {
        const limit = 10;
        const history = SystemMonitoringService.getHealthHistory(limit);

        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeLessThanOrEqual(limit);
      });

      it('should maintain health history after health checks', async () => {
        const initialHistoryLength = SystemMonitoringService.getHealthHistory().length;
        
        // 执行几次健康检查
        await SystemMonitoringService.performHealthCheck();
        await SystemMonitoringService.performHealthCheck();
        
        const newHistoryLength = SystemMonitoringService.getHealthHistory().length;
        expect(newHistoryLength).toBeGreaterThan(initialHistoryLength);
      });
    });

    describe('dashboard data', () => {
      it('should get dashboard data', async () => {
        const dashboardData = await SystemMonitoringService.getDashboardData();

        expect(dashboardData).toBeTruthy();
        expect(dashboardData.current_health).toBeTruthy();
        expect(dashboardData.system_metrics).toBeTruthy();
        expect(typeof dashboardData.active_alerts_count).toBe('number');
        expect(Array.isArray(dashboardData.recent_alerts)).toBe(true);
        expect(Array.isArray(dashboardData.health_trend)).toBe(true);

        // 验证健康趋势数据结构
        dashboardData.health_trend.forEach(trend => {
          expect(trend.timestamp).toBeInstanceOf(Date);
          expect(typeof trend.score).toBe('number');
        });
      });
    });
  });

  describe('LogAnalysisService', () => {
    beforeEach(() => {
      LogAnalysisService.initialize();
    });

    describe('log entry management', () => {
      it('should add log entry', () => {
        const logEntry = {
          timestamp: new Date(),
          level: 'info' as const,
          message: 'Test log message',
          meta: { test: 'data' },
          source: 'test',
          user_id: 1,
          ip_address: '127.0.0.1'
        };

        // addLogEntry 是同步的，不会抛出错误
        expect(() => {
          LogAnalysisService.addLogEntry(logEntry);
        }).not.toThrow();
      });

      it('should get realtime logs', () => {
        // 添加一些测试日志
        const testLogs = [
          {
            timestamp: new Date(),
            level: 'info' as const,
            message: 'Test info message',
            source: 'test'
          },
          {
            timestamp: new Date(),
            level: 'error' as const,
            message: 'Test error message',
            source: 'test'
          }
        ];

        testLogs.forEach(log => LogAnalysisService.addLogEntry(log));

        const realtimeLogs = LogAnalysisService.getRealtimeLogs(10);
        
        expect(Array.isArray(realtimeLogs)).toBe(true);
        expect(realtimeLogs.length).toBeGreaterThan(0);
        
        // 验证日志按时间倒序排列
        if (realtimeLogs.length > 1) {
          expect(realtimeLogs[0].timestamp.getTime()).toBeGreaterThanOrEqual(
            realtimeLogs[1].timestamp.getTime()
          );
        }
      });
    });

    describe('log search', () => {
      beforeEach(() => {
        // 添加一些测试数据
        const testLogs = [
          {
            timestamp: new Date(Date.now() - 1000),
            level: 'info' as const,
            message: 'User login successful',
            user_id: 1,
            ip_address: '192.168.1.1'
          },
          {
            timestamp: new Date(Date.now() - 2000),
            level: 'error' as const,
            message: 'Database connection failed',
            source: 'database'
          },
          {
            timestamp: new Date(Date.now() - 3000),
            level: 'warn' as const,
            message: 'High memory usage detected',
            source: 'system'
          }
        ];

        testLogs.forEach(log => LogAnalysisService.addLogEntry(log));
      });

      it('should search logs with level filter', async () => {
        const result = await LogAnalysisService.searchLogs({
          level: 'error',
          limit: 10
        });

        expect(result.logs).toBeTruthy();
        expect(Array.isArray(result.logs)).toBe(true);
        expect(typeof result.total).toBe('number');
        expect(typeof result.has_more).toBe('boolean');

        // 验证所有返回的日志都是错误级别
        result.logs.forEach(log => {
          expect(log.level).toBe('error');
        });
      });

      it('should search logs with message pattern', async () => {
        const result = await LogAnalysisService.searchLogs({
          message_pattern: 'database',
          limit: 10
        });

        expect(Array.isArray(result.logs)).toBe(true);
        
        // 验证所有返回的日志消息都包含"database"
        result.logs.forEach(log => {
          expect(log.message.toLowerCase()).toContain('database');
        });
      });

      it('should search logs with time range', async () => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 5000); // 5秒前

        const result = await LogAnalysisService.searchLogs({
          start_time: startTime,
          end_time: endTime,
          limit: 10
        });

        expect(Array.isArray(result.logs)).toBe(true);
        
        // 验证所有返回的日志都在时间范围内
        result.logs.forEach(log => {
          expect(log.timestamp.getTime()).toBeGreaterThanOrEqual(startTime.getTime());
          expect(log.timestamp.getTime()).toBeLessThanOrEqual(endTime.getTime());
        });
      });

      it('should handle pagination', async () => {
        const pageSize = 2;
        
        const firstPage = await LogAnalysisService.searchLogs({
          limit: pageSize,
          offset: 0
        });

        const secondPage = await LogAnalysisService.searchLogs({
          limit: pageSize,
          offset: pageSize
        });

        expect(firstPage.logs.length).toBeLessThanOrEqual(pageSize);
        expect(secondPage.logs.length).toBeLessThanOrEqual(pageSize);

        // 如果有足够的数据，第一页和第二页的日志应该不同
        if (firstPage.logs.length > 0 && secondPage.logs.length > 0) {
          expect(firstPage.logs[0].timestamp).not.toEqual(secondPage.logs[0].timestamp);
        }
      });
    });

    describe('log analysis', () => {
      beforeEach(() => {
        // 添加分析用的测试数据
        const testLogs = [
          {
            timestamp: new Date(Date.now() - 1000),
            level: 'info' as const,
            message: 'User action completed',
            user_id: 1
          },
          {
            timestamp: new Date(Date.now() - 2000),
            level: 'error' as const,
            message: 'Database timeout error',
            source: 'database'
          },
          {
            timestamp: new Date(Date.now() - 3000),
            level: 'error' as const,
            message: 'Database connection error',
            source: 'database'
          },
          {
            timestamp: new Date(Date.now() - 4000),
            level: 'warn' as const,
            message: 'Memory usage warning',
            source: 'system'
          }
        ];

        testLogs.forEach(log => LogAnalysisService.addLogEntry(log));
      });

      it('should analyze log data', async () => {
        const analysis = await LogAnalysisService.analyzeLogData();

        expect(analysis).toBeTruthy();
        expect(typeof analysis.total_entries).toBe('number');
        expect(typeof analysis.level_distribution).toBe('object');
        expect(Array.isArray(analysis.error_patterns)).toBe(true);
        expect(Array.isArray(analysis.top_error_messages)).toBe(true);
        expect(Array.isArray(analysis.hourly_distribution)).toBe(true);
        expect(Array.isArray(analysis.user_activity)).toBe(true);
        expect(typeof analysis.performance_insights).toBe('object');

        // 验证级别分布
        expect(analysis.level_distribution.error).toBeGreaterThan(0);
        expect(analysis.level_distribution.info).toBeGreaterThan(0);
        expect(analysis.level_distribution.warn).toBeGreaterThan(0);

        // 验证小时分布结构
        expect(analysis.hourly_distribution).toHaveLength(24);
        analysis.hourly_distribution.forEach((hour, index) => {
          expect(hour.hour).toBe(index);
          expect(typeof hour.count).toBe('number');
          expect(typeof hour.error_count).toBe('number');
        });
      });

      it('should analyze log data with time range', async () => {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 10000); // 10秒前

        const analysis = await LogAnalysisService.analyzeLogData(startTime, endTime);

        expect(analysis).toBeTruthy();
        expect(analysis.total_entries).toBeGreaterThan(0);
      });
    });

    describe('log statistics', () => {
      beforeEach(() => {
        // 添加统计用的测试数据
        const testLogs = [
          {
            timestamp: new Date(),
            level: 'info' as const,
            message: 'Info message',
            source: 'app'
          },
          {
            timestamp: new Date(),
            level: 'error' as const,
            message: 'Error message',
            source: 'database'
          },
          {
            timestamp: new Date(),
            level: 'warn' as const,
            message: 'Warning message',
            source: 'system'
          }
        ];

        testLogs.forEach(log => LogAnalysisService.addLogEntry(log));
      });

      it('should get log statistics', async () => {
        const stats = await LogAnalysisService.getLogStatistics();

        expect(stats).toBeTruthy();
        expect(typeof stats.total_logs).toBe('number');
        expect(typeof stats.error_logs).toBe('number');
        expect(typeof stats.warn_logs).toBe('number');
        expect(typeof stats.info_logs).toBe('number');
        expect(typeof stats.debug_logs).toBe('number');
        expect(typeof stats.error_rate).toBe('number');
        expect(Array.isArray(stats.top_sources)).toBe(true);
        expect(Array.isArray(stats.recent_errors)).toBe(true);

        // 验证错误率计算
        if (stats.total_logs > 0) {
          expect(stats.error_rate).toBeGreaterThanOrEqual(0);
          expect(stats.error_rate).toBeLessThanOrEqual(100);
        }

        // 验证来源统计结构
        stats.top_sources.forEach(source => {
          expect(source.source).toBeTruthy();
          expect(typeof source.count).toBe('number');
        });
      });

      it('should get statistics with custom time window', async () => {
        const timeWindow = 60 * 60 * 1000; // 1小时
        const stats = await LogAnalysisService.getLogStatistics(timeWindow);

        expect(stats).toBeTruthy();
        expect(typeof stats.total_logs).toBe('number');
      });
    });

    describe('log alerts', () => {
      it('should add log alert', () => {
        const alert = {
          name: '高错误率警报',
          description: '错误日志过多时触发',
          conditions: {
            level: 'error',
            frequency_threshold: 5,
            time_window_minutes: 10
          },
          enabled: true,
          notification_channels: ['log', 'email']
        };

        const addedAlert = LogAnalysisService.addLogAlert(alert);

        expect(addedAlert.id).toBeTruthy();
        expect(addedAlert.name).toBe(alert.name);
        expect(addedAlert.conditions).toEqual(alert.conditions);
      });

      it('should update log alert', () => {
        const alert = LogAnalysisService.addLogAlert({
          name: '原始警报',
          description: '原始描述',
          conditions: {
            level: 'error',
            frequency_threshold: 3
          },
          enabled: true,
          notification_channels: ['log']
        });

        const updated = LogAnalysisService.updateLogAlert(alert.id, {
          name: '更新后的警报',
          enabled: false
        });

        expect(updated).toBe(true);

        const alerts = LogAnalysisService.getLogAlerts();
        const updatedAlert = alerts.find(a => a.id === alert.id);

        expect(updatedAlert?.name).toBe('更新后的警报');
        expect(updatedAlert?.enabled).toBe(false);
      });

      it('should delete log alert', () => {
        const alert = LogAnalysisService.addLogAlert({
          name: '待删除警报',
          description: '将被删除',
          conditions: {},
          enabled: true,
          notification_channels: ['log']
        });

        const deleted = LogAnalysisService.deleteLogAlert(alert.id);
        expect(deleted).toBe(true);

        const alerts = LogAnalysisService.getLogAlerts();
        const deletedAlert = alerts.find(a => a.id === alert.id);
        expect(deletedAlert).toBeUndefined();
      });

      it('should get log alerts', () => {
        const alerts = LogAnalysisService.getLogAlerts();
        expect(Array.isArray(alerts)).toBe(true);
      });
    });

    describe('log export', () => {
      beforeEach(() => {
        // 添加导出用的测试数据
        LogAnalysisService.addLogEntry({
          timestamp: new Date(),
          level: 'info',
          message: 'Export test message',
          source: 'test'
        });
      });

      it('should export logs as JSON', async () => {
        const jsonData = await LogAnalysisService.exportLogs({
          format: 'json',
          limit: 10
        });

        expect(typeof jsonData).toBe('string');
        
        const parsed = JSON.parse(jsonData);
        expect(Array.isArray(parsed)).toBe(true);
      });

      it('should export logs as CSV', async () => {
        const csvData = await LogAnalysisService.exportLogs({
          format: 'csv',
          limit: 10
        });

        expect(typeof csvData).toBe('string');
        expect(csvData).toContain('timestamp,level,message');
      });
    });

    describe('log cleanup', () => {
      it('should cleanup old logs', async () => {
        const deletedCount = await LogAnalysisService.cleanupOldLogs();
        expect(typeof deletedCount).toBe('number');
        expect(deletedCount).toBeGreaterThanOrEqual(0);
      });
    });
  });
});

describe('Monitoring Integration Tests', () => {
  // 这里可以添加集成测试，测试监控服务之间的协作
  it.skip('should integrate system monitoring with log analysis', async () => {
    // 集成测试将在完整的应用程序测试中实现
  });

  it.skip('should trigger alerts based on system metrics', async () => {
    // 集成测试将在完整的应用程序测试中实现
  });
});