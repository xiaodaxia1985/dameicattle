const axios = require('axios');

// 测试健康管理API
async function testHealthAPI() {
  const baseURL = 'http://localhost:3000/api/v1';
  
  try {
    console.log('测试健康管理API路由...');
    
    // 测试获取健康记录（不带认证，应该返回401）
    try {
      const response = await axios.get(`${baseURL}/health/records`);
      console.log('❌ 未预期的成功响应:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 健康记录路由存在，正确返回401未授权');
      } else {
        console.log('❌ 意外错误:', error.message);
      }
    }
    
    // 测试获取疫苗记录（不带认证，应该返回401）
    try {
      const response = await axios.get(`${baseURL}/health/vaccinations`);
      console.log('❌ 未预期的成功响应:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 疫苗记录路由存在，正确返回401未授权');
      } else {
        console.log('❌ 意外错误:', error.message);
      }
    }
    
    // 测试获取健康统计（不带认证，应该返回401）
    try {
      const response = await axios.get(`${baseURL}/health/statistics`);
      console.log('❌ 未预期的成功响应:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 健康统计路由存在，正确返回401未授权');
      } else {
        console.log('❌ 意外错误:', error.message);
      }
    }
    
    // 测试获取健康预警（不带认证，应该返回401）
    try {
      const response = await axios.get(`${baseURL}/health/alerts`);
      console.log('❌ 未预期的成功响应:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 健康预警路由存在，正确返回401未授权');
      } else {
        console.log('❌ 意外错误:', error.message);
      }
    }
    
    console.log('\n✅ 健康管理API路由测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:3000/api/v1/system-health');
    console.log('✅ 服务器正在运行');
    return true;
  } catch (error) {
    console.log('❌ 服务器未运行，请先启动后端服务');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testHealthAPI();
  }
}

main();