import Redis from 'redis';
import { createLogger } from './logger';

const logger = createLogger('EventBus');

export class EventBus {
  private publisher: any;
  private subscriber: any;
  private isConnected = false;

  constructor(private redisUrl: string) {}

  async connect() {
    try {
      this.publisher = Redis.createClient({ url: this.redisUrl });
      this.subscriber = Redis.createClient({ url: this.redisUrl });

      await this.publisher.connect();
      await this.subscriber.connect();

      this.isConnected = true;
      logger.info('EventBus connected to Redis');
    } catch (error: any) {
      logger.error('Failed to connect EventBus to Redis', { error: error.message });
      throw error;
    }
  }

  async publish(channel: string, data: any) {
    if (!this.isConnected) {
      throw new Error('EventBus not connected');
    }

    try {
      const message = JSON.stringify({
        timestamp: new Date().toISOString(),
        data
      });
      
      await this.publisher.publish(channel, message);
      logger.debug('Event published', { channel, data });
    } catch (error: any) {
      logger.error('Failed to publish event', { channel, error: error.message });
      throw error;
    }
  }

  async subscribe(channel: string, handler: (data: any) => void) {
    if (!this.isConnected) {
      throw new Error('EventBus not connected');
    }

    try {
      await this.subscriber.subscribe(channel, (message: string) => {
        try {
          const parsed = JSON.parse(message);
          handler(parsed.data);
          logger.debug('Event received', { channel, data: parsed.data });
        } catch (error: any) {
          logger.error('Failed to parse event message', { channel, message, error: error.message });
        }
      });
      
      logger.info('Subscribed to channel', { channel });
    } catch (error: any) {
      logger.error('Failed to subscribe to channel', { channel, error: error.message });
      throw error;
    }
  }

  async disconnect() {
    if (this.publisher) await this.publisher.disconnect();
    if (this.subscriber) await this.subscriber.disconnect();
    this.isConnected = false;
    logger.info('EventBus disconnected');
  }
}