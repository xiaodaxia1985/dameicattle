import { HealthAlertService } from '@/services/HealthAlertService';
import { SecurityService } from '@/services/SecurityService';
import { PerformanceOptimizationService } from '@/services/PerformanceOptimizationService';
import { CacheService } from '@/services/CacheService';
import { DataIntegrationService } from '@/services/DataIntegrationService';
import { DataConsistencyService } from '@/services/DataConsistencyService';
import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';
import { 
  createTestUser, 
  createTestBase, 
  createTestCattle, 
  createTestBarn,
  cleanupTestData,
  TestDataFactory,
  expectAsyncError
} from '../helpers/testHelpers';
import { HealthRecord, VaccinationRecord, Cattle, Base } from '@/models';

describe('Services Unit Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await cleanupTestData();
    CacheService.resetStats();
  });

  afterAll(async () => {
    await cleanupTestData();
    await sequelize.close();
    await redisClient.quit();
  });

  describe('HealthAlertService', () => {
    let testBase: any;
    let testBarn: any;
    let testCattle: any;

    beforeEach(async () => {
      testBase = await createTestBase();
      testBarn = await createTestBarn({ base_id: testBase.id });
      testCattle = await createTestCattle({ 
        base_id: testBase.id, 
        barn_id: testBarn.id 
      });
    });

    describe('detectHealthAnomalies', () => {
      it('should detect long-term sick cattle', async () => {
        // 创建一个30天前的健康记录
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 35);

        await HealthRecord.create({
          cattle_id: testCattle.id,
          symptoms: '发烧',
          diagnosis: '感冒',
          treatment: '药物治疗',
          veterinarian_id: 1,
          diagnosis_date: oldDate,
          status: 'ongoing'
        });

        const alerts = await HealthAlertService.detectHealthAnomalies(testBase.id);

        expect(alerts.length).toBeGreaterThan(0);
        const longTermAlert = alerts.find(alert => alert.type === 'health_anomaly');
        expect(longTermAlert).toBeTruthy();
        expect(longTermAlert?.severity).toBe('high');
        expect(longTermAlert?.title).toContain('长期患病预警');
      });

      it('should detect cattle without health records but marked as sick', async () => {
        // 更新牛只状态为sick但不创建健康记录
        await testCattle.update({ health_status: 'sick' });

        const alerts = await HealthAlertService.detectHealthAnomalies(testBase.id);

        expect(alerts.length).toBeGreaterThan(0);
        const missingRecordAlert = alerts.find(alert => 
          alert.type === 'health_anomaly' && alert.title.includes('缺少诊疗记录')
        );
        expect(missingRecordAlert).toBeTruthy();
        expect(missingRecordAlert?.severity).toBe('medium');
      });

      it('should detect potential outbreak', async () => {
        // 创建多头牛只
        const cattle = [];
        for (let i = 0; i < 5; i++) {
          const newCattle = await createTestCattle({
            ear_tag: `TEST${i + 100}`,
            base_id: testBase.id,
            barn_id: testBarn.id
          });
          cattle.push(newCattle);

          // 为每头牛创建最近的健康记录
          await HealthRecord.create({
            cattle_id: newCattle.id,
            symptoms: '发烧',
            diagnosis: '感冒',
            treatment: '药物治疗',
            veterinarian_id: 1,
            diagnosis_date: new Date(),
            status: 'ongoing'
          });
        }

        const alerts = await HealthAlertService.detectHealthAnomalies(testBase.id);

        expect(alerts.length).toBeGreaterThan(0);
        const outbreakAlert = alerts.find(alert => alert.type === 'critical_health');
        expect(outbreakAlert).toBeTruthy();
        expect(outbreakAlert?.severity).toBe('critical');
        expect(outbreakAlert?.title).toContain('疑似疫情预警');
      });
    });

    describe('detectVaccineDueAlerts', () => {
      it('should detect vaccines due soon', async () => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // 7天后到期

        await VaccinationRecord.create({
          cattle_id: testCattle.id,
          vaccine_name: '口蹄疫疫苗',
          vaccination_date: new Date(),
          next_due_date: dueDate,
          veterinarian_id: 1,
          batch_number: 'BATCH001'
        });

        const alerts = await HealthAlertService.detectVaccineDueAlerts(testBase.id);

        expect(alerts.length).toBeGreaterThan(0);
        const dueAlert = alerts.find(alert => alert.type === 'vaccine_due');
        expect(dueAlert).toBeTruthy();
        expect(dueAlert?.severity).toBe('high');
        expect(dueAlert?.title).toContain('疫苗接种提醒');
      });

      it('should detect overdue vaccines', async () => {
        const overdueDate = new Date();
        overdueDate.setDate(overdueDate.getDate() - 7); // 7天前过期

        await VaccinationRecord.create({
          cattle_id: testCattle.id,
          vaccine_name: '口蹄疫疫苗',
          vaccination_date: new Date(),
          next_due_date: overdueDate,
          veterinarian_id: 1,
          batch_number: 'BATCH001'
        });

        const alerts = await HealthAlertService.detectVaccineDueAlerts(testBase.id);

        expect(alerts.length).toBeGreaterThan(0);
        const overdueAlert = alerts.find(alert => 
          alert.type === 'vaccine_due' && alert.title.includes('过期')
        );
        expect(overdueAlert).toBeTruthy();
        expect(overdueAlert?.severity).toBe('critical');
      });
    });

    describe('analyzeHealthTrend', () => {
      it('should analyze health trends over time', async () => {
        // 创建一些健康状态不同的牛只
        await createTestCattle({
          ear_tag: 'HEALTHY001',
          health_status: 'healthy',
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        await createTestCattle({
          ear_tag: 'SICK001',
          health_status: 'sick',
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const trends = await HealthAlertService.analyzeHealthTrend(testBase.id, 7);

        expect(Array.isArray(trends)).toBe(true);
        expect(trends.length).toBeGreaterThan(0);
        
        trends.forEach(trend => {
          expect(trend).toHaveProperty('period');
          expect(trend).toHaveProperty('healthy_count');
          expect(trend).toHaveProperty('sick_count');
          expect(trend).toHaveProperty('treatment_count');
          expect(trend).toHaveProperty('trend_direction');
          expect(trend).toHaveProperty('change_percentage');
        });
      });
    });

    describe('getAllHealthAlerts', () => {
      it('should get all health alerts sorted by severity', async () => {
        // 创建不同严重程度的健康问题
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 35);

        await HealthRecord.create({
          cattle_id: testCattle.id,
          symptoms: '发烧',
          diagnosis: '感冒',
          treatment: '药物治疗',
          veterinarian_id: 1,
          diagnosis_date: oldDate,
          status: 'ongoing'
        });

        const overdueDate = new Date();
        overdueDate.setDate(overdueDate.getDate() - 7);

        await VaccinationRecord.create({
          cattle_id: testCattle.id,
          vaccine_name: '口蹄疫疫苗',
          vaccination_date: new Date(),
          next_due_date: overdueDate,
          veterinarian_id: 1,
          batch_number: 'BATCH001'
        });

        const alerts = await HealthAlertService.getAllHealthAlerts(testBase.id);

        expect(Array.isArray(alerts)).toBe(true);
        expect(alerts.length).toBeGreaterThan(0);

        // 验证按严重程度排序
        const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        for (let i = 1; i < alerts.length; i++) {
          const currentSeverity = severityOrder[alerts[i].severity];
          const previousSeverity = severityOrder[alerts[i - 1].severity];
          expect(currentSeverity).toBeGreaterThanOrEqual(previousSeverity);
        }
      });
    });
  });

  describe('SecurityService', () => {
    beforeEach(() => {
      SecurityService.initialize();
    });

    describe('password validation', () => {
      it('should validate strong passwords correctly', () => {
        const strongPasswords = [
          'StrongP@ssw0rd123',
          'MySecure#Pass1',
          'Complex$Password9'
        ];

        strongPasswords.forEach(password => {
          const result = SecurityService.validatePasswordStrength(password);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
          expect(result.score).toBeGreaterThan(80);
        });
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          '123',
          'password',
          'abc123',
          'PASSWORD',
          'Pass123'
        ];

        weakPasswords.forEach(password => {
          const result = SecurityService.validatePasswordStrength(password);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.score).toBeLessThan(100);
        });
      });

      it('should provide specific error messages', () => {
        const result = SecurityService.validatePasswordStrength('abc');
        
        expect(result.errors).toContain('密码长度至少需要8位');
        expect(result.errors).toContain('密码必须包含大写字母');
        expect(result.errors).toContain('密码必须包含数字');
        expect(result.errors).toContain('密码必须包含特殊字符');
      });
    });

    describe('password hashing', () => {
      it('should hash passwords securely', async () => {
        const password = 'TestPassword123!';
        const hash = await SecurityService.hashPassword(password);

        expect(hash).toBeTruthy();
        expect(hash).not.toBe(password);
        expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long
      });

      it('should verify passwords correctly', async () => {
        const password = 'TestPassword123!';
        const hash = await SecurityService.hashPassword(password);

        const isValid = await SecurityService.verifyPassword(password, hash);
        expect(isValid).toBe(true);

        const isInvalid = await SecurityService.verifyPassword('WrongPassword', hash);
        expect(isInvalid).toBe(false);
      });
    });

    describe('token generation', () => {
      it('should generate secure random tokens', () => {
        const token1 = SecurityService.generateSecureToken();
        const token2 = SecurityService.generateSecureToken();

        expect(token1).toBeTruthy();
        expect(token2).toBeTruthy();
        expect(token1).not.toBe(token2);
        expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
      });

      it('should generate tokens of specified length', () => {
        const lengths = [8, 16, 32, 64];
        
        lengths.forEach(length => {
          const token = SecurityService.generateSecureToken(length);
          expect(token.length).toBe(length * 2); // hex encoding
        });
      });
    });

    describe('data encryption', () => {
      it('should encrypt and decrypt data correctly', () => {
        const originalData = 'Sensitive information';
        
        const encrypted = SecurityService.encryptSensitiveData(originalData);
        expect(encrypted).toBeTruthy();
        expect(encrypted).not.toBe(originalData);

        const decrypted = SecurityService.decryptSensitiveData(encrypted);
        expect(decrypted).toBe(originalData);
      });

      it('should use custom encryption keys', () => {
        const data = 'Test data';
        const key1 = 'key1';
        const key2 = 'key2';

        const encrypted1 = SecurityService.encryptSensitiveData(data, key1);
        const encrypted2 = SecurityService.encryptSensitiveData(data, key2);

        expect(encrypted1).not.toBe(encrypted2);

        const decrypted1 = SecurityService.decryptSensitiveData(encrypted1, key1);
        const decrypted2 = SecurityService.decryptSensitiveData(encrypted2, key2);

        expect(decrypted1).toBe(data);
        expect(decrypted2).toBe(data);
      });
    });

    describe('IP address management', () => {
      it('should handle IP whitelist correctly', () => {
        const policy = SecurityService.getSecurityPolicy();
        policy.access_policy.ip_whitelist = ['192.168.1.1', '10.0.0.1'];
        SecurityService.updateSecurityPolicy(policy);

        expect(SecurityService.isIpAllowed('192.168.1.1')).toBe(true);
        expect(SecurityService.isIpAllowed('10.0.0.1')).toBe(true);
        expect(SecurityService.isIpAllowed('172.16.0.1')).toBe(false);
      });

      it('should handle IP blacklist correctly', () => {
        const policy = SecurityService.getSecurityPolicy();
        policy.access_policy.ip_whitelist = [];
        policy.access_policy.ip_blacklist = ['192.168.1.100'];
        SecurityService.updateSecurityPolicy(policy);

        expect(SecurityService.isIpAllowed('192.168.1.1')).toBe(true);
        expect(SecurityService.isIpAllowed('192.168.1.100')).toBe(false);
      });
    });

    describe('login attempt tracking', () => {
      const testIdentifier = 'test@example.com';

      it('should track failed login attempts', () => {
        expect(SecurityService.isLoginLocked(testIdentifier)).toBe(false);

        // 记录失败尝试
        for (let i = 0; i < 4; i++) {
          SecurityService.recordLoginAttempt(testIdentifier, false);
          expect(SecurityService.isLoginLocked(testIdentifier)).toBe(false);
        }

        // 第5次失败应该锁定
        SecurityService.recordLoginAttempt(testIdentifier, false);
        expect(SecurityService.isLoginLocked(testIdentifier)).toBe(true);
      });

      it('should clear attempts on successful login', () => {
        // 记录一些失败尝试
        for (let i = 0; i < 3; i++) {
          SecurityService.recordLoginAttempt(testIdentifier, false);
        }

        // 成功登录应该清除尝试记录
        SecurityService.recordLoginAttempt(testIdentifier, true);
        expect(SecurityService.isLoginLocked(testIdentifier)).toBe(false);
      });
    });

    describe('security policy management', () => {
      it('should get and update security policy', () => {
        const originalPolicy = SecurityService.getSecurityPolicy();
        expect(originalPolicy).toBeTruthy();

        const updates = {
          password_policy: {
            ...originalPolicy.password_policy,
            min_length: 12
          }
        };

        SecurityService.updateSecurityPolicy(updates);

        const updatedPolicy = SecurityService.getSecurityPolicy();
        expect(updatedPolicy.password_policy.min_length).toBe(12);
      });
    });
  });

  describe('CacheService', () => {
    beforeEach(async () => {
      await CacheService.flush('test');
      CacheService.resetStats();
    });

    describe('basic operations', () => {
      it('should set and get cache values', async () => {
        const key = 'test_key';
        const value = { id: 1, name: 'test' };

        await CacheService.set(key, value, { prefix: 'test' });
        const result = await CacheService.get(key, { prefix: 'test' });

        expect(result).toEqual(value);
      });

      it('should return null for non-existent keys', async () => {
        const result = await CacheService.get('non_existent', { prefix: 'test' });
        expect(result).toBeNull();
      });

      it('should handle different data types', async () => {
        const testCases = [
          { key: 'string', value: 'hello' },
          { key: 'number', value: 42 },
          { key: 'boolean', value: true },
          { key: 'array', value: [1, 2, 3] },
          { key: 'object', value: { nested: { data: 'test' } } }
        ];

        for (const testCase of testCases) {
          await CacheService.set(testCase.key, testCase.value, { prefix: 'test' });
          const result = await CacheService.get(testCase.key, { prefix: 'test' });
          expect(result).toEqual(testCase.value);
        }
      });
    });

    describe('TTL operations', () => {
      it('should respect TTL settings', async () => {
        const key = 'ttl_test';
        const value = 'test_value';

        await CacheService.set(key, value, { prefix: 'test', ttl: 1 });
        
        let result = await CacheService.get(key, { prefix: 'test' });
        expect(result).toBe(value);

        // 等待过期
        await new Promise(resolve => setTimeout(resolve, 1100));
        
        result = await CacheService.get(key, { prefix: 'test' });
        expect(result).toBeNull();
      });

      it('should get and set TTL', async () => {
        const key = 'ttl_test';
        
        await CacheService.set(key, 'value', { prefix: 'test', ttl: 60 });
        
        const ttl = await CacheService.ttl(key, 'test');
        expect(ttl).toBeGreaterThan(0);
        expect(ttl).toBeLessThanOrEqual(60);
      });
    });

    describe('batch operations', () => {
      it('should support batch get operations', async () => {
        const testData = [
          { key: 'batch1', value: { id: 1 } },
          { key: 'batch2', value: { id: 2 } },
          { key: 'batch3', value: { id: 3 } }
        ];

        // 设置测试数据
        for (const item of testData) {
          await CacheService.set(item.key, item.value, { prefix: 'test' });
        }

        // 批量获取
        const keys = testData.map(item => item.key);
        const results = await CacheService.mget(keys, { prefix: 'test' });

        expect(results).toHaveLength(3);
        expect(results[0]).toEqual({ id: 1 });
        expect(results[1]).toEqual({ id: 2 });
        expect(results[2]).toEqual({ id: 3 });
      });

      it('should support batch set operations', async () => {
        const keyValuePairs = [
          { key: 'mset1', value: { id: 1 } },
          { key: 'mset2', value: { id: 2 } }
        ];

        await CacheService.mset(keyValuePairs, { prefix: 'test' });

        for (const pair of keyValuePairs) {
          const result = await CacheService.get(pair.key, { prefix: 'test' });
          expect(result).toEqual(pair.value);
        }
      });
    });

    describe('distributed lock', () => {
      it('should acquire and release locks', async () => {
        const lockKey = 'test_lock';
        
        const lockValue = await CacheService.lock(lockKey, 30, 'test');
        expect(lockValue).toBeTruthy();

        // 尝试再次获取同一个锁应该失败
        const lockValue2 = await CacheService.lock(lockKey, 30, 'test');
        expect(lockValue2).toBeNull();

        // 释放锁
        const released = await CacheService.unlock(lockKey, lockValue!, 'test');
        expect(released).toBe(true);

        // 现在应该能够再次获取锁
        const lockValue3 = await CacheService.lock(lockKey, 30, 'test');
        expect(lockValue3).toBeTruthy();

        await CacheService.unlock(lockKey, lockValue3!, 'test');
      });
    });

    describe('statistics', () => {
      it('should track cache statistics', async () => {
        await CacheService.set('stats1', 'value1', { prefix: 'test' });
        await CacheService.set('stats2', 'value2', { prefix: 'test' });
        
        await CacheService.get('stats1', { prefix: 'test' }); // hit
        await CacheService.get('stats2', { prefix: 'test' }); // hit
        await CacheService.get('non_existent', { prefix: 'test' }); // miss

        const stats = await CacheService.getStats();

        expect(stats.sets).toBe(2);
        expect(stats.hits).toBe(2);
        expect(stats.misses).toBe(1);
        expect(stats.hit_rate).toBeCloseTo(66.67, 1);
      });
    });
  });

  describe('DataConsistencyService', () => {
    let testBase: any;
    let testBarn: any;

    beforeEach(async () => {
      testBase = await createTestBase();
      testBarn = await createTestBarn({ base_id: testBase.id });
    });

    describe('performFullConsistencyCheck', () => {
      it('should perform comprehensive consistency checks', async () => {
        const report = await DataConsistencyService.performFullConsistencyCheck();

        expect(report).toBeTruthy();
        expect(report.overall_status).toMatch(/healthy|warning|critical/);
        expect(report.total_checks).toBeGreaterThan(0);
        expect(Array.isArray(report.checks)).toBe(true);
        expect(report.generated_at).toBeInstanceOf(Date);
      });

      it('should detect duplicate ear tags', async () => {
        // 创建重复耳标的牛只
        await createTestCattle({
          ear_tag: 'DUPLICATE001',
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        await createTestCattle({
          ear_tag: 'DUPLICATE001',
          base_id: testBase.id,
          barn_id: testBarn.id
        });

        const report = await DataConsistencyService.performFullConsistencyCheck();
        
        const earTagCheck = report.checks.find(check => check.check_type === 'unique_ear_tag');
        expect(earTagCheck).toBeTruthy();
        expect(earTagCheck?.status).toBe('failed');
        expect(earTagCheck?.affected_records).toBeGreaterThan(0);
      });

      it('should detect barn-base inconsistencies', async () => {
        // 创建另一个基地
        const otherBase = await createTestBase({
          name: '其他基地',
          code: 'OTHER001'
        });

        // 创建牛只，但指定错误的基地和牛棚组合
        await createTestCattle({
          ear_tag: 'INCONSISTENT001',
          base_id: otherBase.id, // 不同的基地
          barn_id: testBarn.id    // 但使用第一个基地的牛棚
        });

        const report = await DataConsistencyService.performFullConsistencyCheck();
        
        const consistencyCheck = report.checks.find(check => 
          check.check_type === 'barn_base_consistency'
        );
        expect(consistencyCheck).toBeTruthy();
        expect(consistencyCheck?.status).toBe('failed');
      });
    });

    describe('getDataQualityScore', () => {
      it('should calculate data quality score', async () => {
        const scoreData = await DataConsistencyService.getDataQualityScore();

        expect(scoreData).toBeTruthy();
        expect(scoreData.score).toBeGreaterThanOrEqual(0);
        expect(scoreData.score).toBeLessThanOrEqual(100);
        expect(scoreData.details).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // 模拟数据库连接错误
      const originalQuery = sequelize.query;
      sequelize.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      await expectAsyncError(
        () => HealthAlertService.detectHealthAnomalies(),
        'Database connection failed'
      );

      // 恢复原始方法
      sequelize.query = originalQuery;
    });

    it('should handle Redis connection errors gracefully', async () => {
      // 模拟Redis连接错误
      const originalGet = redisClient.get;
      redisClient.get = jest.fn().mockRejectedValue(new Error('Redis connection failed'));

      // CacheService应该优雅地处理Redis错误
      const result = await CacheService.get('test_key', { prefix: 'test' });
      expect(result).toBeNull();

      // 恢复原始方法
      redisClient.get = originalGet;
    });

    it('should handle invalid input data', async () => {
      await expectAsyncError(
        async () => SecurityService.validatePasswordStrength(null as any),
        /Cannot read/
      );
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();

      // 创建大量测试数据
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          CacheService.set(`perf_test_${i}`, { id: i, data: 'test' }, { prefix: 'test' })
        );
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 应该在合理时间内完成
      expect(duration).toBeLessThan(5000); // 5秒内
    });

    it('should handle concurrent operations', async () => {
      const concurrentOperations = Array(50).fill(null).map((_, index) =>
        CacheService.set(`concurrent_${index}`, { id: index }, { prefix: 'test' })
      );

      // 所有操作都应该成功完成
      await expect(Promise.all(concurrentOperations)).resolves.toBeDefined();

      // 验证所有数据都被正确设置
      for (let i = 0; i < 50; i++) {
        const result = await CacheService.get(`concurrent_${i}`, { prefix: 'test' });
        expect(result).toEqual({ id: i });
      }
    });
  });
});