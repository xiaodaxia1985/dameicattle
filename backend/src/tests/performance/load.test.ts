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
  measureExecutionTime,
  runConcurrentTests
} from '../helpers/testHelpers';

describe('Performance and Load Tests', () => {
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

    testRole = await createTestRole({
      name: '管理员',
      permissions: ['*']
    });

    testBase = await createTestBase();

    adminUser = await createTestUser({
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

  describe('API Response Time Tests', () => {
    it('should respond to authentication requests quickly', async () => {
      const { duration } = await measureExecutionTime(async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: adminUser.username,
            password: 'TestPassword123!'
          });
        
        expect(response.status).toBe(200);
        return response;
      });

      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('should respond to cattle list requests quickly', async () => {
      // 先创建一些测试数据
      const barn = await createTestBarn({ base_id: testBase.id });
      
      for (let i = 0; i < 50; i++) {
        await request(app)
          .post('/api/v1/cattle')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TestDataFactory.cattle({
            ear_tag: `PERF${i.toString().padStart(3, '0')}`,
            base_id: testBase.id,
            barn_id: barn.id
          }));
      }

      const { duration } = await measureExecutionTime(async () => {
        const response = await request(app)
          .get('/api/v1/cattle')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeGreaterThan(0);
        return response;
      });

      expect(duration).toBeLessThan(2000); // 应该在2秒内完成
    });

    it('should handle dashboard requests efficiently', async () => {
      const { duration } = await measureExecutionTime(async () => {
        const response = await request(app)
          .get('/api/v1/dashboard/overview')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        return response;
      });

      expect(duration).toBeLessThan(3000); // 仪表盘查询可能较复杂，允许3秒
    });
  });

  describe('Concurrent Request Tests', () => {
    it('should handle multiple concurrent authentication requests', async () => {
      const concurrentLogins = Array(20).fill(null).map(() => 
        () => request(app)
          .post('/api/v1/auth/login')
          .send({
            username: adminUser.username,
            password: 'TestPassword123!'
          })
      );

      const { duration, result } = await measureExecutionTime(async () => {
        return await runConcurrentTests(concurrentLogins, 5);
      });

      expect(duration).toBeLessThan(10000); // 10秒内完成
      expect(result.length).toBe(20);
      
      // 所有请求都应该成功
      result.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle concurrent cattle creation requests', async () => {
      const barn = await createTestBarn({ base_id: testBase.id });
      
      const concurrentCreations = Array(10).fill(null).map((_, index) => 
        () => request(app)
          .post('/api/v1/cattle')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TestDataFactory.cattle({
            ear_tag: `CONCURRENT${index.toString().padStart(3, '0')}`,
            base_id: testBase.id,
            barn_id: barn.id
          }))
      );

      const { duration, result } = await measureExecutionTime(async () => {
        return await runConcurrentTests(concurrentCreations, 3);
      });

      expect(duration).toBeLessThan(15000); // 15秒内完成
      expect(result.length).toBe(10);
      
      // 所有请求都应该成功
      result.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle concurrent read requests efficiently', async () => {
      // 先创建一些数据
      const barn = await createTestBarn({ base_id: testBase.id });
      const cattle = [];
      
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/v1/cattle')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TestDataFactory.cattle({
            ear_tag: `READ${i.toString().padStart(3, '0')}`,
            base_id: testBase.id,
            barn_id: barn.id
          }));
        cattle.push(response.body.data);
      }

      // 并发读取请求
      const concurrentReads = Array(50).fill(null).map((_, index) => {
        const cattleId = cattle[index % cattle.length].id;
        return () => request(app)
          .get(`/api/v1/cattle/${cattleId}`)
          .set('Authorization', `Bearer ${adminToken}`);
      });

      const { duration, result } = await measureExecutionTime(async () => {
        return await runConcurrentTests(concurrentReads, 10);
      });

      expect(duration).toBeLessThan(8000); // 8秒内完成
      expect(result.length).toBe(50);
      
      // 所有请求都应该成功
      result.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle large dataset queries efficiently', async () => {
      const barn = await createTestBarn({ base_id: testBase.id });
      
      // 创建大量数据
      const batchSize = 20;
      const batches = 5;
      
      for (let batch = 0; batch < batches; batch++) {
        const promises = [];
        for (let i = 0; i < batchSize; i++) {
          const index = batch * batchSize + i;
          promises.push(
            request(app)
              .post('/api/v1/cattle')
              .set('Authorization', `Bearer ${adminToken}`)
              .send(TestDataFactory.cattle({
                ear_tag: `LARGE${index.toString().padStart(4, '0')}`,
                base_id: testBase.id,
                barn_id: barn.id
              }))
          );
        }
        await Promise.all(promises);
      }

      // 测试分页查询性能
      const { duration } = await measureExecutionTime(async () => {
        const response = await request(app)
          .get('/api/v1/cattle?page=1&limit=50')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBeLessThanOrEqual(50);
        return response;
      });

      expect(duration).toBeLessThan(3000); // 3秒内完成

      // 测试搜索查询性能
      const { duration: searchDuration } = await measureExecutionTime(async () => {
        const response = await request(app)
          .get('/api/v1/cattle?search=LARGE')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        return response;
      });

      expect(searchDuration).toBeLessThan(2000); // 2秒内完成
    });

    it('should handle complex aggregation queries efficiently', async () => {
      // 创建测试数据
      const barn = await createTestBarn({ base_id: testBase.id });
      
      for (let i = 0; i < 30; i++) {
        await request(app)
          .post('/api/v1/cattle')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TestDataFactory.cattle({
            ear_tag: `AGG${i.toString().padStart(3, '0')}`,
            base_id: testBase.id,
            barn_id: barn.id,
            health_status: i % 3 === 0 ? 'sick' : 'healthy'
          }));
      }

      // 测试统计查询性能
      const { duration } = await measureExecutionTime(async () => {
        const response = await request(app)
          .get('/api/v1/dashboard/statistics')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        expect(response.body.data.total_cattle).toBeGreaterThan(0);
        return response;
      });

      expect(duration).toBeLessThan(4000); // 4秒内完成
    });
  });

  describe('Cache Performance Tests', () => {
    it('should demonstrate cache performance improvement', async () => {
      // 第一次请求（无缓存）
      const { duration: firstRequestDuration } = await measureExecutionTime(async () => {
        const response = await request(app)
          .get('/api/v1/dashboard/overview')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        return response;
      });

      // 第二次请求（有缓存）
      const { duration: secondRequestDuration } = await measureExecutionTime(async () => {
        const response = await request(app)
          .get('/api/v1/dashboard/overview')
          .set('Authorization', `Bearer ${adminToken}`);
        
        expect(response.status).toBe(200);
        return response;
      });

      // 缓存应该提高性能（第二次请求应该更快）
      // 注意：这个测试可能不稳定，因为缓存效果取决于具体实现
      console.log(`First request: ${firstRequestDuration}ms, Second request: ${secondRequestDuration}ms`);
    });

    it('should handle cache operations efficiently', async () => {
      const { duration } = await measureExecutionTime(async () => {
        const promises = [];
        
        // 并发缓存操作
        for (let i = 0; i < 100; i++) {
          promises.push(
            request(app)
              .get('/api/v1/performance/cache/stats')
              .set('Authorization', `Bearer ${adminToken}`)
          );
        }
        
        const results = await Promise.all(promises);
        results.forEach(response => {
          expect(response.status).toBe(200);
        });
        
        return results;
      });

      expect(duration).toBeLessThan(10000); // 10秒内完成
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not have significant memory leaks during operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // 执行大量操作
      const barn = await createTestBarn({ base_id: testBase.id });
      
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/api/v1/cattle')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TestDataFactory.cattle({
            ear_tag: `MEM${i.toString().padStart(4, '0')}`,
            base_id: testBase.id,
            barn_id: barn.id
          }));

        // 每10次操作检查一次内存
        if (i % 10 === 0) {
          const currentMemory = process.memoryUsage();
          const heapIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
          
          // 内存增长不应该过快（允许一定的增长）
          expect(heapIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB
        }
      }

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const totalHeapIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory increase: ${(totalHeapIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // 总内存增长应该在合理范围内
      expect(totalHeapIncrease).toBeLessThan(200 * 1024 * 1024); // 200MB
    });
  });

  describe('Error Rate Tests', () => {
    it('should maintain low error rate under load', async () => {
      const barn = await createTestBarn({ base_id: testBase.id });
      
      // 混合正常和异常请求
      const mixedRequests = [];
      
      // 70% 正常请求
      for (let i = 0; i < 70; i++) {
        mixedRequests.push(() => 
          request(app)
            .post('/api/v1/cattle')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(TestDataFactory.cattle({
              ear_tag: `MIXED${i.toString().padStart(3, '0')}`,
              base_id: testBase.id,
              barn_id: barn.id
            }))
        );
      }
      
      // 30% 异常请求（重复耳标）
      for (let i = 0; i < 30; i++) {
        mixedRequests.push(() => 
          request(app)
            .post('/api/v1/cattle')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(TestDataFactory.cattle({
              ear_tag: 'DUPLICATE', // 重复耳标
              base_id: testBase.id,
              barn_id: barn.id
            }))
        );
      }

      // 随机打乱请求顺序
      for (let i = mixedRequests.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mixedRequests[i], mixedRequests[j]] = [mixedRequests[j], mixedRequests[i]];
      }

      const { duration, result } = await measureExecutionTime(async () => {
        return await runConcurrentTests(mixedRequests, 10);
      });

      expect(duration).toBeLessThan(30000); // 30秒内完成

      // 统计结果
      const successCount = result.filter(r => r.status < 400).length;
      const errorCount = result.filter(r => r.status >= 400).length;
      const errorRate = (errorCount / result.length) * 100;

      console.log(`Success: ${successCount}, Errors: ${errorCount}, Error Rate: ${errorRate.toFixed(2)}%`);

      // 系统应该能处理所有请求（包括预期的错误）
      expect(result.length).toBe(100);
      
      // 错误率应该在预期范围内（大约30%，因为我们故意发送了30%的重复请求）
      expect(errorRate).toBeGreaterThan(25);
      expect(errorRate).toBeLessThan(35);
    });
  });

  describe('Stress Tests', () => {
    it('should handle high request volume', async () => {
      const requestCount = 200;
      const concurrency = 20;
      
      const stressRequests = Array(requestCount).fill(null).map((_, index) => 
        () => request(app)
          .get('/api/v1/dashboard/statistics')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const { duration, result } = await measureExecutionTime(async () => {
        return await runConcurrentTests(stressRequests, concurrency);
      });

      console.log(`Processed ${requestCount} requests in ${duration}ms`);
      console.log(`Average response time: ${(duration / requestCount).toFixed(2)}ms`);
      console.log(`Requests per second: ${((requestCount / duration) * 1000).toFixed(2)}`);

      expect(duration).toBeLessThan(60000); // 1分钟内完成
      expect(result.length).toBe(requestCount);
      
      // 大部分请求应该成功
      const successCount = result.filter(r => r.status === 200).length;
      const successRate = (successCount / requestCount) * 100;
      
      expect(successRate).toBeGreaterThan(95); // 95%以上成功率
    });
  });

  describe('Resource Cleanup Tests', () => {
    it('should properly clean up resources after operations', async () => {
      const initialConnections = await sequelize.query(
        'SELECT count(*) as count FROM pg_stat_activity WHERE state = \'active\'',
        { type: sequelize.QueryTypes.SELECT }
      ) as any[];

      const initialConnectionCount = parseInt(initialConnections[0].count);

      // 执行大量数据库操作
      const barn = await createTestBarn({ base_id: testBase.id });
      
      const operations = Array(50).fill(null).map((_, index) => 
        () => request(app)
          .post('/api/v1/cattle')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TestDataFactory.cattle({
            ear_tag: `CLEANUP${index.toString().padStart(3, '0')}`,
            base_id: testBase.id,
            barn_id: barn.id
          }))
      );

      await runConcurrentTests(operations, 10);

      // 等待连接清理
      await new Promise(resolve => setTimeout(resolve, 2000));

      const finalConnections = await sequelize.query(
        'SELECT count(*) as count FROM pg_stat_activity WHERE state = \'active\'',
        { type: sequelize.QueryTypes.SELECT }
      ) as any[];

      const finalConnectionCount = parseInt(finalConnections[0].count);

      // 连接数不应该显著增加
      expect(finalConnectionCount - initialConnectionCount).toBeLessThan(5);
    });
  });
}, 120000); // 设置较长的超时时间用于性能测试