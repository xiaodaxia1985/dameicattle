import { Transaction } from 'sequelize';
import { sequelize } from '@/config/database';
import { 
  Cattle, 
  HealthRecord, 
  VaccinationRecord, 
  FeedingRecord, 
  InventoryTransaction, 
  PurchaseOrder, 
  PurchaseOrderItem,
  SalesOrder,
  SalesOrderItem,
  ProductionMaterial,
  Inventory,
  Base,
  User
} from '@/models';
import { logger } from '@/utils/logger';

export interface DataFlowEvent {
  id: string;
  source_module: string;
  target_module: string;
  event_type: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  processed_at?: Date;
  error_message?: string;
}

export interface DataConsistencyCheck {
  module: string;
  table: string;
  check_type: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  affected_records?: number;
  details?: any;
}

export class DataIntegrationService {
  private static dataFlowQueue: DataFlowEvent[] = [];
  private static isProcessing = false;

  /**
   * 处理采购订单完成后的数据流转
   */
  static async handlePurchaseOrderCompletion(orderId: number, transaction?: Transaction): Promise<void> {
    const t = transaction || await sequelize.transaction();
    
    try {
      const order = await PurchaseOrder.findByPk(orderId, {
        include: [
          {
            model: PurchaseOrderItem,
            as: 'items'
          }
        ],
        transaction: t
      });

      if (!order || order.status !== 'completed') {
        throw new Error('采购订单不存在或状态不正确');
      }

      // 处理不同类型的采购项目
      for (const item of order.items) {
        switch (item.item_type) {
          case 'cattle':
            await this.processCattlePurchase(order, item, t);
            break;
          case 'material':
            await this.processMaterialPurchase(order, item, t);
            break;
          case 'equipment':
            await this.processEquipmentPurchase(order, item, t);
            break;
        }
      }

      // 记录数据流转事件
      this.addDataFlowEvent({
        id: `purchase_completion_${orderId}`,
        source_module: 'purchase',
        target_module: 'inventory',
        event_type: 'purchase_completed',
        data: {
          order_id: orderId,
          total_amount: order.total_amount,
          items_count: order.items.length
        },
        status: 'completed',
        created_at: new Date(),
        processed_at: new Date()
      });

      if (!transaction) {
        await t.commit();
      }

      logger.info(`采购订单 ${orderId} 数据流转处理完成`);
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      logger.error(`采购订单 ${orderId} 数据流转处理失败:`, error);
      throw error;
    }
  }

  /**
   * 处理牛只采购
   */
  private static async processCattlePurchase(
    order: PurchaseOrder, 
    item: PurchaseOrderItem, 
    transaction: Transaction
  ): Promise<void> {
    // 创建牛只记录
    const cattle = await Cattle.create({
      ear_tag: `PO${order.id}_${item.id}`, // 临时耳标，后续可修改
      breed: item.specification || '未知品种',
      gender: 'unknown',
      birth_date: null,
      weight: null,
      health_status: 'healthy',
      base_id: order.base_id,
      barn_id: null, // 需要后续分配
      source: 'purchase',
      purchase_price: item.unit_price,
      purchase_date: order.actual_delivery_date || new Date(),
      supplier_id: order.supplier_id
    }, { transaction });

    // 创建牛只事件记录
    await cattle.createEvent({
      event_type: 'purchase',
      event_date: order.actual_delivery_date || new Date(),
      description: `从供应商采购，订单号：${order.order_number}`,
      operator_id: order.created_by
    }, { transaction });

    logger.info(`创建牛只记录: ${cattle.ear_tag}`);
  }

  /**
   * 处理物资采购
   */
  private static async processMaterialPurchase(
    order: PurchaseOrder, 
    item: PurchaseOrderItem, 
    transaction: Transaction
  ): Promise<void> {
    // 更新库存
    const [inventory] = await Inventory.findOrCreate({
      where: {
        material_id: item.item_id,
        base_id: order.base_id
      },
      defaults: {
        current_stock: 0,
        reserved_stock: 0
      },
      transaction
    });

    // 增加库存
    await inventory.increment('current_stock', {
      by: item.received_quantity || item.quantity,
      transaction
    });

    // 创建库存变动记录
    await InventoryTransaction.create({
      material_id: item.item_id,
      base_id: order.base_id,
      transaction_type: '入库',
      quantity: item.received_quantity || item.quantity,
      unit_price: item.unit_price,
      reference_type: 'purchase_order',
      reference_id: order.id,
      batch_number: `PO${order.id}`,
      operator_id: order.created_by,
      remark: `采购入库，订单号：${order.order_number}`
    }, { transaction });

    logger.info(`物资入库: 物资ID ${item.item_id}, 数量 ${item.received_quantity || item.quantity}`);
  }

  /**
   * 处理设备采购
   */
  private static async processEquipmentPurchase(
    order: PurchaseOrder, 
    item: PurchaseOrderItem, 
    transaction: Transaction
  ): Promise<void> {
    // 设备采购通常需要手动创建设备记录，这里只记录事件
    logger.info(`设备采购完成: ${item.item_name}, 需要手动创建设备档案`);
  }

  /**
   * 处理销售订单完成后的数据流转
   */
  static async handleSalesOrderCompletion(orderId: number, transaction?: Transaction): Promise<void> {
    const t = transaction || await sequelize.transaction();
    
    try {
      const order = await SalesOrder.findByPk(orderId, {
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
        ],
        transaction: t
      });

      if (!order || order.status !== 'completed') {
        throw new Error('销售订单不存在或状态不正确');
      }

      // 更新牛只状态为已售出
      for (const item of order.items) {
        if (item.cattle) {
          await item.cattle.update({
            status: 'sold',
            sale_date: order.actual_delivery_date || new Date(),
            sale_price: item.unit_price
          }, { transaction: t });

          // 创建牛只事件记录
          await item.cattle.createEvent({
            event_type: 'sale',
            event_date: order.actual_delivery_date || new Date(),
            description: `销售给客户，订单号：${order.order_number}`,
            operator_id: order.created_by
          }, { transaction: t });
        }
      }

      // 记录数据流转事件
      this.addDataFlowEvent({
        id: `sales_completion_${orderId}`,
        source_module: 'sales',
        target_module: 'cattle',
        event_type: 'sales_completed',
        data: {
          order_id: orderId,
          total_amount: order.total_amount,
          cattle_count: order.items.length
        },
        status: 'completed',
        created_at: new Date(),
        processed_at: new Date()
      });

      if (!transaction) {
        await t.commit();
      }

      logger.info(`销售订单 ${orderId} 数据流转处理完成`);
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      logger.error(`销售订单 ${orderId} 数据流转处理失败:`, error);
      throw error;
    }
  }

  /**
   * 处理饲喂记录对库存的影响
   */
  static async handleFeedingRecordCreation(feedingRecordId: number, transaction?: Transaction): Promise<void> {
    const t = transaction || await sequelize.transaction();
    
    try {
      const feedingRecord = await FeedingRecord.findByPk(feedingRecordId, {
        include: [
          {
            model: require('@/models').FeedFormula,
            as: 'formula'
          }
        ],
        transaction: t
      });

      if (!feedingRecord || !feedingRecord.formula) {
        throw new Error('饲喂记录或配方不存在');
      }

      // 解析配方成分并扣减库存
      const ingredients = feedingRecord.formula.ingredients as any[];
      
      for (const ingredient of ingredients) {
        // 查找对应的物资
        const material = await ProductionMaterial.findOne({
          where: { name: ingredient.name },
          transaction: t
        });

        if (material) {
          // 计算消耗量
          const consumedQuantity = (feedingRecord.amount * ingredient.ratio) / 100;

          // 查找库存
          const inventory = await Inventory.findOne({
            where: {
              material_id: material.id,
              base_id: feedingRecord.base_id
            },
            transaction: t
          });

          if (inventory && inventory.current_stock >= consumedQuantity) {
            // 扣减库存
            await inventory.decrement('current_stock', {
              by: consumedQuantity,
              transaction: t
            });

            // 创建库存变动记录
            await InventoryTransaction.create({
              material_id: material.id,
              base_id: feedingRecord.base_id,
              transaction_type: '出库',
              quantity: -consumedQuantity,
              reference_type: 'feeding_record',
              reference_id: feedingRecordId,
              operator_id: feedingRecord.operator_id,
              remark: `饲喂消耗，配方：${feedingRecord.formula.name}`
            }, { transaction: t });
          } else {
            logger.warn(`库存不足: 物资 ${material.name}, 需要 ${consumedQuantity}, 库存 ${inventory?.current_stock || 0}`);
          }
        }
      }

      if (!transaction) {
        await t.commit();
      }

      logger.info(`饲喂记录 ${feedingRecordId} 库存扣减处理完成`);
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      logger.error(`饲喂记录 ${feedingRecordId} 库存扣减处理失败:`, error);
      throw error;
    }
  }

  /**
   * 处理健康记录对牛只状态的影响
   */
  static async handleHealthRecordUpdate(healthRecordId: number, transaction?: Transaction): Promise<void> {
    const t = transaction || await sequelize.transaction();
    
    try {
      const healthRecord = await HealthRecord.findByPk(healthRecordId, {
        include: [
          {
            model: Cattle,
            as: 'cattle'
          }
        ],
        transaction: t
      });

      if (!healthRecord || !healthRecord.cattle) {
        throw new Error('健康记录或牛只不存在');
      }

      // 根据健康记录状态更新牛只健康状态
      let newHealthStatus = healthRecord.cattle.health_status;
      
      switch (healthRecord.status) {
        case 'ongoing':
          newHealthStatus = 'sick';
          break;
        case 'completed':
          // 检查是否还有其他进行中的健康记录
          const ongoingRecords = await HealthRecord.count({
            where: {
              cattle_id: healthRecord.cattle_id,
              status: 'ongoing'
            },
            transaction: t
          });
          
          if (ongoingRecords === 0) {
            newHealthStatus = 'healthy';
          }
          break;
        case 'treatment':
          newHealthStatus = 'treatment';
          break;
      }

      // 更新牛只健康状态
      if (newHealthStatus !== healthRecord.cattle.health_status) {
        await healthRecord.cattle.update({
          health_status: newHealthStatus
        }, { transaction: t });

        // 创建牛只事件记录
        await healthRecord.cattle.createEvent({
          event_type: 'health_status_change',
          event_date: new Date(),
          description: `健康状态变更为：${newHealthStatus}`,
          operator_id: healthRecord.veterinarian_id
        }, { transaction: t });
      }

      if (!transaction) {
        await t.commit();
      }

      logger.info(`健康记录 ${healthRecordId} 牛只状态更新处理完成`);
    } catch (error) {
      if (!transaction) {
        await t.rollback();
      }
      logger.error(`健康记录 ${healthRecordId} 牛只状态更新处理失败:`, error);
      throw error;
    }
  }

  /**
   * 添加数据流转事件到队列
   */
  private static addDataFlowEvent(event: DataFlowEvent): void {
    this.dataFlowQueue.push(event);
    
    // 如果没有在处理，启动处理
    if (!this.isProcessing) {
      this.processDataFlowQueue();
    }
  }

  /**
   * 处理数据流转队列
   */
  private static async processDataFlowQueue(): Promise<void> {
    if (this.isProcessing || this.dataFlowQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.dataFlowQueue.length > 0) {
        const event = this.dataFlowQueue.shift();
        if (event) {
          await this.processDataFlowEvent(event);
        }
      }
    } catch (error) {
      logger.error('处理数据流转队列失败:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 处理单个数据流转事件
   */
  private static async processDataFlowEvent(event: DataFlowEvent): Promise<void> {
    try {
      event.status = 'processing';
      
      // 这里可以添加具体的事件处理逻辑
      // 例如发送通知、更新相关模块等
      
      event.status = 'completed';
      event.processed_at = new Date();
      
      logger.info(`数据流转事件处理完成: ${event.id}`);
    } catch (error) {
      event.status = 'failed';
      event.error_message = error instanceof Error ? error.message : String(error);
      event.processed_at = new Date();
      
      logger.error(`数据流转事件处理失败: ${event.id}`, error);
    }
  }

  /**
   * 获取数据流转事件历史
   */
  static getDataFlowHistory(limit: number = 100): DataFlowEvent[] {
    return this.dataFlowQueue
      .filter(event => event.status === 'completed' || event.status === 'failed')
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  /**
   * 获取待处理的数据流转事件
   */
  static getPendingDataFlowEvents(): DataFlowEvent[] {
    return this.dataFlowQueue.filter(event => 
      event.status === 'pending' || event.status === 'processing'
    );
  }
}