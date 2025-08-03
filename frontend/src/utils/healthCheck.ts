// 健康检查工具
export const healthCheck = async (): Promise<boolean> => {
  try {
    // 使用API网关的根健康检查端点，不需要认证
    const response = await fetch('/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('Backend health check:', data)
      return data.success === true
    } else {
      console.error('Backend health check failed:', response.status)
      return false
    }
  } catch (error) {
    console.error('Backend connection failed:', error)
    return false
  }
}

// 检查后端连接状态
export const checkBackendConnection = async (): Promise<void> => {
  const isHealthy = await healthCheck()
  
  if (!isHealthy) {
    console.warn('后端服务连接失败，请确保后端服务已启动在 http://localhost:3000')
  } else {
    console.log('后端服务连接正常')
  }
}