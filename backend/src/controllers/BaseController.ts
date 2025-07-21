import { Request, Response, NextFunction } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { Base, User } from '@/models';
import { sequelize } from '@/config/database';
import { logger } from '@/utils/logger';
import { applyBaseFilter } from '@/middleware/dataPermission';

export class BaseController {
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
      const filteredWhereClause = applyBaseFilter(whereClause, req);

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

      res.json({
        success: true,
        data: {
          bases: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async getBaseById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const base = await Base.findByPk(id, {
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
        return res.status(404).json({
          success: false,
          error: {
            code: 'BASE_NOT_FOUND',
            message: '基地不存在在?',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      res.json({
        success: true,
        data: {
          base: base.toJSON(),
        },
      });
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
        return res.status(409).json({
          success: false,
          error: {
            code: 'BASE_CODE_EXISTS',
            message: '基地编码已存在在?',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check if manager exists and is not already managing another base
      if (manager_id) {
        const manager = await User.findByPk(manager_id);
        if (!manager) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MANAGER_NOT_FOUND',
              message: '指定的管理员不存在在',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
        }

        const existingManagedBase = await Base.findOne({ where: { manager_id } });
        if (existingManagedBase) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MANAGER_ALREADY_ASSIGNED',
              message: '该管理员已经管理其他基地',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
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

      res.status(201).json({
        success: true,
        data: {
          base: base.toJSON(),
        },
        message: '基地创建成功功',
      });
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
        return res.status(404).json({
          success: false,
          error: {
            code: 'BASE_NOT_FOUND',
            message: '基地不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
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
          return res.status(409).json({
            success: false,
            error: {
              code: 'BASE_CODE_EXISTS',
              message: '基地编码已存在',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
        }
      }

      // Check if manager exists and is not already managing another base
      if (manager_id && manager_id !== base.manager_id) {
        const manager = await User.findByPk(manager_id);
        if (!manager) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MANAGER_NOT_FOUND',
              message: '指定的管理员不存在在',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
        }

        const existingManagedBase = await Base.findOne({ 
          where: { 
            manager_id,
            id: { [Op.ne]: id }
          } 
        });
        if (existingManagedBase) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MANAGER_ALREADY_ASSIGNED',
              message: '该管理员已经管理其他基地',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
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

      res.json({
        success: true,
        data: {
          base: base.toJSON(),
        },
        message: '基地更新成功功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteBase(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const base = await Base.findByPk(id);
      if (!base) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BASE_NOT_FOUND',
            message: '基地不存在在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check if base has associated data (users, barns, cattle, etc.)
      const associatedUsers = await User.count({ where: { base_id: id } });
      if (associatedUsers > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BASE_HAS_USERS',
            message: '基地下还有用户，无法删除',
            details: { userCount: associatedUsers },
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
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
          return res.status(400).json({
            success: false,
            error: {
              code: 'BASE_HAS_BARNS',
              message: '基地下还有牛棚，无法删除',
              details: { barnCount: (barnCount[0] as any).count },
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
        }
      } catch (error) {
        // If barns table doesn't exist yet, continue
      }

      await base.destroy();

      logger.info(`Base deleted: ${base.name} (${base.code})`, {
        baseId: base.id,
        deletedBy: req.user?.id,
      });

      res.json({
        success: true,
        message: '基地删除成功功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async getBaseStatistics(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const base = await Base.findByPk(id);
      if (!base) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BASE_NOT_FOUND',
            message: '基地不存在在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
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

      res.json({
        success: true,
        data: {
          statistics,
        },
      });
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

      res.json({
        success: true,
        data: {
          managers: availableManagers,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async bulkImportBases(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { bases } = req.body;

      if (!Array.isArray(bases) || bases.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: '请提供有效的基地数据数组',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      const results: {
        success: Array<{ id: number; name: string; code: string }>;
        failed: Array<{ data: any; error: string }>;
        total: number;
      } = {
        success: [],
        failed: [],
        total: bases.length,
      };

      for (const baseData of bases) {
        try {
          // Validate required fields
          if (!baseData.name || !baseData.code) {
            results.failed.push({
              data: baseData,
              error: '基地名称和编码是必填项项',
            });
            continue;
          }

          // Check if code already exists
          const existingBase = await Base.findOne({ where: { code: baseData.code } });
          if (existingBase) {
            results.failed.push({
              data: baseData,
              error: `基地编码 ${baseData.code} 已存在`,
            });
            continue;
          }

          // Validate manager if provided
          if (baseData.manager_id) {
            const manager = await User.findByPk(baseData.manager_id);
            if (!manager) {
              results.failed.push({
                data: baseData,
                error: `管理员ID ${baseData.manager_id} 不存在`,
              });
              continue;
            }

            const existingManagedBase = await Base.findOne({ where: { manager_id: baseData.manager_id } });
            if (existingManagedBase) {
              results.failed.push({
                data: baseData,
                error: `管理员ID ${baseData.manager_id} 已经管理其他基地`,
              });
              continue;
            }
          }

          const base = await Base.create({
            name: baseData.name,
            code: baseData.code,
            address: baseData.address,
            latitude: baseData.latitude,
            longitude: baseData.longitude,
            area: baseData.area,
            manager_id: baseData.manager_id,
          });

          results.success.push({
            id: base.id,
            name: base.name,
            code: base.code,
          });

        } catch (error) {
          results.failed.push({
            data: baseData,
            error: (error as Error).message,
          });
        }
      }

      logger.info(`Bulk import bases completed: ${results.success.length} success, ${results.failed.length} failed`, {
        importedBy: req.user?.id,
        results,
      });

      res.json({
        success: true,
        data: results,
        message: `批量导入完成功：成功功${results.success.length} 个，失败 ${results.failed.length} 个`,
      });
    } catch (error) {
      next(error);
    }
  }

  public async exportBases(req: Request, res: Response, next: NextFunction) {
    try {
      const { format = 'json' } = req.query;

      // Apply data permission filtering
      const whereClause = applyBaseFilter({}, req);

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
        order: [['created_at', 'DESC']],
      });

      const exportData = bases.map(base => ({
        id: base.id,
        name: base.name,
        code: base.code,
        address: base.address,
        latitude: base.latitude,
        longitude: base.longitude,
        area: base.area,
        manager_name: (base as any).manager?.real_name,
        manager_username: (base as any).manager?.username,
        manager_phone: (base as any).manager?.phone,
        manager_email: (base as any).manager?.email,
        created_at: base.created_at,
        updated_at: base.updated_at,
      }));

      if (format === 'csv') {
        // For CSV format, we would need to implement CSV conversion
        // For now, return JSON with CSV headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=bases.csv');
        
        // Simple CSV implementation
        const csvHeaders = 'ID,名称,编码,地址,纬度,经度,面积,管理员姓名名?管理员用户名,管理员电话话?管理员邮箱箱?创建时间,更新时间\n';
        const csvRows = exportData.map(base => 
          `${base.id},"${base.name}","${base.code}","${base.address || ''}",${base.latitude || ''},${base.longitude || ''},${base.area || ''},"${base.manager_name || ''}","${base.manager_username || ''}","${base.manager_phone || ''}","${base.manager_email || ''}","${base.created_at}","${base.updated_at}"`
        ).join('\n');
        
        res.send(csvHeaders + csvRows);
      } else {
        res.json({
          success: true,
          data: {
            bases: exportData,
            total: exportData.length,
            exported_at: new Date().toISOString(),
          },
        });
      }

      logger.info(`Bases exported: ${exportData.length} records`, {
        exportedBy: req.user?.id,
        format,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getBaseCapacityInfo(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const base = await Base.findByPk(id);
      if (!base) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BASE_NOT_FOUND',
            message: '基地不存在在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Get capacity information
      const capacityInfo: any = {
        base_info: {
          id: base.id,
          name: base.name,
          code: base.code,
          area: base.area,
        },
        barn_capacity: {
          total_barns: 0,
          total_capacity: 0,
          current_occupancy: 0,
          utilization_rate: 0,
        },
        cattle_distribution: {
          total_cattle: 0,
          by_barn: [],
        },
      };

      try {
        // Get barn capacity information
        const barnCapacityResult = await sequelize.query(
          `SELECT 
            COUNT(*) as total_barns,
            COALESCE(SUM(capacity), 0) as total_capacity,
            COALESCE(SUM(current_count), 0) as current_occupancy
           FROM barns WHERE base_id = :baseId`,
          {
            replacements: { baseId: id },
            type: QueryTypes.SELECT,
          }
        ) as any[];

        if (barnCapacityResult[0]) {
          capacityInfo.barn_capacity = {
            total_barns: parseInt(barnCapacityResult[0].total_barns) || 0,
            total_capacity: parseInt(barnCapacityResult[0].total_capacity) || 0,
            current_occupancy: parseInt(barnCapacityResult[0].current_occupancy) || 0,
            utilization_rate: barnCapacityResult[0].total_capacity > 0 
              ? Math.round((barnCapacityResult[0].current_occupancy / barnCapacityResult[0].total_capacity) * 100)
              : 0,
          };
        }

        // Get cattle distribution by barn
        const cattleDistributionResult = await sequelize.query(
          `SELECT 
            b.id as barn_id,
            b.name as barn_name,
            b.capacity,
            b.current_count,
            COALESCE(c.cattle_count, 0) as actual_cattle_count
           FROM barns b
           LEFT JOIN (
             SELECT barn_id, COUNT(*) as cattle_count
             FROM cattle 
             WHERE base_id = :baseId
             GROUP BY barn_id
           ) c ON b.id = c.barn_id
           WHERE b.base_id = :baseId
           ORDER BY b.name`,
          {
            replacements: { baseId: id },
            type: QueryTypes.SELECT,
          }
        ) as any[];

        capacityInfo.cattle_distribution.by_barn = cattleDistributionResult.map((barn: any) => ({
          barn_id: barn.barn_id,
          barn_name: barn.barn_name,
          capacity: parseInt(barn.capacity) || 0,
          current_count: parseInt(barn.current_count) || 0,
          actual_cattle_count: parseInt(barn.actual_cattle_count) || 0,
          utilization_rate: barn.capacity > 0 
            ? Math.round((barn.actual_cattle_count / barn.capacity) * 100)
            : 0,
        }));

        capacityInfo.cattle_distribution.total_cattle = cattleDistributionResult.reduce(
          (sum: number, barn: any) => sum + (parseInt(barn.actual_cattle_count) || 0), 0
        );

      } catch (error) {
        logger.warn('Some capacity information could not be calculated due to missing tables', { 
          error: (error as Error).message 
        });
      }

      res.json({
        success: true,
        data: {
          capacity_info: capacityInfo,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async validateBaseLocation(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { latitude, longitude, address } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_COORDINATES',
            message: '纬度和经度是必填项项',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Basic coordinate validation
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LATITUDE',
            message: '纬度必须-90到90之间',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_LONGITUDE',
            message: '经度必须-180到180之间',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check if coordinates are in a reasonable location (China region)
      const isInChina = latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135;

      const validationResult: {
        coordinates: {
          latitude: number;
          longitude: number;
          valid: boolean;
        };
        location_info: {
          is_in_china: boolean;
          region: string;
          address: string | null;
        };
        recommendations: string[];
      } = {
        coordinates: {
          latitude,
          longitude,
          valid: true,
        },
        location_info: {
          is_in_china: isInChina,
          region: isInChina ? '中国境内' : '中国境外',
          address: address || null,
        },
        recommendations: [],
      };

      if (!isInChina) {
        validationResult.recommendations.push('坐标位置不在中国境内，请确认坐标是否正确');
      }

      if (address && address.length < 10) {
        validationResult.recommendations.push('建议提供更详细的地址信息');
      }

      res.json({
        success: true,
        data: validationResult,
      });
    } catch (error) {
      next(error);
    }
  }
}
