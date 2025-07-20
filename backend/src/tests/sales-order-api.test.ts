import request from 'supertest';
import app from '@/app';
import { SalesOrder } from '@/models/SalesOrder';
import { SalesOrderItem } from '@/models/SalesOrderItem';
import { Customer } from '@/models/Customer';
import { Cattle } from '@/models/Cattle';
import { Base } from '@/models/Base';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { sequelize } from '@/config/database';
import jwt from 'jsonwebtoken';

describe('SalesOrder API', () => {
  let authToken: string;
  let testUser: User;
  let testCustomer: Customer;
  let testBase: Base;
  let testCattle: Cattle;
  let testOrder: SalesOrder;

  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();

    // Create test role and user for authentication
    const testRole = await Role.create({
      name: 'test_sales_admin',
      description: '测试销售管理员',
      permissions: {
        'sales:read': true,
        'sales:create': true,
        'sales:update': true,
        'sales:approve': true
      }
    });

    testUser = await User.create({
      username: 'test_sales_admin',
      password_hash: 'hashed_password',
      real_name: '测试销售管理员',
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

    // Create test customer
    testCustomer = await Customer.create({
      name: 'API测试客户',
      contact_person: '张三',
      phone: '13800138000',
      customer_type: '企业',
      status: 'active'
    });

    // Create test base
    testBase = await Base.create({
      name: 'API测试基地',
      code: 'APITEST001',
      address: '测试地址'
    });

    // Create test cattle
    testCattle = await Cattle.create({
      ear_tag: 'APITEST001',
      breed: '测试品种',
      gender: 'male',
      birth_date: new Date(),
      weight: 500,
      status: 'active',
      base_id: testBase.id
    });
  });

  afterAll(async () => {
    // Clean up
    await SalesOrderItem.destroy({ where: {}, force: true });
    await SalesOrder.destroy({ where: {}, force: true });
    await Cattle.destroy({ where: { id: testCattle.id }, force: true });
    await Customer.destroy({ where: { id: testCustomer.id }, force: true });
    await Base.destroy({ where: { id: testBase.id }, force: true });
    await User.destroy({ where: { id: testUser.id }, force: true });
    await Role.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up sales orders before each test
    await SalesOrderItem.destroy({ where: {}, force: true });
    await SalesOrder.destroy({ where: {}, force: true });
  });

  describe('POST /api/v1/sales-orders', () => {
    it('should create a new sales order', async () => {
      const orderData = {
        customer_id: testCustomer.id,
        base_id: testBase.id,
        order_date: new Date().toISOString().split('T')[0],
        items: [
          {
            cattle_id: testCattle.id,
            unit_price: 15000
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customer_id).toBe(orderData.customer_id);
      expect(response.body.data.base_id).toBe(orderData.base_id);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].cattle_id).toBe(testCattle.id);
    });

    it('should fail to create order without required fields', async () => {
      const orderData = {
        customer_id: testCustomer.id
        // Missing base_id, order_date, items
      };

      const response = await request(app)
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/sales-orders', () => {
    beforeEach(async () => {
      // Create test order
      testOrder = await SalesOrder.create({
        order_number: 'SO2407203456',
        customer_id: testCustomer.id,
        base_id: testBase.id,
        total_amount: 15000,
        order_date: new Date(),
        created_by: testUser.id
      });

      // Create order item
      await SalesOrderItem.create({
        order_id: testOrder.id,
        cattle_id: testCattle.id,
        ear_tag: testCattle.ear_tag,
        breed: testCattle.breed,
        weight: testCattle.weight,
        unit_price: 15000,
        total_price: 15000
      });
    });

    it('should get all sales orders', async () => {
      const response = await request(app)
        .get('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.total).toBe(1);
    });

    it('should get sales order by id', async () => {
      const response = await request(app)
        .get(`/api/v1/sales-orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOrder.id);
      expect(response.body.data.items).toHaveLength(1);
    });
  });

  describe('POST /api/v1/sales-orders/:id/approve', () => {
    beforeEach(async () => {
      // Create test order
      testOrder = await SalesOrder.create({
        order_number: 'SO2407203456',
        customer_id: testCustomer.id,
        base_id: testBase.id,
        total_amount: 15000,
        order_date: new Date(),
        created_by: testUser.id
      });

      // Create order item
      await SalesOrderItem.create({
        order_id: testOrder.id,
        cattle_id: testCattle.id,
        ear_tag: testCattle.ear_tag,
        breed: testCattle.breed,
        weight: testCattle.weight,
        unit_price: 15000,
        total_price: 15000
      });
    });

    it('should approve a sales order', async () => {
      const response = await request(app)
        .post(`/api/v1/sales-orders/${testOrder.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
      expect(response.body.data.approved_by).toBe(testUser.id);

      // Check if cattle status is updated
      const cattle = await Cattle.findByPk(testCattle.id);
      expect(cattle?.status).toBe('sold');
    });
  });

  describe('POST /api/v1/sales-orders/:id/cancel', () => {
    beforeEach(async () => {
      // Create test order
      testOrder = await SalesOrder.create({
        order_number: 'SO2407203456',
        customer_id: testCustomer.id,
        base_id: testBase.id,
        total_amount: 15000,
        order_date: new Date(),
        created_by: testUser.id
      });

      // Create order item
      await SalesOrderItem.create({
        order_id: testOrder.id,
        cattle_id: testCattle.id,
        ear_tag: testCattle.ear_tag,
        breed: testCattle.breed,
        weight: testCattle.weight,
        unit_price: 15000,
        total_price: 15000
      });
    });

    it('should cancel a sales order', async () => {
      const response = await request(app)
        .post(`/api/v1/sales-orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: '测试取消' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
    });
  });

  describe('GET /api/v1/sales-orders/statistics', () => {
    beforeEach(async () => {
      // Create test orders
      const order1 = await SalesOrder.create({
        order_number: 'SO2407201111',
        customer_id: testCustomer.id,
        base_id: testBase.id,
        total_amount: 15000,
        order_date: new Date(),
        status: 'approved',
        created_by: testUser.id
      });

      const order2 = await SalesOrder.create({
        order_number: 'SO2407202222',
        customer_id: testCustomer.id,
        base_id: testBase.id,
        total_amount: 20000,
        order_date: new Date(),
        status: 'pending',
        created_by: testUser.id
      });

      // Create order items
      await SalesOrderItem.create({
        order_id: order1.id,
        cattle_id: testCattle.id,
        ear_tag: testCattle.ear_tag,
        breed: testCattle.breed,
        weight: testCattle.weight,
        unit_price: 15000,
        total_price: 15000
      });
    });

    it('should get sales statistics', async () => {
      const response = await request(app)
        .get('/api/v1/sales-orders/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status_statistics).toBeDefined();
      expect(response.body.data.monthly_statistics).toBeDefined();
      expect(response.body.data.customer_statistics).toBeDefined();
    });
  });
});