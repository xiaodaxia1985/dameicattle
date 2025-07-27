import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

// Global test configuration
export const TEST_CONFIG = {
  backend: {
    baseURL: process.env.BACKEND_URL || 'http://localhost:3000',
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  },
  frontend: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  },
  miniprogram: {
    baseURL: 'http://localhost:8080',
    timeout: 30000,
  },
  database: {
    host: 'localhost',
    port: 5432,
    database: 'cattle_management_dev', // Use dev database for integration tests
    username: 'cattle_user',
    password: 'dianxin99',
  },
  redis: {
    host: 'localhost',
    port: 6379,
    db: 0, // Use same DB as backend for integration tests
  },
  // Admin credentials for tests
  admin: {
    username: process.env.TEST_ADMIN_USERNAME || 'admin',
    password: process.env.TEST_ADMIN_PASSWORD || 'Admin123',
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
  },
};

// Global setup for all tests
beforeAll(async () => {
  console.log('🚀 Starting multi-component integration test setup...');
  
  // Wait for services to be ready
  await waitForServices();
  
  // Setup test database
  await setupTestDatabase();
  
  console.log('✅ Multi-component integration test setup complete');
}, 120000);

// Global teardown
afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...');
  
  // Cleanup test data
  await cleanupTestData();
  
  console.log('✅ Integration test cleanup complete');
}, 30000);

// Wait for all services to be ready
async function waitForServices(): Promise<void> {
  const services = [
    { name: 'Backend API', url: `${TEST_CONFIG.backend.baseURL}/api/health` },
    { name: 'Frontend', url: TEST_CONFIG.frontend.baseURL },
  ];

  for (const service of services) {
    console.log(`⏳ Waiting for ${service.name} to be ready...`);
    await waitForService(service.url, service.name);
    console.log(`✅ ${service.name} is ready`);
  }
}

// Wait for a specific service to be ready
async function waitForService(url: string, serviceName: string, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(url, { timeout: 5000 });
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`${serviceName} failed to start after ${maxRetries} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Setup test database
async function setupTestDatabase(): Promise<void> {
  try {
    // Run database migrations and seed test data
    await execAsync('cd ../../backend && npm run test:db:setup');
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}

// Cleanup test data
async function cleanupTestData(): Promise<void> {
  try {
    // Clean up test data but keep schema
    const response = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/test/cleanup`, {
      preserveSchema: true,
    });
    console.log('✅ Test data cleanup complete');
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed (this may be expected):', error instanceof Error ? error.message : String(error));
  }
}

// Utility function to create test user
export async function createTestUser(userData: any = {}) {
  const defaultUser = {
    username: `test_user_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    real_name: 'Test User',
    role: 'user',
    ...userData,
  };

  try {
    const response = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/register`, defaultUser);
    
    // Validate response structure
    if (!response.data || !response.data.success) {
      throw new Error(`Registration failed: ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      // User already exists, try to login
      console.log(`User ${defaultUser.username} already exists, attempting login...`);
      return await loginTestUser({
        username: defaultUser.username,
        password: defaultUser.password
      });
    }
    
    console.error('User creation failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    throw new Error(`Failed to create test user: ${error.message}`);
  }
}

// Utility function to login test user
export async function loginTestUser(credentials: { username: string; password: string }) {
  try {
    const response = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/login`, credentials);
    
    // Validate response structure
    if (!response.data || !response.data.success) {
      throw new Error(`Login failed: ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data.data || !response.data.data.token) {
      throw new Error('Login response missing authentication token');
    }
    
    // Validate token structure
    const token = response.data.data.token;
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT token structure received');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('User login failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    throw new Error(`Failed to login test user: ${error.message}`);
  }
}

// Utility function to validate backend connection
export async function validateBackendConnection(): Promise<void> {
  try {
    console.log('🔍 Validating backend connection...');
    
    const healthResponse = await axios.get(`${TEST_CONFIG.backend.baseURL}/api/health`, {
      timeout: 10000
    });
    
    if (healthResponse.status !== 200) {
      throw new Error(`Backend health check failed with status ${healthResponse.status}`);
    }
    
    console.log('✅ Backend connection validated');
  } catch (error: any) {
    console.error('❌ Backend connection validation failed:', error.message);
    throw new Error(`Backend is not accessible at ${TEST_CONFIG.backend.baseURL}`);
  }
}

// Utility function to validate database connection
export async function validateDatabaseConnection(): Promise<void> {
  try {
    console.log('🔍 Validating database connection...');
    
    const dbHealthResponse = await axios.get(`${TEST_CONFIG.backend.baseURL}/api/health/database`, {
      timeout: 15000
    });
    
    if (dbHealthResponse.status !== 200 || !dbHealthResponse.data.success) {
      throw new Error(`Database health check failed: ${JSON.stringify(dbHealthResponse.data)}`);
    }
    
    console.log('✅ Database connection validated');
  } catch (error: any) {
    console.error('❌ Database connection validation failed:', error.message);
    throw new Error('Database is not accessible through backend');
  }
}

// Utility function to test data access
export async function testDataAccess(token: string): Promise<void> {
  try {
    console.log('🔍 Testing data access...');
    
    const response = await axios.get(`${TEST_CONFIG.backend.baseURL}/api/cattle?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    
    if (response.status !== 200 || !response.data.success) {
      throw new Error(`Data access failed: ${JSON.stringify(response.data)}`);
    }
    
    console.log('✅ Data access validated');
  } catch (error: any) {
    console.error('❌ Data access validation failed:', error.message);
    throw new Error('Cannot access backend data with provided token');
  }
}

// Utility function to create test cattle
export async function createTestCattle(token: string, cattleData: any = {}) {
  const defaultCattle = {
    earTag: `TEST${Date.now()}`,
    breed: 'Test Breed',
    gender: 'male',
    birthDate: '2023-01-01',
    weight: 500,
    healthStatus: 'healthy',
    ...cattleData,
  };

  const response = await axios.post(
    `${TEST_CONFIG.backend.baseURL}/api/cattle`,
    defaultCattle,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response.data;
}

// Utility function to wait for async operations
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility function to retry operations
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(delayMs * Math.pow(2, i)); // Exponential backoff
    }
  }
  throw new Error('Retry failed');
}