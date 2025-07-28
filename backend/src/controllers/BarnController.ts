import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Barn, Base, User } from '@/models';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class BarnController {
  /**
   * 获取牛棚列表
   */
  static async getBarns(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      console.log('=== BarnController.getBarns 调试信息 ===');
      console.log('用户信息:', {
        id: req.user?.id,
        username: req.user?.username,
        base_id: req.user?.base_id,
        role: req.user?.role
      });

      const {
        page = 1,
        limit = 20,
        base_id,
        barn_type,
        search,
      } = req.query;

      console.log('查询参数:', { page, limit, base_id, barn_type, search });

      const offset = (Number(page) - 1) * Number(limit);
      const whereConditions: WhereOptions = {};

      // 数据权限过滤
      console.log('用户角色:', req.user?.role?.name);
      
      // Admin用户可以查看所有牛棚，其他用户只能查看所属基地的牛棚
      if (req.user?.role?.name === '超级管理员') {
        // Admin用户：如果指定了base_id参数，则按base_id过滤，否则显示所有牛棚
        if (base_id) {
          whereConditions.base_id = Number(base_id);
          console.log('Admin用户，按查询参数base_id过滤:', base_id);
        } else {
          console.log('Admin用户，显示所有牛棚');
        }
      } else if (req.user?.base_id) {
        // 基地用户：只能查看所属基地的牛棚
        whereConditions.base_id = req.user.base_id;
        console.log('基地用户，按用户base_id过滤:', req.user.base_id);
      } else {
        // 没有基地权限的用户，不显示任何牛棚
        whereConditions.base_id = -1; // 使用一个不存在的ID
        console.log('无基地权限用户，不显示牛棚');
      }

      // 牛棚类型过滤
      if (barn_type) {
        whereConditions.barn_type = barn_type as string;
      }

      // 搜索过滤
      if (search) {
        (whereConditions as any)[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { rows: barns, count: total } = await Barn.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: Number(limit),
        offset,
      });

      res.json({
        success: true,
        data: {
          barns,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error('获取牛棚列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BARN_LIST_ERROR',
          message: '获取牛棚列表失败',
        },
      });
    }
  }

  /**
   * 获取牛棚详情
   */
  static async getBarn(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;

      const whereConditions: WhereOptions = { id: Number(id) };

      // 数据权限过滤
      // 超级管理员可以查看所有牛棚，其他用户只能查看所属基地的牛棚
      if (req.user?.role?.name === '超级管理员') {
        // 超级管理员不需要额外的过滤条件
      } else if (req.user?.base_id) {
        // 基地用户只能查看所属基地的牛棚
        whereConditions.base_id = req.user.base_id;
      } else {
        // 没有基地权限的用户，不能查看任何牛棚
        whereConditions.base_id = -1;
      }

      const barn = await Barn.findOne({
        where: whereConditions,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code', 'address'],
          },
        ],
      });

      if (!barn) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BARN_NOT_FOUND',
            message: '牛棚不存在',
          },
        });
      }

      res.json({
        success: true,
        data: barn,
      });
    } catch (error) {
      console.error('获取牛棚详情失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BARN_DETAIL_ERROR',
          message: '获取牛棚详情失败',
        },
      });
    }
  }

  /**
   * 创建牛棚
   */
  static async createBarn(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { name, code, base_id, baseId, capacity, barn_type, barnType, description, facilities } = req.body;

      // Handle both parameter formats: base_id/baseId and barn_type/barnType
      const actualBaseId = base_id || baseId;
      const actualBarnType = barn_type || barnType;

      // 数据权限检查
      // 超级管理员可以在任何基地创建牛棚，其他用户只能在所属基地创建牛棚
      if (req.user?.role?.name === '超级管理员') {
        // 超级管理员不需要权限检查
      } else if (req.user?.base_id && req.user.base_id !== actualBaseId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: '无权限在该基地创建牛棚',
          },
        });
      } else if (!req.user?.base_id) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: '没有基地权限，无法创建牛棚',
          },
        });
      }

      // 检查基地是否存在
      const base = await Base.findByPk(actualBaseId);
      if (!base) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BASE_NOT_FOUND',
            message: '基地不存在',
          },
        });
      }

      // 检查同一基地下牛棚编码是否重复
      const existingBarn = await Barn.findOne({
        where: {
          code,
          base_id: actualBaseId,
        },
      });

      if (existingBarn) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'BARN_CODE_EXISTS',
            message: '该基地下已存在相同编码的牛棚',
          },
        });
      }

      const barn = await Barn.create({
        name,
        code,
        base_id: actualBaseId,
        capacity,
        barn_type: actualBarnType,
        description,
        facilities: facilities || {},
      });

      // 获取完整的牛棚信息（包含关联数据）
      const createdBarn = await Barn.findByPk(barn.id, {
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: createdBarn,
        message: '牛棚创建成功',
      });
    } catch (error) {
      console.error('创建牛棚失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BARN_CREATE_ERROR',
          message: '创建牛棚失败',
        },
      });
    }
  }

  /**
   * 更新牛棚
   */
  static async updateBarn(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { name, code, capacity, barn_type, barnType, description, facilities } = req.body;

      // Handle both parameter formats: barn_type/barnType
      const actualBarnType = barn_type !== undefined ? barn_type : barnType;

      const whereConditions: WhereOptions = { id: Number(id) };

      // 数据权限过滤
      // 超级管理员可以更新所有牛棚，其他用户只能更新所属基地的牛棚
      if (req.user?.role?.name === '超级管理员') {
        // 超级管理员不需要额外的过滤条件
      } else if (req.user?.base_id) {
        // 基地用户只能更新所属基地的牛棚
        whereConditions.base_id = req.user.base_id;
      } else {
        // 没有基地权限的用户，不能更新任何牛棚
        whereConditions.base_id = -1;
      }

      const barn = await Barn.findOne({ where: whereConditions });

      if (!barn) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BARN_NOT_FOUND',
            message: '牛棚不存在',
          },
        });
      }

      // 如果更新编码，检查是否重复
      if (code && code !== barn.code) {
        const existingBarn = await Barn.findOne({
          where: {
            code,
            base_id: barn.base_id,
            id: { [Op.ne]: barn.id },
          },
        });

        if (existingBarn) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'BARN_CODE_EXISTS',
              message: '该基地下已存在相同编码的牛棚',
            },
          });
        }
      }

      // 如果减少容量，检查是否小于当前牛只数量
      if (capacity && capacity < barn.current_count) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CAPACITY_TOO_SMALL',
            message: `牛棚容量不能小于当前牛只数量(${barn.current_count})`,
          },
        });
      }

      await barn.update({
        ...(name && { name }),
        ...(code && { code }),
        ...(capacity && { capacity }),
        ...(actualBarnType !== undefined && { barn_type: actualBarnType }),
        ...(description !== undefined && { description }),
        ...(facilities !== undefined && { facilities }),
      });

      // 获取更新后的完整信息
      const updatedBarn = await Barn.findByPk(barn.id, {
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      res.json({
        success: true,
        data: updatedBarn,
        message: '牛棚更新成功',
      });
    } catch (error) {
      console.error('更新牛棚失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BARN_UPDATE_ERROR',
          message: '更新牛棚失败',
        },
      });
    }
  }

  /**
   * 删除牛棚
   */
  static async deleteBarn(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { id } = req.params;

      const whereConditions: WhereOptions = { id: Number(id) };

      // 数据权限过滤
      // 超级管理员可以删除所有牛棚，其他用户只能删除所属基地的牛棚
      if (req.user?.role?.name === '超级管理员') {
        // 超级管理员不需要额外的过滤条件
      } else if (req.user?.base_id) {
        // 基地用户只能删除所属基地的牛棚
        whereConditions.base_id = req.user.base_id;
      } else {
        // 没有基地权限的用户，不能删除任何牛棚
        whereConditions.base_id = -1;
      }

      const barn = await Barn.findOne({ where: whereConditions });

      if (!barn) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BARN_NOT_FOUND',
            message: '牛棚不存在',
          },
        });
      }

      // 检查牛棚是否还有牛只
      if (barn.current_count > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BARN_NOT_EMPTY',
            message: `牛棚内还有${barn.current_count}头牛只，无法删除`,
          },
        });
      }

      await barn.destroy();

      res.json({
        success: true,
        message: '牛棚删除成功',
      });
    } catch (error) {
      console.error('删除牛棚失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BARN_DELETE_ERROR',
          message: '删除牛棚失败',
        },
      });
    }
  }

  /**
   * 获取牛棚统计信息
   */
  static async getBarnStatistics(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { base_id } = req.query;

      const whereConditions: WhereOptions = {};

      // 数据权限过滤
      // Admin用户可以查看所有牛棚统计，其他用户只能查看所属基地的牛棚统计
      if (req.user?.role?.name === '超级管理员') {
        // Admin用户：如果指定了base_id参数，则按base_id过滤，否则显示所有牛棚统计
        if (base_id) {
          whereConditions.base_id = Number(base_id);
        }
      } else if (req.user?.base_id) {
        // 基地用户：只能查看所属基地的牛棚统计
        whereConditions.base_id = req.user.base_id;
      } else {
        // 没有基地权限的用户，不显示任何牛棚统计
        whereConditions.base_id = -1;
      }

      const barns = await Barn.findAll({
        where: whereConditions,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      // 计算统计数据
      const totalBarns = barns.length;
      const totalCapacity = barns.reduce((sum, barn) => sum + barn.capacity, 0);
      const totalCurrentCount = barns.reduce((sum, barn) => sum + barn.current_count, 0);
      const totalAvailableCapacity = totalCapacity - totalCurrentCount;
      const averageUtilization = totalCapacity > 0 ? Math.round((totalCurrentCount / totalCapacity) * 100) : 0;

      // 按类型统计
      const typeStatistics = barns.reduce((acc, barn) => {
        const type = barn.barn_type || '其他';
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            capacity: 0,
            current_count: 0,
            utilization_rate: 0,
          };
        }
        acc[type].count += 1;
        acc[type].capacity += barn.capacity;
        acc[type].current_count += barn.current_count;
        acc[type].utilization_rate = acc[type].capacity > 0
          ? Math.round((acc[type].current_count / acc[type].capacity) * 100)
          : 0;
        return acc;
      }, {} as Record<string, any>);

      // 利用率分布
      const utilizationDistribution = {
        low: barns.filter(barn => (barn.current_count / barn.capacity) < 0.5).length,
        medium: barns.filter(barn => {
          const rate = barn.current_count / barn.capacity;
          return rate >= 0.5 && rate < 0.8;
        }).length,
        high: barns.filter(barn => (barn.current_count / barn.capacity) >= 0.8).length,
      };

      res.json({
        success: true,
        data: {
          overview: {
            total_barns: totalBarns,
            total_capacity: totalCapacity,
            total_current_count: totalCurrentCount,
            total_available_capacity: totalAvailableCapacity,
            average_utilization: averageUtilization,
          },
          type_statistics: typeStatistics,
          utilization_distribution: utilizationDistribution,
          barns: barns.map(barn => ({
            id: barn.id,
            name: barn.name,
            code: barn.code,
            barn_type: barn.barn_type,
            capacity: barn.capacity,
            current_count: barn.current_count,
            utilization_rate: barn.capacity > 0 ? Math.round((barn.current_count / barn.capacity) * 100) : 0,
            available_capacity: barn.capacity - barn.current_count,
            base: (barn as any).base,
          })),
        },
      });
    } catch (error) {
      console.error('获取牛棚统计失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BARN_STATISTICS_ERROR',
          message: '获取牛棚统计失败',
        },
      });
    }
  }

  /**
   * 获取基地下的牛棚选项（用于下拉选择）
   */
  static async getBarnOptions(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { base_id } = req.query;

      const whereConditions: WhereOptions = {};

      // 数据权限过滤
      // Admin用户可以查看所有牛棚选项，其他用户只能查看所属基地的牛棚选项
      if (req.user?.role?.name === '超级管理员') {
        // Admin用户：如果指定了base_id参数，则按base_id过滤，否则显示所有牛棚选项
        if (base_id) {
          whereConditions.base_id = Number(base_id);
        }
      } else if (req.user?.base_id) {
        // 基地用户：只能查看所属基地的牛棚选项
        whereConditions.base_id = req.user.base_id;
      } else {
        // 没有基地权限的用户，不显示任何牛棚选项
        whereConditions.base_id = -1;
      }

      const barns = await Barn.findAll({
        where: whereConditions,
        attributes: ['id', 'name', 'code', 'capacity', 'current_count', 'barn_type'],
        order: [['name', 'ASC']],
      });

      const options = barns.map(barn => ({
        value: barn.id,
        label: `${barn.name} (${barn.code})`,
        capacity: barn.capacity,
        current_count: barn.current_count,
        available_capacity: barn.capacity - barn.current_count,
        barn_type: barn.barn_type,
        disabled: barn.current_count >= barn.capacity, // 满员的牛棚禁用
      }));

      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      console.error('获取牛棚选项失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BARN_OPTIONS_ERROR',
          message: '获取牛棚选项失败',
        },
      });
    }
  }
}