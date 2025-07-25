import axios from 'axios';
import { TEST_CONFIG, createTestUser, loginTestUser, retry } from '../setup';

describe('Performance and Load Testing', () => {
  let testUser: any;
  let authToken: string;
  let testCattleIds: number[] = [];

  beforeAll(async () => {
    testUser = await createTestUser({
      username: 'perf_test_user',
      email: 'perf@test.com',
      role: 'admin',
    });

    const loginResponse = await loginTestUser({
      username: testUser.data.username,
      password: 'TestPassword123!',
    });
    authToken = loginResponse.data.token;

    // Create test data for performance tests
    await createTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  describe('API Response Time Performance', () => {
    test('GET /api/cattle should respond within acceptable time limits', async () => {
      const iterations = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await axios.get(
          `${TEST_CONFIG.backend.baseURL}/api/cattle?page=1&limit=20`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      }

      // Calculate performance metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`📊 GET /api/cattle Performance:
        Average: ${avgResponseTime.toFixed(2)}ms
        Min: ${minResponseTime}ms
        Max: ${maxResponseTime}ms`);

      // Performance assertions
      expect(avgResponseTime).toBeLessThan(1000); // Average should be under 1 second
      expect(maxResponseTime).toBeLessThan(2000); // Max should be under 2 seconds
    });

    test('POST /api/cattle should handle creation efficiently', async () => {
      const iterations = 5;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const cattleData = {
          earTag: `PERF_CREATE_${Date.now()}_${i}`,
          breed: 'Performance Test Breed',
          gender: i % 2 === 0 ? 'male' : 'female',
          birthDate: '2023-01-01',
          weight: 400 + i * 10,
          healthStatus: 'healthy',
        };

        const startTime = Date.now();
        
        const response = await axios.post(
          `${TEST_CONFIG.backend.baseURL}/api/cattle`,
          cattleData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(201);
        testCattleIds.push(response.data.data.id);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      console.log(`📊 POST /api/cattle Performance:
        Average: ${avgResponseTime.toFixed(2)}ms
        Max: ${maxResponseTime}ms`);

      expect(avgResponseTime).toBeLessThan(1500); // Average should be under 1.5 seconds
      expect(maxResponseTime).toBeLessThan(3000); // Max should be under 3 seconds
    });

    test('Authentication endpoints should be fast', async () => {
      const iterations = 10;
      const loginTimes: number[] = [];
      const profileTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Test login performance
        const loginStartTime = Date.now();
        const loginResponse = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/login`, {
          username: testUser.data.username,
          password: 'TestPassword123!',
        });
        const loginEndTime = Date.now();
        loginTimes.push(loginEndTime - loginStartTime);

        expect(loginResponse.status).toBe(200);
        const token = loginResponse.data.data.token;

        // Test profile retrieval performance
        const profileStartTime = Date.now();
        const profileResponse = await axios.get(
          `${TEST_CONFIG.backend.baseURL}/api/auth/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const profileEndTime = Date.now();
        profileTimes.push(profileEndTime - profileStartTime);

        expect(profileResponse.status).toBe(200);
      }

      const avgLoginTime = loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length;
      const avgProfileTime = profileTimes.reduce((a, b) => a + b, 0) / profileTimes.length;

      console.log(`📊 Authentication Performance:
        Login Average: ${avgLoginTime.toFixed(2)}ms
        Profile Average: ${avgProfileTime.toFixed(2)}ms`);

      expect(avgLoginTime).toBeLessThan(800); // Login should be under 800ms
      expect(avgProfileTime).toBeLessThan(500); // Profile should be under 500ms
    });
  });

  describe('Concurrent Request Handling', () => {
    test('should handle multiple concurrent GET requests', async () => {
      const concurrentRequests = 20;
      const requests: Promise<any>[] = [];

      const startTime = Date.now();

      // Create concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          axios.get(
            `${TEST_CONFIG.backend.baseURL}/api/cattle?page=${Math.floor(i / 5) + 1}&limit=10`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          )
        );
      }

      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      console.log(`📊 Concurrent GET Performance:
        ${concurrentRequests} requests completed in ${totalTime}ms
        Average per request: ${(totalTime / concurrentRequests).toFixed(2)}ms`);

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(10000); // All requests should complete within 10 seconds
      expect(totalTime / concurrentRequests).toBeLessThan(1000); // Average per request under 1 second
    });

    test('should handle mixed concurrent operations', async () => {
      const operations: Promise<any>[] = [];
      const startTime = Date.now();

      // Mix of different operations
      for (let i = 0; i < 15; i++) {
        if (i % 3 === 0) {
          // GET requests
          operations.push(
            axios.get(
              `${TEST_CONFIG.backend.baseURL}/api/cattle?page=1&limit=10`,
              { headers: { Authorization: `Bearer ${authToken}` } }
            )
          );
        } else if (i % 3 === 1) {
          // POST requests
          operations.push(
            axios.post(
              `${TEST_CONFIG.backend.baseURL}/api/cattle`,
              {
                earTag: `CONCURRENT_${Date.now()}_${i}`,
                breed: 'Concurrent Test',
                gender: 'male',
                birthDate: '2023-01-01',
                weight: 450,
                healthStatus: 'healthy',
              },
              { headers: { Authorization: `Bearer ${authToken}` } }
            )
          );
        } else {
          // Health check requests
          operations.push(
            axios.get(`${TEST_CONFIG.backend.baseURL}/api/health`)
          );
        }
      }

      const responses = await Promise.all(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all operations succeeded
      responses.forEach((response, index) => {
        expect([200, 201]).toContain(response.status);
      });

      console.log(`📊 Mixed Concurrent Operations:
        15 mixed operations completed in ${totalTime}ms
        Average per operation: ${(totalTime / 15).toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(15000); // Should complete within 15 seconds
    });
  });

  describe('Database Performance', () => {
    test('should handle large dataset queries efficiently', async () => {
      // Test pagination with large datasets
      const pageSizes = [10, 50, 100];
      const results: any = {};

      for (const pageSize of pageSizes) {
        const startTime = Date.now();
        
        const response = await axios.get(
          `${TEST_CONFIG.backend.baseURL}/api/cattle?page=1&limit=${pageSize}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        expect(response.data.data.items.length).toBeLessThanOrEqual(pageSize);

        results[pageSize] = responseTime;
      }

      console.log(`📊 Pagination Performance:
        10 items: ${results[10]}ms
        50 items: ${results[50]}ms
        100 items: ${results[100]}ms`);

      // Larger page sizes should still be reasonable
      expect(results[100]).toBeLessThan(2000); // 100 items should load within 2 seconds
    });

    test('should handle complex filtering efficiently', async () => {
      const filters = [
        'breed=Test',
        'healthStatus=healthy',
        'gender=male',
        'breed=Test&healthStatus=healthy',
        'breed=Test&healthStatus=healthy&gender=male',
      ];

      const filterTimes: number[] = [];

      for (const filter of filters) {
        const startTime = Date.now();
        
        const response = await axios.get(
          `${TEST_CONFIG.backend.baseURL}/api/cattle?${filter}&page=1&limit=20`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        filterTimes.push(responseTime);

        expect(response.status).toBe(200);
      }

      const avgFilterTime = filterTimes.reduce((a, b) => a + b, 0) / filterTimes.length;
      const maxFilterTime = Math.max(...filterTimes);

      console.log(`📊 Filtering Performance:
        Average: ${avgFilterTime.toFixed(2)}ms
        Max: ${maxFilterTime}ms`);

      expect(avgFilterTime).toBeLessThan(1000); // Average filter time under 1 second
      expect(maxFilterTime).toBeLessThan(2000); // Max filter time under 2 seconds
    });
  });

  describe('Memory and Resource Usage', () => {
    test('should not have memory leaks during repeated operations', async () => {
      const iterations = 50;
      const memoryUsage: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Perform various operations
        await axios.get(
          `${TEST_CONFIG.backend.baseURL}/api/cattle?page=1&limit=10`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (i % 10 === 0) {
          // Check memory usage periodically
          const healthResponse = await axios.get(`${TEST_CONFIG.backend.baseURL}/api/health`);
          if (healthResponse.data.services?.system?.memory) {
            memoryUsage.push(healthResponse.data.services.system.memory.used);
          }
        }
      }

      if (memoryUsage.length > 1) {
        const initialMemory = memoryUsage[0];
        const finalMemory = memoryUsage[memoryUsage.length - 1];
        const memoryIncrease = finalMemory - initialMemory;

        console.log(`📊 Memory Usage:
          Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB
          Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB
          Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

        // Memory increase should be reasonable (less than 100MB for 50 operations)
        expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      }
    });
  });

  describe('Error Handling Performance', () => {
    test('should handle error responses quickly', async () => {
      const errorTests = [
        { url: '/api/cattle/99999', expectedStatus: 404 },
        { url: '/api/cattle', method: 'POST', data: {}, expectedStatus: 400 },
        { url: '/api/cattle', method: 'GET', noAuth: true, expectedStatus: 401 },
      ];

      const errorTimes: number[] = [];

      for (const test of errorTests) {
        const startTime = Date.now();
        
        try {
          const config: any = {
            validateStatus: () => true,
          };

          if (!test.noAuth) {
            config.headers = { Authorization: `Bearer ${authToken}` };
          }

          let response;
          if (test.method === 'POST') {
            response = await axios.post(
              `${TEST_CONFIG.backend.baseURL}${test.url}`,
              test.data,
              config
            );
          } else {
            response = await axios.get(
              `${TEST_CONFIG.backend.baseURL}${test.url}`,
              config
            );
          }

          const endTime = Date.now();
          errorTimes.push(endTime - startTime);

          expect(response.status).toBe(test.expectedStatus);
        } catch (error) {
          const endTime = Date.now();
          errorTimes.push(endTime - startTime);
        }
      }

      const avgErrorTime = errorTimes.reduce((a, b) => a + b, 0) / errorTimes.length;
      const maxErrorTime = Math.max(...errorTimes);

      console.log(`📊 Error Response Performance:
        Average: ${avgErrorTime.toFixed(2)}ms
        Max: ${maxErrorTime}ms`);

      // Error responses should be fast
      expect(avgErrorTime).toBeLessThan(500); // Average error response under 500ms
      expect(maxErrorTime).toBeLessThan(1000); // Max error response under 1 second
    });
  });

  // Helper functions
  async function createTestData() {
    console.log('🔧 Creating test data for performance tests...');
    
    const testCattlePromises = [];
    for (let i = 0; i < 20; i++) {
      testCattlePromises.push(
        axios.post(
          `${TEST_CONFIG.backend.baseURL}/api/cattle`,
          {
            earTag: `PERF_DATA_${i.toString().padStart(3, '0')}`,
            breed: `Test Breed ${i % 5}`,
            gender: i % 2 === 0 ? 'male' : 'female',
            birthDate: '2023-01-01',
            weight: 400 + i * 5,
            healthStatus: ['healthy', 'good', 'excellent'][i % 3],
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
      );
    }

    const responses = await Promise.all(testCattlePromises);
    testCattleIds.push(...responses.map(r => r.data.data.id));
    
    console.log(`✅ Created ${testCattleIds.length} test cattle records`);
  }

  async function cleanupTestData() {
    console.log('🧹 Cleaning up performance test data...');
    
    const deletePromises = testCattleIds.map(id =>
      axios.delete(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/${id}`,
        { 
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true, // Don't throw on 404s
        }
      )
    );

    await Promise.all(deletePromises);
    console.log(`✅ Cleaned up ${testCattleIds.length} test records`);
  }
});