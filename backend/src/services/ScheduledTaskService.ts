import cron from 'node-cron';
import { HealthAlertService } from './HealthAlertService';
import { logger } from '@/utils/logger';
import { Base } from '@/models';

export class ScheduledTaskService {
  private static tasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * 启动所有定时任务
   */
  static async startAllTasks(): Promise<void> {
    try {
      // 每天早上8点检查健康预警
      this.scheduleHealthAlertCheck();
      
      // 每小时检查疫苗到期提醒
      this.scheduleVaccineReminderCheck();
      
      // 每周一早上生成健康趋势报告
      this.scheduleWeeklyHealthReport();

      logger.info('所有定时任务已启动');
    } catch (error) {
      logger.error('启动定时任务失败:', error);
    }
  }

  /**
   * 停止所有定时任务
   */
  static stopAllTasks(): void {
    this.tasks.forEach((task, name) => {
      task.stop();
      logger.info(`定时任务 ${name} 已停止`);
    });
    this.tasks.clear();
  }

  /**
   * 每天检查健康预警
   */
  private static scheduleHealthAlertCheck(): void {
    const task = cron.schedule('0 8 * * *', async () => {
      try {
        logger.info('开始执行每日健康预警检查');
        
        // 获取所有基地
        const bases = await Base.findAll({
          attributes: ['id', 'name']
        });

        for (const base of bases) {
          const alerts = await HealthAlertService.getAllHealthAlerts(base.id);
          
          if (alerts.length > 0) {
            // 发送预警通知
            await HealthAlertService.sendAlertNotifications(alerts, base.id);
            
            logger.info(`基地 ${base.name} 生成 ${alerts.length} 条健康预警`, {
              baseId: base.id,
              alertCount: alerts.length,
              criticalCount: alerts.filter(a => a.severity === 'critical').length,
              highCount: alerts.filter(a => a.severity === 'high').length
            });
          }
        }

        logger.info('每日健康预警检查完成');
      } catch (error) {
        logger.error('每日健康预警检查失败:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    task.start();
    this.tasks.set('daily-health-alert-check', task);
    logger.info('每日健康预警检查任务已启动 (每天8:00)');
  }

  /**
   * 每小时检查疫苗到期提醒
   */
  private static scheduleVaccineReminderCheck(): void {
    const task = cron.schedule('0 * * * *', async () => {
      try {
        logger.info('开始执行疫苗到期提醒检查');
        
        // 获取所有基地
        const bases = await Base.findAll({
          attributes: ['id', 'name']
        });

        for (const base of bases) {
          const vaccineAlerts = await HealthAlertService.detectVaccineDueAlerts(base.id);
          
          // 只发送即将到期（7天内）和已过期的疫苗提醒
          const urgentAlerts = vaccineAlerts.filter(alert => 
            alert.severity === 'high' || alert.severity === 'critical'
          );

          if (urgentAlerts.length > 0) {
            await HealthAlertService.sendAlertNotifications(urgentAlerts, base.id);
            
            logger.info(`基地 ${base.name} 生成 ${urgentAlerts.length} 条紧急疫苗提醒`, {
              baseId: base.id,
              urgentCount: urgentAlerts.length
            });
          }
        }

        logger.info('疫苗到期提醒检查完成');
      } catch (error) {
        logger.error('疫苗到期提醒检查失败:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    task.start();
    this.tasks.set('hourly-vaccine-reminder-check', task);
    logger.info('疫苗到期提醒检查任务已启动 (每小时)');
  }

  /**
   * 每周生成健康趋势报告
   */
  private static scheduleWeeklyHealthReport(): void {
    const task = cron.schedule('0 9 * * 1', async () => {
      try {
        logger.info('开始生成每周健康趋势报告');
        
        // 获取所有基地
        const bases = await Base.findAll({
          attributes: ['id', 'name']
        });

        for (const base of bases) {
          const trendAlerts = await HealthAlertService.generateHealthTrendAlerts(base.id);
          const trends = await HealthAlertService.analyzeHealthTrend(base.id, 21);

          if (trendAlerts.length > 0) {
            await HealthAlertService.sendAlertNotifications(trendAlerts, base.id);
          }

          logger.info(`基地 ${base.name} 健康趋势报告`, {
            baseId: base.id,
            trendAlerts: trendAlerts.length,
            trendsAnalyzed: trends.length,
            latestTrend: trends[0]?.trend_direction
          });
        }

        logger.info('每周健康趋势报告生成完成');
      } catch (error) {
        logger.error('每周健康趋势报告生成失败:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Shanghai'
    });

    task.start();
    this.tasks.set('weekly-health-report', task);
    logger.info('每周健康趋势报告任务已启动 (每周一9:00)');
  }

  /**
   * 手动触发健康预警检查
   */
  static async triggerHealthAlertCheck(baseId?: number): Promise<void> {
    try {
      logger.info('手动触发健康预警检查', { baseId });
      
      if (baseId) {
        const alerts = await HealthAlertService.getAllHealthAlerts(baseId);
        if (alerts.length > 0) {
          await HealthAlertService.sendAlertNotifications(alerts, baseId);
        }
        logger.info(`基地 ${baseId} 健康预警检查完成，生成 ${alerts.length} 条预警`);
      } else {
        const bases = await Base.findAll({ attributes: ['id', 'name'] });
        let totalAlerts = 0;
        
        for (const base of bases) {
          const alerts = await HealthAlertService.getAllHealthAlerts(base.id);
          if (alerts.length > 0) {
            await HealthAlertService.sendAlertNotifications(alerts, base.id);
            totalAlerts += alerts.length;
          }
        }
        
        logger.info(`全部基地健康预警检查完成，共生成 ${totalAlerts} 条预警`);
      }
    } catch (error) {
      logger.error('手动触发健康预警检查失败:', error);
      throw error;
    }
  }

  /**
   * 获取任务状态
   */
  static getTaskStatus(): Array<{ name: string; running: boolean; nextRun?: string }> {
    const status: Array<{ name: string; running: boolean; nextRun?: string }> = [];
    
    this.tasks.forEach((task, name) => {
      status.push({
        name,
        running: task.running || false,
        nextRun: task.nextDate()?.toISOString()
      });
    });

    return status;
  }
}