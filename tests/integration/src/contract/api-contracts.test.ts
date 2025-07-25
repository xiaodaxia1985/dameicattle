import axios from 'axios';
import { TEST_CONFIG, createTestUser, loginTestUser } from '../setup';

// API Contract schemas
const API_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['success', 'data', 'message'],
  properties: {
    success: { type: 'boolean' },
    data: { type: ['object', 'array', 'null'] },
    message: { type: 'string' },
    errors: { type: 'array' },
    meta: {
      type: 'object',
      properties: {
        timestamp: { type: 'string' },
        requestId: { type: 'string' },
        version: { type: 'string' },
      },
    },
  },
};

const PAGINATED_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['items', 'pagination'],
  properties: {
    items: { type: 'array' },
    pagination: {
      type: 'object',
      required: ['total', 'page', 'limit', 'totalPages'],
      properties: {
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  },
};

const CATTLE_SCHEMA = {
  type: 'object',
  required: ['id', 'earTag', 'breed', 'gender', 'birthDate', 'weight', 'healthStatus', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'number' },
    earTag: { type: 'string' },
    breed: { type: 'string' },
    gender: { type: 'string', enum: ['male', 'female'] },
    birthDate: { type: 'string', format: 'date' },
    weight: { type: 'number' },
    healthStatus: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const USER_SCHEMA = {
  type: 'object',
  required: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt'],
  properties: {
    id: { type: 'number' },
    username: { type: 'string' },
    email: { type: 'string', format: 'email' },
    role: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

describe('API Contract Testing', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    testUser = await createTestUser({
      username: 'contract_test_user',
      email: 'contract@test.com',
      role: 'admin',
    });

    const loginResponse = await loginTestUser({
      username: testUser.data.username,
      password: 'TestPassword123!',
    });
    authToken = loginResponse.data.token;
  });

  describe('Authentication API Contracts', () => {
    test('POST /api/auth/login should return valid contract', async () => {
      const response = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/login`, {
        username: testUser.data.username,
        password: 'TestPassword123!',
      });

      // Validate response structure
      expect(response.status).toBe(200);
      validateApiResponse(response.data);
      
      // Validate login-specific data
      expect(response.data.data).toHaveProperty('token');
      expect(response.data.data).toHaveProperty('user');
      expect(typeof response.data.data.token).toBe('string');
      validateSchema(response.data.data.user, USER_SCHEMA);
    });

    test('POST /api/auth/register should return valid contract', async () => {
      const newUser = {
        username: `contract_new_${Date.now()}`,
        email: `contract_new_${Date.now()}@test.com`,
        password: 'TestPassword123!',
        role: 'user',
      };

      const response = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/register`, newUser);

      expect(response.status).toBe(201);
      validateApiResponse(response.data);
      validateSchema(response.data.data, USER_SCHEMA);
    });

    test('GET /api/auth/profile should return valid contract', async () => {
      const response = await axios.get(`${TEST_CONFIG.backend.baseURL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      validateApiResponse(response.data);
      validateSchema(response.data.data, USER_SCHEMA);
    });

    test('POST /api/auth/refresh should return valid contract', async () => {
      const response = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      validateApiResponse(response.data);
      expect(response.data.data).toHaveProperty('token');
      expect(typeof response.data.data.token).toBe('string');
    });
  });

  describe('Cattle API Contracts', () => {
    let testCattle: any;

    test('POST /api/cattle should return valid contract', async () => {
      const cattleData = {
        earTag: `CONTRACT_${Date.now()}`,
        breed: 'Contract Test Breed',
        gender: 'male',
        birthDate: '2023-01-01',
        weight: 450,
        healthStatus: 'healthy',
      };

      const response = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        cattleData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(201);
      validateApiResponse(response.data);
      validateSchema(response.data.data, CATTLE_SCHEMA);
      
      testCattle = response.data.data;
    });

    test('GET /api/cattle should return valid paginated contract', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle?page=1&limit=10`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      validateApiResponse(response.data);
      validateSchema(response.data.data, PAGINATED_RESPONSE_SCHEMA);
      
      // Validate each cattle item
      response.data.data.items.forEach((cattle: any) => {
        validateSchema(cattle, CATTLE_SCHEMA);
      });
    });

    test('GET /api/cattle/:id should return valid contract', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/${testCattle.id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      validateApiResponse(response.data);
      validateSchema(response.data.data, CATTLE_SCHEMA);
    });

    test('PUT /api/cattle/:id should return valid contract', async () => {
      const updateData = { weight: 475, healthStatus: 'good' };
      
      const response = await axios.put(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/${testCattle.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      validateApiResponse(response.data);
      validateSchema(response.data.data, CATTLE_SCHEMA);
      expect(response.data.data.weight).toBe(475);
    });

    test('DELETE /api/cattle/:id should return valid contract', async () => {
      const response = await axios.delete(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/${testCattle.id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      validateApiResponse(response.data);
      expect(response.data.data).toBeNull();
    });
  });

  describe('Error Response Contracts', () => {
    test('404 errors should return valid contract', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/99999`,
        { 
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(404);
      validateApiResponse(response.data);
      expect(response.data.success).toBe(false);
      expect(response.data.data).toBeNull();
      expect(response.data.message).toContain('not found');
    });

    test('400 validation errors should return valid contract', async () => {
      const response = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        { earTag: '' }, // Invalid data
        { 
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true,
        }
      );

      expect(response.status).toBe(400);
      validateApiResponse(response.data);
      expect(response.data.success).toBe(false);
      expect(response.data.data).toBeNull();
      expect(Array.isArray(response.data.errors)).toBe(true);
      expect(response.data.errors.length).toBeGreaterThan(0);
    });

    test('401 unauthorized errors should return valid contract', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(401);
      validateApiResponse(response.data);
      expect(response.data.success).toBe(false);
      expect(response.data.data).toBeNull();
      expect(response.data.message).toContain('Unauthorized');
    });

    test('403 forbidden errors should return valid contract', async () => {
      // Create a user with limited permissions
      const limitedUser = await createTestUser({
        username: `limited_${Date.now()}`,
        email: `limited_${Date.now()}@test.com`,
        role: 'viewer', // Assuming viewer role has limited permissions
      });

      const limitedLogin = await loginTestUser({
        username: limitedUser.data.username,
        password: 'TestPassword123!',
      });

      const response = await axios.delete(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/1`,
        { 
          headers: { Authorization: `Bearer ${limitedLogin.data.token}` },
          validateStatus: () => true,
        }
      );

      // Should return 403 or 404 depending on implementation
      expect([403, 404]).toContain(response.status);
      validateApiResponse(response.data);
      expect(response.data.success).toBe(false);
    });
  });

  describe('Health Check Contracts', () => {
    test('GET /api/health should return valid contract', async () => {
      const response = await axios.get(`${TEST_CONFIG.backend.baseURL}/api/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('services');
      
      // Validate services structure
      const services = response.data.services;
      expect(services).toHaveProperty('database');
      expect(services).toHaveProperty('redis');
      expect(services).toHaveProperty('fileSystem');
      
      Object.values(services).forEach((service: any) => {
        expect(service).toHaveProperty('status');
        expect(['healthy', 'degraded', 'unhealthy']).toContain(service.status);
      });
    });
  });

  describe('File Upload Contracts', () => {
    test('POST /api/upload should return valid contract', async () => {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', Buffer.from('test content'), {
        filename: 'contract-test.txt',
        contentType: 'text/plain',
      });

      const response = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
      validateApiResponse(response.data);
      expect(response.data.data).toHaveProperty('filename');
      expect(response.data.data).toHaveProperty('path');
      expect(response.data.data).toHaveProperty('size');
      expect(response.data.data).toHaveProperty('mimetype');
    });
  });

  describe('Monitoring API Contracts', () => {
    test('GET /api/monitoring/metrics should return valid contract', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/monitoring/metrics`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      validateApiResponse(response.data);
      
      const metrics = response.data.data;
      expect(metrics).toHaveProperty('system');
      expect(metrics).toHaveProperty('database');
      expect(metrics).toHaveProperty('api');
      
      // System metrics
      expect(metrics.system).toHaveProperty('uptime');
      expect(metrics.system).toHaveProperty('memory');
      expect(metrics.system).toHaveProperty('cpu');
      
      // API metrics
      expect(metrics.api).toHaveProperty('requestCount');
      expect(metrics.api).toHaveProperty('averageResponseTime');
      expect(metrics.api).toHaveProperty('errorRate');
    });
  });
});

// Helper function to validate API response structure
function validateApiResponse(response: any) {
  validateSchema(response, API_RESPONSE_SCHEMA);
}

// Helper function to validate JSON schema
function validateSchema(data: any, schema: any) {
  // Basic schema validation implementation
  if (schema.type === 'object') {
    expect(typeof data).toBe('object');
    expect(data).not.toBeNull();
    
    if (schema.required) {
      schema.required.forEach((field: string) => {
        expect(data).toHaveProperty(field);
      });
    }
    
    if (schema.properties) {
      Object.keys(schema.properties).forEach(key => {
        if (data.hasOwnProperty(key)) {
          const fieldSchema = schema.properties[key];
          validateFieldSchema(data[key], fieldSchema);
        }
      });
    }
  } else if (schema.type === 'array') {
    expect(Array.isArray(data)).toBe(true);
  } else {
    expect(typeof data).toBe(schema.type);
  }
}

// Helper function to validate individual field schema
function validateFieldSchema(value: any, fieldSchema: any) {
  if (Array.isArray(fieldSchema.type)) {
    expect(fieldSchema.type).toContain(typeof value);
  } else if (fieldSchema.type === 'array') {
    expect(Array.isArray(value)).toBe(true);
  } else if (fieldSchema.type === 'object') {
    expect(typeof value).toBe('object');
    expect(value).not.toBeNull();
  } else {
    expect(typeof value).toBe(fieldSchema.type);
  }
  
  if (fieldSchema.enum) {
    expect(fieldSchema.enum).toContain(value);
  }
  
  if (fieldSchema.format === 'email') {
    expect(value).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  }
  
  if (fieldSchema.format === 'date') {
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
  
  if (fieldSchema.format === 'date-time') {
    expect(new Date(value).toISOString()).toBe(value);
  }
}