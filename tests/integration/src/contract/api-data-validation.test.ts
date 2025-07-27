import axios from 'axios';
import { TEST_CONFIG, createTestUser, loginTestUser } from '../setup';

// This test validates that API responses match what the frontend expects
describe('API Data Contract Validation', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Use the actual admin user instead of creating a test user
    const loginResponse = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/login`, {
      username: 'admin',
      password: 'Admin123'
    });

    if (!loginResponse.data.success || !loginResponse.data.data.token) {
      throw new Error('Failed to login as admin user. Run: cd backend && node create-admin-user.js');
    }

    authToken = loginResponse.data.data.token;
    testUser = loginResponse.data.data.user;

    // Verify admin has proper permissions
    const permissions = loginResponse.data.data.permissions || [];
    if (!permissions.includes('*') && permissions.length < 5) {
      throw new Error('Admin user lacks sufficient permissions. Check role configuration.');
    }
  });

  describe('Authentication API Data Validation', () => {
    test('Login response should match frontend expectations', async () => {
      // First, ensure we're using an admin user with proper permissions
      const adminCredentials = {
        username: 'admin',
        password: 'Admin123'
      };

      const response = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/login`, adminCredentials);

      expect(response.status).toBe(200);
      
      // Validate response structure matches frontend auth store expectations
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const { data } = response.data;
      
      // Frontend expects these exact fields
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('permissions');
      
      // Token should be a valid JWT-like string
      expect(typeof data.token).toBe('string');
      expect(data.token.split('.')).toHaveLength(3);
      
      // User object should have required fields for frontend
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('username');
      expect(data.user).toHaveProperty('real_name');
      expect(data.user).toHaveProperty('status');
      
      // User should NOT have sensitive fields
      expect(data.user).not.toHaveProperty('password_hash');
      expect(data.user).not.toHaveProperty('password_reset_token');
      
      // Permissions should be an array and admin should have full access
      expect(Array.isArray(data.permissions)).toBe(true);
      expect(data.permissions.length).toBeGreaterThan(0);
      
      // Admin should have either "*" permission or multiple specific permissions
      const hasFullAccess = data.permissions.includes('*') || data.permissions.length > 5;
      expect(hasFullAccess).toBe(true);
      
      // Update authToken for subsequent tests
      authToken = data.token;
      
      // If user has role, validate role structure
      if (data.user.role) {
        expect(data.user.role).toHaveProperty('name');
        expect(data.user.role).toHaveProperty('permissions');
        expect(Array.isArray(data.user.role.permissions)).toBe(true);
      }
    });

    test('Token refresh response should match frontend expectations', async () => {
      const response = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const { data } = response.data;
      
      // Should have same structure as login response
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('permissions');
      expect(data).toHaveProperty('expiresIn');
      
      // New token should be different from original
      expect(data.token).not.toBe(authToken);
      expect(typeof data.expiresIn).toBe('number');
    });

    test('Error responses should match frontend error handler expectations', async () => {
      const response = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/auth/login`,
        {
          username: 'nonexistent',
          password: 'wrongpassword',
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('success', false);
      expect(response.data).toHaveProperty('error');
      
      const { error } = response.data;
      
      // Frontend error handler expects these fields
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('timestamp');
      expect(error).toHaveProperty('path');
      
      // Error code should be specific
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(typeof error.message).toBe('string');
      expect(error.message.length).toBeGreaterThan(0);
    });
  });

  describe('Cattle API Data Validation', () => {
    let testCattle: any;

    test('Cattle creation response should match frontend expectations', async () => {
      const cattleData = {
        ear_tag: `DATA_CONTRACT_${Date.now()}`,
        breed: 'Data Contract Test Breed',
        gender: 'male',
        birth_date: '2023-01-01',
        weight: 450,
        health_status: 'healthy',
      };

      const response = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        cattleData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const cattle = response.data.data;
      testCattle = cattle;
      
      // Frontend expects these exact field names
      expect(cattle).toHaveProperty('id');
      expect(cattle).toHaveProperty('ear_tag', cattleData.ear_tag);
      expect(cattle).toHaveProperty('breed', cattleData.breed);
      expect(cattle).toHaveProperty('gender', cattleData.gender);
      expect(cattle).toHaveProperty('birth_date');
      expect(cattle).toHaveProperty('weight');
      expect(cattle).toHaveProperty('health_status', cattleData.health_status);
      expect(cattle).toHaveProperty('created_at');
      expect(cattle).toHaveProperty('updated_at');
      
      // Validate data types
      expect(typeof cattle.id).toBe('number');
      expect(typeof cattle.weight).toBe('number');
      expect(cattle.weight).toBe(450);
      
      // Date fields should be ISO strings
      expect(new Date(cattle.created_at).toISOString()).toBe(cattle.created_at);
      expect(new Date(cattle.updated_at).toISOString()).toBe(cattle.updated_at);
      
      // Birth date should match input format
      expect(cattle.birth_date).toBe('2023-01-01');
    });

    test('Cattle list response should match frontend pagination expectations', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle?page=1&limit=10`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const { data } = response.data;
      
      // Frontend expects either array or paginated object
      if (Array.isArray(data)) {
        // Simple array response
        data.forEach(cattle => {
          validateCattleObject(cattle);
        });
      } else {
        // Paginated response
        expect(data).toHaveProperty('items');
        expect(data).toHaveProperty('pagination');
        
        expect(Array.isArray(data.items)).toBe(true);
        
        // Validate pagination object
        const { pagination } = data;
        expect(pagination).toHaveProperty('total');
        expect(pagination).toHaveProperty('page');
        expect(pagination).toHaveProperty('limit');
        expect(pagination).toHaveProperty('totalPages');
        
        expect(typeof pagination.total).toBe('number');
        expect(typeof pagination.page).toBe('number');
        expect(typeof pagination.limit).toBe('number');
        expect(typeof pagination.totalPages).toBe('number');
        
        expect(pagination.page).toBe(1);
        expect(pagination.limit).toBe(10);
        expect(pagination.totalPages).toBe(Math.ceil(pagination.total / pagination.limit));
        
        // Validate each cattle item
        data.items.forEach(cattle => {
          validateCattleObject(cattle);
        });
      }
    });

    test('Cattle update response should preserve data integrity', async () => {
      if (!testCattle) {
        throw new Error('Test cattle not created');
      }

      const updateData = {
        weight: 475,
        health_status: 'good',
      };

      const response = await axios.put(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/${testCattle.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const updatedCattle = response.data.data;
      
      // Should maintain all original fields
      expect(updatedCattle.id).toBe(testCattle.id);
      expect(updatedCattle.ear_tag).toBe(testCattle.ear_tag);
      expect(updatedCattle.breed).toBe(testCattle.breed);
      expect(updatedCattle.gender).toBe(testCattle.gender);
      expect(updatedCattle.birth_date).toBe(testCattle.birth_date);
      
      // Should update specified fields
      expect(updatedCattle.weight).toBe(475);
      expect(updatedCattle.health_status).toBe('good');
      
      // Updated timestamp should be newer
      expect(new Date(updatedCattle.updated_at).getTime()).toBeGreaterThan(
        new Date(testCattle.updated_at).getTime()
      );
    });

    test('Cattle search/filter response should match frontend expectations', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle?search=DATA_CONTRACT&gender=male&health_status=healthy`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const { data } = response.data;
      
      // Should return filtered results
      if (Array.isArray(data)) {
        data.forEach(cattle => {
          validateCattleObject(cattle);
          // Should match filter criteria
          expect(cattle.gender).toBe('male');
          expect(cattle.health_status).toBe('healthy');
        });
      } else if (data.items) {
        data.items.forEach(cattle => {
          validateCattleObject(cattle);
          expect(cattle.gender).toBe('male');
          expect(cattle.health_status).toBe('healthy');
        });
      }
    });
  });

  describe('Bases API Data Validation', () => {
    test('Bases list response should match frontend expectations', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/bases?limit=10`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      const { data } = response.data;
      
      // Frontend expects either array or paginated object
      if (Array.isArray(data)) {
        // Simple array response
        data.forEach(base => {
          validateBaseObject(base);
        });
      } else {
        // Paginated response
        expect(data).toHaveProperty('items');
        expect(data).toHaveProperty('pagination');
        
        expect(Array.isArray(data.items)).toBe(true);
        
        // Validate each base item
        data.items.forEach(base => {
          validateBaseObject(base);
        });
      }
    });
  });

  describe('Error Response Data Validation', () => {
    test('Validation errors should match frontend form validation expectations', async () => {
      const invalidData = {
        ear_tag: '', // Empty required field
        breed: '', // Empty required field
        gender: 'invalid', // Invalid enum value
        weight: -100, // Invalid number
      };

      const response = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        invalidData,
        { 
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true 
        }
      );

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('success', false);
      expect(response.data).toHaveProperty('error');
      
      const { error } = response.data;
      
      // Frontend expects validation errors in specific format
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      
      // Should have detailed validation errors
      if (error.details && error.details.errors) {
        expect(Array.isArray(error.details.errors)).toBe(true);
        
        error.details.errors.forEach(validationError => {
          expect(validationError).toHaveProperty('field');
          expect(validationError).toHaveProperty('message');
          expect(typeof validationError.field).toBe('string');
          expect(typeof validationError.message).toBe('string');
        });
      }
    });

    test('Permission errors should match frontend authorization expectations', async () => {
      // Create a user with limited permissions
      const limitedUser = await createTestUser({
        username: `limited_${Date.now()}`,
        email: `limited_${Date.now()}@test.com`,
        role: 'viewer',
      });

      const limitedLogin = await loginTestUser({
        username: limitedUser.data.username,
        password: 'TestPassword123!',
      });

      const response = await axios.delete(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/1`,
        { 
          headers: { Authorization: `Bearer ${limitedLogin.data.token}` },
          validateStatus: () => true 
        }
      );

      expect([403, 404]).toContain(response.status);
      expect(response.data).toHaveProperty('success', false);
      expect(response.data).toHaveProperty('error');
      
      const { error } = response.data;
      
      // Frontend expects specific permission error format
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      
      if (response.status === 403) {
        expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
        
        // Should provide details about missing permissions
        if (error.details) {
          expect(error.details).toHaveProperty('required');
          expect(error.details).toHaveProperty('userRole');
        }
      }
    });

    test('Not found errors should match frontend expectations', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle/99999`,
        { 
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true 
        }
      );

      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('success', false);
      expect(response.data).toHaveProperty('error');
      
      const { error } = response.data;
      
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('timestamp');
      expect(error).toHaveProperty('path');
      
      expect(error.code).toContain('NOT_FOUND');
      expect(error.message).toContain('not found');
    });
  });

  describe('Data Type and Format Validation', () => {
    test('Date fields should be consistently formatted', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle?limit=5`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      
      const cattle = response.data.data.items || response.data.data;
      if (Array.isArray(cattle) && cattle.length > 0) {
        cattle.forEach(item => {
          // All date fields should be ISO strings
          if (item.created_at) {
            expect(new Date(item.created_at).toISOString()).toBe(item.created_at);
          }
          if (item.updated_at) {
            expect(new Date(item.updated_at).toISOString()).toBe(item.updated_at);
          }
          if (item.birth_date) {
            // Birth date should be YYYY-MM-DD format
            expect(item.birth_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          }
        });
      }
    });

    test('Numeric fields should have correct types and ranges', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle?limit=5`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      
      const cattle = response.data.data.items || response.data.data;
      if (Array.isArray(cattle) && cattle.length > 0) {
        cattle.forEach(item => {
          // ID should be positive integer
          expect(typeof item.id).toBe('number');
          expect(item.id).toBeGreaterThan(0);
          expect(Number.isInteger(item.id)).toBe(true);
          
          // Weight should be positive number
          if (item.weight !== null && item.weight !== undefined) {
            expect(typeof item.weight).toBe('number');
            expect(item.weight).toBeGreaterThan(0);
          }
          
          // Base ID and Barn ID should be positive integers if present
          if (item.base_id) {
            expect(typeof item.base_id).toBe('number');
            expect(item.base_id).toBeGreaterThan(0);
            expect(Number.isInteger(item.base_id)).toBe(true);
          }
          
          if (item.barn_id) {
            expect(typeof item.barn_id).toBe('number');
            expect(item.barn_id).toBeGreaterThan(0);
            expect(Number.isInteger(item.barn_id)).toBe(true);
          }
        });
      }
    });

    test('Enum fields should have valid values', async () => {
      const response = await axios.get(
        `${TEST_CONFIG.backend.baseURL}/api/cattle?limit=5`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      
      const cattle = response.data.data.items || response.data.data;
      if (Array.isArray(cattle) && cattle.length > 0) {
        cattle.forEach(item => {
          // Gender should be valid enum value
          if (item.gender) {
            expect(['male', 'female', '雄性', '雌性']).toContain(item.gender);
          }
          
          // Health status should be valid enum value
          if (item.health_status) {
            expect(['healthy', 'sick', 'quarantine', 'good', 'poor', '健康', '生病', '隔离']).toContain(item.health_status);
          }
        });
      }
    });
  });
});

// Helper function to validate cattle object structure
function validateCattleObject(cattle: any): void {
  expect(cattle).toHaveProperty('id');
  expect(cattle).toHaveProperty('ear_tag');
  expect(cattle).toHaveProperty('breed');
  expect(cattle).toHaveProperty('gender');
  expect(cattle).toHaveProperty('created_at');
  expect(cattle).toHaveProperty('updated_at');
  
  expect(typeof cattle.id).toBe('number');
  expect(typeof cattle.ear_tag).toBe('string');
  expect(typeof cattle.breed).toBe('string');
  expect(typeof cattle.gender).toBe('string');
  expect(typeof cattle.created_at).toBe('string');
  expect(typeof cattle.updated_at).toBe('string');
  
  // Validate date formats
  expect(new Date(cattle.created_at).toISOString()).toBe(cattle.created_at);
  expect(new Date(cattle.updated_at).toISOString()).toBe(cattle.updated_at);
}