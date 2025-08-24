import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { HealthRecord, VaccinationRecord, Cattle, User } from '../models';
import { logger } from '../utils/logger';

export class HealthController {
  // 获取健康记录列表
  static async getHealthRecords(req: Request, res: Response): Promise<void> {
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

      (res as any).success({
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
      (res as any).error('获取健康记录失败', 500, 'HEALTH_RECORDS_ERROR');
    }
  }

  // 创建健康记录
  static async createHealthRecord(req: Request, res: Response): Promise<void> {
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
        (res as any).error('指定的牛只不存在', 404, 'CATTLE_NOT_FOUND');
        return;
      }

      // 验证兽医是否存在（如果提供了）
      if (veterinarian_id) {
        const veterinarian = await User.findByPk(veterinarian_id);
        if (!veterinarian) {
          (res as any).error('指定的兽医不存在', 404, 'VETERINARIAN_NOT_FOUND');
          return;
        }
      }

      const healthRecord = await HealthRecord.create({
        cattle_id,
        base_id: (cattle as any).base_id,
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

      (res as any).success(fullRecord, '创建健康记录成功', 201);
    } catch (error) {
      logger.error('创建健康记录失败:', error);
      (res as any).error('创建健康记录失败', 500, 'CREATE_HEALTH_RECORD_ERROR');
    }
  }

  // 简化的实例方法用于路由绑定
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await HealthController.getHealthRecords(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await HealthController.createHealthRecord(req, res);
    } catch (error) {
      next(error);
    }
  }
}