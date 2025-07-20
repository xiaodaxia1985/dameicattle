import { Request, Response } from 'express';
import { SystemMonitoringService } from '@/services/SystemMonitoringService';
import { LogAnalysisService } from '@/services/LogAnalysisService';
import { logger } from '@/utils/logger';

export class MonitoringController {
  /**
   * 获取系统健康状态
   */
  static async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await SystemMonitoringService.performHealthCheck();

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('获取系统健康状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取系统健康状态失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取系统指标
   */
  static async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await SystemMonitoringService.getSystemMetrics();

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('获取系统指标失败:', error);
      res.status(500).json({
        success: false,
        message: '获取系统指标失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取健康历史
   */
  static async getHealthHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = SystemMonitoringService.getHealthHistory(limit);

      res.json({
        success: true,
        data: history,
        total: history.length
      });
    } catch (error) {
      logger.error('获取健康历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取健康历史失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取监控仪表盘数据
   */
  static async getDashboardData(req: Request, res: Response): Promise<void> {
    try {
      const dashboardData = await SystemMonitoringService.getDashboardData();

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('获取监控仪表盘数据失败:', error);
      res.status(500).json({
        success: false,
        message: '获取监控仪表盘数据失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取警报规则列表
   */
  static async getAlertRules(req: Request, res: Response): Promise<void> {
    try {
      const rules = SystemMonitoringService.getAlertRules();

      res.json({
        success: true,
        data: rules,
        total: rules.length
      });
    } catch (error) {
      logger.error('获取警报规则失败:', error);
      res.status(500).json({
        success: false,
        message: '获取警报规则失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 添加警报规则
   */
  static async addAlertRule(req: Request, res: Response): Promise<void> {
    try {
      const rule = SystemMonitoringService.addAlertRule(req.body);

      res.status(201).json({
        success: true,
        data: rule,
        message: '警报规则添加成功'
      });
    } catch (error) {
      logger.error('添加警报规则失败:', error);
      res.status(500).json({
        success: false,
        message: '添加警报规则失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 更新警报规则
   */
  static async updateAlertRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const updated = SystemMonitoringService.updateAlertRule(ruleId, req.body);

      if (updated) {
        res.json({
          success: true,
          message: '警报规则更新成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '警报规则不存在'
        });
      }
    } catch (error) {
      logger.error('更新警报规则失败:', error);
      res.status(500).json({
        success: false,
        message: '更新警报规则失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 删除警报规则
   */
  static async deleteAlertRule(req: Request, res: Response): Promise<void> {
    try {
      const { ruleId } = req.params;
      const deleted = SystemMonitoringService.deleteAlertRule(ruleId);

      if (deleted) {
        res.json({
          success: true,
          message: '警报规则删除成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '警报规则不存在'
        });
      }
    } catch (error) {
      logger.error('删除警报规则失败:', error);
      res.status(500).json({
        success: false,
        message: '删除警报规则失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取活跃警报
   */
  static async getActiveAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = SystemMonitoringService.getActiveAlerts();

      res.json({
        success: true,
        data: alerts,
        total: alerts.length
      });
    } catch (error) {
      logger.error('获取活跃警报失败:', error);
      res.status(500).json({
        success: false,
        message: '获取活跃警报失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取所有警报
   */
  static async getAllAlerts(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const alerts = SystemMonitoringService.getAllAlerts(limit);

      res.json({
        success: true,
        data: alerts,
        total: alerts.length
      });
    } catch (error) {
      logger.error('获取所有警报失败:', error);
      res.status(500).json({
        success: false,
        message: '获取所有警报失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 确认警报
   */
  static async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy } = req.body;

      if (!acknowledgedBy) {
        res.status(400).json({
          success: false,
          message: '请提供确认人信息'
        });
        return;
      }

      const acknowledged = SystemMonitoringService.acknowledgeAlert(alertId, acknowledgedBy);

      if (acknowledged) {
        res.json({
          success: true,
          message: '警报确认成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '警报不存在或状态不正确'
        });
      }
    } catch (error) {
      logger.error('确认警报失败:', error);
      res.status(500).json({
        success: false,
        message: '确认警报失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 解决警报
   */
  static async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const resolved = SystemMonitoringService.resolveAlert(alertId);

      if (resolved) {
        res.json({
          success: true,
          message: '警报解决成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '警报不存在'
        });
      }
    } catch (error) {
      logger.error('解决警报失败:', error);
      res.status(500).json({
        success: false,
        message: '解决警报失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 分析日志数据
   */
  static async analyzeLogData(req: Request, res: Response): Promise<void> {
    try {
      const { startTime, endTime } = req.query;
      
      const start = startTime ? new Date(startTime as string) : undefined;
      const end = endTime ? new Date(endTime as string) : undefined;

      const analysis = await LogAnalysisService.analyzeLogData(start, end);

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      logger.error('分析日志数据失败:', error);
      res.status(500).json({
        success: false,
        message: '分析日志数据失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 搜索日志
   */
  static async searchLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        level,
        startTime,
        endTime,
        messagePattern,
        userId,
        ipAddress,
        source,
        limit,
        offset
      } = req.query;

      const options = {
        level: level as any,
        start_time: startTime ? new Date(startTime as string) : undefined,
        end_time: endTime ? new Date(endTime as string) : undefined,
        message_pattern: messagePattern as string,
        user_id: userId ? parseInt(userId as string) : undefined,
        ip_address: ipAddress as string,
        source: source as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const result = await LogAnalysisService.searchLogs(options);

      res.json({
        success: true,
        data: result.logs,
        total: result.total,
        has_more: result.has_more
      });
    } catch (error) {
      logger.error('搜索日志失败:', error);
      res.status(500).json({
        success: false,
        message: '搜索日志失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取实时日志
   */
  static async getRealtimeLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = LogAnalysisService.getRealtimeLogs(limit);

      res.json({
        success: true,
        data: logs,
        total: logs.length
      });
    } catch (error) {
      logger.error('获取实时日志失败:', error);
      res.status(500).json({
        success: false,
        message: '获取实时日志失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 导出日志
   */
  static async exportLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        level,
        startTime,
        endTime,
        messagePattern,
        userId,
        ipAddress,
        source,
        format
      } = req.query;

      const options = {
        level: level as any,
        start_time: startTime ? new Date(startTime as string) : undefined,
        end_time: endTime ? new Date(endTime as string) : undefined,
        message_pattern: messagePattern as string,
        user_id: userId ? parseInt(userId as string) : undefined,
        ip_address: ipAddress as string,
        source: source as string,
        format: (format as 'json' | 'csv') || 'json'
      };

      const data = await LogAnalysisService.exportLogs(options);

      const filename = `logs_${Date.now()}.${options.format}`;
      const contentType = options.format === 'csv' ? 'text/csv' : 'application/json';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(data);
    } catch (error) {
      logger.error('导出日志失败:', error);
      res.status(500).json({
        success: false,
        message: '导出日志失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取日志统计
   */
  static async getLogStatistics(req: Request, res: Response): Promise<void> {
    try {
      const timeWindow = parseInt(req.query.timeWindow as string) || 24 * 60 * 60 * 1000;
      const statistics = await LogAnalysisService.getLogStatistics(timeWindow);

      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('获取日志统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取日志统计失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取日志警报规则
   */
  static async getLogAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = LogAnalysisService.getLogAlerts();

      res.json({
        success: true,
        data: alerts,
        total: alerts.length
      });
    } catch (error) {
      logger.error('获取日志警报规则失败:', error);
      res.status(500).json({
        success: false,
        message: '获取日志警报规则失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 添加日志警报规则
   */
  static async addLogAlert(req: Request, res: Response): Promise<void> {
    try {
      const alert = LogAnalysisService.addLogAlert(req.body);

      res.status(201).json({
        success: true,
        data: alert,
        message: '日志警报规则添加成功'
      });
    } catch (error) {
      logger.error('添加日志警报规则失败:', error);
      res.status(500).json({
        success: false,
        message: '添加日志警报规则失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 更新日志警报规则
   */
  static async updateLogAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const updated = LogAnalysisService.updateLogAlert(alertId, req.body);

      if (updated) {
        res.json({
          success: true,
          message: '日志警报规则更新成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '日志警报规则不存在'
        });
      }
    } catch (error) {
      logger.error('更新日志警报规则失败:', error);
      res.status(500).json({
        success: false,
        message: '更新日志警报规则失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 删除日志警报规则
   */
  static async deleteLogAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const deleted = LogAnalysisService.deleteLogAlert(alertId);

      if (deleted) {
        res.json({
          success: true,
          message: '日志警报规则删除成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '日志警报规则不存在'
        });
      }
    } catch (error) {
      logger.error('删除日志警报规则失败:', error);
      res.status(500).json({
        success: false,
        message: '删除日志警报规则失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 清理过期日志
   */
  static async cleanupOldLogs(req: Request, res: Response): Promise<void> {
    try {
      const deletedCount = await LogAnalysisService.cleanupOldLogs();

      res.json({
        success: true,
        data: { deleted_count: deletedCount },
        message: `清理完成，删除了 ${deletedCount} 条过期日志`
      });
    } catch (error) {
      logger.error('清理过期日志失败:', error);
      res.status(500).json({
        success: false,
        message: '清理过期日志失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}