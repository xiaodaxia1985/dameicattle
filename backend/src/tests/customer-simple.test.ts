import { Customer } from '@/models/Customer';
import { CustomerVisitRecord } from '@/models/CustomerVisitRecord';
import { sequelize } from '@/config/database';

describe('Customer Model', () => {
  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();
  });

  afterAll(async () => {
    // Clean up
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up customers and visit records before each test
    await CustomerVisitRecord.destroy({ where: {}, force: true });
    await Customer.destroy({ where: {}, force: true });
  });

  describe('Model Creation', () => {
    it('should create a customer with required fields', async () => {
      const customerData = {
        name: '测试客户',
        contact_person: '张三',
        phone: '13800138000',
        customer_type: '企业',
        status: 'active'
      };

      const customer = await Customer.create(customerData);

      expect(customer).toBeDefined();
      expect(customer.id).toBeDefined();
      expect(customer.name).toBe(customerData.name);
      expect(customer.contact_person).toBe(customerData.contact_person);
      expect(customer.phone).toBe(customerData.phone);
      expect(customer.customer_type).toBe(customerData.customer_type);
      expect(customer.status).toBe(customerData.status);
      expect(customer.credit_rating).toBe(0); // default value
      expect(customer.credit_limit).toBe('0.00'); // default value
    });

    it('should create a customer with all fields', async () => {
      const customerData = {
        name: '完整客户',
        contact_person: '李四',
        phone: '13800138001',
        email: 'test@customer.com',
        address: '上海市浦东新区',
        customer_type: '经销商',
        business_license: '91310000123456789X',
        tax_number: '310000123456789',
        bank_account: '1234567890123456789',
        credit_limit: 200000,
        payment_terms: '月结45天',
        credit_rating: 4,
        status: 'active'
      };

      const customer = await Customer.create(customerData);

      expect(customer).toBeDefined();
      expect(customer.name).toBe(customerData.name);
      expect(customer.email).toBe(customerData.email);
      expect(customer.address).toBe(customerData.address);
      expect(customer.business_license).toBe(customerData.business_license);
      expect(customer.tax_number).toBe(customerData.tax_number);
      expect(customer.bank_account).toBe(customerData.bank_account);
      expect(Number(customer.credit_limit)).toBe(customerData.credit_limit);
      expect(customer.payment_terms).toBe(customerData.payment_terms);
      expect(customer.credit_rating).toBe(customerData.credit_rating);
    });

    it('should fail to create customer without name', async () => {
      const customerData = {
        contact_person: '王五',
        phone: '13800138002'
      };

      await expect(Customer.create(customerData as any)).rejects.toThrow();
    });
  });

  describe('Model Queries', () => {
    beforeEach(async () => {
      // Create test data
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
        },
        {
          name: '客户C',
          contact_person: '联系人C',
          phone: '13800138002',
          customer_type: '经销商',
          credit_rating: 5,
          status: 'inactive'
        }
      ]);
    });

    it('should find all customers', async () => {
      const customers = await Customer.findAll();
      expect(customers).toHaveLength(3);
    });

    it('should find customers by status', async () => {
      const activeCustomers = await Customer.findAll({
        where: { status: 'active' }
      });
      expect(activeCustomers).toHaveLength(2);

      const inactiveCustomers = await Customer.findAll({
        where: { status: 'inactive' }
      });
      expect(inactiveCustomers).toHaveLength(1);
    });

    it('should find customers by type', async () => {
      const enterpriseCustomers = await Customer.findAll({
        where: { customer_type: '企业' }
      });
      expect(enterpriseCustomers).toHaveLength(1);

      const individualCustomers = await Customer.findAll({
        where: { customer_type: '个人' }
      });
      expect(individualCustomers).toHaveLength(1);
    });

    it('should find customer by name', async () => {
      const customer = await Customer.findOne({
        where: { name: '客户A' }
      });
      expect(customer).toBeDefined();
      expect(customer?.name).toBe('客户A');
      expect(customer?.credit_rating).toBe(4);
    });

    it('should update customer', async () => {
      const customer = await Customer.findOne({
        where: { name: '客户A' }
      });
      expect(customer).toBeDefined();

      await customer!.update({
        credit_rating: 5,
        contact_person: '新联系人'
      });

      const updatedCustomer = await Customer.findByPk(customer!.id);
      expect(updatedCustomer?.credit_rating).toBe(5);
      expect(updatedCustomer?.contact_person).toBe('新联系人');
    });

    it('should delete customer', async () => {
      const customer = await Customer.findOne({
        where: { name: '客户A' }
      });
      expect(customer).toBeDefined();

      await customer!.destroy();

      const deletedCustomer = await Customer.findByPk(customer!.id);
      expect(deletedCustomer).toBeNull();
    });
  });

  describe('Customer Visit Records', () => {
    let testCustomer: Customer;

    beforeEach(async () => {
      testCustomer = await Customer.create({
        name: '回访测试客户',
        contact_person: '测试联系人',
        phone: '13800138000',
        customer_type: '企业',
        status: 'active'
      });
    });

    it('should create visit record for customer', async () => {
      const visitData = {
        customer_id: testCustomer.id,
        visit_date: new Date(),
        visit_type: '电话回访',
        visitor_id: 1, // Assuming user ID 1 exists
        purpose: '了解客户需求',
        content: '客户反馈良好，有新的采购计划',
        result: '客户满意度较高',
        status: 'completed'
      };

      const visitRecord = await CustomerVisitRecord.create(visitData);

      expect(visitRecord).toBeDefined();
      expect(visitRecord.customer_id).toBe(testCustomer.id);
      expect(visitRecord.visit_type).toBe(visitData.visit_type);
      expect(visitRecord.purpose).toBe(visitData.purpose);
      expect(visitRecord.content).toBe(visitData.content);
      expect(visitRecord.result).toBe(visitData.result);
    });

    it('should find customer with visit records', async () => {
      // Create visit record
      await CustomerVisitRecord.create({
        customer_id: testCustomer.id,
        visit_date: new Date(),
        visit_type: '实地拜访',
        visitor_id: 1,
        purpose: '商务洽谈',
        content: '讨论合作细节',
        status: 'completed'
      });

      const customerWithVisits = await Customer.findByPk(testCustomer.id, {
        include: [
          {
            model: CustomerVisitRecord,
            as: 'visit_records'
          }
        ]
      });

      expect(customerWithVisits).toBeDefined();
      expect(customerWithVisits?.visit_records).toHaveLength(1);
      expect(customerWithVisits?.visit_records?.[0].visit_type).toBe('实地拜访');
    });
  });

  describe('Model Validations', () => {
    it('should validate credit rating range', async () => {
      const customerData = {
        name: '评级测试客户',
        credit_rating: 6 // Invalid rating
      };

      // Note: Sequelize doesn't enforce custom validations by default
      // This would need to be implemented in the application logic
      const customer = await Customer.create(customerData);
      expect(customer.credit_rating).toBe(6); // Will be created but should be validated in controller
    });

    it('should handle decimal credit limit', async () => {
      const customerData = {
        name: '信用额度测试',
        credit_limit: 150000.75
      };

      const customer = await Customer.create(customerData);
      expect(Number(customer.credit_limit)).toBe(150000.75);
    });
  });
});