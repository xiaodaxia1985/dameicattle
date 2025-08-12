import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { HealthRecord, VaccinationRecord, Cattle, User } from '../models';
import { logger } from '../utils/logger';

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

      res.success({
        records: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取健康记录成功');
    } catch (error) {
      logger.error('获取健康记录失败:', error);
      res.error('获取健康记录失败', 500, 'HEALTH_RECORDS_ERROR');
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
        return res.error('指定的牛只不存在', 404, 'CATTLE_NOT_FOUND');
      }

      // 验证兽医是否存在（如果提供了）
      if (veterinarian_id) {
        const veterinarian = await User.findByPk(veterinarian_id);
        if (!veterinarian) {
          return res.error('指定的兽医不存在', 404, 'VETERINARIAN_NOT_FOUND');
        }
      }

      const healthRecord = await HealthRecord.create({
        cattle_id,
        base_id: cattle.base_id,
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

      res.success(fullRecord, '创建健康记录成功', 201);
    } catch (error) {
      logger.error('创建健康记录失败:', error);
      res.error('创建健康记录失败', 500, 'CREATE_HEALTH_RECORD_ERROR');
    }
  }

  // 更新健康记录
  static async updateHealthRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const healthRecord = await HealthRecord.findByPk(id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'base_id', 'health_status']
          }
        ]
      });

      if (!healthRecord) {
        return res.error('健康记录不存在', 404, 'HEALTH_RECORD_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以更新任何记录
      } else if (dataPermission.baseId && (healthRecord as any).cattle?.base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能更新所属基地的健康记录', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法更新健康记录', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      await healthRecord.update(updateData);

      // 如果状态变为完成，可能需要更新牛只健康状态
      if (updateData.status === 'completed' && healthRecord.status !== 'completed') {
        const cattle = (healthRecord as any).cattle;
        if (cattle) {
          // 检查是否还有其他进行中的健康记录
          const ongoingRecords = await HealthRecord.count({
            where: {
              cattle_id: cattle.id,
              status: 'ongoing',
              id: { [Op.ne]: healthRecord.id }
            }
          });

          if (ongoingRecords === 0) {
            await cattle.update({ health_status: 'healthy' });
          }
        }
      }

      // 获取更新后的完整记录
      const updatedRecord = await HealthRecord.findByPk(healthRecord.id, {
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

      res.success(updatedRecord, '更新健康记录成功');
    } catch (error) {
      logger.error('更新健康记录失败:', error);
      res.error('更新健康记录失败', 500, 'UPDATE_HEALTH_RECORD_ERROR');
    }
  }

  // 删除健康记录
  static async deleteHealthRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const healthRecord = await HealthRecord.findByPk(id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'base_id']
          }
        ]
      });

      if (!healthRecord) {
        return res.error('健康记录不存在', 404, 'HEALTH_RECORD_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以删除任何记录
      } else if (dataPermission.baseId && (healthRecord as any).cattle?.base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能删除所属基地的健康记录', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法删除健康记录', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      await healthRecord.destroy();

      res.success(null, '删除健康记录成功');
    } catch (error) {
      logger.error('删除健康记录失败:', error);
      res.error('删除健康记录失败', 500, 'DELETE_HEALTH_RECORD_ERROR');
    }
  }

  // 获取健康统计信息
  static async getHealthStatistics(req: Request, res: Response) {
    try {
      const { base_id, start_date, end_date } = req.query;

      const whereClause: any = {};
      const cattleWhereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        if (base_id) {
          cattleWhereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        cattleWhereClause.base_id = dataPermission.baseId;
      } else {
        cattleWhereClause.base_id = -1;
      }

      // 日期过滤
      if (start_date || end_date) {
        whereClause.diagnosis_date = {};
        if (start_date) {
          whereClause.diagnosis_date[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.diagnosis_date[Op.lte] = end_date;
        }
      }

      const healthRecords = await HealthRecord.findAll({
        where: whereClause,
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'base_id', 'health_status'],
            where: cattleWhereClause
          }
        ],
        attributes: ['id', 'status', 'diagnosis_date', 'diagnosis']
      });

      // 计算统计数据
      const totalRecords = healthRecords.length;
      const ongoingRecords = healthRecords.filter(r => r.status === 'ongoing').length;
      const completedRecords = healthRecords.filter(r => r.status === 'completed').length;
      const cancelledRecords = healthRecords.filter(r => r.status === 'cancelled').length;

      // 按月份统计
      const monthlyStats = healthRecords.reduce((acc, record) => {
        const month = new Date(record.diagnosis_date).toISOString().slice(0, 7);
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 疾病类型统计（简化版）
      const diseaseStats = healthRecords.reduce((acc, record) => {
        const diagnosis = record.diagnosis || '未诊断';
        acc[diagnosis] = (acc[diagnosis] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statistics = {
        overview: {
          total_records: totalRecords,
          ongoing_records: ongoingRecords,
          completed_records: completedRecords,
          cancelled_records: cancelledRecords
        },
        monthly_statistics: monthlyStats,
        disease_statistics: diseaseStats
      };

      res.success(statistics, '获取健康统计信息成功');
    } catch (error) {
      logger.error('获取健康统计信息失败:', error);
      res.error('获取健康统计信息失败', 500, 'HEALTH_STATISTICS_ERROR');
    }
  }

  // 获取健康记录详情
  static async getHealthRecordById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const healthRecord = await HealthRecord.findByPk(id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender', 'base_id']
          },
          {
            model: User,
            as: 'veterinarian',
            attributes: ['id', 'real_name', 'phone']
          }
        ]
      });

      if (!healthRecord) {
        return res.error('健康记录不存在', 404, 'HEALTH_RECORD_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以查看任何记录
      } else if (dataPermission.baseId && (healthRecord as any).cattle?.base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能查看所属基地的健康记录', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法查看健康记录', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      res.success(healthRecord, '获取健康记录详情成功');
    } catch (error) {
      logger.error('获取健康记录详情失败:', error);
      res.error('获取健康记录详情失败', 500, 'GET_HEALTH_RECORD_ERROR');
    }
  }

  // 获取疫苗记录列表
  static async getVaccinationRecords(req: Request, res: Response) {
    try {
      // TODO: 实现疫苗记录逻辑
      res.success({
        records: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0
        }
      }, '获取疫苗记录成功');
    } catch (error) {
      logger.error('获取疫苗记录失败:', error);
      res.error('获取疫苗记录失败', 500, 'GET_VACCINATION_RECORDS_ERROR');
    }
  }

  // 获取疫苗记录详情
  static async getVaccinationRecordById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // TODO: 实现疫苗记录详情逻辑
      res.success({ id, vaccine_name: '示例疫苗' }, '获取疫苗记录详情成功');
    } catch (error) {
      logger.error('获取疫苗记录详情失败:', error);
      res.error('获取疫苗记录详情失败', 500, 'GET_VACCINATION_RECORD_ERROR');
    }
  }

  // 创建疫苗记录
  static async createVaccinationRecord(req: Request, res: Response) {
    try {
      // TODO: 实现创建疫苗记录逻辑
      res.success({ id: 1, ...req.body }, '创建疫苗记录成功', 201);
    } catch (error) {
      logger.error('创建疫苗记录失败:', error);
      res.error('创建疫苗记录失败', 500, 'CREATE_VACCINATION_RECORD_ERROR');
    }
  }

  // 更新疫苗记录
  static async updateVaccinationRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // TODO: 实现更新疫苗记录逻辑
      res.success({ id, ...req.body }, '更新疫苗记录成功');
    } catch (error) {
      logger.error('更新疫苗记录失败:', error);
      res.error('更新疫苗记录失败', 500, 'UPDATE_VACCINATION_RECORD_ERROR');
    }
  }

  // 删除疫苗记录
  static async deleteVaccinationRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // TODO: 实现删除疫苗记录逻辑
      res.success(null, '删除疫苗记录成功');
    } catch (error) {
      logger.error('删除疫苗记录失败:', error);
      res.error('删除疫苗记录失败', 500, 'DELETE_VACCINATION_RECORD_ERROR');
    }
  }

  // 获取疾病记录列表
  static async getDiseaseRecords(req: Request, res: Response) {
    try {
      // TODO: 实现疾病记录逻辑
      res.success({
        records: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0
        }
      }, '获取疾病记录成功');
    } catch (error) {
      logger.error('获取疾病记录失败:', error);
      res.error('获取疾病记录失败', 500, 'GET_DISEASE_RECORDS_ERROR');
    }
  }

  // 获取疾病记录详情
  static async getDiseaseRecordById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // TODO: 实现疾病记录详情逻辑
      res.success({ id, disease_name: '示例疾病' }, '获取疾病记录详情成功');
    } catch (error) {
      logger.error('获取疾病记录详情失败:', error);
      res.error('获取疾病记录详情失败', 500, 'GET_DISEASE_RECORD_ERROR');
    }
  }

  // 创建疾病记录
  static async createDiseaseRecord(req: Request, res: Response) {
    try {
      // TODO: 实现创建疾病记录逻辑
      res.success({ id: 1, ...req.body }, '创建疾病记录成功', 201);
    } catch (error) {
      logger.error('创建疾病记录失败:', error);
      res.error('创建疾病记录失败', 500, 'CREATE_DISEASE_RECORD_ERROR');
    }
  }

  // 更新疾病记录
  static async updateDiseaseRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // TODO: 实现更新疾病记录逻辑
      res.success({ id, ...req.body }, '更新疾病记录成功');
    } catch (error) {
      logger.error('更新疾病记录失败:', error);
      res.error('更新疾病记录失败', 500, 'UPDATE_DISEASE_RECORD_ERROR');
    }
  }

  // 删除疾病记录
  static async deleteDiseaseRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // TODO: 实现删除疾病记录逻辑
      res.success(null, '删除疾病记录成功');
    } catch (error) {
      logger.error('删除疾病记录失败:', error);
      res.error('删除疾病记录失败', 500, 'DELETE_DISEASE_RECORD_ERROR');
    }
  }

  // 获取健康预警
  static async getHealthAlerts(req: Request, res: Response) {
    try {
      // TODO: 实现健康预警逻辑
      res.success({
        alerts: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0
        }
      }, '获取健康预警成功');
    } catch (error) {
      logger.error('获取健康预警失败:', error);
      res.error('获取健康预警失败', 500, 'GET_HEALTH_ALERTS_ERROR');
    }
  }

  // 发送健康预警通知
  static async sendHealthAlertNotifications(req: Request, res: Response) {
    try {
      // TODO: 实现发送健康预警通知逻辑
      res.success({ sent_count: 0 }, '发送健康预警通知成功');
    } catch (error) {
      logger.error('发送健康预警通知失败:', error);
      res.error('发送健康预警通知失败', 500, 'SEND_HEALTH_ALERT_NOTIFICATIONS_ERROR');
    }
  }

  // 获取健康趋势分析
  static async getHealthTrend(req: Request, res: Response) {
    try {
      // TODO: 实现健康趋势分析逻辑
      res.success({
        trend: [],
        period: '30d'
      }, '获取健康趋势分析成功');
    } catch (error) {
      logger.error('获取健康趋势分析失败:', error);
      res.error('获取健康趋势分析失败', 500, 'GET_HEALTH_TREND_ERROR');
    }
  }

  // 获取牛只健康档案
  static async getCattleHealthProfile(req: Request, res: Response) {
    try {
      const { cattleId } = req.params;
      // TODO: 实现牛只健康档案逻辑
      res.success({
        cattle_id: cattleId,
        health_records: [],
        vaccination_records: [],
        health_summary: {
          total_records: 0,
          last_checkup: null,
          health_status: 'healthy'
        }
      }, '获取牛只健康档案成功');
    } catch (error) {
      logger.error('获取牛只健康档案失败:', error);
      res.error('获取牛只健康档案失败', 500, 'GET_CATTLE_HEALTH_PROFILE_ERROR');
    }
  }
}