import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Cattle, CattleEvent, Base, Barn, User } from '@/models';
import { logger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';

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
      if (baseId && (!dataPermission || dataPermission.canAccessAllBases)) {
        // 只有超级管理员才能通过baseId参数过滤（已在上面处理）
      }
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

      // 注意：数据权限过滤已在上面处理，这里不需要重复处理

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

      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching cattle list:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CATTLE_LIST_ERROR',
          message: '获取牛只列表失败',
          details: error
        }
      });
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
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATTLE_NOT_FOUND',
            message: '牛只不存在'
          }
        });
      }

      return res.json({
        success: true,
        data: cattle
      });
    } catch (error) {
      logger.error('Error fetching cattle:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CATTLE_FETCH_ERROR',
          message: '获取牛只信息失败',
          details: error
        }
      });
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
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATTLE_NOT_FOUND',
            message: '牛只不存在'
          }
        });
      }

      return res.json({
        success: true,
        data: cattle
      });
    } catch (error) {
      logger.error('Error fetching cattle by ear tag:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CATTLE_FETCH_ERROR',
          message: '获取牛只信息失败',
          details: error
        }
      });
    }
  }

  // Create new cattle
  static async createCattle(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const cattleData = req.body;

      // Validate required fields
      if (!cattleData.ear_tag || !cattleData.breed || !cattleData.gender || !cattleData.base_id) {
        throw new ValidationError('缺少必填字段');
      }

      // Check if ear tag already exists
      const existingCattle = await Cattle.findOne({
        where: { ear_tag: cattleData.ear_tag }
      });

      if (existingCattle) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'EAR_TAG_EXISTS',
            message: '耳标号已存在'
          }
        });
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以在任何基地创建牛只
      } else if (dataPermission.baseId && cattleData.base_id !== dataPermission.baseId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '权限不足，只能在所属基地创建牛只'
          }
        });
      } else if (!dataPermission.baseId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: '没有基地权限，无法创建牛只'
          }
        });
      }

      // Verify base exists
      const base = await Base.findByPk(cattleData.base_id);
      if (!base) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BASE_NOT_FOUND',
            message: '基地不存在'
          }
        });
      }

      // Verify barn exists if provided
      if (cattleData.barn_id) {
        const barn = await Barn.findOne({
          where: { id: cattleData.barn_id, base_id: cattleData.base_id }
        });
        if (!barn) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'BARN_NOT_FOUND',
              message: '牛棚不存在或不属于指定基地'
            }
          });
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

      return res.status(201).json({
        success: true,
        data: createdCattle
      });
    } catch (error) {
      logger.error('Error creating cattle:', error);
      if (error instanceof ValidationError) {
        return res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: {
            code: 'CATTLE_CREATE_ERROR',
            message: '创建牛只失败',
            details: error
          }
        });
      }
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
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATTLE_NOT_FOUND',
            message: '牛只不存在'
          }
        });
      }

      // Check if ear tag is being changed and if it already exists
      if (updateData.ear_tag && updateData.ear_tag !== cattle.ear_tag) {
        const existingCattle = await Cattle.findOne({
          where: { ear_tag: updateData.ear_tag }
        });
        if (existingCattle) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'EAR_TAG_EXISTS',
              message: '耳标号已存在'
            }
          });
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
            return res.status(404).json({
              success: false,
              error: {
                code: 'BARN_NOT_FOUND',
                message: '牛棚不存在或不属于指定基地'
              }
            });
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

      return res.json({
        success: true,
        data: updatedCattle
      });
    } catch (error) {
      logger.error('Error updating cattle:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CATTLE_UPDATE_ERROR',
          message: '更新牛只失败',
          details: error
        }
      });
    }
  }

  // Delete cattle
  static async deleteCattle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

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
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATTLE_NOT_FOUND',
            message: '牛只不存在'
          }
        });
      }

      // Update barn count if cattle is in a barn
      if (cattle.barn_id) {
        await Barn.decrement('current_count', {
          where: { id: cattle.barn_id }
        });
      }

      // Soft delete by updating status
      await cattle.update({ status: 'dead' });

      // Create death event
      await CattleEvent.create({
        cattle_id: cattle.id,
        event_type: 'death',
        event_date: new Date(),
        description: '牛只死亡记录',
        operator_id: (req as any).user?.id
      });

      return res.json({
        success: true,
        message: '牛只删除成功'
      });
    } catch (error) {
      logger.error('Error deleting cattle:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CATTLE_DELETE_ERROR',
          message: '删除牛只失败',
          details: error
        }
      });
    }
  }

  // Get cattle statistics
  static async getCattleStatistics(req: Request, res: Response) {
    try {
      const { baseId } = req.query;
      const user = (req as any).user;

      const whereClause: WhereOptions = { status: 'active' };
      
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

      // Get total count
      const totalCount = await Cattle.count({ where: whereClause });

      // Get counts by health status
      const healthStats = await Cattle.findAll({
        where: whereClause,
        attributes: [
          'health_status',
          [Cattle.sequelize!.fn('COUNT', '*'), 'count']
        ],
        group: ['health_status'],
        raw: true
      });

      // Get counts by gender
      const genderStats = await Cattle.findAll({
        where: whereClause,
        attributes: [
          'gender',
          [Cattle.sequelize!.fn('COUNT', '*'), 'count']
        ],
        group: ['gender'],
        raw: true
      });

      // Get counts by breed
      const breedStats = await Cattle.findAll({
        where: whereClause,
        attributes: [
          'breed',
          [Cattle.sequelize!.fn('COUNT', '*'), 'count']
        ],
        group: ['breed'],
        order: [[Cattle.sequelize!.fn('COUNT', '*'), 'DESC']],
        limit: 10,
        raw: true
      });

      return res.json({
        success: true,
        data: {
          total: totalCount,
          health_status: healthStats,
          gender: genderStats,
          breeds: breedStats
        }
      });
    } catch (error) {
      logger.error('Error fetching cattle statistics:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CATTLE_STATS_ERROR',
          message: '获取牛只统计失败',
          details: error
        }
      });
    }
  }
}