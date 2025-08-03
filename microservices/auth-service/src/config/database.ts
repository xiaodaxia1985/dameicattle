import { Sequelize } from 'sequelize';
import { createLogger } from '@cattle-management/shared';
import { initUserModel } from '../models/User';

const logger = createLogger('auth-database');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'auth_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'dianxin99',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// 初始化模型
initUserModel(sequelize);

export { sequelize };

export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // 同步模型
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized');
    
    return true;
  } catch (error) {
    logger.error('Unable to connect to database', { error: (error as Error).message });
    return false;
  }
};