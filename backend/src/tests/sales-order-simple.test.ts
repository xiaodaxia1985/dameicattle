import { SalesOrder } from '@/models/SalesOrder';
import { SalesOrderItem } from '@/models/SalesOrderItem';
import { Customer } from '@/models/Customer';
import { Cattle } from '@/models/Cattle';
import { Base } from '@/models/Base';
import { User } from '@/models/User';
import { sequelize } from '@/config/database';

describe('SalesOrder Model', () => {
  let testCustomer: Customer;
  let testBase: Base;
  let testUser: User;
  let testCattle: Cattle;

  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();

    // Create test data
    testCustomer = await Customer.create({
      name: '测试客户',
      contact_person: '张三',
      phone: '13800138000',
      customer_type: '企业',
      status: 'active'
    });

    testBase = await Base.create({
      name: '测试基地',
      code: 'TEST001',
      address: '测试地址'
    });

    testUser = await User.create({
      username: 'test_sales_user',
      password_hash: 'hashed_password',
      real_name: '测试用户',
      status: 'active'
    });

    testCattle = await Cattle.create({
      ear_tag: 'TEST001',
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
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up sales orders before each test
    await SalesOrderItem.destroy({ where: {}, force: true });
    await SalesOrder.destroy({ where: {}, force: true });
  });

  describe('Model Creation', () => {
    it('should create a sales order with required fields', async () => {
      const orderData = {
        order_number: 'SO2407201234',
        customer_id: testCustomer.id,
        base_id: testBase.id,
        total_amount: 10000,
        order_date: new Date(),
        created_by: testUser.id
      };

      const salesOrder = await SalesOrder.create(orderData);

      expect(salesOrder).toBeDefined();
      expect(salesOrder.id).toBeDefined();
      expect(salesOrder.order_number).toBe(orderData.order_number);
      expect(salesOrder.customer_id).toBe(orderData.customer_id);
      expect(salesOrder.base_id).toBe(orderData.base_id);
      expect(Number(salesOrder.total_amount)).toBe(orderData.total_amount);
      expect(salesOrder.status).toBe('pending'); // default value
      expect(salesOrder.payment_status).toBe('unpaid'); // default value
    });

    it('should create a sales order with all fields', async () => {
      const orderData = {
        order_number: 'SO2407205678',
        customer_id: testCustomer.id,
        base_id: testBase.id,
        total_amount: 20000,
        tax_amount: 1000,
        discount_amount: 500,
        status: 'pending',
        order_date: new Date(),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        payment_status: 'unpaid',
        payment_method: 'transfer',
        contract_number: 'CONTRACT001',
        remark: '测试订单',
        created_by: testUser.id
      };

      const salesOrder = await SalesOrder.create(orderData);

      expect(salesOrder).toBeDefined();
      expect(salesOrder.order_number).toBe(orderData.order_number);
      expect(Number(salesOrder.total_amount)).toBe(orderData.total_amount);
      expect(Number(salesOrder.tax_amount)).toBe(orderData.tax_amount);
      expect(Number(salesOrder.discount_amount)).toBe(orderData.discount_amount);
      expect(salesOrder.payment_method).toBe(orderData.payment_method);
      expect(salesOrder.contract_number).toBe(orderData.contract_number);
      expect(salesOrder.remark).toBe(orderData.remark);
    });

    it('should create a sales order with items', async () => {
      // Create order
      const salesOrder = await SalesOrder.create({
        order_number: 'SO2407209012',
        customer_id: testCustomer.id,
        base_id: testBase.id,
        total_amount: 15000,
        order_date: new Date(),
        created_by: testUser.id
      });

      // Create order item
      const orderItem = await SalesOrderItem.create({
        order_id: salesOrder.id,
        cattle_id: testCattle.id,
        ear_tag: testCattle.ear_tag,
        breed: testCattle.breed,
        weight: testCattle.weight,
        unit_price: 15000,
        total_price: 15000
      });

      expect(orderItem).toBeDefined();
      expect(orderItem.order_id).toBe(salesOrder.id);
      expect(orderItem.cattle_id).toBe(testCattle.id);
      expect(orderItem.ear_tag).toBe(testCattle.ear_tag);
      expect(Number(orderItem.unit_price)).toBe(15000);
      expect(Number(orderItem.total_price)).toBe(15000);
      expect(orderItem.delivery_status).toBe('pending'); // default value
    });
  });

  describe('Model Queries', () => {
    let testOrder: SalesOrder;

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

    it('should find order with items', async () => {
      const order = await SalesOrder.findByPk(testOrder.id, {
        include: [
          {
            model: SalesOrderItem,
            as: 'items'
          }
        ]
      });

      expect(order).toBeDefined();
      expect(order?.items).toBeDefined();
      expect(order?.items?.length).toBe(1);
      expect(order?.items?.[0].cattle_id).toBe(testCattle.id);
    });

    it('should update order status', async () => {
      await testOrder.update({
        status: 'approved',
        approved_by: testUser.id,
        approved_at: new Date()
      });

      const updatedOrder = await SalesOrder.findByPk(testOrder.id);
      expect(updatedOrder?.status).toBe('approved');
      expect(updatedOrder?.approved_by).toBe(testUser.id);
      expect(updatedOrder?.approved_at).toBeDefined();
    });

    it('should update payment status', async () => {
      await testOrder.update({
        payment_status: 'paid',
        payment_method: 'transfer'
      });

      const updatedOrder = await SalesOrder.findByPk(testOrder.id);
      expect(updatedOrder?.payment_status).toBe('paid');
      expect(updatedOrder?.payment_method).toBe('transfer');
    });
  });
});