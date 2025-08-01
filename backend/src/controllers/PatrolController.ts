import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { PatrolRecord, Base, Barn, User, IoTDevice } from '@/models';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export class PatrolController {
  /**
   * 创建巡圈记录
   */
  static async createPatrolRecord(req: Request, res: Response) {
    try {
      const {
        base_id,
        barn_id,
        patrol_date,
        patrol_time,
        patrol_type,
        total_cattle_count,
        standing_cattle_count,
        lying_cattle_count,
        abnormal_cattle_count,
        abnormal_cattle_description,
        feed_trough_clean,
        feed_trough_notes,
        water_trough_clean,
        water_trough_notes,
        temperature,
        humidity,
        environment_notes,
        iot_device_id,
        iot_data_source = 'manual',
        overall_notes,
        images = []
      } = req.body;

      const patrol_person_id = req.user?.id;
      const patrol_person_name = req.user?.real_name || req.user?.username;

      // 验证基地和牛棚存在
      const base = await Base.findByPk(base_id);
      if (!base) {
        throw new AppError('指定的基地不存在', 404);
      }

      const barn = await Barn.findByPk(barn_id);
      if (!barn || barn.base_id !== base_id) {
        throw new AppError('指定的牛棚不存在或不属于该基地', 404);
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission?.canAccessAllBases && dataPermission?.baseId !== base_id) {
        throw new AppError('权限不足，只能在所属基地创建巡圈记录', 403);
      }

      // 检查是否已存在相同时间的巡圈记录
      const existingRecord = await PatrolRecord.findOne({
        where: {
          base_id,
          barn_id,
          patrol_date,
          patrol_time,
          patrol_type
        }
      });

      if (existingRecord) {
        throw new AppError('该时间段已存在巡圈记录', 409);
      }

      // 如果指定了物联网设备，尝试获取实时数据
      let deviceData = null;
      if (iot_device_id && iot_data_source === 'iot_sensor') {
        try {
          const device = await IoTDevice.findOne({
            where: { device_id: iot_device_id, status: 'active' }
          });
          
          if (device) {
            deviceData = await device.getLatestData();
            // 如果设备返回了温湿度数据，使用设备数据
            if (deviceData?.temperature !== undefined) {
              req.body.temperature = deviceData.temperature;
            }
            if (deviceData?.humidity !== undefined) {
              req.body.humidity = deviceData.humidity;
            }
          }
        } catch (error) {
          logger.warn(`获取物联网设备数据失败: ${error instanceof Error ? error.message : String(error)}`);
          // 设备数据获取失败不影响记录创建，继续使用手动输入的数据
        }
      }

      // 创建巡圈记录
      const patrolRecord = await PatrolRecord.create({
        base_id,
        barn_id,
        patrol_date,
        patrol_time,
        patrol_type,
        total_cattle_count,
        standing_cattle_count,
        lying_cattle_count,
        abnormal_cattle_count,
        abnormal_cattle_description,
        feed_trough_clean,
        feed_trough_notes,
        water_trough_clean,
        water_trough_notes,
        temperature: req.body.temperature || temperature,
        humidity: req.body.humidity || humidity,
        environment_notes,
        iot_device_id,
        iot_data_source,
        patrol_person_id,
        patrol_person_name,
        overall_notes,
        images
      });

      // 获取完整的记录信息
      const createdRecord = await PatrolRecord.findByPk(patrolRecord.id, {
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'patrol_person',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      logger.info(`Patrol record created: ${patrolRecord.id}`, {
        userId: req.user?.id,
        recordId: patrolRecord.id,
        baseId: base_id,
        barnId: barn_id
      });

      res.status(201).json({
        success: true,
        data: createdRecord,
        message: '巡圈记录创建成功'
      });
    } catch (error) {
      logger.error('Error creating patrol record:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('创建巡圈记录失败', 500);
    }
  }

  /**
   * 获取巡圈记录列表
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
        patrol_person_id
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission?.canAccessAllBases) {
        if (dataPermission?.baseId) {
          whereClause.base_id = dataPermission.baseId;
        } else {
          whereClause.base_id = -1; // 无权限访问任何数据
        }
      } else if (base_id) {
        whereClause.base_id = base_id;
      }

      // 添加其他筛选条件
      if (barn_id) whereClause.barn_id = barn_id;
      if (patrol_type) whereClause.patrol_type = patrol_type;
      if (patrol_person_id) whereClause.patrol_person_id = patrol_person_id;

      // 日期范围筛选
      if (start_date || end_date) {
        whereClause.patrol_date = {};
        if (start_date) whereClause.patrol_date[Op.gte] = start_date;
        if (end_date) whereClause.patrol_date[Op.lte] = end_date;
      }

      const { count, rows } = await PatrolRecord.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'patrol_person',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        order: [['patrol_date', 'DESC'], ['patrol_time', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          records: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching patrol records:', error);
      throw new AppError('获取巡圈记录列表失败', 500);
    }
  }

  /**
   * 获取单个巡圈记录详情
   */
  static async getPatrolRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const record = await PatrolRecord.findByPk(id, {
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code', 'current_count']
          },
          {
            model: User,
            as: 'patrol_person',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      if (!record) {
        throw new AppError('巡圈记录不存在', 404);
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission?.canAccessAllBases && dataPermission?.baseId !== record.base_id) {
        throw new AppError('权限不足，无法访问该巡圈记录', 403);
      }

      res.json({
        success: true,
        data: record
      });
    } catch (error) {
      logger.error('Error fetching patrol record:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取巡圈记录详情失败', 500);
    }
  }

  /**
   * 更新巡圈记录
   */
  static async updatePatrolRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const record = await PatrolRecord.findByPk(id);
      if (!record) {
        throw new AppError('巡圈记录不存在', 404);
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission?.canAccessAllBases && dataPermission?.baseId !== record.base_id) {
        throw new AppError('权限不足，无法修改该巡圈记录', 403);
      }

      // 更新记录
      await record.update(updateData);

      // 获取更新后的完整记录
      const updatedRecord = await PatrolRecord.findByPk(id, {
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'patrol_person',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      logger.info(`Patrol record updated: ${id}`, {
        userId: req.user?.id,
        recordId: id
      });

      res.json({
        success: true,
        data: updatedRecord,
        message: '巡圈记录更新成功'
      });
    } catch (error) {
      logger.error('Error updating patrol record:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('更新巡圈记录失败', 500);
    }
  }

  /**
   * 删除巡圈记录
   */
  static async deletePatrolRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const record = await PatrolRecord.findByPk(id);
      if (!record) {
        throw new AppError('巡圈记录不存在', 404);
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission?.canAccessAllBases && dataPermission?.baseId !== record.base_id) {
        throw new AppError('权限不足，无法删除该巡圈记录', 403);
      }

      await record.destroy();

      logger.info(`Patrol record deleted: ${id}`, {
        userId: req.user?.id,
        recordId: id
      });

      res.json({
        success: true,
        message: '巡圈记录删除成功'
      });
    } catch (error) {
      logger.error('Error deleting patrol record:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('删除巡圈记录失败', 500);
    }
  }

  /**
   * 获取巡圈统计数据
   */
  static async getPatrolStatistics(req: Request, res: Response) {
    try {
      const { base_id, start_date, end_date } = req.query;

      if (!base_id || !start_date || !end_date) {
        throw new AppError('base_id, start_date, end_date 参数是必需的', 400);
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission?.canAccessAllBases && dataPermission?.baseId !== Number(base_id)) {
        throw new AppError('权限不足，无法访问该基地的统计数据', 403);
      }

      // 获取基础统计
      const basicStats = await PatrolRecord.getPatrolStatistics(
        Number(base_id),
        start_date as string,
        end_date as string
      );

      // 获取每日趋势
      const dailyTrend = await PatrolRecord.getDailyTrend(
        Number(base_id),
        start_date as string,
        end_date as string
      );

      // 获取巡圈类型分布
      const typeDistribution = await PatrolRecord.findAll({
        where: {
          base_id: Number(base_id),
          patrol_date: {
            [Op.between]: [start_date as string, end_date as string]
          }
        },
        attributes: [
          'patrol_type',
          [PatrolRecord.sequelize!.fn('COUNT', PatrolRecord.sequelize!.col('id')), 'count']
        ],
        group: ['patrol_type'],
        raw: true
      });

      // 获取牛棚巡圈情况
      const barnStats = await PatrolRecord.findAll({
        where: {
          base_id: Number(base_id),
          patrol_date: {
            [Op.between]: [start_date as string, end_date as string]
          }
        },
        include: [
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          }
        ],
        attributes: [
          'barn_id',
          [PatrolRecord.sequelize!.fn('COUNT', PatrolRecord.sequelize!.col('id')), 'patrol_count'],
          [PatrolRecord.sequelize!.fn('AVG', PatrolRecord.sequelize!.col('lying_rate')), 'avg_lying_rate'],
          [PatrolRecord.sequelize!.fn('SUM', PatrolRecord.sequelize!.col('abnormal_cattle_count')), 'total_abnormal']
        ],
        group: ['barn_id', 'barn.id', 'barn.name', 'barn.code'],
        raw: false
      });

      res.json({
        success: true,
        data: {
          basic_stats: basicStats,
          daily_trend: dailyTrend,
          type_distribution: typeDistribution,
          barn_stats: barnStats
        }
      });
    } catch (error) {
      logger.error('Error fetching patrol statistics:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取巡圈统计数据失败', 500);
    }
  }

  /**
   * 获取物联网设备数据
   */
  static async getIoTDeviceData(req: Request, res: Response) {
    try {
      const { barn_id } = req.query;

      if (!barn_id) {
        throw new AppError('barn_id 参数是必需的', 400);
      }

      // 获取牛棚的温湿度设备
      const device = await IoTDevice.getTemperatureHumidityDevice(Number(barn_id));
      
      if (!device) {
        return res.json({
          success: true,
          data: {
            device: null,
            data: null,
            message: '该牛棚未配置温湿度传感器'
          }
        });
      }

      // 获取设备最新数据
      try {
        const deviceData = await device.getLatestData();
        
        return res.json({
          success: true,
          data: {
            device: {
              id: device.id,
              device_id: device.device_id,
              device_name: device.device_name,
              status: device.status,
              is_online: device.isOnline(),
              last_data_time: device.last_data_time
            },
            data: deviceData
          }
        });
      } catch (error) {
        return res.json({
          success: true,
          data: {
            device: {
              id: device.id,
              device_id: device.device_id,
              device_name: device.device_name,
              status: device.status,
              is_online: false,
              last_data_time: device.last_data_time
            },
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    } catch (error) {
      logger.error('Error fetching IoT device data:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取物联网设备数据失败', 500);
    }
  }

  /**
   * 获取今日巡圈任务
   */
  static async getTodayPatrolTasks(req: Request, res: Response) {
    try {
      const { base_id } = req.query;
      const today = new Date().toISOString().split('T')[0];

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      let targetBaseId = base_id;
      if (!dataPermission?.canAccessAllBases) {
        if (dataPermission?.baseId) {
          targetBaseId = dataPermission.baseId;
        } else {
          throw new AppError('权限不足，无法访问巡圈任务', 403);
        }
      }

      if (!targetBaseId) {
        throw new AppError('base_id 参数是必需的', 400);
      }

      // 获取基地的所有牛棚
      const barns = await Barn.findAll({
        where: { base_id: Number(targetBaseId) },
        attributes: ['id', 'name', 'code', 'current_count']
      });

      // 获取今日已完成的巡圈记录
      const todayRecords = await PatrolRecord.findAll({
        where: {
          base_id: Number(targetBaseId),
          patrol_date: today
        },
        attributes: ['barn_id', 'patrol_type']
      });

      // 构建任务列表
      const tasks = barns.map(barn => {
        const barnRecords = todayRecords.filter(record => record.barn_id === barn.id);
        const completedTypes = barnRecords.map(record => record.patrol_type);
        
        return {
          barn_id: barn.id,
          barn_name: barn.name,
          barn_code: barn.code,
          cattle_count: barn.current_count,
          completed_patrols: completedTypes,
          pending_patrols: ['before_feeding', 'after_feeding'].filter(type => 
            !completedTypes.includes(type as any)
          ),
          completion_rate: Math.round((completedTypes.length / 2) * 100)
        };
      });

      // 计算总体完成情况
      const totalTasks = barns.length * 2; // 每个牛棚2次巡圈
      const completedTasks = todayRecords.length;
      const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        success: true,
        data: {
          date: today,
          base_id: targetBaseId,
          overall_completion: overallCompletion,
          total_barns: barns.length,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          tasks: tasks
        }
      });
    } catch (error) {
      logger.error('Error fetching today patrol tasks:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('获取今日巡圈任务失败', 500);
    }
  }
}

export default PatrolController;