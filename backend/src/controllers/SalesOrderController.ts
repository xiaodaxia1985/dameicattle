import { Request, Response } from 'express';
import { Op, fn, col, literal, Transaction } from 'sequelize';
import { SalesOrder } from '@/models/SalesOrder';
import { SalesOrderItem } from '@/models/SalesOrderItem';
import { Customer } from '@/models/Customer';
import { Cattle } from '@/models/Cattle';
import { Base } from '@/models/Base';
import { User } from '@/models/User';
import { sequelize } from '@/config/database';
import { ValidationError, NotFoundError, BusinessError } from '@/utils/errors';
import { generateOrderNumber } from '@/utils/orderUtils';

export class SalesOrderController {
  // 获取销售订单列表
  static async getSalesOrders(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        order_number,
        customer_id,
        base_id,
        status,
        payment_status,
        start_date,
        end_date,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 搜索条件
      if (order_number) {
        whereClause.order_number = { [Op.like]: `%${order_number}%` };
      }

      if (customer_id) {
        whereClause.customer_id = customer_id;
      }

      if (base_id) {
        whereClause.base_id = base_id;
      }

      if (status) {
        whereClause.status = status;
      }

      if (payment_status) {
        whereClause.payment_status = payment_status;
      }

      if (start_date && end_date) {
        whereClause.order_date = {
          [Op.between]: [start_date, end_date]
        };
      }

      const { count, rows } = await SalesOrder.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [[sort_by as string, sort_order as string]],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'real_name']
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'username', 'real_name']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          items: rows,
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取销售订单列表失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  // 
获取销售订单详情
  static async getSalesOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const salesOrder = await SalesOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone', 'address']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'address']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'real_name']
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'username', 'real_name']
          },
          {
            model: SalesOrderItem,
            as: 'items',
            include: [
              {
                model: Cattle,
                as: 'cattle',
                attributes: ['id', 'ear_tag', 'breed', 'gender', 'birth_date', 'weight']
              }
            ]
          }
        ]
      });

      if (!salesOrder) {
        throw new NotFoundError('销售订单不存在');
      }

      res.json({
        success: true,
        data: salesOrder
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '获取销售订单详情失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 创建销售订单
  static async createSalesOrder(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        customer_id,
        base_id,
        order_date,
        delivery_date,
        payment_method,
        contract_number,
        remark,
        tax_amount = 0,
        discount_amount = 0,
        items
      } = req.body;

      // 验证必填字段
      if (!customer_id || !base_id || !order_date || !items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('客户、基地、订单日期和订单明细不能为空');
      }

      // 验证客户是否存在
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      // 验证基地是否存在
      const base = await Base.findByPk(base_id);
      if (!base) {
        throw new NotFoundError('基地不存在');
      }

      // 生成订单编号
      const order_number = await generateOrderNumber('SO');

      // 计算订单总金额
      let total_amount = 0;
      for (const item of items) {
        if (!item.cattle_id || !item.unit_price) {
          throw new ValidationError('订单明细中的牛只ID和单价不能为空');
        }
        
        // 验证牛只是否存在
        const cattle = await Cattle.findByPk(item.cattle_id);
        if (!cattle) {
          throw new NotFoundError(`牛只ID ${item.cattle_id} 不存在`);
        }
        
        // 验证牛只是否已售出
        if (cattle.status === 'sold') {
          throw new BusinessError(`牛只 ${cattle.ear_tag} 已售出，不能重复销售`);
        }
        
        // 计算明细总价
        const itemTotal = Number(item.unit_price) * (item.quantity || 1);
        total_amount += itemTotal;
        
        // 设置明细总价
        item.total_price = itemTotal;
        
        // 设置耳标号
        item.ear_tag = cattle.ear_tag;
        
        // 设置品种和重量（如果未提供）
        if (!item.breed) item.breed = cattle.breed;
        if (!item.weight) item.weight = cattle.weight;
      }

      // 应用税额和折扣
      total_amount = total_amount + Number(tax_amount) - Number(discount_amount);

      // 创建销售订单
      const salesOrder = await SalesOrder.create({
        order_number,
        customer_id,
        base_id,
        total_amount,
        tax_amount,
        discount_amount,
        status: 'pending',
        order_date,
        delivery_date,
        payment_status: 'unpaid',
        payment_method,
        contract_number,
        remark,
        created_by: req.user?.id
      }, { transaction });

      // 创建订单明细
      const orderItems = [];
      for (const item of items) {
        const orderItem = await SalesOrderItem.create({
          order_id: salesOrder.id,
          cattle_id: item.cattle_id,
          ear_tag: item.ear_tag,
          breed: item.breed,
          weight: item.weight,
          unit_price: item.unit_price,
          total_price: item.total_price,
          quality_grade: item.quality_grade,
          health_certificate: item.health_certificate,
          quarantine_certificate: item.quarantine_certificate,
          remark: item.remark
        }, { transaction });
        
        orderItems.push(orderItem);
      }

      await transaction.commit();

      // 获取完整的订单信息（包括关联数据）
      const completeOrder = await SalesOrder.findByPk(salesOrder.id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: SalesOrderItem,
            as: 'items',
            include: [
              {
                model: Cattle,
                as: 'cattle',
                attributes: ['id', 'ear_tag', 'breed', 'gender', 'weight']
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: '销售订单创建成功',
        data: completeOrder
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof BusinessError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '创建销售订单失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }  
// 更新销售订单
  static async updateSalesOrder(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // 查找订单
      const salesOrder = await SalesOrder.findByPk(id);
      if (!salesOrder) {
        throw new NotFoundError('销售订单不存在');
      }
      
      // 只有待审批状态的订单可以更新
      if (salesOrder.status !== 'pending') {
        throw new BusinessError('只有待审批状态的订单可以更新');
      }
      
      // 更新订单基本信息
      const allowedFields = [
        'delivery_date', 'payment_method', 'contract_number', 
        'remark', 'tax_amount', 'discount_amount'
      ];
      
      const updateFields: any = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });
      
      // 如果有更新订单明细
      if (updateData.items && Array.isArray(updateData.items)) {
        // 重新计算订单总金额
        let total_amount = 0;
        
        // 删除原有订单明细
        await SalesOrderItem.destroy({
          where: { order_id: id },
          transaction
        });
        
        // 创建新的订单明细
        for (const item of updateData.items) {
          if (!item.cattle_id || !item.unit_price) {
            throw new ValidationError('订单明细中的牛只ID和单价不能为空');
          }
          
          // 验证牛只是否存在
          const cattle = await Cattle.findByPk(item.cattle_id);
          if (!cattle) {
            throw new NotFoundError(`牛只ID ${item.cattle_id} 不存在`);
          }
          
          // 验证牛只是否已售出（排除当前订单中的牛只）
          if (cattle.status === 'sold') {
            // 检查是否是当前订单中的牛只
            const existingItem = await SalesOrderItem.findOne({
              where: {
                order_id: id,
                cattle_id: item.cattle_id
              }
            });
            
            if (!existingItem) {
              throw new BusinessError(`牛只 ${cattle.ear_tag} 已售出，不能添加到订单中`);
            }
          }
          
          // 计算明细总价
          const itemTotal = Number(item.unit_price) * (item.quantity || 1);
          total_amount += itemTotal;
          
          // 设置明细总价
          item.total_price = itemTotal;
          
          // 设置耳标号
          item.ear_tag = cattle.ear_tag;
          
          // 设置品种和重量（如果未提供）
          if (!item.breed) item.breed = cattle.breed;
          if (!item.weight) item.weight = cattle.weight;
          
          // 创建订单明细
          await SalesOrderItem.create({
            order_id: salesOrder.id,
            cattle_id: item.cattle_id,
            ear_tag: item.ear_tag,
            breed: item.breed,
            weight: item.weight,
            unit_price: item.unit_price,
            total_price: item.total_price,
            quality_grade: item.quality_grade,
            health_certificate: item.health_certificate,
            quarantine_certificate: item.quarantine_certificate,
            remark: item.remark
          }, { transaction });
        }
        
        // 应用税额和折扣
        const tax_amount = updateFields.tax_amount !== undefined ? 
          Number(updateFields.tax_amount) : Number(salesOrder.tax_amount);
        const discount_amount = updateFields.discount_amount !== undefined ? 
          Number(updateFields.discount_amount) : Number(salesOrder.discount_amount);
        
        total_amount = total_amount + tax_amount - discount_amount;
        
        // 更新订单总金额
        updateFields.total_amount = total_amount;
      }
      
      // 更新订单
      await salesOrder.update(updateFields, { transaction });
      
      await transaction.commit();
      
      // 获取更新后的完整订单信息
      const updatedOrder = await SalesOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: SalesOrderItem,
            as: 'items',
            include: [
              {
                model: Cattle,
                as: 'cattle',
                attributes: ['id', 'ear_tag', 'breed', 'gender', 'weight']
              }
            ]
          }
        ]
      });
      
      res.json({
        success: true,
        message: '销售订单更新成功',
        data: updatedOrder
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof NotFoundError || error instanceof BusinessError || error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新销售订单失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 审批销售订单
  static async approveSalesOrder(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      
      // 查找订单
      const salesOrder = await SalesOrder.findByPk(id, {
        include: [
          {
            model: SalesOrderItem,
            as: 'items',
            include: [
              {
                model: Cattle,
                as: 'cattle'
              }
            ]
          }
        ]
      });
      
      if (!salesOrder) {
        throw new NotFoundError('销售订单不存在');
      }
      
      // 只有待审批状态的订单可以审批
      if (salesOrder.status !== 'pending') {
        throw new BusinessError('只有待审批状态的订单可以审批');
      }
      
      // 更新订单状态
      await salesOrder.update({
        status: 'approved',
        approved_by: req.user?.id,
        approved_at: new Date()
      }, { transaction });
      
      // 更新牛只状态为已售出
      for (const item of salesOrder.items || []) {
        await item.cattle.update({
          status: 'sold'
        }, { transaction });
      }
      
      await transaction.commit();
      
      // 获取更新后的完整订单信息
      const approvedOrder = await SalesOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'username', 'real_name']
          },
          {
            model: SalesOrderItem,
            as: 'items',
            include: [
              {
                model: Cattle,
                as: 'cattle',
                attributes: ['id', 'ear_tag', 'breed', 'gender', 'weight', 'status']
              }
            ]
          }
        ]
      });
      
      res.json({
        success: true,
        message: '销售订单审批成功',
        data: approvedOrder
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof NotFoundError || error instanceof BusinessError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '审批销售订单失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 取消销售订单
  static async cancelSalesOrder(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      // 查找订单
      const salesOrder = await SalesOrder.findByPk(id, {
        include: [
          {
            model: SalesOrderItem,
            as: 'items',
            include: [
              {
                model: Cattle,
                as: 'cattle'
              }
            ]
          }
        ]
      });
      
      if (!salesOrder) {
        throw new NotFoundError('销售订单不存在');
      }
      
      // 只有待审批或已审批状态的订单可以取消
      if (!['pending', 'approved'].includes(salesOrder.status)) {
        throw new BusinessError('只有待审批或已审批状态的订单可以取消');
      }
      
      // 更新订单状态
      await salesOrder.update({
        status: 'cancelled',
        remark: salesOrder.remark ? 
          `${salesOrder.remark}\n取消原因: ${reason}` : 
          `取消原因: ${reason}`
      }, { transaction });
      
      // 如果订单已审批，需要恢复牛只状态
      if (salesOrder.status === 'approved') {
        for (const item of salesOrder.items || []) {
          await item.cattle.update({
            status: 'active'
          }, { transaction });
        }
      }
      
      await transaction.commit();
      
      // 获取更新后的完整订单信息
      const cancelledOrder = await SalesOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: SalesOrderItem,
            as: 'items',
            include: [
              {
                model: Cattle,
                as: 'cattle',
                attributes: ['id', 'ear_tag', 'breed', 'gender', 'weight', 'status']
              }
            ]
          }
        ]
      });
      
      res.json({
        success: true,
        message: '销售订单取消成功',
        data: cancelledOrder
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof NotFoundError || error instanceof BusinessError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '取消销售订单失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 更新订单交付状态
  static async updateDeliveryStatus(req: Request, res: Response) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { 
        actual_delivery_date, 
        logistics_company, 
        tracking_number,
        delivery_items
      } = req.body;
      
      // 查找订单
      const salesOrder = await SalesOrder.findByPk(id, {
        include: [
          {
            model: SalesOrderItem,
            as: 'items'
          }
        ]
      });
      
      if (!salesOrder) {
        throw new NotFoundError('销售订单不存在');
      }
      
      // 只有已审批状态的订单可以更新交付状态
      if (salesOrder.status !== 'approved') {
        throw new BusinessError('只有已审批状态的订单可以更新交付状态');
      }
      
      // 更新订单交付信息
      const updateFields: any = {
        status: 'delivered'
      };
      
      if (actual_delivery_date) {
        updateFields.actual_delivery_date = actual_delivery_date;
      }
      
      if (logistics_company) {
        updateFields.logistics_company = logistics_company;
      }
      
      if (tracking_number) {
        updateFields.tracking_number = tracking_number;
      }
      
      await salesOrder.update(updateFields, { transaction });
      
      // 更新订单明细交付状态
      if (delivery_items && Array.isArray(delivery_items)) {
        for (const item of delivery_items) {
          const orderItem = await SalesOrderItem.findOne({
            where: {
              id: item.id,
              order_id: id
            }
          });
          
          if (orderItem) {
            await orderItem.update({
              delivery_status: 'delivered',
              health_certificate: item.health_certificate || orderItem.health_certificate,
              quarantine_certificate: item.quarantine_certificate || orderItem.quarantine_certificate
            }, { transaction });
          }
        }
      } else {
        // 如果没有提供明细，则更新所有明细为已交付
        for (const item of salesOrder.items || []) {
          await item.update({
            delivery_status: 'delivered'
          }, { transaction });
        }
      }
      
      await transaction.commit();
      
      // 获取更新后的完整订单信息
      const deliveredOrder = await SalesOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          },
          {
            model: SalesOrderItem,
            as: 'items',
            include: [
              {
                model: Cattle,
                as: 'cattle',
                attributes: ['id', 'ear_tag', 'breed', 'gender', 'weight']
              }
            ]
          }
        ]
      });
      
      res.json({
        success: true,
        message: '销售订单交付状态更新成功',
        data: deliveredOrder
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof NotFoundError || error instanceof BusinessError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新销售订单交付状态失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }  
// 更新订单付款状态
  static async updatePaymentStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { payment_status, payment_method, payment_date, payment_amount, payment_reference } = req.body;
      
      // 查找订单
      const salesOrder = await SalesOrder.findByPk(id);
      
      if (!salesOrder) {
        throw new NotFoundError('销售订单不存在');
      }
      
      // 只有已审批或已交付状态的订单可以更新付款状态
      if (!['approved', 'delivered', 'completed'].includes(salesOrder.status)) {
        throw new BusinessError('只有已审批、已交付或已完成状态的订单可以更新付款状态');
      }
      
      // 验证付款状态
      if (!['unpaid', 'partial', 'paid'].includes(payment_status)) {
        throw new ValidationError('无效的付款状态');
      }
      
      // 更新订单付款信息
      const updateFields: any = {
        payment_status
      };
      
      if (payment_method) {
        updateFields.payment_method = payment_method;
      }
      
      // 如果付款状态为已付款，并且订单状态为已交付，则更新订单状态为已完成
      if (payment_status === 'paid' && salesOrder.status === 'delivered') {
        updateFields.status = 'completed';
      }
      
      // 更新付款备注
      let paymentRemark = '';
      if (payment_date) {
        paymentRemark += `付款日期: ${payment_date}; `;
      }
      if (payment_amount) {
        paymentRemark += `付款金额: ${payment_amount}; `;
      }
      if (payment_reference) {
        paymentRemark += `付款参考号: ${payment_reference}; `;
      }
      
      if (paymentRemark) {
        updateFields.remark = salesOrder.remark ? 
          `${salesOrder.remark}\n${paymentRemark}` : 
          paymentRemark;
      }
      
      await salesOrder.update(updateFields);
      
      // 获取更新后的完整订单信息
      const updatedOrder = await SalesOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          }
        ]
      });
      
      res.json({
        success: true,
        message: '销售订单付款状态更新成功',
        data: updatedOrder
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BusinessError || error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新销售订单付款状态失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 获取销售统计数据
  static async getSalesStatistics(req: Request, res: Response) {
    try {
      const { start_date, end_date, base_id } = req.query;
      
      const whereClause: any = {};
      
      if (start_date && end_date) {
        whereClause.order_date = {
          [Op.between]: [start_date, end_date]
        };
      }
      
      if (base_id) {
        whereClause.base_id = base_id;
      }
      
      // 按状态统计订单数量和金额
      const statusStats = await SalesOrder.findAll({
        where: whereClause,
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'order_count'],
          [fn('SUM', col('total_amount')), 'total_amount']
        ],
        group: ['status'],
        raw: true
      });
      
      // 按月统计销售额
      const monthlyStats = await SalesOrder.findAll({
        where: {
          ...whereClause,
          status: { [Op.in]: ['approved', 'delivered', 'completed'] }
        },
        attributes: [
          [fn('DATE_TRUNC', 'month', col('order_date')), 'month'],
          [fn('COUNT', col('id')), 'order_count'],
          [fn('SUM', col('total_amount')), 'total_amount']
        ],
        group: [fn('DATE_TRUNC', 'month', col('order_date'))],
        order: [[fn('DATE_TRUNC', 'month', col('order_date')), 'ASC']],
        raw: true
      });
      
      // 按客户统计销售额
      const customerStats = await SalesOrder.findAll({
        where: {
          ...whereClause,
          status: { [Op.in]: ['approved', 'delivered', 'completed'] }
        },
        attributes: [
          'customer_id',
          [fn('COUNT', col('id')), 'order_count'],
          [fn('SUM', col('total_amount')), 'total_amount']
        ],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['name']
          }
        ],
        group: ['customer_id', 'customer.id', 'customer.name'],
        order: [[fn('SUM', col('total_amount')), 'DESC']],
        limit: 10,
        raw: true
      });
      
      // 按基地统计销售额
      const baseStats = await SalesOrder.findAll({
        where: {
          ...whereClause,
          status: { [Op.in]: ['approved', 'delivered', 'completed'] }
        },
        attributes: [
          'base_id',
          [fn('COUNT', col('id')), 'order_count'],
          [fn('SUM', col('total_amount')), 'total_amount']
        ],
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['name']
          }
        ],
        group: ['base_id', 'base.id', 'base.name'],
        raw: true
      });
      
      // 计算总销售额和订单数
      const totalStats = await SalesOrder.findAll({
        where: {
          ...whereClause,
          status: { [Op.in]: ['approved', 'delivered', 'completed'] }
        },
        attributes: [
          [fn('COUNT', col('id')), 'total_orders'],
          [fn('SUM', col('total_amount')), 'total_sales'],
          [fn('AVG', col('total_amount')), 'avg_order_value']
        ],
        raw: true
      });
      
      res.json({
        success: true,
        data: {
          total_statistics: totalStats[0] || { total_orders: 0, total_sales: 0, avg_order_value: 0 },
          status_statistics: statusStats,
          monthly_statistics: monthlyStats,
          customer_statistics: customerStats,
          base_statistics: baseStats,
          period: { start_date, end_date }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取销售统计数据失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}