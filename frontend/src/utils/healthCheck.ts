// 健康检查工具
// 微服务健康检查配置
export interface MicroserviceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
}

// 配置各个微服务的健康检查端点
export const microservices: MicroserviceConfig[] = [
  {
    name: '认证服务',
    url: 'http://localhost:3001',
    healthEndpoint: '/health' // 根据microservices.ts中的healthCheck方法，正确的端点应该是/health
  },
  {
    name: '基础服务',
    url: 'http://localhost:3002',
    healthEndpoint: '/api/v1/base/health'
  },
  {
    name: '牛只服务',
    url: 'http://localhost:3003',
    healthEndpoint: '/api/v1/cattle/health'
  },
  {
    name: '健康服务',
    url: 'http://localhost:3005',
    healthEndpoint: '/api/v1/health/health'
  },
  {
    name: '饲喂服务',
    url: 'http://localhost:3006',
    healthEndpoint: '/api/v1/feeding/health'
  }
];

// 检查单个微服务的健康状态
export const checkSingleServiceHealth = async (service: MicroserviceConfig): Promise<{service: string, healthy: boolean, message?: string}> => {
  try {
    const fullUrl = `${service.url}${service.healthEndpoint}`;
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      // 使用 AbortController 实现超时控制
      signal: AbortSignal.timeout(3000) // 3秒超时
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`${service.name} health check:`, data);
      return {
        service: service.name,
        healthy: data.status === 'healthy' || data.healthy === true,
        message: data.message || '服务正常'
      };
    } else {
      console.error(`${service.name} health check failed:`, response.status);
      return {
        service: service.name,
        healthy: false,
        message: `HTTP ${response.status}`
      };
    }
  } catch (error: any) {
    console.error(`${service.name} connection failed:`, error.message);
    return {
      service: service.name,
      healthy: false,
      message: error.message || '连接失败'
    };
  }
};

// 检查所有微服务的健康状态
export const checkAllServicesHealth = async (): Promise<{healthy: boolean, services: Array<{service: string, healthy: boolean, message?: string}>}> => {
  const checks = await Promise.all(
    microservices.map(service => checkSingleServiceHealth(service))
  );
  
  const allHealthy = checks.every(check => check.healthy);
  
  return {
    healthy: allHealthy,
    services: checks
  };
};

// 简化的健康检查函数，用于登录页面
export const healthCheck = async (): Promise<boolean> => {
  // 为了登录页面快速响应，我们只检查认证服务是否健康
  const authService = microservices.find(s => s.name === '认证服务');
  if (!authService) {
    return false;
  }
  
  const result = await checkSingleServiceHealth(authService);
  return result.healthy;
};

// 检查后端连接状态
export const checkBackendConnection = async (): Promise<void> => {
  try {
    const isHealthy = await healthCheck()
    
    if (!isHealthy) {
      // 只在开发模式下显示警告信息，避免生产环境日志污染
      if (import.meta.env.MODE === 'development') {
        console.warn('认证服务连接失败，请确保认证服务已启动在 http://localhost:3001')
      }
    } else {
      if (import.meta.env.MODE === 'development') {
        console.log('认证服务连接正常')
      }
    }
  } catch (error) {
    // 捕获并处理所有错误，避免控制台显示完整错误堆栈
    if (import.meta.env.MODE === 'development') {
      console.warn('健康检查过程中出现错误:', error instanceof Error ? error.message : '未知错误')
    }
  }
}