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
const isUniApp = typeof uni !== 'undefined'
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

// Base configurations for different environments
export const environmentConfigs: EnvironmentConfigs = {
  development: {
    baseURL: isUniApp ? 'http://localhost:3000/api/v1' : '/api/v1',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableErrorReporting: false,
    enablePerformanceMonitoring: true,
    headers: {
      'X-Environment': 'development'
    }
  },
  production: {
    baseURL: isUniApp ? 'https://api.cattle-management.com/api/v1' : '/api/v1',
    timeout: 15000,
    retryAttempts: 2,
    retryDelay: 2000,
    enableLogging: false,
    enableErrorReporting: true,
    enablePerformanceMonitoring: true,
    headers: {
      'X-Environment': 'production'
    }
  },
  test: {
    baseURL: isUniApp ? 'http://localhost:3001/api/v1' : '/api/v1',
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

// API endpoints configuration
export const apiEndpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile'
  },
  
  // Base management
  bases: {
    list: '/bases',
    detail: (id: number) => `/bases/${id}`,
    create: '/bases',
    update: (id: number) => `/bases/${id}`,
    delete: (id: number) => `/bases/${id}`,
    statistics: (id: number) => `/bases/${id}/statistics`
  },
  
  // Barn management
  barns: {
    list: '/barns',
    detail: (id: number) => `/barns/${id}`,
    create: '/barns',
    update: (id: number) => `/barns/${id}`,
    delete: (id: number) => `/barns/${id}`,
    byBase: (baseId: number) => `/bases/${baseId}/barns`
  },
  
  // Cattle management
  cattle: {
    list: '/cattle',
    detail: (id: number) => `/cattle/${id}`,
    create: '/cattle',
    update: (id: number) => `/cattle/${id}`,
    delete: (id: number) => `/cattle/${id}`,
    health: (id: number) => `/cattle/${id}/health`
  },
  
  // Health monitoring
  health: {
    system: '/health',
    database: '/health/database',
    redis: '/health/redis',
    services: '/health/services'
  },
  
  // File upload
  upload: {
    single: '/upload/single',
    multiple: '/upload/multiple',
    avatar: '/upload/avatar'
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