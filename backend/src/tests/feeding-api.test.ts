import request from 'supertest';
import app from '@/app';
import { sequelize } from '@/config/database';
import { User, Role, Base, FeedFormula, FeedingRecord } from '@/models';

describe('Feeding API', () => {
  let authToken: string;
  let testUser: User;
  let testBase: Base;
  let testFormula: FeedFormula;

  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.authenticate();
    
    // Create test role
    const role = await Role.create({
      name: 'Test Admin',
      description: 'Test role for feeding API',
      permissions: [
        'feeding:read',
        'feeding:create',
        'feeding:update',
        'feeding:delete'
      ]
    });

    // Create test base
    testBase = await Base.create({
      name: 'Test Base',
      code: 'TB001',
      address: 'Test Address',
      latitude: 39.9042,
      longitude: 116.4074
    });

    // Create test user
    testUser = await User.create({
      username: 'feedingtest',
      password_hash: '$2b$10$test.hash.for.feeding.api',
      real_name: 'Feeding Test User',
      email: 'feeding@test.com',
      role_id: role.id,
      base_id: testBase.id,
      status: 'active'
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'feedingtest',
        password: 'testpassword'
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data.token;
    } else {
      // Mock token for testing
      authToken = 'mock-token-for-testing';
    }
  });

  afterAll(async () => {
    // Clean up test data
    await FeedingRecord.destroy({ where: {} });
    await FeedFormula.destroy({ where: {} });
    await User.destroy({ where: { username: 'feedingtest' } });
    await Base.destroy({ where: { code: 'TB001' } });
    await Role.destroy({ where: { name: 'Test Admin' } });
    
    await sequelize.close();
  });

  describe('Feed Formula Management', () => {
    describe('POST /api/v1/feeding/formulas', () => {
      it('should create a new feed formula', async () => {
        const formulaData = {
          name: '测试配方',
          description: '用于测试的饲料配方',
          ingredients: {
            '玉米': { ratio: 50, unit: '%', cost: 2.5 },
            '豆粕': { ratio: 30, unit: '%', cost: 4.0 },
            '麸皮': { ratio: 20, unit: '%', cost: 2.0 }
          }
        };

        const response = await request(app)
          .post('/api/v1/feeding/formulas')
          .set('Authorization', `Bearer ${authToken}`)
          .send(formulaData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(formulaData.name);
        expect(response.body.data.ingredients).toEqual(formulaData.ingredients);

        testFormula = response.body.data;
      });

      it('should reject formula with invalid ingredient ratios', async () => {
        const invalidFormulaData = {
          name: '无效配方',
          ingredients: {
            '玉米': { ratio: 60, unit: '%', cost: 2.5 },
            '豆粕': { ratio: 30, unit: '%', cost: 4.0 }
            // Total ratio is 90%, should be 100%
          }
        };

        const response = await request(app)
          .post('/api/v1/feeding/formulas')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidFormulaData);

        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
      });

      it('should reject duplicate formula names', async () => {
        const duplicateFormulaData = {
          name: '测试配方', // Same name as created above
          ingredients: {
            '玉米': { ratio: 100, unit: '%', cost: 2.5 }
          }
        };

        const response = await request(app)
          .post('/api/v1/feeding/formulas')
          .set('Authorization', `Bearer ${authToken}`)
          .send(duplicateFormulaData);

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/feeding/formulas', () => {
      it('should get list of feed formulas', async () => {
        const response = await request(app)
          .get('/api/v1/feeding/formulas')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.formulas).toBeInstanceOf(Array);
        expect(response.body.data.pagination).toBeDefined();
      });

      it('should support search functionality', async () => {
        const response = await request(app)
          .get('/api/v1/feeding/formulas?search=测试')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.formulas.length).toBeGreaterThan(0);
      });
    });

    describe('GET /api/v1/feeding/formulas/:id', () => {
      it('should get a specific feed formula', async () => {
        const response = await request(app)
          .get(`/api/v1/feeding/formulas/${testFormula.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.formula.id).toBe(testFormula.id);
        expect(response.body.data.usage_stats).toBeDefined();
      });

      it('should return 404 for non-existent formula', async () => {
        const response = await request(app)
          .get('/api/v1/feeding/formulas/99999')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/feeding/formulas/:id', () => {
      it('should update a feed formula', async () => {
        const updateData = {
          description: '更新后的配方描述'
        };

        const response = await request(app)
          .put(`/api/v1/feeding/formulas/${testFormula.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.description).toBe(updateData.description);
      });
    });
  });

  describe('Feeding Record Management', () => {
    describe('POST /api/v1/feeding/records', () => {
      it('should create a new feeding record', async () => {
        const recordData = {
          formula_id: testFormula.id,
          base_id: testBase.id,
          amount: 100.5,
          feeding_date: '2024-01-15'
        };

        const response = await request(app)
          .post('/api/v1/feeding/records')
          .set('Authorization', `Bearer ${authToken}`)
          .send(recordData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.amount).toBe(recordData.amount);
        expect(response.body.data.base_id).toBe(recordData.base_id);
      });

      it('should reject record with invalid amount', async () => {
        const invalidRecordData = {
          formula_id: testFormula.id,
          base_id: testBase.id,
          amount: -10, // Negative amount
          feeding_date: '2024-01-15'
        };

        const response = await request(app)
          .post('/api/v1/feeding/records')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidRecordData);

        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
      });

      it('should reject record with future date', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);

        const invalidRecordData = {
          formula_id: testFormula.id,
          base_id: testBase.id,
          amount: 50,
          feeding_date: futureDate.toISOString().split('T')[0]
        };

        const response = await request(app)
          .post('/api/v1/feeding/records')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidRecordData);

        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/feeding/records', () => {
      it('should get list of feeding records', async () => {
        const response = await request(app)
          .get('/api/v1/feeding/records')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.records).toBeInstanceOf(Array);
        expect(response.body.data.pagination).toBeDefined();
      });

      it('should support filtering by base_id', async () => {
        const response = await request(app)
          .get(`/api/v1/feeding/records?base_id=${testBase.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.records).toBeInstanceOf(Array);
      });

      it('should support date range filtering', async () => {
        const response = await request(app)
          .get('/api/v1/feeding/records?start_date=2024-01-01&end_date=2024-01-31')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    describe('POST /api/v1/feeding/records/batch', () => {
      it('should create multiple feeding records', async () => {
        const batchData = {
          records: [
            {
              formula_id: testFormula.id,
              base_id: testBase.id,
              amount: 75.0,
              feeding_date: '2024-01-16'
            },
            {
              formula_id: testFormula.id,
              base_id: testBase.id,
              amount: 80.0,
              feeding_date: '2024-01-17'
            }
          ]
        };

        const response = await request(app)
          .post('/api/v1/feeding/records/batch')
          .set('Authorization', `Bearer ${authToken}`)
          .send(batchData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.created_count).toBe(2);
      });
    });
  });

  describe('Feeding Statistics', () => {
    describe('GET /api/v1/feeding/statistics', () => {
      it('should get feeding statistics for a base', async () => {
        const response = await request(app)
          .get(`/api/v1/feeding/statistics?base_id=${testBase.id}&start_date=2024-01-01&end_date=2024-01-31`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.basic_stats).toBeDefined();
        expect(response.body.data.daily_trend).toBeInstanceOf(Array);
        expect(response.body.data.formula_stats).toBeInstanceOf(Array);
        expect(response.body.data.efficiency).toBeDefined();
      });

      it('should require base_id parameter', async () => {
        const response = await request(app)
          .get('/api/v1/feeding/statistics?start_date=2024-01-01&end_date=2024-01-31')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
      });

      it('should validate date range', async () => {
        const response = await request(app)
          .get(`/api/v1/feeding/statistics?base_id=${testBase.id}&start_date=2024-01-31&end_date=2024-01-01`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(422);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Feeding Recommendations', () => {
    describe('GET /api/v1/feeding/recommendations', () => {
      it('should get feeding recommendations for a base', async () => {
        const response = await request(app)
          .get(`/api/v1/feeding/recommendations?base_id=${testBase.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.cattle_count).toBeDefined();
        expect(response.body.data.recommendations).toBeInstanceOf(Array);
      });

      it('should require base_id parameter', async () => {
        const response = await request(app)
          .get('/api/v1/feeding/recommendations')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Authorization', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/feeding/formulas');

      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/feeding/formulas')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});