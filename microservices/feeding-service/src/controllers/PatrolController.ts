import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { PatrolRecord, User, Barn } from '../models';
import { logger } from '../utils/logger';

export class PatrolController {
  /**
   * Get patrol records with pagination and filtering
   */
  static async getPatrolRecords(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        base_id,
        barn_id,
        patrol_type,
        start_date,
        end_date,
        patroller_id
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        if (base_id) {
          whereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        whereClause.base_id = dataPermission.baseId;
      } else {
        whereClause.base_id = -1;
      }

      // 添加其他过滤条件
      if (barn_id) {
        whereClause.barn_id = barn_id;
      }

      if (patrol_type) {
        whereClause.patrol_type = patrol_type;
      }

      if (patroller_id) {
        whereClause.patroller_id = patroller_id;
      }

      if (start_date && end_date) {
        whereClause.patrol_date = {
          [Op.between]: [new Date(start_date as string), new Date(end_date as string)]
        };
      } else if (start_date) {
        whereClause.patrol_date = {
          [Op.gte]: new Date(start_date as string)
        };
      } else if (end_date) {
        whereClause.patrol_date = {
          [Op.lte]: new Date(end_date as string)
        };
      }

      const { count, rows } = await PatrolRecord.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'patroller',
            attributes: ['id', 'real_name', 'username']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code', 'capacity', 'current_count']
          }
        ],
        order: [['patrol_date', 'DESC']],
        limit: Number(limit),
        offset: offset
      });

      const response = {
        records: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      };

      res.success(response, '获取巡圈记录成功');
    } catch (error) {
      logger.error('Error fetching patrol records:', error);
      res.error('获取巡圈记录失败', 500, 'FETCH_PATROL_RECORDS_ERROR');
    }
  }

  /**
   * Get patrol record by ID
   */
  static async getPatrolRecordById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const record = await PatrolRecord.findByPk(id, {
        include: [
          {
            model: User,
            as: 'patroller',
            attributes: ['id', 'real_name', 'username']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code', 'capacity', 'current_count']
          }
        ]
      });

      if (!record) {
        return res.error('巡圈记录不存在', 404, 'PATROL_RECORD_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (dataPermission && !dataPermission.canAccessAllBases && dataPermission.baseId !== record.base_id) {
        return res.error('无权访问该记录', 403, 'ACCESS_DENIED');
      }

      res.success(record, '获取巡圈记录成功');
    } catch (error) {
      logger.error('Error fetching patrol record:', error);
      res.error('获取巡圈记录失败', 500, 'FETCH_PATROL_RECORD_ERROR');
    }
  }

  /**
   * Create patrol record
   */
  static async createPatrolRecord(req: Request, res: Response) {
    try {
      const {
        base_id,
        barn_id,
        patrol_date,
        patrol_time,
        patrol_type,
        lying_cattle_count,
        standing_cattle_count,
        abnormal_cattle_count,
        abnormal_cattle_description,
        temperature,
        humidity,
        feed_trough_clean,
        feed_trough_notes,
        water_trough_clean,
        water_trough_notes,
        environment_notes,
        overall_notes,
        images
      } = req.body;

      const patroller_id = req.user?.id;

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (dataPermission && !dataPermission.canAccessAllBases && dataPermission.baseId !== base_id) {
        return res.error('无权在该基地创建记录', 403, 'ACCESS_DENIED');
      }

      // 从牛棚获取实际牛只数量
      let cattle_count = 0;
      if (barn_id) {
        const barn = await Barn.findByPk(barn_id);
        if (barn) {
          cattle_count = await barn.getActualCattleCount();
        }
      }

      // 验证数据一致性
      if (lying_cattle_count + standing_cattle_count !== cattle_count) {
        return res.error(`躺卧数量(${lying_cattle_count})和站立数量(${standing_cattle_count})之和必须等于牛棚实际牛只总数(${cattle_count})`, 400, 'INVALID_CATTLE_COUNT');
      }

      if (abnormal_cattle_count > cattle_count) {
        return res.error(`异常牛只数量(${abnormal_cattle_count})不能超过牛棚实际牛只总数(${cattle_count})`, 400, 'INVALID_ABNORMAL_COUNT');
      }

      // 计算躺卧率
      const lying_rate = cattle_count > 0 ? (lying_cattle_count / cattle_count) * 100 : 0;

      const createdRecord = await PatrolRecord.create({
        base_id,
        barn_id,
        patrol_date: patrol_date,
        patrol_time,
        patrol_type,
        total_cattle_count: cattle_count,
        lying_cattle_count,
        standing_cattle_count,
        lying_rate,
        abnormal_cattle_count,
        abnormal_cattle_description,
        temperature,
        humidity,
        feed_trough_clean,
        feed_trough_notes,
        water_trough_clean,
        water_trough_notes,
        environment_notes,
        overall_notes,
        images,
        patroller_id
      });

      // 重新获取创建的记录，包含关联数据
      const recordWithAssociations = await PatrolRecord.findByPk(createdRecord.id, {
        include: [
          {
            model: User,
            as: 'patroller',
            attributes: ['id', 'real_name', 'username']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code', 'capacity', 'current_count']
          }
        ]
      });

      res.success(recordWithAssociations, '创建巡圈记录成功', 201);
    } catch (error) {
      logger.error('Error creating patrol record:', error);
      res.error('创建巡圈记录失败', 500, 'CREATE_PATROL_RECORD_ERROR');
    }
  }

  /**
   * Update patrol record
   */
  static async updatePatrolRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        patrol_date,
        patrol_time,
        patrol_type,
        lying_cattle_count,
        standing_cattle_count,
        abnormal_cattle_count,
        abnormal_cattle_description,
        temperature,
        humidity,
        feed_trough_clean,
        feed_trough_notes,
        water_trough_clean,
        water_trough_notes,
        environment_notes,
        overall_notes,
        images
      } = req.body;

      const record = await PatrolRecord.findByPk(id);
      if (!record) {
        return res.error('巡圈记录不存在', 404, 'PATROL_RECORD_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (dataPermission && !dataPermission.canAccessAllBases && dataPermission.baseId !== record.base_id) {
        return res.error('无权修改该记录', 403, 'ACCESS_DENIED');
      }

      // 重新从牛棚获取实际牛只数量
      let finalCattleCount = record.total_cattle_count;
      if (record.barn_id) {
        const barn = await Barn.findByPk(record.barn_id);
        if (barn) {
          finalCattleCount = await barn.getActualCattleCount();
        }
      }

      const finalLyingCount = lying_cattle_count !== undefined ? lying_cattle_count : record.lying_cattle_count;
      const finalStandingCount = standing_cattle_count !== undefined ? standing_cattle_count : record.standing_cattle_count;
      const finalAbnormalCount = abnormal_cattle_count !== undefined ? abnormal_cattle_count : record.abnormal_cattle_count;

      // 验证数据一致性
      if (finalLyingCount + finalStandingCount !== finalCattleCount) {
        return res.error(`躺卧数量(${finalLyingCount})和站立数量(${finalStandingCount})之和必须等于牛棚实际牛只总数(${finalCattleCount})`, 400, 'INVALID_CATTLE_COUNT');
      }

      if (finalAbnormalCount > finalCattleCount) {
        return res.error(`异常牛只数量(${finalAbnormalCount})不能超过牛棚实际牛只总数(${finalCattleCount})`, 400, 'INVALID_ABNORMAL_COUNT');
      }

      // 计算躺卧率
      const lying_rate = finalCattleCount > 0 ? (finalLyingCount / finalCattleCount) * 100 : 0;

      // 更新记录
      await record.update({
        patrol_date: patrol_date || record.patrol_date,
        patrol_time: patrol_time !== undefined ? patrol_time : record.patrol_time,
        patrol_type: patrol_type || record.patrol_type,
        total_cattle_count: finalCattleCount,
        lying_cattle_count: finalLyingCount,
        standing_cattle_count: finalStandingCount,
        lying_rate,
        abnormal_cattle_count: finalAbnormalCount,
        abnormal_cattle_description: abnormal_cattle_description !== undefined ? abnormal_cattle_description : record.abnormal_cattle_description,
        temperature: temperature !== undefined ? temperature : record.temperature,
        humidity: humidity !== undefined ? humidity : record.humidity,
        feed_trough_clean: feed_trough_clean !== undefined ? feed_trough_clean : record.feed_trough_clean,
        feed_trough_notes: feed_trough_notes !== undefined ? feed_trough_notes : record.feed_trough_notes,
        water_trough_clean: water_trough_clean !== undefined ? water_trough_clean : record.water_trough_clean,
        water_trough_notes: water_trough_notes !== undefined ? water_trough_notes : record.water_trough_notes,
        environment_notes: environment_notes !== undefined ? environment_notes : record.environment_notes,
        overall_notes: overall_notes !== undefined ? overall_notes : record.overall_notes,
        images: images !== undefined ? images : record.images
      });

      // 重新获取更新后的记录，包含关联数据
      const updatedRecord = await PatrolRecord.findByPk(id, {
        include: [
          {
            model: User,
            as: 'patroller',
            attributes: ['id', 'real_name', 'username']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code', 'capacity', 'current_count']
          }
        ]
      });

      res.success(updatedRecord, '更新巡圈记录成功');
    } catch (error) {
      logger.error('Error updating patrol record:', error);
      res.error('更新巡圈记录失败', 500, 'UPDATE_PATROL_RECORD_ERROR');
    }
  }

  /**
   * Delete patrol record
   */
  static async deletePatrolRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const record = await PatrolRecord.findByPk(id);
      if (!record) {
        return res.error('巡圈记录不存在', 404, 'PATROL_RECORD_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (dataPermission && !dataPermission.canAccessAllBases && dataPermission.baseId !== record.base_id) {
        return res.error('无权删除该记录', 403, 'ACCESS_DENIED');
      }

      await record.destroy();

      res.success(null, '删除巡圈记录成功');
    } catch (error) {
      logger.error('Error deleting patrol record:', error);
      res.error('删除巡圈记录失败', 500, 'DELETE_PATROL_RECORD_ERROR');
    }
  }

  /**
   * Get patrol statistics
   */
  static async getPatrolStatistics(req: Request, res: Response) {
    try {
      const { base_id, start_date, end_date } = req.query;

      const whereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        if (base_id) {
          whereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        whereClause.base_id = dataPermission.baseId;
      } else {
        whereClause.base_id = -1;
      }

      if (start_date && end_date) {
        whereClause.patrol_date = {
          [Op.between]: [new Date(start_date as string), new Date(end_date as string)]
        };
      }

      const records = await PatrolRecord.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'patroller',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        order: [['patrol_date', 'DESC']]
      });

      // 计算统计数据
      const totalRecords = records.length;
      const totalCattle = records.reduce((sum, record) => sum + record.total_cattle_count, 0);
      const totalAbnormal = records.reduce((sum, record) => sum + record.abnormal_cattle_count, 0);
      const avgLyingRate = records.length > 0 
        ? records.reduce((sum, record) => sum + (record.lying_rate || 0), 0) / records.length 
        : 0;

      // 按类型统计
      const typeStats = records.reduce((acc, record) => {
        const type = record.patrol_type;
        if (!acc[type]) {
          acc[type] = { count: 0, cattle_count: 0, abnormal_count: 0 };
        }
        acc[type].count += 1;
        acc[type].cattle_count += record.total_cattle_count;
        acc[type].abnormal_count += record.abnormal_cattle_count;
        return acc;
      }, {} as Record<string, { count: number; cattle_count: number; abnormal_count: number }>);

      // 按日期统计
      const dailyStats = records.reduce((acc, record) => {
        const date = record.patrol_date instanceof Date 
          ? record.patrol_date.toISOString().split('T')[0]
          : String(record.patrol_date);
        if (!acc[date]) {
          acc[date] = { 
            patrol_count: 0, 
            cattle_count: 0, 
            abnormal_count: 0, 
            avg_lying_rate: 0,
            lying_rates: []
          };
        }
        acc[date].patrol_count += 1;
        acc[date].cattle_count += record.total_cattle_count;
        acc[date].abnormal_count += record.abnormal_cattle_count;
        acc[date].lying_rates.push(record.lying_rate || 0);
        return acc;
      }, {} as Record<string, { 
        patrol_count: number; 
        cattle_count: number; 
        abnormal_count: number; 
        avg_lying_rate: number;
        lying_rates: number[];
      }>);

      // 计算每日平均躺卧率
      Object.keys(dailyStats).forEach(date => {
        const dayData = dailyStats[date];
        dayData.avg_lying_rate = dayData.lying_rates.length > 0 
          ? dayData.lying_rates.reduce((sum, rate) => sum + rate, 0) / dayData.lying_rates.length 
          : 0;
        delete (dayData as any).lying_rates; // 删除临时数组
      });

      const statistics = {
        basic_stats: {
          total_records: totalRecords,
          total_cattle: totalCattle,
          total_abnormal: totalAbnormal,
          avg_lying_rate: avgLyingRate,
          abnormal_rate: totalCattle > 0 ? (totalAbnormal / totalCattle) * 100 : 0
        },
        type_distribution: Object.entries(typeStats).map(([type, stats]) => ({
          patrol_type: type,
          count: stats.count,
          cattle_count: stats.cattle_count,
          abnormal_count: stats.abnormal_count
        })),
        daily_trend: Object.entries(dailyStats).map(([date, stats]) => ({
          patrol_date: date,
          patrol_count: stats.patrol_count,
          cattle_count: stats.cattle_count,
          abnormal_count: stats.abnormal_count,
          avg_lying_rate: stats.avg_lying_rate
        })).sort((a, b) => a.patrol_date.localeCompare(b.patrol_date)),
        barn_stats: [] // TODO: 需要获取牛棚信息来计算每个牛棚的统计数据
      };

      res.success(statistics, '获取巡圈统计信息成功');
    } catch (error) {
      logger.error('Error fetching patrol statistics:', error);
      res.error('获取巡圈统计信息失败', 500, 'PATROL_STATISTICS_ERROR');
    }
  }

  /**
   * Get today's patrol tasks
   */
  static async getTodayPatrolTasks(req: Request, res: Response) {
    try {
      const { base_id } = req.query;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const whereClause: any = {
        patrol_date: {
          [Op.between]: [today, tomorrow]
        }
      };

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        if (base_id) {
          whereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        whereClause.base_id = dataPermission.baseId;
      } else {
        whereClause.base_id = -1;
      }

      const todayRecords = await PatrolRecord.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'patroller',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        order: [['patrol_date', 'DESC']]
      });

      // 按巡圈类型分组
      const tasksByType = {
        before_feeding: todayRecords.filter(r => r.patrol_type === 'before_feeding'),
        after_feeding: todayRecords.filter(r => r.patrol_type === 'after_feeding'),
        routine: todayRecords.filter(r => r.patrol_type === 'routine')
      };

      const summary = {
        total_tasks: todayRecords.length,
        completed_tasks: todayRecords.length,
        pending_tasks: 0, // TODO: 根据预定计划计算待完成任务
        completion_rate: 100 // TODO: 根据实际计划计算完成率
      };

      const response = {
        summary,
        tasks_by_type: tasksByType,
        recent_records: todayRecords.slice(0, 10)
      };

      res.success(response, '获取今日巡圈任务成功');
    } catch (error) {
      logger.error('Error fetching today patrol tasks:', error);
      res.error('获取今日巡圈任务失败', 500, 'TODAY_PATROL_TASKS_ERROR');
    }
  }

  /**
   * Get IoT device data (mock implementation)
   */
  static async getIoTDeviceData(req: Request, res: Response) {
    try {
      const { barn_id } = req.query;

      // TODO: 实际实现应该从IoT设备或监控服务获取数据
      // 这里提供模拟数据
      const mockData = {
        device: {
          id: `device_${barn_id}`,
          name: `牛棚${barn_id}环境监测设备`,
          status: 'online',
          last_update: new Date().toISOString()
        },
        data: {
          temperature: 18.5 + Math.random() * 10, // 18.5-28.5°C
          humidity: 45 + Math.random() * 30, // 45-75%
          air_quality: Math.random() > 0.8 ? 'poor' : Math.random() > 0.3 ? 'good' : 'excellent',
          cattle_count: Math.floor(50 + Math.random() * 100), // 50-150头
          activity_level: Math.random() > 0.5 ? 'active' : 'resting'
        }
      };

      res.success(mockData, '获取IoT设备数据成功');
    } catch (error) {
      logger.error('Error fetching IoT device data:', error);
      res.error('获取IoT设备数据失败', 500, 'IOT_DEVICE_DATA_ERROR');
    }
  }
}