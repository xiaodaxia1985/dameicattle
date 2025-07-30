import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { HealthRecord, VaccinationRecord, Cattle, User } from '@/models';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export class HealthController {
  // 获取健康记录列表
  static async getHealthRecords(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        cattle_id,
        status,
        start_date,
        end_date,
        veterinarian_id,
        base_id
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // 数据权限过滤 - 通过牛只的基地进行过滤
      const dataPermission = (req as any).dataPermission;
      let cattleWhereClause: any = {};
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员：如果指定了base_id参数，则按base_id过滤，否则显示所有健康记录
        if (base_id) {
          cattleWhereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的健康记录
        cattleWhereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不显示任何健康记录
        cattleWhereClause.base_id = -1;
      }

      // 构建查询条件
      if (cattle_id) {
        where.cattle_id = cattle_id;
      }

      if (status) {
        where.status = status;
      }

      if (veterinarian_id) {
        where.veterinarian_id = veterinarian_id;
      }

      if (start_date || end_date) {
        where.diagnosis_date = {};
        if (start_date) {
          where.diagnosis_date[Op.gte] = start_date;
        }
        if (end_date) {
          where.diagnosis_date[Op.lte] = end_date;
        }
      }

      // 构建包含关系
      const include: any[] = [
        {
          model: Cattle,
          as: 'cattle',
          attributes: ['id', 'ear_tag', 'breed', 'gender', 'health_status'],
          where: cattleWhereClause
        },
        {
          model: User,
          as: 'veterinarian',
          attributes: ['id', 'real_name', 'phone']
        }
      ];

      const { count, rows } = await HealthRecord.findAndCountAll({
        where,
        include,
        limit: Number(limit),
        offset,
        order: [['diagnosis_date', 'DESC'], ['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          records: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('获取健康记录失败:', error);
      throw new AppError('获取健康记录失败', 500);
    }
  }

  // 创建健康记录
  static async createHealthRecord(req: Request, res: Response) {
    try {
      const {
        cattle_id,
        symptoms,
        diagnosis,
        treatment,
        veterinarian_id,
        diagnosis_date,
        status = 'ongoing'
      } = req.body;

      // 验证牛只是否存在
      const cattle = await Cattle.findByPk(cattle_id);
      if (!cattle) {
        throw new AppError('指定的牛只不存在', 404);
      }

      // 验证兽医是否存在（如果提供了）
      if (veterinarian_id) {
        const veterinarian = await User.findByPk(veterinarian_id);
        if (!veterinarian) {
          throw new AppError('指定的兽医不存在', 404);
        }
      }

      const healthRecord = await HealthRecord.create({
        cattle_id,
        symptoms,
        diagnosis,
        treatment,
        veterinarian_id,
        diagnosis_date,
        status
      });

      // 如果是新的疾病记录，更新牛只健康状态
      if (status === 'ongoing') {
        await cattle.update({ health_status: 'sick' });
      }

      // 获取完整的记录信息
      const fullRecord = await HealthRecord.findByPk(healthRecord.id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender']
          },
          {
            model: User,
            as: 'veterinarian',
            attributes: ['id', 'real_name', 'phone']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: fullRecord,
        message: '健康记录创建成功'
      });
    } catch (error) {
      logger.error('创建健康记录失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('创建健康记录失败', 500);
    }
  }

  // 更新健康记录
  static async updateHealthRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const healthRecord = await HealthRecord.findByPk(id);
      if (!healthRecord) {
        throw new AppError('健康记录不存在', 404);
      }

      await healthRecord.update(updateData);

      // 如果状态更新为已完成，检查是否需要更新牛只健康状态
      if (updateData.status === 'completed') {
        const cattle = await Cattle.findByPk(healthRecord.cattle_id);
        if (cattle) {
          // 检查是否还有其他进行中的健康记录
          const ongoingRecords = await HealthRecord.count({
            where: {
              cattle_id: healthRecord.cattle_id,
              status: 'ongoing'
            }
          });

          // 如果没有其他进行中的记录，将牛只状态更新为健康
          if (ongoingRecords === 0) {
            await cattle.update({ health_status: 'healthy' });
          }
        }
      }

      // 获取更新后的完整记录
      const updatedRecord = await HealthRecord.findByPk(id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender']
          },
          {
            model: User,
            as: 'veterinarian',
            attributes: ['id', 'real_name', 'phone']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedRecord,
        message: '健康记录更新成功'
      });
    } catch (error) {
      logger.error('更新健康记录失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新健康记录失败', 500);
    }
  }

  // 删除健康记录
  static async deleteHealthRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const healthRecord = await HealthRecord.findByPk(id);
      if (!healthRecord) {
        throw new AppError('健康记录不存在', 404);
      }

      await healthRecord.destroy();

      res.json({
        success: true,
        message: '健康记录删除成功'
      });
    } catch (error) {
      logger.error('删除健康记录失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('删除健康记录失败', 500);
    }
  }

  // 获取疫苗接种记录列表
  static async getVaccinationRecords(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        cattle_id,
        vaccine_name,
        start_date,
        end_date,
        veterinarian_id,
        base_id,
        due_soon // 即将到期的疫苗
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // 数据权限过滤 - 通过牛只的基地进行过滤
      const dataPermission = (req as any).dataPermission;
      let cattleWhereClause: any = {};
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员：如果指定了base_id参数，则按base_id过滤，否则显示所有疫苗记录
        if (base_id) {
          cattleWhereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的疫苗记录
        cattleWhereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不显示任何疫苗记录
        cattleWhereClause.base_id = -1;
      }

      // 构建查询条件
      if (cattle_id) {
        where.cattle_id = cattle_id;
      }

      if (vaccine_name) {
        where.vaccine_name = {
          [Op.iLike]: `%${vaccine_name}%`
        };
      }

      if (veterinarian_id) {
        where.veterinarian_id = veterinarian_id;
      }

      if (start_date || end_date) {
        where.vaccination_date = {};
        if (start_date) {
          where.vaccination_date[Op.gte] = start_date;
        }
        if (end_date) {
          where.vaccination_date[Op.lte] = end_date;
        }
      }

      // 即将到期的疫苗（30天内）
      if (due_soon === 'true') {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        where.next_due_date = {
          [Op.lte]: thirtyDaysFromNow,
          [Op.gte]: new Date()
        };
      }

      // 构建包含关系
      const include: any[] = [
        {
          model: Cattle,
          as: 'cattle',
          attributes: ['id', 'ear_tag', 'breed', 'gender'],
          where: cattleWhereClause
        },
        {
          model: User,
          as: 'veterinarian',
          attributes: ['id', 'real_name', 'phone']
        }
      ];

      const { count, rows } = await VaccinationRecord.findAndCountAll({
        where,
        include,
        limit: Number(limit),
        offset,
        order: [['vaccination_date', 'DESC'], ['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          records: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('获取疫苗接种记录失败:', error);
      throw new AppError('获取疫苗接种记录失败', 500);
    }
  }

  // 创建疫苗接种记录
  static async createVaccinationRecord(req: Request, res: Response) {
    try {
      const {
        cattle_id,
        vaccine_name,
        vaccination_date,
        next_due_date,
        veterinarian_id,
        batch_number
      } = req.body;

      // 验证牛只是否存在
      const cattle = await Cattle.findByPk(cattle_id);
      if (!cattle) {
        throw new AppError('指定的牛只不存在', 404);
      }

      // 验证兽医是否存在（如果提供了）
      if (veterinarian_id) {
        const veterinarian = await User.findByPk(veterinarian_id);
        if (!veterinarian) {
          throw new AppError('指定的兽医不存在', 404);
        }
      }

      const vaccinationRecord = await VaccinationRecord.create({
        cattle_id,
        vaccine_name,
        vaccination_date,
        next_due_date,
        veterinarian_id,
        batch_number
      });

      // 获取完整的记录信息
      const fullRecord = await VaccinationRecord.findByPk(vaccinationRecord.id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender']
          },
          {
            model: User,
            as: 'veterinarian',
            attributes: ['id', 'real_name', 'phone']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: fullRecord,
        message: '疫苗接种记录创建成功'
      });
    } catch (error) {
      logger.error('创建疫苗接种记录失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('创建疫苗接种记录失败', 500);
    }
  }

  // 更新疫苗接种记录
  static async updateVaccinationRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const vaccinationRecord = await VaccinationRecord.findByPk(id);
      if (!vaccinationRecord) {
        throw new AppError('疫苗接种记录不存在', 404);
      }

      await vaccinationRecord.update(updateData);

      // 获取更新后的完整记录
      const updatedRecord = await VaccinationRecord.findByPk(id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender']
          },
          {
            model: User,
            as: 'veterinarian',
            attributes: ['id', 'real_name', 'phone']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedRecord,
        message: '疫苗接种记录更新成功'
      });
    } catch (error) {
      logger.error('更新疫苗接种记录失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新疫苗接种记录失败', 500);
    }
  }

  // 删除疫苗接种记录
  static async deleteVaccinationRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const vaccinationRecord = await VaccinationRecord.findByPk(id);
      if (!vaccinationRecord) {
        throw new AppError('疫苗接种记录不存在', 404);
      }

      await vaccinationRecord.destroy();

      res.json({
        success: true,
        message: '疫苗接种记录删除成功'
      });
    } catch (error) {
      logger.error('删除疫苗接种记录失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('删除疫苗接种记录失败', 500);
    }
  }

  // 获取健康统计数据
  static async getHealthStatistics(req: Request, res: Response) {
    try {
      const { base_id, start_date, end_date } = req.query;

      // 构建基础查询条件
      const cattleWhere: any = {};
      if (base_id) {
        cattleWhere.base_id = base_id;
      }

      const dateWhere: any = {};
      if (start_date || end_date) {
        dateWhere.diagnosis_date = {};
        if (start_date) {
          dateWhere.diagnosis_date[Op.gte] = start_date;
        }
        if (end_date) {
          dateWhere.diagnosis_date[Op.lte] = end_date;
        }
      }

      // 获取牛只健康状态统计
      const healthStatusStats = await Cattle.findAll({
        where: cattleWhere,
        attributes: [
          'health_status',
          [Cattle.sequelize!.fn('COUNT', Cattle.sequelize!.col('id')), 'count']
        ],
        group: ['health_status'],
        raw: true
      });

      // 获取疾病类型统计（基于诊断记录）
      const diseaseStats = await HealthRecord.findAll({
        where: dateWhere,
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: cattleWhere,
            attributes: []
          }
        ],
        attributes: [
          'diagnosis',
          [HealthRecord.sequelize!.fn('COUNT', HealthRecord.sequelize!.col('HealthRecord.id')), 'count']
        ],
        group: ['diagnosis'],
        having: HealthRecord.sequelize!.where(
          HealthRecord.sequelize!.col('diagnosis'),
          Op.ne,
          null
        ),
        order: [[HealthRecord.sequelize!.fn('COUNT', HealthRecord.sequelize!.col('HealthRecord.id')), 'DESC']],
        limit: 10,
        raw: true
      });

      // 获取疫苗接种统计
      const vaccinationStats = await VaccinationRecord.findAll({
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: cattleWhere,
            attributes: []
          }
        ],
        attributes: [
          'vaccine_name',
          [VaccinationRecord.sequelize!.fn('COUNT', VaccinationRecord.sequelize!.col('VaccinationRecord.id')), 'count']
        ],
        group: ['vaccine_name'],
        order: [[VaccinationRecord.sequelize!.fn('COUNT', VaccinationRecord.sequelize!.col('VaccinationRecord.id')), 'DESC']],
        limit: 10,
        raw: true
      });

      // 获取即将到期的疫苗数量
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const dueSoonCount = await VaccinationRecord.count({
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: cattleWhere,
            attributes: []
          }
        ],
        where: {
          next_due_date: {
            [Op.lte]: thirtyDaysFromNow,
            [Op.gte]: new Date()
          }
        }
      });

      // 获取健康趋势数据（按月统计）
      const healthTrend = await HealthRecord.findAll({
        where: {
          ...dateWhere,
          diagnosis_date: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        },
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: cattleWhere,
            attributes: []
          }
        ],
        attributes: [
          [HealthRecord.sequelize!.fn('DATE_TRUNC', 'month', HealthRecord.sequelize!.col('diagnosis_date')), 'month'],
          [HealthRecord.sequelize!.fn('COUNT', HealthRecord.sequelize!.col('HealthRecord.id')), 'count']
        ],
        group: [HealthRecord.sequelize!.fn('DATE_TRUNC', 'month', HealthRecord.sequelize!.col('diagnosis_date'))],
        order: [[HealthRecord.sequelize!.fn('DATE_TRUNC', 'month', HealthRecord.sequelize!.col('diagnosis_date')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: {
          healthStatus: healthStatusStats,
          diseaseTypes: diseaseStats,
          vaccinations: vaccinationStats,
          dueSoonVaccinations: dueSoonCount,
          healthTrend
        }
      });
    } catch (error) {
      logger.error('获取健康统计数据失败:', error);
      throw new AppError('获取健康统计数据失败', 500);
    }
  }

  // 获取单个牛只的健康档案
  static async getCattleHealthProfile(req: Request, res: Response) {
    try {
      const { cattle_id } = req.params;

      // 验证牛只是否存在
      const cattle = await Cattle.findByPk(cattle_id, {
        attributes: ['id', 'ear_tag', 'breed', 'gender', 'birth_date', 'health_status']
      });

      if (!cattle) {
        throw new AppError('指定的牛只不存在', 404);
      }

      // 获取健康记录
      const healthRecords = await HealthRecord.findAll({
        where: { cattle_id },
        include: [
          {
            model: User,
            as: 'veterinarian',
            attributes: ['id', 'real_name', 'phone']
          }
        ],
        order: [['diagnosis_date', 'DESC']]
      });

      // 获取疫苗接种记录
      const vaccinationRecords = await VaccinationRecord.findAll({
        where: { cattle_id },
        include: [
          {
            model: User,
            as: 'veterinarian',
            attributes: ['id', 'real_name', 'phone']
          }
        ],
        order: [['vaccination_date', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          cattle,
          healthRecords,
          vaccinationRecords
        }
      });
    } catch (error) {
      logger.error('获取牛只健康档案失败:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取牛只健康档案失败', 500);
    }
  }

  // 获取健康预警
  static async getHealthAlerts(req: Request, res: Response) {
    try {
      const { base_id } = req.query;
      const { HealthAlertService } = await import('@/services/HealthAlertService');

      const alerts = await HealthAlertService.getAllHealthAlerts(
        base_id ? parseInt(base_id as string) : undefined
      );

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
      logger.error('获取健康预警失败:', error);
      throw new AppError('获取健康预警失败', 500);
    }
  }

  // 获取健康趋势分析
  static async getHealthTrend(req: Request, res: Response) {
    try {
      const { base_id, days = 30 } = req.query;
      const { HealthAlertService } = await import('@/services/HealthAlertService');

      const trends = await HealthAlertService.analyzeHealthTrend(
        base_id ? parseInt(base_id as string) : undefined,
        parseInt(days as string)
      );

      res.json({
        success: true,
        data: {
          trends,
          analysis_period: `${days}天`,
          total_periods: trends.length
        }
      });
    } catch (error) {
      logger.error('获取健康趋势分析失败:', error);
      throw new AppError('获取健康趋势分析失败', 500);
    }
  }

  // 发送健康预警通知
  static async sendHealthAlertNotifications(req: Request, res: Response) {
    try {
      const { base_id, alert_types } = req.body;
      const { HealthAlertService } = await import('@/services/HealthAlertService');

      // 获取指定类型的预警
      let alerts = await HealthAlertService.getAllHealthAlerts(base_id);
      
      if (alert_types && alert_types.length > 0) {
        alerts = alerts.filter(alert => alert_types.includes(alert.type));
      }

      // 发送通知
      await HealthAlertService.sendAlertNotifications(alerts, base_id);

      res.json({
        success: true,
        data: {
          sent_count: alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
          total_alerts: alerts.length
        },
        message: '健康预警通知发送成功'
      });
    } catch (error) {
      logger.error('发送健康预警通知失败:', error);
      throw new AppError('发送健康预警通知失败', 500);
    }
  }
}