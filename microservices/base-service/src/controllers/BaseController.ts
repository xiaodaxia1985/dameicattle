import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Base, Barn } from '../models';
import { logger } from '../utils/logger';

export class BaseController {
  /**
   * 获取基地列表
   */
  public async getBases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        region,
        sort = 'created_at',
        order = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 搜索过滤
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // 状态过滤
      if (status) {
        whereClause.status = status;
      }

      // 地区过滤
      if (region) {
        whereClause.region = region;
      }

      const { count, rows } = await Base.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Barn,
            as: 'barns',
            attributes: ['id', 'name', 'capacity', 'current_count']
          }
        ],
        limit: Number(limit),
        offset,
        order: [[sort as string, order as string]]
      });

      (res as any).success({
        bases: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取基地列表成功');
    } catch (error) {
      logger.error('获取基地列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取基地详情
   */
  public async getBaseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const base = await Base.findByPk(id, {
        include: [
          {
            model: Barn,
            as: 'barns',
            attributes: ['id', 'name', 'capacity', 'current_count', 'status']
          }
        ]
      });

      if (!base) {
        return (res as any).error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      (res as any).success(base, '获取基地详情成功');
    } catch (error) {
      logger.error('获取基地详情失败:', error);
      next(error);
    }
  }

  /**
   * 创建基地
   */
  public async createBase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        address,
        area
      } = req.body;

      // 检查基地名称是否已存在
      const existingBase = await Base.findOne({
        where: { name }
      });

      if (existingBase) {
        return (res as any).error('基地名称已存在', 409, 'BASE_NAME_EXISTS');
      }

      const base = await Base.create({
        name: name,
        code: name.replace(/\s+/g, '_').toUpperCase(),
        address,
        area
      });

      (res as any).success(base, '创建基地成功', 201);
    } catch (error) {
      logger.error('创建基地失败:', error);
      next(error);
    }
  }

  /**
   * 更新基地
   */
  public async updateBase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const base = await Base.findByPk(id);
      if (!base) {
        return (res as any).error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      // 如果更新名称，检查是否重复
      if (updateData.name && updateData.name !== base.name) {
        const existingBase = await Base.findOne({
          where: {
            name: updateData.name,
            id: { [Op.ne]: id }
          }
        });

        if (existingBase) {
          return (res as any).error('基地名称已存在', 409, 'BASE_NAME_EXISTS');
        }
      }

      await base.update(updateData);

      (res as any).success(base, '更新基地成功');
    } catch (error) {
      logger.error('更新基地失败:', error);
      next(error);
    }
  }

  /**
   * 删除基地
   */
  public async deleteBase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const base = await Base.findByPk(id);
      if (!base) {
        return (res as any).error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      // 检查是否有关联的牛舍
      const barnCount = await Barn.count({
        where: { base_id: id }
      });

      if (barnCount > 0) {
        return (res as any).error('该基地下有牛舍，无法删除', 400, 'BASE_HAS_BARNS');
      }

      await base.destroy();

      (res as any).success(null, '删除基地成功');
    } catch (error) {
      logger.error('删除基地失败:', error);
      next(error);
    }
  }

  /**
   * 获取基地统计信息
   */
  public async getBaseStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const base = await Base.findByPk(id, {
        include: [
          {
            model: Barn,
            as: 'barns'
          }
        ]
      });

      if (!base) {
        return (res as any).error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      const barns = (base as any).barns || [];
      const totalBarns = barns.length;
      const totalCapacity = barns.reduce((sum: number, barn: any) => sum + (barn.capacity || 0), 0);
      const currentCount = barns.reduce((sum: number, barn: any) => sum + (barn.current_count || 0), 0);
      const utilizationRate = totalCapacity > 0 ? (currentCount / totalCapacity) * 100 : 0;

      const statistics = {
        base_info: {
          id: base.id,
          name: base.name,
          area: base.area,
          capacity: base.area
        },
        barn_statistics: {
          total_barns: totalBarns,
          total_capacity: totalCapacity,
          current_count: currentCount,
          utilization_rate: Math.round(utilizationRate * 100) / 100,
          available_capacity: totalCapacity - currentCount
        }
      };

      (res as any).success(statistics, '获取基地统计信息成功');
    } catch (error) {
      logger.error('获取基地统计信息失败:', error);
      next(error);
    }
  }

  /**
   * 更新基地状态
   */
  public async updateBaseStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const base = await Base.findByPk(id);
      if (!base) {
        return (res as any).error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      await base.update({ name: base.name });

      (res as any).success(base, '更新基地状态成功');
    } catch (error) {
      logger.error('更新基地状态失败:', error);
      next(error);
    }
  }
}