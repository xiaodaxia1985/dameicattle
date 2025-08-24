import { Request, Response, NextFunction } from 'express';

export class  {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: [] });
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json({ data: req.body });
    } catch (error) {
      next(error);
    }
  }
}
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

      // 状态过�?
      if (status) {
        whereClause.status = status;
      }

      // 供应商过�?
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

      (res as any).success({
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
      (res as any).error('获取采购订单列表失败', 500, 'PROCUREMENT_ORDERS_ERROR');
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

      // 数据权限检�?
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以在任何基地创建订单
      } else if (dataPermission.baseId && base_id !== dataPermission.baseId) {
        return (res as any).error('权限不足，只能在所属基地创建采购订�?, 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return (res as any).error('没有基地权限，无法创建采购订�?, 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // 验证供应商是否存�?
      const supplier = await Supplier.findByPk(supplier_id);
      if (!supplier) {
        return (res as any).error('指定的供应商不存�?, 404, 'SUPPLIER_NOT_FOUND');
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

      // 获取完整的订单信�?
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

      (res as any).success(fullOrder, '创建采购订单成功', 201);
    } catch (error) {
      logger.error('创建采购订单失败:', error);
      (res as any).error('创建采购订单失败', 500, 'CREATE_PROCUREMENT_ORDER_ERROR');
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
        return (res as any).error('采购订单不存�?, 404, 'PROCUREMENT_ORDER_NOT_FOUND');
      }

      // 数据权限检�?
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以更新任何订�?
      } else if (dataPermission.baseId && order.base_id !== dataPermission.baseId) {
        return (res as any).error('权限不足，只能更新所属基地的采购订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return (res as any).error('没有基地权限，无法更新采购订�?, 403, 'INSUFFICIENT_PERMISSIONS');
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

      (res as any).success(updatedOrder, '更新采购订单成功');
    } catch (error) {
      logger.error('更新采购订单失败:', error);
      (res as any).error('更新采购订单失败', 500, 'UPDATE_PROCUREMENT_ORDER_ERROR');
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
        return (res as any).error('采购订单不存�?, 404, 'PROCUREMENT_ORDER_NOT_FOUND');
      }

      // 数据权限检�?
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以删除任何订�?
      } else if (dataPermission.baseId && order.base_id !== dataPermission.baseId) {
        return (res as any).error('权限不足，只能删除所属基地的采购订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return (res as any).error('没有基地权限，无法删除采购订�?, 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // 只有待处理状态的订单才能删除
      if (order.status !== 'pending') {
        return (res as any).error('只有待处理状态的订单才能删除', 400, 'INVALID_ORDER_STATUS');
      }

      await order.destroy();

      (res as any).success(null, '删除采购订单成功');
    } catch (error) {
      logger.error('删除采购订单失败:', error);
      (res as any).error('删除采购订单失败', 500, 'DELETE_PROCUREMENT_ORDER_ERROR');
    }
  }

  // 供应商管�?

  /**
   * 获取供应商列�?
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

      (res as any).success({
        suppliers: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取供应商列表成�?);
    } catch (error) {
      logger.error('获取供应商列表失�?', error);
      (res as any).error('获取供应商列表失�?, 500, 'SUPPLIERS_ERROR');
    }
  }

  /**
   * 创建供应�?
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

      // 检查供应商名称是否已存�?
      const existingSupplier = await Supplier.findOne({
        where: { name }
      });

      if (existingSupplier) {
        return (res as any).error('供应商名称已存在', 409, 'SUPPLIER_NAME_EXISTS');
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

      (res as any).success(supplier, '创建供应商成�?, 201);
    } catch (error) {
      logger.error('创建供应商失�?', error);
      (res as any).error('创建供应商失�?, 500, 'CREATE_SUPPLIER_ERROR');
    }
  }

  /**
   * 更新供应�?
   */
  static async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        return (res as any).error('供应商不存在', 404, 'SUPPLIER_NOT_FOUND');
      }

      // 如果更新名称，检查是否重�?
      if (updateData.name && updateData.name !== supplier.name) {
        const existingSupplier = await Supplier.findOne({
          where: { name: updateData.name }
        });
        if (existingSupplier) {
          return (res as any).error('供应商名称已存在', 409, 'SUPPLIER_NAME_EXISTS');
        }
      }

      await supplier.update(updateData);

      (res as any).success(supplier, '更新供应商成�?);
    } catch (error) {
      logger.error('更新供应商失�?', error);
      (res as any).error('更新供应商失�?, 500, 'UPDATE_SUPPLIER_ERROR');
    }
  }

  /**
   * 删除供应�?
   */
  static async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        return (res as any).error('供应商不存在', 404, 'SUPPLIER_NOT_FOUND');
      }

      // 检查是否有关联的采购订�?
      const orderCount = await ProcurementOrder.count({
        where: { supplier_id: id }
      });

      if (orderCount > 0) {
        return (res as any).error('该供应商有关联的采购订单，无法删�?, 400, 'SUPPLIER_HAS_ORDERS');
      }

      await supplier.destroy();

      (res as any).success(null, '删除供应商成�?);
    } catch (error) {
      logger.error('删除供应商失�?', error);
      (res as any).error('删除供应商失�?, 500, 'DELETE_SUPPLIER_ERROR');
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

      // 按状态统�?
      const statusStats = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 按供应商统计
      const supplierStats = orders.reduce((acc, order) => {
        const supplierName = (order as any).supplier?.name || '未知供应�?;
        if (!acc[supplierName]) {
          acc[supplierName] = { count: 0, amount: 0 };
        }
        acc[supplierName].count += 1;
        acc[supplierName].amount += Number(order.total_amount);
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      // 按月份统�?
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

      (res as any).success(statistics, '获取采购统计信息成功');
    } catch (error) {
      logger.error('获取采购统计信息失败:', error);
      (res as any).error('获取采购统计信息失败', 500, 'PROCUREMENT_STATISTICS_ERROR');
    }
  }
}
import { Request, Response } from 'express'
import { Op, Transaction } from 'sequelize'
import { ProcurementOrder, ProcurementOrderItem } from '../models/ProcurementOrder'
import { Supplier } from '../models/Supplier'
import { sequelize } from '../config/database'
import { logger } from '../utils/logger'
import { generateOrderNumber } from '../utils/orderNumber'

export class ProcurementOrderController {
  /**
   * 获取采购订单列表
   */
  async getOrders(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        orderNumber,
        supplierId,
        baseId,
        orderType,
        status,
        startDate,
        endDate
      } = req.query

      const offset = (Number(page) - 1) * Number(limit)
      
      // 构建查询条件
      const whereConditions: any = {}
      
      if (orderNumber) {
        whereConditions.orderNumber = {
          [Op.iLike]: `%${orderNumber}%`
        }
      }
      
      if (supplierId) {
        whereConditions.supplierId = Number(supplierId)
      }
      
      if (baseId) {
        whereConditions.baseId = Number(baseId)
      }
      
      if (orderType) {
        whereConditions.orderType = orderType
      }
      
      if (status) {
        whereConditions.status = status
      }
      
      if (startDate && endDate) {
        whereConditions.orderDate = {
          [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
        }
      } else if (startDate) {
        whereConditions.orderDate = {
          [Op.gte]: new Date(startDate as string)
        }
      } else if (endDate) {
        whereConditions.orderDate = {
          [Op.lte]: new Date(endDate as string)
        }
      }

      // 查询订单列表
      const { count, rows } = await ProcurementOrder.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: ProcurementOrderItem,
            as: 'items',
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      })

      res.json({
        success: true,
        data: {
          orders: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        },
        message: '获取采购订单列表成功'
      })
    } catch (error) {
      logger.error('获取采购订单列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取采购订单列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 获取采购订单详情
   */
  async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const order = await ProcurementOrder.findByPk(id, {
        include: [
          {
            model: ProcurementOrderItem,
            as: 'items'
          }
        ]
      })

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '采购订单不存�?,
          code: 'ORDER_NOT_FOUND'
        })
      }

      res.json({
        success: true,
        data: { order },
        message: '获取采购订单详情成功'
      })
    } catch (error) {
      logger.error('获取采购订单详情失败:', error)
      res.status(500).json({
        success: false,
        message: '获取采购订单详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 创建采购订单
   */
  async createOrder(req: Request, res: Response) {
    const transaction: Transaction = await sequelize.transaction()
    
    try {
      const {
        supplierId,
        supplierName,
        baseId,
        baseName,
        orderType,
        orderDate,
        expectedDeliveryDate,
        paymentMethod,
        contractNumber,
        remark,
        taxAmount = 0,
        discountAmount = 0,
        items = []
      } = req.body

      const user = (req as any).user

      // 验证必填字段
      if (!supplierId || !supplierName || !baseId || !baseName || !orderType || !orderDate) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: '请提供必要的订单信息',
          code: 'MISSING_REQUIRED_FIELDS'
        })
      }

      if (!Array.isArray(items) || items.length === 0) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: '订单必须包含至少一个商�?,
          code: 'NO_ORDER_ITEMS'
        })
      }

      // 生成订单�?
      const orderNumber = await generateOrderNumber()

      // 计算订单总金�?
      const subtotal = items.reduce((sum: number, item: any) => {
        return sum + (Number(item.quantity) * Number(item.unitPrice))
      }, 0)
      const totalAmount = subtotal + Number(taxAmount) - Number(discountAmount)

      // 创建采购订单
      const order = await ProcurementOrder.create({
        orderNumber,
        supplierId: Number(supplierId),
        supplierName,
        baseId: Number(baseId),
        baseName,
        orderType,
        orderDate: new Date(orderDate),
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        paymentMethod,
        contractNumber,
        remark,
        taxAmount: Number(taxAmount),
        discountAmount: Number(discountAmount),
        totalAmount,
        createdBy: user.id,
        createdByName: user.name
      }, { transaction })

      // 创建订单明细
      const orderItems = items.map((item: any) => ({
        orderId: order.id,
        itemName: item.itemName,
        specification: item.specification,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.quantity) * Number(item.unitPrice),
        remark: item.remark
      }))

      await ProcurementOrderItem.bulkCreate(orderItems, { transaction })

      await transaction.commit()

      // 重新查询完整的订单信�?
      const createdOrder = await ProcurementOrder.findByPk(order.id, {
        include: [
          {
            model: ProcurementOrderItem,
            as: 'items'
          }
        ]
      })

      res.status(201).json({
        success: true,
        data: { order: createdOrder },
        message: '创建采购订单成功'
      })
    } catch (error) {
      await transaction.rollback()
      logger.error('创建采购订单失败:', error)
      res.status(500).json({
        success: false,
        message: '创建采购订单失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 更新采购订单
   */
  async updateOrder(req: Request, res: Response) {
    const transaction: Transaction = await sequelize.transaction()
    
    try {
      const { id } = req.params
      const {
        supplierId,
        supplierName,
        baseId,
        baseName,
        orderType,
        orderDate,
        expectedDeliveryDate,
        paymentMethod,
        contractNumber,
        remark,
        taxAmount = 0,
        discountAmount = 0,
        items = []
      } = req.body

      const order = await ProcurementOrder.findByPk(id, { transaction })

      if (!order) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: '采购订单不存�?,
          code: 'ORDER_NOT_FOUND'
        })
      }

      // 只有待审批状态的订单才能编辑
      if (order.status !== 'pending') {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: '只有待审批状态的订单才能编辑',
          code: 'ORDER_NOT_EDITABLE'
        })
      }

      // 计算订单总金�?
      const subtotal = items.reduce((sum: number, item: any) => {
        return sum + (Number(item.quantity) * Number(item.unitPrice))
      }, 0)
      const totalAmount = subtotal + Number(taxAmount) - Number(discountAmount)

      // 更新订单基本信息
      await order.update({
        supplierId: Number(supplierId),
        supplierName,
        baseId: Number(baseId),
        baseName,
        orderType,
        orderDate: new Date(orderDate),
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        paymentMethod,
        contractNumber,
        remark,
        taxAmount: Number(taxAmount),
        discountAmount: Number(discountAmount),
        totalAmount
      }, { transaction })

      // 删除原有的订单明�?
      await ProcurementOrderItem.destroy({
        where: { orderId: order.id },
        transaction
      })

      // 创建新的订单明细
      const orderItems = items.map((item: any) => ({
        orderId: order.id,
        itemName: item.itemName,
        specification: item.specification,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.quantity) * Number(item.unitPrice),
        remark: item.remark
      }))

      await ProcurementOrderItem.bulkCreate(orderItems, { transaction })

      await transaction.commit()

      // 重新查询完整的订单信�?
      const updatedOrder = await ProcurementOrder.findByPk(order.id, {
        include: [
          {
            model: ProcurementOrderItem,
            as: 'items'
          }
        ]
      })

      res.json({
        success: true,
        data: { order: updatedOrder },
        message: '更新采购订单成功'
      })
    } catch (error) {
      await transaction.rollback()
      logger.error('更新采购订单失败:', error)
      res.status(500).json({
        success: false,
        message: '更新采购订单失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 审批采购订单
   */
  async approveOrder(req: Request, res: Response) {
    try {
      const { id } = req.params
      const user = (req as any).user

      const order = await ProcurementOrder.findByPk(id)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '采购订单不存�?,
          code: 'ORDER_NOT_FOUND'
        })
      }

      if (order.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: '只有待审批状态的订单才能审批',
          code: 'ORDER_NOT_APPROVABLE'
        })
      }

      // 更新订单状�?
      await order.update({
        status: 'approved',
        approvedBy: user.id,
        approvedByName: user.name,
        approvedAt: new Date()
      })

      // 重新查询完整的订单信�?
      const approvedOrder = await ProcurementOrder.findByPk(order.id, {
        include: [
          {
            model: ProcurementOrderItem,
            as: 'items'
          }
        ]
      })

      res.json({
        success: true,
        data: { order: approvedOrder },
        message: '审批采购订单成功'
      })
    } catch (error) {
      logger.error('审批采购订单失败:', error)
      res.status(500).json({
        success: false,
        message: '审批采购订单失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 取消采购订单
   */
  async cancelOrder(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { reason } = req.body
      const user = (req as any).user

      const order = await ProcurementOrder.findByPk(id)

      if (!order) {
        return res.status(404).json({
          success: false,
          message: '采购订单不存�?,
          code: 'ORDER_NOT_FOUND'
        })
      }

      if (!['pending', 'approved'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: '只有待审批或已审批状态的订单才能取消',
          code: 'ORDER_NOT_CANCELLABLE'
        })
      }

      // 更新订单状�?
      await order.update({
        status: 'cancelled',
        cancelReason: reason || '用户手动取消',
        cancelledBy: user.id,
        cancelledByName: user.name,
        cancelledAt: new Date()
      })

      // 重新查询完整的订单信�?
      const cancelledOrder = await ProcurementOrder.findByPk(order.id, {
        include: [
          {
            model: ProcurementOrderItem,
            as: 'items'
          }
        ]
      })

      res.json({
        success: true,
        data: { order: cancelledOrder },
        message: '取消采购订单成功'
      })
    } catch (error) {
      logger.error('取消采购订单失败:', error)
      res.status(500).json({
        success: false,
        message: '取消采购订单失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 批量审批订单
   */
  async batchApproveOrders(req: Request, res: Response) {
    const transaction: Transaction = await sequelize.transaction()
    
    try {
      const { orderIds } = req.body
      const user = (req as any).user

      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: '请提供要审批的订单ID列表',
          code: 'INVALID_INPUT'
        })
      }

      const approvedOrders = []
      const errors = []

      for (const orderId of orderIds) {
        try {
          const order = await ProcurementOrder.findByPk(orderId, { transaction })
          
          if (!order) {
            errors.push({ orderId, message: '订单不存�? })
            continue
          }

          if (order.status !== 'pending') {
            errors.push({ orderId, message: '订单状态不允许审批' })
            continue
          }

          await order.update({
            status: 'approved',
            approvedBy: user.id,
            approvedByName: user.name,
            approvedAt: new Date()
          }, { transaction })

          approvedOrders.push(order)
        } catch (error) {
          errors.push({ orderId, message: '审批失败' })
        }
      }

      await transaction.commit()

      res.json({
        success: true,
        data: {
          approvedOrders,
          errors,
          summary: {
            total: orderIds.length,
            approved: approvedOrders.length,
            failed: errors.length
          }
        },
        message: `批量审批完成，成�?${approvedOrders.length} 个，失败 ${errors.length} 个`
      })
    } catch (error) {
      await transaction.rollback()
      logger.error('批量审批订单失败:', error)
      res.status(500).json({
        success: false,
        message: '批量审批订单失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 删除采购订单
   */
  async deleteOrder(req: Request, res: Response) {
    const transaction: Transaction = await sequelize.transaction()
    
    try {
      const { id } = req.params

      const order = await ProcurementOrder.findByPk(id, { transaction })

      if (!order) {
        await transaction.rollback()
        return res.status(404).json({
          success: false,
          message: '采购订单不存�?,
          code: 'ORDER_NOT_FOUND'
        })
      }

      // 只有待审批状态的订单才能删除
      if (order.status !== 'pending') {
        await transaction.rollback()
        return res.status(400).json({
          success: false,
          message: '只有待审批状态的订单才能删除',
          code: 'ORDER_NOT_DELETABLE'
        })
      }

      // 删除订单明细
      await ProcurementOrderItem.destroy({
        where: { orderId: order.id },
        transaction
      })

      // 删除订单
      await order.destroy({ transaction })

      await transaction.commit()

      res.json({
        success: true,
        message: '删除采购订单成功'
      })
    } catch (error) {
      await transaction.rollback()
      logger.error('删除采购订单失败:', error)
      res.status(500).json({
        success: false,
        message: '删除采购订单失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 获取采购统计数据
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const { baseId } = req.query

      const whereConditions: any = {}
      if (baseId) {
        whereConditions.baseId = Number(baseId)
      }

      // 获取订单统计
      const totalOrders = await ProcurementOrder.count({ where: whereConditions })
      const pendingOrders = await ProcurementOrder.count({ 
        where: { ...whereConditions, status: 'pending' } 
      })
      const approvedOrders = await ProcurementOrder.count({ 
        where: { ...whereConditions, status: 'approved' } 
      })
      const completedOrders = await ProcurementOrder.count({ 
        where: { ...whereConditions, status: 'completed' } 
      })

      // 获取金额统计
      const totalAmountResult = await ProcurementOrder.sum('totalAmount', { where: whereConditions })
      const totalAmount = totalAmountResult || 0

      // 获取供应商统�?
      const activeSuppliers = await Supplier.count({ where: { status: 'active' } })

      res.json({
        success: true,
        data: {
          totalOrders,
          pendingOrders,
          approvedOrders,
          completedOrders,
          totalAmount,
          activeSuppliers
        },
        message: '获取采购统计数据成功'
      })
    } catch (error) {
      logger.error('获取采购统计数据失败:', error)
      res.status(500).json({
        success: false,
        message: '获取采购统计数据失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}
import { Request, Response } from 'express'
import { Op } from 'sequelize'
import { Supplier } from '../models/Supplier'
import { logger } from '../utils/logger'

export class SupplierController {
  /**
   * 获取供应商列�?
   */
  async getSuppliers(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        name,
        supplierType,
        status,
        phone,
        contactPerson
      } = req.query

      const offset = (Number(page) - 1) * Number(limit)
      
      // 构建查询条件
      const whereConditions: any = {}
      
      if (name) {
        whereConditions.name = {
          [Op.iLike]: `%${name}%`
        }
      }
      
      if (supplierType) {
        whereConditions.supplierType = supplierType
      }
      
      if (status) {
        whereConditions.status = status
      }
      
      if (phone) {
        whereConditions.phone = {
          [Op.iLike]: `%${phone}%`
        }
      }
      
      if (contactPerson) {
        whereConditions.contactPerson = {
          [Op.iLike]: `%${contactPerson}%`
        }
      }

      // 查询供应商列�?
      const { count, rows } = await Supplier.findAndCountAll({
        where: whereConditions,
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      })

      res.json({
        success: true,
        data: {
          suppliers: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        },
        message: '获取供应商列表成�?
      })
    } catch (error) {
      logger.error('获取供应商列表失�?', error)
      res.status(500).json({
        success: false,
        message: '获取供应商列表失�?,
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 获取供应商详�?
   */
  async getSupplierById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: '供应商不存在',
          code: 'SUPPLIER_NOT_FOUND'
        })
      }

      res.json({
        success: true,
        data: { supplier },
        message: '获取供应商详情成�?
      })
    } catch (error) {
      logger.error('获取供应商详情失�?', error)
      res.status(500).json({
        success: false,
        message: '获取供应商详情失�?,
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 创建供应�?
   */
  async createSupplier(req: Request, res: Response) {
    try {
      const {
        name,
        contactPerson,
        phone,
        email,
        address,
        supplierType,
        businessLicense,
        taxNumber,
        bankAccount,
        creditLimit = 0,
        paymentTerms,
        rating = 5,
        remark
      } = req.body

      const user = (req as any).user

      // 验证必填字段
      if (!name || !contactPerson || !phone || !address) {
        return res.status(400).json({
          success: false,
          message: '请提供必要的供应商信�?,
          code: 'MISSING_REQUIRED_FIELDS'
        })
      }

      // 检查供应商名称是否已存�?
      const existingSupplier = await Supplier.findOne({
        where: { name }
      })

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: '供应商名称已存在',
          code: 'SUPPLIER_NAME_EXISTS'
        })
      }

      // 创建供应�?
      const supplier = await Supplier.create({
        name,
        contactPerson,
        phone,
        email,
        address,
        supplierType: supplierType || 'material',
        businessLicense,
        taxNumber,
        bankAccount,
        creditLimit: Number(creditLimit),
        paymentTerms,
        rating: Number(rating),
        remark,
        createdBy: user.id,
        createdByName: user.name
      })

      res.status(201).json({
        success: true,
        data: { supplier },
        message: '创建供应商成�?
      })
    } catch (error) {
      logger.error('创建供应商失�?', error)
      res.status(500).json({
        success: false,
        message: '创建供应商失�?,
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 更新供应�?
   */
  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params
      const {
        name,
        contactPerson,
        phone,
        email,
        address,
        supplierType,
        businessLicense,
        taxNumber,
        bankAccount,
        creditLimit,
        paymentTerms,
        rating,
        status,
        remark
      } = req.body

      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: '供应商不存在',
          code: 'SUPPLIER_NOT_FOUND'
        })
      }

      // 如果更新名称，检查是否与其他供应商重�?
      if (name && name !== supplier.name) {
        const existingSupplier = await Supplier.findOne({
          where: { 
            name,
            id: { [Op.ne]: id }
          }
        })

        if (existingSupplier) {
          return res.status(400).json({
            success: false,
            message: '供应商名称已存在',
            code: 'SUPPLIER_NAME_EXISTS'
          })
        }
      }

      // 更新供应商信�?
      await supplier.update({
        name: name || supplier.name,
        contactPerson: contactPerson || supplier.contactPerson,
        phone: phone || supplier.phone,
        email: email !== undefined ? email : supplier.email,
        address: address || supplier.address,
        supplierType: supplierType || supplier.supplierType,
        businessLicense: businessLicense !== undefined ? businessLicense : supplier.businessLicense,
        taxNumber: taxNumber !== undefined ? taxNumber : supplier.taxNumber,
        bankAccount: bankAccount !== undefined ? bankAccount : supplier.bankAccount,
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : supplier.creditLimit,
        paymentTerms: paymentTerms !== undefined ? paymentTerms : supplier.paymentTerms,
        rating: rating !== undefined ? Number(rating) : supplier.rating,
        status: status || supplier.status,
        remark: remark !== undefined ? remark : supplier.remark
      })

      res.json({
        success: true,
        data: { supplier },
        message: '更新供应商成�?
      })
    } catch (error) {
      logger.error('更新供应商失�?', error)
      res.status(500).json({
        success: false,
        message: '更新供应商失�?,
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 删除供应�?
   */
  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params

      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: '供应商不存在',
          code: 'SUPPLIER_NOT_FOUND'
        })
      }

      // 检查是否有关联的采购订�?
      // 这里可以添加检查逻辑，防止删除有订单的供应商

      await supplier.destroy()

      res.json({
        success: true,
        message: '删除供应商成�?
      })
    } catch (error) {
      logger.error('删除供应商失�?', error)
      res.status(500).json({
        success: false,
        message: '删除供应商失�?,
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 启用/禁用供应�?
   */
  async toggleSupplierStatus(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!['active', 'inactive', 'blacklisted'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的供应商状�?,
          code: 'INVALID_STATUS'
        })
      }

      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: '供应商不存在',
          code: 'SUPPLIER_NOT_FOUND'
        })
      }

      await supplier.update({ status })

      res.json({
        success: true,
        data: { supplier },
        message: '更新供应商状态成�?
      })
    } catch (error) {
      logger.error('更新供应商状态失�?', error)
      res.status(500).json({
        success: false,
        message: '更新供应商状态失�?,
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 获取供应商选项列表（用于下拉选择�?
   */
  async getSupplierOptions(req: Request, res: Response) {
    try {
      const { supplierType } = req.query

      const whereConditions: any = {
        status: 'active'
      }

      if (supplierType) {
        whereConditions.supplierType = supplierType
      }

      const suppliers = await Supplier.findAll({
        where: whereConditions,
        attributes: ['id', 'name', 'contactPerson', 'phone', 'supplierType'],
        order: [['name', 'ASC']]
      })

      res.json({
        success: true,
        data: { suppliers },
        message: '获取供应商选项成功'
      })
    } catch (error) {
      logger.error('获取供应商选项失败:', error)
      res.status(500).json({
        success: false,
        message: '获取供应商选项失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}
