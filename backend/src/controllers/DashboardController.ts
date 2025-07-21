import { Request, Response } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { 
  Cattle, 
  Base, 
  Barn, 
  HealthRecord, 
  FeedingRecord, 
  PurchaseOrder, 
  SalesOrder,
  Inventory,
  InventoryAlert,
  ProductionEquipment,
  ProductionMaterial,
  EquipmentFailure,
  VaccinationRecord
} from '@/models/index';
import { sequelize } from '@/config/database';
import { logger } from '@/utils/logger';

export class DashboardController {
  // Get key business indicators
  static async getKeyIndicators(req: Request, res: Response) {
    try {
      const { baseId, startDate, endDate } = req.query;
      const userBaseId = (req as any).user?.base_id;
      
      // Apply base filter based on user permissions
      const baseFilter = baseId ? { base_id: baseId } : 
                        userBaseId ? { base_id: userBaseId } : {};

      // Date range filter
      const dateFilter = startDate && endDate ? {
        created_at: {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        }
      } : {};

      // Get cattle statistics
      const cattleStats = await Cattle.findAll({
        attributes: [
          'health_status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { 
          ...baseFilter,
          status: 'active'
        },
        group: ['health_status'],
        raw: true
      });

      const totalCattle = await Cattle.count({
        where: { 
          ...baseFilter,
          status: 'active'
        }
      });

      // Get health rate
      const healthyCattle = (cattleStats as any[]).find((stat: any) => stat.health_status === 'healthy')?.count || 0;
      const healthRate = totalCattle > 0 ? (healthyCattle / totalCattle * 100).toFixed(1) : '0';

      // Get monthly revenue from sales
      const monthlyRevenue = await SalesOrder.sum('total_amount', {
        where: {
          ...baseFilter,
          ...dateFilter,
          status: 'completed'
        }
      }) || 0;

      // Get pending tasks count
      const pendingTasks = {
        healthAlerts: await HealthRecord.count({
          where: {
            ...baseFilter,
            status: 'ongoing'
          }
        }),
        inventoryAlerts: await InventoryAlert.count({
          where: {
            is_resolved: false,
            ...(userBaseId && { base_id: userBaseId })
          }
        }),
        equipmentFailures: await EquipmentFailure.count({
          where: {
            status: { [Op.in]: ['reported', 'in_repair'] },
            ...(userBaseId && { 
              '$ProductionEquipment.base_id$': userBaseId 
            })
          },
          include: [{
            model: ProductionEquipment,
            attributes: []
          }]
        }),
        overdueVaccinations: await VaccinationRecord.count({
          where: {
            next_due_date: {
              [Op.lt]: new Date()
            },
            ...(userBaseId && { 
              '$Cattle.base_id$': userBaseId 
            })
          },
          include: [{
            model: Cattle,
            attributes: [],
            where: { status: 'active' }
          }]
        })
      };

      // Get recent purchase orders
      const recentPurchases = await PurchaseOrder.sum('total_amount', {
        where: {
          ...baseFilter,
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }) || 0;

      res.json({
        success: true,
        data: {
          totalCattle,
          healthRate: parseFloat(healthRate),
          monthlyRevenue,
          recentPurchases,
          cattleByHealth: cattleStats,
          pendingTasks: {
            total: Object.values(pendingTasks).reduce((sum, count) => sum + count, 0),
            breakdown: pendingTasks
          }
        }
      });
    } catch (error) {
      logger.error('Error getting key indicators:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DASHBOARD_ERROR',
          message: '获取关键指标失败'
        }
      });
    }
  }

  // Get trend analysis data
  static async getTrendAnalysis(req: Request, res: Response) {
    try {
      const { 
        baseId, 
        period = '30d', // 7d, 30d, 90d, 1y
        metrics = 'cattle,health,feeding,sales' 
      } = req.query;
      
      const userBaseId = (req as any).user?.base_id;
      const baseFilter = baseId ? { base_id: baseId } : 
                        userBaseId ? { base_id: userBaseId } : {};

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      let groupBy: string;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          groupBy = 'DATE(created_at)';
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          groupBy = 'DATE_TRUNC(\'week\', created_at)';
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          groupBy = 'DATE_TRUNC(\'month\', created_at)';
          break;
        default: // 30d
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          groupBy = 'DATE(created_at)';
      }

      const dateFilter = {
        created_at: {
          [Op.gte]: startDate
        }
      };

      const requestedMetrics = (metrics as string).split(',');
      const trendData: any = {};

      // Cattle trend
      if (requestedMetrics.includes('cattle')) {
        const cattleTrend = await sequelize.query(`
          SELECT 
            ${groupBy} as date,
            COUNT(*) as total,
            COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy,
            COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick,
            COUNT(CASE WHEN health_status = 'treatment' THEN 1 END) as treatment
          FROM cattle 
          WHERE created_at >= :startDate 
            AND status = 'active'
            ${userBaseId ? 'AND base_id = :baseId' : ''}
          GROUP BY ${groupBy}
          ORDER BY date
        `, {
          replacements: { 
            startDate: startDate.toISOString(),
            ...(userBaseId && { baseId: userBaseId })
          },
          type: QueryTypes.SELECT
        });
        
        trendData.cattle = cattleTrend;
      }

      // Health trend
      if (requestedMetrics.includes('health')) {
        const healthTrend = await sequelize.query(`
          SELECT 
            ${groupBy} as date,
            COUNT(*) as total_records,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'ongoing' THEN 1 END) as ongoing
          FROM health_records hr
          JOIN cattle c ON hr.cattle_id = c.id
          WHERE hr.created_at >= :startDate
            ${userBaseId ? 'AND c.base_id = :baseId' : ''}
          GROUP BY ${groupBy}
          ORDER BY date
        `, {
          replacements: { 
            startDate: startDate.toISOString(),
            ...(userBaseId && { baseId: userBaseId })
          },
          type: QueryTypes.SELECT
        });
        
        trendData.health = healthTrend;
      }

      // Feeding trend
      if (requestedMetrics.includes('feeding')) {
        const feedingTrend = await sequelize.query(`
          SELECT 
            ${groupBy} as date,
            COUNT(*) as feeding_count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount
          FROM feeding_records
          WHERE created_at >= :startDate
            ${userBaseId ? 'AND base_id = :baseId' : ''}
          GROUP BY ${groupBy}
          ORDER BY date
        `, {
          replacements: { 
            startDate: startDate.toISOString(),
            ...(userBaseId && { baseId: userBaseId })
          },
          type: QueryTypes.SELECT
        });
        
        trendData.feeding = feedingTrend;
      }

      // Sales trend
      if (requestedMetrics.includes('sales')) {
        const salesTrend = await sequelize.query(`
          SELECT 
            ${groupBy} as date,
            COUNT(*) as order_count,
            SUM(total_amount) as total_revenue,
            AVG(total_amount) as avg_order_value
          FROM sales_orders
          WHERE created_at >= :startDate
            AND status = 'completed'
            ${userBaseId ? 'AND base_id = :baseId' : ''}
          GROUP BY ${groupBy}
          ORDER BY date
        `, {
          replacements: { 
            startDate: startDate.toISOString(),
            ...(userBaseId && { baseId: userBaseId })
          },
          type: QueryTypes.SELECT
        });
        
        trendData.sales = salesTrend;
      }

      res.json({
        success: true,
        data: {
          period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          trends: trendData
        }
      });
    } catch (error) {
      logger.error('Error getting trend analysis:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TREND_ANALYSIS_ERROR',
          message: '获取趋势分析失败'
        }
      });
    }
  }

  // Get real-time statistics
  static async getRealTimeStats(req: Request, res: Response) {
    try {
      const userBaseId = (req as any).user?.base_id;
      const baseFilter = userBaseId ? { base_id: userBaseId } : {};

      // Get current statistics
      const stats = await Promise.all([
        // Active cattle count
        Cattle.count({
          where: { 
            ...baseFilter,
            status: 'active'
          }
        }),
        
        // Today's feeding records
        FeedingRecord.count({
          where: {
            ...baseFilter,
            feeding_date: {
              [Op.gte]: new Date().toISOString().split('T')[0]
            }
          }
        }),
        
        // Today's health records
        HealthRecord.count({
          where: {
            diagnosis_date: {
              [Op.gte]: new Date().toISOString().split('T')[0]
            },
            ...(userBaseId && { 
              '$Cattle.base_id$': userBaseId 
            })
          },
          include: [{
            model: Cattle,
            attributes: []
          }]
        }),
        
        // Active alerts
        InventoryAlert.count({
          where: {
            is_resolved: false,
            ...(userBaseId && { base_id: userBaseId })
          }
        }),
        
        // Equipment failures
        EquipmentFailure.count({
          where: {
            status: { [Op.in]: ['reported', 'in_repair'] },
            ...(userBaseId && { 
              '$ProductionEquipment.base_id$': userBaseId 
            })
          },
          include: [{
            model: ProductionEquipment,
            attributes: []
          }]
        })
      ]);

      res.json({
        success: true,
        data: {
          activeCattle: stats[0],
          todayFeeding: stats[1],
          todayHealthRecords: stats[2],
          activeAlerts: stats[3],
          equipmentFailures: stats[4],
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error getting real-time stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REALTIME_STATS_ERROR',
          message: '获取实时统计失败'
        }
      });
    }
  }

  // Get pending tasks with priority
  static async getPendingTasks(req: Request, res: Response) {
    try {
      const { limit = 20 } = req.query;
      const userBaseId = (req as any).user?.base_id;

      const tasks: any[] = [];

      // High priority: Equipment failures
      const equipmentFailures = await EquipmentFailure.findAll({
        where: {
          status: { [Op.in]: ['reported', 'in_repair'] },
          ...(userBaseId && { 
            '$ProductionEquipment.base_id$': userBaseId 
          })
        },
        include: [{
          model: ProductionEquipment,
          attributes: ['name', 'code']
        }],
        order: [['failure_date', 'DESC']],
        limit: 5
      });

      equipmentFailures.forEach(failure => {
        tasks.push({
          id: `equipment_${failure.id}`,
          type: 'equipment_failure',
          priority: (failure as any).severity === 'critical' ? 'high' : 'medium',
          title: `设备故障: ${(failure as any).ProductionEquipment?.name}`,
          description: (failure as any).description,
          dueDate: null,
          createdAt: (failure as any).failure_date,
          url: `/equipment/failures/${failure.id}`
        });
      });

      // Medium priority: Health alerts
      const healthAlerts = await HealthRecord.findAll({
        where: {
          status: 'ongoing',
          ...(userBaseId && { 
            '$Cattle.base_id$': userBaseId 
          })
        },
        include: [{
          model: Cattle,
          attributes: ['ear_tag', 'breed']
        }],
        order: [['diagnosis_date', 'DESC']],
        limit: 5
      });

      healthAlerts.forEach(record => {
        tasks.push({
          id: `health_${record.id}`,
          type: 'health_alert',
          priority: 'medium',
          title: `健康治疗: ${(record as any).Cattle?.ear_tag}`,
          description: (record as any).diagnosis,
          dueDate: null,
          createdAt: (record as any).diagnosis_date,
          url: `/health/records/${record.id}`
        });
      });

      // Low priority: Overdue vaccinations
      const overdueVaccinations = await VaccinationRecord.findAll({
        where: {
          next_due_date: {
            [Op.lt]: new Date()
          },
          ...(userBaseId && { 
            '$Cattle.base_id$': userBaseId 
          })
        },
        include: [{
          model: Cattle,
          attributes: ['ear_tag', 'breed'],
          where: { status: 'active' }
        }],
        order: [['next_due_date', 'ASC']],
        limit: 5
      });

      overdueVaccinations.forEach(vaccination => {
        tasks.push({
          id: `vaccination_${vaccination.id}`,
          type: 'overdue_vaccination',
          priority: 'low',
          title: `疫苗过期: ${(vaccination as any).Cattle?.ear_tag}`,
          description: `${(vaccination as any).vaccine_name} 需要重新接种`,
          dueDate: (vaccination as any).next_due_date,
          createdAt: (vaccination as any).vaccination_date,
          url: `/health/vaccinations/${vaccination.id}`
        });
      });

      // Inventory alerts
      const inventoryAlerts = await InventoryAlert.findAll({
        where: {
          is_resolved: false,
          ...(userBaseId && { base_id: userBaseId })
        },
        include: [{
          model: ProductionMaterial,
          attributes: ['name', 'code']
        }],
        order: [['created_at', 'DESC']],
        limit: 5
      });

      inventoryAlerts.forEach(alert => {
        tasks.push({
          id: `inventory_${alert.id}`,
          type: 'inventory_alert',
          priority: (alert as any).alert_level === 'high' ? 'high' : 'medium',
          title: `库存预警: ${(alert as any).ProductionMaterial?.name}`,
          description: (alert as any).message,
          dueDate: null,
          createdAt: (alert as any).created_at,
          url: `/inventory/alerts/${alert.id}`
        });
      });

      // Sort by priority and creation date
      const priorityOrder: any = { high: 3, medium: 2, low: 1 };
      tasks.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json({
        success: true,
        data: {
          tasks: tasks.slice(0, Number(limit)),
          total: tasks.length,
          summary: {
            high: tasks.filter(t => t.priority === 'high').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            low: tasks.filter(t => t.priority === 'low').length
          }
        }
      });
    } catch (error) {
      logger.error('Error getting pending tasks:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PENDING_TASKS_ERROR',
          message: '获取待处理任务失败'
        }
      });
    }
  }

  // Get comparative analysis
  static async getComparativeAnalysis(req: Request, res: Response) {
    try {
      const { 
        compareType = 'period', // period, base
        currentPeriod = '30d',
        previousPeriod = '30d',
        baseIds 
      } = req.query;
      
      const userBaseId = (req as any).user?.base_id;

      if (compareType === 'period') {
        // Period comparison
        const now = new Date();
        const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const previousStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const previousEnd = currentStart;

        const baseFilter = userBaseId ? { base_id: userBaseId } : {};

        const [currentStats, previousStats] = await Promise.all([
          // Current period stats
          Promise.all([
            Cattle.count({
              where: { 
                ...baseFilter,
                status: 'active',
                created_at: { [Op.gte]: currentStart }
              }
            }),
            SalesOrder.sum('total_amount', {
              where: {
                ...baseFilter,
                status: 'completed',
                created_at: { [Op.gte]: currentStart }
              }
            }) || 0,
            FeedingRecord.sum('amount', {
              where: {
                ...baseFilter,
                created_at: { [Op.gte]: currentStart }
              }
            }) || 0
          ]),
          // Previous period stats
          Promise.all([
            Cattle.count({
              where: { 
                ...baseFilter,
                status: 'active',
                created_at: { 
                  [Op.between]: [previousStart, previousEnd]
                }
              }
            }),
            SalesOrder.sum('total_amount', {
              where: {
                ...baseFilter,
                status: 'completed',
                created_at: { 
                  [Op.between]: [previousStart, previousEnd]
                }
              }
            }) || 0,
            FeedingRecord.sum('amount', {
              where: {
                ...baseFilter,
                created_at: { 
                  [Op.between]: [previousStart, previousEnd]
                }
              }
            }) || 0
          ])
        ]);

        const comparison = {
          cattle: {
            current: currentStats[0],
            previous: previousStats[0],
            change: currentStats[0] - previousStats[0],
            changePercent: previousStats[0] > 0 ? 
              ((currentStats[0] - previousStats[0]) / previousStats[0] * 100).toFixed(1) : '0'
          },
          revenue: {
            current: currentStats[1],
            previous: previousStats[1],
            change: currentStats[1] - previousStats[1],
            changePercent: previousStats[1] > 0 ? 
              ((currentStats[1] - previousStats[1]) / previousStats[1] * 100).toFixed(1) : '0'
          },
          feeding: {
            current: currentStats[2],
            previous: previousStats[2],
            change: currentStats[2] - previousStats[2],
            changePercent: previousStats[2] > 0 ? 
              ((currentStats[2] - previousStats[2]) / previousStats[2] * 100).toFixed(1) : '0'
          }
        };

        res.json({
          success: true,
          data: {
            compareType: 'period',
            currentPeriod: {
              start: currentStart.toISOString(),
              end: now.toISOString()
            },
            previousPeriod: {
              start: previousStart.toISOString(),
              end: previousEnd.toISOString()
            },
            comparison
          }
        });
      } else {
        // Base comparison (if user has access to multiple bases)
        res.json({
          success: true,
          data: {
            compareType: 'base',
            message: '基地对比功能需要管理员权限'
          }
        });
      }
    } catch (error) {
      logger.error('Error getting comparative analysis:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'COMPARATIVE_ANALYSIS_ERROR',
          message: '获取对比分析失败'
        }
      });
    }
  }
}