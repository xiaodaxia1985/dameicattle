import request from 'supertest';
import app from '@/app';
import { sequelize } from '@/config/database';
import { User, Role, Supplier } from '@/models';
import { setupTestDatabase, cleanupTestDatabase, createTestUser } from './helpers/testHelpers';

describe('Supplier API', () => {
  let authToken: string;
  let testUser: User;
  let testSupplier: Supplier;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create test user with admin role
    testUser = await createTestUser({
      username: 'supplier_test_admin',
      email: 'supplier_admin@test.com',
      real_name: '供应商测试管理员',
      role_name: 'admin'
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'supplier_test_admin',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up suppliers before each test
    await Supplier.destroy({ where: {}, force: true });
  });

  describe('POST /api/v1/suppliers', () => {
    it('should create a new supplier successfully', async () => {
      const supplierData = {
        name: '测试供应商',
        contact_person: '张三',
        phone: '13800138000',
        email: 'test@supplier.com',
        address: '北京市朝阳区',
        supplier_type: '物资供应商',
        business_license: '91110000123456789X',
        tax_number: '110000123456789',
        credit_limit: 100000,
        payment_terms: '月结30天'
      };

      const response = await request(app)
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(supplierData.name);
      expect(response.body.data.contact_person).toBe(supplierData.contact_person);
      expect(response.body.data.status).toBe('active');
    });

    it('should fail to create supplier without required fields', async () => {
      const response = await request(app)
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail to create supplier with duplicate name', async () => {
      const supplierData = {
        name: '重复供应商',
        contact_person: '李四',
        phone: '13800138001'
      };

      // Create first supplier
      await request(app)
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(supplierData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('已存在');
    });
  });

  describe('GET /api/v1/suppliers', () => {
    beforeEach(async () => {
      // Create test suppliers
      await Supplier.bulkCreate([
        {
          name: '供应商A',
          contact_person: '联系人A',
          phone: '13800138000',
          supplier_type: '物资供应商',
          rating: 4,
          status: 'active'
        },
        {
          name: '供应商B',
          contact_person: '联系人B',
          phone: '13800138001',
          supplier_type: '设备供应商',
          rating: 3,
          status: 'active'
        },
        {
          name: '供应商C',
          contact_person: '联系人C',
          phone: '13800138002',
          supplier_type: '物资供应商',
          rating: 5,
          status: 'inactive'
        }
      ]);
    });

    it('should get suppliers list with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/suppliers?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should filter suppliers by type', async () => {
      const response = await request(app)
        .get('/api/v1/suppliers?supplier_type=物资供应商')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((supplier: any) => {
        expect(supplier.supplier_type).toBe('物资供应商');
      });
    });

    it('should filter suppliers by status', async () => {
      const response = await request(app)
        .get('/api/v1/suppliers?status=active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach((supplier: any) => {
        expect(supplier.status).toBe('active');
      });
    });

    it('should search suppliers by name', async () => {
      const response = await request(app)
        .get('/api/v1/suppliers?search=供应商A')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('供应商A');
    });
  });

  describe('GET /api/v1/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        name: '详情测试供应商',
        contact_person: '测试联系人',
        phone: '13800138000',
        email: 'detail@test.com',
        supplier_type: '物资供应商',
        rating: 4,
        status: 'active'
      });
    });

    it('should get supplier details successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testSupplier.id);
      expect(response.body.data.name).toBe(testSupplier.name);
    });

    it('should return 404 for non-existent supplier', async () => {
      const response = await request(app)
        .get('/api/v1/suppliers/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        name: '更新测试供应商',
        contact_person: '原联系人',
        phone: '13800138000',
        supplier_type: '物资供应商',
        rating: 3,
        status: 'active'
      });
    });

    it('should update supplier successfully', async () => {
      const updateData = {
        contact_person: '新联系人',
        phone: '13800138999',
        rating: 5
      };

      const response = await request(app)
        .put(`/api/v1/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.contact_person).toBe(updateData.contact_person);
      expect(response.body.data.phone).toBe(updateData.phone);
      expect(response.body.data.rating).toBe(updateData.rating);
    });

    it('should fail to update with duplicate name', async () => {
      // Create another supplier
      await Supplier.create({
        name: '另一个供应商',
        contact_person: '另一个联系人',
        phone: '13800138001',
        status: 'active'
      });

      const response = await request(app)
        .put(`/api/v1/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '另一个供应商' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/v1/suppliers/:id', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        name: '删除测试供应商',
        contact_person: '测试联系人',
        phone: '13800138000',
        status: 'active'
      });
    });

    it('should delete supplier successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/suppliers/${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify supplier is deleted
      const deletedSupplier = await Supplier.findByPk(testSupplier.id);
      expect(deletedSupplier).toBeNull();
    });

    it('should return 404 for non-existent supplier', async () => {
      const response = await request(app)
        .delete('/api/v1/suppliers/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/suppliers/:id/rating', () => {
    beforeEach(async () => {
      testSupplier = await Supplier.create({
        name: '评级测试供应商',
        contact_person: '测试联系人',
        phone: '13800138000',
        rating: 3,
        status: 'active'
      });
    });

    it('should update supplier rating successfully', async () => {
      const ratingData = {
        rating: 5,
        comment: '服务质量优秀'
      };

      const response = await request(app)
        .put(`/api/v1/suppliers/${testSupplier.id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(ratingData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify rating is updated
      const updatedSupplier = await Supplier.findByPk(testSupplier.id);
      expect(updatedSupplier?.rating).toBe(5);
    });

    it('should fail with invalid rating', async () => {
      const response = await request(app)
        .put(`/api/v1/suppliers/${testSupplier.id}/rating`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rating: 6 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/suppliers/types', () => {
    beforeEach(async () => {
      await Supplier.bulkCreate([
        { name: '供应商1', supplier_type: '物资供应商', status: 'active' },
        { name: '供应商2', supplier_type: '物资供应商', status: 'active' },
        { name: '供应商3', supplier_type: '设备供应商', status: 'active' },
        { name: '供应商4', supplier_type: '牛只供应商', status: 'active' }
      ]);
    });

    it('should get supplier types with counts', async () => {
      const response = await request(app)
        .get('/api/v1/suppliers/types')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      
      const materialSupplier = response.body.data.find((type: any) => type.supplier_type === '物资供应商');
      expect(materialSupplier.count).toBe('2');
    });
  });

  describe('POST /api/v1/suppliers/compare', () => {
    let supplier1: Supplier, supplier2: Supplier;

    beforeEach(async () => {
      supplier1 = await Supplier.create({
        name: '对比供应商1',
        contact_person: '联系人1',
        rating: 4,
        supplier_type: '物资供应商',
        status: 'active'
      });

      supplier2 = await Supplier.create({
        name: '对比供应商2',
        contact_person: '联系人2',
        rating: 3,
        supplier_type: '设备供应商',
        status: 'active'
      });
    });

    it('should compare suppliers successfully', async () => {
      const compareData = {
        supplier_ids: [supplier1.id, supplier2.id],
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };

      const response = await request(app)
        .post('/api/v1/suppliers/compare')
        .set('Authorization', `Bearer ${authToken}`)
        .send(compareData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.comparison).toHaveLength(2);
      expect(response.body.data.period).toEqual({
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      });
    });

    it('should fail with insufficient suppliers', async () => {
      const response = await request(app)
        .post('/api/v1/suppliers/compare')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ supplier_ids: [supplier1.id] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});