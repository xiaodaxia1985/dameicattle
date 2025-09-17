/**
 * API Configuration for different environments
 * Supports web and miniprogram environments with environment-specific settings
 */

export interface ApiEnvironmentConfig {
  baseURL: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  enableLogging: boolean
  enableErrorReporting: boolean
  enablePerformanceMonitoring: boolean
  headers?: Record<string, string>
}

export interface EnvironmentConfigs {
  development: ApiEnvironmentConfig
  production: ApiEnvironmentConfig
  test: ApiEnvironmentConfig
}

// Environment detection
const isUniApp = typeof window !== 'undefined' && 'uni' in window
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

// 微服务直连配置
export const microserviceUrls = {
  auth: 'http://localhost:3001',
  base: 'http://localhost:3002', 
  cattle: 'http://localhost:3003',
  health: 'http://localhost:3004',
  feeding: 'http://localhost:3005',
  equipment: 'http://localhost:3006',
  procurement: 'http://localhost:3007',
  sales: 'http://localhost:3008',
  material: 'http://localhost:3009',
  notification: 'http://localhost:3010',
  file: 'http://localhost:3011',
  monitoring: 'http://localhost:3012',
  news: 'http://localhost:3013'
}

// Base configurations for different environments
// Add export keyword to make this function accessible from other files
export const getBaseURL = () => {
  // 优先使用环境变量配置
  if (import.meta.env.VITE_API_GATEWAY_URL) {
    return import.meta.env.VITE_API_GATEWAY_URL
  }
  // 否则使用默认配置：开发/测试/生产都统一走网关前缀 /api/v1
  return '/api/v1'
}

export const environmentConfigs: EnvironmentConfigs = {
  development: {
    baseURL: getBaseURL(),
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: import.meta.env.VITE_ENABLE_API_LOGGING === 'true' || true,
    headers: {
      'X-Environment': 'development'
    }
  },
  production: {
    baseURL: getBaseURL(),
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 15000,
    retryAttempts: 2,
    retryDelay: 2000,
    enableLogging: import.meta.env.VITE_ENABLE_API_LOGGING === 'true' || false,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    headers: {
      'X-Environment': 'production'
    }
  },
  test: {
    baseURL: getBaseURL() || (isUniApp ? 'http://localhost:3001/api/v1' : '/api/v1'),
    timeout: 5000,
    retryAttempts: 1,
    retryDelay: 500,
    enableLogging: false,
    enableErrorReporting: false,
    enablePerformanceMonitoring: false,
    headers: {
      'X-Environment': 'test'
    }
  }
}

// Platform-specific configurations
export const platformConfigs = {
  web: {
    // Web-specific headers and settings
    headers: {
      'X-Platform': 'web',
      'X-Client-Version': '1.0.0'
    },
    // Web-specific timeout adjustments
    timeoutMultiplier: 1.0
  },
  miniprogram: {
    // Miniprogram-specific headers and settings
    headers: {
      'X-Platform': 'miniprogram',
      'X-Client-Version': '1.0.0'
    },
    // Miniprogram typically needs longer timeouts
    timeoutMultiplier: 1.5
  }
}

// Get current environment
export function getCurrentEnvironment(): keyof EnvironmentConfigs {
  if (isProduction) return 'production'
  if (isTest) return 'test'
  return 'development'
}

// Get current platform
export function getCurrentPlatform(): keyof typeof platformConfigs {
  return isUniApp ? 'miniprogram' : 'web'
}

// Get merged configuration for current environment and platform
export function getApiConfig(): ApiEnvironmentConfig {
  const environment = getCurrentEnvironment()
  const platform = getCurrentPlatform()
  
  const envConfig = environmentConfigs[environment]
  const platformConfig = platformConfigs[platform]
  
  return {
    ...envConfig,
    timeout: Math.round(envConfig.timeout * platformConfig.timeoutMultiplier),
    headers: {
      ...envConfig.headers,
      ...platformConfig.headers
    }
  }
}

// Feature flags for different environments
export const featureFlags = {
  development: {
    enableMockData: true,
    enableDebugMode: true,
    enableTestEndpoints: true,
    skipAuthValidation: false
  },
  production: {
    enableMockData: false,
    enableDebugMode: false,
    enableTestEndpoints: false,
    skipAuthValidation: false
  },
  test: {
    enableMockData: true,
    enableDebugMode: false,
    enableTestEndpoints: true,
    skipAuthValidation: true
  }
}

// Get feature flags for current environment
export function getFeatureFlags() {
  const environment = getCurrentEnvironment()
  return featureFlags[environment]
}

// API endpoints configuration - 直连微服务
export const apiEndpoints = {
  // Authentication - 直连3001端口
  auth: {
    login: `${microserviceUrls.auth}/login`,
    logout: `${microserviceUrls.auth}/logout`,
    refresh: `${microserviceUrls.auth}/refresh`,
    profile: `${microserviceUrls.auth}/profile`
  },
  
  // Base management - 直连3002端口
  bases: {
    list: `${microserviceUrls.base}/bases`,
    detail: (id: number) => `${microserviceUrls.base}/bases/${id}`,
    create: `${microserviceUrls.base}/bases`,
    update: (id: number) => `${microserviceUrls.base}/bases/${id}`,
    delete: (id: number) => `${microserviceUrls.base}/bases/${id}`,
    statistics: (id: number) => `${microserviceUrls.base}/bases/${id}/statistics`
  },
  
  // Barn management - 直连3002端口
  barns: {
    list: `${microserviceUrls.base}/barns`,
    detail: (id: number) => `${microserviceUrls.base}/barns/${id}`,
    create: `${microserviceUrls.base}/barns`,
    update: (id: number) => `${microserviceUrls.base}/barns/${id}`,
    delete: (id: number) => `${microserviceUrls.base}/barns/${id}`,
    byBase: (baseId: number) => `${microserviceUrls.base}/bases/${baseId}/barns`
  },
  
  // Cattle management - 直连3003端口
  cattle: {
    list: `${microserviceUrls.cattle}/cattle`,
    detail: (id: number) => `${microserviceUrls.cattle}/cattle/${id}`,
    create: `${microserviceUrls.cattle}/cattle`,
    update: (id: number) => `${microserviceUrls.cattle}/cattle/${id}`,
    delete: (id: number) => `${microserviceUrls.cattle}/cattle/${id}`,
    health: (id: number) => `${microserviceUrls.cattle}/cattle/${id}/health`
  },
  
  // Health monitoring - 直连3004端口
  health: {
    system: `${microserviceUrls.health}/health`,
    database: `${microserviceUrls.health}/health/database`,
    redis: `${microserviceUrls.health}/health/redis`,
    services: `${microserviceUrls.health}/health/services`
  },
  
  // File upload - 直连3011端口
  upload: {
    single: `${microserviceUrls.file}/upload/single`,
    multiple: `${microserviceUrls.file}/upload/multiple`,
    avatar: `${microserviceUrls.file}/upload/avatar`
  }
}

// Request timeout configurations for different endpoint types
export const timeoutConfigs = {
  // Quick operations
  fast: 5000,
  // Normal operations
  normal: 10000,
  // File uploads and heavy operations
  slow: 30000,
  // Report generation and exports
  export: 60000
}

// Retry configurations for different endpoint types
export const retryConfigs = {
  // Critical operations that should be retried aggressively
  critical: {
    attempts: 5,
    delay: 1000
  },
  // Normal operations
  normal: {
    attempts: 3,
    delay: 1000
  },
  // Operations that shouldn't be retried (like file uploads)
  noRetry: {
    attempts: 1,
    delay: 0
  }
}

// CORS configuration for development
export const corsConfig = {
  development: {
    origins: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  },
  production: {
    origins: ['https://cattle-management.com'],
    credentials: true
  }
}

export default {
  environmentConfigs,
  platformConfigs,
  getCurrentEnvironment,
  getCurrentPlatform,
  getApiConfig,
  getFeatureFlags,
  apiEndpoints,
  timeoutConfigs,
  retryConfigs,
  corsConfig
}