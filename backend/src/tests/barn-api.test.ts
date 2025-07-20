import request from 'supertest';
import app from '@/app';
import { sequelize, User, Role, Base, Barn } from '@/models';
import jwt from 'jsonwebtoken';

describe('Barn API', () => {
  let authToken: string;
  let testUser: User;
  let testBase: Base;
  let testBarn: Barn;

  beforeAll(async () => {
    // Ensure database is connected
    await sequelize.authenticate();
    
    // Create test role
    const role = await Role.create({
      name: '基地管理员',
      description: '基地管理员角色',
      permissions: ['barn:read', 'barn:write', 'barn:delete'],
    });

    // Create test base
    testBase = await Base.create({
      name: '测试基地',
      code: 'TEST001',
      address: '测试地址',
      latitude: 39.9042,
      longitude: 116.4074,
      area: 1000.5,
    });

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      password_hash: 'hashedpassword',
      real_name: '测试用户',
      email: 'test@example.com',
      phone: '13800138000',
      role_id: role.id,
      base_id: testBase.id,
      status: 'active',
    });

    // Generate auth token
    authToken = jwt.sign(
      { 
        id: testUser.id, 
        username: testUser.username,
        role_id: testUser.role_id,
        base_id: testUser.base_id,
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await Barn.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Base.destroy({ where: {} });
    await Role.destroy({ where: {} });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up barns before each test
    await Barn.destroy({ where: {} });
  });

  describe('POST /api/v1/barns', () => {
    it('should create a new barn successfully', async () => {
      const barnData = {
        name: '测试牛棚',
        code: 'BARN001',
        base_id: testBase.id,
        capacity: 50,
        barn_type: '育肥棚',
        description: '测试牛棚描述',
        facilities: {
          water: true,
          electricity: true,
          ventilation: 'natural',
        },
      };

      const response = await request(app)
        .post('/api/v1/barns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(barnData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(barnData.name);
      expect(response.body.data.code).toBe(barnData.code);
      expect(response.body.data.capacity).toBe(barnData.capacity);
      expect(response.body.data.current_count).toBe(0);
      expect(response.body.data.base).toBeDefined();
    });

    it('should return 409 when barn code already exists in the same base', async () => {
      // Create first barn
      await Barn.create({
        name: '第一个牛棚',
        code: 'BARN001',
        base_id: testBase.id,
        capacity: 50,
      });

      const barnData = {
        name: '第二个牛棚',
        code: 'BARN001', // Same code
        base_id: testBase.id,
        capacity: 30,
      };

      const response = await request(app)
        .post('/api/v1/barns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(barnData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BARN_CODE_EXISTS');
    });

    it('should return 400 for invalid barn data', async () => {
      const barnData = {
        name: '', // Empty name
        code: 'BARN001',
        base_id: testBase.id,
        capacity: 0, // Invalid capacity
      };

      const response = await request(app)
        .post('/api/v1/barns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(barnData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const barnData = {
        name: '测试牛棚',
        code: 'BARN001',
        base_id: testBase.id,
        capacity: 50,
      };

      await request(app)
        .post('/api/v1/barns')
        .send(barnData)
        .expect(401);
    });
  });

  describe('GET /api/v1/barns', () => {
    beforeEach(async () => {
      // Create test barns
      await Barn.bulkCreate([
        {
          name: '育肥棚A',
          code: 'BARN001',
          base_id: testBase.id,
          capacity: 50,
          current_count: 30,
          barn_type: '育肥棚',
        },
        {
          name: '繁殖棚B',
          code: 'BARN002',
          base_id: testBase.id,
          capacity: 40,
          current_count: 25,
          barn_type: '繁殖棚',
        },
      ]);
    });

    it('should get barn list successfully', async () => {
      const response = await request(app)
        .get('/api/v1/barns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.barns).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter barns by type', async () => {
      const response = await request(app)
        .get('/api/v1/barns?barn_type=育肥棚')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.barns).toHaveLength(1);
      expect(response.body.data.barns[0].barn_type).toBe('育肥棚');
    });

    it('should search barns by name', async () => {
      const response = await request(app)
        .get('/api/v1/barns?search=育肥')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.barns).toHaveLength(1);
      expect(response.body.data.barns[0].name).toContain('育肥');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/barns?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.barns).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/v1/barns/:id', () => {
    beforeEach(async () => {
      testBarn = await Barn.create({
        name: '测试牛棚',
        code: 'BARN001',
        base_id: testBase.id,
        capacity: 50,
        current_count: 30,
        barn_type: '育肥棚',
        description: '测试描述',
      });
    });

    it('should get barn details successfully', async () => {
      const response = await request(app)
        .get(`/api/v1/barns/${testBarn.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testBarn.id);
      expect(response.body.data.name).toBe(testBarn.name);
      expect(response.body.data.base).toBeDefined();
    });

    it('should return 404 for non-existent barn', async () => {
      const response = await request(app)
        .get('/api/v1/barns/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BARN_NOT_FOUND');
    });
  });

  describe('PUT /api/v1/barns/:id', () => {
    beforeEach(async () => {
      testBarn = await Barn.create({
        name: '测试牛棚',
        code: 'BARN001',
        base_id: testBase.id,
        capacity: 50,
        current_count: 30,
        barn_type: '育肥棚',
      });
    });

    it('should update barn successfully', async () => {
      const updateData = {
        name: '更新后的牛棚',
        capacity: 60,
        barn_type: '繁殖棚',
        description: '更新后的描述',
      };

      const response = await request(app)
        .put(`/api/v1/barns/${testBarn.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.capacity).toBe(updateData.capacity);
      expect(response.body.data.barn_type).toBe(updateData.barn_type);
    });

    it('should return 400 when reducing capacity below current count', async () => {
      const updateData = {
        capacity: 20, // Less than current_count (30)
      };

      const response = await request(app)
        .put(`/api/v1/barns/${testBarn.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CAPACITY_TOO_SMALL');
    });

    it('should return 404 for non-existent barn', async () => {
      const updateData = {
        name: '更新后的牛棚',
      };

      const response = await request(app)
        .put('/api/v1/barns/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BARN_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/barns/:id', () => {
    beforeEach(async () => {
      testBarn = await Barn.create({
        name: '测试牛棚',
        code: 'BARN001',
        base_id: testBase.id,
        capacity: 50,
        current_count: 0, // Empty barn
        barn_type: '育肥棚',
      });
    });

    it('should delete empty barn successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/barns/${testBarn.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('删除成功');

      // Verify barn is deleted
      const deletedBarn = await Barn.findByPk(testBarn.id);
      expect(deletedBarn).toBeNull();
    });

    it('should return 400 when trying to delete non-empty barn', async () => {
      // Update barn to have cattle
      await testBarn.update({ current_count: 10 });

      const response = await request(app)
        .delete(`/api/v1/barns/${testBarn.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BARN_NOT_EMPTY');
    });

    it('should return 404 for non-existent barn', async () => {
      const response = await request(app)
        .delete('/api/v1/barns/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('BARN_NOT_FOUND');
    });
  });

  describe('GET /api/v1/barns/statistics', () => {
    beforeEach(async () => {
      // Create test barns with different types and utilization
      await Barn.bulkCreate([
        {
          name: '育肥棚A',
          code: 'BARN001',
          base_id: testBase.id,
          capacity: 50,
          current_count: 40,
          barn_type: '育肥棚',
        },
        {
          name: '育肥棚B',
          code: 'BARN002',
          base_id: testBase.id,
          capacity: 60,
          current_count: 30,
          barn_type: '育肥棚',
        },
        {
          name: '繁殖棚A',
          code: 'BARN003',
          base_id: testBase.id,
          capacity: 40,
          current_count: 35,
          barn_type: '繁殖棚',
        },
      ]);
    });

    it('should get barn statistics successfully', async () => {
      const response = await request(app)
        .get('/api/v1/barns/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.total_barns).toBe(3);
      expect(response.body.data.overview.total_capacity).toBe(150);
      expect(response.body.data.overview.total_current_count).toBe(105);
      expect(response.body.data.type_statistics).toBeDefined();
      expect(response.body.data.utilization_distribution).toBeDefined();
      expect(response.body.data.barns).toHaveLength(3);
    });
  });

  describe('GET /api/v1/barns/options', () => {
    beforeEach(async () => {
      await Barn.bulkCreate([
        {
          name: '育肥棚A',
          code: 'BARN001',
          base_id: testBase.id,
          capacity: 50,
          current_count: 30,
          barn_type: '育肥棚',
        },
        {
          name: '满员牛棚',
          code: 'BARN002',
          base_id: testBase.id,
          capacity: 40,
          current_count: 40, // Full capacity
          barn_type: '育肥棚',
        },
      ]);
    });

    it('should get barn options successfully', async () => {
      const response = await request(app)
        .get('/api/v1/barns/options')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].value).toBeDefined();
      expect(response.body.data[0].label).toBeDefined();
      expect(response.body.data[0].available_capacity).toBeDefined();
      
      // Check that full barn is disabled
      const fullBarn = response.body.data.find((option: any) => option.current_count >= option.capacity);
      expect(fullBarn.disabled).toBe(true);
    });
  });
});