import request from 'supertest';
import app from '@/app';
import { SystemMonitoringService } from '@/services/SystemMonitoringService';
import { LogAnalysisService } from '@/services/LogAnalysisService';
import { MonitoringDashboardService } from '@/services/MonitoringDashboardService';
import { logger } from '@/utils/logger';
import { sequelize } from '@/config/database';
import { User } from '@/models';

describe('Monitoring System', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // 创建测试用户
    testUser = await User.create({
      username: 'monitoring_test_user',
      email: 'monitoring@test.com',
      password: 'password123',
      real_name: 'Monitoring Test User',
      role_id: 1,
      status: 'active'
    });

    // 获取认证令牌
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'monitoring_test_user',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;

    // 初始化监控服务
    SystemMonitoringService.initializeDefaultRules();
    LogAnalysisService.initialize();
  });

  afterAll(async () => {
    // 清理测试数据
    if (testUser) {
      await testUser.destroy();
    }
    await sequelize.close();
  });

  describe('Logger Enhancement', () => {
    it('should create context logger with proper metadata', () => {
      const { createContextLogger } = require('@/utils/logger');
      
      const contextLogger = createContextLogger({
        module: 'TestModule',
        requestId: 'test-request-123',
        userId: '1',
        action: 'testAction'
      });

      expect(contextLogger).toHaveProperty('error');
      expect(contextLogger).toHaveProperty('warn');
      expect(contextLogger).toHaveProperty('info');
      expect(contextLogger).toHaveProperty('debug');
      expect(contextLogger).toHaveProperty('http');
    });

    it('should log performance metrics', () => {
      const { logPerformance } = require('@/utils/logger');
      
      expect(() => {
        logPerformance('test_operation', 150, { 
          requestId: 'test-123',
          statusCode: 200 
        });
      }).not.toThrow();
    });

    it('should log security events', () => {
      const { logSecurityEvent } = require('@/utils/logger');
      
      expect(() => {
        logSecurityEvent('suspicious_login_attempt', 'medium', {
          ip: '192.168.1.100',
          userAgent: 'test-agent'
        });
      }).not.toThrow();
    });

    it('should log API requests', () => {
      const { logApiRequest } = require('@/utils/logger');
      
      expect(() => {
        logApiRequest('GET', '/api/v1/test', 200, 250, {
          requestId: 'test-123',
          userId: '1'
        });
      }).not.toThrow();
    });
  });

  describe('System Monitoring Service', () => {
    it('should perform health check', async () => {
      const health = await SystemMonitoringService.performHealthCheck();
      
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('components');
      expect(health).toHaveProperty('overall_score');
      
      expect(health.components).toHaveProperty('database');
      expect(health.components).toHaveProperty('redis');
      expect(health.components).toHaveProperty('application');
      expect(health.components).toHaveProperty('system');
      
      expect(typeof health.overall_score).toBe('number');
      expect(health.overall_score).toBeGreaterThanOrEqual(0);
      expect(health.overall_score).toBeLessThanOrEqual(100);
    });

    it('should get system metrics', async () => {
      const metrics = await SystemMonitoringService.getSystemMetrics();
      
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('disk');
      expect(metrics).toHaveProperty('network');
      expect(metrics).toHaveProperty('uptime_seconds');
      
      expect(metrics.cpu).toHaveProperty('usage_percent');
      expect(metrics.cpu).toHaveProperty('cores');
      expect(metrics.memory).toHaveProperty('usage_percent');
      expect(metrics.disk).toHaveProperty('usage_percent');
    });

    it('should manage alert rules', () => {
      const rule = SystemMonitoringService.addAlertRule({
        name: 'Test Alert Rule',
        description: 'Test description',
        metric: 'cpu.usage_percent',
        operator: '>',
        threshold: 90,
        severity: 'high',
        enabled: true,
        cooldown_minutes: 5,
        notification_channels: ['log']
      });

      expect(rule).toHaveProperty('id');
      expect(rule.name).toBe('Test Alert Rule');

      const rules = SystemMonitoringService.getAlertRules();
      expect(rules.length).toBeGreaterThan(0);

      const updated = SystemMonitoringService.updateAlertRule(rule.id, {
        threshold: 95
      });
      expect(updated).toBe(true);

      const deleted = SystemMonitoringService.deleteAlertRule(rule.id);
      expect(deleted).toBe(true);
    });

    it('should get dashboard data', async () => {
      const dashboardData = await SystemMonitoringService.getDashboardData();
      
      expect(dashboardData).toHaveProperty('current_health');
      expect(dashboardData).toHaveProperty('system_metrics');
      expect(dashboardData).toHaveProperty('active_alerts_count');
      expect(dashboardData).toHaveProperty('recent_alerts');
      expect(dashboardData).toHaveProperty('health_trend');
    });
  });

  describe('Log Analysis Service', () => {
    it('should search logs', async () => {
      const result = await LogAnalysisService.searchLogs({
        limit: 10,
        offset: 0
      });

      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
      expect(Array.isArray(result.entries)).toBe(true);
    });

    it('should get log statistics', async () => {
      const stats = await LogAnalysisService.getLogStatistics(1);

      expect(stats).toHaveProperty('total_entries');
      expect(stats).toHaveProperty('level_distribution');
      expect(stats).toHaveProperty('module_distribution');
      expect(stats).toHaveProperty('error_rate');
      expect(stats).toHaveProperty('top_errors');
      expect(stats).toHaveProperty('hourly_distribution');
      expect(stats).toHaveProperty('recent_trends');
    });

    it('should analyze log data', async () => {
      const errorAnalysis = await LogAnalysisService.analyzeLogData('errors');
      expect(errorAnalysis).toHaveProperty('total_errors');
      expect(errorAnalysis).toHaveProperty('error_patterns');

      const performanceAnalysis = await LogAnalysisService.analyzeLogData('performance');
      expect(performanceAnalysis).toHaveProperty('total_performance_entries');
      expect(performanceAnalysis).toHaveProperty('operation_stats');

      const securityAnalysis = await LogAnalysisService.analyzeLogData('security');
      expect(securityAnalysis).toHaveProperty('total_security_events');

      const trendsAnalysis = await LogAnalysisService.analyzeLogData('trends');
      expect(trendsAnalysis).toHaveProperty('daily_trends');
    });

    it('should manage log alerts', () => {
      const alert = LogAnalysisService.addLogAlert({
        name: 'Test Log Alert',
        description: 'Test log alert description',
        pattern: 'test_pattern',
        threshold: 5,
        time_window_minutes: 10,
        enabled: true,
        notification_channels: ['log']
      });

      expect(alert).toHaveProperty('id');
      expect(alert.name).toBe('Test Log Alert');

      const alerts = LogAnalysisService.getLogAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      const updated = LogAnalysisService.updateLogAlert(alert.id, {
        threshold: 10
      });
      expect(updated).toBe(true);

      const deleted = LogAnalysisService.deleteLogAlert(alert.id);
      expect(deleted).toBe(true);
    });

    it('should export logs', async () => {
      const jsonExport = await LogAnalysisService.exportLogs({
        limit: 5
      }, 'json');
      expect(typeof jsonExport).toBe('string');
      expect(() => JSON.parse(jsonExport)).not.toThrow();

      const csvExport = await LogAnalysisService.exportLogs({
        limit: 5
      }, 'csv');
      expect(typeof csvExport).toBe('string');
      expect(csvExport).toContain('timestamp,level,message');
    });
  });

  describe('Monitoring Dashboard Service', () => {
    it('should get dashboard metrics', async () => {
      const metrics = await MonitoringDashboardService.getDashboardMetrics();

      expect(metrics).toHaveProperty('system_health');
      expect(metrics).toHaveProperty('system_metrics');
      expect(metrics).toHaveProperty('alerts');
      expect(metrics).toHaveProperty('logs');
      expect(metrics).toHaveProperty('performance');
      expect(metrics).toHaveProperty('trends');

      expect(metrics.system_health).toHaveProperty('status');
      expect(metrics.system_health).toHaveProperty('score');
      expect(metrics.alerts).toHaveProperty('active_count');
      expect(metrics.logs).toHaveProperty('total_entries_24h');
      expect(metrics.performance).toHaveProperty('avg_response_time');
    });

    it('should generate monitoring report', async () => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const report = await MonitoringDashboardService.generateMonitoringReport(
        startDate,
        endDate
      );

      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('generated_at');
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('incidents');
      expect(report).toHaveProperty('recommendations');

      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.summary).toHaveProperty('overall_health_score');
      expect(report.summary).toHaveProperty('uptime_percentage');
    });

    it('should get health trend', async () => {
      const trend = await MonitoringDashboardService.getHealthTrend(24);

      expect(Array.isArray(trend)).toBe(true);
      trend.forEach(point => {
        expect(point).toHaveProperty('timestamp');
        expect(point).toHaveProperty('score');
        expect(point).toHaveProperty('status');
      });
    });

    it('should get performance summary', async () => {
      const summary = await MonitoringDashboardService.getPerformanceSummary();

      expect(summary).toHaveProperty('avg_response_time');
      expect(summary).toHaveProperty('p95_response_time');
      expect(summary).toHaveProperty('p99_response_time');
      expect(summary).toHaveProperty('slow_queries_count');
      expect(summary).toHaveProperty('database_avg_response');
      expect(summary).toHaveProperty('redis_avg_response');
    });

    it('should clear cache', () => {
      expect(() => {
        MonitoringDashboardService.clearCache();
      }).not.toThrow();
    });
  });

  describe('Monitoring API Endpoints', () => {
    it('should get system health', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('components');
    });

    it('should get system metrics', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cpu');
      expect(response.body.data).toHaveProperty('memory');
    });

    it('should get dashboard data', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('current_health');
      expect(response.body.data).toHaveProperty('system_metrics');
    });

    it('should get alert rules', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/alert-rules')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('rules');
      expect(Array.isArray(response.body.data.rules)).toBe(true);
    });

    it('should create alert rule', async () => {
      const ruleData = {
        name: 'API Test Alert Rule',
        description: 'Test alert rule created via API',
        metric: 'cpu.usage_percent',
        operator: '>',
        threshold: 85,
        severity: 'medium',
        enabled: true,
        cooldown_minutes: 5,
        notification_channels: ['log']
      };

      const response = await request(app)
        .post('/api/v1/monitoring/alert-rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ruleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(ruleData.name);

      // Clean up
      await request(app)
        .delete(`/api/v1/monitoring/alert-rules/${response.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should get active alerts', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should get health history', async () => {
      const response = await request(app)
        .get('/api/v1/monitoring/history?limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('history');
      expect(Array.isArray(response.body.data.history)).toBe(true);
    });

    it('should initialize default rules', async () => {
      const response = await request(app)
        .post('/api/v1/monitoring/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('初始化成功');
    });

    it('should handle validation errors', async () => {
      const invalidRuleData = {
        name: '', // Invalid: empty name
        metric: 'invalid_metric',
        operator: 'invalid_operator',
        threshold: 'not_a_number',
        severity: 'invalid_severity'
      };

      const response = await request(app)
        .post('/api/v1/monitoring/alert-rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRuleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/monitoring/health')
        .expect(401);

      await request(app)
        .post('/api/v1/monitoring/alert-rules')
        .send({})
        .expect(401);
    });
  });

  describe('Request Logging Middleware', () => {
    it('should add request ID to responses', async () => {
      const response = await request(app)
        .get('/api/v1/public/health')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
    });

    it('should log slow requests', async () => {
      // This test would require a slow endpoint or mocking
      // For now, we'll just verify the middleware doesn't break normal requests
      const response = await request(app)
        .get('/api/v1/public/health')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should detect security patterns', async () => {
      // Test with suspicious query parameters
      const response = await request(app)
        .get('/api/v1/public/health?test=<script>alert("xss")</script>')
        .expect(200);

      // The request should still work, but security logging should occur
      expect(response.body).toBeDefined();
    });
  });

  describe('Error Handling and Logging', () => {
    it('should log errors properly', async () => {
      // Test with an endpoint that doesn't exist
      const response = await request(app)
        .get('/api/v1/nonexistent-endpoint')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({}) // Missing required fields
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track response times', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/v1/public/health')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Response should be reasonably fast
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/v1/public/health')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body).toBeDefined();
        expect(response.headers['x-request-id']).toBeDefined();
      });
    });
  });
});