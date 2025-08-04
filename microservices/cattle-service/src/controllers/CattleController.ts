import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Cattle, CattleEvent, Base, Barn, User } from '../models';
import { logger } from '../utils/logger';

export class CattleController {
  // Get cattle list with filtering and pagination
  static async getCattleList(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        baseId,
        barnId,
        breed,
        gender,
        healthStatus,
        status = 'active',
        search,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: WhereOptions = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员：如果指定了baseId参数，则按baseId过滤，否则显示所有牛只
        if (baseId) {
          whereClause.base_id = baseId;
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的牛只
        whereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不显示任何牛只
        whereClause.base_id = -1;
      }

      // Apply other filters
      if (barnId) {
        whereClause.barn_id = barnId;
      }
      if (breed) {
        whereClause.breed = { [Op.iLike]: `%${breed}%` };
      }
      if (gender) {
        whereClause.gender = gender;
      }
      if (healthStatus) {
        whereClause.health_status = healthStatus;
      }
      if (status) {
        whereClause.status = status;
      }
      if (search) {
        (whereClause as any)[Op.or] = [
          { ear_tag: { [Op.iLike]: `%${search}%` } },
          { breed: { [Op.iLike]: `%${search}%` } },
          { notes: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Cattle.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Cattle,
            as: 'father',
            attributes: ['id', 'ear_tag', 'breed']
          },
          {
            model: Cattle,
            as: 'mother',
            attributes: ['id', 'ear_tag', 'breed']
          }
        ],
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset: offset,
      });

      res.success({
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }, '获取牛只列表成功');
    } catch (error) {
      logger.error('Error fetching cattle list:', error);
      res.error('获取牛只列表失败', 500, 'CATTLE_LIST_ERROR');
    }
  }

  // Get cattle by ID
  static async getCattleById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const whereClause: WhereOptions = { id };
      
      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员不需要额外的过滤条件
      } else if (dataPermission.baseId) {
        // 基地用户只能查看所属基地的牛只
        whereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不能查看任何牛只
        whereClause.base_id = -1;
      }

      const cattle = await Cattle.findOne({
        where: whereClause,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code', 'address']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code', 'capacity', 'current_count']
          },
          {
            model: Cattle,
            as: 'father',
            attributes: ['id', 'ear_tag', 'breed']
          },
          {
            model: Cattle,
            as: 'mother',
            attributes: ['id', 'ear_tag', 'breed']
          },
          {
            model: CattleEvent,
            as: 'events',
            include: [
              {
                model: User,
                as: 'operator',
                attributes: ['id', 'real_name']
              }
            ],
            order: [['event_date', 'DESC']],
            limit: 10
          }
        ]
      });

      if (!cattle) {
        return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
      }

      res.success(cattle, '获取牛只信息成功');
    } catch (error) {
      logger.error('Error fetching cattle:', error);
      res.error('获取牛只信息失败', 500, 'CATTLE_FETCH_ERROR');
    }
  }

  // Get cattle by ear tag
  static async getCattleByEarTag(req: Request, res: Response) {
    try {
      const { earTag } = req.params;

      const whereClause: WhereOptions = { ear_tag: earTag };
      
      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员不需要额外的过滤条件
      } else if (dataPermission.baseId) {
        // 基地用户只能查看所属基地的牛只
        whereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不能查看任何牛只
        whereClause.base_id = -1;
      }

      const cattle = await Cattle.findOne({
        where: whereClause,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          },
          {
            model: CattleEvent,
            as: 'events',
            include: [
              {
                model: User,
                as: 'operator',
                attributes: ['id', 'real_name']
              }
            ],
            order: [['event_date', 'DESC']],
            limit: 5
          }
        ]
      });

      if (!cattle) {
        return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
      }

      res.success(cattle, '获取牛只信息成功');
    } catch (error) {
      logger.error('Error fetching cattle by ear tag:', error);
      res.error('获取牛只信息失败', 500, 'CATTLE_FETCH_ERROR');
    }
  }

  // Create new cattle
  static async createCattle(req: Request, res: Response) {
    try {
      const cattleData = req.body;

      // Validate required fields
      if (!cattleData.ear_tag || !cattleData.breed || !cattleData.gender || !cattleData.base_id) {
        return res.error('缺少必填字段', 422, 'VALIDATION_ERROR');
      }

      // Check if ear tag already exists
      const existingCattle = await Cattle.findOne({
        where: { ear_tag: cattleData.ear_tag }
      });

      if (existingCattle) {
        return res.error('耳标号已存在', 409, 'EAR_TAG_EXISTS');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以在任何基地创建牛只
      } else if (dataPermission.baseId && cattleData.base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能在所属基地创建牛只', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法创建牛只', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // Verify base exists
      const base = await Base.findByPk(cattleData.base_id);
      if (!base) {
        return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
      }

      // Verify barn exists if provided
      if (cattleData.barn_id) {
        const barn = await Barn.findOne({
          where: { id: cattleData.barn_id, base_id: cattleData.base_id }
        });
        if (!barn) {
          return res.error('牛棚不存在或不属于指定基地', 404, 'BARN_NOT_FOUND');
        }
      }

      const cattle = await Cattle.create(cattleData);

      // Create initial event
      const eventTypeMap: Record<string, string> = {
        'born': 'born',
        'purchased': 'purchased', 
        'transferred': 'transferred'
      };
      
      const descriptionMap: Record<string, string> = {
        'born': '出生',
        'purchased': '采购',
        'transferred': '转入'
      };
      
      const eventType = eventTypeMap[cattleData.source] || 'purchased';
      const eventDescription = descriptionMap[cattleData.source] || '采购';
      
      await CattleEvent.create({
        cattle_id: cattle.id,
        event_type: eventType,
        event_date: cattleData.purchase_date || cattleData.birth_date || new Date(),
        description: `牛只入场 - ${eventDescription}`,
        operator_id: (req as any).user?.id,
        data: {
          initial_weight: cattleData.weight,
          purchase_price: cattleData.purchase_price,
          birth_date: cattleData.birth_date,
          source: cattleData.source
        }
      });

      // Update barn current count if barn is specified
      if (cattleData.barn_id) {
        await Barn.increment('current_count', {
          where: { id: cattleData.barn_id }
        });
      }

      // Fetch the created cattle with associations
      const createdCattle = await Cattle.findByPk(cattle.id, {
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.success(createdCattle, '创建牛只成功', 201);
    } catch (error) {
      logger.error('Error creating cattle:', error);
      res.error('创建牛只失败', 500, 'CATTLE_CREATE_ERROR');
    }
  }

  // Update cattle
  static async updateCattle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const whereClause: WhereOptions = { id };
      
      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员不需要额外的过滤条件
      } else if (dataPermission.baseId) {
        // 基地用户只能更新所属基地的牛只
        whereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不能更新任何牛只
        whereClause.base_id = -1;
      }

      const cattle = await Cattle.findOne({ where: whereClause });

      if (!cattle) {
        return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
      }

      // Check if ear tag is being changed and if it already exists
      if (updateData.ear_tag && updateData.ear_tag !== cattle.ear_tag) {
        const existingCattle = await Cattle.findOne({
          where: { ear_tag: updateData.ear_tag }
        });
        if (existingCattle) {
          return res.error('耳标号已存在', 409, 'EAR_TAG_EXISTS');
        }
      }

      // Handle barn change
      if (updateData.barn_id !== undefined && updateData.barn_id !== cattle.barn_id) {
        // Decrease count from old barn
        if (cattle.barn_id) {
          await Barn.decrement('current_count', {
            where: { id: cattle.barn_id }
          });
        }
        
        // Increase count in new barn
        if (updateData.barn_id) {
          const barn = await Barn.findOne({
            where: { id: updateData.barn_id, base_id: cattle.base_id }
          });
          if (!barn) {
            return res.error('牛棚不存在或不属于指定基地', 404, 'BARN_NOT_FOUND');
          }
          await Barn.increment('current_count', {
            where: { id: updateData.barn_id }
          });
        }

        // Create transfer event
        await CattleEvent.create({
          cattle_id: cattle.id,
          event_type: 'transfer_in',
          event_date: new Date(),
          description: `牛只转群 - 从${cattle.barn_id ? '牛棚' + cattle.barn_id : '无牛棚'}转至${updateData.barn_id ? '牛棚' + updateData.barn_id : '无牛棚'}`,
          operator_id: (req as any).user?.id,
          data: {
            from_barn_id: cattle.barn_id,
            to_barn_id: updateData.barn_id
          }
        });
      }

      // Create weight record event if weight is updated
      if (updateData.weight && updateData.weight !== cattle.weight) {
        await CattleEvent.create({
          cattle_id: cattle.id,
          event_type: 'weight_record',
          event_date: new Date(),
          description: `体重记录 - 从${cattle.weight || 0}kg更新为${updateData.weight}kg`,
          operator_id: (req as any).user?.id,
          data: {
            previous_weight: cattle.weight,
            new_weight: updateData.weight
          }
        });
      }

      await cattle.update(updateData);

      // Fetch updated cattle with associations
      const updatedCattle = await Cattle.findByPk(cattle.id, {
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      res.success(updatedCattle, '更新牛只成功');
    } catch (error) {
      logger.error('Error updating cattle:', error);
      res.error('更新牛只失败', 500, 'CATTLE_UPDATE_ERROR');
    }
  }

  // Delete cattle
  static async deleteCattle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const whereClause: WhereOptions = { id };
      
      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员不需要额外的过滤条件
      } else if (dataPermission.baseId) {
        // 基地用户只能删除所属基地的牛只
        whereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不能删除任何牛只
        whereClause.base_id = -1;
      }

      const cattle = await Cattle.findOne({ where: whereClause });

      if (!cattle) {
        return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
      }

      // Create deletion event
      await CattleEvent.create({
        cattle_id: cattle.id,
        event_type: 'deleted',
        event_date: new Date(),
        description: '牛只删除',
        operator_id: (req as any).user?.id,
        data: {
          reason: '管理员删除',
          cattle_data: cattle.toJSON()
        }
      });

      // Update barn current count if cattle was in a barn
      if (cattle.barn_id) {
        await Barn.decrement('current_count', {
          where: { id: cattle.barn_id }
        });
      }

      await cattle.destroy();

      res.success(null, '删除牛只成功');
    } catch (error) {
      logger.error('Error deleting cattle:', error);
      res.error('删除牛只失败', 500, 'CATTLE_DELETE_ERROR');
    }
  }

  // Get cattle statistics
  static async getCattleStatistics(req: Request, res: Response) {
    try {
      const { baseId } = req.query;

      const whereClause: WhereOptions = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员：如果指定了baseId参数，则按baseId过滤，否则显示所有牛只统计
        if (baseId) {
          whereClause.base_id = baseId;
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的牛只统计
        whereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不显示任何牛只统计
        whereClause.base_id = -1;
      }

      const cattle = await Cattle.findAll({
        where: whereClause,
        attributes: ['id', 'gender', 'health_status', 'status', 'breed', 'birth_date', 'weight'],
      });

      // Calculate statistics
      const totalCattle = cattle.length;
      const maleCount = cattle.filter(c => c.gender === 'male').length;
      const femaleCount = cattle.filter(c => c.gender === 'female').length;
      
      const healthyCount = cattle.filter(c => c.health_status === 'healthy').length;
      const sickCount = cattle.filter(c => c.health_status === 'sick').length;
      const treatmentCount = cattle.filter(c => c.health_status === 'treatment').length;

      const activeCount = cattle.filter(c => c.status === 'active').length;
      const soldCount = cattle.filter(c => c.status === 'sold').length;
      const deadCount = cattle.filter(c => c.status === 'dead').length;

      // Breed distribution
      const breedDistribution = cattle.reduce((acc, c) => {
        acc[c.breed] = (acc[c.breed] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Age distribution
      const now = new Date();
      const ageDistribution = {
        calf: 0,      // 0-6 months
        young: 0,     // 6-18 months
        adult: 0,     // 18+ months
        unknown: 0    // no birth date
      };

      cattle.forEach(c => {
        if (!c.birth_date) {
          ageDistribution.unknown++;
          return;
        }
        
        const birthDate = new Date(c.birth_date);
        const ageMonths = Math.floor((now.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        if (ageMonths < 6) {
          ageDistribution.calf++;
        } else if (ageMonths < 18) {
          ageDistribution.young++;
        } else {
          ageDistribution.adult++;
        }
      });

      // Average weight
      const cattleWithWeight = cattle.filter(c => c.weight);
      const averageWeight = cattleWithWeight.length > 0 
        ? cattleWithWeight.reduce((sum, c) => sum + Number(c.weight), 0) / cattleWithWeight.length
        : 0;

      const statistics = {
        overview: {
          total_cattle: totalCattle,
          male_count: maleCount,
          female_count: femaleCount,
          average_weight: Math.round(averageWeight * 100) / 100
        },
        health_status: {
          healthy: healthyCount,
          sick: sickCount,
          treatment: treatmentCount
        },
        status: {
          active: activeCount,
          sold: soldCount,
          dead: deadCount
        },
        breed_distribution: breedDistribution,
        age_distribution: ageDistribution
      };

      res.success(statistics, '获取牛只统计信息成功');
    } catch (error) {
      logger.error('Error fetching cattle statistics:', error);
      res.error('获取牛只统计信息失败', 500, 'CATTLE_STATISTICS_ERROR');
    }
  }
}