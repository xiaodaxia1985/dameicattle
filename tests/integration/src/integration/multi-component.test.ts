import axios from 'axios';
import { TEST_CONFIG, createTestUser, loginTestUser, createTestCattle, delay, retry } from '../setup';

describe('Multi-Component System Integration', () => {
  let testUser: any;
  let authToken: string;
  let testCattle: any;

  beforeAll(async () => {
    // Create test user for integration tests
    testUser = await createTestUser({
      username: 'integration_test_user',
      email: 'integration@test.com',
      role: 'admin',
    });

    // Login to get auth token
    const loginResponse = await loginTestUser({
      username: testUser.data.username,
      password: 'TestPassword123!',
    });
    authToken = loginResponse.data.token;
  });

  describe('Backend-Frontend Integration', () => {
    test('should handle complete cattle management workflow', async () => {
      // 1. Create cattle via backend API
      const cattleData = {
        earTag: `INT_TEST_${Date.now()}`,
        breed: 'Integration Test Breed',
        gender: 'female',
        birthDate: '2023-06-01',
        weight: 450,
        healthStatus: 'healthy',
      };

      const createResponse = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        cattleData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(createResponse.status).toBe(201);
      expect(createResponse.data.success).toBe(true);
      testCattle = createResponse.data.data;

      // 2. Verify cattle can be retrieved
      const getResponse = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/${testCattle.id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.data.earTag).toBe(cattleData.earTag);

      // 3. Update cattle information
      const updateData = { weight: 475, healthStatus: 'good' };
      const updateResponse = await axios.put(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/${testCattle.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.data.weight).toBe(475);

      // 4. Test pagination and filtering
      const listResponse = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle?page=1&limit=10&breed=${encodeURIComponent(cattleData.breed)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(listResponse.status).toBe(200);
      expect(listResponse.data.data).toHaveProperty('items');
      expect(listResponse.data.data).toHaveProperty('pagination');
      expect(listResponse.data.data.items.length).toBeGreaterThan(0);
    });

    test('should handle file upload workflow', async () => {
      // Create a test file buffer
      const testFileContent = Buffer.from('Test file content for integration testing');
      
      // Test file upload
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', testFileContent, {
        filename: 'test-integration.txt',
        contentType: 'text/plain',
      });

      const uploadResponse = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.data.success).toBe(true);
      expect(uploadResponse.data.data).toHaveProperty('filename');
      expect(uploadResponse.data.data).toHaveProperty('path');

      // Test file retrieval
      const fileUrl = uploadResponse.data.data.path;
      const fileResponse = await axios.get(`${TEST_CONFIG.backend.baseURL}${fileUrl}`);
      
      expect(fileResponse.status).toBe(200);
      expect(fileResponse.data).toBe('Test file content for integration testing');
    });

    test('should handle authentication flow across components', async () => {
      // 1. Test login
      const loginResponse = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/auth/login`,
        {
          username: testUser.data.username,
          password: 'TestPassword123!',
        }
      );

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data.data).toHaveProperty('token');
      expect(loginResponse.data.data).toHaveProperty('user');

      const token = loginResponse.data.data.token;

      // 2. Test protected route access
      const protectedResponse = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/auth/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      expect(protectedResponse.status).toBe(200);
      expect(protectedResponse.data.data.username).toBe(testUser.data.username);

      // 3. Test token refresh
      const refreshResponse = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.data.data).toHaveProperty('token');

      // 4. Test logout
      const logoutResponse = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      expect(logoutResponse.status).toBe(200);
    });
  });

  describe('Cross-Component Data Consistency', () => {
    test('should maintain data consistency across all components', async () => {
      // Create test data
      const cattleData = {
        earTag: `CONSISTENCY_${Date.now()}`,
        breed: 'Consistency Test',
        gender: 'male',
        birthDate: '2023-05-01',
        weight: 520,
        healthStatus: 'excellent',
      };

      // 1. Create via backend
      const createResponse = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        cattleData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const cattleId = createResponse.data.data.id;

      // 2. Verify data structure consistency
      const backendResponse = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/${cattleId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const backendData = backendResponse.data.data;

      // Verify standard response format
      expect(backendResponse.data).toHaveProperty('success');
      expect(backendResponse.data).toHaveProperty('data');
      expect(backendResponse.data).toHaveProperty('message');

      // Verify data structure
      expect(backendData).toHaveProperty('id');
      expect(backendData).toHaveProperty('earTag');
      expect(backendData).toHaveProperty('breed');
      expect(backendData).toHaveProperty('createdAt');
      expect(backendData).toHaveProperty('updatedAt');

      // 3. Test pagination consistency
      const paginatedResponse = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle?page=1&limit=5`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(paginatedResponse.data.data).toHaveProperty('items');
      expect(paginatedResponse.data.data).toHaveProperty('pagination');
      expect(paginatedResponse.data.data.pagination).toHaveProperty('total');
      expect(paginatedResponse.data.data.pagination).toHaveProperty('page');
      expect(paginatedResponse.data.data.pagination).toHaveProperty('limit');
      expect(paginatedResponse.data.data.pagination).toHaveProperty('totalPages');
    });

    test('should handle error responses consistently', async () => {
      // Test 404 error
      const notFoundResponse = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/99999`,
        { 
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true, // Don't throw on 4xx/5xx
        }
      );

      expect(notFoundResponse.status).toBe(404);
      expect(notFoundResponse.data).toHaveProperty('success', false);
      expect(notFoundResponse.data).toHaveProperty('message');
      expect(notFoundResponse.data).toHaveProperty('errors');

      // Test validation error
      const validationResponse = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        { earTag: '' }, // Invalid data
        { 
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true,
        }
      );

      expect(validationResponse.status).toBe(400);
      expect(validationResponse.data).toHaveProperty('success', false);
      expect(validationResponse.data).toHaveProperty('errors');
      expect(Array.isArray(validationResponse.data.errors)).toBe(true);

      // Test unauthorized error
      const unauthorizedResponse = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        { validateStatus: () => true }
      );

      expect(unauthorizedResponse.status).toBe(401);
      expect(unauthorizedResponse.data).toHaveProperty('success', false);
    });
  });

  describe('System Performance and Load', () => {
    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const requests = [];

      // Create multiple concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          axios.get(
            `${TEST_CONFIG.backend.baseURL}/api/cattle?page=1&limit=10`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          )
        );
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      });

      // Performance check - should complete within reasonable time
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // 10 seconds max

      console.log(`✅ ${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
    });

    test('should handle database connection resilience', async () => {
      // Test multiple database operations in sequence
      const operations = [];

      for (let i = 0; i < 5; i++) {
        operations.push(async () => {
          const cattleData = {
            earTag: `RESILIENCE_${Date.now()}_${i}`,
            breed: 'Resilience Test',
            gender: i % 2 === 0 ? 'male' : 'female',
            birthDate: '2023-04-01',
            weight: 400 + i * 10,
            healthStatus: 'healthy',
          };

          const response = await axios.post(
            `${TEST_CONFIG.backend.baseURL}/api/cattle`,
            cattleData,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );

          expect(response.status).toBe(201);
          return response.data.data;
        });
      }

      // Execute operations with retry logic
      const results = [];
      for (const operation of operations) {
        const result = await retry(operation, 3, 1000);
        results.push(result);
      }

      expect(results).toHaveLength(5);
      console.log(`✅ Database resilience test completed with ${results.length} successful operations`);
    });
  });

  describe('Health Monitoring Integration', () => {
    test('should provide comprehensive health status', async () => {
      const healthResponse = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/health`
      );

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.data).toHaveProperty('status');
      expect(healthResponse.data).toHaveProperty('timestamp');
      expect(healthResponse.data).toHaveProperty('services');

      // Check individual service health
      const services = healthResponse.data.services;
      expect(services).toHaveProperty('database');
      expect(services).toHaveProperty('redis');
      expect(services).toHaveProperty('fileSystem');

      // Each service should have status
      Object.values(services).forEach((service: any) => {
        expect(service).toHaveProperty('status');
        expect(['healthy', 'degraded', 'unhealthy']).toContain(service.status);
      });
    });

    test('should provide detailed monitoring metrics', async () => {
      const metricsResponse = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/monitoring/metrics`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.data.data).toHaveProperty('system');
      expect(metricsResponse.data.data).toHaveProperty('database');
      expect(metricsResponse.data.data).toHaveProperty('api');

      // System metrics
      const systemMetrics = metricsResponse.data.data.system;
      expect(systemMetrics).toHaveProperty('uptime');
      expect(systemMetrics).toHaveProperty('memory');
      expect(systemMetrics).toHaveProperty('cpu');

      // API metrics
      const apiMetrics = metricsResponse.data.data.api;
      expect(apiMetrics).toHaveProperty('requestCount');
      expect(apiMetrics).toHaveProperty('averageResponseTime');
      expect(apiMetrics).toHaveProperty('errorRate');
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testCattle) {
      try {
        await axios.delete(
          `${TEST_CONFIG.backend.baseURL}/api/cattle/${testCattle.id}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } catch (error) {
        console.warn('Failed to cleanup test cattle:', error.message);
      }
    }
  });
});