import { Sequelize } from 'sequelize';

let sequelize: Sequelize;

export const setupTestDatabase = async (): Promise<Sequelize> => {
  if (!sequelize) {
    sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cattle_management_test',
      username: process.env.DB_USER || 'cattle_user',
      password: process.env.DB_PASSWORD || 'cattle_password',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

    try {
      await sequelize.authenticate();
      console.log('✅ 测试数据库连接成功');
    } catch (error) {
      console.error('❌ 测试数据库连接失败:', error);
      throw error;
    }
  }

  return sequelize;
};

export const cleanupTestDatabase = async (): Promise<void> => {
  if (sequelize) {
    // 清理所有表数据
    await sequelize.query('TRUNCATE TABLE users, bases, barns, cattle, health_records, feeding_records RESTART IDENTITY CASCADE');
  }
};

export const closeTestDatabase = async (): Promise<void> => {
  if (sequelize) {
    await sequelize.close();
  }
};

export const createTestData = {
  // 创建测试基地
  createTestBase: async () => {
    const [base] = await sequelize.query(`
      INSERT INTO bases (name, code, address, created_at, updated_at)
      VALUES ('测试基地', 'TEST001', '测试地址', NOW(), NOW())
      RETURNING *
    `);
    return base[0];
  },

  // 创建测试牛棚
  createTestBarn: async (baseId: number) => {
    const [barn] = await sequelize.query(`
      INSERT INTO barns (name, code, base_id, capacity, created_at, updated_at)
      VALUES ('测试牛棚', 'BARN001', ${baseId}, 100, NOW(), NOW())
      RETURNING *
    `);
    return barn[0];
  },

  // 创建测试牛只
  createTestCattle: async (baseId: number, barnId: number) => {
    const [cattle] = await sequelize.query(`
      INSERT INTO cattle (ear_tag, breed, gender, birth_date, weight, base_id, barn_id, created_at, updated_at)
      VALUES ('TEST001', '西门塔尔', 'male', '2023-01-01', 500.00, ${baseId}, ${barnId}, NOW(), NOW())
      RETURNING *
    `);
    return cattle[0];
  },

  // 创建测试用户
  createTestUser: async () => {
    const [user] = await sequelize.query(`
      INSERT INTO users (username, password_hash, real_name, email, role_id, created_at, updated_at)
      VALUES ('testuser', '$2a$10$hash', '测试用户', 'test@example.com', 1, NOW(), NOW())
      RETURNING *
    `);
    return user[0];
  }
};