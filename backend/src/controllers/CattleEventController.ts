import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { CattleEvent, Cattle, User } from '@/models';
import { logger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';

export class CattleEventController {
  // Get cattle events list
  static async getCattleEvents(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        cattleId,
        eventType,
        startDate,
        endDate,
        operatorId,
        sortBy = 'event_date',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: WhereOptions = {};

      // Apply filters
      if (cattleId) {
        whereClause.cattle_id = cattleId;
      }
      if (eventType) {
        whereClause.event_type = eventType;
      }
      if (startDate) {
        whereClause.event_date = {
          [Op.gte]: startDate
        };
      }
      if (endDate) {
        whereClause.event_date = {
          ...whereClause.event_date,
          [Op.lte]: endDate
        };
      }
      if (operatorId) {
        whereClause.operator_id = operatorId;
      }

      // Check user permissions - limit to user's base cattle if not admin
      const user = (req as any).user;
      let cattleWhereClause: WhereOptions = {};
      if (user.role?.name !== 'admin' && user.base_id) {
        cattleWhereClause.base_id = user.base_id;
      }

      const { count, rows } = await CattleEvent.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: cattleWhereClause,
            attributes: ['id', 'ear_tag', 'breed', 'gender', 'base_id']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name']
          }
        ],
        order: [[sortBy as string, sortOrder as string]],
        limit: Number(limit),
        offset: offset,
      });

      res.json({
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
      logger.error('Error fetching cattle events:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CATTLE_EVENTS_ERROR',
          message: '获取牛只事件失败',
          details: error
        }
      });
    }
  }

  // Get cattle event by ID
  static async getCattleEventById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      let cattleWhereClause: WhereOptions = {};
      if (user.role?.name !== 'admin' && user.base_id) {
        cattleWhereClause.base_id = user.base_id;
      }

      const event = await CattleEvent.findOne({
        where: { id },
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: cattleWhereClause,
            attributes: ['id', 'ear_tag', 'breed', 'gender', 'base_id']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name']
          }
        ]
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: '事件不存在'
          }
        });
      }

      res.json({
        success: true,
        data: event
      });
    } catch (error) {
      logger.error('Error fetching cattle event:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EVENT_FETCH_ERROR',
          message: '获取事件失败',
          details: error
        }
      });
    }
  }

  // Create cattle event
  static async createCattleEvent(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const eventData = req.body;

      // Validate required fields
      if (!eventData.cattle_id || !eventData.event_type || !eventData.event_date) {
        throw new ValidationError('缺少必填字段');
      }

      // Check if cattle exists and user has permission
      const whereClause: WhereOptions = { id: eventData.cattle_id };
      if (user.role?.name !== 'admin' && user.base_id) {
        whereClause.base_id = user.base_id;
      }

      const cattle = await Cattle.findOne({ where: whereClause });
      if (!cattle) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CATTLE_NOT_FOUND',
            message: '牛只不存在或权限不足'
          }
        });
      }

      // Set operator
      eventData.operator_id = user.id;

      const event = await CattleEvent.create(eventData);

      // Fetch created event with associations
      const createdEvent = await CattleEvent.findByPk(event.id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: createdEvent
      });
    } catch (error) {
      logger.error('Error creating cattle event:', error);
      if (error instanceof ValidationError) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'EVENT_CREATE_ERROR',
            message: '创建事件失败',
            details: error
          }
        });
      }
    }
  }

  // Update cattle event
  static async updateCattleEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const updateData = req.body;

      // Find event with cattle permission check
      let cattleWhereClause: WhereOptions = {};
      if (user.role?.name !== 'admin' && user.base_id) {
        cattleWhereClause.base_id = user.base_id;
      }

      const event = await CattleEvent.findOne({
        where: { id },
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: cattleWhereClause
          }
        ]
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: '事件不存在或权限不足'
          }
        });
      }

      await event.update(updateData);

      // Fetch updated event with associations
      const updatedEvent = await CattleEvent.findByPk(event.id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name']
          }
        ]
      });

      res.json({
        success: true,
        data: updatedEvent
      });
    } catch (error) {
      logger.error('Error updating cattle event:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EVENT_UPDATE_ERROR',
          message: '更新事件失败',
          details: error
        }
      });
    }
  }

  // Delete cattle event
  static async deleteCattleEvent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      // Find event with cattle permission check
      let cattleWhereClause: WhereOptions = {};
      if (user.role?.name !== 'admin' && user.base_id) {
        cattleWhereClause.base_id = user.base_id;
      }

      const event = await CattleEvent.findOne({
        where: { id },
        include: [
          {
            model: Cattle,
            as: 'cattle',
            where: cattleWhereClause
          }
        ]
      });

      if (!event) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: '事件不存在或权限不足'
          }
        });
      }

      await event.destroy();

      res.json({
        success: true,
        message: '事件删除成功'
      });
    } catch (error) {
      logger.error('Error deleting cattle event:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EVENT_DELETE_ERROR',
          message: '删除事件失败',
          details: error
        }
      });
    }
  }

  // Get event types
  static async getEventTypes(req: Request, res: Response) {
    try {
      const eventTypes = [
        { value: 'birth', label: '出生', category: 'lifecycle' },
        { value: 'purchase', label: '采购', category: 'lifecycle' },
        { value: 'transfer_in', label: '转入', category: 'movement' },
        { value: 'transfer_out', label: '转出', category: 'movement' },
        { value: 'weight_record', label: '称重', category: 'health' },
        { value: 'health_check', label: '健康检查', category: 'health' },
        { value: 'vaccination', label: '疫苗接种', category: 'health' },
        { value: 'treatment', label: '治疗', category: 'health' },
        { value: 'breeding', label: '配种', category: 'reproduction' },
        { value: 'pregnancy_check', label: '妊娠检查', category: 'reproduction' },
        { value: 'calving', label: '产犊', category: 'reproduction' },
        { value: 'weaning', label: '断奶', category: 'reproduction' },
        { value: 'sale', label: '销售', category: 'lifecycle' },
        { value: 'death', label: '死亡', category: 'lifecycle' },
        { value: 'other', label: '其他', category: 'other' }
      ];

      res.json({
        success: true,
        data: eventTypes
      });
    } catch (error) {
      logger.error('Error fetching event types:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EVENT_TYPES_ERROR',
          message: '获取事件类型失败',
          details: error
        }
      });
    }
  }
}