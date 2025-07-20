import { Request, Response } from 'express';
import { Op, fn, col, literal, Transaction } from 'sequelize';
import { sequelize } from '@/config/database';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { PurchaseOrderItem } from '@/models/PurchaseOrderItem';
import { Supplier } from '@/models/Supplier';
import { Base } from '@/models/Base';
import { User } from '@/models/User';
import { ProductionMaterial } from '@/models/ProductionMaterial';
import { Inventory } from '@/models/Inventory';
import { InventoryTransaction } from '@/models/InventoryTransaction';
import { ValidationError, NotFoundError } from '@/utils/errors';

export class PurchaseOrderController {
  // 生成订单编号
  private static async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastOrder = await PurchaseOrder.findOne({
      where: {
        order_number: {
          [Op.like]: `PO${dateStr}%`
        }
      },
      order: [['order_number', 'DESC']]
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.order_number.slice(-4));
      sequence = lastSequence + 1;
    }

    return `PO${dateStr}${sequence.toString().padStart(4, '0')}`;
  }

  // 获取采购订单列表
  static async getPurchaseOrders(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        supplier_id,
        base_id,
        status,
        order_type,
        start_date,
        end_date,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 搜索条件
      if (search) {
        whereClause[Op.or] = [
          { order_number: { [Op.iLike]: `%${search}%` } },
          { contract_number: { [Op.iLike]: `%${search}%` } },
          { remark: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (supplier_id) {
        whereClause.supplier_id = supplier_id;
      }

      if (base_id) {
        whereClause.base_id = base_id;
      }

      if (status) {
        whereClause.status = status;
      }

      if (order_type) {
        whereClause.order_type = order_type;
      }

      if (start_date && end_date) {
        whereClause.order_date = {
          [Op.between]: [start_date, end_date]
        };
      }

      const { count, rows } = await PurchaseOrder.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [[sort_by as string, sort_order as string]],
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person', 'phone']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code']
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name']
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'real_name']
          }
        ]
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取采购订单列表失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取采购订单详情
  static async getPurchaseOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const order = await PurchaseOrder.findByPk(id, {
        include: [
          {
            model: Supplier,
            as: 'supplier'
          },
          {
            model: Base,
            as: 'base'
          },
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'real_name']
          },
          {
            model: User,
            as: 'approver',
            attributes: ['id', 'real_name']
          },
          {
            model: PurchaseOrderItem,
            as: 'items'
          }
        ]
      });

      if (!order) {
        throw new NotFoundError('采购订单不存在');
      }

      res.json({
        success: true,
        data: order
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
          message: '获取采购订单详情失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 创建采购订单
  static async createPurchaseOrder(req: Request, res: Response) {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const {
        supplier_id,
        base_id,
        order_type,
        expected_delivery_date,
        payment_method,
        contract_number,
        remark,
        items
      } = req.body;

      const user_id = (req as any).user.id;

      // 验证必填字段
      if (!supplier_id || !base_id || !order_type || !items || !Array.isArray(items) || items.length === 0) {
        throw new ValidationError('请填写完整的订单信息');
      }

      // 验证供应商和基地是否存在
      const supplier = await Supplier.findByPk(supplier_id);
      if (!supplier) {
        throw new ValidationError('供应商不存在');
      }

      const base = await Base.findByPk(base_id);
      if (!base) {
        throw new ValidationError('基地不存在');
      }

      // 生成订单编号
      const order_number = await PurchaseOrderController.generateOrderNumber();

      // 计算订单总金额
      let total_amount = 0;
      const validatedItems = [];

      for (const item of items) {
        if (!item.item_name || !item.quantity || !item.unit || !item.unit_price) {
          throw new ValidationError('订单明细信息不完整');
        }

        const total_price = Number(item.quantity) * Number(item.unit_price);
        total_amount += total_price;

        validatedItems.push({
          ...item,
          total_price
        });
      }

      // 创建采购订单
      const order = await PurchaseOrder.create({
        order_number,
        supplier_id,
        base_id,
        order_type,
        total_amount,
        tax_amount: req.body.tax_amount || 0,
        discount_amount: req.body.discount_amount || 0,
        status: 'pending',
        order_date: new Date(),
        expected_delivery_date,
        payment_status: 'unpaid',
        payment_method,
        contract_number,
        remark,
        created_by: user_id
      }, { transaction });

      // 创建订单明细
      for (const item of validatedItems) {
        await PurchaseOrderItem.create({
          order_id: order.id,
          ...item
        }, { transaction });
      }

      await transaction.commit();

      // 返回完整的订单信息
      const createdOrder = await PurchaseOrder.findByPk(order.id, {
        include: [
          {
            model: Supplier,
            as: 'supplier'
          },
          {
            model: Base,
            as: 'base'
          },
          {
            model: PurchaseOrderItem,
            as: 'items'
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: '采购订单创建成功',
        data: createdOrder
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '创建采购订单失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 更新采购订单
  static async updatePurchaseOrder(req: Request, res: Response) {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const updateData = req.body;

      const order = await PurchaseOrder.findByPk(id);
      if (!order) {
        throw new NotFoundError('采购订单不存在');
      }

      // 检查订单状态是否允许修改
      if (order.status === 'completed' || order.status === 'cancelled') {
        throw new ValidationError('已完成或已取消的订单不能修改');
      }

      // 如果更新了明细，重新计算总金额
      if (updateData.items) {
        let total_amount = 0;
        
        // 删除原有明细
        await PurchaseOrderItem.destroy({
          where: { order_id: id },
          transaction
        });

        // 创建新明细
        for (const item of updateData.items) {
          const total_price = Number(item.quantity) * Number(item.unit_price);
          total_amount += total_price;

          await PurchaseOrderItem.create({
            order_id: Number(id),
            ...item,
            total_price
          }, { transaction });
        }

        updateData.total_amount = total_amount;
        delete updateData.items;
      }

      await order.update(updateData, { transaction });
      await transaction.commit();

      // 返回更新后的订单信息
      const updatedOrder = await PurchaseOrder.findByPk(id, {
        include: [
          {
            model: Supplier,
            as: 'supplier'
          },
          {
            model: Base,
            as: 'base'
          },
          {
            model: PurchaseOrderItem,
            as: 'items'
          }
        ]
      });

      res.json({
        success: true,
        message: '采购订单更新成功',
        data: updatedOrder
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新采购订单失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 删除采购订单
  static async deletePurchaseOrder(req: Request, res: Response) {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;

      const order = await PurchaseOrder.findByPk(id);
      if (!order) {
        throw new NotFoundError('采购订单不存在');
      }

      // 检查订单状态
      if (order.status === 'completed') {
        throw new ValidationError('已完成的订单不能删除');
      }

      // 删除订单明细
      await PurchaseOrderItem.destroy({
        where: { order_id: id },
        transaction
      });

      // 删除订单
      await order.destroy({ transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: '采购订单删除成功'
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '删除采购订单失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 审批采购订单
  static async approvePurchaseOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { action, comment } = req.body; // action: 'approve' | 'reject'
      const user_id = (req as any).user.id;

      const order = await PurchaseOrder.findByPk(id);
      if (!order) {
        throw new NotFoundError('采购订单不存在');
      }

      if (order.status !== 'pending') {
        throw new ValidationError('只有待审批的订单才能进行审批操作');
      }

      const updateData: any = {
        approved_by: user_id,
        approved_at: new Date()
      };

      if (action === 'approve') {
        updateData.status = 'approved';
      } else if (action === 'reject') {
        updateData.status = 'rejected';
      } else {
        throw new ValidationError('无效的审批操作');
      }

      await order.update(updateData);

      res.json({
        success: true,
        message: action === 'approve' ? '订单审批通过' : '订单已拒绝',
        data: { action, comment }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '审批操作失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 确认收货
  static async confirmReceipt(req: Request, res: Response) {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { items, actual_delivery_date } = req.body;

      const order = await PurchaseOrder.findByPk(id, {
        include: [
          {
            model: PurchaseOrderItem,
            as: 'items'
          }
        ]
      });

      if (!order) {
        throw new NotFoundError('采购订单不存在');
      }

      if (order.status !== 'approved') {
        throw new ValidationError('只有已审批的订单才能确认收货');
      }

      // 更新订单明细的收货数量
      for (const item of items) {
        const orderItem = await PurchaseOrderItem.findByPk(item.id);
        if (orderItem && orderItem.order_id === Number(id)) {
          await orderItem.update({
            received_quantity: item.received_quantity,
            quality_status: item.quality_status || 'passed'
          }, { transaction });

          // 如果是物资类型，更新库存
          if (orderItem.item_type === 'material' && orderItem.item_id) {
            const material = await ProductionMaterial.findByPk(orderItem.item_id);
            if (material) {
              // 更新库存
              const [inventory] = await Inventory.findOrCreate({
                where: {
                  material_id: orderItem.item_id,
                  base_id: order.base_id
                },
                defaults: {
                  material_id: orderItem.item_id,
                  base_id: order.base_id,
                  current_stock: 0,
                  reserved_stock: 0
                },
                transaction
              });

              await inventory.update({
                current_stock: Number(inventory.current_stock) + Number(item.received_quantity),
                last_updated: new Date()
              }, { transaction });

              // 记录库存变动
              await InventoryTransaction.create({
                material_id: orderItem.item_id,
                base_id: order.base_id,
                transaction_type: '入库',
                quantity: item.received_quantity,
                unit_price: orderItem.unit_price,
                reference_type: 'purchase_order',
                reference_id: order.id,
                operator_id: (req as any).user.id,
                remark: `采购订单${order.order_number}收货入库`
              }, { transaction });
            }
          }
        }
      }

      // 检查是否全部收货完成
      const allItems = await PurchaseOrderItem.findAll({
        where: { order_id: id }
      });

      const allReceived = allItems.every(item => 
        Number(item.received_quantity) >= Number(item.quantity)
      );

      // 更新订单状态
      await order.update({
        status: allReceived ? 'completed' : 'partial_received',
        actual_delivery_date: actual_delivery_date || new Date()
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: '收货确认成功',
        data: { status: allReceived ? 'completed' : 'partial_received' }
      });
    } catch (error) {
      await transaction.rollback();
      
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '确认收货失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 获取采购统计
  static async getPurchaseStatistics(req: Request, res: Response) {
    try {
      const { start_date, end_date, base_id, supplier_id } = req.query;

      const whereClause: any = {};
      
      if (start_date && end_date) {
        whereClause.order_date = {
          [Op.between]: [start_date, end_date]
        };
      }

      if (base_id) {
        whereClause.base_id = base_id;
      }

      if (supplier_id) {
        whereClause.supplier_id = supplier_id;
      }

      // 总体统计
      const overallStats = await PurchaseOrder.findOne({
        where: whereClause,
        attributes: [
          [fn('COUNT', col('id')), 'total_orders'],
          [fn('SUM', col('total_amount')), 'total_amount'],
          [fn('AVG', col('total_amount')), 'avg_amount'],
          [fn('COUNT', literal("CASE WHEN status = 'completed' THEN 1 END")), 'completed_orders'],
          [fn('COUNT', literal("CASE WHEN status = 'pending' THEN 1 END")), 'pending_orders']
        ],
        raw: true
      });

      // 按状态统计
      const statusStats = await PurchaseOrder.findAll({
        where: whereClause,
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'count'],
          [fn('SUM', col('total_amount')), 'amount']
        ],
        group: ['status'],
        raw: true
      });

      // 按月统计
      const monthlyStats = await PurchaseOrder.findAll({
        where: whereClause,
        attributes: [
          [fn('DATE_TRUNC', 'month', col('order_date')), 'month'],
          [fn('COUNT', col('id')), 'order_count'],
          [fn('SUM', col('total_amount')), 'total_amount']
        ],
        group: [fn('DATE_TRUNC', 'month', col('order_date'))],
        order: [[fn('DATE_TRUNC', 'month', col('order_date')), 'ASC']],
        raw: true
      });

      // 供应商排行
      const supplierRanking = await PurchaseOrder.findAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name']
          }
        ],
        attributes: [
          'supplier_id',
          [fn('COUNT', col('PurchaseOrder.id')), 'order_count'],
          [fn('SUM', col('total_amount')), 'total_amount']
        ],
        group: ['supplier_id', 'supplier.id', 'supplier.name'],
        order: [[fn('SUM', col('total_amount')), 'DESC']],
        limit: 10,
        raw: false
      });

      res.json({
        success: true,
        data: {
          overall: overallStats,
          by_status: statusStats,
          monthly: monthlyStats,
          supplier_ranking: supplierRanking
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取采购统计失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取待处理订单
  static async getPendingOrders(req: Request, res: Response) {
    try {
      const user_id = (req as any).user.id;
      const user_role = (req as any).user.role;

      const whereClause: any = {
        status: 'pending'
      };

      // 根据用户权限过滤
      if (user_role !== 'admin') {
        whereClause.created_by = user_id;
      }

      const pendingOrders = await PurchaseOrder.findAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name']
          },
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name']
          }
        ],
        order: [['created_at', 'ASC']],
        limit: 20
      });

      res.json({
        success: true,
        data: pendingOrders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取待处理订单失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}