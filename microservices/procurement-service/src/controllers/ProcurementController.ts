import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ProcurementOrder, Supplier, User } from '../models';
import { logger } from '../utils/logger';

export class ProcurementController {
  // 采购订单管理

  /**
   * 获取采购订单列表
   */
  static async getProcurementOrders(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        supplier_id,
        start_date,
        end_date,
        base_id
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

      // 状态过滤
      if (status) {
        whereClause.status = status;
      }

      // 供应商过滤
      if (supplier_id) {
        whereClause.supplier_id = supplier_id;
      }

      // 日期范围过滤
      if (start_date || end_date) {
        whereClause.order_date = {};
        if (start_date) {
          whereClause.order_date[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.order_date[Op.lte] = end_date;
        }
      }

      const { count, rows } = await ProcurementOrder.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['order_date', 'DESC'], ['created_at', 'DESC']]
      });

      res.success({
        orders: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取采购订单列表成功');
    } catch (error) {
      logger.error('获取采购订单列表失败:', error);
      res.error('获取采购订单列表失败', 500, 'PROCUREMENT_ORDERS_ERROR');
    }
  }

  /**
   * 创建采购订单
   */
  static async createProcurementOrder(req: Request, res: Response) {
    try {
      const {
        supplier_id,
        base_id,
        items,
        total_amount,
        order_date,
        expected_delivery_date,
        notes
      } = req.body;
      const created_by = req.user?.id;

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以在任何基地创建订单
      } else if (dataPermission.baseId && base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能在所属基地创建采购订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法创建采购订单', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // 验证供应商是否存在
      const supplier = await Supplier.findByPk(supplier_id);
      if (!supplier) {
        return res.error('指定的供应商不存在', 404, 'SUPPLIER_NOT_FOUND');
      }

      // 生成订单编号
      const orderNumber = `PO${Date.now()}`;

      const order = await ProcurementOrder.create({
        order_number: orderNumber,
        supplier_id,
        base_id,
        items,
        total_amount,
        order_date,
        expected_delivery_date,
        notes,
        status: 'pending',
        created_by
      });

      // 获取完整的订单信息
      const fullOrder = await ProcurementOrder.findByPk(order.id, {
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      res.success(fullOrder, '创建采购订单成功', 201);
    } catch (error) {
      logger.error('创建采购订单失败:', error);
      res.error('创建采购订单失败', 500, 'CREATE_PROCUREMENT_ORDER_ERROR');
    }
  }

  /**
   * 更新采购订单
   */
  static async updateProcurementOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const order = await ProcurementOrder.findByPk(id);
      if (!order) {
        return res.error('采购订单不存在', 404, 'PROCUREMENT_ORDER_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以更新任何订单
      } else if (dataPermission.baseId && order.base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能更新所属基地的采购订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法更新采购订单', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      await order.update(updateData);

      // 获取更新后的完整订单信息
      const updatedOrder = await ProcurementOrder.findByPk(order.id, {
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      res.success(updatedOrder, '更新采购订单成功');
    } catch (error) {
      logger.error('更新采购订单失败:', error);
      res.error('更新采购订单失败', 500, 'UPDATE_PROCUREMENT_ORDER_ERROR');
    }
  }

  /**
   * 删除采购订单
   */
  static async deleteProcurementOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const order = await ProcurementOrder.findByPk(id);
      if (!order) {
        return res.error('采购订单不存在', 404, 'PROCUREMENT_ORDER_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以删除任何订单
      } else if (dataPermission.baseId && order.base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能删除所属基地的采购订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法删除采购订单', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // 只有待处理状态的订单才能删除
      if (order.status !== 'pending') {
        return res.error('只有待处理状态的订单才能删除', 400, 'INVALID_ORDER_STATUS');
      }

      await order.destroy();

      res.success(null, '删除采购订单成功');
    } catch (error) {
      logger.error('删除采购订单失败:', error);
      res.error('删除采购订单失败', 500, 'DELETE_PROCUREMENT_ORDER_ERROR');
    }
  }

  // 供应商管理

  /**
   * 获取供应商列表
   */
  static async getSuppliers(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status = 'active'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = { status };

      // 搜索过滤
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { contact_person: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Supplier.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.success({
        suppliers: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取供应商列表成功');
    } catch (error) {
      logger.error('获取供应商列表失败:', error);
      res.error('获取供应商列表失败', 500, 'SUPPLIERS_ERROR');
    }
  }

  /**
   * 创建供应商
   */
  static async createSupplier(req: Request, res: Response) {
    try {
      const {
        name,
        contact_person,
        phone,
        email,
        address,
        business_license,
        notes
      } = req.body;

      // 检查供应商名称是否已存在
      const existingSupplier = await Supplier.findOne({
        where: { name }
      });

      if (existingSupplier) {
        return res.error('供应商名称已存在', 409, 'SUPPLIER_NAME_EXISTS');
      }

      const supplier = await Supplier.create({
        name,
        contact_person,
        phone,
        email,
        address,
        business_license,
        notes,
        status: 'active'
      });

      res.success(supplier, '创建供应商成功', 201);
    } catch (error) {
      logger.error('创建供应商失败:', error);
      res.error('创建供应商失败', 500, 'CREATE_SUPPLIER_ERROR');
    }
  }

  /**
   * 更新供应商
   */
  static async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        return res.error('供应商不存在', 404, 'SUPPLIER_NOT_FOUND');
      }

      // 如果更新名称，检查是否重复
      if (updateData.name && updateData.name !== supplier.name) {
        const existingSupplier = await Supplier.findOne({
          where: { name: updateData.name }
        });
        if (existingSupplier) {
          return res.error('供应商名称已存在', 409, 'SUPPLIER_NAME_EXISTS');
        }
      }

      await supplier.update(updateData);

      res.success(supplier, '更新供应商成功');
    } catch (error) {
      logger.error('更新供应商失败:', error);
      res.error('更新供应商失败', 500, 'UPDATE_SUPPLIER_ERROR');
    }
  }

  /**
   * 删除供应商
   */
  static async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        return res.error('供应商不存在', 404, 'SUPPLIER_NOT_FOUND');
      }

      // 检查是否有关联的采购订单
      const orderCount = await ProcurementOrder.count({
        where: { supplier_id: id }
      });

      if (orderCount > 0) {
        return res.error('该供应商有关联的采购订单，无法删除', 400, 'SUPPLIER_HAS_ORDERS');
      }

      await supplier.destroy();

      res.success(null, '删除供应商成功');
    } catch (error) {
      logger.error('删除供应商失败:', error);
      res.error('删除供应商失败', 500, 'DELETE_SUPPLIER_ERROR');
    }
  }

  /**
   * 获取采购统计信息
   */
  static async getProcurementStatistics(req: Request, res: Response) {
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
        whereClause.order_date = {};
        if (start_date) {
          whereClause.order_date[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.order_date[Op.lte] = end_date;
        }
      }

      const orders = await ProcurementOrder.findAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name']
          }
        ]
      });

      // 计算统计数据
      const totalOrders = orders.length;
      const totalAmount = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);

      // 按状态统计
      const statusStats = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 按供应商统计
      const supplierStats = orders.reduce((acc, order) => {
        const supplierName = (order as any).supplier?.name || '未知供应商';
        if (!acc[supplierName]) {
          acc[supplierName] = { count: 0, amount: 0 };
        }
        acc[supplierName].count += 1;
        acc[supplierName].amount += Number(order.total_amount);
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      // 按月份统计
      const monthlyStats = orders.reduce((acc, order) => {
        const month = new Date(order.order_date).toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { count: 0, amount: 0 };
        }
        acc[month].count += 1;
        acc[month].amount += Number(order.total_amount);
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      const statistics = {
        overview: {
          total_orders: totalOrders,
          total_amount: totalAmount,
          average_amount: totalOrders > 0 ? totalAmount / totalOrders : 0
        },
        status_statistics: statusStats,
        supplier_statistics: supplierStats,
        monthly_statistics: monthlyStats
      };

      res.success(statistics, '获取采购统计信息成功');
    } catch (error) {
      logger.error('获取采购统计信息失败:', error);
      res.error('获取采购统计信息失败', 500, 'PROCUREMENT_STATISTICS_ERROR');
    }
  }
}