#!/usr/bin/env node

/**
 * Quick Fix Script for Test Data Access Issues
 * Identifies and fixes common problems preventing tests from accessing real backend data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class DataAccessFixer {
  constructor() {
    this.backendUrl = 'http://localhost:3000';
    this.fixes = [];
  }

  async run() {
    console.log('🔧 Quick Fix for Test Data Access Issues\n');
    
    try {
      await this.checkAndFixBackendConnection();
      await this.checkAndFixAuthentication();
      await this.checkAndFixTestConfiguration();
      await this.verifyDataAccess();
      
      this.showSummary();
    } catch (error) {
      console.error('❌ Fix process failed:', error.message);
      console.log('\n💡 Manual steps to try:');
      console.log('1. cd backend && npm run dev');
      console.log('2. Check backend/.env.development file exists');
      console.log('3. Verify database is running and accessible');
      console.log('4. Run: node scripts/diagnose-backend-connection.js');
      process.exit(1);
    }
  }

  addFix(description) {
    this.fixes.push(description);
    console.log(`✅ ${description}`);
  }

  async checkAndFixBackendConnection() {
    console.log('🔍 Checking backend connection...');
    
    try {
      const response = await axios.get(`${this.backendUrl}/api/health`, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log('✅ Backend is running');
      } else {
        throw new Error(`Backend returned status ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Backend is not running or not accessible');
      console.log('\n🔧 Starting backend...');
      
      // Try to start backend
      const { spawn } = require('child_process');
      const backendPath = path.join(__dirname, '../../../backend');
      
      if (fs.existsSync(path.join(backendPath, 'package.json'))) {
        console.log('📦 Found backend directory, attempting to start...');
        console.log('Please run this command in a separate terminal:');
        console.log(`cd ${backendPath} && npm run dev`);
        console.log('\nThen run this script again.');
        process.exit(1);
      } else {
        throw new Error('Backend directory not found');
      }
    }
  }

  async checkAndFixAuthentication() {
    console.log('\n🔐 Testing authentication...');
    
    const testUser = {
      username: `fix_test_${Date.now()}`,
      password: 'FixTest123!',
      real_name: 'Fix Test User',
      email: `fix_test_${Date.now()}@test.com`
    };

    try {
      // Try registration
      let registerResponse;
      try {
        registerResponse = await axios.post(`${this.backendUrl}/api/auth/register`, testUser);
      } catch (regError) {
        if (regError.response?.status === 409) {
          console.log('ℹ️ User already exists, proceeding to login...');
        } else {
          throw new Error(`Registration failed: ${regError.message}`);
        }
      }

      // Try login
      const loginResponse = await axios.post(`${this.backendUrl}/api/auth/login`, {
        username: testUser.username,
        password: testUser.password
      });

      if (loginResponse.data.success && loginResponse.data.data.token) {
        this.testToken = loginResponse.data.data.token;
        this.addFix('Authentication is working correctly');
      } else {
        throw new Error('Login response missing token or success flag');
      }
    } catch (error) {
      console.log(`❌ Authentication failed: ${error.message}`);
      
      // Check if it's a database issue
      try {
        const dbHealth = await axios.get(`${this.backendUrl}/api/health/database`);
        if (!dbHealth.data.success) {
          console.log('❌ Database connection issue detected');
          console.log('🔧 Check your database configuration in backend/.env.development');
          console.log('   Ensure PostgreSQL is running and credentials are correct');
        }
      } catch (dbError) {
        console.log('❌ Cannot check database health');
      }
      
      throw error;
    }
  }

  async checkAndFixTestConfiguration() {
    console.log('\n⚙️ Checking test configuration...');
    
    const testEnvPath = path.join(__dirname, '../.env');
    
    // Create or update test .env file
    const envContent = `# Test Environment Configuration
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Test User Credentials
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=Admin123
TEST_ADMIN_EMAIL=admin@test.com

# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRIES=2
`;

    fs.writeFileSync(testEnvPath, envContent);
    this.addFix('Updated test environment configuration');

    // Check setup.ts file
    const setupPath = path.join(__dirname, '../src/setup.ts');
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
  const userWithPassword = {
    ...userData,
    password: userData.password || 'TestPassword123!',
    real_name: userData.real_name || userData.username || 'Test User'
  };
  
  try {
    const response = await axios.post(\`\${TEST_CONFIG.backend.baseURL}/api/auth/register\`, userWithPassword);
    
    if (!response.data || !response.data.success) {
      throw new Error('Registration response missing success indicator');
    }
    
    return response;
  } catch (error: any) {
    if (error.response?.status === 409) {
      return await loginTestUser({
        username: userWithPassword.username,
        password: userWithPassword.password
      });
    }
    throw error;
  }
};

export const loginTestUser = async (credentials: any) => {
  const response = await axios.post(\`\${TEST_CONFIG.backend.baseURL}/api/auth/login\`, credentials);
  
  if (!response.data || !response.data.success || !response.data.data.token) {
    throw new Error('Login failed or missing token');
  }
  
  return response;
};`;

      fs.writeFileSync(setupPath, setupContent);
      this.addFix('Created/updated setup.ts with proper error handling');
    }
  }

  async verifyDataAccess() {
    console.log('\n📊 Verifying data access...');
    
    if (!this.testToken) {
      throw new Error('No test token available for data access verification');
    }

    try {
      const response = await axios.get(`${this.backendUrl}/api/cattle?limit=1`, {
        headers: { Authorization: `Bearer ${this.testToken}` },
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        const data = response.data.data;
        let recordCount = 0;
        
        if (Array.isArray(data)) {
          recordCount = data.length;
        } else if (data && data.items && Array.isArray(data.items)) {
          recordCount = data.items.length;
        }
        
        this.addFix(`Data access verified - found ${recordCount} cattle records`);
        
        // Test data creation to ensure write access
        const testCattle = {
          ear_tag: `FIX_TEST_${Date.now()}`,
          breed: 'Fix Test Breed',
          gender: 'male',
          birth_date: '2023-01-01',
          weight: 450,
          health_status: 'healthy'
        };

        const createResponse = await axios.post(`${this.backendUrl}/api/cattle`, testCattle, {
          headers: { Authorization: `Bearer ${this.testToken}` }
        });

        if (createResponse.status === 201 && createResponse.data.success) {
          this.addFix('Data creation verified - write access working');
          
          // Clean up test data
          const cattleId = createResponse.data.data.id;
          await axios.delete(`${this.backendUrl}/api/cattle/${cattleId}`, {
            headers: { Authorization: `Bearer ${this.testToken}` }
          });
          
          this.addFix('Test data cleanup successful');
        } else {
          console.log('⚠️ Data creation test failed - read-only access');
        }
      } else {
        throw new Error('Data access failed or returned unexpected format');
      }
    } catch (error) {
      console.log(`❌ Data access verification failed: ${error.message}`);
      
      if (error.response?.status === 403) {
        console.log('🔧 Permission issue detected - check user roles and permissions');
      } else if (error.response?.status === 404) {
        console.log('🔧 API endpoint not found - check backend routes');
      }
      
      throw error;
    }
  }

  showSummary() {
    console.log('\n📋 Fix Summary\n');
    
    if (this.fixes.length > 0) {
      console.log('✅ Applied fixes:');
      this.fixes.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix}`);
      });
    }
    
    console.log('\n🎉 Your test environment should now be able to access real backend data!');
    console.log('\n🧪 Next steps:');
    console.log('1. Run your tests: npm test');
    console.log('2. Or run specific test: npx playwright test src/contract/api-data-validation.test.ts');
    console.log('3. For validation: node scripts/validate-test-environment.js');
    
    console.log('\n💡 If you still have issues:');
    console.log('• Check that your backend database has actual data');
    console.log('• Verify your user has proper permissions');
    console.log('• Run the diagnostic script: node scripts/diagnose-backend-connection.js');
  }
}

// Run fixer if called directly
if (require.main === module) {
  const fixer = new DataAccessFixer();
  fixer.run().catch(error => {
    console.error('Fix script failed:', error);
    process.exit(1);
  });
}

module.exports = DataAccessFixer;