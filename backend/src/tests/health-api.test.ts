import request from 'supertest';
import app from '@/app';
import { sequelize, User, Role, Base, Cattle, HealthRecord, VaccinationRecord } from '@/models';
import { generateToken } from '@/middleware/auth';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

describe('Health Management API', () => {
  let authToken: string;
  let testUser: User;
  let testBase: Base;
  let testCattle: Cattle;
  let testHealthRecord: HealthRecord;
  let testVaccinationRecord: VaccinationRecord;

  beforeAll(async () => {
    // 确保数据库连接
    await sequelize.authenticate();
    
    // 同步数据库模型
    await sequelize.sync({ force: true });

    // 创建测试角色
    const role = await Role.create({
      name: 'veterinarian',
      description: '兽医',
      permissions: [
        'health:read',
        'health:create',
        'health:update',
        'health:delete'
      ]
    });

    // 创建测试基地
    testBase = await Base.create({
      name: '测试基地',
      code: 'TEST001',
      address: '测试地址',
      latitude: 39.9042,
      longitude: 116.4074,
      area: 1000.00
    });

    // 创建测试用户
    testUser = await User.create({
      username: 'test_vet',
      password_hash: 'hashed_password',
      real_name: '测试兽医',
      email: 'vet@test.com',
      phone: '13800138000',
      role_id: role.id,
      base_id: testBase.id,
      status: 'active'
    });

    // 创建测试牛只
    testCattle = await Cattle.create({
      ear_tag: 'TEST001',
      breed: '西门塔尔牛',
      gender: 'female',
      birth_date: new Date('2023-01-01'),
      weight: 450.5,
      health_status: 'healthy',
      base_id: testBase.id
    });

    // 生成认证token
    authToken = generateToken(testUser.id);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await HealthRecord.destroy({ where: {} });
    await VaccinationRecord.destroy({ where: {} });
  });

  describe('Health Records API', () => {
    describe('POST /api/v1/health/records', () => {
      it('should create a new health record', async () => {
        const healthRecordData = {
          cattle_id: testCattle.id,
          symptoms: '食欲不振，体温升高',
          diagnosis: '感冒',
          treatment: '注射抗生素，隔离观察',
          veterinarian_id: testUser.id,
          diagnosis_date: '2024-01-15',
          status: 'ongoing'
        };

        const response = await request(app)
          .post('/api/v1/health/records')
          .set('Authorization', `Bearer ${authToken}`)
          .send(healthRecordData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.cattle_id).toBe(testCattle.id);
        expect(response.body.data.symptoms).toBe(healthRecordData.symptoms);
        expect(response.body.data.diagnosis).toBe(healthRecordData.diagnosis);
        expect(response.body.data.treatment).toBe(healthRecordData.treatment);
        expect(response.body.data.status).toBe('ongoing');

        // 验证牛只健康状态是否更新
        await testCattle.reload();
        expect(testCattle.health_status).toBe('sick');
      });

      it('should return 400 for invalid cattle_id', async () => {
        const healthRecordData = {
          cattle_id: 99999,
          symptoms: '测试症状',
          diagnosis_date: '2024-01-15'
        };

        const response = await request(app)
          .post('/api/v1/health/records')
          .set('Authorization', `Bearer ${authToken}`)
          .send(healthRecordData)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('牛只不存在');
      });

      it('should return 401 without authentication', async () => {
        const healthRecordData = {
          cattle_id: testCattle.id,
          diagnosis_date: '2024-01-15'
        };

        await request(app)
          .post('/api/v1/health/records')
          .send(healthRecordData)
          .expect(401);
      });
    });

    describe('GET /api/v1/health/records', () => {
      beforeEach(async () => {
        // 创建测试健康记录
        testHealthRecord = await HealthRecord.create({
          cattle_id: testCattle.id,
          symptoms: '测试症状',
          diagnosis: '测试诊断',
          treatment: '测试治疗',
          veterinarian_id: testUser.id,
          diagnosis_date: new Date('2024-01-15'),
          status: 'ongoing'
        });
      });

      it('should get health records list', async () => {
        const response = await request(app)
          .get('/api/v1/health/records')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.records).toHaveLength(1);
        expect(response.body.data.records[0].id).toBe(testHealthRecord.id);
        expect(response.body.data.pagination.total).toBe(1);
      });

      it('should filter health records by cattle_id', async () => {
        const response = await request(app)
          .get(`/api/v1/health/records?cattle_id=${testCattle.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.records).toHaveLength(1);
        expect(response.body.data.records[0].cattle_id).toBe(testCattle.id);
      });

      it('should filter health records by status', async () => {
        const response = await request(app)
          .get('/api/v1/health/records?status=ongoing')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.records).toHaveLength(1);
        expect(response.body.data.records[0].status).toBe('ongoing');
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/v1/health/records?page=1&limit=10')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination.page).toBe(1);
        expect(response.body.data.pagination.limit).toBe(10);
      });
    });

    describe('PUT /api/v1/health/records/:id', () => {
      beforeEach(async () => {
        testHealthRecord = await HealthRecord.create({
          cattle_id: testCattle.id,
          symptoms: '原始症状',
          diagnosis: '原始诊断',
          veterinarian_id: testUser.id,
          diagnosis_date: new Date('2024-01-15'),
          status: 'ongoing'
        });
      });

      it('should update health record', async () => {
        const updateData = {
          symptoms: '更新后的症状',
          diagnosis: '更新后的诊断',
          treatment: '更新后的治疗方案',
          status: 'completed'
        };

        const response = await request(app)
          .put(`/api/v1/health/records/${testHealthRecord.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.symptoms).toBe(updateData.symptoms);
        expect(response.body.data.diagnosis).toBe(updateData.diagnosis);
        expect(response.body.data.treatment).toBe(updateData.treatment);
        expect(response.body.data.status).toBe('completed');
      });

      it('should return 404 for non-existent record', async () => {
        const response = await request(app)
          .put('/api/v1/health/records/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ symptoms: '测试' })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('健康记录不存在');
      });
    });

    describe('DELETE /api/v1/health/records/:id', () => {
      beforeEach(async () => {
        testHealthRecord = await HealthRecord.create({
          cattle_id: testCattle.id,
          symptoms: '测试症状',
          veterinarian_id: testUser.id,
          diagnosis_date: new Date('2024-01-15'),
          status: 'ongoing'
        });
      });

      it('should delete health record', async () => {
        const response = await request(app)
          .delete(`/api/v1/health/records/${testHealthRecord.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('删除成功');

        // 验证记录已被删除
        const deletedRecord = await HealthRecord.findByPk(testHealthRecord.id);
        expect(deletedRecord).toBeNull();
      });

      it('should return 404 for non-existent record', async () => {
        const response = await request(app)
          .delete('/api/v1/health/records/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('健康记录不存在');
      });
    });
  });

  describe('Vaccination Records API', () => {
    describe('POST /api/v1/health/vaccinations', () => {
      it('should create a new vaccination record', async () => {
        const vaccinationData = {
          cattle_id: testCattle.id,
          vaccine_name: '口蹄疫疫苗',
          vaccination_date: '2024-01-15',
          next_due_date: '2024-07-15',
          veterinarian_id: testUser.id,
          batch_number: 'BATCH001'
        };

        const response = await request(app)
          .post('/api/v1/health/vaccinations')
          .set('Authorization', `Bearer ${authToken}`)
          .send(vaccinationData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.cattle_id).toBe(testCattle.id);
        expect(response.body.data.vaccine_name).toBe(vaccinationData.vaccine_name);
        expect(response.body.data.batch_number).toBe(vaccinationData.batch_number);
      });

      it('should return 400 for missing required fields', async () => {
        const vaccinationData = {
          cattle_id: testCattle.id
          // 缺少 vaccine_name 和 vaccination_date
        };

        const response = await request(app)
          .post('/api/v1/health/vaccinations')
          .set('Authorization', `Bearer ${authToken}`)
          .send(vaccinationData)
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/v1/health/vaccinations', () => {
      beforeEach(async () => {
        testVaccinationRecord = await VaccinationRecord.create({
          cattle_id: testCattle.id,
          vaccine_name: '口蹄疫疫苗',
          vaccination_date: new Date('2024-01-15'),
          next_due_date: new Date('2024-07-15'),
          veterinarian_id: testUser.id,
          batch_number: 'BATCH001'
        });
      });

      it('should get vaccination records list', async () => {
        const response = await request(app)
          .get('/api/v1/health/vaccinations')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.records).toHaveLength(1);
        expect(response.body.data.records[0].id).toBe(testVaccinationRecord.id);
      });

      it('should filter by vaccine name', async () => {
        const response = await request(app)
          .get('/api/v1/health/vaccinations?vaccine_name=口蹄疫')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.records).toHaveLength(1);
        expect(response.body.data.records[0].vaccine_name).toContain('口蹄疫');
      });

      it('should filter due soon vaccinations', async () => {
        // 创建一个即将到期的疫苗记录
        const dueSoonDate = new Date();
        dueSoonDate.setDate(dueSoonDate.getDate() + 15);
        
        await VaccinationRecord.create({
          cattle_id: testCattle.id,
          vaccine_name: '即将到期疫苗',
          vaccination_date: new Date('2024-01-01'),
          next_due_date: dueSoonDate,
          veterinarian_id: testUser.id
        });

        const response = await request(app)
          .get('/api/v1/health/vaccinations?due_soon=true')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.records.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Health Statistics API', () => {
    beforeEach(async () => {
      // 创建测试数据
      await HealthRecord.create({
        cattle_id: testCattle.id,
        symptoms: '发烧',
        diagnosis: '感冒',
        veterinarian_id: testUser.id,
        diagnosis_date: new Date('2024-01-15'),
        status: 'ongoing'
      });

      await VaccinationRecord.create({
        cattle_id: testCattle.id,
        vaccine_name: '口蹄疫疫苗',
        vaccination_date: new Date('2024-01-10'),
        veterinarian_id: testUser.id
      });
    });

    describe('GET /api/v1/health/statistics', () => {
      it('should get health statistics', async () => {
        const response = await request(app)
          .get('/api/v1/health/statistics')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('healthStatus');
        expect(response.body.data).toHaveProperty('diseaseTypes');
        expect(response.body.data).toHaveProperty('vaccinations');
        expect(response.body.data).toHaveProperty('dueSoonVaccinations');
        expect(response.body.data).toHaveProperty('healthTrend');
      });

      it('should filter statistics by base_id', async () => {
        const response = await request(app)
          .get(`/api/v1/health/statistics?base_id=${testBase.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('healthStatus');
      });

      it('should filter statistics by date range', async () => {
        const response = await request(app)
          .get('/api/v1/health/statistics?start_date=2024-01-01&end_date=2024-12-31')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('diseaseTypes');
      });
    });
  });

  describe('Cattle Health Profile API', () => {
    beforeEach(async () => {
      // 创建健康记录和疫苗记录
      await HealthRecord.create({
        cattle_id: testCattle.id,
        symptoms: '咳嗽',
        diagnosis: '呼吸道感染',
        treatment: '抗生素治疗',
        veterinarian_id: testUser.id,
        diagnosis_date: new Date('2024-01-15'),
        status: 'completed'
      });

      await VaccinationRecord.create({
        cattle_id: testCattle.id,
        vaccine_name: '口蹄疫疫苗',
        vaccination_date: new Date('2024-01-10'),
        next_due_date: new Date('2024-07-10'),
        veterinarian_id: testUser.id,
        batch_number: 'BATCH001'
      });
    });

    describe('GET /api/v1/health/cattle/:cattle_id/profile', () => {
      it('should get cattle health profile', async () => {
        const response = await request(app)
          .get(`/api/v1/health/cattle/${testCattle.id}/profile`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('cattle');
        expect(response.body.data).toHaveProperty('healthRecords');
        expect(response.body.data).toHaveProperty('vaccinationRecords');
        
        expect(response.body.data.cattle.id).toBe(testCattle.id);
        expect(response.body.data.healthRecords).toHaveLength(1);
        expect(response.body.data.vaccinationRecords).toHaveLength(1);
      });

      it('should return 404 for non-existent cattle', async () => {
        const response = await request(app)
          .get('/api/v1/health/cattle/99999/profile')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toContain('牛只不存在');
      });
    });
  });
});