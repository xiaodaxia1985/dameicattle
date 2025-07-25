#!/usr/bin/env ts-node

/**
 * Monitoring System Demo Script
 * 
 * This script demonstrates the comprehensive logging and monitoring system
 * by simulating various scenarios and showing the monitoring capabilities.
 */

import { SystemMonitoringService } from '@/services/SystemMonitoringService';
import { LogAnalysisService } from '@/services/LogAnalysisService';
import { MonitoringDashboardService } from '@/services/MonitoringDashboardService';
import { logger, createContextLogger, logPerformance, logSecurityEvent, logApiRequest } from '@/utils/logger';

async function runMonitoringDemo() {
  console.log('🚀 Starting Monitoring System Demo...\n');

  try {
    // 1. Initialize monitoring services
    console.log('1. Initializing monitoring services...');
    SystemMonitoringService.initializeDefaultRules();
    LogAnalysisService.initialize();
    console.log('✅ Monitoring services initialized\n');

    // 2. Demonstrate enhanced logging
    console.log('2. Demonstrating enhanced logging...');
    
    const contextLogger = createContextLogger({
      module: 'MonitoringDemo',
      requestId: 'demo-request-123',
      userId: '1',
      action: 'demonstration'
    });

    contextLogger.info('Demo started', { timestamp: new Date() });
    contextLogger.warn('This is a warning message', { level: 'demo' });
    contextLogger.error('This is an error message for testing', { errorCode: 'DEMO_ERROR' });

    // Log performance metrics
    logPerformance('demo_operation', 250, { 
      operation_type: 'demonstration',
      success: true 
    });

    // Log security events
    logSecurityEvent('demo_security_event', 'low', {
      ip: '127.0.0.1',
      userAgent: 'MonitoringDemo/1.0'
    });

    // Log API requests
    logApiRequest('GET', '/api/v1/demo', 200, 150, {
      requestId: 'demo-request-123',
      userId: '1'
    });

    console.log('✅ Enhanced logging demonstrated\n');

    // 3. System health check
    console.log('3. Performing system health check...');
    const health = await SystemMonitoringService.performHealthCheck();
    console.log(`   Status: ${health.status}`);
    console.log(`   Overall Score: ${health.overall_score}/100`);
    console.log(`   Database: ${health.components.database.status} (${health.components.database.response_time_ms}ms)`);
    console.log(`   Redis: ${health.components.redis.status} (${health.components.redis.response_time_ms}ms)`);
    console.log(`   Application: ${health.components.application.status}`);
    console.log(`   System: ${health.components.system.status}`);
    console.log('✅ System health check completed\n');

    // 4. System metrics
    console.log('4. Getting system metrics...');
    const metrics = await SystemMonitoringService.getSystemMetrics();
    console.log(`   CPU Usage: ${metrics.cpu.usage_percent}%`);
    console.log(`   Memory Usage: ${metrics.memory.usage_percent}% (${metrics.memory.used_mb}MB/${metrics.memory.total_mb}MB)`);
    console.log(`   Disk Usage: ${metrics.disk.usage_percent}% (${metrics.disk.used_gb}GB/${metrics.disk.total_gb}GB)`);
    console.log(`   Uptime: ${Math.round(metrics.uptime_seconds / 3600)}h ${Math.round((metrics.uptime_seconds % 3600) / 60)}m`);
    console.log('✅ System metrics retrieved\n');

    // 5. Alert rules management
    console.log('5. Demonstrating alert rules management...');
    const alertRule = SystemMonitoringService.addAlertRule({
      name: 'Demo High CPU Alert',
      description: 'Demo alert for high CPU usage',
      metric: 'cpu.usage_percent',
      operator: '>',
      threshold: 90,
      severity: 'high',
      enabled: true,
      cooldown_minutes: 5,
      notification_channels: ['log', 'email']
    });
    console.log(`   Created alert rule: ${alertRule.name} (ID: ${alertRule.id})`);

    const rules = SystemMonitoringService.getAlertRules();
    console.log(`   Total alert rules: ${rules.length}`);

    // Update the rule
    SystemMonitoringService.updateAlertRule(alertRule.id, { threshold: 95 });
    console.log(`   Updated alert rule threshold to 95%`);

    // Clean up
    SystemMonitoringService.deleteAlertRule(alertRule.id);
    console.log(`   Deleted demo alert rule`);
    console.log('✅ Alert rules management demonstrated\n');

    // 6. Log analysis
    console.log('6. Demonstrating log analysis...');
    
    // Search logs
    const logSearchResult = await LogAnalysisService.searchLogs({
      limit: 5,
      level: 'info'
    });
    console.log(`   Found ${logSearchResult.total} log entries (showing ${logSearchResult.entries.length})`);

    // Get log statistics
    const logStats = await LogAnalysisService.getLogStatistics(1);
    console.log(`   Total entries (24h): ${logStats.total_entries}`);
    console.log(`   Error rate: ${logStats.error_rate.toFixed(2)}%`);
    console.log(`   Level distribution:`, Object.entries(logStats.level_distribution)
      .map(([level, count]) => `${level}: ${count}`)
      .join(', '));

    // Analyze errors
    const errorAnalysis = await LogAnalysisService.analyzeLogData('errors');
    console.log(`   Error analysis: ${errorAnalysis.total_errors} errors found`);

    // Analyze performance
    const performanceAnalysis = await LogAnalysisService.analyzeLogData('performance');
    console.log(`   Performance analysis: ${performanceAnalysis.total_performance_entries} performance entries`);

    console.log('✅ Log analysis demonstrated\n');

    // 7. Dashboard metrics
    console.log('7. Getting dashboard metrics...');
    const dashboardMetrics = await MonitoringDashboardService.getDashboardMetrics();
    console.log(`   System Health: ${dashboardMetrics.system_health.status} (${dashboardMetrics.system_health.score}/100)`);
    console.log(`   Active Alerts: ${dashboardMetrics.alerts.active_count}`);
    console.log(`   Log Entries (24h): ${dashboardMetrics.logs.total_entries_24h}`);
    console.log(`   Error Rate (24h): ${dashboardMetrics.logs.error_rate_24h.toFixed(2)}%`);
    console.log(`   Avg Response Time: ${dashboardMetrics.performance.avg_response_time}ms`);
    console.log('✅ Dashboard metrics retrieved\n');

    // 8. Health trend
    console.log('8. Getting health trend...');
    const healthTrend = await MonitoringDashboardService.getHealthTrend(6); // Last 6 hours
    console.log(`   Health trend data points: ${healthTrend.length}`);
    if (healthTrend.length > 0) {
      const latest = healthTrend[healthTrend.length - 1];
      console.log(`   Latest: ${latest.status} (${latest.score}/100) at ${latest.timestamp.toISOString()}`);
    }
    console.log('✅ Health trend retrieved\n');

    // 9. Performance summary
    console.log('9. Getting performance summary...');
    const perfSummary = await MonitoringDashboardService.getPerformanceSummary();
    console.log(`   Average Response Time: ${perfSummary.avg_response_time}ms`);
    console.log(`   P95 Response Time: ${perfSummary.p95_response_time}ms`);
    console.log(`   P99 Response Time: ${perfSummary.p99_response_time}ms`);
    console.log(`   Slow Queries: ${perfSummary.slow_queries_count}`);
    console.log(`   Database Avg Response: ${perfSummary.database_avg_response}ms`);
    console.log(`   Redis Avg Response: ${perfSummary.redis_avg_response}ms`);
    console.log('✅ Performance summary retrieved\n');

    // 10. Generate monitoring report
    console.log('10. Generating monitoring report...');
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 6 * 60 * 60 * 1000); // Last 6 hours
    
    const report = await MonitoringDashboardService.generateMonitoringReport(startDate, endDate);
    console.log(`   Report ID: ${report.id}`);
    console.log(`   Period: ${report.period.duration_hours} hours`);
    console.log(`   Overall Health Score: ${report.summary.overall_health_score}/100`);
    console.log(`   Total Requests: ${report.summary.total_requests}`);
    console.log(`   Error Rate: ${report.summary.error_rate.toFixed(2)}%`);
    console.log(`   Uptime: ${report.summary.uptime_percentage.toFixed(2)}%`);
    console.log(`   Incidents: ${report.incidents.length}`);
    console.log(`   Recommendations: ${report.recommendations.length}`);
    
    if (report.recommendations.length > 0) {
      console.log('   Top Recommendations:');
      report.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`     ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
      });
    }
    console.log('✅ Monitoring report generated\n');

    // 11. Simulate some alerts
    console.log('11. Simulating alert scenarios...');
    
    // Create a test alert rule with low threshold to trigger it
    const testAlertRule = SystemMonitoringService.addAlertRule({
      name: 'Demo Test Alert',
      description: 'Test alert that should trigger',
      metric: 'system.uptime_seconds',
      operator: '>',
      threshold: 0, // This should always trigger
      severity: 'low',
      enabled: true,
      cooldown_minutes: 1,
      notification_channels: ['log']
    });

    // Perform health check to potentially trigger alerts
    await SystemMonitoringService.performHealthCheck();
    
    // Check for active alerts
    const activeAlerts = SystemMonitoringService.getActiveAlerts();
    console.log(`   Active alerts: ${activeAlerts.length}`);
    
    if (activeAlerts.length > 0) {
      const alert = activeAlerts[0];
      console.log(`   Sample alert: ${alert.title} (${alert.severity})`);
      
      // Acknowledge the alert
      SystemMonitoringService.acknowledgeAlert(alert.id, 'MonitoringDemo');
      console.log(`   Alert acknowledged`);
      
      // Resolve the alert
      SystemMonitoringService.resolveAlert(alert.id);
      console.log(`   Alert resolved`);
    }

    // Clean up test rule
    SystemMonitoringService.deleteAlertRule(testAlertRule.id);
    console.log('✅ Alert scenarios demonstrated\n');

    // 12. Log alert demonstration
    console.log('12. Demonstrating log alerts...');
    
    const logAlert = LogAnalysisService.addLogAlert({
      name: 'Demo Log Alert',
      description: 'Demo log alert for testing',
      pattern: 'demo',
      threshold: 1,
      time_window_minutes: 5,
      enabled: true,
      notification_channels: ['log']
    });
    console.log(`   Created log alert: ${logAlert.name} (ID: ${logAlert.id})`);

    const logAlerts = LogAnalysisService.getLogAlerts();
    console.log(`   Total log alerts: ${logAlerts.length}`);

    // Clean up
    LogAnalysisService.deleteLogAlert(logAlert.id);
    console.log(`   Deleted demo log alert`);
    console.log('✅ Log alerts demonstrated\n');

    console.log('🎉 Monitoring System Demo completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Enhanced logging with context and structured data');
    console.log('   - Real-time system health monitoring');
    console.log('   - Comprehensive system metrics collection');
    console.log('   - Flexible alert rules management');
    console.log('   - Advanced log analysis and search');
    console.log('   - Performance monitoring and trending');
    console.log('   - Security event logging and detection');
    console.log('   - Automated monitoring reports');
    console.log('   - Dashboard metrics aggregation');
    console.log('   - Request/response logging middleware');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    logger.error('Monitoring demo failed', { error: error instanceof Error ? error.message : error });
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  runMonitoringDemo().catch(error => {
    console.error('Failed to run monitoring demo:', error);
    process.exit(1);
  });
}

export { runMonitoringDemo };