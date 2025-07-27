#!/usr/bin/env node

/**
 * Quick Admin Access Test
 * Tests if admin user can access all required endpoints
 */

const axios = require('axios');

async function testAdminAccess() {
    console.log('🔐 Testing Admin Access to All Endpoints\n');

    const backendUrl = 'http://localhost:3000';
    let adminToken = null;

    // Step 1: Try to login as admin
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
            console.log(`   Permissions: ${loginResponse.data.data.permissions?.join(', ') || 'None'}`);
        } else {
            console.log('❌ Admin login failed - invalid response format');
            return;
        }
    } catch (error) {
        console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
        console.log('\n🔧 Fix: Run the admin creation script:');
        console.log('   cd backend && node create-admin-user.js');
        return;
    }

    // Step 2: Test access to all endpoints
    console.log('\n2. Testing endpoint access...');

    const endpoints = [
        { name: 'Bases', url: '/api/bases', critical: true },
        { name: 'Cattle', url: '/api/cattle', critical: true },
        { name: 'Users', url: '/api/users', critical: false },
        { name: 'Roles', url: '/api/roles', critical: false },
        { name: 'User Profile', url: '/api/auth/profile', critical: true },
        { name: 'Health Records', url: '/api/health-records', critical: false },
        { name: 'Vaccination Records', url: '/api/vaccination-records', critical: false }
    ];

    let accessibleEndpoints = 0;
    let criticalFailures = 0;

    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${backendUrl}${endpoint.url}?limit=1`, {
                headers: { Authorization: `Bearer ${adminToken}` },
                timeout: 10000
            });

            if (response.status === 200 && response.data.success) {
                console.log(`✅ ${endpoint.name}: Access granted`);

                // Show data info
                const data = response.data.data;
                if (Array.isArray(data)) {
                    console.log(`   Found ${data.length} records`);
                } else if (data && data.items) {
                    console.log(`   Found ${data.items.length} records (total: ${data.pagination?.total || 'unknown'})`);
                } else if (data) {
                    console.log(`   Data type: ${typeof data}`);
                }

                accessibleEndpoints++;
            } else {
                console.log(`⚠️ ${endpoint.name}: Unexpected response format`);
            }
        } catch (error) {
            const status = error.response?.status;
            const message = error.response?.data?.message || error.message;

            if (status === 403) {
                console.log(`❌ ${endpoint.name}: Permission denied`);
                if (endpoint.critical) criticalFailures++;
            } else if (status === 404) {
                console.log(`⚠️ ${endpoint.name}: Endpoint not found (${endpoint.url})`);
            } else {
                console.log(`❌ ${endpoint.name}: Error - ${message}`);
                if (endpoint.critical) criticalFailures++;
            }
        }
    }

    // Step 3: Test data creation (write access)
    console.log('\n3. Testing data creation access...');

    try {
        const testCattle = {
            ear_tag: `ADMIN_TEST_${Date.now()}`,
            breed: 'Admin Test Breed',
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
            console.log('✅ Data creation: Access granted');

            const cattleId = createResponse.data.data.id;
            console.log(`   Created cattle with ID: ${cattleId}`);

            // Clean up test data
            try {
                await axios.delete(`${backendUrl}/api/cattle/${cattleId}`, {
                    headers: { Authorization: `Bearer ${adminToken}` }
                });
                console.log('✅ Test data cleanup successful');
            } catch (cleanupError) {
                console.log('⚠️ Could not clean up test data (not critical)');
            }
        } else {
            console.log('❌ Data creation: Unexpected response format');
            criticalFailures++;
        }
    } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        if (status === 403) {
            console.log('❌ Data creation: Permission denied');
            criticalFailures++;
        } else {
            console.log(`❌ Data creation: Error - ${message}`);
            criticalFailures++;
        }
    }

    // Step 4: Summary and recommendations
    console.log('\n📊 Access Test Summary');
    console.log('═'.repeat(40));
    console.log(`✅ Accessible endpoints: ${accessibleEndpoints}/${endpoints.length}`);
    console.log(`❌ Critical failures: ${criticalFailures}`);

    if (criticalFailures === 0) {
        console.log('\n🎉 Admin user has proper access to all critical endpoints!');
        console.log('Your tests should now be able to access real backend data.');

        console.log('\n🧪 Next steps:');
        console.log('• Run your tests: npm test');
        console.log('• Or run specific test: npx playwright test src/contract/api-data-validation.test.ts');
    } else {
        console.log('\n🔧 Issues found! Recommended fixes:');

        if (criticalFailures > 0) {
            console.log('1. Ensure admin user has proper role and permissions:');
            console.log('   cd backend && node create-admin-user.js');
            console.log('');
            console.log('2. Check if admin role has "*" permission in database:');
            console.log('   SELECT * FROM roles WHERE name = \'admin\';');
            console.log('');
            console.log('3. Verify user is assigned to admin role:');
            console.log('   SELECT u.username, r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = \'admin\';');
        }

        console.log('\n💡 Alternative: Use the permission fix script:');
        console.log('   node scripts/fix-permissions.js');
    }

    console.log('\n📋 Test Configuration for your tests:');
    console.log('Add this to your test .env file:');
    console.log('TEST_ADMIN_USERNAME=admin');
    console.log('TEST_ADMIN_PASSWORD=Admin123');
    console.log('BACKEND_URL=http://localhost:3000');
}

// Run test if called directly
if (require.main === module) {
    testAdminAccess().catch(error => {
        console.error('Admin access test failed:', error);
        process.exit(1);
    });
}

module.exports = testAdminAccess;