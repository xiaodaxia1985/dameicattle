import { Sequelize } from 'sequelize';

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'cattle_management_test',
  DB_USER = 'postgres',
  DB_PASSWORD = 'dianxin99',
} = process.env;

// Test database configuration using PostgreSQL
export const testSequelize = new Sequelize({
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  dialect: 'postgres',
  logging: false, // Disable SQL logging during tests
  pool: {
    max: 5,
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
  timezone: '+08:00',
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await testSequelize.authenticate();
    console.log('✅ Test database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to test database:', error);
    return false;
  }
};