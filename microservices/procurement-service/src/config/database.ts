import { Sequelize } from 'sequelize'
import { logger } from '../utils/logger'

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'cattle_management',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'dianxin99',
  dialect: 'postgres' as const,
  logging: (sql: string) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('SQL:', sql)
    }
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
}

// 创建 Sequelize 实例
export const sequelize = new Sequelize(dbConfig)

// 测试数据库连接
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate()
    logger.info('数据库连接成功')
    return true
  } catch (error) {
    logger.error('数据库连接失败:', error)
    return false
  }
}

// 同步数据库模型
export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force, alter: !force })
    logger.info(`数据库模型同步完成 ${force ? '(强制重建)' : '(增量更新)'}`)
  } catch (error) {
    logger.error('数据库模型同步失败:', error)
    throw error
  }
}

// 关闭数据库连接
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close()
    logger.info('数据库连接已关闭')
  } catch (error) {
    logger.error('关闭数据库连接失败:', error)
  }
}

export default sequelize