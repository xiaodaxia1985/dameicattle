#!/usr/bin/env node

/**
 * Test Environment Validation Script
 * Validates that tests can properly access backend data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TestEnvironmentValidator {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.issues = [];
    this.testToken = null;
  }

  async validate() {
    console.log('🔍 Validating Test Environment for Real Data Access\n');
    
    try {
      await this.checkServiceAvailability();
      await this.validateAuthentication();
      await this.validateDataAccess();
      await this.validateDataConsistency();
      await this.checkTestConfiguration();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  addIssue(category, message, severity = 'error') {
    this.issues.push({ category, message, severity });
    const emoji = severity === 'error' ? '❌' : '⚠️';
    console.log(`${emoji} [${category}] ${message}`);
  }

  async checkServiceAvailability() {
    console.log('📡 Checking Service Availability...\n');
    
    // Check backend health
    try {
      const healthResponse = await axios.get(`${this.backendUrl}/api/health`, {
        timeout: 5000
      });
      
      if (healthResponse.status === 200) {
        console.log('✅ Backend service is running');
      } else {
        this.addIssue('Service', `Backend returned status ${healthResponse.status}`);
      }
    } catch (error) {
      this.addIssue('Service', `Backend is not accessible: ${error.message}`);
      return;
    }

    // Check database connection through backend
    try {
      const dbResponse = await axios.get(`${this.backendUrl}/api/health/database`, {
        timeout: 10000
      });
      
      if (dbResponse.status === 200 && dbResponse.data.success) {
        console.log('✅ Database connection is healthy');
      } else {
        this.addIssue('Database', 'Database connection failed through backend');
      }
    } catch (error) {
      this.addIssue('Database', `Database health check failed: ${error.message}`);
    }

    // Check frontend (optional for backend tests)
    try {
      await axios.get(this.frontendUrl, { timeout: 5000 });
      console.log('✅ Frontend service is running');
    } catch (error) {
      this.addIssue('Service', `Frontend is not accessible: ${error.message}`, 'warning');
    }
  }

  async validateAuthentication() {
    console.log('\n🔐 Validating Authentication Flow...\n');
    
    const testUser = {
      username: `validation_${Date.now()}`,
      password: 'ValidationTest123!',
      real_name: 'Validation Test User',
      email: `validation_${Date.now()}@test.com`
    };

    // Test user registration
    try {
      const registerResponse = await axios.post(`${this.backendUrl}/api/auth/register`, testUser);
      
      if (registerResponse.status === 201 && registerResponse.data.success) {
        console.log('✅ User registration works');
      } else {
        this.addIssue('Auth', 'User registration failed or returned unexpected format');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists (expected for repeated runs)');
      } else {
        this.addIssue('Auth', `User registration failed: ${error.message}`);
      }
    }

    // Test user login
    try {
      const loginResponse = await axios.post(`${this.backendUrl}/api/auth/login`, {
        username: testUser.username,
        password: testUser.password
      });
      
      if (loginResponse.status === 200 && loginResponse.data.success) {
        const token = loginResponse.data.data?.token;
        
        if (token) {
          console.log('✅ User login works');
          
          // Validate token structure
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            console.log('✅ JWT token has valid structure');
            this.testToken = token;
          } else {
            this.addIssue('Auth', 'JWT token has invalid structure');
          }
        } else {
          this.addIssue('Auth', 'Login response missing token');
        }
      } else {
        this.addIssue('Auth', 'Login failed or returned unexpected format');
      }
    } catch (error) {
      this.addIssue('Auth', `Login failed: ${error.message}`);
    }
  }

  async validateDataAccess() {
    console.log('\n📊 Validating Data Access...\n');
    
    if (!this.testToken) {
      this.addIssue('Data', 'Cannot test data access without valid token');
      return;
    }

    const endpoints = [
      { name: 'Cattle List', url: '/api/cattle', method: 'GET' },
      { name: 'User Profile', url: '/api/auth/profile', method: 'GET' },
      { name: 'Bases List', url: '/api/bases', method: 'GET' },
      { name: 'Roles List', url: '/api/roles', method: 'GET' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${this.backendUrl}${endpoint.url}`,
          headers: { Authorization: `Bearer ${this.testToken}` },
          timeout: 10000
        });
        
        if (response.status === 200 && response.data.success) {
          console.log(`✅ ${endpoint.name} access works`);
          
          // Validate data structure
          const data = response.data.data;
          if (data !== null && data !== undefined) {
            if (Array.isArray(data)) {
              console.log(`   Found ${data.length} records`);
            } else if (data.items && Array.isArray(data.items)) {
              console.log(`   Found ${data.items.length} records (paginated)`);
              console.log(`   Total: ${data.pagination?.total || 'unknown'}`);
            } else {
              console.log(`   Data type: ${typeof data}`);
            }
          } else {
            this.addIssue('Data', `${endpoint.name} returned null/undefined data`, 'warning');
          }
        } else {
          this.addIssue('Data', `${endpoint.name} returned unexpected response format`);
        }
      } catch (error) {
        if (error.response?.status === 403) {
          this.addIssue('Data', `${endpoint.name} access denied (permissions issue)`, 'warning');
        } else if (error.response?.status === 404) {
          this.addIssue('Data', `${endpoint.name} endpoint not found`, 'warning');
        } else {
          this.addIssue('Data', `${endpoint.name} access failed: ${error.message}`);
        }
      }
    }
  }

  async validateDataConsistency() {
    console.log('\n🔄 Validating Data Consistency...\n');
    
    if (!this.testToken) {
      this.addIssue('Consistency', 'Cannot test data consistency without valid token');
      return;
    }

    try {
      // Create test cattle
      const testCattle = {
        ear_tag: `VALIDATION_${Date.now()}`,
        breed: 'Validation Test Breed',
        gender: 'male',
        birth_date: '2023-01-01',
        weight: 450,
        health_status: 'healthy'
      };

      const createResponse = await axios.post(
        `${this.backendUrl}/api/cattle`,
        testCattle,
        {
          headers: { Authorization: `Bearer ${this.testToken}` },
          timeout: 10000
        }
      );

      if (createResponse.status === 201 && createResponse.data.success) {
        console.log('✅ Data creation works');
        
        const createdCattle = createResponse.data.data;
        const cattleId = createdCattle.id;
        
        // Verify data was actually saved
        const getResponse = await axios.get(
          `${this.backendUrl}/api/cattle/${cattleId}`,
          {
            headers: { Authorization: `Bearer ${this.testToken}` },
            timeout: 10000
          }
        );

        if (getResponse.status === 200 && getResponse.data.success) {
          const retrievedCattle = getResponse.data.data;
          
          // Check data consistency
          if (retrievedCattle.ear_tag === testCattle.ear_tag &&
              retrievedCattle.breed === testCattle.breed &&
              retrievedCattle.weight === testCattle.weight) {
            console.log('✅ Data consistency verified');
          } else {
            this.addIssue('Consistency', 'Created data does not match retrieved data');
          }
        } else {
          this.addIssue('Consistency', 'Cannot retrieve created data');
        }

        // Clean up test data
        try {
          await axios.delete(
            `${this.backendUrl}/api/cattle/${cattleId}`,
            {
              headers: { Authorization: `Bearer ${this.testToken}` },
              timeout: 10000
            }
          );
          console.log('✅ Test data cleanup successful');
        } catch (cleanupError) {
          this.addIssue('Cleanup', 'Failed to clean up test data', 'warning');
        }
      } else {
        this.addIssue('Consistency', 'Data creation failed');
      }
    } catch (error) {
      this.addIssue('Consistency', `Data consistency test failed: ${error.message}`);
    }
  }

  async checkTestConfiguration() {
    console.log('\n⚙️ Checking Test Configuration...\n');
    
    const configFiles = [
      { path: 'tests/integration/.env', required: false },
      { path: 'tests/integration/playwright.config.ts', required: true },
      { path: 'tests/integration/src/setup.ts', required: true },
      { path: 'backend/.env.development', required: true }
    ];

    for (const config of configFiles) {
      const fullPath = path.join(__dirname, '../../../', config.path);
      
      if (fs.existsSync(fullPath)) {
        console.log(`✅ Found ${config.path}`);
        
        // Check for common configuration issues
        if (config.path.endsWith('.env')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          if (content.includes('BACKEND_URL=')) {
            const backendUrl = content.match(/BACKEND_URL=(.+)/)?.[1];
            if (backendUrl && backendUrl !== this.backendUrl) {
              this.addIssue('Config', `Backend URL mismatch in ${config.path}: ${backendUrl} vs ${this.backendUrl}`, 'warning');
            }
          }
        }
      } else {
        if (config.required) {
          this.addIssue('Config', `Missing required configuration file: ${config.path}`);
        } else {
          this.addIssue('Config', `Missing optional configuration file: ${config.path}`, 'warning');
        }
      }
    }

    // Check if test database is different from development database
    const backendEnvPath = path.join(__dirname, '../../../backend/.env.development');
    if (fs.existsSync(backendEnvPath)) {
      const envContent = fs.readFileSync(backendEnvPath, 'utf8');
      const dbName = envContent.match(/DB_NAME=(.+)/)?.[1];
      
      if (dbName && !dbName.includes('test')) {
        this.addIssue('Config', 'Using production/development database for tests (should use test database)', 'warning');
      }
    }
  }

  generateReport() {
    console.log('\n📋 Validation Report\n');
    
    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');
    
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️ Warnings: ${warnings.length}`);
    
    if (errors.length === 0) {
      console.log('\n🎉 All critical validations passed!');
      console.log('Your test environment should be able to access real backend data.');
    } else {
      console.log('\n🔧 Issues Found:');
      
      errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.category}] ${error.message}`);
      });
      
      console.log('\n💡 Recommended Actions:');
      console.log('• Ensure backend is running: cd backend && npm run dev');
      console.log('• Check database connection and credentials');
      console.log('• Verify environment variables in backend/.env.development');
      console.log('• Run the diagnostic script: node scripts/diagnose-backend-connection.js');
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ Warnings (non-critical):');
      warnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.category}] ${warning.message}`);
      });
    }
    
    // Save report
    const reportPath = path.join(__dirname, '../validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        errors: errors.length,
        warnings: warnings.length,
        passed: errors.length === 0
      },
      issues: this.issues
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    if (errors.length > 0) {
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new TestEnvironmentValidator();
  validator.validate().catch(error => {
    console.error('Validation script failed:', error);
    process.exit(1);
  });
}

module.exports = TestEnvironmentValidator;