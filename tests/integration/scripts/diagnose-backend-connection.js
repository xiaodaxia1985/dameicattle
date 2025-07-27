#!/usr/bin/env node

/**
 * Backend Connection Diagnostic Script
 * Helps identify why tests pass but can't access real backend data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class BackendDiagnostic {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    this.results = [];
  }

  log(message, status = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, status };
    this.results.push(logEntry);
    
    const emoji = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    }[status] || 'ℹ️';
    
    console.log(`${emoji} ${message}`);
  }

  async diagnose() {
    console.log('🔍 Starting Backend Connection Diagnosis\n');
    
    await this.checkEnvironmentVariables();
    await this.checkBackendProcess();
    await this.checkDatabaseConnection();
    await this.checkAuthenticationFlow();
    await this.checkDataAccess();
    await this.checkTestConfiguration();
    
    this.generateReport();
  }

  async checkEnvironmentVariables() {
    this.log('Checking environment variables...', 'info');
    
    const requiredEnvVars = [
      'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD',
      'JWT_SECRET', 'NODE_ENV'
    ];
    
    const backendEnvPath = path.join(__dirname, '../../../backend/.env.development');
    
    if (fs.existsSync(backendEnvPath)) {
      this.log('Backend .env.development file found', 'success');
      
      const envContent = fs.readFileSync(backendEnvPath, 'utf8');
      const missingVars = requiredEnvVars.filter(varName => 
        !envContent.includes(`${varName}=`)
      );
      
      if (missingVars.length > 0) {
        this.log(`Missing environment variables: ${missingVars.join(', ')}`, 'warning');
      } else {
        this.log('All required environment variables are present', 'success');
      }
    } else {
      this.log('Backend .env.development file not found', 'error');
    }
  }

  async checkBackendProcess() {
    this.log('Checking if backend is running...', 'info');
    
    try {
      const response = await axios.get(`${this.backendUrl}/api/health`, {
        timeout: 5000
      });
      
      if (response.status === 200) {
        this.log('Backend health endpoint is responding', 'success');
        this.log(`Response: ${JSON.stringify(response.data)}`, 'info');
      } else {
        this.log(`Backend responded with status ${response.status}`, 'warning');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.log('Backend is not running (connection refused)', 'error');
        this.log('Start backend with: cd backend && npm run dev', 'info');
      } else {
        this.log(`Backend connection error: ${error.message}`, 'error');
      }
    }
  }

  async checkDatabaseConnection() {
    this.log('Checking database connection...', 'info');
    
    try {
      const response = await axios.get(`${this.backendUrl}/api/health/database`, {
        timeout: 10000
      });
      
      if (response.status === 200 && response.data.success) {
        this.log('Database connection is healthy', 'success');
        if (response.data.data) {
          this.log(`Database info: ${JSON.stringify(response.data.data)}`, 'info');
        }
      } else {
        this.log('Database connection has issues', 'error');
        this.log(`Response: ${JSON.stringify(response.data)}`, 'info');
      }
    } catch (error) {
      this.log(`Database health check failed: ${error.message}`, 'error');
      
      if (error.response && error.response.data) {
        this.log(`Error details: ${JSON.stringify(error.response.data)}`, 'info');
      }
    }
  }

  async checkAuthenticationFlow() {
    this.log('Testing authentication flow...', 'info');
    
    const testUser = {
      username: `diagnostic_${Date.now()}`,
      password: 'DiagnosticTest123!',
      real_name: 'Diagnostic Test User',
      email: `diagnostic_${Date.now()}@test.com`
    };

    try {
      // Step 1: Try to register a test user
      this.log('Attempting user registration...', 'info');
      
      const registerResponse = await axios.post(`${this.backendUrl}/api/auth/register`, testUser, {
        timeout: 10000
      });
      
      if (registerResponse.status === 201 || registerResponse.status === 200) {
        this.log('User registration successful', 'success');
      } else {
        this.log(`User registration returned status ${registerResponse.status}`, 'warning');
      }
    } catch (registerError) {
      if (registerError.response?.status === 409) {
        this.log('User already exists (expected for repeated runs)', 'info');
      } else {
        this.log(`User registration failed: ${registerError.message}`, 'error');
        if (registerError.response?.data) {
          this.log(`Registration error details: ${JSON.stringify(registerError.response.data)}`, 'info');
        }
      }
    }

    try {
      // Step 2: Try to login
      this.log('Attempting user login...', 'info');
      
      const loginResponse = await axios.post(`${this.backendUrl}/api/auth/login`, {
        username: testUser.username,
        password: testUser.password
      }, {
        timeout: 10000
      });
      
      if (loginResponse.status === 200 && loginResponse.data.success) {
        this.log('User login successful', 'success');
        
        const token = loginResponse.data.data?.token;
        if (token) {
          this.log('JWT token received', 'success');
          this.testToken = token;
          
          // Validate token structure
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            this.log('JWT token has valid structure', 'success');
          } else {
            this.log('JWT token has invalid structure', 'warning');
          }
        } else {
          this.log('No JWT token in login response', 'error');
        }
      } else {
        this.log('User login failed', 'error');
        this.log(`Login response: ${JSON.stringify(loginResponse.data)}`, 'info');
      }
    } catch (loginError) {
      this.log(`User login failed: ${loginError.message}`, 'error');
      if (loginError.response?.data) {
        this.log(`Login error details: ${JSON.stringify(loginError.response.data)}`, 'info');
      }
    }
  }

  async checkDataAccess() {
    this.log('Testing data access...', 'info');
    
    if (!this.testToken) {
      this.log('No valid token available for data access test', 'error');
      return;
    }

    const endpoints = [
      { name: 'Cattle List', url: '/api/cattle?limit=5' },
      { name: 'User Profile', url: '/api/auth/profile' },
      { name: 'Bases List', url: '/api/bases?limit=5' },
      { name: 'Roles List', url: '/api/roles' }
    ];

    for (const endpoint of endpoints) {
      try {
        this.log(`Testing ${endpoint.name}...`, 'info');
        
        const response = await axios.get(`${this.backendUrl}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${this.testToken}`
          },
          timeout: 10000
        });
        
        if (response.status === 200 && response.data.success) {
          this.log(`${endpoint.name} access successful`, 'success');
          
          const data = response.data.data;
          if (Array.isArray(data)) {
            this.log(`  Found ${data.length} records`, 'info');
          } else if (data && data.items && Array.isArray(data.items)) {
            this.log(`  Found ${data.items.length} records (paginated)`, 'info');
            this.log(`  Total records: ${data.pagination?.total || 'unknown'}`, 'info');
          } else if (data) {
            this.log(`  Data type: ${typeof data}`, 'info');
          } else {
            this.log(`  No data returned`, 'warning');
          }
        } else {
          this.log(`${endpoint.name} returned unexpected response`, 'warning');
          this.log(`  Status: ${response.status}`, 'info');
          this.log(`  Response: ${JSON.stringify(response.data)}`, 'info');
        }
      } catch (dataError) {
        this.log(`${endpoint.name} access failed: ${dataError.message}`, 'error');
        
        if (dataError.response) {
          this.log(`  Status: ${dataError.response.status}`, 'info');
          this.log(`  Error: ${JSON.stringify(dataError.response.data)}`, 'info');
        }
      }
    }
  }

  async checkTestConfiguration() {
    this.log('Checking test configuration...', 'info');
    
    const testConfigPaths = [
      'tests/integration/.env',
      'tests/integration/playwright.config.ts',
      'tests/integration/src/setup.ts'
    ];
    
    for (const configPath of testConfigPaths) {
      const fullPath = path.join(__dirname, '../../../', configPath);
      
      if (fs.existsSync(fullPath)) {
        this.log(`Found ${configPath}`, 'success');
        
        if (configPath.endsWith('.env')) {
          const envContent = fs.readFileSync(fullPath, 'utf8');
          const backendUrl = envContent.match(/BACKEND_URL=(.+)/)?.[1];
          
          if (backendUrl) {
            this.log(`  Backend URL configured as: ${backendUrl}`, 'info');
            
            if (backendUrl !== this.backendUrl) {
              this.log(`  URL mismatch! Expected: ${this.backendUrl}`, 'warning');
            }
          } else {
            this.log(`  No BACKEND_URL found in ${configPath}`, 'warning');
          }
        }
      } else {
        this.log(`Missing ${configPath}`, 'warning');
      }
    }
  }

  generateReport() {
    console.log('\n📊 Diagnostic Report Summary\n');
    
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`✅ Successful checks: ${successCount}`);
    console.log(`❌ Failed checks: ${errorCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    
    if (errorCount > 0) {
      console.log('\n🔧 Recommended Actions:');
      
      const errors = this.results.filter(r => r.status === 'error');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
      
      console.log('\n💡 Common Solutions:');
      console.log('• Ensure backend is running: cd backend && npm run dev');
      console.log('• Check database is running and accessible');
      console.log('• Verify environment variables in backend/.env.development');
      console.log('• Check network connectivity and firewall settings');
      console.log('• Ensure test configuration matches backend URL');
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, '../diagnostic-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { successCount, errorCount, warningCount },
      details: this.results
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run diagnostic if called directly
if (require.main === module) {
  const diagnostic = new BackendDiagnostic();
  diagnostic.diagnose().catch(error => {
    console.error('Diagnostic failed:', error);
    process.exit(1);
  });
}

module.exports = BackendDiagnostic;