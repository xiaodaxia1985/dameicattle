import { PurchaseOrder } from '@/models/PurchaseOrder';
import { PurchaseOrderItem } from '@/models/PurchaseOrderItem';
import { Supplier } from '@/models/Supplier';
import { Base } from '@/models/Base';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { sequelize } from '@/config/database';

describe('Purchase Order Models', () => {
  let testSupplier: Supplier;
  let testBase: Base;
  let testUser: User;
  let testRole: Role;

  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();

    // Create test role
    testRole = await Role.create({
      name: 'test_role',
      description: '测试角色',
      permissions: ['purchase_order:read', 'purchase_order:create']
    });

    // Create test user
    testUser = await User.create({
      username: 'test_purchase_user',
      password_hash: 'hashed_password',
      real_name: '测试用户',
      email: 'test@example.com',
      role_id: testRole.id,
      status: 'active'
    });

    // Create test supplier
    testSupplier = await Supplier.create({
      name: '测试供应商',
      contact_person: '张三',
      phone: '13800138000',
      supplier_type: '物资供应商',
      status: 'active'
    });

    // Create test base
    testBase = await Base.create({
      name: '测试基地',
      code: 'TEST001',
      address: '测试地址',
      manager_id: testUser.id
    });
  });

  afterAll(async () => {
    // Clean up
    await PurchaseOrderItem.destroy({ where: {}, force: true });
    await PurchaseOrder.destroy({ where: {}, force: true });
    await Base.destroy({ where: {}, force: true });
    await Supplier.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up orders before each test
    await PurchaseOrderItem.destroy({ where: {}, force: true });
    await PurchaseOrder.destroy({ where: {}, force: true });
  });

  describe('PurchaseOrder Model', () => {
    it('should create a purchase order with required fields', async () => {
      const orderData = {
        order_number: 'PO202401010001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        total_amount: 1000,
        status: 'pending',
        order_date: new Date(),
        payment_status: 'unpaid',
        created_by: testUser.id
      };

      const order = await PurchaseOrder.create(orderData);

      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.order_number).toBe(orderData.order_number);
      expect(order.supplier_id).toBe(orderData.supplier_id);
      expect(order.base_id).toBe(orderData.base_id);
      expect(order.order_type).toBe(orderData.order_type);
      expect(Number(order.total_amount)).toBe(orderData.total_amount);
      expect(order.status).toBe(orderData.status);
      expect(order.payment_status).toBe(orderData.payment_status);
      expect(order.created_by).toBe(orderData.created_by);
      expect(Number(order.tax_amount)).toBe(0); // default value
      expect(Number(order.discount_amount)).toBe(0); // default value
    });

    it('should create a purchase order with all fields', async () => {
      const orderData = {
        order_number: 'PO202401020001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'equipment',
        total_amount: 5000,
        tax_amount: 500,
        discount_amount: 100,
        status: 'approved',
        order_date: new Date(),
        expected_delivery_date: new Date('2024-12-31'),
        payment_status: 'partial_paid',
        payment_method: '银行转账',
        contract_number: 'CONTRACT001',
        remark: '测试采购订单',
        created_by: testUser.id,
        approved_by: testUser.id,
        approved_at: new Date()
      };

      const order = await PurchaseOrder.create(orderData);

      expect(order).toBeDefined();
      expect(order.order_number).toBe(orderData.order_number);
      expect(Number(order.tax_amount)).toBe(orderData.tax_amount);
      expect(Number(order.discount_amount)).toBe(orderData.discount_amount);
      expect(order.payment_method).toBe(orderData.payment_method);
      expect(order.contract_number).toBe(orderData.contract_number);
      expect(order.remark).toBe(orderData.remark);
      expect(order.approved_by).toBe(orderData.approved_by);
      expect(order.approved_at).toBeDefined();
    });

    it('should fail to create order without required fields', async () => {
      const orderData = {
        order_number: 'PO202401030001'
        // Missing required fields
      };

      await expect(PurchaseOrder.create(orderData as any)).rejects.toThrow();
    });

    it('should enforce unique order number', async () => {
      const orderData = {
        order_number: 'PO202401040001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        total_amount: 1000,
        status: 'pending',
        order_date: new Date(),
        payment_status: 'unpaid',
        created_by: testUser.id
      };

      // Create first order
      await PurchaseOrder.create(orderData);

      // Try to create duplicate
      await expect(PurchaseOrder.create(orderData)).rejects.toThrow();
    });
  });

  describe('PurchaseOrderItem Model', () => {
    let testOrder: PurchaseOrder;

    beforeEach(async () => {
      testOrder = await PurchaseOrder.create({
        order_number: 'PO202401050001',
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

    it('should create a purchase order item with required fields', async () => {
      const itemData = {
        order_id: testOrder.id,
        item_type: 'material',
        item_name: '测试物料',
        quantity: 100,
        unit: 'kg',
        unit_price: 10,
        total_price: 1000
      };

      const item = await PurchaseOrderItem.create(itemData);

      expect(item).toBeDefined();
      expect(item.id).toBeDefined();
      expect(item.order_id).toBe(itemData.order_id);
      expect(item.item_type).toBe(itemData.item_type);
      expect(item.item_name).toBe(itemData.item_name);
      expect(Number(item.quantity)).toBe(itemData.quantity);
      expect(item.unit).toBe(itemData.unit);
      expect(Number(item.unit_price)).toBe(itemData.unit_price);
      expect(Number(item.total_price)).toBe(itemData.total_price);
      expect(Number(item.received_quantity)).toBe(0); // default value
      expect(item.quality_status).toBe('pending'); // default value
    });

    it('should create a purchase order item with all fields', async () => {
      const itemData = {
        order_id: testOrder.id,
        item_type: 'equipment',
        item_id: 123,
        item_name: '测试设备',
        specification: '规格说明',
        quantity: 1,
        unit: '台',
        unit_price: 5000,
        total_price: 5000,
        received_quantity: 1,
        quality_status: 'passed',
        remark: '备注信息'
      };

      const item = await PurchaseOrderItem.create(itemData);

      expect(item).toBeDefined();
      expect(item.item_id).toBe(itemData.item_id);
      expect(item.specification).toBe(itemData.specification);
      expect(Number(item.received_quantity)).toBe(itemData.received_quantity);
      expect(item.quality_status).toBe(itemData.quality_status);
      expect(item.remark).toBe(itemData.remark);
    });

    it('should fail to create item without required fields', async () => {
      const itemData = {
        order_id: testOrder.id,
        item_type: 'material'
        // Missing required fields
      };

      await expect(PurchaseOrderItem.create(itemData as any)).rejects.toThrow();
    });
  });

  describe('Model Relationships', () => {
    let testOrder: PurchaseOrder;

    beforeEach(async () => {
      testOrder = await PurchaseOrder.create({
        order_number: 'PO202401060001',
        supplier_id: testSupplier.id,
        base_id: testBase.id,
        order_type: 'material',
        total_amount: 2000,
        status: 'pending',
        order_date: new Date(),
        payment_status: 'unpaid',
        created_by: testUser.id
      });

      // Create order items
      await PurchaseOrderItem.bulkCreate([
        {
          order_id: testOrder.id,
          item_type: 'material',
          item_name: '物料A',
          quantity: 100,
          unit: 'kg',
          unit_price: 10,
          total_price: 1000
        },
        {
          order_id: testOrder.id,
          item_type: 'material',
          item_name: '物料B',
          quantity: 50,
          unit: 'kg',
          unit_price: 20,
          total_price: 1000
        }
      ]);
    });

    it('should load order with items', async () => {
      const orderWithItems = await PurchaseOrder.findByPk(testOrder.id, {
        include: [
          {
            model: PurchaseOrderItem,
            as: 'items'
          }
        ]
      });

      expect(orderWithItems).toBeDefined();
      expect(orderWithItems?.items).toHaveLength(2);
      expect(orderWithItems?.items?.[0].item_name).toBe('物料A');
      expect(orderWithItems?.items?.[1].item_name).toBe('物料B');
    });

    it('should load order with supplier and base', async () => {
      const orderWithRelations = await PurchaseOrder.findByPk(testOrder.id, {
        include: [
          {
            model: Supplier,
            as: 'supplier'
          },
          {
            model: Base,
            as: 'base'
          },
          {
            model: User,
            as: 'creator'
          }
        ]
      });

      expect(orderWithRelations).toBeDefined();
      expect(orderWithRelations?.supplier?.name).toBe('测试供应商');
      expect(orderWithRelations?.base?.name).toBe('测试基地');
      expect(orderWithRelations?.creator?.real_name).toBe('测试用户');
    });
  });

  describe('Model Updates', () => {
    let testOrder: PurchaseOrder;

    beforeEach(async () => {
      testOrder = await PurchaseOrder.create({
        order_number: 'PO202401070001',
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

    it('should update order status', async () => {
      await testOrder.update({
        status: 'approved',
        approved_by: testUser.id,
        approved_at: new Date()
      });

      const updatedOrder = await PurchaseOrder.findByPk(testOrder.id);
      expect(updatedOrder?.status).toBe('approved');
      expect(updatedOrder?.approved_by).toBe(testUser.id);
      expect(updatedOrder?.approved_at).toBeDefined();
    });

    it('should update payment status', async () => {
      await testOrder.update({
        payment_status: 'paid',
        payment_method: '现金'
      });

      const updatedOrder = await PurchaseOrder.findByPk(testOrder.id);
      expect(updatedOrder?.payment_status).toBe('paid');
      expect(updatedOrder?.payment_method).toBe('现金');
    });

    it('should update delivery information', async () => {
      const deliveryDate = new Date('2024-12-31');
      await testOrder.update({
        actual_delivery_date: deliveryDate,
        status: 'completed'
      });

      const updatedOrder = await PurchaseOrder.findByPk(testOrder.id);
      expect(updatedOrder?.actual_delivery_date).toEqual(deliveryDate);
      expect(updatedOrder?.status).toBe('completed');
    });
  });
});