import request from 'supertest';
import app from '../app';
import { sequelize } from '../config/database';
import { User, Role, Base, EquipmentCategory, ProductionEquipment } from '../models';

describe('Equipment API', () => {
  let authToken: string;
  let testUser: User;
  let testBase: Base;
  let testCategory: EquipmentCategory;

  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.authenticate();
    
    // Create test role
    const role = await Role.create({
      name: 'admin',
      description: 'Administrator',
      permissions: ['equipment:create', 'equipment:read', 'equipment:update', 'equipment:delete'],
    });

    // Create test base
    testBase = await Base.create({
      name: '测试基地',
      code: 'TEST001',
      address: '测试地址',
    });

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      password_hash: '$2b$10$test.hash',
      real_name: '测试用户',
      email: 'test@example.com',
      role_id: role.id,
      base_id: testBase.id,
      status: 'active',
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'testuser',
        password: 'password123',
      });

    if (loginResponse.body.success) {
      authToken = loginResponse.body.data.token;
    }

    // Create test equipment category
    testCategory = await EquipmentCategory.create({
      name: '测试设备分类',
      code: 'TEST_CAT',
      description: '测试用设备分类',
    });
  });

  afterAll(async () => {
    // Clean up test data
    await ProductionEquipment.destroy({ where: {} });
    await EquipmentCategory.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Base.destroy({ where: {} });
    await Role.destroy({ where: {} });
    await sequelize.close();
  });

  describe('Equipment Categories', () => {
    it('should get equipment categories', async () => {
      const response = await request(app)
        .get('/api/v1/equipment/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should create equipment category', async () => {
      const categoryData = {
        name: '新设备分类',
        code: 'NEW_CAT',
        description: '新的设备分类',
      };

      const response = await request(app)
        .post('/api/v1/equipment/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.code).toBe(categoryData.code);
    });
  });

  describe('Production Equipment', () => {
    it('should get equipment list', async () => {
      const response = await request(app)
        .get('/api/v1/equipment')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should create equipment', async () => {
      const equipmentData = {
        name: '测试设备',
        code: 'TEST_EQ001',
        category_id: testCategory.id,
        base_id: testBase.id,
        brand: '测试品牌',
        model: 'TEST-MODEL',
        serial_number: 'SN123456',
        purchase_price: 10000.00,
        status: 'normal',
        location: '测试位置',
        specifications: {
          power: '5kw',
          voltage: '380V',
        },
      };

      const response = await request(app)
        .post('/api/v1/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .send(equipmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(equipmentData.name);
      expect(response.body.data.code).toBe(equipmentData.code);
      expect(response.body.data.category).toBeDefined();
      expect(response.body.data.base).toBeDefined();
    });

    it('should get equipment statistics', async () => {
      const response = await request(app)
        .get('/api/v1/equipment/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.statusDistribution).toBeDefined();
      expect(response.body.data.categoryDistribution).toBeDefined();
    });
  });

  describe('Equipment Status Management', () => {
    let testEquipment: ProductionEquipment;

    beforeAll(async () => {
      testEquipment = await ProductionEquipment.create({
        name: '状态测试设备',
        code: 'STATUS_TEST',
        category_id: testCategory.id,
        base_id: testBase.id,
        status: 'normal',
      });
    });

    it('should update equipment status', async () => {
      const response = await request(app)
        .patch(`/api/v1/equipment/${testEquipment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'maintenance' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('maintenance');
    });
  });
});