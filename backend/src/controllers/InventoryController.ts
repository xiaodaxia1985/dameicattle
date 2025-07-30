import { Request, Response } from 'express';
import { Op, Transaction } from 'sequelize';
import { 
  Inventory, 
  InventoryTransaction, 
  InventoryAlert,
  ProductionMaterial, 
  MaterialCategory,
  Base,
  User,
  sequelize
} from '@/models';
import { AppError } from '@/utils/errors';

export class InventoryController {
  // Get inventory list with optional filters
  async getInventory(req: Request, res: Response) {
    try {
      const { base_id, material_id, low_stock, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员：如果指定了base_id参数，则按base_id过滤，否则显示所有库存
        if (base_id) {
          whereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的库存
        whereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不显示任何库存
        whereClause.base_id = -1;
      }

      if (material_id) {
        whereClause.material_id = material_id;
      }

      const { count, rows: inventory } = await Inventory.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ProductionMaterial,
            as: 'material',
            include: [
              {
                model: MaterialCategory,
                as: 'category',
                attributes: ['id', 'name', 'code'],
              },
            ],
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['last_updated', 'DESC']],
      });

      // Filter low stock items if requested
      let filteredInventory = inventory;
      if (low_stock === 'true') {
        filteredInventory = inventory.filter(item => 
          item.current_stock <= (item.material as any).safety_stock
        );
      }

      res.json({
        success: true,
        data: filteredInventory,
        pagination: {
          total: low_stock === 'true' ? filteredInventory.length : count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil((low_stock === 'true' ? filteredInventory.length : count) / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取库存信息失败', 500);
    }
  }

  // Get inventory statistics
  async getInventoryStatistics(req: Request, res: Response) {
    try {
      const { base_id } = req.query;
      const whereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员：如果指定了base_id参数，则按base_id过滤，否则显示所有库存统计
        if (base_id) {
          whereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        // 基地用户：只能查看所属基地的库存统计
        whereClause.base_id = dataPermission.baseId;
      } else {
        // 没有基地权限的用户，不显示任何库存统计
        whereClause.base_id = -1;
      }

      // Get total inventory value and low stock count
      const inventoryStats = await Inventory.findAll({
        where: whereClause,
        include: [
          {
            model: ProductionMaterial,
            as: 'material',
            attributes: ['safety_stock', 'purchase_price'],
          },
        ],
      });

      let totalValue = 0;
      let lowStockCount = 0;
      let totalItems = inventoryStats.length;

      inventoryStats.forEach(item => {
        const material = item.material as any;
        totalValue += item.current_stock * (material.purchase_price || 0);
        if (item.current_stock <= material.safety_stock) {
          lowStockCount++;
        }
      });

      // Get recent transactions count
      const recentTransactionsCount = await InventoryTransaction.count({
        where: {
          transaction_date: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
          ...(base_id && { base_id: Number(base_id) }),
        },
      });

      // Get active alerts count
      const activeAlertsCount = await InventoryAlert.count({
        where: {
          is_resolved: false,
          ...(base_id && { base_id: Number(base_id) }),
        },
      });

      res.json({
        success: true,
        data: {
          totalItems,
          totalValue: totalValue.toFixed(2),
          lowStockCount,
          recentTransactionsCount,
          activeAlertsCount,
        },
      });
    } catch (error) {
      throw new AppError('获取库存统计失败', 500);
    }
  }

  // Create inventory transaction (inbound/outbound)
  async createInventoryTransaction(req: Request, res: Response) {
    const transaction: Transaction = await sequelize.transaction();

    try {
      const {
        material_id,
        base_id,
        transaction_type,
        quantity,
        unit_price,
        reference_type,
        reference_id,
        batch_number,
        expiry_date,
        remark,
      } = req.body;

      const operator_id = (req as any).user.id;

      // Verify material and base exist
      const material = await ProductionMaterial.findByPk(material_id);
      if (!material) {
        throw new AppError('物资不存在', 400);
      }

      const base = await Base.findByPk(base_id);
      if (!base) {
        throw new AppError('基地不存在', 400);
      }

      // Get or create inventory record
      let inventory = await Inventory.findOne({
        where: { material_id, base_id },
        transaction,
      });

      if (!inventory) {
        inventory = await Inventory.create({
          material_id,
          base_id,
          current_stock: 0,
          reserved_stock: 0,
        }, { transaction });
      }

      // Calculate new stock based on transaction type
      let newStock = inventory.current_stock;
      const quantityNum = parseFloat(quantity);

      switch (transaction_type) {
        case '入库':
          newStock += quantityNum;
          break;
        case '出库':
          if (newStock < quantityNum) {
            throw new AppError('库存不足，无法出库', 400);
          }
          newStock -= quantityNum;
          break;
        case '调拨':
          // For transfer, this would be the outbound part
          if (newStock < quantityNum) {
            throw new AppError('库存不足，无法调拨', 400);
          }
          newStock -= quantityNum;
          break;
        case '盘点':
          // For inventory check, quantity represents the actual counted stock
          newStock = quantityNum;
          break;
        default:
          throw new AppError('无效的交易类型', 400);
      }

      // Update inventory
      await inventory.update({
        current_stock: newStock,
        last_updated: new Date(),
      }, { transaction });

      // Create transaction record
      const inventoryTransaction = await InventoryTransaction.create({
        material_id,
        base_id,
        transaction_type,
        quantity: transaction_type === '出库' || transaction_type === '调拨' ? -quantityNum : quantityNum,
        unit_price,
        reference_type,
        reference_id,
        batch_number,
        expiry_date,
        operator_id,
        remark,
      }, { transaction });

      // Check for low stock alert
      if (newStock <= material.safety_stock) {
        await this.createLowStockAlert(material_id, base_id, newStock, material.safety_stock, transaction);
      }

      await transaction.commit();

      // Load associations for response
      await inventoryTransaction.reload({
        include: [
          { model: ProductionMaterial, as: 'material' },
          { model: Base, as: 'base' },
          { model: User, as: 'operator', attributes: ['id', 'real_name'] },
        ],
      });

      res.status(201).json({
        success: true,
        data: inventoryTransaction,
        message: '库存操作成功',
      });
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) throw error;
      throw new AppError('库存操作失败', 500);
    }
  }

  // Get inventory transactions
  async getInventoryTransactions(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        material_id,
        base_id,
        transaction_type,
        start_date,
        end_date,
      } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};

      if (material_id) {
        whereClause.material_id = material_id;
      }

      if (base_id) {
        whereClause.base_id = base_id;
      }

      if (transaction_type) {
        whereClause.transaction_type = transaction_type;
      }

      if (start_date || end_date) {
        whereClause.transaction_date = {};
        if (start_date) {
          whereClause.transaction_date[Op.gte] = new Date(start_date as string);
        }
        if (end_date) {
          whereClause.transaction_date[Op.lte] = new Date(end_date as string);
        }
      }

      const { count, rows: transactions } = await InventoryTransaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ProductionMaterial,
            as: 'material',
            attributes: ['id', 'name', 'code', 'unit'],
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['transaction_date', 'DESC']],
      });

      res.json({
        success: true,
        data: transactions,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取库存交易记录失败', 500);
    }
  }

  // Get inventory alerts
  async getInventoryAlerts(req: Request, res: Response) {
    try {
      const { base_id, resolved, page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};

      if (base_id) {
        whereClause.base_id = base_id;
      }

      if (resolved !== undefined) {
        whereClause.is_resolved = resolved === 'true';
      }

      const { count, rows: alerts } = await InventoryAlert.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ProductionMaterial,
            as: 'material',
            attributes: ['id', 'name', 'code', 'unit'],
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: alerts,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取库存预警失败', 500);
    }
  }

  // Resolve inventory alert
  async resolveInventoryAlert(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const alert = await InventoryAlert.findByPk(id);
      if (!alert) {
        throw new AppError('预警记录不存在', 404);
      }

      await alert.update({
        is_resolved: true,
        resolved_at: new Date(),
      });

      res.json({
        success: true,
        data: alert,
        message: '预警已解决',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('解决预警失败', 500);
    }
  }

  // Private method to create low stock alert
  private async createLowStockAlert(
    material_id: number,
    base_id: number,
    current_stock: number,
    safety_stock: number,
    transaction?: Transaction
  ) {
    // Check if there's already an unresolved low stock alert
    const existingAlert = await InventoryAlert.findOne({
      where: {
        material_id,
        base_id,
        alert_type: '低库存',
        is_resolved: false,
      },
      transaction,
    });

    if (!existingAlert) {
      await InventoryAlert.create({
        material_id,
        base_id,
        alert_type: '低库存',
        alert_level: current_stock <= safety_stock * 0.5 ? 'high' : 'medium',
        message: `当前库存 ${current_stock} 已低于安全库存 ${safety_stock}`,
      }, { transaction });
    }
  }

  // Get inventory by material and base
  async getInventoryByMaterialAndBase(req: Request, res: Response) {
    try {
      const { material_id, base_id } = req.params;

      const inventory = await Inventory.findOne({
        where: { material_id, base_id },
        include: [
          {
            model: ProductionMaterial,
            as: 'material',
            include: [
              {
                model: MaterialCategory,
                as: 'category',
                attributes: ['id', 'name', 'code'],
              },
            ],
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      if (!inventory) {
        throw new AppError('库存记录不存在', 404);
      }

      // Get recent transactions for this inventory
      const recentTransactions = await InventoryTransaction.findAll({
        where: { material_id, base_id },
        include: [
          {
            model: User,
            as: 'operator',
            attributes: ['id', 'real_name'],
          },
        ],
        limit: 10,
        order: [['transaction_date', 'DESC']],
      });

      res.json({
        success: true,
        data: {
          inventory,
          recentTransactions,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('获取库存详情失败', 500);
    }
  }
}