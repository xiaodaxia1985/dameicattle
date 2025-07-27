import request from 'supertest';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';
import { createTestToken } from '../helpers/auth';
import app, { initializeAppForTesting } from '../../app';

describe('API Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    await initializeAppForTesting();
    await setupTestDatabase();
    authToken = createTestToken();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      // 这是一个示例测试，实际需要根据应用结构调整
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Authentication Endpoints', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        username: 'testuser',
        password: 'testpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        username: 'invaliduser',
        password: 'wrongpassword'
      };

      await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      await request(app)
        .get('/api/v1/cattle')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject access without token', async () => {
      await request(app)
        .get('/api/v1/cattle')
        .expect(401);
    });

    it('should reject access with invalid token', async () => {
      await request(app)
        .get('/api/v1/cattle')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('CRUD Operations', () => {
    it('should create new cattle record', async () => {
      // First create required base and barn records
      const baseData = {
        name: 'Test Base',
        code: 'TB001',
        location: 'Test Location',
        description: 'Test base for integration tests'
      };

      const baseResponse = await request(app)
        .post('/api/v1/bases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(baseData)
        .expect(201);

      const baseId = baseResponse.body.id;

      const barnData = {
        name: 'Test Barn',
        code: 'TBN001',
        baseId: baseId,
        capacity: 100,
        currentCount: 0
      };

      const barnResponse = await request(app)
        .post('/api/v1/barns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(barnData)
        .expect(201);

      const barnId = barnResponse.body.id;

      const cattleData = {
        earTag: 'TEST001',
        breed: '西门塔尔',
        gender: 'male',
        birthDate: '2023-01-01',
        weight: 500.00,
        baseId: baseId,
        barnId: barnId
      };

      const response = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cattleData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.earTag).toBe('TEST001');
    });

    it('should get cattle list', async () => {
      const response = await request(app)
        .get('/api/v1/cattle')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should update cattle record', async () => {
      // First create required base and barn records
      const baseData = {
        name: 'Test Base 2',
        code: 'TB002',
        location: 'Test Location 2',
        description: 'Test base for update test'
      };

      const baseResponse = await request(app)
        .post('/api/v1/bases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(baseData)
        .expect(201);

      const baseId = baseResponse.body.id;

      const barnData = {
        name: 'Test Barn 2',
        code: 'TBN002',
        baseId: baseId,
        capacity: 100,
        currentCount: 0
      };

      const barnResponse = await request(app)
        .post('/api/v1/barns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(barnData)
        .expect(201);

      const barnId = barnResponse.body.id;

      // 首先创建一个牛只记录
      const cattleData = {
        earTag: 'TEST002',
        breed: '安格斯',
        gender: 'female',
        weight: 450.00,
        baseId: baseId,
        barnId: barnId
      };

      const createResponse = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cattleData)
        .expect(201);

      const cattleId = createResponse.body.id;

      // 更新记录
      const updateData = {
        weight: 480.00,
        healthStatus: 'healthy'
      };

      const updateResponse = await request(app)
        .put(`/api/v1/cattle/${cattleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.weight).toBe(480.00);
      expect(updateResponse.body.healthStatus).toBe('healthy');
    });

    it('should delete cattle record', async () => {
      // First create required base and barn records
      const baseData = {
        name: 'Test Base 3',
        code: 'TB003',
        location: 'Test Location 3',
        description: 'Test base for delete test'
      };

      const baseResponse = await request(app)
        .post('/api/v1/bases')
        .set('Authorization', `Bearer ${authToken}`)
        .send(baseData)
        .expect(201);

      const baseId = baseResponse.body.id;

      const barnData = {
        name: 'Test Barn 3',
        code: 'TBN003',
        baseId: baseId,
        capacity: 100,
        currentCount: 0
      };

      const barnResponse = await request(app)
        .post('/api/v1/barns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(barnData)
        .expect(201);

      const barnId = barnResponse.body.id;

      // 首先创建一个牛只记录
      const cattleData = {
        earTag: 'TEST003',
        breed: '夏洛莱',
        gender: 'male',
        baseId: baseId,
        barnId: barnId
      };

      const createResponse = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cattleData)
        .expect(201);

      const cattleId = createResponse.body.id;

      // 删除记录
      await request(app)
        .delete(`/api/v1/cattle/${cattleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // 验证记录已删除
      await request(app)
        .get(`/api/v1/cattle/${cattleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});