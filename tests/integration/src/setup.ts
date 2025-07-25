import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

// Global test configuration
export const TEST_CONFIG = {
  backend: {
    baseURL: 'http://localhost:3000',
    timeout: 30000,
  },
  frontend: {
    baseURL: 'http://localhost:5173',
    timeout: 30000,
  },
  miniprogram: {
    baseURL: 'http://localhost:8080',
    timeout: 30000,
  },
  database: {
    host: 'localhost',
    port: 5432,
    database: 'cattle_management_test',
    username: 'postgres',
    password: 'postgres',
  },
  redis: {
    host: 'localhost',
    port: 6379,
    db: 1, // Use different DB for tests
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
    role: 'user',
    ...userData,
  };

  const response = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/register`, defaultUser);
  return response.data;
}

// Utility function to login test user
export async function loginTestUser(credentials: { username: string; password: string }) {
  const response = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/login`, credentials);
  return response.data;
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