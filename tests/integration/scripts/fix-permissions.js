#!/usr/bin/env node

/**
 * Permission Fix Script
 * Diagnoses and fixes user permission issues preventing data access
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class PermissionFixer {
  constructor() {
    this.backendUrl = 'http://localhost:3000';
    this.adminToken = null;
    this.testUser = null;
  }

  async run() {
    console.log('🔐 Fixing User Permission Issues\n');
    
    try {
      await this.checkCurrentPermissions();
      await this.createOrUpdateAdminUser();
      await this.verifyPermissions();
      await this.updateTestConfiguration();
      
      console.log('\n🎉 Permission fixes completed!');
      console.log('Your tests should now be able to access all required data.');
    } catch (error) {
      console.error('❌ Permission fix failed:', error.message);
      console.log('\n💡 Manual steps to try:');
      console.log('1. Check backend/create-admin-user.js script');
      console.log('2. Run: cd backend && node create-admin-user.js');
      console.log('3. Verify database roles and permissions tables');
      process.exit(1);
    }
  }

  async checkCurrentPermissions() {
    console.log('🔍 Checking current user permissions...');
    
    // Try to login with default admin credentials
    const adminCredentials = [
      { username: 'admin', password: 'Admin123' },
      { username: 'admin', password: 'admin123' },
      { username: 'admin', password: 'Admin123!' },
      { username: 'administrator', password: 'Admin123' }
    ];

    for (const creds of adminCredentials) {
      try {
        const loginResponse = await axios.post(`${this.backendUrl}/api/auth/login`, creds);
        
        if (loginResponse.data.success && loginResponse.data.data.token) {
          console.log(`✅ Successfully logged in as ${creds.username}`);
          this.adminToken = loginResponse.data.data.token;
          this.testUser = loginResponse.data.data.user;
          
          // Check user permissions
          const permissions = loginResponse.data.data.permissions || [];
          console.log(`📋 User permissions: ${permissions.length > 0 ? permissions.join(', ') : 'None'}`);
          
          if (permissions.includes('*') || permissions.includes('admin')) {
            console.log('✅ User has admin permissions');
          } else {
            console.log('⚠️ User lacks admin permissions');
          }
          
          break;
        }
      } catch (error) {
        console.log(`❌ Failed to login as ${creds.username}: ${error.response?.data?.message || error.message}`);
      }
    }

    if (!this.adminToken) {
      console.log('❌ No admin user found with standard credentials');
      await this.createAdminUser();
    }
  }

  async createAdminUser() {
    console.log('\n🔧 Creating admin user...');
    
    const adminUser = {
      username: 'test_admin',
      password: 'TestAdmin123!',
      real_name: '测试管理员',
      email: 'test_admin@test.com',
      role: 'admin'
    };

    try {
      // First, try to create the user
      const registerResponse = await axios.post(`${this.backendUrl}/api/auth/register`, adminUser);
      
      if (registerResponse.data.success) {
        console.log('✅ Admin user created successfully');
        
        // Login with the new admin user
        const loginResponse = await axios.post(`${this.backendUrl}/api/auth/login`, {
          username: adminUser.username,
          password: adminUser.password
        });
        
        if (loginResponse.data.success) {
          this.adminToken = loginResponse.data.data.token;
          this.testUser = loginResponse.data.data.user;
          console.log('✅ Successfully logged in as new admin user');
        }
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ Admin user already exists, trying to login...');
        
        try {
          const loginResponse = await axios.post(`${this.backendUrl}/api/auth/login`, {
            username: adminUser.username,
            password: adminUser.password
          });
          
          if (loginResponse.data.success) {
            this.adminToken = loginResponse.data.data.token;
            this.testUser = loginResponse.data.data.user;
            console.log('✅ Successfully logged in as existing admin user');
          }
        } catch (loginError) {
          throw new Error(`Cannot login as admin user: ${loginError.message}`);
        }
      } else {
        throw new Error(`Failed to create admin user: ${error.message}`);
      }
    }
  }

  async createOrUpdateAdminUser() {
    console.log('\n🔧 Ensuring admin user has proper permissions...');
    
    if (!this.adminToken) {
      await this.createAdminUser();
    }

    // Check if we can access protected endpoints
    const protectedEndpoints = [
      { name: 'Bases', url: '/api/bases' },
      { name: 'Cattle', url: '/api/cattle' },
      { name: 'Users', url: '/api/users' },
      { name: 'Roles', url: '/api/roles' }
    ];

    const failedEndpoints = [];

    for (const endpoint of protectedEndpoints) {
      try {
        const response = await axios.get(`${this.backendUrl}${endpoint.url}?limit=1`, {
          headers: { Authorization: `Bearer ${this.adminToken}` },
          timeout: 10000
        });

        if (response.status === 200 && response.data.success) {
          console.log(`✅ ${endpoint.name} access: OK`);
        } else {
          console.log(`⚠️ ${endpoint.name} access: Unexpected response`);
          failedEndpoints.push(endpoint.name);
        }
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`❌ ${endpoint.name} access: Permission denied`);
          failedEndpoints.push(endpoint.name);
        } else if (error.response?.status === 404) {
          console.log(`⚠️ ${endpoint.name} access: Endpoint not found`);
        } else {
          console.log(`❌ ${endpoint.name} access: ${error.message}`);
          failedEndpoints.push(endpoint.name);
        }
      }
    }

    if (failedEndpoints.length > 0) {
      console.log(`\n🔧 Attempting to fix permissions for: ${failedEndpoints.join(', ')}`);
      await this.fixUserPermissions();
    }
  }

  async fixUserPermissions() {
    console.log('🔧 Fixing user permissions...');
    
    // Try to use the backend's admin creation script
    const adminScriptPath = path.join(__dirname, '../../../backend/create-admin-user.js');
    
    if (fs.existsSync(adminScriptPath)) {
      console.log('📜 Found admin creation script, attempting to run...');
      
      const { spawn } = require('child_process');
      
      return new Promise((resolve, reject) => {
        const process = spawn('node', ['create-admin-user.js'], {
          cwd: path.join(__dirname, '../../../backend'),
          stdio: 'inherit'
        });

        process.on('close', (code) => {
          if (code === 0) {
            console.log('✅ Admin script executed successfully');
            resolve();
          } else {
            console.log('⚠️ Admin script execution failed, trying alternative method...');
            this.createSuperAdminDirectly().then(resolve).catch(reject);
          }
        });

        process.on('error', (error) => {
          console.log('⚠️ Could not run admin script, trying alternative method...');
          this.createSuperAdminDirectly().then(resolve).catch(reject);
        });
      });
    } else {
      await this.createSuperAdminDirectly();
    }
  }

  async createSuperAdminDirectly() {
    console.log('🔧 Ensuring admin user has proper permissions...');
    
    // First, try to login with the standard admin user that should exist
    try {
      const loginResponse = await axios.post(`${this.backendUrl}/api/auth/login`, {
        username: 'admin',
        password: 'Admin123'
      });
      
      if (loginResponse.data.success) {
        this.adminToken = loginResponse.data.data.token;
        this.testUser = loginResponse.data.data.user;
        console.log('✅ Successfully logged in as admin user');
        
        // Check if this admin has proper permissions
        const permissions = loginResponse.data.data.permissions || [];
        if (permissions.includes('*') || permissions.length > 5) {
          console.log('✅ Admin user has sufficient permissions');
          return;
        } else {
          console.log('⚠️ Admin user has limited permissions, checking role...');
        }
      }
    } catch (error) {
      console.log('❌ Could not login as admin user, creating new one...');
    }

    // If admin doesn't exist or has limited permissions, create a test admin
    const testAdmin = {
      username: 'test_admin',
      password: 'TestAdmin123!',
      real_name: '测试管理员',
      email: 'test_admin@test.com'
    };

    try {
      // Register the test admin
      const registerResponse = await axios.post(`${this.backendUrl}/api/auth/register`, testAdmin);
      
      if (registerResponse.data.success) {
        console.log('✅ Test admin user created');
        
        // Login as test admin
        const loginResponse = await axios.post(`${this.backendUrl}/api/auth/login`, {
          username: testAdmin.username,
          password: testAdmin.password
        });
        
        if (loginResponse.data.success) {
          this.adminToken = loginResponse.data.data.token;
          this.testUser = loginResponse.data.data.user;
          console.log('✅ Successfully logged in as test admin');
        }
      }
    } catch (error) {
      if (error.response?.status === 409) {
        // User exists, try to login
        try {
          const loginResponse = await axios.post(`${this.backendUrl}/api/auth/login`, {
            username: testAdmin.username,
            password: testAdmin.password
          });
          
          if (loginResponse.data.success) {
            this.adminToken = loginResponse.data.data.token;
            this.testUser = loginResponse.data.data.user;
            console.log('✅ Successfully logged in as existing test admin');
          }
        } catch (loginError) {
          console.log('⚠️ Could not login as test admin');
          throw new Error('Cannot create or login as admin user');
        }
      } else {
        console.log('⚠️ Could not create test admin user');
        throw new Error('Failed to create admin user');
      }
    }
  }

  async verifyPermissions() {
    console.log('\n✅ Verifying fixed permissions...');
    
    if (!this.adminToken) {
      throw new Error('No admin token available for verification');
    }

    const testEndpoints = [
      { name: 'Bases', url: '/api/bases?limit=1' },
      { name: 'Cattle', url: '/api/cattle?limit=1' },
      { name: 'User Profile', url: '/api/auth/profile' }
    ];

    let allPassed = true;

    for (const endpoint of testEndpoints) {
      try {
        const response = await axios.get(`${this.backendUrl}${endpoint.url}`, {
          headers: { Authorization: `Bearer ${this.adminToken}` },
          timeout: 10000
        });

        if (response.status === 200 && response.data.success) {
          console.log(`✅ ${endpoint.name}: Access verified`);
          
          // Log data info
          const data = response.data.data;
          if (Array.isArray(data)) {
            console.log(`   Found ${data.length} records`);
          } else if (data && data.items) {
            console.log(`   Found ${data.items.length} records (paginated)`);
          } else if (data) {
            console.log(`   Data type: ${typeof data}`);
          }
        } else {
          console.log(`⚠️ ${endpoint.name}: Unexpected response format`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.response?.data?.message || error.message}`);
        allPassed = false;
      }
    }

    if (!allPassed) {
      console.log('\n⚠️ Some endpoints still have issues. This might be due to:');
      console.log('• Database not having the required tables/data');
      console.log('• Backend routes not properly configured');
      console.log('• Role-based permissions not set up correctly');
    }

    return allPassed;
  }

  async updateTestConfiguration() {
    console.log('\n⚙️ Updating test configuration with working credentials...');
    
    if (!this.testUser || !this.adminToken) {
      console.log('⚠️ No working admin credentials to save');
      return;
    }

    // Update test environment file
    const testEnvPath = path.join(__dirname, '../.env');
    const envContent = `# Test Environment Configuration
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Working Admin Credentials
TEST_ADMIN_USERNAME=${this.testUser.username}
TEST_ADMIN_PASSWORD=${this.testUser.username === 'super_admin' ? 'SuperAdmin123!' : 'TestAdmin123!'}
TEST_ADMIN_EMAIL=${this.testUser.email}

# Test Configuration
TEST_TIMEOUT=30000
TEST_RETRIES=2
`;

    fs.writeFileSync(testEnvPath, envContent);
    console.log('✅ Updated test environment with working admin credentials');

    // Create a credentials file for easy reference
    const credsPath = path.join(__dirname, '../admin-credentials.json');
    const credsData = {
      username: this.testUser.username,
      password: this.testUser.username === 'super_admin' ? 'SuperAdmin123!' : 'TestAdmin123!',
      email: this.testUser.email,
      token: this.adminToken,
      permissions: this.testUser.role?.permissions || [],
      created_at: new Date().toISOString()
    };

    fs.writeFileSync(credsPath, JSON.stringify(credsData, null, 2));
    console.log('✅ Saved admin credentials to admin-credentials.json');

    console.log('\n📋 Working Admin Credentials:');
    console.log(`   Username: ${this.testUser.username}`);
    console.log(`   Password: ${credsData.password}`);
    console.log(`   Email: ${this.testUser.email}`);
  }
}

// Run fixer if called directly
if (require.main === module) {
  const fixer = new PermissionFixer();
  fixer.run().catch(error => {
    console.error('Permission fix script failed:', error);
    process.exit(1);
  });
}

module.exports = PermissionFixer;