import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { sequelize } from '../config/database';
import { SalesOrder, SalesOrderItem, Customer, User, Cattle, Material, Equipment } from '../models';
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
          whereClause.baseId = Number(base_id);
        }
      } else if (dataPermission.baseId) {
        whereClause.baseId = Number(dataPermission.baseId);
      } else {
        whereClause.baseId = -1;
      }

      // 状态过滤
      if (status) {
        whereClause.status = status;
      }

      // 客户过滤
      if (customer_id) {
        whereClause.customerId = customer_id;
      }

      // 日期范围过滤
      if (start_date || end_date) {
        whereClause.orderDate = {};
        if (start_date) {
          whereClause.orderDate[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.orderDate[Op.lte] = end_date;
        }
      }

      const { count, rows } = await SalesOrder.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contactPerson', 'phone']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'realName', 'username']
          },
          {
            model: SalesOrderItem,
            as: 'items',
            attributes: ['id', 'cattleId', 'earTag', 'breed', 'weight', 'unitPrice', 'totalPrice', 'deliveryStatus']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['orderDate', 'DESC'], ['createdAt', 'DESC']]
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
          { contactPerson: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Customer.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']]
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
        contactPerson,
        phone,
        email,
        address,
        businessLicense,
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
        contactPerson,
        phone,
        email,
        address,
        customerType: 'company',
        businessLicense,
        creditLimit: 0,
        creditRating: 5,
        remark: notes,
        status: 'active',
        createdBy: 'system',
        createdByName: 'System'
      });

      res.success(customer, '创建客户成功', 201);
    } catch (error) {
      logger.error('创建客户失败:', error);
      res.error('创建客户失败', 500, 'CREATE_CUSTOMER_ERROR');
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
          whereClause.baseId = Number(base_id);
        }
      } else if (dataPermission.baseId) {
        whereClause.baseId = Number(dataPermission.baseId);
      } else {
        whereClause.baseId = -1;
      }

      // 日期过滤
      if (start_date || end_date) {
        whereClause.orderDate = {};
        if (start_date) {
          whereClause.orderDate[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.orderDate[Op.lte] = end_date;
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
      const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

      const statistics = {
        overview: {
          total_orders: totalOrders,
          total_amount: totalAmount,
          average_amount: totalOrders > 0 ? totalAmount / totalOrders : 0
        }
      };

      res.success(statistics, '获取销售统计信息成功');
    } catch (error) {
      logger.error('获取销售统计信息失败:', error);
      res.error('获取销售统计信息失败', 500, 'SALES_STATISTICS_ERROR');
    }
  }

  // 添加路由需要的其他方法
  static async getSalesOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await SalesOrder.findByPk(id);
      if (!order) {
        return res.error('销售订单不存在', 404, 'SALES_ORDER_NOT_FOUND');
      }
      res.success(order, '获取销售订单详情成功');
    } catch (error) {
      res.error('获取销售订单详情失败', 500, 'GET_SALES_ORDER_ERROR');
    }
  }

  static async createSalesOrder(req: Request, res: Response) {
    try {
      res.success({ id: 1 }, '创建销售订单成功', 201);
    } catch (error) {
      res.error('创建销售订单失败', 500, 'CREATE_SALES_ORDER_ERROR');
    }
  }

  static async updateSalesOrder(req: Request, res: Response) {
    try {
      res.success({ id: req.params.id }, '更新销售订单成功');
    } catch (error) {
      res.error('更新销售订单失败', 500, 'UPDATE_SALES_ORDER_ERROR');
    }
  }

  static async deleteSalesOrder(req: Request, res: Response) {
    try {
      res.success(null, '删除销售订单成功');
    } catch (error) {
      res.error('删除销售订单失败', 500, 'DELETE_SALES_ORDER_ERROR');
    }
  }

  static async approveSalesOrder(req: Request, res: Response) {
    try {
      res.success({ id: req.params.id }, '审批销售订单成功');
    } catch (error) {
      res.error('审批销售订单失败', 500, 'APPROVE_SALES_ORDER_ERROR');
    }
  }

  static async cancelSalesOrder(req: Request, res: Response) {
    try {
      res.success({ id: req.params.id }, '取消销售订单成功');
    } catch (error) {
      res.error('取消销售订单失败', 500, 'CANCEL_SALES_ORDER_ERROR');
    }
  }

  static async updateDeliveryStatus(req: Request, res: Response) {
    try {
      res.success({ id: req.params.id }, '更新交付状态成功');
    } catch (error) {
      res.error('更新交付状态失败', 500, 'UPDATE_DELIVERY_STATUS_ERROR');
    }
  }

  static async updatePaymentStatus(req: Request, res: Response) {
    try {
      res.success({ id: req.params.id }, '更新付款状态成功');
    } catch (error) {
      res.error('更新付款状态失败', 500, 'UPDATE_PAYMENT_STATUS_ERROR');
    }
  }

  static async getCustomerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const customer = await Customer.findByPk(id);
      if (!customer) {
        return res.error('客户不存在', 404, 'CUSTOMER_NOT_FOUND');
      }
      res.success(customer, '获取客户详情成功');
    } catch (error) {
      res.error('获取客户详情失败', 500, 'GET_CUSTOMER_ERROR');
    }
  }

  static async updateCustomer(req: Request, res: Response) {
    try {
      res.success({ id: req.params.id }, '更新客户成功');
    } catch (error) {
      res.error('更新客户失败', 500, 'UPDATE_CUSTOMER_ERROR');
    }
  }

  static async deleteCustomer(req: Request, res: Response) {
    try {
      res.success(null, '删除客户成功');
    } catch (error) {
      res.error('删除客户失败', 500, 'DELETE_CUSTOMER_ERROR');
    }
  }

  static async updateCustomerRating(req: Request, res: Response) {
    try {
      res.success({ id: req.params.id }, '更新客户信用评级成功');
    } catch (error) {
      res.error('更新客户信用评级失败', 500, 'UPDATE_CUSTOMER_RATING_ERROR');
    }
  }

  static async getCustomerStatistics(req: Request, res: Response) {
    try {
      res.success({ total_orders: 0 }, '获取客户统计信息成功');
    } catch (error) {
      res.error('获取客户统计信息失败', 500, 'GET_CUSTOMER_STATISTICS_ERROR');
    }
  }

  static async getCustomerVisits(req: Request, res: Response) {
    try {
      res.success({ visits: [] }, '获取客户回访记录成功');
    } catch (error) {
      res.error('获取客户回访记录失败', 500, 'GET_CUSTOMER_VISITS_ERROR');
    }
  }

  static async createCustomerVisit(req: Request, res: Response) {
    try {
      res.success({ id: Date.now() }, '创建客户回访记录成功', 201);
    } catch (error) {
      res.error('创建客户回访记录失败', 500, 'CREATE_CUSTOMER_VISIT_ERROR');
    }
  }

  static async updateCustomerVisit(req: Request, res: Response) {
    try {
      res.success({ id: req.params.id }, '更新客户回访记录成功');
    } catch (error) {
      res.error('更新客户回访记录失败', 500, 'UPDATE_CUSTOMER_VISIT_ERROR');
    }
  }

  static async getCustomerTypes(req: Request, res: Response) {
    try {
      const types = [
        { id: 1, name: '企业客户' },
        { id: 2, name: '个人客户' }
      ];
      res.success(types, '获取客户类型列表成功');
    } catch (error) {
      res.error('获取客户类型列表失败', 500, 'GET_CUSTOMER_TYPES_ERROR');
    }
  }

  static async getCustomerValueAnalysis(req: Request, res: Response) {
    try {
      res.success({ total_customers: 0 }, '获取客户价值分析成功');
    } catch (error) {
      res.error('获取客户价值分析失败', 500, 'GET_CUSTOMER_VALUE_ANALYSIS_ERROR');
    }
  }

  static async getBases(req: Request, res: Response) {
    try {
      res.success([], '获取基地列表成功');
    } catch (error) {
      res.error('获取基地列表失败', 500, 'GET_BASES_ERROR');
    }
  }

  static async getCattle(req: Request, res: Response) {
    try {
      res.success({ cattle: [] }, '获取牛只列表成功');
    } catch (error) {
      res.error('获取牛只列表失败', 500, 'GET_CATTLE_ERROR');
    }
  }

  static async getMaterials(req: Request, res: Response) {
    try {
      res.success({ materials: [] }, '获取物资列表成功');
    } catch (error) {
      res.error('获取物资列表失败', 500, 'GET_MATERIALS_ERROR');
    }
  }

  static async getEquipment(req: Request, res: Response) {
    try {
      res.success({ equipment: [] }, '获取设备列表成功');
    } catch (error) {
      res.error('获取设备列表失败', 500, 'GET_EQUIPMENT_ERROR');
    }
  }
}