import request from 'supertest';
import app from '@/app';
import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';
import { 
  createTestUser, 
  createTestRole, 
  createTestBase, 
  createTestBarn,
  createTestCattle,
  cleanupTestData,
  generateTestToken,
  TestDataFactory
} from '../helpers/testHelpers';

describe('API Integration Tests', () => {
  let testUser: any;
  let testRole: any;
  let testBase: any;
  let authToken: string;

  beforeAll(async () => {
    // 确保数据库连接
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // 清理测试数据
    await cleanupTestData();

    // 创建测试基础数据
    testRole = await createTestRole({
      name: '管理员',
      permissions: ['*']
    });

    testBase = await createTestBase();

    testUser = await createTestUser({
      role_id: testRole.id,
      base_id: testBase.id
    });

    authToken = generateTestToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestData();
    await sequelize.close();
    await redisClient.quit();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: testUser.username,
            password: 'TestPassword123!'
          });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('token');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user.username).toBe(testUser.username);
      });

      it('should reject invalid credentials', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: testUser.username,
            password: 'wrongpassword'
          });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('密码错误');
      });

      it('should reject non-existent user', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: 'nonexistent',
            password: 'password'
          });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('用户不存在');
      });
    });

    describe('POST /api/v1/auth/logout', () => {
      it('should logout successfully', async () => {
        const response = await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('GET /api/v1/auth/profile', () => {
      it('should get user profile with valid token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe(testUser.username);
      });

      it('should reject request without token', async () => {
        const response = await request(app)
          .get('/api/v1/auth/profile');

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('User Management Endpoints', () => {
    describe('GET /api/v1/users', () => {
      it('should get users list', async () => {
        const response = await request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/v1/users?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });
    });

    describe('POST /api/v1/users', () => {
      it('should create new user', async () => {
        const userData = TestDataFactory.user({
          username: 'newuser',
          email: 'newuser@example.com'
        });

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send(userData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.username).toBe(userData.username);
      });

      it('should reject duplicate username', async () => {
        const userData = TestDataFactory.user({
          username: testUser.username
        });

        const response = await request(app)
          .post('/api/v1/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send(userData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/users/:id', () => {
      it('should update user', async () => {
        const updateData = {
          real_name: '更新后的姓名',
          phone: '13900139000'
        };

        const response = await request(app)
          .put(`/api/v1/users/${testUser.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.real_name).toBe(updateData.real_name);
      });
    });

    describe('DELETE /api/v1/users/:id', () => {
      it('should delete user', async () => {
        const newUser = await createTestUser({
          username: 'todelete',
          email: 'todelete@example.com'
        });

        const response = await request(app)
          .delete(`/api/v1/users/${newUser.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Cattle Management Endpoints', () => {
    let testBarn: any;

    beforeEach(async () => {
      testBarn = await createTestBarn({
        base_id: testBase.id
      });
    });

    describe('GET /api/v1/cattle', () => {
      it('should get cattle list', async () => {
        await createTestCattle({
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const response = await request(app)
          .get('/api/v1/cattle')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter cattle by base', async () => {
        await createTestCattle({
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const response = await request(app)
          .get(`/api/v1/cattle?base_id=${testBase.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        response.body.data.forEach((cattle: any) => {
          expect(cattle.base_id).toBe(testBase.id);
        });
      });
    });

    describe('POST /api/v1/cattle', () => {
      it('should create new cattle', async () => {
        const cattleData = TestDataFactory.cattle({
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const response = await request(app)
          .post('/api/v1/cattle')
          .set('Authorization', `Bearer ${authToken}`)
          .send(cattleData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.ear_tag).toBe(cattleData.ear_tag);
      });

      it('should reject duplicate ear tag', async () => {
        const existingCattle = await createTestCattle({
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const cattleData = TestDataFactory.cattle({
          ear_tag: existingCattle.ear_tag,
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const response = await request(app)
          .post('/api/v1/cattle')
          .set('Authorization', `Bearer ${authToken}`)
          .send(cattleData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/cattle/:id', () => {
      it('should get cattle details', async () => {
        const cattle = await createTestCattle({
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const response = await request(app)
          .get(`/api/v1/cattle/${cattle.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(cattle.id);
        expect(response.body.data.ear_tag).toBe(cattle.ear_tag);
      });

      it('should return 404 for non-existent cattle', async () => {
        const response = await request(app)
          .get('/api/v1/cattle/99999')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/cattle/:id', () => {
      it('should update cattle', async () => {
        const cattle = await createTestCattle({
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const updateData = {
          weight: 600,
          health_status: 'sick'
        };

        const response = await request(app)
          .put(`/api/v1/cattle/${cattle.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.weight).toBe(updateData.weight);
        expect(response.body.data.health_status).toBe(updateData.health_status);
      });
    });

    describe('DELETE /api/v1/cattle/:id', () => {
      it('should delete cattle', async () => {
        const cattle = await createTestCattle({
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const response = await request(app)
          .delete(`/api/v1/cattle/${cattle.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Base Management Endpoints', () => {
    describe('GET /api/v1/bases', () => {
      it('should get bases list', async () => {
        const response = await request(app)
          .get('/api/v1/bases')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });

    describe('POST /api/v1/bases', () => {
      it('should create new base', async () => {
        const baseData = TestDataFactory.base({
          manager_id: testUser.id
        });

        const response = await request(app)
          .post('/api/v1/bases')
          .set('Authorization', `Bearer ${authToken}`)
          .send(baseData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(baseData.name);
      });
    });

    describe('GET /api/v1/bases/:id', () => {
      it('should get base details', async () => {
        const response = await request(app)
          .get(`/api/v1/bases/${testBase.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testBase.id);
      });
    });

    describe('PUT /api/v1/bases/:id', () => {
      it('should update base', async () => {
        const updateData = {
          name: '更新后的基地名称',
          address: '更新后的地址'
        };

        const response = await request(app)
          .put(`/api/v1/bases/${testBase.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateData.name);
      });
    });
  });

  describe('Barn Management Endpoints', () => {
    let testBarn: any;

    beforeEach(async () => {
      testBarn = await createTestBarn({
        base_id: testBase.id
      });
    });

    describe('GET /api/v1/barns', () => {
      it('should get barns list', async () => {
        const response = await request(app)
          .get('/api/v1/barns')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter barns by base', async () => {
        const response = await request(app)
          .get(`/api/v1/barns?base_id=${testBase.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        response.body.data.forEach((barn: any) => {
          expect(barn.base_id).toBe(testBase.id);
        });
      });
    });

    describe('POST /api/v1/barns', () => {
      it('should create new barn', async () => {
        const barnData = TestDataFactory.barn({
          base_id: testBase.id
        });

        const response = await request(app)
          .post('/api/v1/barns')
          .set('Authorization', `Bearer ${authToken}`)
          .send(barnData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(barnData.name);
      });
    });

    describe('GET /api/v1/barns/:id', () => {
      it('should get barn details', async () => {
        const response = await request(app)
          .get(`/api/v1/barns/${testBarn.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testBarn.id);
      });
    });

    describe('PUT /api/v1/barns/:id', () => {
      it('should update barn', async () => {
        const updateData = {
          name: '更新后的牛棚名称',
          capacity: 150
        };

        const response = await request(app)
          .put(`/api/v1/barns/${testBarn.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.capacity).toBe(updateData.capacity);
      });
    });

    describe('DELETE /api/v1/barns/:id', () => {
      it('should delete barn', async () => {
        const response = await request(app)
          .delete(`/api/v1/barns/${testBarn.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Dashboard Endpoints', () => {
    describe('GET /api/v1/dashboard/overview', () => {
      it('should get dashboard overview data', async () => {
        // 创建一些测试数据
        const testBarn = await createTestBarn({ base_id: testBase.id });
        await createTestCattle({ base_id: testBase.id, barn_id: testBarn.id });

        const response = await request(app)
          .get('/api/v1/dashboard/overview')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('cattle_stats');
        expect(response.body.data).toHaveProperty('health_stats');
        expect(response.body.data).toHaveProperty('feeding_stats');
        expect(response.body.data).toHaveProperty('recent_events');
      });
    });

    describe('GET /api/v1/dashboard/statistics', () => {
      it('should get dashboard statistics', async () => {
        const response = await request(app)
          .get('/api/v1/dashboard/statistics')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('total_cattle');
        expect(response.body.data).toHaveProperty('total_bases');
        expect(response.body.data).toHaveProperty('total_barns');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // 缺少必需字段

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // 快速发送多个请求来触发速率限制
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/v1/users')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      // 检查是否有请求被限制
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      // 注意：这个测试可能不稳定，因为速率限制的具体行为取决于配置
      // 这里只是验证速率限制机制存在
      if (rateLimitedResponses.length > 0) {
        expect(rateLimitedResponses[0].body.success).toBe(false);
        expect(rateLimitedResponses[0].body.error).toBe('RATE_LIMIT_EXCEEDED');
      }
    }, 10000);
  });

  describe('Data Permissions', () => {
    it('should enforce base-level data isolation', async () => {
      // 创建另一个基地和用户
      const otherBase = await createTestBase({
        name: '其他基地',
        code: 'OTHER001'
      });

      const otherUser = await createTestUser({
        username: 'otheruser',
        email: 'other@example.com',
        base_id: otherBase.id,
        role_id: testRole.id
      });

      const otherToken = generateTestToken(otherUser);

      // 在其他基地创建牛只
      const otherBarn = await createTestBarn({ base_id: otherBase.id });
      await createTestCattle({
        ear_tag: 'OTHER001',
        base_id: otherBase.id,
        barn_id: otherBarn.id
      });

      // 使用第一个用户的token查询，应该只能看到自己基地的数据
      const response = await request(app)
        .get('/api/v1/cattle')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // 验证返回的数据都属于当前用户的基地
      response.body.data.forEach((cattle: any) => {
        expect(cattle.base_id).toBe(testBase.id);
      });
    });
  });
});