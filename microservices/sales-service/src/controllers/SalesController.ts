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
          whereClause.baseId = base_id;
        }
      } else if (dataPermission.baseId) {
        whereClause.baseId = dataPermission.baseId;
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
   * 获取销售订单详情
   */
  static async getSalesOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const order = await SalesOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contactPerson', 'phone', 'email', 'address']
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
        ]
      });

      if (!order) {
        return res.error('销售订单不存在', 404, 'SALES_ORDER_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以查看任何订单
      } else if (dataPermission.baseId && order.baseId !== dataPermission.baseId) {
        return res.error('权限不足，只能查看所属基地的销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法查看销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      res.success(order, '获取销售订单详情成功');
    } catch (error) {
      logger.error('获取销售订单详情失败:', error);
      res.error('获取销售订单详情失败', 500, 'GET_SALES_ORDER_ERROR');
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
        total_amount,
        order_date,
        delivery_date,
        payment_method,
        contract_number,
        remark,
        items
      } = req.body;
      const user = req.user;
      
      console.log('🔄 销售订单创建请求数据:', {
        customer_id,
        base_id,
        total_amount,
        order_date,
        delivery_date,
        items: items?.length || 0,
        user: user?.username
      });

      // 验证必需字段
      if (!customer_id) {
        return res.error('请选择客户', 400, 'CUSTOMER_REQUIRED');
      }
      if (!order_date) {
        return res.error('请选择订单日期', 400, 'ORDER_DATE_REQUIRED');
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.error('请至少添加一个商品', 400, 'ITEMS_REQUIRED');
      }

      // 数据权限检查和基地绑定逻辑
      let finalBaseId = base_id;
      let baseName = '';
      
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        // 管理员用户：必须选择基地
        if (!base_id) {
          return res.error('管理员用户必须选择基地', 400, 'BASE_REQUIRED_FOR_ADMIN');
        }
        finalBaseId = base_id;
      } else {
        // 普通用户：自动绑定到所属基地
        if (!user?.base_id) {
          return res.error('用户未分配基地，无法创建销售订单', 403, 'USER_NO_BASE_ASSIGNED');
        }
        
        // 如果用户试图指定不同的基地，覆盖为用户所属基地
        if (base_id && base_id !== user.base_id) {
          logger.warn(`用户 ${user.username} 试图在非所属基地 ${base_id} 创建订单，已自动更正为所属基地 ${user.base_id}`);
        }
        
        finalBaseId = user.base_id;
      }

      // 获取基地信息
      try {
        const axios = require('axios');
        const BASE_SERVICE_URL = process.env.BASE_SERVICE_URL || 'http://localhost:3002';
        const baseResponse = await axios.get(`${BASE_SERVICE_URL}/api/v1/base/bases/${finalBaseId}`, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        baseName = baseResponse.data?.data?.name || `基地${finalBaseId}`;
      } catch (error) {
        logger.warn('获取基地名称失败，使用默认值:', (error as any)?.message || error);
        baseName = `基地${finalBaseId}`;
      }

      // 验证客户是否存在
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        return res.error('指定的客户不存在', 404, 'CUSTOMER_NOT_FOUND');
      }

      // 验证牛只是否存在且可销售 (只检查牛只类型的商品)
      const cattleItems = items.filter(item => item.itemType === 'cattle' && item.cattle_id);
      if (cattleItems.length > 0) {
        const cattleIds = cattleItems.map(item => item.cattle_id);
        
        try {
          const axios = require('axios');
          const CATTLE_SERVICE_URL = process.env.CATTLE_SERVICE_URL || 'http://localhost:3003';
          const cattleResponse = await axios.get(`${CATTLE_SERVICE_URL}/api/v1/cattle/cattle`, {
            headers: {
              'Authorization': req.headers.authorization
            },
            params: {
              base_id: finalBaseId,
              status: 'active',
              ids: cattleIds.join(',')
            }
          });
          
          const availableCattle = cattleResponse.data?.data?.cattle || [];
          if (availableCattle.length !== cattleIds.length) {
            return res.error('部分牛只不存在或不可销售', 400, 'INVALID_CATTLE');
          }
        } catch (error) {
          logger.error('验证牛只失败:', error);
          return res.error('验证牛只信息失败', 500, 'CATTLE_VALIDATION_ERROR');
        }
      }

      // 验证物资是否存在且属于指定基地 (只检查物资类型的商品)
      const materialItems = items.filter(item => item.itemType === 'material' && item.material_id);
      if (materialItems.length > 0) {
        const materialIds = materialItems.map(item => item.material_id);
        
        try {
          const axios = require('axios');
          const MATERIAL_SERVICE_URL = process.env.MATERIAL_SERVICE_URL || 'http://localhost:3009';
          const materialResponse = await axios.get(`${MATERIAL_SERVICE_URL}/api/v1/material/materials`, {
            headers: {
              'Authorization': req.headers.authorization
            },
            params: {
              base_id: finalBaseId,
              status: 'active',
              ids: materialIds.join(',')
            }
          });
          
          const availableMaterials = materialResponse.data?.data?.materials || [];
          if (availableMaterials.length !== materialIds.length) {
            return res.error('部分物资不存在或不属于指定基地', 400, 'INVALID_MATERIALS');
          }
        } catch (error) {
          logger.warn('物资服务不可用，跳过物资验证:', (error as any)?.message);
          // 物资服务不可用时不阻断订单创建，但记录警告
        }
      }

      // 验证设备是否存在且属于指定基地 (只检查设备类型的商品)
      const equipmentItems = items.filter(item => item.itemType === 'equipment' && item.equipment_id);
      if (equipmentItems.length > 0) {
        const equipmentIds = equipmentItems.map(item => item.equipment_id);
        
        try {
          const axios = require('axios');
          const EQUIPMENT_SERVICE_URL = process.env.EQUIPMENT_SERVICE_URL || 'http://localhost:3006';
          const equipmentResponse = await axios.get(`${EQUIPMENT_SERVICE_URL}/api/v1/equipment/equipment`, {
            headers: {
              'Authorization': req.headers.authorization
            },
            params: {
              base_id: finalBaseId,
              status: 'active',
              ids: equipmentIds.join(',')
            }
          });
          
          const availableEquipment = equipmentResponse.data?.data?.equipment || [];
          if (availableEquipment.length !== equipmentIds.length) {
            return res.error('部分设备不存在或不属于指定基地', 400, 'INVALID_EQUIPMENT');
          }
        } catch (error) {
          logger.warn('设备服务不可用，跳过设备验证:', (error as any)?.message);
          // 设备服务不可用时不阻断订单创建，但记录警告
        }
      }

      // 生成订单编号
      const orderNumber = `SO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;
      
      // 计算订单总金额（如果没有提供）
      let calculatedTotalAmount = total_amount;
      if (!calculatedTotalAmount) {
        calculatedTotalAmount = items.reduce((sum, item) => {
          return sum + (Number(item.quantity || 1) * Number(item.unit_price || 0));
        }, 0);
      }

      // 使用事务创建订单和订单明细
      const result = await sequelize.transaction(async (transaction) => {
        // 创建销售订单
        const order = await SalesOrder.create({
          orderNumber,
          customerId: customer_id,
          customerName: customer.name,
          baseId: finalBaseId,
          baseName,
          totalAmount: calculatedTotalAmount,
          taxAmount: 0,
          discountAmount: 0,
          status: 'pending',
          paymentStatus: 'unpaid',
          paymentMethod: payment_method || null,
          orderDate: new Date(order_date),
          expectedDeliveryDate: delivery_date ? new Date(delivery_date) : undefined,
          contractNumber: contract_number || null,
          remark: remark || null,
          createdBy: user?.id || 'system',
          createdByName: user?.real_name || user?.username || '系统',
        }, { transaction });

        // 创建订单明细（仅处理牛只类型）
        const orderItems = [];
        for (const item of cattleItems) {
          if (item.cattle_id && item.ear_tag) {
            const orderItem = await SalesOrderItem.create({
              orderId: order.id,
              cattleId: item.cattle_id,
              earTag: item.ear_tag,
              breed: item.breed || null,
              weight: Number(item.weight || 0),
              unitPrice: Number(item.unit_price || 0),
              totalPrice: Number(item.quantity || 1) * Number(item.unit_price || 0),
              qualityGrade: item.quality_grade || undefined,
              healthCertificate: undefined,
              quarantineCertificate: undefined,
              deliveryStatus: 'pending',
              remark: item.notes || null
            }, { transaction });
            orderItems.push(orderItem);
          }
        }

        return { order, orderItems };
      });
      
      logger.info(`销售订单创建成功: ${orderNumber}, 用户: ${user?.username} (${user?.role}), 基地: ${finalBaseId}`);

      // 获取完整的订单信息（包含关联数据）
      const fullOrder = await SalesOrder.findByPk(result.order.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contactPerson', 'phone']
          },
          {
            model: SalesOrderItem,
            as: 'items',
            attributes: ['id', 'cattleId', 'earTag', 'breed', 'weight', 'unitPrice', 'totalPrice', 'deliveryStatus']
          }
        ]
      });

      res.success({
        ...fullOrder?.toJSON(),
        message: user?.role === 'admin' || user?.role === 'super_admin' 
          ? '管理员订单创建成功' 
          : `订单已自动绑定到基地 ${baseName}`
      }, '创建销售订单成功', 201);
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
      } else if (dataPermission.baseId && order.baseId !== dataPermission.baseId) {
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
      } else if (dataPermission.baseId && order.baseId !== dataPermission.baseId) {
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
        where: { customerId: id }
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
   * 获取客户详情
   */
  static async getCustomerById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await Customer.findByPk(id);
      if (!customer) {
        return res.error('客户不存在', 404, 'CUSTOMER_NOT_FOUND');
      }

      res.success(customer, '获取客户详情成功');
    } catch (error) {
      logger.error('获取客户详情失败:', error);
      res.error('获取客户详情失败', 500, 'GET_CUSTOMER_ERROR');
    }
  }

  /**
   * 更新客户信用评级
   */
  static async updateCustomerRating(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { creditRating, creditLimit, notes } = req.body;

      const customer = await Customer.findByPk(id);
      if (!customer) {
        return res.error('客户不存在', 404, 'CUSTOMER_NOT_FOUND');
      }

      await customer.update({
        creditRating,
        creditLimit,
        remark: notes
      });

      res.success(customer, '更新客户信用评级成功');
    } catch (error) {
      logger.error('更新客户信用评级失败:', error);
      res.error('更新客户信用评级失败', 500, 'UPDATE_CUSTOMER_RATING_ERROR');
    }
  }

  /**
   * 获取客户统计信息
   */
  static async getCustomerStatistics(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await Customer.findByPk(id);
      if (!customer) {
        return res.error('客户不存在', 404, 'CUSTOMER_NOT_FOUND');
      }

      // 获取该客户的所有订单
      const orders = await SalesOrder.findAll({
        where: { customerId: id }
      });

      const totalOrders = orders.length;
      const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const pendingOrders = orders.filter(order => order.status === 'pending').length;

      const statistics = {
        total_orders: totalOrders,
        total_amount: totalAmount,
        completed_orders: completedOrders,
        pending_orders: pendingOrders,
        average_order_amount: totalOrders > 0 ? totalAmount / totalOrders : 0,
        last_order_date: orders.length > 0 ? Math.max(...orders.map(o => new Date(o.orderDate).getTime())) : null
      };

      res.success(statistics, '获取客户统计信息成功');
    } catch (error) {
      logger.error('获取客户统计信息失败:', error);
      res.error('获取客户统计信息失败', 500, 'GET_CUSTOMER_STATISTICS_ERROR');
    }
  }

  /**
   * 获取客户回访记录
   */
  static async getCustomerVisits(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // 简单返回空数据，实际项目中应该查询回访记录表
      res.success({
        visits: [],
        pagination: {
          total: 0,
          page: Number(page),
          limit: Number(limit),
          pages: 0
        }
      }, '获取客户回访记录成功');
    } catch (error) {
      logger.error('获取客户回访记录失败:', error);
      res.error('获取客户回访记录失败', 500, 'GET_CUSTOMER_VISITS_ERROR');
    }
  }

  /**
   * 创建客户回访记录
   */
  static async createCustomerVisit(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      
      // 简单返回成功，实际项目中应该创建回访记录
      res.success({ id: Date.now(), customerId }, '创建客户回访记录成功', 201);
    } catch (error) {
      logger.error('创建客户回访记录失败:', error);
      res.error('创建客户回访记录失败', 500, 'CREATE_CUSTOMER_VISIT_ERROR');
    }
  }

  /**
   * 更新客户回访记录
   */
  static async updateCustomerVisit(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 简单返回成功，实际项目中应该更新回访记录
      res.success({ id }, '更新客户回访记录成功');
    } catch (error) {
      logger.error('更新客户回访记录失败:', error);
      res.error('更新客户回访记录失败', 500, 'UPDATE_CUSTOMER_VISIT_ERROR');
    }
  }

  /**
   * 获取客户类型列表
   */
  static async getCustomerTypes(req: Request, res: Response) {
    try {
      const types = [
        { id: 1, name: '企业客户', description: '具有营业执照的企业' },
        { id: 2, name: '个人客户', description: '个人购买者' },
        { id: 3, name: '合作社', description: '农业合作社' },
        { id: 4, name: '经销商', description: '中间经销商' }
      ];
      
      res.success(types, '获取客户类型列表成功');
    } catch (error) {
      logger.error('获取客户类型列表失败:', error);
      res.error('获取客户类型列表失败', 500, 'GET_CUSTOMER_TYPES_ERROR');
    }
  }

  /**
   * 获取客户价值分析
   */
  static async getCustomerValueAnalysis(req: Request, res: Response) {
    try {
      // 简化实现，返回基本的客户价值分析数据
      const analysis = {
        high_value_customers: 0,
        medium_value_customers: 0,
        low_value_customers: 0,
        total_customers: 0
      };
      
      res.success(analysis, '获取客户价值分析成功');
    } catch (error) {
      logger.error('获取客户价值分析失败:', error);
      res.error('获取客户价值分析失败', 500, 'GET_CUSTOMER_VALUE_ANALYSIS_ERROR');
    }
  }

  // 销售订单状态管理

  /**
   * 审批销售订单
   */
  static async approveSalesOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const order = await SalesOrder.findByPk(id);
      if (!order) {
        return res.error('销售订单不存在', 404, 'SALES_ORDER_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以审批任何订单
      } else if (dataPermission.baseId && order.baseId !== dataPermission.baseId) {
        return res.error('权限不足，只能审批所属基地的销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法审批销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      if (order.status !== 'pending') {
        return res.error('只有待审批的订单才能进行审批', 400, 'INVALID_ORDER_STATUS');
      }

      await order.update({
        status: 'approved',
        remark: notes || order.remark
      });

      // 获取更新后的订单信息
      const updatedOrder = await SalesOrder.findByPk(order.id, {
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
          }
        ]
      });

      res.success(updatedOrder, '销售订单审批成功');
    } catch (error) {
      logger.error('审批销售订单失败:', error);
      res.error('审批销售订单失败', 500, 'APPROVE_SALES_ORDER_ERROR');
    }
  }

  /**
   * 取消销售订单
   */
  static async cancelSalesOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = await SalesOrder.findByPk(id);
      if (!order) {
        return res.error('销售订单不存在', 404, 'SALES_ORDER_NOT_FOUND');
      }

      // 数据权限检查
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以取消任何订单
      } else if (dataPermission.baseId && order.baseId !== dataPermission.baseId) {
        return res.error('权限不足，只能取消所属基地的销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      } else if (!dataPermission.baseId) {
        return res.error('没有基地权限，无法取消销售订单', 403, 'INSUFFICIENT_PERMISSIONS');
      }

      if (order.status === 'completed' || order.status === 'cancelled') {
        return res.error('已完成或已取消的订单不能再次取消', 400, 'INVALID_ORDER_STATUS');
      }

      await order.update({
        status: 'cancelled',
        remark: reason ? `取消原因: ${reason}` : '订单已取消'
      });

      // 获取更新后的订单信息
      const updatedOrder = await SalesOrder.findByPk(order.id, {
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
          }
        ]
      });

      res.success(updatedOrder, '销售订单取消成功');
    } catch (error) {
      logger.error('取消销售订单失败:', error);
      res.error('取消销售订单失败', 500, 'CANCEL_SALES_ORDER_ERROR');
    }
  }

  /**
   * 更新交付状态
   */
  static async updateDeliveryStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { delivery_status, actual_delivery_date, notes } = req.body;

      const order = await SalesOrder.findByPk(id);
      if (!order) {
        return res.error('销售订单不存在', 404, 'SALES_ORDER_NOT_FOUND');
      }

      await order.update({
        status: delivery_status === 'delivered' ? 'delivered' : order.status,
        actualDeliveryDate: actual_delivery_date || order.actualDeliveryDate,
        remark: notes || order.remark
      });

      const updatedOrder = await SalesOrder.findByPk(order.id, {
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
          }
        ]
      });

      res.success(updatedOrder, '更新交付状态成功');
    } catch (error) {
      logger.error('更新交付状态失败:', error);
      res.error('更新交付状态失败', 500, 'UPDATE_DELIVERY_STATUS_ERROR');
    }
  }

  /**
   * 更新付款状态
   */
  static async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { payment_status, payment_date, notes } = req.body;

      const order = await SalesOrder.findByPk(id);
      if (!order) {
        return res.error('销售订单不存在', 404, 'SALES_ORDER_NOT_FOUND');
      }

      await order.update({
        status: payment_status === 'paid' && order.status === 'delivered' ? 'completed' : order.status,
        remark: notes || order.remark
      });

      const updatedOrder = await SalesOrder.findByPk(order.id, {
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
          }
        ]
      });

      res.success(updatedOrder, '更新付款状态成功');
    } catch (error) {
      logger.error('更新付款状态失败:', error);
      res.error('更新付款状态失败', 500, 'UPDATE_PAYMENT_STATUS_ERROR');
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
          whereClause.baseId = base_id;
        }
      } else if (dataPermission.baseId) {
        whereClause.baseId = dataPermission.baseId;
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
        acc[customerName].amount += Number(order.totalAmount);
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      // 按月份统计
      const monthlyStats = orders.reduce((acc, order) => {
        const month = new Date(order.orderDate).toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { count: 0, amount: 0 };
        }
        acc[month].count += 1;
        acc[month].amount += Number(order.totalAmount);
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

  // 基地和牛只数据管理（用于销售订单创建）

  /**
   * 获取基地列表
   * 根据用户角色返回不同的基地列表：
   * - admin/super_admin: 返回所有基地
   * - 其他角色: 只返回用户所属基地
   */
  static async getBases(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      
      if (!user) {
        return res.error('用户未认证', 401, 'USER_NOT_AUTHENTICATED');
      }

      // 调用基地服务获取基地列表
      const axios = require('axios');
      const BASE_SERVICE_URL = process.env.BASE_SERVICE_URL || 'http://localhost:3002';
      
      let basesResponse;
      
      // 根据用户角色决定获取哪些基地
      if (user.role === 'admin' || user.role === 'super_admin') {
        // 管理员可以访问所有基地
        basesResponse = await axios.get(`${BASE_SERVICE_URL}/api/v1/base/bases`, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
      } else {
        // 普通用户只能访问自己所属的基地
        if (!user.base_id) {
          return res.success([], '用户未分配基地');
        }
        
        const singleBaseResponse = await axios.get(`${BASE_SERVICE_URL}/api/v1/base/bases/${user.base_id}`, {
          headers: {
            'Authorization': req.headers.authorization
          }
        });
        
        // 将单个基地包装成数组格式
        basesResponse = {
          data: {
            data: {
              bases: [singleBaseResponse.data.data],
              pagination: {
                total: 1,
                page: 1,
                limit: 20
              }
            }
          }
        };
      }
      
      // 提取基地数据
      const basesData = basesResponse.data?.data?.bases || basesResponse.data?.data || [];
      
      logger.info(`用户 ${user.username} (${user.role}) 获取基地列表成功，共 ${basesData.length} 个基地`);
      
      res.success(basesData, '获取基地列表成功');
    } catch (error) {
      logger.error('获取基地列表失败:', error);
      res.error('获取基地列表失败', 500, 'GET_BASES_ERROR');
    }
  }

  /**
   * 获取牛只列表
   * 根据基地ID筛选牛只，支持分页
   */
  static async getCattle(req: Request, res: Response) {
    try {
      const { base_id, page = 1, limit = 50, status = 'active' } = req.query;
      const user = (req as any).user;
      
      if (!user) {
        return res.error('用户未认证', 401, 'USER_NOT_AUTHENTICATED');
      }

      // 验证基地权限
      if (base_id) {
        const baseIdNum = Number(base_id);
        
        // 如果不是管理员，验证是否有权限访问该基地
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          if (user.base_id !== baseIdNum) {
            return res.error('权限不足，无法访问该基地的牛只数据', 403, 'INSUFFICIENT_PERMISSIONS');
          }
        }
      }

      // 调用牛只服务获取牛只列表
      const axios = require('axios');
      const CATTLE_SERVICE_URL = process.env.CATTLE_SERVICE_URL || 'http://localhost:3003';
      
      const params = {
        page,
        limit,
        status,
        ...(base_id && { base_id })
      };
      
      const cattleResponse = await axios.get(`${CATTLE_SERVICE_URL}/api/v1/cattle/cattle`, {
        headers: {
          'Authorization': req.headers.authorization
        },
        params
      });
      
      // 提取牛只数据
      const cattleData = cattleResponse.data?.data?.cattle || cattleResponse.data?.data || [];
      const pagination = cattleResponse.data?.data?.pagination || {
        total: cattleData.length,
        page: Number(page),
        limit: Number(limit)
      };
      
      logger.info(`获取牛只列表成功，基地ID: ${base_id || '全部'}, 共 ${cattleData.length} 头牛`);
      
      res.success({
        cattle: cattleData,
        pagination
      }, '获取牛只列表成功');
    } catch (error) {
      logger.error('获取牛只列表失败:', error);
      res.error('获取牛只列表失败', 500, 'GET_CATTLE_ERROR');
    }
  }

  /**
   * 获取物资列表
   * 根据基地ID筛选物资，支持分页
   */
  static async getMaterials(req: Request, res: Response) {
    try {
      const { base_id, page = 1, limit = 50, status = 'active', search } = req.query;
      const user = (req as any).user;
      
      if (!user) {
        return res.error('用户未认证', 401, 'USER_NOT_AUTHENTICATED');
      }

      // 验证基地权限
      if (base_id) {
        const baseIdNum = Number(base_id);
        
        // 如果不是管理员，验证是否有权限访问该基地
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          if (user.base_id !== baseIdNum) {
            return res.error('权限不足，无法访问该基地的物资数据', 403, 'INSUFFICIENT_PERMISSIONS');
          }
        }
      }

      // 调用物资服务获取物资列表
      const axios = require('axios');
      const MATERIAL_SERVICE_URL = process.env.MATERIAL_SERVICE_URL || 'http://localhost:3009';
      
      const params = {
        page,
        limit,
        status,
        ...(base_id && { base_id }),
        ...(search && { search })
      };
      
      try {
        const materialResponse = await axios.get(`${MATERIAL_SERVICE_URL}/api/v1/material/materials`, {
          headers: {
            'Authorization': req.headers.authorization
          },
          params
        });
        
        // 提取物资数据
        const materialData = materialResponse.data?.data?.materials || materialResponse.data?.data || [];
        const pagination = materialResponse.data?.data?.pagination || {
          total: materialData.length,
          page: Number(page),
          limit: Number(limit)
        };
        
        logger.info(`获取物资列表成功，基地ID: ${base_id || '全部'}, 共 ${materialData.length} 个物资`);
        
        res.success({
          materials: materialData,
          pagination
        }, '获取物资列表成功');
      } catch (error) {
        // 如果物资服务不可用，返回空列表但不报错
        logger.warn('物资服务暂时不可用，返回空列表:', (error as any)?.message);
        res.success({
          materials: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit)
          }
        }, '物资服务暂时不可用');
      }
    } catch (error) {
      logger.error('获取物资列表失败:', error);
      res.error('获取物资列表失败', 500, 'GET_MATERIALS_ERROR');
    }
  }

  /**
   * 获取设备列表
   * 根据基地ID筛选设备，支持分页
   */
  static async getEquipment(req: Request, res: Response) {
    try {
      const { base_id, page = 1, limit = 50, status = 'active', search } = req.query;
      const user = (req as any).user;
      
      if (!user) {
        return res.error('用户未认证', 401, 'USER_NOT_AUTHENTICATED');
      }

      // 验证基地权限
      if (base_id) {
        const baseIdNum = Number(base_id);
        
        // 如果不是管理员，验证是否有权限访问该基地
        if (user.role !== 'admin' && user.role !== 'super_admin') {
          if (user.base_id !== baseIdNum) {
            return res.error('权限不足，无法访问该基地的设备数据', 403, 'INSUFFICIENT_PERMISSIONS');
          }
        }
      }

      // 调用设备服务获取设备列表
      const axios = require('axios');
      const EQUIPMENT_SERVICE_URL = process.env.EQUIPMENT_SERVICE_URL || 'http://localhost:3006';
      
      const params = {
        page,
        limit,
        status,
        ...(base_id && { base_id }),
        ...(search && { search })
      };
      
      try {
        const equipmentResponse = await axios.get(`${EQUIPMENT_SERVICE_URL}/api/v1/equipment/equipment`, {
          headers: {
            'Authorization': req.headers.authorization
          },
          params
        });
        
        // 提取设备数据
        const equipmentData = equipmentResponse.data?.data?.equipment || equipmentResponse.data?.data || [];
        const pagination = equipmentResponse.data?.data?.pagination || {
          total: equipmentData.length,
          page: Number(page),
          limit: Number(limit)
        };
        
        logger.info(`获取设备列表成功，基地ID: ${base_id || '全部'}, 共 ${equipmentData.length} 个设备`);
        
        res.success({
          equipment: equipmentData,
          pagination
        }, '获取设备列表成功');
      } catch (error) {
        // 如果设备服务不可用，返回空列表但不报错
        logger.warn('设备服务暂时不可用，返回空列表:', (error as any)?.message);
        res.success({
          equipment: [],
          pagination: {
            total: 0,
            page: Number(page),
            limit: Number(limit)
          }
        }, '设备服务暂时不可用');
      }
    } catch (error) {
      logger.error('获取设备列表失败:', error);
      res.error('获取设备列表失败', 500, 'GET_EQUIPMENT_ERROR');
    }
  }
}