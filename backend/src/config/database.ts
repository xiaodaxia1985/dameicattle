import { Sequelize } from 'sequelize';
import { logger } from '../utils/logger';
import { configManager } from './ConfigManager';
import { databaseManager } from './DatabaseManager';

// Legacy sequelize instance for backward compatibility
let sequelize: Sequelize;

const createSequelizeInstance = (config: any) => {
  return new Sequelize({
    host: config.host,
    port: config.port,
    database: config.name,
    username: config.user,
    password: config.password,
    dialect: 'postgres',
    logging: config.logging || false,
    ssl: config.ssl,
    pool: {
      max: config.poolSize || 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    timezone: '+08:00', // 设置为中国时区
  });
};

const initializeSequelize = () => {
  try {
    const dbConfig = configManager.getDatabaseConfig();
    const environment = configManager.get('environment');
    const logLevel = configManager.get('logLevel');

    const config = {
      ...dbConfig,
      logging: (environment === 'development' && logLevel === 'debug') ? 
        (msg: string) => logger.debug(msg) : false
    };

    sequelize = createSequelizeInstance(config);
    logger.info('Database configuration loaded successfully');
  } catch (error) {
    logger.error('Failed to initialize database configuration:', error);
    throw error;
  }
};

// Initialize with fallback configuration (will be replaced when config is ready)
const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'cattle_management_dev',
  DB_USER = 'cattle_user',
  DB_PASSWORD = 'dianxin99',
  NODE_ENV = 'development',
} = process.env;

sequelize = createSequelizeInstance({
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  name: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: false,
  poolSize: 10,
  logging: NODE_ENV === 'development' ? (msg: string) => logger.debug(msg) : false
});

// Initialize database manager (called after config is initialized)
const initializeDatabaseManager = async () => {
  try {
    // First, reinitialize sequelize with validated configuration
    initializeSequelize();
    
    // Then initialize the database manager
    await databaseManager.initialize();
    
    // Update legacy sequelize instance to use the managed connection
    sequelize = databaseManager.getConnection();
    logger.info('Database manager initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database manager:', error);
    // Keep using the legacy instance as fallback
  }
};

// Export initialization function to be called after config is ready
export const initializeDatabase = initializeDatabaseManager;

export { sequelize, databaseManager };

// Test database connection (legacy function for backward compatibility)
export const testConnection = async (): Promise<boolean> => {
  try {
    return await databaseManager.testConnection();
  } catch (error) {
    // Fallback to legacy method
    try {
      await sequelize.authenticate();
      logger.info('Database connection has been established successfully.');
      return true;
    } catch (fallbackError) {
      logger.error('Unable to connect to the database:', fallbackError);
      return false;
    }
  }
};