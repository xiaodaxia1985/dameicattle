/**
 * API Client Interceptors
 * Handles authentication, logging, and error processing
 */

import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { showErrorMessage, createApiError, isNetworkError, isPermissionError } from './errorHandler'
import { tokenStorage, authErrorUtils, navigationUtils } from './authUtils'
import type { RequestConfig, ResponseInterceptor, RequestInterceptor, ApiError } from './apiClient'

// Request interceptors
export const authRequestInterceptor: RequestInterceptor = async (config) => {
  // 简化请求拦截器，只添加token，不进行复杂的刷新逻辑
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
    console.log('添加认证token到请求头')
  } else {
    console.log('没有找到认证token')
  }

  return config
}

export const loggingRequestInterceptor: RequestInterceptor = (config) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Request]', {
      method: config.method,
      url: config.url,
      data: config.data,
      params: config.params
    })
  }

  return config
}

export const timestampRequestInterceptor: RequestInterceptor = (config) => {
  // Add request timestamp for performance monitoring
  config.headers = config.headers || {}
  config.headers['X-Request-Time'] = Date.now().toString()

  return config
}

// Response interceptors
export const authResponseInterceptor: ResponseInterceptor = {
  onFulfilled: (response) => {
    return response
  },
  onRejected: async (error: ApiError) => {
    console.log('API响应拦截器处理错误:', {
      status: error.status,
      code: error.code,
      url: error.response?.config?.url
    })
    
    if (error.status === 401) {
      const authStore = useAuthStore()
      
      // 避免在登录和登出API调用时进行额外处理
      const url = error.response?.config?.url || ''
      if (url.includes('/auth/login') || url.includes('/auth/logout')) {
        console.log('登录或登出API错误，直接抛出')
        throw error
      }
      
      console.log('处理401认证错误')
      
      // 清除认证状态并跳转到登录页面
      try {
        await authStore.logout()
      } catch (logoutError) {
        console.error('登出过程中出错:', logoutError)
      }
      
      // 避免在已经在登录页面时重复跳转
      if (router.currentRoute.value.path !== '/login') {
        console.log('跳转到登录页面')
        router.push('/login')
      }
    }

    // Re-throw error if not handled
    throw error
  }
}

export const loggingResponseInterceptor: ResponseInterceptor = {
  onFulfilled: (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[API Response]', {
        url: response.config?.url,
        status: response.status,
        data: response.data
      })
    }
    return response
  },
  onRejected: (error: ApiError) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', {
        url: error.response?.config?.url,
        status: error.status,
        message: error.message,
        code: error.code
      })
    }
    throw error
  }
}

export const errorHandlingResponseInterceptor: ResponseInterceptor = {
  onFulfilled: (response) => {
    return response
  },
  onRejected: (error: ApiError) => {
    // Categorize and handle different types of errors
    const context = {
      url: error.response?.config?.url,
      method: error.response?.config?.method,
      timestamp: new Date().toISOString()
    }

    // Handle specific error types
    const apiError = createApiError(error)
    
    if (isNetworkError(apiError) || error.code === 'TIMEOUT') {
      // Handle network errors
      showErrorMessage(apiError, { showMessage: true, logError: true })
    } else if (error.status === 422 && error.response?.data?.errors) {
      // Handle validation errors
      showErrorMessage(apiError, { showMessage: true, logError: true })
    } else if (error.status !== 401) {
      // Handle other errors (auth errors are handled by authResponseInterceptor)
      showErrorMessage(apiError, { showMessage: true, logError: true })
    }

    throw error
  }
}

export const performanceResponseInterceptor: ResponseInterceptor = {
  onFulfilled: (response) => {
    // Calculate request duration
    const requestTime = response.config?.headers?.['X-Request-Time']
    if (requestTime) {
      const duration = Date.now() - parseInt(requestTime)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Performance] ${response.config?.url}: ${duration}ms`)
      }

      // Log slow requests
      if (duration > 3000) {
        console.warn(`[API Performance] Slow request detected: ${response.config?.url} took ${duration}ms`)
      }
    }

    return response
  },
  onRejected: (error: ApiError) => {
    throw error
  }
}

// Utility functions
function getAuthToken(): string | null {
  return tokenStorage.getToken()
}

function redirectToLogin(): void {
  const currentPath = navigationUtils.getCurrentPath()
  navigationUtils.redirectToLogin(currentPath !== '/login' ? currentPath : undefined)
}

// Setup function to configure all interceptors
export function setupApiInterceptors(apiClient: any): void {
  // Add request interceptors
  apiClient.addRequestInterceptor(authRequestInterceptor)
  apiClient.addRequestInterceptor(loggingRequestInterceptor)
  apiClient.addRequestInterceptor(timestampRequestInterceptor)

  // Add response interceptors
  apiClient.addResponseInterceptor(authResponseInterceptor)
  apiClient.addResponseInterceptor(loggingResponseInterceptor)
  apiClient.addResponseInterceptor(errorHandlingResponseInterceptor)
  apiClient.addResponseInterceptor(performanceResponseInterceptor)
}

export default {
  setupApiInterceptors,
  authRequestInterceptor,
  loggingRequestInterceptor,
  timestampRequestInterceptor,
  authResponseInterceptor,
  loggingResponseInterceptor,
  errorHandlingResponseInterceptor,
  performanceResponseInterceptor
}