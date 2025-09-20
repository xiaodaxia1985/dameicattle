import { Request, Response, NextFunction } from 'express';
import { CattleEvent, Cattle, User } from '../models';
import { Op } from 'sequelize';
import { Model, Optional } from 'sequelize';

// 使用已有的user类型定义，不再重复声明

export class CattleEventController {
  // 获取事件列表，支持按事件类型、日期范围、牛只ID等筛选
  public async getEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 构建查询条件
      const whereConditions: any = {};
      
      // 处理牛只ID查询参数
      if (req.query.cattle_id) {
        whereConditions.cattle_id = req.query.cattle_id;
      }
      
      // 处理事件类型查询参数
      if (req.query.event_type) {
        whereConditions.event_type = req.query.event_type;
      }
      
      // 处理日期范围查询参数
      if (req.query.start_date) {
        whereConditions.event_date = whereConditions.event_date || {};
        whereConditions.event_date[Op.gte] = req.query.start_date;
      }
      
      if (req.query.end_date) {
        whereConditions.event_date = whereConditions.event_date || {};
        whereConditions.event_date[Op.lte] = req.query.end_date;
      }
      
      // 支持繁殖相关事件筛选
      if (req.query.is_breeding_related === 'true') {
        whereConditions.event_type = {
          [Op.in]: ['breeding', 'pregnancy_check', 'calving', 'weaning']
        };
      }
      
      // 支持转群相关事件筛选
      if (req.query.is_transfer_related === 'true') {
        whereConditions.event_type = {
          [Op.in]: ['transfer_in', 'transfer_out', 'transferred']
        };
      }
      
      // 支持生命周期事件筛选
      if (req.query.is_lifecycle_related === 'true') {
        whereConditions.event_type = {
          [Op.in]: ['birth', 'born', 'purchase', 'purchased', 'sale', 'sold', 'death', 'dead']
        };
      }
      
      // 分页参数
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;
      
      // 使用Sequelize查询数据
      const { count, rows } = await CattleEvent.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        order: [['event_date', 'DESC'], ['created_at', 'DESC']],
        limit: pageSize,
        offset: offset
      });
      
      res.json({
        data: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      });
    } catch (error) {
      next(error);
    }
  }

  // 根据ID获取单个事件详情
  public async getEventById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const event = await CattleEvent.findByPk(id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });
      
      if (!event) {
        res.status(404).json({ message: '事件不存在' });
        return;
      }
      
      res.json({ data: event });
    } catch (error) {
      next(error);
    }
  }

  // 创建新事件
  public async createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 从请求中获取操作人信息（如果有）
      const operatorId = req.user?.id;
      
      // 构建事件数据
      const eventData = {
        ...req.body,
        operator_id: operatorId || req.body.operator_id
      };
      
      // 处理不同类型事件的特殊逻辑
      switch (eventData.event_type) {
        case 'transfer_in':
        case 'transfer_out':
        case 'transferred':
          // 转群事件 - 确保data中包含必要的转群信息
          eventData.data = {
            from_base_id: req.body.data?.from_base_id,
            to_base_id: req.body.data?.to_base_id,
            from_barn_id: req.body.data?.from_barn_id,
            to_barn_id: req.body.data?.to_barn_id,
            reason: req.body.data?.reason,
            ...req.body.data
          };
          break;
          
        case 'breeding':
        case 'pregnancy_check':
        case 'calving':
          // 繁殖事件 - 确保data中包含必要的繁殖信息
          eventData.data = {
            sire_id: req.body.data?.sire_id, // 父本ID
            dam_id: req.body.data?.dam_id, // 母本ID
            breeding_method: req.body.data?.breeding_method, // 配种方式
            pregnancy_result: req.body.data?.pregnancy_result, // 妊娠检查结果
            calf_id: req.body.data?.calf_id, //  calf ID
            ...req.body.data
          };
          break;
          
        // 生命周期事件不需要特殊处理，使用通用字段
      }
      
      // 创建事件记录
      const event = await CattleEvent.create(eventData);
      
      // 对于转群事件，更新牛只的base_id和barn_id
      if (event.event_type === 'transferred' && event.data) {
        const data = event.data as any;
        if (data.to_base_id || data.to_barn_id) {
          await Cattle.update(
            {
              base_id: data.to_base_id || undefined,
              barn_id: data.to_barn_id || undefined
            },
            { where: { id: event.cattle_id } }
          );
        }
      }
      
      res.status(201).json({ data: event });
    } catch (error) {
      next(error);
    }
  }

  // 更新事件
  public async updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // 检查事件是否存在
      const existingEvent = await CattleEvent.findByPk(id);
      if (!existingEvent) {
        res.status(404).json({ message: '事件不存在' });
        return;
      }
      
      // 更新事件
      await CattleEvent.update(req.body, { where: { id } });
      
      // 获取更新后的事件
      const updatedEvent = await CattleEvent.findByPk(id, {
        include: [
          {
            model: Cattle,
            as: 'cattle',
            attributes: ['id', 'ear_tag', 'breed', 'gender']
          }
        ]
      });
      
      res.json({ data: updatedEvent });
    } catch (error) {
      next(error);
    }
  }

  // 删除事件
  public async deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // 检查事件是否存在
      const event = await CattleEvent.findByPk(id);
      if (!event) {
        res.status(404).json({ message: '事件不存在' });
        return;
      }
      
      // 删除事件
      await CattleEvent.destroy({ where: { id } });
      
      res.json({ message: '删除成功' });
    } catch (error) {
      next(error);
    }
  }

  // 批量创建事件（用于批量转群等操作）
  public async batchCreateEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { events } = req.body;
      
      if (!Array.isArray(events) || events.length === 0) {
        res.status(400).json({ message: '请提供有效的事件数组' });
        return;
      }
      
      // 从请求中获取操作人信息（如果有）
      const operatorId = req.user?.id;
      
      // 处理每个事件
      const processedEvents = events.map(event => ({
        ...event,
        operator_id: operatorId || event.operator_id,
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      // 批量创建事件
      const createdEvents = await CattleEvent.bulkCreate(processedEvents);
      
      res.status(201).json({ data: createdEvents, count: createdEvents.length });
    } catch (error) {
      next(error);
    }
  }
}