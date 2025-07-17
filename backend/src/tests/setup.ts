import { config } from 'dotenv';
import { Sequelize } from 'sequelize';

// 加载测试环境配置
config({ path: '.env.test' });

// 全局测试设置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.DB_NAME = 'cattle_management_test';
  
  // 初始化测试数据库连接
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'cattle_management_test',
    username: process.env.DB_USER || 'cattle_user',
    password: process.env.DB_PASSWORD || 'dianxin99',
    logging: false, // 测试时关闭SQL日志
  });

  try {
    await sequelize.authenticate();
    console.log('✅ 测试数据库连接成功');
  } catch (error) {
    console.error('❌ 测试数据库连接失败:', error);
  }
});

// 每个测试后清理
afterEach(async () => {
  // 清理模拟函数
  jest.clearAllMocks();
});

// 全局测试清理
afterAll(async () => {
  // 关闭数据库连接
  // 这里可以添加数据库连接关闭逻辑
});

// 全局测试工具函数
global.testUtils = {
  // 创建测试用户
  createTestUser: () => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
  }),
  
  // 创建测试JWT Token
  createTestToken: () => 'test-jwt-token',
  
  // 模拟请求对象
  mockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides,
  }),
  
  // 模拟响应对象
  mockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // 模拟下一个中间件函数
  mockNext: () => jest.fn(),
};

// 扩展全局类型
declare global {
  var testUtils: {
    createTestUser: () => any;
    createTestToken: () => string;
    mockRequest: (overrides?: any) => any;
    mockResponse: () => any;
    mockNext: () => jest.Mock;
  };
}