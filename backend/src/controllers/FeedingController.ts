import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { FeedFormula, FeedingRecord, Base, Barn, User } from '@/models';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

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
        throw new AppError('配方名称已存在', 409);
      }

      const formula = await FeedFormula.create({
        name,
        description,
        ingredients,
        cost_per_kg,
        ingredients_version: 2, // 标记为新版本格式
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

      res.status(201).json({
        success: true,
        data: createdFormula,
        message: '饲料配方创建成功'
      });
    } catch (error) {
      logger.error('Error creating feed formula:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('创建饲料配方失败', 500);
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
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          formulas: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching feed formulas:', error);
      throw new AppError('获取饲料配方列表失败', 500);
    }
  }

  /**
   * Get a single feed formula by ID
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
          },
          {
            model: FeedingRecord,
            as: 'feeding_records',
            limit: 10,
            order: [['feeding_date', 'DESC']],
            include: [
              {
                model: Base,
                as: 'base',
                attributes: ['id', 'name']
              },
              {
                model: Barn,
                as: 'barn',
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });

      if (!formula) {
        throw new AppError('饲料配方不存在', 404);
      }

      // Calculate usage statistics
      const usageStats = await FeedingRecord.findAll({
        where: { formula_id: id },
        attributes: [
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'usage_count'],
          [FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'total_amount'],
          [FeedingRecord.sequelize!.fn('MAX', FeedingRecord.sequelize!.col('feeding_date')), 'last_used']
        ],
        raw: true
      });

      res.json({
        success: true,
        data: {
          formula,
          usage_stats: usageStats[0] || { usage_count: 0, total_amount: 0, last_used: null }
        }
      });
    } catch (error) {
      logger.error('Error fetching feed formula:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取饲料配方详情失败', 500);
    }
  }

  /**
   * Update a feed formula
   */
  static async updateFeedFormula(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, ingredients, cost_per_kg } = req.body;

      const formula = await FeedFormula.findByPk(id);
      if (!formula) {
        throw new AppError('饲料配方不存在', 404);
      }

      // Check if new name conflicts with existing formulas
      if (name && name !== formula.name) {
        const existingFormula = await FeedFormula.findOne({
          where: { 
            name,
            id: { [Op.ne]: id }
          }
        });

        if (existingFormula) {
          throw new AppError('配方名称已存在', 409);
        }
      }

      await formula.update({
        name: name || formula.name,
        description: description !== undefined ? description : formula.description,
        ingredients: ingredients || formula.ingredients,
        cost_per_kg: cost_per_kg !== undefined ? cost_per_kg : formula.cost_per_kg,
        ingredients_version: ingredients ? 2 : formula.ingredients_version // 更新版本号如果成分有变化
      });

      // Fetch updated formula with creator info
      const updatedFormula = await FeedFormula.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      logger.info(`Feed formula updated: ${id}`, {
        userId: req.user?.id,
        formulaId: id
      });

      res.json({
        success: true,
        data: updatedFormula,
        message: '饲料配方更新成功'
      });
    } catch (error) {
      logger.error('Error updating feed formula:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新饲料配方失败', 500);
    }
  }

  /**
   * Delete a feed formula
   */
  static async deleteFeedFormula(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const formula = await FeedFormula.findByPk(id);
      if (!formula) {
        throw new AppError('饲料配方不存在', 404);
      }

      // Check if formula is being used in feeding records
      const usageCount = await FeedingRecord.count({
        where: { formula_id: id }
      });

      if (usageCount > 0) {
        throw new AppError('该配方已被使用，无法删除', 409);
      }

      await formula.destroy();

      logger.info(`Feed formula deleted: ${id}`, {
        userId: req.user?.id,
        formulaId: id,
        formulaName: formula.name
      });

      res.json({
        success: true,
        message: '饲料配方删除成功'
      });
    } catch (error) {
      logger.error('Error deleting feed formula:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('删除饲料配方失败', 500);
    }
  }

  // Feeding Record CRUD operations

  /**
   * Create a new feeding record
   */
  static async createFeedingRecord(req: Request, res: Response) {
    try {
      const { formula_id, base_id, barn_id, amount, feeding_date } = req.body;
      const operator_id = req.user?.id;

      // Validate formula exists if provided
      if (formula_id) {
        const formula = await FeedFormula.findByPk(formula_id);
        if (!formula) {
          throw new AppError('指定的饲料配方不存在', 404);
        }
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以在任何基地创建饲喂记录
      } else if (dataPermission.baseId && dataPermission.baseId !== Number(base_id)) {
        throw new AppError('权限不足，只能在所属基地创建饲喂记录', 403);
      } else if (!dataPermission.baseId) {
        throw new AppError('没有基地权限，无法创建饲喂记录', 403);
      }

      // Validate base exists
      const base = await Base.findByPk(base_id);
      if (!base) {
        throw new AppError('指定的基地不存在', 404);
      }

      // Validate barn exists if provided
      if (barn_id) {
        const barn = await Barn.findByPk(barn_id);
        if (!barn || barn.base_id !== base_id) {
          throw new AppError('指定的牛棚不存在或不属于该基地', 404);
        }
      }

      const record = await FeedingRecord.create({
        formula_id,
        base_id,
        barn_id,
        amount,
        feeding_date,
        operator_id
      });

      // Fetch the created record with related data
      const createdRecord = await FeedingRecord.findByPk(record.id, {
        include: [
          {
            model: FeedFormula,
            as: 'formula',
            attributes: ['id', 'name', 'cost_per_kg']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      logger.info(`Feeding record created: ${record.id}`, {
        userId: req.user?.id,
        recordId: record.id,
        baseId: base_id,
        amount
      });

      res.status(201).json({
        success: true,
        data: createdRecord,
        message: '饲喂记录创建成功'
      });
    } catch (error) {
      logger.error('Error creating feeding record:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('创建饲喂记录失败', 500);
    }
  }

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
        // 超级管理员：如果指定了base_id参数，则按base_id过滤，否则显示所有饲喂记录
        if (base_id) {
          whereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的饲喂记录
        whereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不显示任何饲喂记录
        whereClause.base_id = -1;
      }

      // Add other filters
      if (barn_id) whereClause.barn_id = barn_id;
      if (formula_id) whereClause.formula_id = formula_id;
      if (operator_id) whereClause.operator_id = operator_id;

      // Add date range filter
      if (start_date || end_date) {
        whereClause.feeding_date = {};
        if (start_date) whereClause.feeding_date[Op.gte] = start_date;
        if (end_date) whereClause.feeding_date[Op.lte] = end_date;
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
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        order: [['feeding_date', 'DESC'], ['created_at', 'DESC']],
        limit: Number(limit),
        offset
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
      logger.error('Error fetching feeding records:', error);
      throw new AppError('获取饲喂记录列表失败', 500);
    }
  }

  /**
   * Get feeding statistics
   */
  static async getFeedingStatistics(req: Request, res: Response) {
    try {
      const { base_id, start_date, end_date, barn_id, formula_id } = req.query;

      // 参数验证和日志
      console.log('饲喂统计API接收参数:', { base_id, start_date, end_date, barn_id, formula_id });

      // 验证必需参数
      if (!base_id) {
        throw new AppError('base_id 参数是必需的', 400);
      }
      if (!start_date || !end_date) {
        throw new AppError('start_date 和 end_date 参数是必需的', 400);
      }

      // 转换参数类型
      const baseIdNum = Number(base_id);
      if (isNaN(baseIdNum)) {
        throw new AppError('base_id 必须是有效的数字', 400);
      }

      // 验证日期格式
      const startDateObj = new Date(start_date as string);
      const endDateObj = new Date(end_date as string);
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new AppError('日期格式无效', 400);
      }

      console.log('参数验证通过:', { baseIdNum, startDateObj, endDateObj });

      const whereClause: any = {
        base_id: baseIdNum,
        feeding_date: {
          [Op.between]: [startDateObj, endDateObj]
        }
      };

      if (barn_id) whereClause.barn_id = barn_id;
      if (formula_id) whereClause.formula_id = formula_id;

      console.log('查询条件:', JSON.stringify(whereClause, null, 2));

      // 先测试是否有任何记录
      const totalRecordsCount = await FeedingRecord.count({
        where: { base_id: baseIdNum }
      });
      console.log(`基地 ${baseIdNum} 总共有 ${totalRecordsCount} 条饲喂记录`);

      // 测试日期范围内的记录
      const dateRangeCount = await FeedingRecord.count({
        where: whereClause
      });
      console.log(`日期范围内有 ${dateRangeCount} 条记录`);

      // Get basic statistics
      console.log('开始查询基础统计...');
      const basicStats = await FeedingRecord.findAll({
        where: whereClause,
        attributes: [
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'total_records'],
          [FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'total_amount'],
          [FeedingRecord.sequelize!.fn('AVG', FeedingRecord.sequelize!.col('amount')), 'avg_amount'],
          [FeedingRecord.sequelize!.fn('MIN', FeedingRecord.sequelize!.col('feeding_date')), 'first_date'],
          [FeedingRecord.sequelize!.fn('MAX', FeedingRecord.sequelize!.col('feeding_date')), 'last_date']
        ],
        raw: true
      });
      console.log('基础统计查询结果:', basicStats);

      // Get daily feeding trend
      const dailyTrend = await FeedingRecord.findAll({
        where: whereClause,
        attributes: [
          [FeedingRecord.sequelize!.fn('DATE', FeedingRecord.sequelize!.col('feeding_date')), 'date'],
          [FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'daily_amount'],
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'daily_records']
        ],
        group: [FeedingRecord.sequelize!.fn('DATE', FeedingRecord.sequelize!.col('feeding_date'))],
        order: [[FeedingRecord.sequelize!.fn('DATE', FeedingRecord.sequelize!.col('feeding_date')), 'ASC']],
        raw: true
      });

      // 简化统计查询，避免复杂的关联查询
      console.log('开始查询配方统计...');
      const formulaStats = await FeedingRecord.findAll({
        where: whereClause,
        attributes: [
          'formula_id',
          [FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'total_amount'],
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'usage_count']
        ],
        group: ['formula_id'],
        order: [[FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'DESC']],
        raw: true
      });
      console.log('配方统计查询完成:', formulaStats.length, '条记录');

      // 简化牛棚统计查询
      console.log('开始查询牛棚统计...');
      let barnStats: any[] = [];
      if (!barn_id) {
        barnStats = await FeedingRecord.findAll({
          where: whereClause,
          attributes: [
            'barn_id',
            [FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'total_amount'],
            [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'feeding_count']
          ],
          group: ['barn_id'],
          order: [[FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'DESC']],
          raw: true
        });
      }
      console.log('牛棚统计查询完成:', barnStats.length, '条记录');

      // 暂时简化效率计算，避免复杂的异步操作
      console.log('开始计算饲喂效率...');
      let efficiency;
      try {
        efficiency = await FeedingRecord.getFeedingEfficiency(
          Number(base_id),
          new Date(start_date as string),
          new Date(end_date as string)
        );
        console.log('饲喂效率计算完成:', efficiency);
      } catch (error) {
        console.error('饲喂效率计算失败:', error);
        // 如果效率计算失败，使用默认值
        efficiency = {
          totalAmount: 0,
          totalCost: 0,
          averageCostPerKg: 0,
          recordCount: 0
        };
      }

      console.log('准备返回统计数据...');
      
      // 处理统计数据，确保前端能正确解析
      const responseData = {
        basic_stats: basicStats[0] || {
          total_records: 0,
          total_amount: 0,
          avg_amount: 0,
          first_date: null,
          last_date: null
        },
        daily_trend: dailyTrend || [],
        formula_stats: formulaStats || [],
        barn_stats: barnStats || [],
        efficiency: efficiency || {
          totalAmount: 0,
          totalCost: 0,
          averageCostPerKg: 0,
          recordCount: 0
        },
        // 添加前端期望的字段格式
        totalAmount: efficiency?.totalAmount || 0,
        totalCost: efficiency?.totalCost || 0,
        avgDailyCost: efficiency?.averageCostPerKg || 0,
        formulaUsage: formulaStats.map((stat: any) => ({
          formulaName: stat.formula?.name || `配方${stat.formula_id}`,
          amount: parseFloat(stat.total_amount || 0),
          cost: parseFloat(stat.total_amount || 0) * 5.0, // 估算成本
          percentage: 0 // 可以后续计算
        })) || [],
        trend: dailyTrend.map((trend: any) => ({
          date: trend.date,
          amount: parseFloat(trend.daily_amount || 0),
          cost: parseFloat(trend.daily_amount || 0) * 5.0 // 估算成本
        })) || []
      };
      
      console.log('最终返回的统计数据:', JSON.stringify(responseData, null, 2));
      
      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      logger.error('Error fetching feeding statistics:', error);
      throw new AppError('获取饲喂统计数据失败', 500);
    }
  }

  /**
   * Batch create feeding records
   */
  static async batchCreateFeedingRecords(req: Request, res: Response) {
    try {
      const { records } = req.body;
      const operator_id = req.user?.id;

      // Add operator_id to all records
      const recordsWithOperator = records.map((record: any) => ({
        ...record,
        operator_id
      }));

      // Validate all formulas and bases exist
      const formulaIds = [...new Set(recordsWithOperator.map((r: any) => r.formula_id).filter(Boolean))];
      const baseIds = [...new Set(recordsWithOperator.map((r: any) => r.base_id))];
      const barnIds = [...new Set(recordsWithOperator.map((r: any) => r.barn_id).filter(Boolean))];

      if (formulaIds.length > 0) {
        const formulas = await FeedFormula.findAll({
          where: { id: { [Op.in]: formulaIds as number[] } },
          attributes: ['id']
        });
        if (formulas.length !== formulaIds.length) {
          throw new AppError('部分饲料配方不存在', 404);
        }
      }

      const bases = await Base.findAll({
        where: { id: { [Op.in]: baseIds as number[] } },
        attributes: ['id']
      });
      if (bases.length !== baseIds.length) {
        throw new AppError('部分基地不存在', 404);
      }

      if (barnIds.length > 0) {
        const barns = await Barn.findAll({
          where: { id: { [Op.in]: barnIds as number[] } },
          attributes: ['id', 'base_id']
        });
        if (barns.length !== barnIds.length) {
          throw new AppError('部分牛棚不存在', 404);
        }
      }

      // Create records in batch
      const createdRecords = await FeedingRecord.bulkCreate(recordsWithOperator, {
        validate: true,
        returning: true
      });

      logger.info(`Batch feeding records created: ${createdRecords.length}`, {
        userId: req.user?.id,
        recordCount: createdRecords.length
      });

      res.status(201).json({
        success: true,
        data: {
          created_count: createdRecords.length,
          records: createdRecords
        },
        message: `成功创建 ${createdRecords.length} 条饲喂记录`
      });
    } catch (error) {
      logger.error('Error batch creating feeding records:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('批量创建饲喂记录失败', 500);
    }
  }

  /**
   * Get a single feeding record by ID
   */
  static async getFeedingRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const record = await FeedingRecord.findByPk(id, {
        include: [
          {
            model: FeedFormula,
            as: 'formula',
            attributes: ['id', 'name', 'cost_per_kg', 'ingredients']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      if (!record) {
        throw new AppError('饲喂记录不存在', 404);
      }

      // Calculate feeding cost
      const feedingCost = await record.calculateFeedingCost();

      res.json({
        success: true,
        data: {
          record,
          feeding_cost: feedingCost
        }
      });
    } catch (error) {
      logger.error('Error fetching feeding record:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取饲喂记录详情失败', 500);
    }
  }

  /**
   * Update a feeding record
   */
  static async updateFeedingRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { formula_id, base_id, barn_id, amount, feeding_date } = req.body;

      const record = await FeedingRecord.findByPk(id);
      if (!record) {
        throw new AppError('饲喂记录不存在', 404);
      }

      // Validate formula exists if provided
      if (formula_id && formula_id !== record.formula_id) {
        const formula = await FeedFormula.findByPk(formula_id);
        if (!formula) {
          throw new AppError('指定的饲料配方不存在', 404);
        }
      }

      // Validate base exists if provided
      if (base_id && base_id !== record.base_id) {
        const base = await Base.findByPk(base_id);
        if (!base) {
          throw new AppError('指定的基地不存在', 404);
        }
      }

      // Validate barn exists if provided
      if (barn_id && barn_id !== record.barn_id) {
        const barn = await Barn.findByPk(barn_id);
        if (!barn || (base_id && barn.base_id !== base_id)) {
          throw new AppError('指定的牛棚不存在或不属于该基地', 404);
        }
      }

      await record.update({
        formula_id: formula_id !== undefined ? formula_id : record.formula_id,
        base_id: base_id || record.base_id,
        barn_id: barn_id !== undefined ? barn_id : record.barn_id,
        amount: amount !== undefined ? amount : record.amount,
        feeding_date: feeding_date || record.feeding_date
      });

      // Fetch updated record with related data
      const updatedRecord = await FeedingRecord.findByPk(id, {
        include: [
          {
            model: FeedFormula,
            as: 'formula',
            attributes: ['id', 'name', 'cost_per_kg']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      logger.info(`Feeding record updated: ${id}`, {
        userId: req.user?.id,
        recordId: id
      });

      res.json({
        success: true,
        data: updatedRecord,
        message: '饲喂记录更新成功'
      });
    } catch (error) {
      logger.error('Error updating feeding record:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新饲喂记录失败', 500);
    }
  }

  /**
   * Delete a feeding record
   */
  static async deleteFeedingRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const record = await FeedingRecord.findByPk(id);
      if (!record) {
        throw new AppError('饲喂记录不存在', 404);
      }

      await record.destroy();

      logger.info(`Feeding record deleted: ${id}`, {
        userId: req.user?.id,
        recordId: id
      });

      res.json({
        success: true,
        message: '饲喂记录删除成功'
      });
    } catch (error) {
      logger.error('Error deleting feeding record:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('删除饲喂记录失败', 500);
    }
  }

  /**
   * Get formula efficiency analysis
   */
  static async getFormulaEfficiency(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { start_date, end_date, base_id } = req.query;

      const formula = await FeedFormula.findByPk(id);
      if (!formula) {
        throw new AppError('饲料配方不存在', 404);
      }

      // Set default date range if not provided
      const endDate = end_date ? new Date(end_date as string) : new Date();
      const startDate = start_date ? new Date(start_date as string) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const whereClause: any = {
        formula_id: id,
        feeding_date: {
          [Op.between]: [startDate, endDate]
        }
      };

      if (base_id) {
        whereClause.base_id = base_id;
      }

      // Get usage statistics
      const usageStats = await FeedingRecord.findAll({
        where: whereClause,
        attributes: [
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'usage_count'],
          [FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'total_amount'],
          [FeedingRecord.sequelize!.fn('AVG', FeedingRecord.sequelize!.col('amount')), 'avg_amount'],
          [FeedingRecord.sequelize!.fn('MIN', FeedingRecord.sequelize!.col('feeding_date')), 'first_used'],
          [FeedingRecord.sequelize!.fn('MAX', FeedingRecord.sequelize!.col('feeding_date')), 'last_used']
        ],
        raw: true
      });

      // Get usage by base
      const usageByBase = await FeedingRecord.findAll({
        where: whereClause,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          }
        ],
        attributes: [
          'base_id',
          [FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'total_amount'],
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'usage_count'],
          [FeedingRecord.sequelize!.fn('AVG', FeedingRecord.sequelize!.col('amount')), 'avg_amount']
        ],
        group: ['base_id', 'base.id', 'base.name'],
        order: [[FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'DESC']]
      });

      // Get daily usage trend
      const dailyTrend = await FeedingRecord.findAll({
        where: whereClause,
        attributes: [
          [FeedingRecord.sequelize!.fn('DATE', FeedingRecord.sequelize!.col('feeding_date')), 'date'],
          [FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'daily_amount'],
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'daily_count']
        ],
        group: [FeedingRecord.sequelize!.fn('DATE', FeedingRecord.sequelize!.col('feeding_date'))],
        order: [[FeedingRecord.sequelize!.fn('DATE', FeedingRecord.sequelize!.col('feeding_date')), 'ASC']],
        raw: true
      });

      // Calculate efficiency metrics
      const totalAmount = parseFloat((usageStats[0] as any)?.total_amount || '0');
      const totalCost = totalAmount * (formula.cost_per_kg || 0);
      const usageCount = parseInt((usageStats[0] as any)?.usage_count || '0');

      res.json({
        success: true,
        data: {
          formula: {
            id: formula.id,
            name: formula.name,
            cost_per_kg: formula.cost_per_kg,
            ingredients: formula.ingredients
          },
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0]
          },
          usage_stats: usageStats[0] || {},
          usage_by_base: usageByBase,
          daily_trend: dailyTrend,
          efficiency_metrics: {
            total_amount: totalAmount,
            total_cost: Math.round(totalCost * 100) / 100,
            usage_frequency: usageCount,
            avg_cost_per_feeding: usageCount > 0 ? Math.round((totalCost / usageCount) * 100) / 100 : 0,
            cost_efficiency_rating: totalAmount > 0 ? Math.round((totalAmount / totalCost) * 100) / 100 : 0
          }
        }
      });
    } catch (error) {
      logger.error('Error getting formula efficiency:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取配方效率分析失败', 500);
    }
  }

  /**
   * Generate feeding plan based on historical data and cattle count
   */
  static async generateFeedingPlan(req: Request, res: Response) {
    try {
      const { base_id, barn_id, days = 7, formula_id } = req.body;

      if (!base_id) {
        throw new AppError('基地ID不能为空', 400);
      }

      // Get cattle count
      const { Cattle } = await import('@/models');
      const whereClause: any = { base_id };
      if (barn_id) whereClause.barn_id = barn_id;

      const cattleCount = await Cattle.count({
        where: whereClause
      });

      if (cattleCount === 0) {
        return res.json({
          success: true,
          data: {
            plan: [],
            message: '该区域暂无牛只，无需制定饲喂计划'
          }
        });
      }

      // Get historical feeding data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const historicalData = await FeedingRecord.findAll({
        where: {
          base_id,
          ...(barn_id && { barn_id }),
          ...(formula_id && { formula_id }),
          feeding_date: {
            [Op.gte]: thirtyDaysAgo
          }
        },
        include: [
          {
            model: FeedFormula,
            as: 'formula',
            attributes: ['id', 'name', 'cost_per_kg']
          }
        ],
        attributes: [
          'formula_id',
          [FeedingRecord.sequelize!.fn('AVG', FeedingRecord.sequelize!.col('amount')), 'avg_amount'],
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('formula_id')), 'frequency']
        ],
        group: ['formula_id', 'formula.id', 'formula.name', 'formula.cost_per_kg'],
        order: [[FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('formula_id')), 'DESC']]
      });

      // Generate feeding plan for the specified number of days
      const plan = [];
      const startDate = new Date();
      
      for (let i = 0; i < days; i++) {
        const planDate = new Date(startDate);
        planDate.setDate(startDate.getDate() + i);
        
        const dayPlan = historicalData.map((data: any) => {
          const avgAmount = parseFloat(data.dataValues.avg_amount) || 0;
          const recommendedAmount = Math.ceil((avgAmount * cattleCount) / 10) * 10; // Round to nearest 10kg
          const estimatedCost = recommendedAmount * (data.formula?.cost_per_kg || 0);
          
          return {
            date: planDate.toISOString().split('T')[0],
            formula: data.formula,
            recommended_amount: recommendedAmount,
            estimated_cost: Math.round(estimatedCost * 100) / 100,
            cattle_count: cattleCount,
            feeding_times: Math.ceil(data.dataValues.frequency / 30) || 1 // Average per day
          };
        });
        
        plan.push({
          date: planDate.toISOString().split('T')[0],
          day_of_week: planDate.toLocaleDateString('zh-CN', { weekday: 'long' }),
          feedings: dayPlan
        });
      }

      // Calculate plan summary
      const totalCost = plan.reduce((sum, day) => 
        sum + day.feedings.reduce((daySum: number, feeding: any) => daySum + feeding.estimated_cost, 0), 0
      );
      
      const totalAmount = plan.reduce((sum, day) => 
        sum + day.feedings.reduce((daySum: number, feeding: any) => daySum + feeding.recommended_amount, 0), 0
      );

      return res.json({
        success: true,
        data: {
          plan,
          summary: {
            total_days: days,
            cattle_count: cattleCount,
            total_amount: totalAmount,
            total_cost: Math.round(totalCost * 100) / 100,
            avg_daily_cost: Math.round((totalCost / days) * 100) / 100,
            avg_daily_amount: Math.round((totalAmount / days) * 100) / 100
          },
          generated_at: new Date().toISOString()
        },
        message: `成功生成${days}天饲喂计划`
      });
    } catch (error) {
      logger.error('Error generating feeding plan:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          error: {
            code: 'FEEDING_PLAN_ERROR',
            message: error.message
          }
        });
      }
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEEDING_PLAN_ERROR',
          message: '生成饲喂计划失败'
        }
      });
    }
  }

  /**
   * Get feeding recommendations based on cattle count and formula efficiency
   */
  static async getFeedingRecommendations(req: Request, res: Response) {
    try {
      const { base_id, barn_id } = req.query;

      if (!base_id) {
        throw new AppError('基地ID不能为空', 400);
      }

      // Get cattle count
      const { Cattle } = await import('@/models');
      const whereClause: any = { base_id: Number(base_id) };
      if (barn_id) whereClause.barn_id = Number(barn_id);

      const cattleCount = await Cattle.count({
        where: whereClause
      });

      if (cattleCount === 0) {
        return res.json({
          success: true,
          data: {
            recommendations: [],
            message: '该区域暂无牛只，无需饲喂'
          }
        });
      }

      // Get top performing formulas based on recent usage
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const topFormulas = await FeedingRecord.findAll({
        where: {
          base_id: Number(base_id),
          ...(barn_id && { barn_id: Number(barn_id) }),
          feeding_date: {
            [Op.gte]: thirtyDaysAgo
          }
        },
        include: [
          {
            model: FeedFormula,
            as: 'formula',
            attributes: ['id', 'name', 'cost_per_kg', 'ingredients']
          }
        ],
        attributes: [
          'formula_id',
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'usage_count'],
          [FeedingRecord.sequelize!.fn('AVG', FeedingRecord.sequelize!.col('amount')), 'avg_amount']
        ],
        group: ['formula_id', 'formula.id', 'formula.name', 'formula.cost_per_kg', 'formula.ingredients'],
        order: [[FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.col('id')), 'DESC']],
        limit: 5
      });

      // Calculate recommendations
      const recommendations = topFormulas.map((record: any) => {
        const avgAmountPerFeeding = parseFloat(record.dataValues.avg_amount) || 0;
        const recommendedAmount = Math.ceil(cattleCount * (avgAmountPerFeeding / 10)) * 10; // Round to nearest 10kg
        const estimatedCost = recommendedAmount * (record.formula?.cost_per_kg || 0);

        return {
          formula: record.formula,
          usage_count: parseInt(record.dataValues.usage_count),
          recommended_amount: recommendedAmount,
          estimated_cost: Math.round(estimatedCost * 100) / 100,
          cattle_count: cattleCount,
          reason: `基于最近30天的使用频率和平均用量推荐`
        };
      });

      return res.json({
        success: true,
        data: {
          cattle_count: cattleCount,
          recommendations,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error generating feeding recommendations:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode || 500).json({
          success: false,
          error: {
            code: 'FEEDING_RECOMMENDATIONS_ERROR',
            message: error.message
          }
        });
      }
      return res.status(500).json({
        success: false,
        error: {
          code: 'FEEDING_RECOMMENDATIONS_ERROR',
          message: '获取饲喂建议失败'
        }
      });
    }
  }
  /**
   * Get feeding efficiency analysis
   */
  static async getFeedingEfficiency(req: Request, res: Response) {
    try {
      const { base_id, start_date, end_date } = req.query;

      console.log('饲喂效率分析API接收参数:', { base_id, start_date, end_date });

      // 验证必需参数
      if (!base_id) {
        throw new AppError('base_id 参数是必需的', 400);
      }
      if (!start_date || !end_date) {
        throw new AppError('start_date 和 end_date 参数是必需的', 400);
      }

      // 转换参数类型
      const baseIdNum = Number(base_id);
      if (isNaN(baseIdNum)) {
        throw new AppError('base_id 必须是有效的数字', 400);
      }

      // 验证日期格式
      const startDateObj = new Date(start_date as string);
      const endDateObj = new Date(end_date as string);
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new AppError('日期格式无效', 400);
      }

      console.log('开始计算饲喂效率...');

      // 使用模型的静态方法计算效率
      const efficiency = await FeedingRecord.getFeedingEfficiency(
        baseIdNum,
        startDateObj,
        endDateObj
      );

      console.log('饲喂效率计算完成:', efficiency);

      res.json({
        success: true,
        data: efficiency
      });
    } catch (error) {
      logger.error('Error fetching feeding efficiency:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取饲喂效率分析失败', 500);
    }
  }

  /**
   * Get feeding trend data
   */
  static async getFeedingTrend(req: Request, res: Response) {
    try {
      const { base_id, start_date, end_date, period = '30d' } = req.query;

      console.log('饲喂趋势数据API接收参数:', { base_id, start_date, end_date, period });

      // 验证必需参数
      if (!base_id) {
        throw new AppError('base_id 参数是必需的', 400);
      }
      if (!start_date || !end_date) {
        throw new AppError('start_date 和 end_date 参数是必需的', 400);
      }

      // 转换参数类型
      const baseIdNum = Number(base_id);
      if (isNaN(baseIdNum)) {
        throw new AppError('base_id 必须是有效的数字', 400);
      }

      // 验证日期格式
      const startDateObj = new Date(start_date as string);
      const endDateObj = new Date(end_date as string);
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new AppError('日期格式无效', 400);
      }

      const whereClause: any = {
        base_id: baseIdNum,
        feeding_date: {
          [Op.between]: [startDateObj, endDateObj]
        }
      };

      console.log('查询趋势数据条件:', JSON.stringify(whereClause, null, 2));

      // 获取每日趋势数据
      const dailyTrend = await FeedingRecord.findAll({
        where: whereClause,
        include: [
          {
            model: FeedFormula,
            as: 'formula',
            attributes: ['cost_per_kg']
          }
        ],
        attributes: [
          [FeedingRecord.sequelize!.fn('DATE', FeedingRecord.sequelize!.col('feeding_date')), 'date'],
          [FeedingRecord.sequelize!.fn('SUM', FeedingRecord.sequelize!.col('amount')), 'total_amount'],
          [FeedingRecord.sequelize!.fn('COUNT', FeedingRecord.sequelize!.literal('DISTINCT "FeedingRecord"."id"')), 'record_count'],
          [FeedingRecord.sequelize!.fn('AVG', FeedingRecord.sequelize!.col('formula.cost_per_kg')), 'avg_cost']
        ],
        group: [FeedingRecord.sequelize!.fn('DATE', FeedingRecord.sequelize!.col('feeding_date'))],
        order: [[FeedingRecord.sequelize!.fn('DATE', FeedingRecord.sequelize!.col('feeding_date')), 'ASC']],
        raw: true
      });

      console.log('趋势数据查询完成:', dailyTrend.length, '条记录');

      // 处理数据格式
      const trendData = dailyTrend.map((item: any) => ({
        date: item.date,
        total_amount: parseFloat(item.total_amount || 0),
        record_count: parseInt(item.record_count || 0),
        avg_cost: parseFloat(item.avg_cost || 0)
      }));

      res.json({
        success: true,
        data: trendData
      });
    } catch (error) {
      logger.error('Error fetching feeding trend:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取饲喂趋势数据失败', 500);
    }
  }


}

export default FeedingController;