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
          message: '采购订单不存在',
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
          message: '订单必须包含至少一个商品',
          code: 'NO_ORDER_ITEMS'
        })
      }

      // 生成订单号
      const orderNumber = await generateOrderNumber()

      // 计算订单总金额
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

      // 重新查询完整的订单信息
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
          message: '采购订单不存在',
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

      // 计算订单总金额
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

      // 删除原有的订单明细
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

      // 重新查询完整的订单信息
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
          message: '采购订单不存在',
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

      // 更新订单状态
      await order.update({
        status: 'approved',
        approvedBy: user.id,
        approvedByName: user.name,
        approvedAt: new Date()
      })

      // 重新查询完整的订单信息
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
          message: '采购订单不存在',
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

      // 更新订单状态
      await order.update({
        status: 'cancelled',
        cancelReason: reason || '用户手动取消',
        cancelledBy: user.id,
        cancelledByName: user.name,
        cancelledAt: new Date()
      })

      // 重新查询完整的订单信息
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
            errors.push({ orderId, message: '订单不存在' })
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
        message: `批量审批完成，成功 ${approvedOrders.length} 个，失败 ${errors.length} 个`
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
          message: '采购订单不存在',
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

      // 获取供应商统计
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