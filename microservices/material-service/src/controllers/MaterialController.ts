import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Material, MaterialInventory, InventoryRecord, User } from '../models';
import { logger } from '../utils/logger';

export class MaterialController {
  // 物资档案管理

  /**
   * 获取物资列表
   */
  static async getMaterials(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        status = 'active'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = { status };

      // 搜索过滤
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { specification: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // 分类过滤
      if (category) {
        whereClause.category = category;
      }

      const { count, rows } = await Material.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.success({
        materials: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取物资列表成功');
    } catch (error) {
      logger.error('获取物资列表失败:', error);
      res.error('获取物资列表失败', 500, 'MATERIALS_ERROR');
    }
  }

  /**
   * 创建物资
   */
  static async createMaterial(req: Request, res: Response) {
    try {
      const {
        name,
        code,
        category,
        specification,
        unit,
        unit_price,
        min_stock_level,
        max_stock_level,
        description
      } = req.body;

      // 检查物资编码是否已存在
      const existingMaterial = await Material.findOne({
        where: { code }
      });

      if (existingMaterial) {
        return res.error('物资编码已存在', 409, 'MATERIAL_CODE_EXISTS');
      }

      const material = await Material.create({
        name,
        code,
        category,
        specification,
        unit,
        unit_price,
        min_stock_level,
        max_stock_level,
        description,
        status: 'active'
      });

      res.success(material, '创建物资成功', 201);
    } catch (error) {
      logger.error('创建物资失败:', error);
      res.error('创建物资失败', 500, 'CREATE_MATERIAL_ERROR');
    }
  }

  /**
   * 更新物资
   */
  static async updateMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const material = await Material.findByPk(id);
      if (!material) {
        return res.error('物资不存在', 404, 'MATERIAL_NOT_FOUND');
      }

      // 如果更新编码，检查是否重复
      if (updateData.code && updateData.code !== material.code) {
        const existingMaterial = await Material.findOne({
          where: { code: updateData.code }
        });
        if (existingMaterial) {
          return res.error('物资编码已存在', 409, 'MATERIAL_CODE_EXISTS');
        }
      }

      await material.update(updateData);

      res.success(material, '更新物资成功');
    } catch (error) {
      logger.error('更新物资失败:', error);
      res.error('更新物资失败', 500, 'UPDATE_MATERIAL_ERROR');
    }
  }

  /**
   * 删除物资
   */
  static async deleteMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const material = await Material.findByPk(id);
      if (!material) {
        return res.error('物资不存在', 404, 'MATERIAL_NOT_FOUND');
      }

      // 检查是否有库存记录
      const inventoryCount = await MaterialInventory.count({
        where: { material_id: id }
      });

      if (inventoryCount > 0) {
        return res.error('该物资有库存记录，无法删除', 400, 'MATERIAL_HAS_INVENTORY');
      }

      await material.destroy();

      res.success(null, '删除物资成功');
    } catch (error) {
      logger.error('删除物资失败:', error);
      res.error('删除物资失败', 500, 'DELETE_MATERIAL_ERROR');
    }
  }

  // 库存管理

  /**
   * 获取库存列表
   */
  static async getInventory(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        material_id,
        base_id,
        low_stock_only
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

      // 物资过滤
      if (material_id) {
        whereClause.material_id = material_id;
      }

      const include: any[] = [
        {
          model: Material,
          as: 'material',
          attributes: ['id', 'name', 'code', 'unit', 'min_stock_level', 'max_stock_level']
        }
      ];

      // 低库存过滤
      if (low_stock_only === 'true') {
        include[0].where = {
          [Op.and]: [
            { min_stock_level: { [Op.gt]: 0 } },
            { '$MaterialInventory.current_stock$': { [Op.lt]: { [Op.col]: 'material.min_stock_level' } } }
          ]
        };
      }

      const { count, rows } = await MaterialInventory.findAndCountAll({
        where: whereClause,
        include,
        limit: Number(limit),
        offset,
        order: [['updated_at', 'DESC']]
      });

      res.success({
        inventory: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取库存列表成功');
    } catch (error) {
      logger.error('获取库存列表失败:', error);
      res.error('获取库存列表失败', 500, 'INVENTORY_ERROR');
    }
  }

  /**
   * 入库操作
   */
  static async stockIn(req: Request, res: Response) {
    try {
      const {
        material_id,
        base_id,
        quantity,
        unit_price,
        supplier,
        notes
      } = req.body;
      const operator_id = req.user?.id;

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以在任何基地操作
      } else if (dataPermission.baseId && base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能在所属基地进行入库操作', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法进行入库操作', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // 验证物资是否存在
      const material = await Material.findByPk(material_id);
      if (!material) {
        return res.error('指定的物资不存在', 404, 'MATERIAL_NOT_FOUND');
      }

      // 查找或创建库存记录
      let inventory = await MaterialInventory.findOne({
        where: { material_id, base_id }
      });

      if (!inventory) {
        inventory = await MaterialInventory.create({
          material_id,
          base_id,
          current_stock: 0,
          total_in: 0,
          total_out: 0
        });
      }

      // 更新库存
      const newStock = Number(inventory.current_stock) + Number(quantity);
      const newTotalIn = Number(inventory.total_in) + Number(quantity);

      await inventory.update({
        current_stock: newStock,
        total_in: newTotalIn
      });

      // 创建库存记录
      const record = await InventoryRecord.create({
        material_id,
        base_id,
        type: 'in',
        quantity,
        unit_price,
        supplier,
        notes,
        operator_id,
        balance_after: newStock
      });

      // 获取完整的记录信息
      const fullRecord = await InventoryRecord.findByPk(record.id, {
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['id', 'name', 'code', 'unit']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      res.success(fullRecord, '入库操作成功', 201);
    } catch (error) {
      logger.error('入库操作失败:', error);
      res.error('入库操作失败', 500, 'STOCK_IN_ERROR');
    }
  }

  /**
   * 出库操作
   */
  static async stockOut(req: Request, res: Response) {
    try {
      const {
        material_id,
        base_id,
        quantity,
        purpose,
        recipient,
        notes
      } = req.body;
      const operator_id = req.user?.id;

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以在任何基地操作
      } else if (dataPermission.baseId && base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能在所属基地进行出库操作', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法进行出库操作', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // 验证物资是否存在
      const material = await Material.findByPk(material_id);
      if (!material) {
        return res.error('指定的物资不存在', 404, 'MATERIAL_NOT_FOUND');
      }

      // 查找库存记录
      const inventory = await MaterialInventory.findOne({
        where: { material_id, base_id }
      });

      if (!inventory) {
        return res.error('该物资在此基地没有库存', 404, 'INVENTORY_NOT_FOUND');
      }

      // 检查库存是否足够
      if (Number(inventory.current_stock) < Number(quantity)) {
        return res.error('库存不足', 400, 'INSUFFICIENT_STOCK');
      }

      // 更新库存
      const newStock = Number(inventory.current_stock) - Number(quantity);
      const newTotalOut = Number(inventory.total_out) + Number(quantity);

      await inventory.update({
        current_stock: newStock,
        total_out: newTotalOut
      });

      // 创建库存记录
      const record = await InventoryRecord.create({
        material_id,
        base_id,
        type: 'out',
        quantity,
        purpose,
        recipient,
        notes,
        operator_id,
        balance_after: newStock
      });

      // 获取完整的记录信息
      const fullRecord = await InventoryRecord.findByPk(record.id, {
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['id', 'name', 'code', 'unit']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      res.success(fullRecord, '出库操作成功', 201);
    } catch (error) {
      logger.error('出库操作失败:', error);
      res.error('出库操作失败', 500, 'STOCK_OUT_ERROR');
    }
  }

  /**
   * 获取库存记录
   */
  static async getInventoryRecords(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        material_id,
        base_id,
        type,
        start_date,
        end_date
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

      // 物资过滤
      if (material_id) {
        whereClause.material_id = material_id;
      }

      // 类型过滤
      if (type) {
        whereClause.type = type;
      }

      // 日期范围过滤
      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) {
          whereClause.created_at[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.created_at[Op.lte] = end_date;
        }
      }

      const { count, rows } = await InventoryRecord.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['id', 'name', 'code', 'unit']
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.success({
        records: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取库存记录成功');
    } catch (error) {
      logger.error('获取库存记录失败:', error);
      res.error('获取库存记录失败', 500, 'INVENTORY_RECORDS_ERROR');
    }
  }

  /**
   * 获取物资统计信息
   */
  static async getMaterialStatistics(req: Request, res: Response) {
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

      // 日期过滤
      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) {
          whereClause.created_at[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.created_at[Op.lte] = end_date;
        }
      }

      // 获取库存记录
      const records = await InventoryRecord.findAll({
        where: whereClause,
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['id', 'name', 'category']
          }
        ]
      });

      // 获取当前库存
      const inventoryWhereClause: any = {};
      if (!dataPermission || dataPermission.canAccessAllBases) {
        if (base_id) {
          inventoryWhereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        inventoryWhereClause.base_id = dataPermission.baseId;
      } else {
        inventoryWhereClause.base_id = -1;
      }

      const inventory = await MaterialInventory.findAll({
        where: inventoryWhereClause,
        include: [
          {
            model: Material,
            as: 'material',
            attributes: ['id', 'name', 'min_stock_level']
          }
        ]
      });

      // 计算统计数据
      const totalRecords = records.length;
      const inRecords = records.filter(r => r.type === 'in').length;
      const outRecords = records.filter(r => r.type === 'out').length;

      // 低库存物资
      const lowStockItems = inventory.filter(item => {
        const material = (item as any).material;
        return material?.min_stock_level > 0 && item.current_stock < material.min_stock_level;
      }).length;

      // 按分类统计
      const categoryStats = records.reduce((acc, record) => {
        const category = (record as any).material?.category || '未分类';
        if (!acc[category]) {
          acc[category] = { in: 0, out: 0 };
        }
        if (record.type === 'in') {
          acc[category].in += Number(record.quantity);
        } else {
          acc[category].out += Number(record.quantity);
        }
        return acc;
      }, {} as Record<string, { in: number; out: number }>);

      // 按日期统计
      const dailyStats = records.reduce((acc, record) => {
        const date = record.created_at.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { in: 0, out: 0 };
        }
        if (record.type === 'in') {
          acc[date].in += Number(record.quantity);
        } else {
          acc[date].out += Number(record.quantity);
        }
        return acc;
      }, {} as Record<string, { in: number; out: number }>);

      const statistics = {
        overview: {
          total_records: totalRecords,
          in_records: inRecords,
          out_records: outRecords,
          low_stock_items: lowStockItems,
          total_materials: inventory.length
        },
        category_statistics: categoryStats,
        daily_statistics: dailyStats
      };

      res.success(statistics, '获取物资统计信息成功');
    } catch (error) {
      logger.error('获取物资统计信息失败:', error);
      res.error('获取物资统计信息失败', 500, 'MATERIAL_STATISTICS_ERROR');
    }
  }
}