import { createClient, RedisClientType } from 'redis';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { configManager } from './ConfigManager';

export interface CacheInterface {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: Date;
  responseTime?: number;
  connectionCount?: number;
  memoryUsage?: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

/**
 * In-memory cache fallback implementation
 */
class MemoryCache implements CacheInterface {
  private cache = new Map<string, { value: string; expires?: number }>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes (skip in test environment)
    if (process.env.NODE_ENV !== 'test') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000);
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + (ttl * 1000) : undefined;
    this.cache.set(key, { value, expires });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires && now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

/**
 * Redis cache implementation with connection management
 */
class RedisCache implements CacheInterface {
  private client: RedisClientType;
  private config: RedisConfig;

  constructor(client: RedisClientType, config: RedisConfig) {
    this.client = client;
    this.config = config;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushDb();
    } catch (error) {
      logger.error('Redis CLEAR error:', error);
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error:', error);
      throw error;
    }
  }
}

/**
 * Redis connection manager with fallback mechanisms
 */
export class RedisManager extends EventEmitter {
  private static instance: RedisManager;
  private client: RedisClientType | null = null;
  private config: RedisConfig;
  private cache: CacheInterface;
  private memoryCache: MemoryCache;
  private redisCache: RedisCache | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private maxRetries = 3;
  private retryDelay = 1000;
  private connectTimeout = 10000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private lastHealthCheck: HealthStatus;

  private constructor() {
    super();
    this.memoryCache = new MemoryCache();
    this.cache = this.memoryCache; // Start with memory cache as fallback
    
    // Initialize default config
    this.config = {
      host: 'localhost',
      port: 6379,
      db: 0,
    };

    this.lastHealthCheck = {
      status: 'unhealthy',
      message: 'Not initialized',
      timestamp: new Date(),
    };

    // Start health monitoring (skip in test environment)
    if (process.env.NODE_ENV !== 'test') {
      this.startHealthMonitoring();
    }
  }

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  /**
   * Reset singleton instance (for testing only)
   */
  public static resetInstance(): void {
    if (RedisManager.instance) {
      RedisManager.instance.shutdown();
      RedisManager.instance = null as any;
    }
  }

  /**
   * Initialize Redis connection with configuration
   */
  public async initialize(): Promise<void> {
    try {
      // Try to get Redis configuration from ConfigManager if available
      try {
        const redisConfig = configManager.getRedisConfig();
        this.config = {
          ...this.config,
          ...redisConfig,
        };
      } catch (error) {
        // ConfigManager not initialized yet, fallback to environment variables
        this.loadConfigFromEnv();
      }

      logger.info('Initializing Redis connection...', {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db,
      });

      await this.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.handleConnectionFailure(error as Error);
    }
  }

  /**
   * Connect to Redis with retry logic
   */
  private async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;

    try {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: this.connectTimeout,
          reconnectStrategy: (retries) => {
            if (retries > this.maxRetries) {
              logger.error(`Redis connection failed after ${this.maxRetries} retries`);
              return false;
            }
            const delay = Math.min(retries * this.retryDelay, 10000);
            logger.warn(`Redis reconnect attempt ${retries} in ${delay}ms`);
            return delay;
          },
        },
        password: this.config.password || undefined,
        database: this.config.db,
      });

      // Set up event listeners
      this.setupEventListeners();

      // Connect to Redis
      await this.client.connect();
      
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Switch to Redis cache
      this.redisCache = new RedisCache(this.client, this.config);
      this.cache = this.redisCache;
      
      logger.info('Redis connected successfully');
      this.emit('connected');
      
      this.updateHealthStatus('healthy', 'Connected to Redis');
      
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionFailure(error as Error);
      throw error;
    }
  }

  /**
   * Set up Redis client event listeners
   */
  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      this.handleConnectionFailure(error);
      this.emit('error', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.emit('connect');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('ready');
    });

    this.client.on('end', () => {
      logger.warn('Redis connection ended');
      this.isConnected = false;
      this.fallbackToMemoryCache();
      this.emit('end');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
      this.emit('reconnecting');
    });
  }

  /**
   * Handle connection failures and implement fallback
   */
  private handleConnectionFailure(error: Error): void {
    this.isConnected = false;
    this.isConnecting = false;
    
    logger.error('Redis connection failed:', error.message);
    
    // Fallback to memory cache
    this.fallbackToMemoryCache();
    
    // Update health status
    this.updateHealthStatus('degraded', `Redis unavailable: ${error.message}`);
    
    // Schedule reconnection attempt
    this.scheduleReconnection();
  }

  /**
   * Fallback to memory cache when Redis is unavailable
   */
  private fallbackToMemoryCache(): void {
    if (this.cache !== this.memoryCache) {
      logger.warn('Falling back to memory cache');
      this.cache = this.memoryCache;
      this.emit('fallback', 'memory');
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnection(): void {
    if (this.reconnectTimer || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    const delay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 30000);
    this.reconnectAttempts++;

    logger.info(`Scheduling Redis reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
      } catch (error) {
        logger.error('Reconnection attempt failed:', error);
      }
    }, delay);
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfigFromEnv(): void {
    const {
      REDIS_HOST = 'localhost',
      REDIS_PORT = '6379',
      REDIS_PASSWORD,
      REDIS_DB = '0',
      REDIS_MAX_RETRIES = '3',
      REDIS_RETRY_DELAY = '1000',
      REDIS_CONNECT_TIMEOUT = '10000',
    } = process.env;

    this.config = {
      host: REDIS_HOST,
      port: parseInt(REDIS_PORT, 10),
      password: REDIS_PASSWORD,
      db: parseInt(REDIS_DB, 10),
    };

    // Set instance properties for connection management
    this.maxRetries = parseInt(REDIS_MAX_RETRIES, 10);
    this.retryDelay = parseInt(REDIS_RETRY_DELAY, 10);
    this.connectTimeout = parseInt(REDIS_CONNECT_TIMEOUT, 10);
  }

  /**
   * Get cache interface (Redis or memory fallback)
   */
  public getCache(): CacheInterface {
    return this.cache;
  }

  /**
   * Check if Redis is connected
   */
  public isRedisConnected(): boolean {
    return this.isConnected && this.client?.isOpen === true;
  }

  /**
   * Get connection status
   */
  public getConnectionStatus(): {
    connected: boolean;
    usingRedis: boolean;
    reconnectAttempts: number;
    lastError?: string;
  } {
    return {
      connected: this.isConnected,
      usingRedis: this.cache === this.redisCache,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Perform health check
   */
  public async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    try {
      if (!this.isRedisConnected()) {
        return this.updateHealthStatus('degraded', 'Redis not connected, using memory cache');
      }

      // Test Redis connection with a simple ping
      await this.client!.ping();
      
      const responseTime = Date.now() - startTime;
      
      // Get Redis info
      const info = await this.client!.info('memory');
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1], 10) : undefined;
      
      return this.updateHealthStatus('healthy', 'Redis connection healthy', {
        responseTime,
        memoryUsage,
      });
      
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return this.updateHealthStatus('unhealthy', `Health check failed: ${(error as Error).message}`);
    }
  }

  /**
   * Update health status
   */
  private updateHealthStatus(
    status: 'healthy' | 'degraded' | 'unhealthy',
    message: string,
    extra?: { responseTime?: number; memoryUsage?: number }
  ): HealthStatus {
    this.lastHealthCheck = {
      status,
      message,
      timestamp: new Date(),
      ...extra,
    };
    
    this.emit('healthUpdate', this.lastHealthCheck);
    return this.lastHealthCheck;
  }

  /**
   * Get last health check result
   */
  public getLastHealthCheck(): HealthStatus {
    return this.lastHealthCheck;
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Perform health check every 30 seconds
    this.healthCheckTimer = setInterval(async () => {
      await this.healthCheck();
    }, 30000);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Force reconnection
   */
  public async reconnect(): Promise<void> {
    logger.info('Forcing Redis reconnection...');
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.reconnectAttempts = 0;
    
    if (this.client && this.client.isOpen) {
      await this.client.quit();
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    
    await this.connect();
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Redis manager...');
    
    this.stopHealthMonitoring();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.client && this.client.isOpen) {
      try {
        await this.client.quit();
      } catch (error) {
        logger.error('Error during Redis shutdown:', error);
      }
    }
    
    this.memoryCache.destroy();
    this.removeAllListeners();
    
    logger.info('Redis manager shutdown complete');
  }
}

// Export singleton instance
export const redisManager = RedisManager.getInstance();