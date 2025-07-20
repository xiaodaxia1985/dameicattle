import request from 'supertest';
import app from '@/app';
import { sequelize } from '@/config/database';
import { MaterialCategory, Supplier, ProductionMaterial } from '@/models';

describe('Material Management API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();
    
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Material Categories', () => {
    test('GET /api/v1/materials/categories should return material categories', async () => {
      const response = await request(app)
        .get('/api/v1/materials/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/v1/materials/categories should create a new category', async () => {
      const categoryData = {
        name: '测试分类',
        code: 'TEST_CATEGORY',
        description: '这是一个测试分类'
      };

      const response = await request(app)
        .post('/api/v1/materials/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(categoryData.name);
      expect(response.body.data.code).toBe(categoryData.code);
    });
  });

  describe('Suppliers', () => {
    test('GET /api/v1/materials/suppliers should return suppliers', async () => {
      const response = await request(app)
        .get('/api/v1/materials/suppliers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/v1/materials/suppliers should create a new supplier', async () => {
      const supplierData = {
        name: '测试供应商',
        contact_person: '张三',
        phone: '13800138000',
        email: 'test@supplier.com',
        supplier_type: '饲料供应商'
      };

      const response = await request(app)
        .post('/api/v1/materials/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(supplierData.name);
    });
  });

  describe('Production Materials', () => {
    let categoryId: number;
    let supplierId: number;

    beforeAll(async () => {
      // Create a test category
      const category = await MaterialCategory.create({
        name: '测试物资分类',
        code: 'TEST_MATERIAL_CAT'
      });
      categoryId = category.id;

      // Create a test supplier
      const supplier = await Supplier.create({
        name: '测试物资供应商',
        rating: 5,
        credit_limit: 100000
      });
      supplierId = supplier.id;
    });

    test('GET /api/v1/materials/production-materials should return production materials', async () => {
      const response = await request(app)
        .get('/api/v1/materials/production-materials')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('POST /api/v1/materials/production-materials should create a new material', async () => {
      const materialData = {
        name: '测试物资',
        code: 'TEST_MATERIAL_001',
        category_id: categoryId,
        unit: 'kg',
        specification: '测试规格',
        supplier_id: supplierId,
        purchase_price: 10.50,
        safety_stock: 100
      };

      const response = await request(app)
        .post('/api/v1/materials/production-materials')
        .set('Authorization', `Bearer ${authToken}`)
        .send(materialData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(materialData.name);
      expect(response.body.data.code).toBe(materialData.code);
    });
  });

  describe('Inventory', () => {
    test('GET /api/v1/materials/inventory should return inventory data', async () => {
      const response = await request(app)
        .get('/api/v1/materials/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/v1/materials/inventory/statistics should return inventory statistics', async () => {
      const response = await request(app)
        .get('/api/v1/materials/inventory/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalItems');
      expect(response.body.data).toHaveProperty('totalValue');
    });
  });
});