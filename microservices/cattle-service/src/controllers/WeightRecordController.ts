import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { WeightRecord, Cattle, User } from '../models';
import { logger } from '../utils/logger';

export class WeightRecordController {
  /**
   * Get weight records with pagination and filtering
   */
  static async getWeightRecords(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        cattle_id,
        start_date,
        end_date,
        operator_id,
        base_id
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || !dataPermission.canAccessAllBases) {
        if (dataPermission && dataPermission.baseId) {
          whereClause.base_id = dataPermission.baseId;
        } else {
          whereClause.base_id = -1;
        }
      } else if (base_id) {
        whereClause.base_id = base_id;
      }

      // Add other filters
      if (cattle_id) {
        whereClause.cattle_id = cattle_id;
      }
      if (operator_id) {
        whereClause.operator_id = operator_id;
      }

      // Date range filter
      if (start_date || end_date) {
        whereClause.record_date = {};
        if (start_date) {
          whereClause.record_date[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.record_date[Op.lte] = end_date;
        }
      }

      // 如果有base_id过滤，需要通过Cattle关联查询
      let records, count;
      if (whereClause.base_id) {
        const baseId = whereClause.base_id;
        delete whereClause.base_id;

        const result = await WeightRecord.findAndCountAll({
          where: whereClause,
          include: [
            {
              model: Cattle,
              as: 'cattle',
              where: {
                base_id: baseId
              },
              attributes: ['id', 'ear_tag', 'breed', 'gender', 'birth_date']
            },
            {
              model: User,
              as: 'operator',
              attributes: ['id', 'real_name', 'username']
            }
          ],
          limit: Number(limit),
          offset,
          order: [['record_date', 'DESC'], ['created_at', 'DESC']]
        });

        records = result.rows;
        count = result.count;
      } else {
        const result = await WeightRecord.findAndCountAll({
          where: whereClause,
          include: [
            {
              model: Cattle,
              as: 'cattle',
              attributes: ['id', 'ear_tag', 'breed', 'gender', 'birth_date']
            },
            {
              model: User,
              as: 'operator',
              attributes: ['id', 'real_name', 'username']
            }
          ],
          limit: Number(limit),
          offset,
          order: [['record_date', 'DESC'], ['created_at', 'DESC']]
        });

        records = result.rows;
        count = result.count;
      }

      res.success({
        records,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取体重记录成功');
    } catch (error) {
      logger.error('Error fetching weight records:', error);
      res.error('获取体重记录失败', 500, 'FETCH_WEIGHT_RECORDS_ERROR');
    }
  }

  /**
   * Get single weight record by ID
   */
  static async getWeightRecordById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const record = await WeightRecord.findByPk(id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender', 'birth_date']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      if (!record) {
        return res.error('体重记录不存在', 404, 'WEIGHT_RECORD_NOT_FOUND');
      }

      res.success(record, '获取体重记录成功');
    } catch (error) {
      logger.error('Error fetching weight record:', error);
      res.error('获取体重记录失败', 500, 'FETCH_WEIGHT_RECORD_ERROR');
    }
  }

  /**
   * Create weight record
   */
  static async createWeightRecord(req: Request, res: Response) {
    try {
      const {
        cattle_id,
        weight,
        record_date,
        notes
      } = req.body;
      const operator_id = req.user?.id;

      // 验证牛只是否存在
      const cattle = await Cattle.findByPk(cattle_id);
      if (!cattle) {
        return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || !dataPermission.canAccessAllBases) {
        if (dataPermission && dataPermission.baseId && dataPermission.baseId !== cattle.base_id) {
          return res.error('权限不足，只能在所属基地创建体重记录', 403, 'INSUFFICIENT_PERMISSIONS');
        } else if (!dataPermission || !dataPermission.baseId) {
          return res.error('没有基地权限，无法创建体重记录', 403, 'INSUFFICIENT_PERMISSIONS');
        }
      }

      const record = await WeightRecord.create({
        cattle_id,
        weight,
        record_date,
        operator_id,
        notes
      });

      // Fetch created record with associations
      const createdRecord = await WeightRecord.findByPk(record.id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender', 'birth_date']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      logger.info(`Weight record created: ${record.id}`, {
        userId: req.user?.id,
        cattleId: cattle_id,
        weight: weight
      });

      res.success(createdRecord, '创建体重记录成功', 201);
    } catch (error) {
      logger.error('Error creating weight record:', error);
      res.error('创建体重记录失败', 500, 'CREATE_WEIGHT_RECORD_ERROR');
    }
  }

  /**
   * Update weight record
   */
  static async updateWeightRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const record = await WeightRecord.findByPk(id);
      if (!record) {
        return res.error('体重记录不存在', 404, 'WEIGHT_RECORD_NOT_FOUND');
      }

      // 获取相关牛只信息
      const cattle = await Cattle.findByPk(record.cattle_id);
      if (!cattle) {
        return res.error('相关牛只不存在', 404, 'ASSOCIATED_CATTLE_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || !dataPermission.canAccessAllBases) {
        if (dataPermission && dataPermission.baseId && dataPermission.baseId !== cattle.base_id) {
          return res.error('权限不足，只能修改所属基地的体重记录', 403, 'INSUFFICIENT_PERMISSIONS');
        } else if (!dataPermission || !dataPermission.baseId) {
          return res.error('没有基地权限，无法修改体重记录', 403, 'INSUFFICIENT_PERMISSIONS');
        }
      }

      // 如果更新了牛只ID，验证新牛只是否存在
      if (updateData.cattle_id && updateData.cattle_id !== record.cattle_id) {
        const newCattle = await Cattle.findByPk(updateData.cattle_id);
        if (!newCattle) {
          return res.error('目标牛只不存在', 404, 'TARGET_CATTLE_NOT_FOUND');
        }

        // 检查新牛只的基地权限
        if (!dataPermission || !dataPermission.canAccessAllBases) {
          if (dataPermission && dataPermission.baseId && dataPermission.baseId !== newCattle.base_id) {
            return res.error('权限不足，只能修改所属基地牛只的体重记录', 403, 'INSUFFICIENT_PERMISSIONS');
          }
        }
      }

      await record.update(updateData);

      // Fetch updated record with associations
      const updatedRecord = await WeightRecord.findByPk(record.id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender', 'birth_date']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      logger.info(`Weight record updated: ${record.id}`, {
        userId: req.user?.id,
        recordId: record.id
      });

      res.success(updatedRecord, '更新体重记录成功');
    } catch (error) {
      logger.error('Error updating weight record:', error);
      res.error('更新体重记录失败', 500, 'UPDATE_WEIGHT_RECORD_ERROR');
    }
  }

  /**
   * Delete weight record
   */
  static async deleteWeightRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const record = await WeightRecord.findByPk(id);
      if (!record) {
        return res.error('体重记录不存在', 404, 'WEIGHT_RECORD_NOT_FOUND');
      }

      // 获取相关牛只信息
      const cattle = await Cattle.findByPk(record.cattle_id);
      if (!cattle) {
        // 即使牛只不存在，也可以删除记录
        await record.destroy();
        return res.success(null, '删除体重记录成功');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || !dataPermission.canAccessAllBases) {
        if (dataPermission && dataPermission.baseId && dataPermission.baseId !== cattle.base_id) {
          return res.error('权限不足，只能删除所属基地的体重记录', 403, 'INSUFFICIENT_PERMISSIONS');
        } else if (!dataPermission || !dataPermission.baseId) {
          return res.error('没有基地权限，无法删除体重记录', 403, 'INSUFFICIENT_PERMISSIONS');
        }
      }

      await record.destroy();

      logger.info(`Weight record deleted: ${record.id}`, {
        userId: req.user?.id,
        recordId: record.id
      });

      res.success(null, '删除体重记录成功');
    } catch (error) {
      logger.error('Error deleting weight record:', error);
      res.error('删除体重记录失败', 500, 'DELETE_WEIGHT_RECORD_ERROR');
    }
  }

  /**
   * Get growth analysis for a specific cattle
   */
  static async getCattleGrowthAnalysis(req: Request, res: Response) {
    try {
      const { cattle_id } = req.params;
      const { start_date, end_date } = req.query;

      // 验证牛只是否存在
      const cattle = await Cattle.findByPk(cattle_id);
      if (!cattle) {
        return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || !dataPermission.canAccessAllBases) {
        if (dataPermission && dataPermission.baseId && dataPermission.baseId !== cattle.base_id) {
          return res.error('权限不足，只能查看所属基地牛只的生长分析', 403, 'INSUFFICIENT_PERMISSIONS');
        } else if (!dataPermission || !dataPermission.baseId) {
          return res.error('没有基地权限，无法查看生长分析', 403, 'INSUFFICIENT_PERMISSIONS');
        }
      }

      const whereClause: any = {
        cattle_id
      };

      // Date range filter
      if (start_date || end_date) {
        whereClause.record_date = {};
        if (start_date) {
          whereClause.record_date[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.record_date[Op.lte] = end_date;
        }
      }

      const records = await WeightRecord.findAll({
        where: whereClause,
        order: [['record_date', 'ASC']]
      });

      if (records.length === 0) {
        return res.success({
          hasData: false,
          records: [],
          statistics: {
            totalWeightGain: 0,
            averageDailyGain: 0,
            daysInPeriod: 0
          }
        }, '获取生长分析成功');
      }

      // 计算统计数据
      const firstRecord = records[0];
      const lastRecord = records[records.length - 1];
      const totalWeightGain = Number(lastRecord.weight) - Number(firstRecord.weight);
      const daysInPeriod = Math.ceil((lastRecord.record_date.getTime() - firstRecord.record_date.getTime()) / (1000 * 60 * 60 * 24));
      const averageDailyGain = daysInPeriod > 0 ? totalWeightGain / daysInPeriod : 0;

      res.success({
        hasData: true,
        records,
        statistics: {
          totalWeightGain,
          averageDailyGain,
          daysInPeriod
        }
      }, '获取生长分析成功');
    } catch (error) {
      logger.error('Error fetching growth analysis:', error);
      res.error('获取生长分析失败', 500, 'GROWTH_ANALYSIS_ERROR');
    }
  }

  // 实例方法用于路由绑定
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WeightRecordController.getWeightRecords(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WeightRecordController.getWeightRecordById(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WeightRecordController.createWeightRecord(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WeightRecordController.updateWeightRecord(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WeightRecordController.deleteWeightRecord(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async getGrowthAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WeightRecordController.getCattleGrowthAnalysis(req, res);
    } catch (error) {
      next(error);
    }
  }
}