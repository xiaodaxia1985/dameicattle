// 调试工具
export const debugInfo = {
  // 检查当前环境
  environment: import.meta.env.MODE,
  
  // 检查API配置
  apiBaseUrl: '/api/v1',
  
  // 检查认证状态
  getAuthStatus() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    const permissions = localStorage.getItem('permissions')
    
    return {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      hasUser: !!user,
      hasPermissions: !!permissions,
      user: user ? JSON.parse(user) : null,
      permissions: permissions ? JSON.parse(permissions) : []
    }
  },
  
  // 测试API连接
  async testApiConnection() {
    try {
      const response = await fetch('/api/v1/health')
      const data = await response.json()
      return {
        success: true,
        status: response.status,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },
  
  // 测试认证API
  async testAuthApi() {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/users/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      return {
        success: response.ok,
        status: response.status,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },
  
  // 打印完整调试信息
  async printDebugInfo() {
    console.group('🔍 系统调试信息')
    
    console.log('环境信息:', this.environment)
    console.log('API基础URL:', this.apiBaseUrl)
    
    const authStatus = this.getAuthStatus()
    console.log('认证状态:', authStatus)
    
    const apiTest = await this.testApiConnection()
    console.log('API连接测试:', apiTest)
    
    if (authStatus.hasToken) {
      const authTest = await this.testAuthApi()
      console.log('认证API测试:', authTest)
    }
    
    console.groupEnd()
  }
}

// 在开发环境下暴露到全局
if (import.meta.env.MODE === 'development') {
  (window as any).debugInfo = debugInfo
}