import { Request, Response } from 'express';
import { SystemMonitoringService } from '@/services/SystemMonitoringService';
import { AppError } from '@/utils/errors';
import { logger, createContextLogger } from '@/utils/logger';

export class MonitoringController {
  // 获取系统健康状态
  static async getSystemHealth(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'getSystemHealth',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      contextLogger.info('获取系统健康状态');
      
      const health = await SystemMonitoringService.performHealthCheck();
      
      contextLogger.info('系统健康状态获取成功', { 
        status: health.status, 
        score: health.overall_score 
      });

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      contextLogger.error('获取系统健康状态失败', { error: error instanceof Error ? error.message : error });
      throw new AppError('获取系统健康状态失败', 500);
    }
  }

  // 获取系统指标
  static async getSystemMetrics(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'getSystemMetrics',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      contextLogger.info('获取系统指标');
      
      const metrics = await SystemMonitoringService.getSystemMetrics();
      
      contextLogger.info('系统指标获取成功', { 
        cpu_usage: metrics.cpu.usage_percent,
        memory_usage: metrics.memory.usage_percent,
        disk_usage: metrics.disk.usage_percent
      });

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      contextLogger.error('获取系统指标失败', { error: error instanceof Error ? error.message : error });
      throw new AppError('获取系统指标失败', 500);
    }
  }

  // 获取监控仪表盘数据
  static async getDashboardData(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'getDashboardData',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      contextLogger.info('获取监控仪表盘数据');
      
      const dashboardData = await SystemMonitoringService.getDashboardData();
      
      contextLogger.info('监控仪表盘数据获取成功', { 
        health_status: dashboardData.current_health.status,
        active_alerts: dashboardData.active_alerts_count
      });

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      contextLogger.error('获取监控仪表盘数据失败', { error: error instanceof Error ? error.message : error });
      throw new AppError('获取监控仪表盘数据失败', 500);
    }
  }

  // 获取健康历史
  static async getHealthHistory(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'getHealthHistory',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      const { limit = 100 } = req.query;
      
      contextLogger.info('获取健康历史', { limit });
      
      const history = SystemMonitoringService.getHealthHistory(Number(limit));
      
      contextLogger.info('健康历史获取成功', { count: history.length });

      res.json({
        success: true,
        data: {
          history,
          total: history.length
        }
      });
    } catch (error) {
      contextLogger.error('获取健康历史失败', { error: error instanceof Error ? error.message : error });
      throw new AppError('获取健康历史失败', 500);
    }
  }

  // 获取警报规则列表
  static async getAlertRules(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'getAlertRules',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      contextLogger.info('获取警报规则列表');
      
      const rules = SystemMonitoringService.getAlertRules();
      
      contextLogger.info('警报规则列表获取成功', { count: rules.length });

      res.json({
        success: true,
        data: {
          rules,
          total: rules.length,
          enabled_count: rules.filter(r => r.enabled).length
        }
      });
    } catch (error) {
      contextLogger.error('获取警报规则列表失败', { error: error instanceof Error ? error.message : error });
      throw new AppError('获取警报规则列表失败', 500);
    }
  }

  // 创建警报规则
  static async createAlertRule(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'createAlertRule',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      const ruleData = req.body;
      
      contextLogger.info('创建警报规则', { name: ruleData.name, metric: ruleData.metric });
      
      const rule = SystemMonitoringService.addAlertRule(ruleData);
      
      contextLogger.info('警报规则创建成功', { ruleId: rule.id, name: rule.name });

      res.status(201).json({
        success: true,
        data: rule,
        message: '警报规则创建成功'
      });
    } catch (error) {
      contextLogger.error('创建警报规则失败', { error: error instanceof Error ? error.message : error });
      throw new AppError('创建警报规则失败', 500);
    }
  }

  // 更新警报规则
  static async updateAlertRule(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'updateAlertRule',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      const { id } = req.params;
      const updateData = req.body;
      
      contextLogger.info('更新警报规则', { ruleId: id });
      
      const success = SystemMonitoringService.updateAlertRule(id, updateData);
      
      if (!success) {
        throw new AppError('警报规则不存在', 404);
      }
      
      contextLogger.info('警报规则更新成功', { ruleId: id });

      res.json({
        success: true,
        message: '警报规则更新成功'
      });
    } catch (error) {
      contextLogger.error('更新警报规则失败', { error: error instanceof Error ? error.message : error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新警报规则失败', 500);
    }
  }

  // 删除警报规则
  static async deleteAlertRule(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'deleteAlertRule',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      const { id } = req.params;
      
      contextLogger.info('删除警报规则', { ruleId: id });
      
      const success = SystemMonitoringService.deleteAlertRule(id);
      
      if (!success) {
        throw new AppError('警报规则不存在', 404);
      }
      
      contextLogger.info('警报规则删除成功', { ruleId: id });

      res.json({
        success: true,
        message: '警报规则删除成功'
      });
    } catch (error) {
      contextLogger.error('删除警报规则失败', { error: error instanceof Error ? error.message : error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('删除警报规则失败', 500);
    }
  }

  // 获取活跃警报
  static async getActiveAlerts(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'getActiveAlerts',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      contextLogger.info('获取活跃警报');
      
      const alerts = SystemMonitoringService.getActiveAlerts();
      
      contextLogger.info('活跃警报获取成功', { count: alerts.length });

      res.json({
        success: true,
        data: {
          alerts,
          total: alerts.length,
          critical_count: alerts.filter(a => a.severity === 'critical').length,
          high_count: alerts.filter(a => a.severity === 'high').length,
          medium_count: alerts.filter(a => a.severity === 'medium').length,
          low_count: alerts.filter(a => a.severity === 'low').length
        }
      });
    } catch (error) {
      contextLogger.error('获取活跃警报失败', { error: error instanceof Error ? error.message : error });
      throw new AppError('获取活跃警报失败', 500);
    }
  }

  // 获取所有警报
  static async getAllAlerts(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'getAllAlerts',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      const { limit = 100 } = req.query;
      
      contextLogger.info('获取所有警报', { limit });
      
      const alerts = SystemMonitoringService.getAllAlerts(Number(limit));
      
      contextLogger.info('所有警报获取成功', { count: alerts.length });

      res.json({
        success: true,
        data: {
          alerts,
          total: alerts.length
        }
      });
    } catch (error) {
      contextLogger.error('获取所有警报失败', { error: error instanceof Error ? error.message : error });
      throw new AppError('获取所有警报失败', 500);
    }
  }

  // 确认警报
  static async acknowledgeAlert(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'acknowledgeAlert',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      const { id } = req.params;
      const acknowledgedBy = req.user?.real_name || req.user?.username || 'Unknown';
      
      contextLogger.info('确认警报', { alertId: id, acknowledgedBy });
      
      const success = SystemMonitoringService.acknowledgeAlert(id, acknowledgedBy);
      
      if (!success) {
        throw new AppError('警报不存在或已被处理', 404);
      }
      
      contextLogger.info('警报确认成功', { alertId: id, acknowledgedBy });

      res.json({
        success: true,
        message: '警报确认成功'
      });
    } catch (error) {
      contextLogger.error('确认警报失败', { error: error instanceof Error ? error.message : error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('确认警报失败', 500);
    }
  }

  // 解决警报
  static async resolveAlert(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'resolveAlert',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      const { id } = req.params;
      
      contextLogger.info('解决警报', { alertId: id });
      
      const success = SystemMonitoringService.resolveAlert(id);
      
      if (!success) {
        throw new AppError('警报不存在', 404);
      }
      
      contextLogger.info('警报解决成功', { alertId: id });

      res.json({
        success: true,
        message: '警报解决成功'
      });
    } catch (error) {
      contextLogger.error('解决警报失败', { error: error instanceof Error ? error.message : error });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('解决警报失败', 500);
    }
  }

  // 初始化默认监控规则
  static async initializeDefaultRules(req: Request, res: Response) {
    const contextLogger = createContextLogger({
      module: 'MonitoringController',
      action: 'initializeDefaultRules',
      requestId: req.headers['x-request-id'] as string,
      userId: req.user?.id?.toString()
    });

    try {
      contextLogger.info('初始化默认监控规则');
      
      SystemMonitoringService.initializeDefaultRules();
      
      contextLogger.info('默认监控规则初始化成功');

      res.json({
        success: true,
        message: '默认监控规则初始化成功'
      });
    } catch (error) {
      contextLogger.error('初始化默认监控规则失败', { error: error instanceof Error ? error.message : error });
      throw new AppError('初始化默认监控规则失败', 500);
    }
  }
}