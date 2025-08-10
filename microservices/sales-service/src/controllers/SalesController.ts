import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { SalesOrder, Customer, User, Cattle } from '../models';
import { logger } from '../utils/logger';

export class SalesController {
  // 销售订单管理

  /**
   * 获取销售订单列表
   */
  static async getSalesOrders(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        customer_id,
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

      // 客户过滤
      if (customer_id) {
        whereClause.customer_id = customer_id;
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

      const { count, rows } = await SalesOrder.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Customer,
            as: 'customer',
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
      }, '获取销售订单列表成功');
    } catch (error) {
      logger.error('获取销售订单列表失败:', error);
      res.error('获取销售订单列表失败', 500, 'SALES_ORDERS_ERROR');
    }
  }

  /**
   * 创建销售订单
   */
  static async createSalesOrder(req: Request, res: Response) {
    try {
      const {
        customer_id,
        base_id,
        cattle_ids,
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
        return res.error('权限不足，只能在所属基地创建销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法创建销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // 验证客户是否存在
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        return res.error('指定的客户不存在', 404, 'CUSTOMER_NOT_FOUND');
      }

      // 验证牛只是否存在且可销售
      if (cattle_ids && cattle_ids.length > 0) {
        const cattle = await Cattle.findAll({
          where: {
            id: { [Op.in]: cattle_ids },
            base_id,
            status: 'active'
          }
        });

        if (cattle.length !== cattle_ids.length) {
          return res.error('部分牛只不存在或不可销售', 400, 'INVALID_CATTLE');
        }
      }

      // 生成订单编号
      const orderNumber = `SO${Date.now()}`;

      const order = await SalesOrder.create({
        order_number: orderNumber,
        customer_id,
        base_id,
        cattle_ids,
        total_amount,
        order_date,
        expected_delivery_date,
        notes,
        status: 'pending',
        created_by
      });

      // 获取完整的订单信息
      const fullOrder = await SalesOrder.findByPk(order.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      res.success(fullOrder, '创建销售订单成功', 201);
    } catch (error) {
      logger.error('创建销售订单失败:', error);
      res.error('创建销售订单失败', 500, 'CREATE_SALES_ORDER_ERROR');
    }
  }

  /**
   * 更新销售订单
   */
  static async updateSalesOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const order = await SalesOrder.findByPk(id);
      if (!order) {
        return res.error('销售订单不存在', 404, 'SALES_ORDER_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以更新任何订单
      } else if (dataPermission.baseId && order.base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能更新所属基地的销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法更新销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // 如果订单状态为已完成或已取消，不允许修改
      if (order.status === 'completed' || order.status === 'cancelled') {
        return res.error('已完成或已取消的订单不能修改', 400, 'INVALID_ORDER_STATUS');
      }

      await order.update(updateData);

      // 获取更新后的完整订单信息
      const updatedOrder = await SalesOrder.findByPk(order.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      res.success(updatedOrder, '更新销售订单成功');
    } catch (error) {
      logger.error('更新销售订单失败:', error);
      res.error('更新销售订单失败', 500, 'UPDATE_SALES_ORDER_ERROR');
    }
  }

  /**
   * 删除销售订单
   */
  static async deleteSalesOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const order = await SalesOrder.findByPk(id);
      if (!order) {
        return res.error('销售订单不存在', 404, 'SALES_ORDER_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以删除任何订单
      } else if (dataPermission.baseId && order.base_id !== dataPermission.baseId) {
        return res.error('权限不足，只能删除所属基地的销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法删除销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      // 只有待处理状态的订单才能删除
      if (order.status !== 'pending') {
        return res.error('只有待处理状态的订单才能删除', 400, 'INVALID_ORDER_STATUS');
      }

      await order.destroy();

      res.success(null, '删除销售订单成功');
    } catch (error) {
      logger.error('删除销售订单失败:', error);
      res.error('删除销售订单失败', 500, 'DELETE_SALES_ORDER_ERROR');
    }
  }

  // 客户管理

  /**
   * 获取客户列表
   */
  static async getCustomers(req: Request, res: Response) {
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

      const { count, rows } = await Customer.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.success({
        customers: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取客户列表成功');
    } catch (error) {
      logger.error('获取客户列表失败:', error);
      res.error('获取客户列表失败', 500, 'CUSTOMERS_ERROR');
    }
  }

  /**
   * 创建客户
   */
  static async createCustomer(req: Request, res: Response) {
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

      // 检查客户名称是否已存在
      const existingCustomer = await Customer.findOne({
        where: { name }
      });

      if (existingCustomer) {
        return res.error('客户名称已存在', 409, 'CUSTOMER_NAME_EXISTS');
      }

      const customer = await Customer.create({
        name,
        contact_person,
        phone,
        email,
        address,
        business_license,
        notes,
        status: 'active'
      });

      res.success(customer, '创建客户成功', 201);
    } catch (error) {
      logger.error('创建客户失败:', error);
      res.error('创建客户失败', 500, 'CREATE_CUSTOMER_ERROR');
    }
  }

  /**
   * 更新客户
   */
  static async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const customer = await Customer.findByPk(id);
      if (!customer) {
        return res.error('客户不存在', 404, 'CUSTOMER_NOT_FOUND');
      }

      // 如果更新名称，检查是否重复
      if (updateData.name && updateData.name !== customer.name) {
        const existingCustomer = await Customer.findOne({
          where: { name: updateData.name }
        });
        if (existingCustomer) {
          return res.error('客户名称已存在', 409, 'CUSTOMER_NAME_EXISTS');
        }
      }

      await customer.update(updateData);

      res.success(customer, '更新客户成功');
    } catch (error) {
      logger.error('更新客户失败:', error);
      res.error('更新客户失败', 500, 'UPDATE_CUSTOMER_ERROR');
    }
  }

  /**
   * 删除客户
   */
  static async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await Customer.findByPk(id);
      if (!customer) {
        return res.error('客户不存在', 404, 'CUSTOMER_NOT_FOUND');
      }

      // 检查是否有关联的销售订单
      const orderCount = await SalesOrder.count({
        where: { customer_id: id }
      });

      if (orderCount > 0) {
        return res.error('该客户有关联的销售订单，无法删除', 400, 'CUSTOMER_HAS_ORDERS');
      }

      await customer.destroy();

      res.success(null, '删除客户成功');
    } catch (error) {
      logger.error('删除客户失败:', error);
      res.error('删除客户失败', 500, 'DELETE_CUSTOMER_ERROR');
    }
  }

  /**
   * 获取销售统计信息
   */
  static async getSalesStatistics(req: Request, res: Response) {
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

      const orders = await SalesOrder.findAll({
        where: whereClause,
        include: [
          {
            model: Customer,
            as: 'customer',
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

      // 按客户统计
      const customerStats = orders.reduce((acc, order) => {
        const customerName = (order as any).customer?.name || '未知客户';
        if (!acc[customerName]) {
          acc[customerName] = { count: 0, amount: 0 };
        }
        acc[customerName].count += 1;
        acc[customerName].amount += Number(order.total_amount);
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
        customer_statistics: customerStats,
        monthly_statistics: monthlyStats
      };

      res.success(statistics, '获取销售统计信息成功');
    } catch (error) {
      logger.error('获取销售统计信息失败:', error);
      res.error('获取销售统计信息失败', 500, 'SALES_STATISTICS_ERROR');
    }
  }
}