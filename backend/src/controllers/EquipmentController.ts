import { Request, Response } from 'express';
import { Op } from 'sequelize';
import {
  EquipmentCategory,
  ProductionEquipment,
  EquipmentMaintenancePlan,
  EquipmentMaintenanceRecord,
  EquipmentFailure,
  Base,
  Barn,
  User,
} from '../models';
import { AppError } from '../utils/errors';

export class EquipmentController {
  // Equipment Categories
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await EquipmentCategory.findAll({
        order: [['name', 'ASC']],
      });

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      throw new AppError('获取设备分类失败', 500);
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const { name, code, description } = req.body;

      const category = await EquipmentCategory.create({
        name,
        code,
        description,
      });

      res.status(201).json({
        success: true,
        data: category,
        message: '设备分类创建成功',
      });
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('设备分类代码已存在', 409);
      }
      throw new AppError('创建设备分类失败', 500);
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code, description } = req.body;

      const category = await EquipmentCategory.findByPk(id);
      if (!category) {
        throw new AppError('设备分类不存在', 404);
      }

      await category.update({
        name,
        code,
        description,
      });

      res.json({
        success: true,
        data: category,
        message: '设备分类更新成功',
      });
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('设备分类代码已存在', 409);
      }
      throw error;
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await EquipmentCategory.findByPk(id);
      if (!category) {
        throw new AppError('设备分类不存在', 404);
      }

      // Check if category has equipment
      const equipmentCount = await ProductionEquipment.count({
        where: { category_id: id },
      });

      if (equipmentCount > 0) {
        throw new AppError('该分类下存在设备，无法删除', 400);
      }

      await category.destroy();

      res.json({
        success: true,
        message: '设备分类删除成功',
      });
    } catch (error) {
      throw error;
    }
  }

  // Production Equipment
  static async getEquipment(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        baseId,
        categoryId,
        status,
        search,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      // Apply filters
      if (baseId) {
        where.base_id = baseId;
      }

      if (categoryId) {
        where.category_id = categoryId;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { brand: { [Op.iLike]: `%${search}%` } },
          { model: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await ProductionEquipment.findAndCountAll({
        where,
        include: [
          {
            model: EquipmentCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code'],
            required: false,
          },
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取设备列表失败', 500);
    }
  }

  static async getEquipmentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const equipment = await ProductionEquipment.findByPk(id, {
        include: [
          {
            model: EquipmentCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code'],
            required: false,
          },
          {
            model: EquipmentMaintenancePlan,
            as: 'maintenance_plans',
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!equipment) {
        throw new AppError('设备不存在', 404);
      }

      res.json({
        success: true,
        data: equipment,
      });
    } catch (error) {
      throw error;
    }
  }

  static async createEquipment(req: Request, res: Response) {
    try {
      const {
        name,
        code,
        category_id,
        base_id,
        barn_id,
        brand,
        model,
        serial_number,
        purchase_date,
        purchase_price,
        warranty_period,
        installation_date,
        location,
        specifications,
        photos,
      } = req.body;

      const equipment = await ProductionEquipment.create({
        name,
        code,
        category_id,
        base_id,
        barn_id,
        brand,
        model,
        serial_number,
        purchase_date,
        purchase_price,
        warranty_period,
        installation_date,
        status: 'normal',
        location,
        specifications,
        photos,
      });

      const equipmentWithDetails = await ProductionEquipment.findByPk(equipment.id, {
        include: [
          {
            model: EquipmentCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code'],
            required: false,
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: equipmentWithDetails,
        message: '设备创建成功',
      });
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('设备编码已存在', 409);
      }
      throw new AppError('创建设备失败', 500);
    }
  }

  static async updateEquipment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const equipment = await ProductionEquipment.findByPk(id);
      if (!equipment) {
        throw new AppError('设备不存在', 404);
      }

      await equipment.update(updateData);

      const updatedEquipment = await ProductionEquipment.findByPk(id, {
        include: [
          {
            model: EquipmentCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code'],
            required: false,
          },
        ],
      });

      res.json({
        success: true,
        data: updatedEquipment,
        message: '设备更新成功',
      });
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('设备编码已存在', 409);
      }
      throw error;
    }
  }

  static async deleteEquipment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const equipment = await ProductionEquipment.findByPk(id);
      if (!equipment) {
        throw new AppError('设备不存在', 404);
      }

      // Check if equipment has maintenance records
      const recordCount = await EquipmentMaintenanceRecord.count({
        where: { equipment_id: id },
      });

      if (recordCount > 0) {
        // Don't delete, just mark as retired
        await equipment.update({ status: 'retired' });
        res.json({
          success: true,
          message: '设备已标记为退役',
        });
      } else {
        await equipment.destroy();
        res.json({
          success: true,
          message: '设备删除成功',
        });
      }
    } catch (error) {
      throw error;
    }
  }

  // Equipment Status Tracking
  static async updateEquipmentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const equipment = await ProductionEquipment.findByPk(id);
      if (!equipment) {
        throw new AppError('设备不存在', 404);
      }

      await equipment.update({ status });

      res.json({
        success: true,
        data: equipment,
        message: '设备状态更新成功',
      });
    } catch (error) {
      throw error;
    }
  }

  static async getEquipmentStatistics(req: Request, res: Response) {
    try {
      const { baseId } = req.query;
      const where: any = {};

      if (baseId) {
        where.base_id = baseId;
      }

      const [
        totalCount,
        normalCount,
        maintenanceCount,
        brokenCount,
        retiredCount,
        categoryStats,
      ] = await Promise.all([
        ProductionEquipment.count({ where }),
        ProductionEquipment.count({ where: { ...where, status: 'normal' } }),
        ProductionEquipment.count({ where: { ...where, status: 'maintenance' } }),
        ProductionEquipment.count({ where: { ...where, status: 'broken' } }),
        ProductionEquipment.count({ where: { ...where, status: 'retired' } }),
        ProductionEquipment.findAll({
          where,
          attributes: [
            'category_id',
            [ProductionEquipment.sequelize!.fn('COUNT', '*'), 'count'],
          ],
          include: [
            {
              model: EquipmentCategory,
              as: 'category',
              attributes: ['name'],
            },
          ],
          group: ['category_id', 'category.id', 'category.name'],
        }),
      ]);

      res.json({
        success: true,
        data: {
          total: totalCount,
          statusDistribution: {
            normal: normalCount,
            maintenance: maintenanceCount,
            broken: brokenCount,
            retired: retiredCount,
          },
          categoryDistribution: categoryStats.map((item: any) => ({
            category: item.category?.name || '未分类',
            count: parseInt(item.get('count')),
          })),
        },
      });
    } catch (error) {
      throw new AppError('获取设备统计失败', 500);
    }
  }

  // Equipment Maintenance Plans
  static async getMaintenancePlans(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        equipmentId,
        maintenanceType,
        isActive,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (equipmentId) {
        where.equipment_id = equipmentId;
      }

      if (maintenanceType) {
        where.maintenance_type = maintenanceType;
      }

      if (isActive !== undefined) {
        where.is_active = isActive === 'true';
      }

      const { count, rows } = await EquipmentMaintenancePlan.findAndCountAll({
        where,
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
            include: [
              {
                model: Base,
                as: 'base',
                attributes: ['id', 'name', 'code'],
              },
            ],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取维护计划失败', 500);
    }
  }

  static async createMaintenancePlan(req: Request, res: Response) {
    try {
      const {
        equipment_id,
        maintenance_type,
        frequency_days,
        description,
        checklist,
      } = req.body;

      const plan = await EquipmentMaintenancePlan.create({
        equipment_id,
        maintenance_type,
        frequency_days,
        description,
        checklist,
        is_active: true,
      });

      const planWithDetails = await EquipmentMaintenancePlan.findByPk(plan.id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: planWithDetails,
        message: '维护计划创建成功',
      });
    } catch (error) {
      throw new AppError('创建维护计划失败', 500);
    }
  }

  static async updateMaintenancePlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const plan = await EquipmentMaintenancePlan.findByPk(id);
      if (!plan) {
        throw new AppError('维护计划不存在', 404);
      }

      await plan.update(updateData);

      const updatedPlan = await EquipmentMaintenancePlan.findByPk(id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      res.json({
        success: true,
        data: updatedPlan,
        message: '维护计划更新成功',
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteMaintenancePlan(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const plan = await EquipmentMaintenancePlan.findByPk(id);
      if (!plan) {
        throw new AppError('维护计划不存在', 404);
      }

      await plan.destroy();

      res.json({
        success: true,
        message: '维护计划删除成功',
      });
    } catch (error) {
      throw error;
    }
  }

  // Equipment Maintenance Records
  static async getMaintenanceRecords(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        equipmentId,
        planId,
        maintenanceType,
        status,
        startDate,
        endDate,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (equipmentId) {
        where.equipment_id = equipmentId;
      }

      if (planId) {
        where.plan_id = planId;
      }

      if (maintenanceType) {
        where.maintenance_type = maintenanceType;
      }

      if (status) {
        where.status = status;
      }

      if (startDate && endDate) {
        where.maintenance_date = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const { count, rows } = await EquipmentMaintenanceRecord.findAndCountAll({
        where,
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
            include: [
              {
                model: Base,
                as: 'base',
                attributes: ['id', 'name', 'code'],
              },
            ],
          },
          {
            model: EquipmentMaintenancePlan,
            as: 'plan',
            attributes: ['id', 'maintenance_type', 'frequency_days'],
            required: false,
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['maintenance_date', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取维护记录失败', 500);
    }
  }

  static async createMaintenanceRecord(req: Request, res: Response) {
    try {
      const {
        equipment_id,
        plan_id,
        maintenance_date,
        maintenance_type,
        duration_hours,
        cost,
        parts_replaced,
        issues_found,
        actions_taken,
        next_maintenance_date,
        photos,
      } = req.body;

      // Get operator from authenticated user
      const operator_id = (req as any).user?.id;

      const record = await EquipmentMaintenanceRecord.create({
        equipment_id,
        plan_id,
        maintenance_date,
        maintenance_type,
        operator_id,
        duration_hours,
        cost,
        parts_replaced,
        issues_found,
        actions_taken,
        next_maintenance_date,
        status: 'completed',
        photos,
      });

      const recordWithDetails = await EquipmentMaintenanceRecord.findByPk(record.id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: EquipmentMaintenancePlan,
            as: 'plan',
            attributes: ['id', 'maintenance_type', 'frequency_days'],
            required: false,
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: recordWithDetails,
        message: '维护记录创建成功',
      });
    } catch (error) {
      throw new AppError('创建维护记录失败', 500);
    }
  }

  static async updateMaintenanceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const record = await EquipmentMaintenanceRecord.findByPk(id);
      if (!record) {
        throw new AppError('维护记录不存在', 404);
      }

      await record.update(updateData);

      const updatedRecord = await EquipmentMaintenanceRecord.findByPk(id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: EquipmentMaintenancePlan,
            as: 'plan',
            attributes: ['id', 'maintenance_type', 'frequency_days'],
            required: false,
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username'],
          },
        ],
      });

      res.json({
        success: true,
        data: updatedRecord,
        message: '维护记录更新成功',
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteMaintenanceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const record = await EquipmentMaintenanceRecord.findByPk(id);
      if (!record) {
        throw new AppError('维护记录不存在', 404);
      }

      await record.destroy();

      res.json({
        success: true,
        message: '维护记录删除成功',
      });
    } catch (error) {
      throw error;
    }
  }

  // Equipment Failures
  static async getFailures(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        equipmentId,
        severity,
        status,
        startDate,
        endDate,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (equipmentId) {
        where.equipment_id = equipmentId;
      }

      if (severity) {
        where.severity = severity;
      }

      if (status) {
        where.status = status;
      }

      if (startDate && endDate) {
        where.failure_date = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const { count, rows } = await EquipmentFailure.findAndCountAll({
        where,
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
            include: [
              {
                model: Base,
                as: 'base',
                attributes: ['id', 'name', 'code'],
              },
            ],
          },
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'real_name', 'username'],
          },
          {
            model: User,
            as: 'repairer',
            attributes: ['id', 'real_name', 'username'],
            required: false,
          },
        ],
        limit: Number(limit),
        offset,
        order: [['failure_date', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取故障记录失败', 500);
    }
  }

  static async report 
 // Equipment Maintenance Plans
  static async getMaintenancePlans(req: Request, res: Response) {
    try {
      const { equipmentId, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (equipmentId) {
        where.equipment_id = equipmentId;
      }

      const { count, rows } = await EquipmentMaintenancePlan.findAndCountAll({
        where,
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
            include: [
              {
                model: Base,
                as: 'base',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取维护计划失败', 500);
    }
  }

  static async createMaintenancePlan(req: Request, res: Response) {
    try {
      const {
        equipment_id,
        maintenance_type,
        frequency_days,
        description,
        checklist,
      } = req.body;

      const plan = await EquipmentMaintenancePlan.create({
        equipment_id,
        maintenance_type,
        frequency_days,
        description,
        checklist,
        is_active: true,
      });

      const planWithDetails = await EquipmentMaintenancePlan.findByPk(plan.id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: planWithDetails,
        message: '维护计划创建成功',
      });
    } catch (error) {
      throw new AppError('创建维护计划失败', 500);
    }
  }

  static async updateMaintenancePlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const plan = await EquipmentMaintenancePlan.findByPk(id);
      if (!plan) {
        throw new AppError('维护计划不存在', 404);
      }

      await plan.update(updateData);

      const updatedPlan = await EquipmentMaintenancePlan.findByPk(id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      res.json({
        success: true,
        data: updatedPlan,
        message: '维护计划更新成功',
      });
    } catch (error) {
      throw error;
    }
  }

  static async deleteMaintenancePlan(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const plan = await EquipmentMaintenancePlan.findByPk(id);
      if (!plan) {
        throw new AppError('维护计划不存在', 404);
      }

      await plan.destroy();

      res.json({
        success: true,
        message: '维护计划删除成功',
      });
    } catch (error) {
      throw error;
    }
  }

  // Equipment Maintenance Records
  static async getMaintenanceRecords(req: Request, res: Response) {
    try {
      const {
        equipmentId,
        planId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (equipmentId) {
        where.equipment_id = equipmentId;
      }

      if (planId) {
        where.plan_id = planId;
      }

      if (status) {
        where.status = status;
      }

      if (startDate && endDate) {
        where.maintenance_date = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const { count, rows } = await EquipmentMaintenanceRecord.findAndCountAll({
        where,
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: EquipmentMaintenancePlan,
            as: 'plan',
            attributes: ['id', 'maintenance_type', 'description'],
            required: false,
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['maintenance_date', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取维护记录失败', 500);
    }
  }

  static async createMaintenanceRecord(req: Request, res: Response) {
    try {
      const {
        equipment_id,
        plan_id,
        maintenance_date,
        maintenance_type,
        duration_hours,
        cost,
        parts_replaced,
        issues_found,
        actions_taken,
        next_maintenance_date,
        photos,
      } = req.body;

      // Get operator from authenticated user
      const operator_id = (req as any).user?.id;

      const record = await EquipmentMaintenanceRecord.create({
        equipment_id,
        plan_id,
        maintenance_date,
        maintenance_type,
        operator_id,
        duration_hours,
        cost,
        parts_replaced,
        issues_found,
        actions_taken,
        next_maintenance_date,
        status: 'completed',
        photos,
      });

      const recordWithDetails = await EquipmentMaintenanceRecord.findByPk(record.id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: EquipmentMaintenancePlan,
            as: 'plan',
            attributes: ['id', 'maintenance_type', 'description'],
            required: false,
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: recordWithDetails,
        message: '维护记录创建成功',
      });
    } catch (error) {
      throw new AppError('创建维护记录失败', 500);
    }
  }

  static async updateMaintenanceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const record = await EquipmentMaintenanceRecord.findByPk(id);
      if (!record) {
        throw new AppError('维护记录不存在', 404);
      }

      await record.update(updateData);

      const updatedRecord = await EquipmentMaintenanceRecord.findByPk(id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: EquipmentMaintenancePlan,
            as: 'plan',
            attributes: ['id', 'maintenance_type', 'description'],
            required: false,
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name'],
          },
        ],
      });

      res.json({
        success: true,
        data: updatedRecord,
        message: '维护记录更新成功',
      });
    } catch (error) {
      throw error;
    }
  }

  // Equipment Failures
  static async getEquipmentFailures(req: Request, res: Response) {
    try {
      const {
        equipmentId,
        status,
        severity,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const where: any = {};

      if (equipmentId) {
        where.equipment_id = equipmentId;
      }

      if (status) {
        where.status = status;
      }

      if (severity) {
        where.severity = severity;
      }

      if (startDate && endDate) {
        where.failure_date = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)],
        };
      }

      const { count, rows } = await EquipmentFailure.findAndCountAll({
        where,
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'real_name'],
          },
          {
            model: User,
            as: 'repairer',
            attributes: ['id', 'real_name'],
            required: false,
          },
        ],
        limit: Number(limit),
        offset,
        order: [['failure_date', 'DESC']],
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取故障记录失败', 500);
    }
  }

  static async reportFailure(req: Request, res: Response) {
    try {
      const {
        equipment_id,
        failure_type,
        severity,
        description,
        impact_description,
      } = req.body;

      // Get reporter from authenticated user
      const reported_by = (req as any).user?.id;

      const failure = await EquipmentFailure.create({
        equipment_id,
        failure_date: new Date(),
        reported_by,
        failure_type,
        severity: severity || 'medium',
        description,
        impact_description,
        status: 'reported',
      });

      // Update equipment status to broken if severity is high or critical
      if (severity === 'high' || severity === 'critical') {
        await ProductionEquipment.update(
          { status: 'broken' },
          { where: { id: equipment_id } }
        );
      }

      const failureWithDetails = await EquipmentFailure.findByPk(failure.id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'real_name'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: failureWithDetails,
        message: '故障报告提交成功',
      });
    } catch (error) {
      throw new AppError('提交故障报告失败', 500);
    }
  }

  static async updateFailureStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        status,
        repair_start_time,
        repair_end_time,
        repair_cost,
        repair_description,
        parts_replaced,
      } = req.body;

      const failure = await EquipmentFailure.findByPk(id);
      if (!failure) {
        throw new AppError('故障记录不存在', 404);
      }

      const updateData: any = { status };

      if (status === 'in_repair') {
        updateData.repair_start_time = repair_start_time || new Date();
        updateData.repaired_by = (req as any).user?.id;
      }

      if (status === 'resolved') {
        updateData.repair_end_time = repair_end_time || new Date();
        updateData.repair_cost = repair_cost;
        updateData.repair_description = repair_description;
        updateData.parts_replaced = parts_replaced;

        // Update equipment status back to normal
        await ProductionEquipment.update(
          { status: 'normal' },
          { where: { id: failure.equipment_id } }
        );
      }

      await failure.update(updateData);

      const updatedFailure = await EquipmentFailure.findByPk(id, {
        include: [
          {
            model: ProductionEquipment,
            as: 'equipment',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'real_name'],
          },
          {
            model: User,
            as: 'repairer',
            attributes: ['id', 'real_name'],
            required: false,
          },
        ],
      });

      res.json({
        success: true,
        data: updatedFailure,
        message: '故障状态更新成功',
      });
    } catch (error) {
      throw error;
    }
  }

  // Equipment Efficiency Analysis
  static async getEquipmentEfficiency(req: Request, res: Response) {
    try {
      const { equipmentId, startDate, endDate } = req.query;

      if (!equipmentId) {
        throw new AppError('设备ID是必需的', 400);
      }

      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Get maintenance records
      const maintenanceRecords = await EquipmentMaintenanceRecord.findAll({
        where: {
          equipment_id: equipmentId,
          maintenance_date: {
            [Op.between]: [start, end],
          },
        },
        attributes: ['maintenance_date', 'duration_hours', 'cost'],
      });

      // Get failure records
      const failureRecords = await EquipmentFailure.findAll({
        where: {
          equipment_id: equipmentId,
          failure_date: {
            [Op.between]: [start, end],
          },
        },
        attributes: ['failure_date', 'severity', 'repair_start_time', 'repair_end_time'],
      });

      // Calculate metrics
      const totalMaintenanceHours = maintenanceRecords.reduce(
        (sum, record) => sum + (record.duration_hours || 0),
        0
      );

      const totalMaintenanceCost = maintenanceRecords.reduce(
        (sum, record) => sum + (record.cost || 0),
        0
      );

      const totalDowntimeHours = failureRecords.reduce((sum, record) => {
        if (record.repair_start_time && record.repair_end_time) {
          const downtime = (new Date(record.repair_end_time).getTime() - 
                           new Date(record.repair_start_time).getTime()) / (1000 * 60 * 60);
          return sum + downtime;
        }
        return sum;
      }, 0);

      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const totalHours = totalDays * 24;
      const uptime = ((totalHours - totalDowntimeHours) / totalHours) * 100;

      res.json({
        success: true,
        data: {
          period: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            days: totalDays,
          },
          maintenance: {
            count: maintenanceRecords.length,
            totalHours: totalMaintenanceHours,
            totalCost: totalMaintenanceCost,
            averageCost: maintenanceRecords.length > 0 ? totalMaintenanceCost / maintenanceRecords.length : 0,
          },
          failures: {
            count: failureRecords.length,
            totalDowntimeHours,
            averageDowntime: failureRecords.length > 0 ? totalDowntimeHours / failureRecords.length : 0,
            severityDistribution: failureRecords.reduce((acc: any, record) => {
              acc[record.severity] = (acc[record.severity] || 0) + 1;
              return acc;
            }, {}),
          },
          efficiency: {
            uptime: Math.round(uptime * 100) / 100,
            downtime: Math.round((100 - uptime) * 100) / 100,
            mtbf: failureRecords.length > 0 ? totalHours / failureRecords.length : totalHours, // Mean Time Between Failures
            mttr: failureRecords.length > 0 ? totalDowntimeHours / failureRecords.length : 0, // Mean Time To Repair
          },
        },
      });
    } catch (error) {
      throw error;
    }
  }
}