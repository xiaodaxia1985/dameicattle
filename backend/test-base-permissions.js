// 测试基地权限分离
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testBasePermissions() {
  console.log('🔍 开始测试基地权限分离...\n');

  try {
    // 1. 测试超级管理员登录
    console.log('1. 测试超级管理员登录...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'Admin123'
    });
    
    if (adminLogin.data.success) {
      console.log('✅ 超级管理员登录成功');
      const adminToken = adminLogin.data.data.token;
      console.log(`   权限数量: ${adminLogin.data.data.permissions.length}`);
      console.log(`   基地ID: ${adminLogin.data.data.user.base_id}`);
      
      // 测试超级管理员获取用户列表
      const adminUsersResponse = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (adminUsersResponse.data.success) {
        console.log(`✅ 超级管理员可以看到 ${adminUsersResponse.data.data.users.length} 个用户（所有基地）`);
      }
    }
    
    // 2. 测试东区基地管理员登录
    console.log('\n2. 测试东区基地管理员登录...');
    const eastManagerLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'manager_east',
      password: 'Manager123'
    });
    
    if (eastManagerLogin.data.success) {
      console.log('✅ 东区基地管理员登录成功');
      const eastToken = eastManagerLogin.data.data.token;
      console.log(`   权限数量: ${eastManagerLogin.data.data.permissions.length}`);
      console.log(`   基地ID: ${eastManagerLogin.data.data.user.base_id}`);
      
      // 测试基地管理员获取用户列表（应该只看到自己基地的用户）
      const eastUsersResponse = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${eastToken}` }
      });
      
      if (eastUsersResponse.data.success) {
        console.log(`✅ 东区基地管理员可以看到 ${eastUsersResponse.data.data.users.length} 个用户（仅东区基地）`);
        eastUsersResponse.data.data.users.forEach(user => {
          console.log(`   - ${user.username} (基地ID: ${user.base_id})`);
        });
      }
      
      // 测试基地管理员是否能访问角色管理（应该失败）
      try {
        const eastRolesResponse = await axios.get(`${API_BASE}/roles`, {
          headers: { Authorization: `Bearer ${eastToken}` }
        });
        console.log('❌ 东区基地管理员不应该能访问角色管理');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ 东区基地管理员正确被拒绝访问角色管理');
        } else {
          console.log('⚠️  东区基地管理员访问角色管理时出现其他错误:', error.response?.status);
        }
      }
    }
    
    // 3. 测试西区基地管理员登录
    console.log('\n3. 测试西区基地管理员登录...');
    const westManagerLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'manager_west',
      password: 'Manager123'
    });
    
    if (westManagerLogin.data.success) {
      console.log('✅ 西区基地管理员登录成功');
      const westToken = westManagerLogin.data.data.token;
      console.log(`   权限数量: ${westManagerLogin.data.data.permissions.length}`);
      console.log(`   基地ID: ${westManagerLogin.data.data.user.base_id}`);
      
      // 测试基地管理员获取用户列表（应该只看到自己基地的用户）
      const westUsersResponse = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${westToken}` }
      });
      
      if (westUsersResponse.data.success) {
        console.log(`✅ 西区基地管理员可以看到 ${westUsersResponse.data.data.users.length} 个用户（仅西区基地）`);
        westUsersResponse.data.data.users.forEach(user => {
          console.log(`   - ${user.username} (基地ID: ${user.base_id})`);
        });
      }
    }
    
    // 4. 测试兽医权限
    console.log('\n4. 测试兽医权限...');
    const vetLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'vet_east',
      password: 'Vet123'
    });
    
    if (vetLogin.data.success) {
      console.log('✅ 兽医登录成功');
      const vetToken = vetLogin.data.data.token;
      console.log(`   权限数量: ${vetLogin.data.data.permissions.length}`);
      console.log(`   基地ID: ${vetLogin.data.data.user.base_id}`);
      
      // 测试兽医是否能访问用户管理（应该失败）
      try {
        const vetUsersResponse = await axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${vetToken}` }
        });
        console.log('❌ 兽医不应该能访问用户管理');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ 兽医正确被拒绝访问用户管理');
        } else {
          console.log('⚠️  兽医访问用户管理时出现其他错误:', error.response?.status);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.log('   错误详情:', error.response.data);
    }
  }
  
  console.log('\n🏁 基地权限分离测试完成');
}

// 运行测试
testBasePermissions();