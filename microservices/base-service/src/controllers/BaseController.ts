import { Request, Response, NextFunction } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { Base, User, Barn } from '../models';
import { sequelize } from '../config/database';
import { logger } from '../utils/logger';
import { applyBaseFilter } from '../middleware/dataPermission';

export class BaseController {
  public async getAllBases(req: Request, res: Response, next: NextFunction) {
    try {
      // Apply data permission filtering - users can only see their own base (unless admin)
      const whereClause = applyBaseFilter({}, req, 'id');

      const bases = await Base.findAll({
        where: whereClause,
        include: [
          { 
            model: User, 
            as: 'manager',
            attributes: ['id', 'real_name', 'username', 'phone', 'email'],
            required: false,
          }
        ],
        order: [['name', 'ASC']],
      });

      res.success(bases, '获取基地列表成功');
    } catch (error) {
      next(error);
    }
  }

  public async getBases(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, search, manager_id } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (manager_id) {
        whereClause.manager_id = manager_id;
      }

      // Apply data permission filtering - users can only see their own base (unless admin)
      const filteredWhereClause = applyBaseFilter(whereClause, req, 'id');

      const { count, rows } = await Base.findAndCountAll({
        where: filteredWhereClause,
        include: [
          { 
            model: User, 
            as: 'manager',
            attributes: ['id', 'real_name', 'username', 'phone', 'email'],
            required: false,
          }
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.success({
        bases: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      }, '获取基地列表成功');
    } catch (error) {
      next(error);
    }
  }

  public async getBaseById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      // Handle special case where 'all' is passed as ID
      if (id === 'all') {
        return res.error('无效的基地ID，请使用数字ID', 400, 'INVALID_BASE_ID');
      }

      // Validate that ID is a number
      const baseId = parseInt(id, 10);
      if (isNaN(baseId)) {
        return res.error('基地ID必须是数字', 400, 'INVALID_BASE_ID');
      }

      const base = await Base.findByPk(baseId, {
        include: [
          { 
            model: User, 
            as: 'manager',
            attributes: ['id', 'real_name', 'username', 'phone', 'email'],
            required: false,
          }
        ],
      });

      if (!base) {
        return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      res.success({ base: base.toJSON() }, '获取基地详情成功');
    } catch (error) {
      next(error);
    }
  }

  public async createBase(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { name, code, address, latitude, longitude, area, manager_id } = req.body;

      // Check if code already exists
      const existingBase = await Base.findOne({ where: { code } });
      if (existingBase) {
        return res.error('基地编码已存在', 409, 'BASE_CODE_EXISTS');
      }

      // Check if manager exists and is not already managing another base
      if (manager_id) {
        const manager = await User.findByPk(manager_id);
        if (!manager) {
          return res.error('指定的管理员不存在', 400, 'MANAGER_NOT_FOUND');
        }

        const existingManagedBase = await Base.findOne({ where: { manager_id } });
        if (existingManagedBase) {
          return res.error('该管理员已经管理其他基地', 400, 'MANAGER_ALREADY_ASSIGNED');
        }
      }

      const base = await Base.create({
        name,
        code,
        address,
        latitude,
        longitude,
        area,
        manager_id,
      });

      logger.info(`Base created: ${name} (${code})`, {
        baseId: base.id,
        createdBy: req.user?.id,
      });

      res.success({ base: base.toJSON() }, '基地创建成功', 201);
    } catch (error) {
      next(error);
    }
  }

  public async updateBase(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { name, code, address, latitude, longitude, area, manager_id } = req.body;

      const base = await Base.findByPk(id);
      if (!base) {
        return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      // Check if code already exists (excluding current base)
      if (code && code !== base.code) {
        const existingBase = await Base.findOne({ 
          where: { 
            code,
            id: { [Op.ne]: id }
          } 
        });
        if (existingBase) {
          return res.error('基地编码已存在', 409, 'BASE_CODE_EXISTS');
        }
      }

      // Check if manager exists and is not already managing another base
      if (manager_id && manager_id !== base.manager_id) {
        const manager = await User.findByPk(manager_id);
        if (!manager) {
          return res.error('指定的管理员不存在', 400, 'MANAGER_NOT_FOUND');
        }

        const existingManagedBase = await Base.findOne({ 
          where: { 
            manager_id,
            id: { [Op.ne]: id }
          } 
        });
        if (existingManagedBase) {
          return res.error('该管理员已经管理其他基地', 400, 'MANAGER_ALREADY_ASSIGNED');
        }
      }

      await base.update({
        name,
        code,
        address,
        latitude,
        longitude,
        area,
        manager_id,
      });

      logger.info(`Base updated: ${base.name} (${base.code})`, {
        baseId: base.id,
        updatedBy: req.user?.id,
      });

      res.success({ base: base.toJSON() }, '基地更新成功');
    } catch (error) {
      next(error);
    }
  }

  public async deleteBase(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const base = await Base.findByPk(id);
      if (!base) {
        return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      // Check if base has associated data (users, barns, cattle, etc.)
      const associatedUsers = await User.count({ where: { base_id: id } });
      if (associatedUsers > 0) {
        return res.error('基地下还有用户，无法删除', 400, 'BASE_HAS_USERS', { userCount: associatedUsers });
      }

      // Check for barns (if barn model exists)
      try {
        const barnCount = await sequelize.query(
          'SELECT COUNT(*) as count FROM barns WHERE base_id = :baseId',
          {
            replacements: { baseId: id },
            type: QueryTypes.SELECT,
          }
        );
        
        if ((barnCount[0] as any)?.count > 0) {
          return res.error('基地下还有牛棚，无法删除', 400, 'BASE_HAS_BARNS', { barnCount: (barnCount[0] as any).count });
        }
      } catch (error) {
        // If barns table doesn't exist yet, continue
      }

      await base.destroy();

      logger.info(`Base deleted: ${base.name} (${base.code})`, {
        baseId: base.id,
        deletedBy: req.user?.id,
      });

      res.success(null, '基地删除成功');
    } catch (error) {
      next(error);
    }
  }

  public async getBaseStatistics(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const base = await Base.findByPk(id);
      if (!base) {
        return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      // Get statistics using raw queries since not all models may exist yet
      const statistics: any = {
        base_info: base.toJSON(),
        user_count: 0,
        barn_count: 0,
        cattle_count: 0,
        healthy_cattle_count: 0,
        sick_cattle_count: 0,
        treatment_cattle_count: 0,
        feeding_records_count: 0,
        health_records_count: 0,
      };

      try {
        // User count
        const userCount = await User.count({ where: { base_id: id } });
        statistics.user_count = userCount;

        // Barn count
        const barnResult = await sequelize.query(
          'SELECT COUNT(*) as count FROM barns WHERE base_id = :baseId',
          {
            replacements: { baseId: id },
            type: QueryTypes.SELECT,
          }
        );
        statistics.barn_count = (barnResult[0] as any)?.count || 0;

        // Cattle statistics
        const cattleResult = await sequelize.query(
          `SELECT 
            COUNT(*) as total_count,
            COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
            COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick_count,
            COUNT(CASE WHEN health_status = 'treatment' THEN 1 END) as treatment_count
           FROM cattle WHERE base_id = :baseId`,
          {
            replacements: { baseId: id },
            type: QueryTypes.SELECT,
          }
        ) as any[];
        
        if (cattleResult[0]) {
          statistics.cattle_count = cattleResult[0].total_count || 0;
          statistics.healthy_cattle_count = cattleResult[0].healthy_count || 0;
          statistics.sick_cattle_count = cattleResult[0].sick_count || 0;
          statistics.treatment_cattle_count = cattleResult[0].treatment_count || 0;
        }

        // Feeding records count (last 30 days)
        const feedingResult = await sequelize.query(
          `SELECT COUNT(*) as count FROM feeding_records 
           WHERE base_id = :baseId AND feeding_date >= CURRENT_DATE - INTERVAL '30 days'`,
          {
            replacements: { baseId: id },
            type: QueryTypes.SELECT,
          }
        ) as any[];
        statistics.feeding_records_count = feedingResult[0]?.count || 0;

        // Health records count (last 30 days)
        const healthResult = await sequelize.query(
          `SELECT COUNT(*) as count FROM health_records hr
           JOIN cattle c ON hr.cattle_id = c.id
           WHERE c.base_id = :baseId AND hr.diagnosis_date >= CURRENT_DATE - INTERVAL '30 days'`,
          {
            replacements: { baseId: id },
            type: QueryTypes.SELECT,
          }
        ) as any[];
        statistics.health_records_count = healthResult[0]?.count || 0;

      } catch (error) {
        // If some tables don't exist yet, continue with available data
        logger.warn('Some statistics could not be calculated due to missing tables', { error: (error as Error).message });
      }

      res.success({ statistics }, '获取基地统计信息成功');
    } catch (error) {
      next(error);
    }
  }

  public async getAvailableManagers(req: Request, res: Response, next: NextFunction) {
    try {
      // Get users who are not already managing a base
      const managedBaseIds = await Base.findAll({
        attributes: ['manager_id'],
        where: {
          manager_id: { [Op.ne]: null as any }
        }
      });

      const managedUserIds = managedBaseIds.map(base => base.manager_id).filter(id => id !== null) as number[];

      const availableManagers = await User.findAll({
        where: {
          id: { [Op.notIn]: managedUserIds.length > 0 ? managedUserIds : [-1] },
          status: 'active',
        },
        attributes: ['id', 'real_name', 'username', 'phone', 'email'],
        order: [['real_name', 'ASC']],
      });

      res.success({ managers: availableManagers }, '获取可用管理员列表成功');
    } catch (error) {
      next(error);
    }
  }
}