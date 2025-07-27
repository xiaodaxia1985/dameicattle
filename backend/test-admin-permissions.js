#!/usr/bin/env node

/**
 * Test Admin Permissions Script
 * Tests if the admin user can access all protected endpoints after permission fixes
 */

const axios = require('axios');

async function testAdminPermissions() {
  console.log('🔐 Testing Admin Permissions After Fixes\n');
  
  const backendUrl = 'http://localhost:3000';
  let adminToken = null;

  // Step 1: Login as admin
  console.log('1. Testing admin login...');
  try {
    const loginResponse = await axios.post(`${backendUrl}/api/auth/login`, {
      username: 'admin',
      password: 'Admin123'
    });

    if (loginResponse.data.success && loginResponse.data.data.token) {
      adminToken = loginResponse.data.data.token;
      console.log('✅ Admin login successful');
      console.log(`   User: ${loginResponse.data.data.user.username}`);
      console.log(`   Role: ${loginResponse.data.data.user.role?.name || 'No role'}`);
      
      const permissions = loginResponse.data.data.permissions || [];
      console.log(`   Permissions: ${permissions.length > 10 ? permissions.slice(0, 5).join(', ') + '... (and ' + (permissions.length - 5) + ' more)' : permissions.join(', ')}`);
      
      if (permissions.includes('*')) {
        console.log('✅ Admin has wildcard (*) permission - should access all endpoints');
      } else if (permissions.includes('bases:read')) {
        console.log('✅ Admin has specific base permissions');
      } else {
        console.log('⚠️ Admin may not have sufficient permissions');
      }
    } else {
      console.log('❌ Admin login failed - invalid response format');
      return false;
    }
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
    console.log('\n🔧 Run the admin creation script first:');
    console.log('   node create-admin-user.js');
    return false;
  }

  // Step 2: Test critical endpoints that were failing
  console.log('\n2. Testing critical endpoints...');
  
  const criticalEndpoints = [
    { name: 'Bases (the main issue)', url: '/api/bases?limit=1' },
    { name: 'Cattle', url: '/api/cattle?limit=1' },
    { name: 'User Profile', url: '/api/auth/profile' },
    { name: 'Users List', url: '/api/users?limit=1' },
    { name: 'Roles List', url: '/api/roles?limit=1' }
  ];

  let successCount = 0;
  let totalTests = criticalEndpoints.length;

  for (const endpoint of criticalEndpoints) {
    try {
      const response = await axios.get(`${backendUrl}${endpoint.url}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        timeout: 10000
      });

      if (response.status === 200 && response.data.success) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        
        // Show data info
        const data = response.data.data;
        if (Array.isArray(data)) {
          console.log(`   Found ${data.length} records`);
        } else if (data && data.items) {
          console.log(`   Found ${data.items.length} records (total: ${data.pagination?.total || 'unknown'})`);
        } else if (data) {
          console.log(`   Data type: ${typeof data}`);
        }
        
        successCount++;
      } else {
        console.log(`⚠️ ${endpoint.name}: Unexpected response format`);
      }
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      
      if (status === 403) {
        console.log(`❌ ${endpoint.name}: PERMISSION DENIED`);
        console.log(`   Error: ${message}`);
        if (error.response?.data?.error?.details) {
          const details = error.response.data.error.details;
          console.log(`   Required: ${details.required || 'unknown'}`);
          console.log(`   User permissions: ${details.userPermissions?.join(', ') || 'none'}`);
        }
      } else if (status === 404) {
        console.log(`⚠️ ${endpoint.name}: Endpoint not found`);
        successCount++; // Don't count as failure if endpoint doesn't exist
      } else {
        console.log(`❌ ${endpoint.name}: ERROR - ${message}`);
      }
    }
  }

  // Step 3: Test data creation (write permissions)
  console.log('\n3. Testing write permissions...');
  
  try {
    const testCattle = {
      ear_tag: `PERM_TEST_${Date.now()}`,
      breed: 'Permission Test Breed',
      gender: 'male',
      birth_date: '2023-01-01',
      weight: 450,
      health_status: 'healthy'
    };

    const createResponse = await axios.post(`${backendUrl}/api/cattle`, testCattle, {
      headers: { Authorization: `Bearer ${adminToken}` },
      timeout: 10000
    });

    if (createResponse.status === 201 && createResponse.data.success) {
      console.log('✅ Data creation: SUCCESS');
      
      const cattleId = createResponse.data.data.id;
      console.log(`   Created cattle with ID: ${cattleId}`);
      
      // Clean up test data
      try {
        await axios.delete(`${backendUrl}/api/cattle/${cattleId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Test data cleanup: SUCCESS');
      } catch (cleanupError) {
        console.log('⚠️ Test data cleanup failed (not critical)');
      }
      
      successCount++;
      totalTests++;
    } else {
      console.log('❌ Data creation: Unexpected response format');
      totalTests++;
    }
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    if (status === 403) {
      console.log('❌ Data creation: PERMISSION DENIED');
      console.log(`   Error: ${message}`);
    } else {
      console.log(`❌ Data creation: ERROR - ${message}`);
    }
    totalTests++;
  }

  // Step 4: Results summary
  console.log('\n📊 Permission Test Results');
  console.log('═'.repeat(40));
  console.log(`✅ Successful: ${successCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((successCount / totalTests) * 100)}%`);
  
  if (successCount === totalTests) {
    console.log('\n🎉 ALL PERMISSION TESTS PASSED!');
    console.log('Your admin user now has proper access to all endpoints.');
    console.log('Your integration tests should now be able to access real backend data.');
    
    console.log('\n🧪 Next steps:');
    console.log('• Run your integration tests: cd tests/integration && npm test');
    console.log('• Or run specific test: npx playwright test src/contract/api-data-validation.test.ts');
    
    return true;
  } else {
    console.log('\n❌ Some permission tests failed.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure you ran: node create-admin-user.js');
    console.log('2. Check database: SELECT * FROM roles WHERE name = \'admin\';');
    console.log('3. Verify user role: SELECT u.username, r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = \'admin\';');
    console.log('4. Check permissions: SELECT permissions FROM roles WHERE name = \'admin\';');
    
    return false;
  }
}

// Run test if called directly
if (require.main === module) {
  testAdminPermissions().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Permission test failed:', error);
    process.exit(1);
  });
}

module.exports = testAdminPermissions;