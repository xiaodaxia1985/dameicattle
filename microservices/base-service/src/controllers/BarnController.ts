import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Barn, Base } from '../models';
import { logger } from '../utils/logger';

export class BarnController {
  /**
   * 获取牛舍列表
   */
  public async getBarns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        base_id,
        status,
        sort = 'created_at',
        order = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 搜索过滤
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // 基地过滤
      if (base_id) {
        whereClause.base_id = base_id;
      }

      // 状态过滤
      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await Barn.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'address']
          }
        ],
        limit: Number(limit),
        offset,
        order: [[sort as string, order as string]]
      });

      (res as any).success({
        barns: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取牛舍列表成功');
    } catch (error) {
      logger.error('获取牛舍列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取牛舍详情
   */
  public async getBarnById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const barn = await Barn.findByPk(id, {
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'address', 'manager_name', 'manager_phone']
          }
        ]
      });

      if (!barn) {
        return (res as any).error('牛舍不存在', 404, 'BARN_NOT_FOUND');
      }

      (res as any).success(barn, '获取牛舍详情成功');
    } catch (error) {
      logger.error('获取牛舍详情失败:', error);
      next(error);
    }
  }

  /**
   * 创建牛舍
   */
  public async createBarn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        base_id,
        capacity,
        area,
        barn_type,
        equipment,
        description
      } = req.body;

      // 检查基地是否存在
      const base = await Base.findByPk(base_id);
      if (!base) {
        return (res as any).error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      // 检查牛舍名称在该基地下是否已存在
      const existingBarn = await Barn.findOne({
        where: {
          name,
          base_id
        }
      });

      if (existingBarn) {
        return (res as any).error('该基地下牛舍名称已存在', 409, 'BARN_NAME_EXISTS');
      }

      const barn = await Barn.create({
        name,
        code: name.replace(/\s+/g, '_').toUpperCase(),
        base_id,
        capacity,
        barn_type,
        description,
        current_count: 0
      });

      (res as any).success(barn, '创建牛舍成功', 201);
    } catch (error) {
      logger.error('创建牛舍失败:', error);
      next(error);
    }
  }

  /**
   * 更新牛舍
   */
  public async updateBarn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const barn = await Barn.findByPk(id);
      if (!barn) {
        return (res as any).error('牛舍不存在', 404, 'BARN_NOT_FOUND');
      }

      // 如果更新名称，检查是否重复
      if (updateData.name && updateData.name !== barn.name) {
        const existingBarn = await Barn.findOne({
          where: {
            name: updateData.name,
            base_id: barn.base_id,
            id: { [Op.ne]: id }
          }
        });

        if (existingBarn) {
          return (res as any).error('该基地下牛舍名称已存在', 409, 'BARN_NAME_EXISTS');
        }
      }

      await barn.update(updateData);

      (res as any).success(barn, '更新牛舍成功');
    } catch (error) {
      logger.error('更新牛舍失败:', error);
      next(error);
    }
  }

  /**
   * 删除牛舍
   */
  public async deleteBarn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const barn = await Barn.findByPk(id);
      if (!barn) {
        return (res as any).error('牛舍不存在', 404, 'BARN_NOT_FOUND');
      }

      // 检查牛舍是否有牛只
      if (barn.current_count && barn.current_count > 0) {
        return (res as any).error('牛舍内有牛只，无法删除', 400, 'BARN_HAS_CATTLE');
      }

      await barn.destroy();

      (res as any).success(null, '删除牛舍成功');
    } catch (error) {
      logger.error('删除牛舍失败:', error);
      next(error);
    }
  }

  /**
   * 获取牛舍容量信息
   */
  public async getBarnCapacity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const barn = await Barn.findByPk(id);
      if (!barn) {
        return (res as any).error('牛舍不存在', 404, 'BARN_NOT_FOUND');
      }

      const capacity = barn.capacity || 0;
      const currentCount = barn.current_count || 0;
      const availableCapacity = capacity - currentCount;
      const utilizationRate = capacity > 0 ? (currentCount / capacity) * 100 : 0;

      const capacityInfo = {
        barn_id: barn.id,
        barn_name: barn.name,
        capacity,
        current_count: currentCount,
        available_capacity: availableCapacity,
        utilization_rate: Math.round(utilizationRate * 100) / 100,
        status: 'active'
      };

      (res as any).success(capacityInfo, '获取牛舍容量信息成功');
    } catch (error) {
      logger.error('获取牛舍容量信息失败:', error);
      next(error);
    }
  }

  /**
   * 更新牛舍状态
   */
  public async updateBarnStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const barn = await Barn.findByPk(id);
      if (!barn) {
        return (res as any).error('牛舍不存在', 404, 'BARN_NOT_FOUND');
      }

      await barn.update({ name: barn.name });

      (res as any).success(barn, '更新牛舍状态成功');
    } catch (error) {
      logger.error('更新牛舍状态失败:', error);
      next(error);
    }
  }

  /**
   * 批量创建牛舍
   */
  public async batchCreateBarns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { barns } = req.body;

      if (!Array.isArray(barns) || barns.length === 0) {
        return (res as any).error('牛舍数据不能为空', 400, 'INVALID_BARNS_DATA');
      }

      // 验证所有基地是否存在
      const baseIds = [...new Set(barns.map(barn => barn.base_id))];
      const existingBases = await Base.findAll({
        where: { id: { [Op.in]: baseIds } }
      });

      if (existingBases.length !== baseIds.length) {
        return (res as any).error('部分基地不存在', 400, 'SOME_BASES_NOT_FOUND');
      }

      const createdBarns = await Barn.bulkCreate(
        barns.map(barn => ({
          ...barn,
          code: barn.name.replace(/\s+/g, '_').toUpperCase(),
          current_count: 0
        }))
      );

      (res as any).success(createdBarns, '批量创建牛舍成功', 201);
    } catch (error) {
      logger.error('批量创建牛舍失败:', error);
      next(error);
    }
  }

  /**
   * 批量更新牛舍
   */
  public async batchUpdateBarns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        return (res as any).error('更新数据不能为空', 400, 'INVALID_UPDATES_DATA');
      }

      const results = [];
      for (const update of updates) {
        const { id, ...updateData } = update;
        const barn = await Barn.findByPk(id);
        
        if (barn) {
          await barn.update(updateData);
          results.push(barn);
        }
      }

      (res as any).success(results, '批量更新牛舍成功');
    } catch (error) {
      logger.error('批量更新牛舍失败:', error);
      next(error);
    }
  }

  /**
   * 获取单个牛舍详情 (alias for getBarnById)
   */
  public async getBarn(req: Request, res: Response, next: NextFunction): Promise<void> {
    return this.getBarnById(req, res, next);
  }

  /**
   * 获取牛舍统计信息
   */
  public async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { base_id } = req.query;
      const whereClause: any = {};

      if (base_id) {
        whereClause.base_id = base_id;
      }

      const barns = await Barn.findAll({
        where: whereClause,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          }
        ]
      });

      // 计算统计数据
      const totalBarns = barns.length;
      const totalCapacity = barns.reduce((sum, barn) => sum + (barn.capacity || 0), 0);
      const totalCurrentCount = barns.reduce((sum, barn) => sum + (barn.current_count || 0), 0);
      const totalAvailableCapacity = totalCapacity - totalCurrentCount;
      const averageUtilization = totalCapacity > 0 ? (totalCurrentCount / totalCapacity) * 100 : 0;

      // 按类型统计
      const typeStatistics = barns.reduce((acc, barn) => {
        const type = barn.barn_type || '未分类';
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            capacity: 0,
            current_count: 0,
            utilization: 0
          };
        }
        acc[type].count += 1;
        acc[type].capacity += barn.capacity || 0;
        acc[type].current_count += barn.current_count || 0;
        return acc;
      }, {} as Record<string, any>);

      // 计算每种类型的利用率
      Object.keys(typeStatistics).forEach(type => {
        const stats = typeStatistics[type];
        stats.utilization = stats.capacity > 0 ? (stats.current_count / stats.capacity) * 100 : 0;
      });

      // 利用率分布
      const utilizationDistribution = {
        low: 0,    // < 50%
        medium: 0, // 50-80%
        high: 0    // > 80%
      };

      barns.forEach(barn => {
        const utilization = barn.capacity > 0 ? (barn.current_count / barn.capacity) * 100 : 0;
        if (utilization < 50) {
          utilizationDistribution.low += 1;
        } else if (utilization <= 80) {
          utilizationDistribution.medium += 1;
        } else {
          utilizationDistribution.high += 1;
        }
      });

      const statistics = {
        overview: {
          totalBarns,
          totalCapacity,
          totalCurrentCount,
          totalAvailableCapacity,
          averageUtilization: Math.round(averageUtilization * 100) / 100
        },
        typeStatistics,
        utilizationDistribution,
        barns: barns.map(barn => ({
          id: barn.id,
          name: barn.name,
          code: barn.code,
          capacity: barn.capacity,
          current_count: barn.current_count,
          utilization_rate: barn.capacity > 0 ? Math.round((barn.current_count / barn.capacity) * 10000) / 100 : 0,
          barn_type: barn.barn_type,
          base: barn.base
        }))
      };

      (res as any).success(statistics, '获取牛舍统计信息成功');
    } catch (error) {
      logger.error('获取牛舍统计信息失败:', error);
      next(error);
    }
  }

  /**
   * 获取牛舍选项（用于下拉选择）
   */
  public async getBarnOptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { base_id } = req.query;
      const whereClause: any = {};

      if (base_id) {
        whereClause.base_id = base_id;
      }

      const barns = await Barn.findAll({
        where: whereClause,
        attributes: ['id', 'name', 'code', 'capacity', 'current_count', 'barn_type'],
        order: [['name', 'ASC']]
      });

      const options = barns.map(barn => {
        const availableCapacity = (barn.capacity || 0) - (barn.current_count || 0);
        return {
          value: barn.id,
          label: `${barn.name} (${barn.code})`,
          capacity: barn.capacity || 0,
          current_count: barn.current_count || 0,
          available_capacity: availableCapacity,
          barn_type: barn.barn_type || '未分类',
          disabled: availableCapacity <= 0
        };
      });

      (res as any).success(options, '获取牛舍选项成功');
    } catch (error) {
      logger.error('获取牛舍选项失败:', error);
      next(error);
    }
  }
}