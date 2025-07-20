import request from 'supertest';
import app from '@/app';
import { Customer } from '@/models/Customer';
import { CustomerVisitRecord } from '@/models/CustomerVisitRecord';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { sequelize } from '@/config/database';
import jwt from 'jsonwebtoken';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('Customer API', () => {
  let authToken: string;
  let testUser: User;
  let testCustomer: Customer;

  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();

    // Create test role and user for authentication
    const testRole = await Role.create({
      name: 'test_admin',
      description: '测试管理员',
      permissions: {
        'customer:read': true,
        'customer:create': true,
        'customer:update': true,
        'customer:delete': true
      }
    });

    testUser = await User.create({
      username: 'test_customer_admin',
      password_hash: 'hashed_password',
      real_name: '测试管理员',
      email: 'test@example.com',
      role_id: testRole.id,
      status: 'active'
    });

    // Generate auth token
    authToken = jwt.sign(
      { 
        id: testUser.id, 
        username: testUser.username,
        role_id: testUser.role_id
      },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up
    await CustomerVisitRecord.destroy({ where: {}, force: true });
    await Customer.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up customers before each test
    await CustomerVisitRecord.destroy({ where: {}, force: true });
    await Customer.destroy({ where: {}, force: true });
  });

  describe('POST /api/v1/customers', () => {
    it('should create a new customer', async () => {
      const customerData = {
        name: '新客户',
        contact_person: '张三',
        phone: '13800138000',
        email: 'zhangsan@example.com',
        customer_type: '企业',
        address: '北京市朝阳区',
        credit_rating: 4
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(customerData.name);
      expect(response.body.data.contact_person).toBe(customerData.contact_person);
      expect(response.body.data.phone).toBe(customerData.phone);
      expect(response.body.data.customer_type).toBe(customerData.customer_type);
    });

    it('should fail to create customer without name', async () => {
      const customerData = {
        contact_person: '李四',
        phone: '13800138001'
      };

      const response = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('客户名称不能为空');
    });
  });

  describe('GET /api/v1/customers', () => {
    beforeEach(async () => {
      // Create test customers
      await Customer.bulkCreate([
        {
          name: '客户A',
          contact_person: '联系人A',
          phone: '13800138000',
          customer_type: '企业',
          credit_rating: 4,
          status: 'active'
        },
        {
          name: '客户B',
          contact_person: '联系人B',
          phone: '13800138001',
          customer_type: '个人',
          credit_rating: 3,
          status: 'active'
        }
      ]);
    });

    it('should get all customers', async () => {
      const response = await request(app)
        .get('/api/v1/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter customers by type', async () => {
      const response = await request(app)
        .get('/api/v1/customers?customer_type=企业')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].customer_type).toBe('企业');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/customers')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});