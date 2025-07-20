import request from 'supertest';
import app from '@/app';
import { sequelize, Base, User, Role } from '@/models';
import { setupTestDatabase, cleanupTestDatabase, createTestUser, getAuthToken } from './helpers/testHelpers';

describe('Base API', () => {
  let authToken: string;
  let testUser: User;
  let adminUser: User;
  let adminToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create test users
    testUser = await createTestUser({
      username: 'testuser',
      password: 'Test123456',
      real_name: 'Test User',
      role_name: 'base_manager',
    });
    
    adminUser = await createTestUser({
      username: 'admin',
      password: 'Admin123456',
      real_name: 'Admin User',
      role_name: 'system_admin',
    });

    authToken = await getAuthToken('testuser', 'Test123456');
    adminToken = await getAuthToken('admin', 'Admin123456');
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up bases before each test
    await Base.destroy({ where: {}, force: true });
  });

  describe('POST /api/v1/bases', () => {
    it('should create a new base with valid data', async () => {
      const baseData = {
        name: 'Test Base',
        code: 'TB001',
        address: 'Test Address',
        latitude: 39.9042,
        longitude: 116.4074,
        area: 1000.50,
        manager_id: testUser.id,
      };

      const response = await request(app)
        .post('/api/v1/bases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(baseData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.base.name).toBe(baseData.name);
      expect(response.body.data.base.code).toBe(baseData.code);
      expect(response.body.data.base.address).toBe(baseData.address);
      expect(parseFloat(response.body.data.base.latitude)).toBe(baseData.latitude);
      expect(parseFloat(response.body.data.base.longitude)).toBe(baseData.longitude);
      expect(parseFloat(response.body.data.base.area)).toBe(baseData.area);
      expect(response.body.data.base.manager_id).toBe(baseData.manager_id);
    });

    it('should return 409 if base code already exists', async () => {
      const baseData = {
        name: 'Test Base',
        code: 'TB001',
        address: 'Test Address',
      };

      // Create first base
      await request(app)
        .post('/api/v1/bases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(baseData)
        .expect(201);

      // Try to create second base with same code
      const response = await request(app)
        .post('/api/v1/bases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...baseData, name: 'Another Base' })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BASE_CODE_EXISTS');
    });

    it('should return 400 if manager does not exist', async () => {
      const baseData = {
        name: 'Test Base',
        code: 'TB001',
        manager_id: 99999, // Non-existent user ID
      };

      const response = await request(app)
        .post('/api/v1/bases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(baseData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MANAGER_NOT_FOUND');
    });

    it('should return 400 with invalid data', async () => {
      const baseData = {
        name: '', // Empty name
        code: 'TB001',
      };

      const response = await request(app)
        .post('/api/v1/bases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(baseData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/bases', () => {
    beforeEach(async () => {
      // Create test bases
      await Base.bulkCreate([
        {
          name: 'Base A',
          code: 'BA001',
          address: 'Address A',
          manager_id: testUser.id,
        },
        {
          name: 'Base B',
          code: 'BB001',
          address: 'Address B',
        },
        {
          name: 'Base C',
          code: 'BC001',
          address: 'Address C',
        },
      ]);
    });

    it('should return paginated list of bases', async () => {
      const response = await request(app)
        .get('/api/v1/bases')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bases).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(20);
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/v1/bases?search=Base A')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bases).toHaveLength(1);
      expect(response.body.data.bases[0].name).toBe('Base A');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/bases?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bases).toHaveLength(2);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/v1/bases/:id', () => {
    let testBase: Base;

    beforeEach(async () => {
      testBase = await Base.create({
        name: 'Test Base',
        code: 'TB001',
        address: 'Test Address',
        manager_id: testUser.id,
      });
    });

    it('should return base by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/bases/${testBase.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.base.id).toBe(testBase.id);
      expect(response.body.data.base.name).toBe(testBase.name);
    });

    it('should return 404 for non-existent base', async () => {
      const response = await request(app)
        .get('/api/v1/bases/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BASE_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/bases/:id', () => {
    let testBase: Base;

    beforeEach(async () => {
      testBase = await Base.create({
        name: 'Test Base',
        code: 'TB001',
        address: 'Test Address',
      });
    });

    it('should update base with valid data', async () => {
      const updateData = {
        name: 'Updated Base',
        address: 'Updated Address',
        area: 2000.75,
      };

      const response = await request(app)
        .put(`/api/v1/bases/${testBase.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.base.name).toBe(updateData.name);
      expect(response.body.data.base.address).toBe(updateData.address);
      expect(parseFloat(response.body.data.base.area)).toBe(updateData.area);
    });

    it('should return 404 for non-existent base', async () => {
      const response = await request(app)
        .put('/api/v1/bases/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Base' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BASE_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/bases/:id', () => {
    let testBase: Base;

    beforeEach(async () => {
      testBase = await Base.create({
        name: 'Test Base',
        code: 'TB001',
        address: 'Test Address',
      });
    });

    it('should delete base successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/bases/${testBase.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify base is deleted
      const deletedBase = await Base.findByPk(testBase.id);
      expect(deletedBase).toBeNull();
    });

    it('should return 404 for non-existent base', async () => {
      const response = await request(app)
        .delete('/api/v1/bases/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BASE_NOT_FOUND');
    });
  });

  describe('GET /api/v1/bases/:id/statistics', () => {
    let testBase: Base;

    beforeEach(async () => {
      testBase = await Base.create({
        name: 'Test Base',
        code: 'TB001',
        address: 'Test Address',
      });
    });

    it('should return base statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/bases/${testBase.id}/statistics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.base_info).toBeDefined();
      expect(response.body.data.statistics.user_count).toBeDefined();
      expect(response.body.data.statistics.barn_count).toBeDefined();
      expect(response.body.data.statistics.cattle_count).toBeDefined();
    });

    it('should return 404 for non-existent base', async () => {
      const response = await request(app)
        .get('/api/v1/bases/99999/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BASE_NOT_FOUND');
    });
  });

  describe('GET /api/v1/bases/managers/available', () => {
    it('should return available managers', async () => {
      const response = await request(app)
        .get('/api/v1/bases/managers/available')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.managers).toBeDefined();
      expect(Array.isArray(response.body.data.managers)).toBe(true);
    });
  });

  describe('POST /api/v1/bases/bulk-import', () => {
    it('should bulk import bases successfully', async () => {
      const basesData = {
        bases: [
          {
            name: 'Bulk Base 1',
            code: 'BB001',
            address: 'Bulk Address 1',
            latitude: 39.9042,
            longitude: 116.4074,
            area: 1000,
          },
          {
            name: 'Bulk Base 2',
            code: 'BB002',
            address: 'Bulk Address 2',
            latitude: 40.0042,
            longitude: 116.5074,
            area: 1500,
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/bases/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(basesData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(0);
      expect(response.body.data.total).toBe(2);
    });

    it('should handle duplicate codes in bulk import', async () => {
      // Create a base first
      await Base.create({
        name: 'Existing Base',
        code: 'EB001',
        address: 'Existing Address',
      });

      const basesData = {
        bases: [
          {
            name: 'New Base',
            code: 'NB001',
            address: 'New Address',
          },
          {
            name: 'Duplicate Base',
            code: 'EB001', // Duplicate code
            address: 'Duplicate Address',
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/bases/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(basesData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toHaveLength(1);
      expect(response.body.data.failed).toHaveLength(1);
      expect(response.body.data.failed[0].error).toContain('已存在');
    });

    it('should return 400 with invalid bulk import data', async () => {
      const basesData = {
        bases: [
          {
            name: '', // Empty name
            code: 'BB001',
          },
        ],
      };

      const response = await request(app)
        .post('/api/v1/bases/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(basesData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/bases/export', () => {
    beforeEach(async () => {
      // Create test bases for export
      await Base.bulkCreate([
        {
          name: 'Export Base 1',
          code: 'EX001',
          address: 'Export Address 1',
          manager_id: testUser.id,
        },
        {
          name: 'Export Base 2',
          code: 'EX002',
          address: 'Export Address 2',
        },
      ]);
    });

    it('should export bases in JSON format', async () => {
      const response = await request(app)
        .get('/api/v1/bases/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.bases).toBeDefined();
      expect(Array.isArray(response.body.data.bases)).toBe(true);
      expect(response.body.data.bases.length).toBeGreaterThan(0);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.exported_at).toBeDefined();
    });

    it('should export bases in CSV format', async () => {
      const response = await request(app)
        .get('/api/v1/bases/export?format=csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment; filename=bases.csv');
      expect(response.text).toContain('ID,名称,编码');
    });
  });

  describe('POST /api/v1/bases/validate-location', () => {
    it('should validate valid coordinates in China', async () => {
      const locationData = {
        latitude: 39.9042,
        longitude: 116.4074,
        address: '北京市朝阳区',
      };

      const response = await request(app)
        .post('/api/v1/bases/validate-location')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(locationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coordinates.valid).toBe(true);
      expect(response.body.data.location_info.is_in_china).toBe(true);
    });

    it('should validate coordinates outside China', async () => {
      const locationData = {
        latitude: 40.7128,
        longitude: -74.0060, // New York coordinates
        address: 'New York, USA',
      };

      const response = await request(app)
        .post('/api/v1/bases/validate-location')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(locationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.coordinates.valid).toBe(true);
      expect(response.body.data.location_info.is_in_china).toBe(false);
      expect(response.body.data.recommendations).toContain('坐标位置不在中国境内，请确认坐标是否正确');
    });

    it('should return 400 for invalid coordinates', async () => {
      const locationData = {
        latitude: 100, // Invalid latitude
        longitude: 116.4074,
      };

      const response = await request(app)
        .post('/api/v1/bases/validate-location')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(locationData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing coordinates', async () => {
      const locationData = {
        address: 'Some address',
      };

      const response = await request(app)
        .post('/api/v1/bases/validate-location')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(locationData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/bases/:id/capacity', () => {
    let testBase: Base;

    beforeEach(async () => {
      testBase = await Base.create({
        name: 'Capacity Test Base',
        code: 'CTB001',
        address: 'Capacity Test Address',
        area: 5000,
      });
    });

    it('should return base capacity information', async () => {
      const response = await request(app)
        .get(`/api/v1/bases/${testBase.id}/capacity`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.capacity_info).toBeDefined();
      expect(response.body.data.capacity_info.base_info).toBeDefined();
      expect(response.body.data.capacity_info.barn_capacity).toBeDefined();
      expect(response.body.data.capacity_info.cattle_distribution).toBeDefined();
    });

    it('should return 404 for non-existent base', async () => {
      const response = await request(app)
        .get('/api/v1/bases/99999/capacity')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BASE_NOT_FOUND');
    });
  });
});