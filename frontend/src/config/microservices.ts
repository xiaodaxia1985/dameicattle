/**
 * 微服务配置文件
 * 统一管理所有微服务的端点和配置
 */

export interface MicroserviceConfig {
  name: string
  port: number
  baseUrl: string
  healthEndpoint: string
  timeout: number
  retryAttempts: number
}

// 微服务配置映射
export const MICROSERVICE_CONFIGS: Record<string, MicroserviceConfig> = {
  auth: {
    name: 'auth-service',
    port: 3001,
    baseUrl: '/api/v1/auth',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  base: {
    name: 'base-service',
    port: 3002,
    baseUrl: '/api/v1/base',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  cattle: {
    name: 'cattle-service',
    port: 3003,
    baseUrl: '/api/v1/cattle',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  health: {
    name: 'health-service',
    port: 3004,
    baseUrl: '/api/v1/health',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  feeding: {
    name: 'feeding-service',
    port: 3005,
    baseUrl: '/api/v1/feeding',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  equipment: {
    name: 'equipment-service',
    port: 3006,
    baseUrl: '/api/v1/equipment',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  procurement: {
    name: 'procurement-service',
    port: 3007,
    baseUrl: '/api/v1/procurement',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  sales: {
    name: 'sales-service',
    port: 3008,
    baseUrl: '/api/v1/sales',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  material: {
    name: 'material-service',
    port: 3009,
    baseUrl: '/api/v1/material',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  cation: {
    name: 'notification-service',
    port: 3010,
    baseUrl: '/api/v1/notification',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  file: {
    name: 'file-service',
    port: 3011,
    baseUrl: '/api/v1/file',
    healthEndpoint: '/health',
    timeout: 15000,
    retryAttempts: 2
  },
  monitoring: {
    name: 'monitoring-service',
    port: 3012,
    baseUrl: '/api/v1/monitoring',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  news: {
    name: 'news-service',
    port: 3013,
    baseUrl: '/api/v1/news',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  }
}

// 获取微服务配置
export function getMicroserviceConfig(serviceName: string): MicroserviceConfig | null {
  return MICROSERVICE_CONFIGS[serviceName] || null
}

// 获取所有微服务配置
export function getAllMicroserviceConfigs(): MicroserviceConfig[] {
  return Object.values(MICROSERVICE_CONFIGS)
}

// 检查微服务是否可用
export async function checkMicroserviceHealth(serviceName: string): Promise<boolean> {
  const config = getMicroserviceConfig(serviceName)
  if (!config) return false
  
  try {
    const response = await fetch(`${config.baseUrl}${config.healthEndpoint}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch (error) {
    console.error(`微服务 ${serviceName} 健康检查失败:`, error)
    return false
  }
}

// 批量检查所有微服务健康状态
export async function checkAllMicroservicesHealth(): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}
  const checks = Object.keys(MICROSERVICE_CONFIGS).map(async (serviceName) => {
    results[serviceName] = await checkMicroserviceHealth(serviceName)
  })
  
  await Promise.all(checks)
  return results
}

export default MICROSERVICE_CONFIGS