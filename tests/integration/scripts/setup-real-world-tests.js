#!/usr/bin/env node

/**
 * Setup script for real-world testing
 * Prepares the environment and validates configuration
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '../../..');
    this.integrationRoot = path.join(__dirname, '..');
  }

  async setup() {
    console.log('🚀 Setting up Real-World Testing Environment\n');

    await this.checkNodeVersion();
    await this.checkProjectStructure();
    await this.installDependencies();
    await this.createConfigFiles();
    await this.validateServices();
    await this.runSampleTest();

    console.log('\n✅ Setup complete! You can now run:');
    console.log('   node scripts/run-comprehensive-tests.js');
    console.log('\nOr run individual test suites:');
    console.log('   npx playwright test src/e2e/real-world-scenarios.test.ts');
    console.log('   npx playwright test src/contract/api-data-validation.test.ts');
    
    console.log('\n🔍 To validate your test environment can access real data:');
    console.log('   node scripts/validate-test-environment.js');
    console.log('\n🩺 To diagnose backend connection issues:');
    console.log('   node scripts/diagnose-backend-connection.js');
  }

  async checkNodeVersion() {
    console.log('🔍 Checking Node.js version...');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      console.log('❌ Node.js 16+ is required. Current version:', nodeVersion);
      process.exit(1);
    }
    
    console.log('✅ Node.js version:', nodeVersion);
  }

  async checkProjectStructure() {
    console.log('🔍 Checking project structure...');
    
    const requiredPaths = [
      'backend',
      'frontend',
      'tests/integration'
    ];

    for (const requiredPath of requiredPaths) {
      const fullPath = path.join(this.projectRoot, requiredPath);
      if (!fs.existsSync(fullPath)) {
        console.log(`❌ Required directory not found: ${requiredPath}`);
        console.log(`   Expected at: ${fullPath}`);
        process.exit(1);
      }
    }
    
    console.log('✅ Project structure looks good');
  }

  async installDependencies() {
    console.log('📦 Installing test dependencies...');
    
    const packageJsonPath = path.join(this.integrationRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log('📝 Creating package.json for integration tests...');
      
      const packageJson = {
        name: "cattle-management-integration-tests",
        version: "1.0.0",
        description: "Real-world integration tests",
        scripts: {
          "test": "playwright test",
          "test:real-world": "node scripts/run-comprehensive-tests.js",
          "test:critical": "playwright test src/e2e/real-world-scenarios.test.ts src/contract/api-data-validation.test.ts src/integration/frontend-backend-integration.test.ts",
          "test:performance": "playwright test src/performance/real-world-performance.test.ts"
        },
        devDependencies: {
          "@playwright/test": "^1.40.0",
          "axios": "^1.6.0"
        }
      };
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    return new Promise((resolve, reject) => {
      const npmInstall = spawn('npm', ['install'], {
        cwd: this.integrationRoot,
        stdio: 'inherit'
      });

      npmInstall.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Dependencies installed');
          resolve();
        } else {
          console.log('❌ Failed to install dependencies');
          reject(new Error('npm install failed'));
        }
      });
    });
  }

  async createConfigFiles() {
    console.log('⚙️  Creating configuration files...');
    
    // Create playwright config if it doesn't exist
    const playwrightConfigPath = path.join(this.integrationRoot, 'playwright.config.ts');
    
    if (!fs.existsSync(playwrightConfigPath)) {
      const playwrightConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000,
  
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: process.env.CI ? undefined : [
    {
      command: 'npm run dev',
      port: 5173,
      cwd: '../frontend',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run start',
      port: 3000,
      cwd: '../backend',
      reuseExistingServer: !process.env.CI,
    },
  ],
});`;
      
      fs.writeFileSync(playwrightConfigPath, playwrightConfig);
      console.log('✅ Created playwright.config.ts');
    }

    // Create .env file if it doesn't exist
    const envPath = path.join(this.integrationRoot, '.env');
    
    if (!fs.existsSync(envPath)) {
      const envContent = `# Test Environment Configuration
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Test User Credentials (update these for your system)
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=Admin123
TEST_ADMIN_EMAIL=admin@test.com

# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRIES=2
`;
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Created .env file');
    }

    // Create setup.ts if it doesn't exist
    const setupPath = path.join(this.integrationRoot, 'src/setup.ts');
    
    if (!fs.existsSync(setupPath)) {
      const setupDir = path.dirname(setupPath);
      if (!fs.existsSync(setupDir)) {
        fs.mkdirSync(setupDir, { recursive: true });
      }

      const setupContent = `import axios from 'axios';

export const TEST_CONFIG = {
  backend: {
    baseURL: process.env.BACKEND_URL || 'http://localhost:3000'
  },
  frontend: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173'
  },
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  retries: parseInt(process.env.TEST_RETRIES || '2')
};

export const createTestUser = async (userData: any) => {
  try {
    const response = await axios.post(\`\${TEST_CONFIG.backend.baseURL}/api/auth/register\`, userData);
    return response;
  } catch (error: any) {
    if (error.response?.status === 409) {
      // User already exists, try to login
      return await loginTestUser({
        username: userData.username,
        password: userData.password
      });
    }
    throw error;
  }
};

export const loginTestUser = async (credentials: any) => {
  const response = await axios.post(\`\${TEST_CONFIG.backend.baseURL}/api/auth/login\`, credentials);
  return response;
};`;
      
      fs.writeFileSync(setupPath, setupContent);
      console.log('✅ Created setup.ts');
    }
  }

  async validateServices() {
    console.log('🔍 Validating services...');
    
    const services = [
      {
        name: 'Backend',
        url: 'http://localhost:3000/api/health',
        required: true
      },
      {
        name: 'Backend API',
        url: 'http://localhost:3000/api/auth/status',
        required: true
      },
      {
        name: 'Database Connection',
        url: 'http://localhost:3000/api/health/database',
        required: true
      },
      {
        name: 'Frontend',
        url: 'http://localhost:5173',
        required: true
      }
    ];

    let allServicesRunning = true;

    for (const service of services) {
      try {
        const response = await fetch(service.url);
        if (response.ok) {
          console.log(`✅ ${service.name} is running`);
          
          // For backend services, also check response data
          if (service.name.includes('Backend')) {
            const data = await response.json();
            if (data.success === false) {
              console.log(`⚠️  ${service.name} has issues: ${data.message || 'Unknown error'}`);
              allServicesRunning = false;
            }
          }
        } else {
          console.log(`⚠️  ${service.name} responded with status ${response.status}`);
          if (service.required) {
            console.log(`   Please start your ${service.name.toLowerCase()} service`);
            allServicesRunning = false;
          }
        }
      } catch (error) {
        console.log(`❌ ${service.name} is not accessible at ${service.url}`);
        console.log(`   Error: ${error.message}`);
        if (service.required) {
          console.log(`   Please start your ${service.name.toLowerCase()} service`);
          console.log(`   For backend: cd backend && npm run dev`);
          console.log(`   For frontend: cd frontend && npm run dev`);
          allServicesRunning = false;
        }
      }
    }

    if (!allServicesRunning) {
      console.log('\n❌ Some required services are not running properly.');
      console.log('Please ensure all services are started before running tests.');
      process.exit(1);
    }

    // Test actual data access
    await this.testDataAccess();
  }

  async testDataAccess() {
    console.log('🔍 Testing backend data access...');
    
    try {
      // Test user creation and authentication
      const testUser = {
        username: `setup_test_${Date.now()}`,
        password: 'SetupTest123!',
        real_name: 'Setup Test User',
        email: `setup_test_${Date.now()}@test.com`
      };

      // Try to register test user
      const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        console.log(`⚠️  User registration test failed: ${errorData.message || 'Unknown error'}`);
      }

      // Try to login
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password,
        }),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData.success && loginData.data.token) {
          console.log('✅ Backend authentication is working');
          
          // Test data access with token
          const dataResponse = await fetch('http://localhost:3000/api/cattle?limit=1', {
            headers: {
              'Authorization': `Bearer ${loginData.data.token}`,
            },
          });

          if (dataResponse.ok) {
            const data = await dataResponse.json();
            console.log('✅ Backend data access is working');
            console.log(`   Found ${Array.isArray(data.data) ? data.data.length : (data.data.items ? data.data.items.length : 0)} cattle records`);
          } else {
            console.log('⚠️  Backend data access failed');
            const errorData = await dataResponse.json();
            console.log(`   Error: ${errorData.message || 'Unknown error'}`);
          }
        } else {
          console.log('⚠️  Login succeeded but token is missing');
        }
      } else {
        const errorData = await loginResponse.json();
        console.log(`⚠️  Backend login test failed: ${errorData.message || 'Unknown error'}`);
      }

    } catch (error) {
      console.log(`❌ Data access test failed: ${error.message}`);
      console.log('   This indicates backend connectivity issues');
    }
  }

  async runSampleTest() {
    console.log('🧪 Running sample test to validate setup...');
    
    // Create a simple validation test
    const sampleTestPath = path.join(this.integrationRoot, 'src/setup-validation.test.ts');
    const sampleTest = `import { test, expect } from '@playwright/test';

test('Setup validation', async ({ page }) => {
  // Test that we can access the frontend
  await page.goto('/');
  
  // Basic page load test
  await expect(page).toHaveTitle(/.*/);
  
  console.log('✅ Setup validation passed');
});`;
    
    fs.writeFileSync(sampleTestPath, sampleTest);
    
    return new Promise((resolve) => {
      const testProcess = spawn('npx', ['playwright', 'test', 'src/setup-validation.test.ts'], {
        cwd: this.integrationRoot,
        stdio: 'inherit'
      });

      testProcess.on('close', (code) => {
        // Clean up the test file
        fs.unlinkSync(sampleTestPath);
        
        if (code === 0) {
          console.log('✅ Sample test passed - setup is working');
        } else {
          console.log('⚠️  Sample test failed - check your service configuration');
        }
        resolve();
      });
    });
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new TestSetup();
  setup.setup().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = TestSetup;