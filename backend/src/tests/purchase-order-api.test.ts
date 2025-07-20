import request from 'supertest';
import app from '@/app';
import { sequelize } from '@/config/database';
import { User, Role, Supplier, Base, PurchaseOrder, PurchaseOrderItem } from '@/models';
import { setupTestDatabase, cleanupTestDatabase, createTestUser } from './helpers/testHelpers';

describe('Purchase Order API', () => {
  let authToken: string;
  let testUser: User;
  let testSupplier: Supplier;
  let testBase: Base;
  let testOrder: PurchaseOrder;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create test user with admin role
    testUser = await createTestUser({
      username: 'purchase_test_admin',
      email: 'purchase_admin@test.com',
      real_name: '采购测试管理员',
      role_name: 'admin'
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'purchase_test_admin',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;

    // Create test supplier and base
    testSupplier = await Supplier.create({
      name: '测试供应商',
      contact_person: '张三',
      phone: '13800138000',
      supplier_type: '物资供应商',
      status: 'active'
    });

    testBase = await Base.create({
      name: '测试基地',
      code: 'TEST001',
      address: '测试地址',
      manager_id: testUser.id
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up orders before each test
    await PurchaseOrderItem.destroy({ where: {}, force: true });
    await PurchaseOrder.destroy({ where: {}, force: true });
  });

  describe('POST /api/v1/purchase-orders', () => {
    it('should create a new purchase order successfully', async () => {
      const orderData = {
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        expected_delivery_date: '2024-12-31',
        payment_method: '银行转账',
        contract_number: 'CONTRACT001',
        remark: '测试采购订单',
        items: [
          {
            item_type: 'material',
            item_name: '测试物料1',
            specification: '规格说明',
            quantity: 100,
            unit: 'kg',
            unit_price: 10.5
          },
          {
            item_type: 'material',
            item_name: '测试物料2',
            quantity: 50,
            unit: '袋',
            unit_price: 25.0
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.supplier_id).toBe(testSupplier.id);
      expect(response.body.data.base_id).toBe(testBase.id);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.total_amount).toBe('2300.00'); // 100*10.5 + 50*25
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.order_number).toMatch(/^PO\d{8}\d{4}$/);
    });

    it('should fail to create order without required fields', async () => {
      const response = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail to create order with empty items', async () => {
      const orderData = {
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        items: []
      };

      const response = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent supplier', async () => {
      const orderData = {
        supplier_id: 99999,
        base_id: testBase.id,
        order_type: 'material',
        items: [
          {
            item_type: 'material',
            item_name: '测试物料',
            quantity: 10,
            unit: 'kg',
            unit_price: 5.0
          }
        ]
      };

      const response = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('供应商不存在');
    });
  });

  describe('GET /api/v1/purchase-orders', () => {
    beforeEach(async () => {
      // Create test orders
      const order1 = await PurchaseOrder.create({
        order_number: 'PO202401010001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        total_amount: 1000,
        status: 'pending',
        order_date: new Date('2024-01-01'),
        payment_status: 'unpaid',
        created_by: testUser.id
      });

      const order2 = await PurchaseOrder.create({
        order_number: 'PO202401020001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'equipment',
        total_amount: 5000,
        status: 'approved',
        order_date: new Date('2024-01-02'),
        payment_status: 'unpaid',
        created_by: testUser.id
      });

      // Create order items
      await PurchaseOrderItem.bulkCreate([
        {
          order_id: order1.id,
          item_type: 'material',
          item_name: '物料A',
          quantity: 100,
          unit: 'kg',
          unit_price: 10,
          total_price: 1000
        },
        {
          order_id: order2.id,
          item_type: 'equipment',
          item_name: '设备B',
          quantity: 1,
          unit: '台',
          unit_price: 5000,
          total_price: 5000
        }
      ]);
    });

    it('should get purchase orders list with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/purchase-orders?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter orders by status', async () => {
      const response = await request(app)
        .get('/api/v1/purchase-orders?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('pending');
    });

    it('should filter orders by supplier', async () => {
      const response = await request(app)
        .get(`/api/v1/purchase-orders?supplier_id=${testSupplier.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter orders by date range', async () => {
      const response = await request(app)
        .get('/api/v1/purchase-orders?start_date=2024-01-01&end_date=2024-01-01')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    it('should search orders by order number', async () => {
      const response = await request(app)
        .get('/api/v1/purchase-orders?search=PO202401010001')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].order_number).toBe('PO202401010001');
    });
  });

  describe('GET /api/v1/purchase-orders/:id', () => {
    beforeEach(async () => {
      testOrder = await PurchaseOrder.create({
        order_number: 'PO202401010001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        total_amount: 1000,
        status: 'pending',
        order_date: new Date(),
        payment_status: 'unpaid',
        created_by: testUser.id
      });

      await PurchaseOrderItem.create({
        order_id: testOrder.id,
        item_type: 'material',
        item_name: '测试物料',
        quantity: 100,
        unit: 'kg',
        unit_price: 10,
        total_price: 1000
      });
    });

    it('should get purchase order details successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/purchase-orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testOrder.id);
      expect(response.body.data.supplier).toBeDefined();
      expect(response.body.data.base).toBeDefined();
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/v1/purchase-orders/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/purchase-orders/:id', () => {
    beforeEach(async () => {
      testOrder = await PurchaseOrder.create({
        order_number: 'PO202401010001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        total_amount: 1000,
        status: 'pending',
        order_date: new Date(),
        payment_status: 'unpaid',
        created_by: testUser.id
      });

      await PurchaseOrderItem.create({
        order_id: testOrder.id,
        item_type: 'material',
        item_name: '原物料',
        quantity: 100,
        unit: 'kg',
        unit_price: 10,
        total_price: 1000
      });
    });

    it('should update purchase order successfully', async () => {
      const updateData = {
        payment_method: '现金',
        remark: '更新后的备注',
        items: [
          {
            item_type: 'material',
            item_name: '新物料',
            quantity: 200,
            unit: 'kg',
            unit_price: 8,
            total_price: 1600
          }
        ]
      };

      const response = await request(app)
        .put(`/api/v1/purchase-orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.payment_method).toBe('现金');
      expect(response.body.data.remark).toBe('更新后的备注');
      expect(response.body.data.total_amount).toBe('1600.00');
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].item_name).toBe('新物料');
    });

    it('should fail to update completed order', async () => {
      await testOrder.update({ status: 'completed' });

      const response = await request(app)
        .put(`/api/v1/purchase-orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ remark: '尝试更新' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能修改');
    });
  });

  describe('DELETE /api/v1/purchase-orders/:id', () => {
    beforeEach(async () => {
      testOrder = await PurchaseOrder.create({
        order_number: 'PO202401010001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        total_amount: 1000,
        status: 'pending',
        order_date: new Date(),
        payment_status: 'unpaid',
        created_by: testUser.id
      });

      await PurchaseOrderItem.create({
        order_id: testOrder.id,
        item_type: 'material',
        item_name: '测试物料',
        quantity: 100,
        unit: 'kg',
        unit_price: 10,
        total_price: 1000
      });
    });

    it('should delete purchase order successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/purchase-orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify order is deleted
      const deletedOrder = await PurchaseOrder.findByPk(testOrder.id);
      expect(deletedOrder).toBeNull();

      // Verify items are also deleted
      const items = await PurchaseOrderItem.findAll({
        where: { order_id: testOrder.id }
      });
      expect(items).toHaveLength(0);
    });

    it('should fail to delete completed order', async () => {
      await testOrder.update({ status: 'completed' });

      const response = await request(app)
        .delete(`/api/v1/purchase-orders/${testOrder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('不能删除');
    });
  });

  describe('POST /api/v1/purchase-orders/:id/approve', () => {
    beforeEach(async () => {
      testOrder = await PurchaseOrder.create({
        order_number: 'PO202401010001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        total_amount: 1000,
        status: 'pending',
        order_date: new Date(),
        payment_status: 'unpaid',
        created_by: testUser.id
      });
    });

    it('should approve purchase order successfully', async () => {
      const approvalData = {
        action: 'approve',
        comment: '审批通过'
      };

      const response = await request(app)
        .post(`/api/v1/purchase-orders/${testOrder.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('审批通过');

      // Verify order status is updated
      const updatedOrder = await PurchaseOrder.findByPk(testOrder.id);
      expect(updatedOrder?.status).toBe('approved');
      expect(updatedOrder?.approved_by).toBe(testUser.id);
      expect(updatedOrder?.approved_at).toBeDefined();
    });

    it('should reject purchase order successfully', async () => {
      const approvalData = {
        action: 'reject',
        comment: '不符合要求'
      };

      const response = await request(app)
        .post(`/api/v1/purchase-orders/${testOrder.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('已拒绝');

      // Verify order status is updated
      const updatedOrder = await PurchaseOrder.findByPk(testOrder.id);
      expect(updatedOrder?.status).toBe('rejected');
    });

    it('should fail to approve non-pending order', async () => {
      await testOrder.update({ status: 'approved' });

      const response = await request(app)
        .post(`/api/v1/purchase-orders/${testOrder.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ action: 'approve' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('待审批');
    });
  });

  describe('GET /api/v1/purchase-orders/pending', () => {
    beforeEach(async () => {
      await PurchaseOrder.bulkCreate([
        {
          order_number: 'PO202401010001',
          supplier_id: testSupplier.id,
          base_id: testBase.id,
          order_type: 'material',
          total_amount: 1000,
          status: 'pending',
          order_date: new Date(),
          payment_status: 'unpaid',
          created_by: testUser.id
        },
        {
          order_number: 'PO202401020001',
          supplier_id: testSupplier.id,
          base_id: testBase.id,
          order_type: 'equipment',
          total_amount: 5000,
          status: 'approved',
          order_date: new Date(),
          payment_status: 'unpaid',
          created_by: testUser.id
        }
      ]);
    });

    it('should get pending orders successfully', async () => {
      const response = await request(app)
        .get('/api/v1/purchase-orders/pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('pending');
    });
  });

  describe('GET /api/v1/purchase-orders/statistics', () => {
    beforeEach(async () => {
      await PurchaseOrder.bulkCreate([
        {
          order_number: 'PO202401010001',
          supplier_id: testSupplier.id,
          base_id: testBase.id,
          order_type: 'material',
          total_amount: 1000,
          status: 'completed',
          order_date: new Date('2024-01-01'),
          payment_status: 'paid',
          created_by: testUser.id
        },
        {
          order_number: 'PO202401020001',
          supplier_id: testSupplier.id,
          base_id: testBase.id,
          order_type: 'equipment',
          total_amount: 5000,
          status: 'pending',
          order_date: new Date('2024-01-02'),
          payment_status: 'unpaid',
          created_by: testUser.id
        }
      ]);
    });

    it('should get purchase statistics successfully', async () => {
      const response = await request(app)
        .get('/api/v1/purchase-orders/statistics?start_date=2024-01-01&end_date=2024-12-31')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.overall).toBeDefined();
      expect(response.body.data.by_status).toBeDefined();
      expect(response.body.data.monthly).toBeDefined();
      expect(response.body.data.supplier_ranking).toBeDefined();
    });
  });
});