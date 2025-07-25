import { Sequelize, ConnectionError, TimeoutError } from 'sequelize';
import { logger } from '@/utils/logger';
import { configManager } from './ConfigManager';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: 'postgres';
  ssl?: boolean;
  logging?: boolean | ((msg: string) => void);
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
    evict?: number;
  };
  retry?: {
    max: number;
    timeout: number;
    backoffBase: number;
    backoffExponent: number;
  };
  define?: {
    timestamps: boolean;
    underscored: boolean;
    createdAt: string;
    updatedAt: string;
  };
  timezone?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastConnected?: Date;
  lastError?: string;
  connectionAttempts: number;
  poolStatus?: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  responseTime: number;
  details: {
    connection: boolean;
    query: boolean;
    poolHealth: boolean;
    version?: string;
    error?: string;
  };
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private sequelize: Sequelize | null = null;
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    connectionAttempts: 0
  };
  private retryTimeouts: NodeJS.Timeout[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private config: DatabaseConfig | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection with configuration
   */
  public async initialize(): Promise<void> {
    try {
      this.config = this.buildDatabaseConfig();
      await this.createConnection();
      this.startHealthMonitoring();
      logger.info('Database manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database manager:', error);
      throw error;
    }
  }

  /**
   * Build database configuration from config manager
   */
  private buildDatabaseConfig(): DatabaseConfig {
    const dbConfig = configManager.getDatabaseConfig();
    const environment = configManager.get('environment');
    const logLevel = configManager.get('logLevel');

    return {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.name,
      username: dbConfig.user,
      password: dbConfig.password,
      dialect: 'postgres',
      ssl: dbConfig.ssl || false,
      logging: (environment === 'development' && logLevel === 'debug') ? 
        (msg: string) => logger.debug(`[DB Query] ${msg}`) : false,
      pool: {
        max: dbConfig.poolSize || 10,
        min: 2,
        acquire: 30000,
        idle: 10000,
        evict: 1000
      },
      retry: {
        max: 5,
        timeout: 60000,
        backoffBase: 1000,
        backoffExponent: 2
      },
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      timezone: '+08:00'
    };
  }

  /**
   * Create database connection with retry logic
   */
  private async createConnection(): Promise<void> {
    if (!this.config) {
      throw new Error('Database configuration not initialized');
    }

    this.sequelize = new Sequelize({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      username: this.config.username,
      password: this.config.password,
      dialect: this.config.dialect,
      logging: this.config.logging,
      ssl: this.config.ssl,
      pool: this.config.pool,
      define: this.config.define,
      timezone: this.config.timezone,
      dialectOptions: {
        connectTimeout: 20000,
        requestTimeout: 30000,
        ...(this.config.ssl && {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        })
      }
    });

    await this.connectWithRetry();
  }

  /**
   * Connect to database with automatic retry logic
   */
  private async connectWithRetry(): Promise<void> {
    if (!this.sequelize || !this.config) {
      throw new Error('Database not initialized');
    }

    const maxRetries = this.config.retry?.max || 5;
    const baseDelay = this.config.retry?.backoffBase || 1000;
    const exponent = this.config.retry?.backoffExponent || 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.connectionStatus.connectionAttempts = attempt;
        
        logger.info(`Attempting database connection (${attempt}/${maxRetries})...`);
        
        await this.sequelize.authenticate();
        
        this.connectionStatus.isConnected = true;
        this.connectionStatus.lastConnected = new Date();
        this.connectionStatus.lastError = undefined;
        
        logger.info('Database connection established successfully');
        return;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.connectionStatus.lastError = errorMessage;
        
        logger.warn(`Database connection attempt ${attempt} failed: ${errorMessage}`);
        
        if (attempt === maxRetries) {
          this.connectionStatus.isConnected = false;
          logger.error('All database connection attempts failed');
          throw new Error(`Database connection failed after ${maxRetries} attempts: ${errorMessage}`);
        }
        
        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(exponent, attempt - 1);
        logger.info(`Retrying database connection in ${delay}ms...`);
        
        await this.sleep(delay);
      }
    }
  }

  /**
   * Get database connection instance
   */
  public getConnection(): Sequelize {
    if (!this.sequelize) {
      throw new Error('Database connection not initialized');
    }
    return this.sequelize;
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (!this.sequelize) {
        return false;
      }
      
      await this.sequelize.authenticate();
      this.connectionStatus.isConnected = true;
      this.connectionStatus.lastConnected = new Date();
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.connectionStatus.isConnected = false;
      this.connectionStatus.lastError = errorMessage;
      logger.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Perform comprehensive health check
   */
  public async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const result: HealthCheckResult = {
      status: 'unhealthy',
      timestamp: new Date(),
      responseTime: 0,
      details: {
        connection: false,
        query: false,
        poolHealth: false
      }
    };

    try {
      if (!this.sequelize) {
        result.details.error = 'Database not initialized';
        return result;
      }

      // Test basic connection
      try {
        await this.sequelize.authenticate();
        result.details.connection = true;
      } catch (error) {
        result.details.error = `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.responseTime = Date.now() - startTime;
        return result;
      }

      // Test query execution
      try {
        const [results] = await this.sequelize.query('SELECT version() as version, now() as current_time');
        const dbInfo = (results as any)[0];
        
        if (dbInfo?.version) {
          result.details.version = dbInfo.version.split(' ')[0] + ' ' + dbInfo.version.split(' ')[1];
          result.details.query = true;
        }
      } catch (error) {
        result.details.error = `Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.responseTime = Date.now() - startTime;
        return result;
      }

      // Check connection pool health
      try {
        const poolStatus = this.getPoolStatus();
        result.details.poolHealth = poolStatus.total > 0;
        
        // Update connection status with pool info
        this.connectionStatus.poolStatus = poolStatus;
      } catch (error) {
        logger.warn('Failed to get pool status:', error);
      }

      // Determine overall health status
      if (result.details.connection && result.details.query) {
        result.status = result.details.poolHealth ? 'healthy' : 'degraded';
      }

    } catch (error) {
      result.details.error = `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    result.responseTime = Date.now() - startTime;
    return result;
  }

  /**
   * Get connection pool status
   */
  public getPoolStatus(): { total: number; active: number; idle: number; waiting: number } {
    if (!this.sequelize) {
      return { total: 0, active: 0, idle: 0, waiting: 0 };
    }

    try {
      const pool = (this.sequelize as any).connectionManager?.pool;
      
      if (pool) {
        return {
          total: pool.size || 0,
          active: pool.borrowed || 0,
          idle: pool.available || 0,
          waiting: pool.pending || 0
        };
      }
    } catch (error) {
      logger.warn('Failed to get pool status:', error);
    }

    return { total: 0, active: 0, idle: 0, waiting: 0 };
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Reconnect to database
   */
  public async reconnect(): Promise<void> {
    try {
      logger.info('Attempting to reconnect to database...');
      
      if (this.sequelize) {
        await this.sequelize.close();
      }
      
      this.connectionStatus.isConnected = false;
      this.connectionStatus.connectionAttempts = 0;
      
      await this.createConnection();
      
      logger.info('Database reconnection successful');
    } catch (error) {
      logger.error('Database reconnection failed:', error);
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Clear existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Start periodic health checks (every 30 seconds)
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthResult = await this.performHealthCheck();
        
        if (healthResult.status === 'unhealthy' && this.connectionStatus.isConnected) {
          logger.warn('Database health check failed, attempting reconnection...');
          await this.reconnect();
        }
        
        // Log health status periodically (every 5 minutes)
        if (Date.now() % 300000 < 30000) {
          logger.info(`Database health: ${healthResult.status} (${healthResult.responseTime}ms)`);
        }
        
      } catch (error) {
        logger.error('Health monitoring error:', error);
      }
    }, 30000);
  }

  /**
   * Stop health monitoring
   */
  private stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down database manager...');
      
      // Stop health monitoring
      this.stopHealthMonitoring();
      
      // Clear retry timeouts
      this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
      this.retryTimeouts = [];
      
      // Close database connection
      if (this.sequelize) {
        await this.sequelize.close();
        this.sequelize = null;
      }
      
      this.connectionStatus.isConnected = false;
      logger.info('Database manager shutdown complete');
      
    } catch (error) {
      logger.error('Error during database manager shutdown:', error);
      throw error;
    }
  }

  /**
   * Execute query with automatic retry on connection errors
   */
  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isConnectionError = error instanceof ConnectionError || 
                                error instanceof TimeoutError ||
                                (error instanceof Error && error.message.includes('connection'));
        
        if (isConnectionError && attempt < maxRetries) {
          logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`);
          
          // Try to reconnect
          await this.reconnect();
          
          // Wait before retry
          await this.sleep(1000 * attempt);
          continue;
        }
        
        throw error;
      }
    }
    
    throw new Error('This should never be reached');
  }

  /**
   * Utility method for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timeout = setTimeout(resolve, ms);
      this.retryTimeouts.push(timeout);
    });
  }
}

export const databaseManager = DatabaseManager.getInstance();