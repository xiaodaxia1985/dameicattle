import Redis from 'redis';
import { createLogger } from '../logger';

const logger = createLogger('event-bus');

export interface EventData {
  eventType: string;
  payload: any;
  timestamp: number;
  source: string;
  correlationId?: string;
}

export type EventHandler = (data: EventData) => Promise<void>;

export class EventBus {
  private publisher!: Redis.RedisClientType;
  private subscriber!: Redis.RedisClientType;
  private handlers: Map<string, EventHandler[]> = new Map();
  private isConnected = false;

  constructor(private redisUrl: string) {}

  async connect(): Promise<void> {
    try {
      // 创建发布者连接
      this.publisher = Redis.createClient({ url: this.redisUrl });
      await this.publisher.connect();

      // 创建订阅者连接
      this.subscriber = Redis.createClient({ url: this.redisUrl });
      await this.subscriber.connect();

      this.isConnected = true;
      logger.info('事件总线连接成功');
    } catch (error) {
      logger.error('事件总线连接失败:', error);
      throw error;
    }
  }

  async publish(eventType: string, payload: any, source: string, correlationId?: string): Promise<void> {
    if (!this.isConnected) {
      logger.warn('事件总线未连接，跳过发布');
      return;
    }

    try {
      const eventData: EventData = {
        eventType,
        payload,
        timestamp: Date.now(),
        source,
        correlationId
      };

      await this.publisher.publish(`cattle_mgmt:events:${eventType}`, JSON.stringify(eventData));
      logger.debug(`事件发布成功: ${eventType}`, { source, correlationId });
    } catch (error) {
      logger.error(`事件发布失败: ${eventType}`, error);
      throw error;
    }
  }

  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    if (!this.isConnected) {
      logger.warn('事件总线未连接，跳过订阅');
      return;
    }

    try {
      // 添加处理器
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, []);
      }
      this.handlers.get(eventType)!.push(handler);

      // 订阅Redis频道
      await this.subscriber.subscribe(`cattle_mgmt:events:${eventType}`, async (message) => {
        try {
          const eventData: EventData = JSON.parse(message);
          const handlers = this.handlers.get(eventType) || [];
          
          // 并行执行所有处理器
          await Promise.all(handlers.map(h => h(eventData)));
          
          logger.debug(`事件处理完成: ${eventType}`, { 
            handlersCount: handlers.length,
            correlationId: eventData.correlationId 
          });
        } catch (error) {
          logger.error(`事件处理失败: ${eventType}`, error);
        }
      });

      logger.info(`事件订阅成功: ${eventType}`);
    } catch (error) {
      logger.error(`事件订阅失败: ${eventType}`, error);
      throw error;
    }
  }

  async unsubscribe(eventType: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.subscriber.unsubscribe(`cattle_mgmt:events:${eventType}`);
      this.handlers.delete(eventType);
      logger.info(`取消事件订阅: ${eventType}`);
    } catch (error) {
      logger.error(`取消事件订阅失败: ${eventType}`, error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.publisher) {
      await this.publisher.disconnect();
    }
    if (this.subscriber) {
      await this.subscriber.disconnect();
    }
    this.isConnected = false;
    logger.info('事件总线连接已关闭');
  }

  // 常用事件类型定义
  static readonly Events = {
    // 用户事件
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    
    // 牛只事件
    CATTLE_CREATED: 'cattle.created',
    CATTLE_UPDATED: 'cattle.updated',
    CATTLE_DELETED: 'cattle.deleted',
    CATTLE_TRANSFERRED: 'cattle.transferred',
    
    // 健康事件
    HEALTH_RECORD_CREATED: 'health.record.created',
    VACCINATION_COMPLETED: 'health.vaccination.completed',
    DISEASE_DETECTED: 'health.disease.detected',
    
    // 饲养事件
    FEEDING_COMPLETED: 'feeding.completed',
    FEED_FORMULA_UPDATED: 'feeding.formula.updated',
    
    // 库存事件
    INVENTORY_LOW: 'inventory.low',
    INVENTORY_UPDATED: 'inventory.updated',
    
    // 设备事件
    EQUIPMENT_FAILURE: 'equipment.failure',
    MAINTENANCE_DUE: 'equipment.maintenance.due',
    
    // 采购事件
    PURCHASE_ORDER_CREATED: 'procurement.order.created',
    PURCHASE_ORDER_COMPLETED: 'procurement.order.completed',
    
    // 销售事件
    SALES_ORDER_CREATED: 'sales.order.created',
    SALES_ORDER_COMPLETED: 'sales.order.completed'
  } as const;
}