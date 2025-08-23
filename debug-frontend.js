// 前端调试脚本 - 在浏览器控制台执行
// 用于调试销售订单创建页面的客户数据加载问题

console.log('🔍 开始调试客户数据加载问题...')

// 1. 检查认证状态
console.log('📋 检查认证状态:')
const token = localStorage.getItem('token')
const user = localStorage.getItem('user')
console.log('- Token存在:', !!token)
console.log('- User存在:', !!user)
if (user) {
  try {
    const userData = JSON.parse(user)
    console.log('- 用户信息:', userData)
  } catch (e) {
    console.error('- 用户数据解析失败:', e)
  }
}

// 2. 检查Sales Store状态
if (typeof window !== 'undefined' && window.__VUE__) {
  console.log('📊 检查Sales Store状态:')
  
  // 尝试获取Vue实例
  const vueDevtools = window.__VUE_DEVTOOLS_GLOBAL_HOOK__
  if (vueDevtools && vueDevtools.apps && vueDevtools.apps[0]) {
    const app = vueDevtools.apps[0]
    console.log('- Vue应用实例存在')
    
    // 检查Pinia stores
    const pinia = app.config.globalProperties.$pinia
    if (pinia) {
      console.log('- Pinia存在')
      const salesStore = pinia._s.get('sales')
      if (salesStore) {
        console.log('- Sales Store存在')
        console.log('- 客户数量:', salesStore.customers?.length || 0)
        console.log('- 客户加载状态:', salesStore.customersLoading)
        console.log('- 客户数据:', salesStore.customers)
      }
    }
  }
}

// 3. 手动测试客户API
console.log('🌐 手动测试客户API:')
fetch('/api/v1/sales/customers', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  }
})
.then(response => {
  console.log('- API响应状态:', response.status)
  return response.json()
})
.then(data => {
  console.log('- API响应数据:', data)
  if (data.success && data.data) {
    console.log('- 客户数据存在:', data.data.items?.length || '未知')
  }
})
.catch(error => {
  console.error('- API调用失败:', error)
})

// 4. 检查网络请求
console.log('📡 检查最近的网络请求:')
console.log('请查看Network面板中的以下请求:')
console.log('- /api/v1/auth/profile 或 /api/v1/auth/check')
console.log('- /api/v1/sales/customers')
console.log('- /api/v1/base/bases')

// 5. 提供修复建议
console.log('🔧 修复建议:')
console.log('1. 如果没有token，请先登录')
console.log('2. 如果API返回401，检查token是否过期')
console.log('3. 如果API返回空数据，检查数据库中是否有客户数据')
console.log('4. 检查销售服务是否正常运行')
console.log('5. 检查API网关配置是否正确')

console.log('✅ 调试完成，请查看上方输出结果')