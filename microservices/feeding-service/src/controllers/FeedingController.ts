import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { FeedFormula, FeedingRecord, User } from '../models';
import { logger } from '../utils/logger';

export class FeedingController {
  // Feed Formula CRUD operations
  
  /**
   * Create a new feed formula
   */
  static async createFeedFormula(req: Request, res: Response) {
    try {
      const { name, description, ingredients, cost_per_kg } = req.body;
      const created_by = req.user?.id;

      // Check if formula name already exists
      const existingFormula = await FeedFormula.findOne({
        where: { name }
      });

      if (existingFormula) {
        return res.error('配方名称已存在', 409, 'FORMULA_NAME_EXISTS');
      }

      const formula = await FeedFormula.create({
        name,
        description,
        ingredients,
        cost_per_kg,
        ingredients_version: 2,
        created_by
      });

      // Fetch the created formula with creator info
      const createdFormula = await FeedFormula.findByPk(formula.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      logger.info(`Feed formula created: ${formula.id}`, {
        userId: req.user?.id,
        formulaId: formula.id,
        formulaName: name
      });

      res.success(createdFormula, '饲料配方创建成功', 201);
    } catch (error) {
      logger.error('Error creating feed formula:', error);
      res.error('创建饲料配方失败', 500, 'CREATE_FORMULA_ERROR');
    }
  }

  /**
   * Get feed formulas with pagination and filtering
   */
  static async getFeedFormulas(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        created_by
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Add creator filter
      if (created_by) {
        whereClause.created_by = created_by;
      }

      const { count, rows } = await FeedFormula.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.success({
        formulas: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取饲料配方列表成功');
    } catch (error) {
      logger.error('Error fetching feed formulas:', error);
      res.error('获取饲料配方列表失败', 500, 'FETCH_FORMULAS_ERROR');
    }
  }

  /**
   * Get single feed formula
   */
  static async getFeedFormula(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const formula = await FeedFormula.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      if (!formula) {
        return res.error('饲料配方不存在', 404, 'FORMULA_NOT_FOUND');
      }

      res.success(formula, '获取饲料配方成功');
    } catch (error) {
      logger.error('Error fetching feed formula:', error);
      res.error('获取饲料配方失败', 500, 'FETCH_FORMULA_ERROR');
    }
  }

  /**
   * Update feed formula
   */
  static async updateFeedFormula(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const formula = await FeedFormula.findByPk(id);
      if (!formula) {
        return res.error('饲料配方不存在', 404, 'FORMULA_NOT_FOUND');
      }

      // Check if name is being changed and if it already exists
      if (updateData.name && updateData.name !== formula.name) {
        const existingFormula = await FeedFormula.findOne({
          where: { name: updateData.name }
        });
        if (existingFormula) {
          return res.error('配方名称已存在', 409, 'FORMULA_NAME_EXISTS');
        }
      }

      await formula.update(updateData);

      // Fetch updated formula with creator info
      const updatedFormula = await FeedFormula.findByPk(formula.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      res.success(updatedFormula, '更新饲料配方成功');
    } catch (error) {
      logger.error('Error updating feed formula:', error);
      res.error('更新饲料配方失败', 500, 'UPDATE_FORMULA_ERROR');
    }
  }

  /**
   * Delete feed formula
   */
  static async deleteFeedFormula(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const formula = await FeedFormula.findByPk(id);
      if (!formula) {
        return res.error('饲料配方不存在', 404, 'FORMULA_NOT_FOUND');
      }

      // Check if formula is being used in feeding records
      const recordCount = await FeedingRecord.count({
        where: { formula_id: id }
      });

      if (recordCount > 0) {
        return res.error('该配方正在使用中，无法删除', 400, 'FORMULA_IN_USE');
      }

      await formula.destroy();

      res.success(null, '删除饲料配方成功');
    } catch (error) {
      logger.error('Error deleting feed formula:', error);
      res.error('删除饲料配方失败', 500, 'DELETE_FORMULA_ERROR');
    }
  }

  // Feeding Record CRUD operations

  /**
   * Get feeding records with pagination and filtering
   */
  static async getFeedingRecords(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        base_id,
        barn_id,
        formula_id,
        start_date,
        end_date,
        operator_id
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        if (base_id) {
          whereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        whereClause.base_id = dataPermission.baseId;
      } else {
        whereClause.base_id = -1;
      }

      // Add other filters
      if (barn_id) {
        whereClause.barn_id = barn_id;
      }
      if (formula_id) {
        whereClause.formula_id = formula_id;
      }
      if (operator_id) {
        whereClause.operator_id = operator_id;
      }

      // Date range filter
      if (start_date || end_date) {
        whereClause.feeding_date = {};
        if (start_date) {
          whereClause.feeding_date[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.feeding_date[Op.lte] = end_date;
        }
      }

      const { count, rows } = await FeedingRecord.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: FeedFormula,
            as: 'formula',
            attributes: ['id', 'name', 'cost_per_kg']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['feeding_date', 'DESC'], ['created_at', 'DESC']]
      });

      res.success({
        records: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取饲喂记录成功');
    } catch (error) {
      logger.error('Error fetching feeding records:', error);
      res.error('获取饲喂记录失败', 500, 'FETCH_RECORDS_ERROR');
    }
  }

  /**
   * Create feeding record
   */
  static async createFeedingRecord(req: Request, res: Response) {
    try {
      const {
        formula_id,
        base_id,
        barn_id,
        amount,
        feeding_date
      } = req.body;
      const operator_id = req.user?.id;

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以在任何基地创建记录
      } else if (dataPermission.baseId && base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能在所属基地创建饲喂记录', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法创建饲喂记录', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      const record = await FeedingRecord.create({
        formula_id,
        base_id,
        barn_id,
        amount,
        feeding_date,
        operator_id
      });

      // Fetch created record with associations
      const createdRecord = await FeedingRecord.findByPk(record.id, {
        include: [
          {
            model: FeedFormula,
            as: 'formula',
            attributes: ['id', 'name', 'cost_per_kg']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      res.success(createdRecord, '创建饲喂记录成功', 201);
    } catch (error) {
      logger.error('Error creating feeding record:', error);
      res.error('创建饲喂记录失败', 500, 'CREATE_RECORD_ERROR');
    }
  }

  /**
   * Get feeding statistics
   */
  static async getFeedingStatistics(req: Request, res: Response) {
    try {
      const { base_id, start_date, end_date } = req.query;

      const whereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        if (base_id) {
          whereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        whereClause.base_id = dataPermission.baseId;
      } else {
        whereClause.base_id = -1;
      }

      // Date range filter
      if (start_date || end_date) {
        whereClause.feeding_date = {};
        if (start_date) {
          whereClause.feeding_date[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.feeding_date[Op.lte] = end_date;
        }
      }

      const records = await FeedingRecord.findAll({
        where: whereClause,
        include: [
          {
            model: FeedFormula,
            as: 'formula',
            attributes: ['id', 'name', 'cost_per_kg']
          }
        ]
      });

      // Calculate statistics
      const totalRecords = records.length;
      const totalAmount = records.reduce((sum, record) => sum + Number(record.amount), 0);
      
      let totalCost = 0;
      records.forEach(record => {
        if ((record as any).formula?.cost_per_kg) {
          totalCost += Number(record.amount) * Number((record as any).formula.cost_per_kg);
        }
      });

      // Formula usage statistics
      const formulaStats = records.reduce((acc, record) => {
        const formulaName = (record as any).formula?.name || '未指定配方';
        if (!acc[formulaName]) {
          acc[formulaName] = { count: 0, amount: 0 };
        }
        acc[formulaName].count += 1;
        acc[formulaName].amount += Number(record.amount);
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      // Daily statistics
      const dailyStats = records.reduce((acc, record) => {
        const date = record.feeding_date.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, amount: 0 };
        }
        acc[date].count += 1;
        acc[date].amount += Number(record.amount);
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      const statistics = {
        overview: {
          total_records: totalRecords,
          total_amount: totalAmount,
          total_cost: totalCost,
          average_amount_per_record: totalRecords > 0 ? totalAmount / totalRecords : 0
        },
        formula_statistics: formulaStats,
        daily_statistics: dailyStats
      };

      res.success(statistics, '获取饲喂统计信息成功');
    } catch (error) {
      logger.error('Error fetching feeding statistics:', error);
      res.error('获取饲喂统计信息失败', 500, 'FEEDING_STATISTICS_ERROR');
    }
  }
}