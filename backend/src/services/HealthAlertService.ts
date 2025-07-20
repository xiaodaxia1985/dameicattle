import { Op } from 'sequelize';
import { HealthRecord, VaccinationRecord, Cattle, User, Base } from '@/models';
import { logger } from '@/utils/logger';

export interface HealthAlert {
  id: string;
  type: 'health_anomaly' | 'vaccine_due' | 'health_trend' | 'critical_health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  cattle_id?: number;
  base_id?: number;
  data?: any;
  created_at: Date;
}

export interface HealthTrendData {
  period: string;
  healthy_count: number;
  sick_count: number;
  treatment_count: number;
  trend_direction: 'improving' | 'stable' | 'declining';
  change_percentage: number;
}

export class HealthAlertService {
  /**
   * 检测健康异常并生成预警
   */
  static async detectHealthAnomalies(baseId?: number): Promise<HealthAlert[]> {
    try {
      const alerts: HealthAlert[] = [];
      
      // 构建基地过滤条件
      const baseFilter = baseId ? { base_id: baseId } : {};

      // 1. 检测持续生病的牛只（超过30天未康复）
      const longTermSickCattle = await HealthRecord.findAll({
        where: {
          status: 'ongoing',
          diagnosis_date: {
            [Op.lte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天前
          }
        },
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: baseFilter,
            attributes: ['id', 'ear_tag', 'breed']
          }
        ]
      });

      for (const record of longTermSickCattle) {
        alerts.push({
          id: `long_term_sick_${record.id}`,
          type: 'health_anomaly',
          severity: 'high',
          title: '长期患病预警',
          message: `牛只 ${record.cattle?.ear_tag} 已患病超过30天，建议加强治疗或咨询专业兽医`,
          cattle_id: record.cattle_id,
          base_id: record.cattle?.base_id,
          data: {
            diagnosis_date: record.diagnosis_date,
            diagnosis: record.diagnosis,
            days_sick: Math.floor((Date.now() - record.diagnosis_date.getTime()) / (24 * 60 * 60 * 1000))
          },
          created_at: new Date()
        });
      }

      // 2. 检测健康状态为sick但没有诊疗记录的牛只
      const sickCattleWithoutRecords = await Cattle.findAll({
        where: {
          ...baseFilter,
          health_status: 'sick'
        },
        include: [
          {
            model: HealthRecord,
            as: 'health_records',
            required: false,
            where: {
              status: 'ongoing'
            }
          }
        ]
      });

      for (const cattle of sickCattleWithoutRecords) {
        if (!cattle.health_records || cattle.health_records.length === 0) {
          alerts.push({
            id: `missing_diagnosis_${cattle.id}`,
            type: 'health_anomaly',
            severity: 'medium',
            title: '缺少诊疗记录',
            message: `牛只 ${cattle.ear_tag} 健康状态为患病，但缺少相应的诊疗记录`,
            cattle_id: cattle.id,
            base_id: cattle.base_id,
            data: {
              health_status: cattle.health_status,
              updated_at: cattle.updated_at
            },
            created_at: new Date()
          });
        }
      }

      // 3. 检测同一基地短期内多头牛只患病（可能的疫情）
      if (baseId) {
        const recentSickCount = await HealthRecord.count({
          where: {
            diagnosis_date: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天内
            },
            status: 'ongoing'
          },
          include: [
            {
              model: Cattle,
              as: 'cattle',
              where: { base_id: baseId },
              attributes: []
            }
          ]
        });

        const totalCattleCount = await Cattle.count({
          where: { base_id: baseId }
        });

        const sickPercentage = (recentSickCount / totalCattleCount) * 100;

        if (sickPercentage > 10) { // 超过10%的牛只在7天内患病
          alerts.push({
            id: `potential_outbreak_${baseId}`,
            type: 'critical_health',
            severity: 'critical',
            title: '疑似疫情预警',
            message: `基地内7天内有${recentSickCount}头牛只患病（占比${sickPercentage.toFixed(1)}%），疑似疫情爆发，请立即采取防控措施`,
            base_id: baseId,
            data: {
              sick_count: recentSickCount,
              total_count: totalCattleCount,
              percentage: sickPercentage,
              period_days: 7
            },
            created_at: new Date()
          });
        }
      }

      return alerts;
    } catch (error) {
      logger.error('检测健康异常失败:', error);
      return [];
    }
  }

  /**
   * 检测即将到期的疫苗
   */
  static async detectVaccineDueAlerts(baseId?: number): Promise<HealthAlert[]> {
    try {
      const alerts: HealthAlert[] = [];
      
      // 构建基地过滤条件
      const baseFilter = baseId ? { base_id: baseId } : {};

      // 检测30天内到期的疫苗
      const dueSoonDate = new Date();
      dueSoonDate.setDate(dueSoonDate.getDate() + 30);

      const dueSoonVaccinations = await VaccinationRecord.findAll({
        where: {
          next_due_date: {
            [Op.lte]: dueSoonDate,
            [Op.gte]: new Date()
          }
        },
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: baseFilter,
            attributes: ['id', 'ear_tag', 'breed']
          }
        ],
        order: [['next_due_date', 'ASC']]
      });

      for (const vaccination of dueSoonVaccinations) {
        const daysUntilDue = Math.ceil((vaccination.next_due_date!.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (daysUntilDue <= 7) {
          severity = 'high';
        } else if (daysUntilDue <= 15) {
          severity = 'medium';
        }

        alerts.push({
          id: `vaccine_due_${vaccination.id}`,
          type: 'vaccine_due',
          severity,
          title: '疫苗接种提醒',
          message: `牛只 ${vaccination.cattle?.ear_tag} 的${vaccination.vaccine_name}将在${daysUntilDue}天后到期，请及时安排接种`,
          cattle_id: vaccination.cattle_id,
          base_id: vaccination.cattle?.base_id,
          data: {
            vaccine_name: vaccination.vaccine_name,
            next_due_date: vaccination.next_due_date,
            days_until_due: daysUntilDue,
            last_vaccination_date: vaccination.vaccination_date
          },
          created_at: new Date()
        });
      }

      // 检测已过期的疫苗
      const overdueVaccinations = await VaccinationRecord.findAll({
        where: {
          next_due_date: {
            [Op.lt]: new Date()
          }
        },
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: baseFilter,
            attributes: ['id', 'ear_tag', 'breed']
          }
        ],
        order: [['next_due_date', 'ASC']]
      });

      for (const vaccination of overdueVaccinations) {
        const daysOverdue = Math.ceil((Date.now() - vaccination.next_due_date!.getTime()) / (24 * 60 * 60 * 1000));
        
        alerts.push({
          id: `vaccine_overdue_${vaccination.id}`,
          type: 'vaccine_due',
          severity: 'critical',
          title: '疫苗过期预警',
          message: `牛只 ${vaccination.cattle?.ear_tag} 的${vaccination.vaccine_name}已过期${daysOverdue}天，请立即安排补种`,
          cattle_id: vaccination.cattle_id,
          base_id: vaccination.cattle?.base_id,
          data: {
            vaccine_name: vaccination.vaccine_name,
            next_due_date: vaccination.next_due_date,
            days_overdue: daysOverdue,
            last_vaccination_date: vaccination.vaccination_date
          },
          created_at: new Date()
        });
      }

      return alerts;
    } catch (error) {
      logger.error('检测疫苗到期预警失败:', error);
      return [];
    }
  }

  /**
   * 分析健康趋势
   */
  static async analyzeHealthTrend(baseId?: number, days: number = 30): Promise<HealthTrendData[]> {
    try {
      const trends: HealthTrendData[] = [];
      const baseFilter = baseId ? { base_id: baseId } : {};

      // 按周分析趋势
      const weeksToAnalyze = Math.ceil(days / 7);
      
      for (let i = 0; i < weeksToAnalyze; i++) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (i * 7));
        
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        // 获取该周的健康统计
        const healthStats = await Cattle.findAll({
          where: baseFilter,
          attributes: [
            'health_status',
            [Cattle.sequelize!.fn('COUNT', Cattle.sequelize!.col('id')), 'count']
          ],
          group: ['health_status'],
          raw: true
        });

        const stats = {
          healthy_count: 0,
          sick_count: 0,
          treatment_count: 0
        };

        healthStats.forEach((stat: any) => {
          switch (stat.health_status) {
            case 'healthy':
              stats.healthy_count = parseInt(stat.count);
              break;
            case 'sick':
              stats.sick_count = parseInt(stat.count);
              break;
            case 'treatment':
              stats.treatment_count = parseInt(stat.count);
              break;
          }
        });

        // 计算趋势方向（与上一周比较）
        let trend_direction: 'improving' | 'stable' | 'declining' = 'stable';
        let change_percentage = 0;

        if (i > 0 && trends.length > 0) {
          const previousWeek = trends[0];
          const currentSickRate = (stats.sick_count + stats.treatment_count) / (stats.healthy_count + stats.sick_count + stats.treatment_count);
          const previousSickRate = (previousWeek.sick_count + previousWeek.treatment_count) / (previousWeek.healthy_count + previousWeek.sick_count + previousWeek.treatment_count);
          
          change_percentage = ((currentSickRate - previousSickRate) / previousSickRate) * 100;
          
          if (change_percentage < -5) {
            trend_direction = 'improving';
          } else if (change_percentage > 5) {
            trend_direction = 'declining';
          }
        }

        trends.unshift({
          period: `${startDate.toISOString().split('T')[0]} 至 ${endDate.toISOString().split('T')[0]}`,
          healthy_count: stats.healthy_count,
          sick_count: stats.sick_count,
          treatment_count: stats.treatment_count,
          trend_direction,
          change_percentage: Math.abs(change_percentage)
        });
      }

      return trends;
    } catch (error) {
      logger.error('分析健康趋势失败:', error);
      return [];
    }
  }

  /**
   * 生成健康趋势预警
   */
  static async generateHealthTrendAlerts(baseId?: number): Promise<HealthAlert[]> {
    try {
      const alerts: HealthAlert[] = [];
      const trends = await this.analyzeHealthTrend(baseId, 21); // 分析3周趋势

      if (trends.length >= 2) {
        const latestTrend = trends[0];
        const previousTrend = trends[1];

        // 检测持续恶化的趋势
        if (latestTrend.trend_direction === 'declining' && previousTrend.trend_direction === 'declining') {
          alerts.push({
            id: `declining_trend_${baseId || 'all'}`,
            type: 'health_trend',
            severity: 'high',
            title: '健康状况持续恶化',
            message: `${baseId ? '基地' : '整体'}健康状况连续两周恶化，患病率上升${latestTrend.change_percentage.toFixed(1)}%，建议加强防疫措施`,
            base_id: baseId,
            data: {
              trend_period: '2周',
              trend_direction: 'declining',
              change_percentage: latestTrend.change_percentage,
              current_stats: {
                healthy: latestTrend.healthy_count,
                sick: latestTrend.sick_count,
                treatment: latestTrend.treatment_count
              }
            },
            created_at: new Date()
          });
        }

        // 检测健康率过低
        const totalCattle = latestTrend.healthy_count + latestTrend.sick_count + latestTrend.treatment_count;
        const healthyRate = (latestTrend.healthy_count / totalCattle) * 100;

        if (healthyRate < 80) {
          alerts.push({
            id: `low_health_rate_${baseId || 'all'}`,
            type: 'health_trend',
            severity: healthyRate < 70 ? 'critical' : 'high',
            title: '健康率过低预警',
            message: `${baseId ? '基地' : '整体'}健康率仅为${healthyRate.toFixed(1)}%，低于正常水平，建议立即采取措施`,
            base_id: baseId,
            data: {
              healthy_rate: healthyRate,
              total_cattle: totalCattle,
              healthy_count: latestTrend.healthy_count,
              sick_count: latestTrend.sick_count,
              treatment_count: latestTrend.treatment_count
            },
            created_at: new Date()
          });
        }
      }

      return alerts;
    } catch (error) {
      logger.error('生成健康趋势预警失败:', error);
      return [];
    }
  }

  /**
   * 获取所有健康预警
   */
  static async getAllHealthAlerts(baseId?: number): Promise<HealthAlert[]> {
    try {
      const [
        anomalyAlerts,
        vaccineAlerts,
        trendAlerts
      ] = await Promise.all([
        this.detectHealthAnomalies(baseId),
        this.detectVaccineDueAlerts(baseId),
        this.generateHealthTrendAlerts(baseId)
      ]);

      const allAlerts = [
        ...anomalyAlerts,
        ...vaccineAlerts,
        ...trendAlerts
      ];

      // 按严重程度和时间排序
      const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      allAlerts.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.created_at.getTime() - a.created_at.getTime();
      });

      return allAlerts;
    } catch (error) {
      logger.error('获取健康预警失败:', error);
      return [];
    }
  }

  /**
   * 发送预警通知（模拟实现）
   */
  static async sendAlertNotifications(alerts: HealthAlert[], baseId?: number): Promise<void> {
    try {
      // 获取需要通知的用户
      const users = await User.findAll({
        where: baseId ? { base_id: baseId } : {},
        include: [
          {
            model: require('@/models').Role,
            as: 'role',
            where: {
              permissions: {
                [Op.contains]: ['health:read']
              }
            }
          }
        ]
      });

      for (const alert of alerts) {
        // 只发送高优先级和关键预警
        if (alert.severity === 'high' || alert.severity === 'critical') {
          for (const user of users) {
            // 这里可以集成实际的通知服务（短信、邮件、推送等）
            logger.info('发送健康预警通知:', {
              userId: user.id,
              userPhone: user.phone,
              alertType: alert.type,
              alertSeverity: alert.severity,
              alertTitle: alert.title,
              alertMessage: alert.message
            });

            // 模拟发送通知的延迟
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }
    } catch (error) {
      logger.error('发送预警通知失败:', error);
    }
  }
}