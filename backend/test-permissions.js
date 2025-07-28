// 权限系统测试脚本
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testPermissions() {
  console.log('🔍 开始测试权限系统...\n');

  try {
    // 1. 测试admin登录
    console.log('1. 测试admin用户登录...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'Admin123'
    });
    
    if (adminLogin.data.success) {
      console.log('✅ Admin登录成功');
      const adminToken = adminLogin.data.data.token;
      
      // 2. 测试获取角色列表
      console.log('\n2. 测试获取角色列表...');
      const rolesResponse = await axios.get(`${API_BASE}/roles`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (rolesResponse.data.success) {
        console.log('✅ 获取角色列表成功');
        console.log(`   角色数量: ${rolesResponse.data.data.roles.length}`);
      } else {
        console.log('❌ 获取角色列表失败');
      }
      
      // 3. 测试创建角色
      console.log('\n3. 测试创建角色...');
      const createRoleResponse = await axios.post(`${API_BASE}/roles`, {
        name: '测试角色_' + Date.now(),
        description: '这是一个测试角色',
        permissions: ['cattle:read', 'health:read']
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (createRoleResponse.data.success) {
        console.log('✅ 创建角色成功');
        console.log(`   角色ID: ${createRoleResponse.data.data.role.id}`);
      } else {
        console.log('❌ 创建角色失败:', createRoleResponse.data.error?.message);
      }
      
      // 4. 测试获取用户列表
      console.log('\n4. 测试获取用户列表...');
      const usersResponse = await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (usersResponse.data.success) {
        console.log('✅ 获取用户列表成功');
        console.log(`   用户数量: ${usersResponse.data.data.users.length}`);
      } else {
        console.log('❌ 获取用户列表失败');
      }
      
      // 5. 测试操作日志
      console.log('\n5. 测试获取操作日志...');
      const logsResponse = await axios.get(`${API_BASE}/operation-logs`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (logsResponse.data.success) {
        console.log('✅ 获取操作日志成功');
        console.log(`   日志数量: ${logsResponse.data.data.logs?.length || 0}`);
      } else {
        console.log('❌ 获取操作日志失败:', logsResponse.data.error?.message);
      }
      
    } else {
      console.log('❌ Admin登录失败');
    }
    
    // 6. 测试基地管理员登录（如果存在）
    console.log('\n6. 测试基地管理员登录...');
    try {
      const managerLogin = await axios.post(`${API_BASE}/auth/login`, {
        username: 'manager_east',
        password: 'Manager123'
      });
      
      if (managerLogin.data.success) {
        console.log('✅ 基地管理员登录成功');
        const managerToken = managerLogin.data.data.token;
        
        // 测试基地管理员权限
        const managerRolesResponse = await axios.get(`${API_BASE}/roles`, {
          headers: { Authorization: `Bearer ${managerToken}` }
        });
        
        if (managerRolesResponse.data.success) {
          console.log('✅ 基地管理员可以访问角色列表');
        } else {
          console.log('❌ 基地管理员无法访问角色列表（这是正确的）');
        }
      } else {
        console.log('ℹ️  基地管理员用户不存在或密码错误');
      }
    } catch (error) {
      console.log('ℹ️  基地管理员测试跳过（用户可能不存在）');
    }
    
  } catch (error) {
    console.log('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.log('   错误详情:', error.response.data);
    }
  }
  
  console.log('\n🏁 权限系统测试完成');
}

// 运行测试
testPermissions();