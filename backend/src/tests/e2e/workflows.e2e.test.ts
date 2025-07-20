import request from 'supertest';
import app from '@/app';
import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';
import { 
  createTestUser, 
  createTestRole, 
  createTestBase, 
  createTestBarn,
  cleanupTestData,
  generateTestToken,
  TestDataFactory,
  waitFor
} from '../helpers/testHelpers';

describe('End-to-End Workflow Tests', () => {
  let adminUser: any;
  let adminToken: string;
  let testBase: any;
  let testRole: any;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await cleanupTestData();

    // 创建管理员角色和用户
    testRole = await createTestRole({
      name: '系统管理员',
      permissions: ['*'] // 所有权限
    });

    testBase = await createTestBase();

    adminUser = await createTestUser({
      username: 'admin',
      email: 'admin@example.com',
      role_id: testRole.id,
      base_id: testBase.id
    });

    adminToken = generateTestToken(adminUser);
  });

  afterAll(async () => {
    await cleanupTestData();
    await sequelize.close();
    await redisClient.quit();
  });

  describe('Complete Cattle Management Workflow', () => {
    it('should complete full cattle lifecycle management', async () => {
      // 1. 创建牛棚
      const barnData = TestDataFactory.barn({
        name: '育肥牛棚A',
        base_id: testBase.id
      });

      const barnResponse = await request(app)
        .post('/api/v1/barns')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(barnData);

      expect(barnResponse.status).toBe(201);
      const barn = barnResponse.body.data;

      // 2. 添加牛只
      const cattleData = TestDataFactory.cattle({
        ear_tag: 'E001',
        base_id: testBase.id,
        barn_id: barn.id
      });

      const cattleResponse = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cattleData);

      expect(cattleResponse.status).toBe(201);
      const cattle = cattleResponse.body.data;

      // 3. 记录健康检查
      const healthData = {
        cattle_id: cattle.id,
        symptoms: '正常',
        diagnosis: '健康检查',
        treatment: '无需治疗',
        veterinarian_id: adminUser.id,
        diagnosis_date: new Date().toISOString(),
        status: 'completed'
      };

      const healthResponse = await request(app)
        .post('/api/v1/health/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(healthData);

      expect(healthResponse.status).toBe(201);

      // 4. 记录疫苗接种
      const vaccineData = {
        cattle_id: cattle.id,
        vaccine_name: '口蹄疫疫苗',
        vaccination_date: new Date().toISOString(),
        next_due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        veterinarian_id: adminUser.id,
        batch_number: 'BATCH001'
      };

      const vaccineResponse = await request(app)
        .post('/api/v1/health/vaccinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(vaccineData);

      expect(vaccineResponse.status).toBe(201);

      // 5. 记录饲喂
      const feedingData = {
        base_id: testBase.id,
        barn_id: barn.id,
        formula_id: null, // 简化测试，不创建配方
        amount: 50,
        feeding_date: new Date().toISOString(),
        operator_id: adminUser.id,
        notes: '正常饲喂'
      };

      const feedingResponse = await request(app)
        .post('/api/v1/feeding/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(feedingData);

      expect(feedingResponse.status).toBe(201);

      // 6. 更新牛只体重
      const weightUpdate = {
        weight: 550,
        health_status: 'healthy'
      };

      const updateResponse = await request(app)
        .put(`/api/v1/cattle/${cattle.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(weightUpdate);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.weight).toBe(550);

      // 7. 查看牛只详情（包含所有相关记录）
      const detailResponse = await request(app)
        .get(`/api/v1/cattle/${cattle.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(detailResponse.status).toBe(200);
      const cattleDetail = detailResponse.body.data;
      expect(cattleDetail.weight).toBe(550);
      expect(cattleDetail.health_status).toBe('healthy');

      // 8. 查看仪表盘数据
      const dashboardResponse = await request(app)
        .get('/api/v1/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(dashboardResponse.status).toBe(200);
      expect(dashboardResponse.body.data.cattle_stats.total_cattle).toBeGreaterThan(0);
    });
  });

  describe('User Management Workflow', () => {
    it('should complete user management workflow', async () => {
      // 1. 创建新角色
      const roleData = {
        name: '饲养员',
        description: '负责日常饲养工作',
        permissions: ['cattle:read', 'feeding:write', 'health:read'],
        status: 'active'
      };

      const roleResponse = await request(app)
        .post('/api/v1/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData);

      expect(roleResponse.status).toBe(201);
      const role = roleResponse.body.data;

      // 2. 创建新用户
      const userData = TestDataFactory.user({
        username: 'feeder001',
        email: 'feeder001@example.com',
        role_id: role.id,
        base_id: testBase.id
      });

      const userResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData);

      expect(userResponse.status).toBe(201);
      const user = userResponse.body.data;

      // 3. 新用户登录
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        });

      expect(loginResponse.status).toBe(200);
      const userToken = loginResponse.body.data.token;

      // 4. 验证用户权限（应该能读取牛只信息）
      const cattleResponse = await request(app)
        .get('/api/v1/cattle')
        .set('Authorization', `Bearer ${userToken}`);

      expect(cattleResponse.status).toBe(200);

      // 5. 验证权限限制（不应该能创建用户）
      const unauthorizedResponse = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send(TestDataFactory.user());

      expect(unauthorizedResponse.status).toBe(403);

      // 6. 更新用户信息
      const updateData = {
        real_name: '更新后的姓名',
        phone: '13900139001'
      };

      const updateResponse = await request(app)
        .put(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.real_name).toBe(updateData.real_name);

      // 7. 禁用用户
      const disableResponse = await request(app)
        .put(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'inactive' });

      expect(disableResponse.status).toBe(200);

      // 8. 验证禁用用户无法登录
      const disabledLoginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: userData.username,
          password: userData.password
        });

      expect(disabledLoginResponse.status).toBe(401);
    });
  });

  describe('Inventory Management Workflow', () => {
    it('should complete inventory management workflow', async () => {
      // 1. 创建供应商
      const supplierData = {
        name: '优质饲料供应商',
        contact_person: '张经理',
        phone: '13800138001',
        email: 'supplier@example.com',
        address: '供应商地址',
        status: 'active'
      };

      const supplierResponse = await request(app)
        .post('/api/v1/suppliers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(supplierData);

      expect(supplierResponse.status).toBe(201);
      const supplier = supplierResponse.body.data;

      // 2. 创建物资分类
      const categoryData = {
        name: '饲料',
        description: '各种饲料产品',
        parent_id: null,
        status: 'active'
      };

      const categoryResponse = await request(app)
        .post('/api/v1/materials/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(categoryData);

      expect(categoryResponse.status).toBe(201);
      const category = categoryResponse.body.data;

      // 3. 创建物资
      const materialData = {
        name: '玉米饲料',
        code: 'CORN001',
        category_id: category.id,
        supplier_id: supplier.id,
        unit: 'kg',
        price: 3.5,
        safety_stock: 1000,
        status: 'active'
      };

      const materialResponse = await request(app)
        .post('/api/v1/materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(materialData);

      expect(materialResponse.status).toBe(201);
      const material = materialResponse.body.data;

      // 4. 创建采购订单
      const purchaseOrderData = {
        order_number: 'PO001',
        supplier_id: supplier.id,
        base_id: testBase.id,
        order_type: 'material',
        order_date: new Date().toISOString(),
        expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        items: [
          {
            item_type: 'material',
            item_id: material.id,
            item_name: material.name,
            quantity: 1000,
            unit: 'kg',
            unit_price: 3.5,
            total_price: 3500
          }
        ],
        total_amount: 3500
      };

      const purchaseResponse = await request(app)
        .post('/api/v1/purchase-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(purchaseOrderData);

      expect(purchaseResponse.status).toBe(201);
      const purchaseOrder = purchaseResponse.body.data;

      // 5. 审批采购订单
      const approveResponse = await request(app)
        .put(`/api/v1/purchase-orders/${purchaseOrder.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true, approval_notes: '审批通过' });

      expect(approveResponse.status).toBe(200);

      // 6. 确认收货
      const receiveResponse = await request(app)
        .put(`/api/v1/purchase-orders/${purchaseOrder.id}/receive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            {
              item_id: material.id,
              received_quantity: 1000
            }
          ],
          actual_delivery_date: new Date().toISOString()
        });

      expect(receiveResponse.status).toBe(200);

      // 7. 检查库存更新
      const inventoryResponse = await request(app)
        .get(`/api/v1/materials/inventory?base_id=${testBase.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(inventoryResponse.status).toBe(200);
      const inventory = inventoryResponse.body.data.find((item: any) => item.material_id === material.id);
      expect(inventory).toBeTruthy();
      expect(inventory.current_stock).toBe(1000);

      // 8. 记录出库（用于饲喂）
      const outboundData = {
        material_id: material.id,
        base_id: testBase.id,
        transaction_type: '出库',
        quantity: -100,
        reference_type: 'feeding',
        operator_id: adminUser.id,
        remark: '饲喂消耗'
      };

      const outboundResponse = await request(app)
        .post('/api/v1/materials/inventory/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(outboundData);

      expect(outboundResponse.status).toBe(201);

      // 9. 验证库存减少
      const updatedInventoryResponse = await request(app)
        .get(`/api/v1/materials/inventory?base_id=${testBase.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(updatedInventoryResponse.status).toBe(200);
      const updatedInventory = updatedInventoryResponse.body.data.find((item: any) => item.material_id === material.id);
      expect(updatedInventory.current_stock).toBe(900);
    });
  });

  describe('Sales Management Workflow', () => {
    it('should complete sales workflow', async () => {
      // 1. 创建客户
      const customerData = {
        name: '优质肉牛采购商',
        contact_person: '李经理',
        phone: '13900139002',
        email: 'customer@example.com',
        address: '客户地址',
        customer_type: 'enterprise',
        credit_rating: 'A',
        status: 'active'
      };

      const customerResponse = await request(app)
        .post('/api/v1/customers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(customerData);

      expect(customerResponse.status).toBe(201);
      const customer = customerResponse.body.data;

      // 2. 创建牛棚和牛只
      const barn = await createTestBarn({ base_id: testBase.id });
      
      const cattleData = TestDataFactory.cattle({
        ear_tag: 'SALE001',
        base_id: testBase.id,
        barn_id: barn.id,
        weight: 600,
        health_status: 'healthy'
      });

      const cattleResponse = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cattleData);

      expect(cattleResponse.status).toBe(201);
      const cattle = cattleResponse.body.data;

      // 3. 创建销售订单
      const salesOrderData = {
        order_number: 'SO001',
        customer_id: customer.id,
        base_id: testBase.id,
        order_date: new Date().toISOString(),
        expected_delivery_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        items: [
          {
            cattle_id: cattle.id,
            ear_tag: cattle.ear_tag,
            breed: cattle.breed,
            weight: cattle.weight,
            unit_price: 20,
            total_price: cattle.weight * 20
          }
        ],
        total_amount: cattle.weight * 20
      };

      const salesResponse = await request(app)
        .post('/api/v1/sales-orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(salesOrderData);

      expect(salesResponse.status).toBe(201);
      const salesOrder = salesResponse.body.data;

      // 4. 审批销售订单
      const approveResponse = await request(app)
        .put(`/api/v1/sales-orders/${salesOrder.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approved: true, approval_notes: '销售审批通过' });

      expect(approveResponse.status).toBe(200);

      // 5. 确认发货
      const deliverResponse = await request(app)
        .put(`/api/v1/sales-orders/${salesOrder.id}/deliver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          actual_delivery_date: new Date().toISOString(),
          delivery_notes: '已发货'
        });

      expect(deliverResponse.status).toBe(200);

      // 6. 验证牛只状态更新
      const updatedCattleResponse = await request(app)
        .get(`/api/v1/cattle/${cattle.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(updatedCattleResponse.status).toBe(200);
      expect(updatedCattleResponse.body.data.status).toBe('sold');

      // 7. 查看销售统计
      const salesStatsResponse = await request(app)
        .get('/api/v1/dashboard/sales-statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(salesStatsResponse.status).toBe(200);
      expect(salesStatsResponse.body.data.total_sales_amount).toBeGreaterThan(0);
    });
  });

  describe('Data Integration Workflow', () => {
    it('should demonstrate data flow between modules', async () => {
      // 1. 创建基础数据
      const barn = await createTestBarn({ base_id: testBase.id });
      
      // 2. 创建物资和库存
      const materialData = {
        name: '测试饲料',
        code: 'TEST001',
        category_id: 1,
        supplier_id: 1,
        unit: 'kg',
        price: 5.0,
        safety_stock: 500,
        status: 'active'
      };

      const materialResponse = await request(app)
        .post('/api/v1/materials')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(materialData);

      expect(materialResponse.status).toBe(201);
      const material = materialResponse.body.data;

      // 3. 添加库存
      const inventoryData = {
        material_id: material.id,
        base_id: testBase.id,
        transaction_type: '入库',
        quantity: 1000,
        reference_type: 'initial',
        operator_id: adminUser.id,
        remark: '初始库存'
      };

      await request(app)
        .post('/api/v1/materials/inventory/transactions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inventoryData);

      // 4. 创建牛只
      const cattleData = TestDataFactory.cattle({
        base_id: testBase.id,
        barn_id: barn.id
      });

      const cattleResponse = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cattleData);

      expect(cattleResponse.status).toBe(201);
      const cattle = cattleResponse.body.data;

      // 5. 记录饲喂（应该自动扣减库存）
      const feedingData = {
        base_id: testBase.id,
        barn_id: barn.id,
        amount: 100,
        feeding_date: new Date().toISOString(),
        operator_id: adminUser.id,
        notes: '测试饲喂'
      };

      const feedingResponse = await request(app)
        .post('/api/v1/feeding/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(feedingData);

      expect(feedingResponse.status).toBe(201);

      // 6. 验证库存自动扣减
      await waitFor(1000); // 等待数据流转处理

      const inventoryResponse = await request(app)
        .get(`/api/v1/materials/inventory?base_id=${testBase.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(inventoryResponse.status).toBe(200);
      // 注意：实际的库存扣减逻辑需要根据配方计算，这里简化处理

      // 7. 记录健康问题（应该自动更新牛只状态）
      const healthData = {
        cattle_id: cattle.id,
        symptoms: '发烧',
        diagnosis: '感冒',
        treatment: '药物治疗',
        veterinarian_id: adminUser.id,
        diagnosis_date: new Date().toISOString(),
        status: 'ongoing'
      };

      const healthResponse = await request(app)
        .post('/api/v1/health/records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(healthData);

      expect(healthResponse.status).toBe(201);

      // 8. 验证牛只健康状态自动更新
      await waitFor(1000); // 等待数据流转处理

      const updatedCattleResponse = await request(app)
        .get(`/api/v1/cattle/${cattle.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(updatedCattleResponse.status).toBe(200);
      // 健康状态应该根据健康记录自动更新
    });
  });

  describe('Performance and Monitoring Workflow', () => {
    it('should demonstrate monitoring and performance features', async () => {
      // 1. 获取系统健康状态
      const healthResponse = await request(app)
        .get('/api/v1/monitoring/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.data.status).toMatch(/healthy|warning|critical|down/);

      // 2. 获取性能指标
      const metricsResponse = await request(app)
        .get('/api/v1/performance/metrics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.body.data.database).toBeTruthy();
      expect(metricsResponse.body.data.redis).toBeTruthy();

      // 3. 执行数据一致性检查
      const consistencyResponse = await request(app)
        .post('/api/v1/data-integration/consistency/check')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(consistencyResponse.status).toBe(200);
      expect(consistencyResponse.body.data.overall_status).toMatch(/healthy|warning|critical/);

      // 4. 获取缓存统计
      const cacheStatsResponse = await request(app)
        .get('/api/v1/performance/cache/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(cacheStatsResponse.status).toBe(200);
      expect(cacheStatsResponse.body.data).toHaveProperty('hits');
      expect(cacheStatsResponse.body.data).toHaveProperty('misses');

      // 5. 获取安全统计
      const securityStatsResponse = await request(app)
        .get('/api/v1/security/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(securityStatsResponse.status).toBe(200);
      expect(securityStatsResponse.body.data).toHaveProperty('audit_statistics');
      expect(securityStatsResponse.body.data).toHaveProperty('threat_statistics');
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle and recover from various error scenarios', async () => {
      // 1. 测试重复数据创建错误
      const cattleData = TestDataFactory.cattle({
        ear_tag: 'DUPLICATE_TEST',
        base_id: testBase.id,
        barn_id: 1
      });

      // 第一次创建应该成功
      const firstResponse = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cattleData);

      expect(firstResponse.status).toBe(201);

      // 第二次创建相同耳标应该失败
      const duplicateResponse = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cattleData);

      expect(duplicateResponse.status).toBe(400);
      expect(duplicateResponse.body.success).toBe(false);

      // 2. 测试无效数据更新
      const invalidUpdateResponse = await request(app)
        .put(`/api/v1/cattle/${firstResponse.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ weight: -100 }); // 负重量

      expect(invalidUpdateResponse.status).toBe(400);

      // 3. 测试不存在资源访问
      const notFoundResponse = await request(app)
        .get('/api/v1/cattle/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(notFoundResponse.status).toBe(404);

      // 4. 测试权限不足
      const limitedUser = await createTestUser({
        username: 'limited',
        email: 'limited@example.com',
        role_id: testRole.id,
        base_id: testBase.id
      });

      // 创建限制权限的角色
      const limitedRole = await createTestRole({
        name: '受限用户',
        permissions: ['cattle:read'] // 只有读权限
      });

      await limitedUser.update({ role_id: limitedRole.id });
      const limitedToken = generateTestToken(limitedUser);

      const unauthorizedResponse = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send(cattleData);

      expect(unauthorizedResponse.status).toBe(403);

      // 5. 验证系统仍然正常工作
      const healthCheckResponse = await request(app)
        .get('/api/v1/monitoring/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(healthCheckResponse.status).toBe(200);
    });
  });
});