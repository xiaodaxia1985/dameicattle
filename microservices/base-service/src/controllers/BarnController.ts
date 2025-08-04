import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Barn, Base, User } from '../models';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export class BarnController {
  /**
   * 获取牛棚列表
   */
  static async getBarns(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const {
        page = 1,
        limit = 20,
        base_id,
        barn_type,
        search,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereConditions: WhereOptions = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员：如果指定了base_id参数，则按base_id过滤，否则显示所有牛棚
        if (base_id) {
          whereConditions.base_id = Number(base_id);
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的牛棚
        whereConditions.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不显示任何牛棚
        whereConditions.base_id = -1;
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

      res.success({
        barns,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      }, '获取牛棚列表成功');
    } catch (error) {
      console.error('获取牛棚列表失败:', error);
      res.error('获取牛棚列表失败', 500, 'BARN_LIST_ERROR');
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
      const dataPermission = (req as any).dataPermission;
      
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员不需要额外的过滤条件
      } else if (dataPermission.baseId) {
        // 基地用户只能查看所属基地的牛棚
        whereConditions.base_id = dataPermission.baseId;
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
        return res.error('牛棚不存在', 404, 'BARN_NOT_FOUND');
      }

      res.success(barn, '获取牛棚详情成功');
    } catch (error) {
      console.error('获取牛棚详情失败:', error);
      res.error('获取牛棚详情失败', 500, 'BARN_DETAIL_ERROR');
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
      const dataPermission = (req as any).dataPermission;
      
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以在任何基地创建牛棚
      } else if (dataPermission.baseId && dataPermission.baseId !== actualBaseId) {
        return res.error('无权限在该基地创建牛棚', 403, 'PERMISSION_DENIED');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法创建牛棚', 403, 'PERMISSION_DENIED');
      }

      // 检查基地是否存在
      const base = await Base.findByPk(actualBaseId);
      if (!base) {
        return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      // 检查同一基地下牛棚编码是否重复
      const existingBarn = await Barn.findOne({
        where: {
          code,
          base_id: actualBaseId,
        },
      });

      if (existingBarn) {
        return res.error('该基地下已存在相同编码的牛棚', 409, 'BARN_CODE_EXISTS');
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

      res.success(createdBarn, '牛棚创建成功', 201);
    } catch (error) {
      console.error('创建牛棚失败:', error);
      res.error('创建牛棚失败', 500, 'BARN_CREATE_ERROR');
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
      const dataPermission = (req as any).dataPermission;
      
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员不需要额外的过滤条件
      } else if (dataPermission.baseId) {
        // 基地用户只能更新所属基地的牛棚
        whereConditions.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不能更新任何牛棚
        whereConditions.base_id = -1;
      }

      const barn = await Barn.findOne({ where: whereConditions });

      if (!barn) {
        return res.error('牛棚不存在', 404, 'BARN_NOT_FOUND');
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
          return res.error('该基地下已存在相同编码的牛棚', 409, 'BARN_CODE_EXISTS');
        }
      }

      // 如果减少容量，检查是否小于当前牛只数量
      if (capacity && capacity < barn.current_count) {
        return res.error(`牛棚容量不能小于当前牛只数量(${barn.current_count})`, 400, 'CAPACITY_TOO_SMALL');
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

      res.success(updatedBarn, '牛棚更新成功');
    } catch (error) {
      console.error('更新牛棚失败:', error);
      res.error('更新牛棚失败', 500, 'BARN_UPDATE_ERROR');
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
      const dataPermission = (req as any).dataPermission;
      
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员不需要额外的过滤条件
      } else if (dataPermission.baseId) {
        // 基地用户只能删除所属基地的牛棚
        whereConditions.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不能删除任何牛棚
        whereConditions.base_id = -1;
      }

      const barn = await Barn.findOne({ where: whereConditions });

      if (!barn) {
        return res.error('牛棚不存在', 404, 'BARN_NOT_FOUND');
      }

      // 检查牛棚是否还有牛只
      if (barn.current_count > 0) {
        return res.error(`牛棚内还有${barn.current_count}头牛只，无法删除`, 400, 'BARN_NOT_EMPTY');
      }

      await barn.destroy();

      res.success(null, '牛棚删除成功');
    } catch (error) {
      console.error('删除牛棚失败:', error);
      res.error('删除牛棚失败', 500, 'BARN_DELETE_ERROR');
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
      const dataPermission = (req as any).dataPermission;
      
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员：如果指定了base_id参数，则按base_id过滤，否则显示所有牛棚统计
        if (base_id) {
          whereConditions.base_id = Number(base_id);
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的牛棚统计
        whereConditions.base_id = dataPermission.baseId;
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

      res.success({
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
      }, '获取牛棚统计信息成功');
    } catch (error) {
      console.error('获取牛棚统计失败:', error);
      res.error('获取牛棚统计失败', 500, 'BARN_STATISTICS_ERROR');
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
      const dataPermission = (req as any).dataPermission;
      
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员：如果指定了base_id参数，则按base_id过滤，否则显示所有牛棚选项
        if (base_id) {
          whereConditions.base_id = Number(base_id);
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的牛棚选项
        whereConditions.base_id = dataPermission.baseId;
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

      res.success(options, '获取牛棚选项成功');
    } catch (error) {
      console.error('获取牛棚选项失败:', error);
      res.error('获取牛棚选项失败', 500, 'BARN_OPTIONS_ERROR');
    }
  }
}