/**
 * API Client Interceptors
 * Handles authentication, logging, and error processing
 */

import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { errorHandler, handleAuthError, handleNetworkError } from './errorHandler'
import { tokenStorage, authErrorUtils, navigationUtils } from './authUtils'
import type { RequestConfig, ResponseInterceptor, RequestInterceptor, ApiError } from './apiClient'

// Request interceptors
export const authRequestInterceptor: RequestInterceptor = async (config) => {
  // Check and refresh token proactively if needed
  const authStore = useAuthStore()
  if (authStore.isAuthenticated && authStore.isTokenNearExpiration && !authStore.isRefreshing) {
    try {
      await authStore.checkAndRefreshToken()
    } catch (error) {
      console.warn('Proactive token refresh failed:', error)
      // Continue with current token, let the response interceptor handle it
    }
  }

  // Add authentication token
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
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
    if (error.status === 401) {
      const authStore = useAuthStore()
      
      // Handle different types of authentication errors
      switch (error.code) {
        case 'TOKEN_EXPIRED':
        case 'TOKEN_NOT_IN_SESSION':
        case 'TOKEN_MISMATCH':
          try {
            // Try to refresh token
            await authStore.refreshToken()
            
            // Return null to indicate the error was handled and request should be retried
            return null
          } catch (refreshError) {
            // Refresh failed, redirect to login
            handleAuthError(error, { action: 'token_refresh_failed', refreshError })
            redirectToLogin()
          }
          break
          
        case 'MISSING_TOKEN':
        case 'INVALID_TOKEN_FORMAT':
        case 'INVALID_TOKEN':
          // These errors indicate the token is completely invalid
          handleAuthError(error, { action: 'invalid_token' })
          await authStore.logout()
          redirectToLogin()
          break
          
        case 'USER_NOT_FOUND':
        case 'ACCOUNT_INACTIVE':
        case 'ACCOUNT_LOCKED':
          // These errors require user action or admin intervention
          handleAuthError(error, { action: 'account_issue' })
          await authStore.logout()
          redirectToLogin()
          break
          
        case 'TOKEN_EXPIRED_BEYOND_GRACE':
          // Token is too old to refresh
          handleAuthError(error, { action: 'session_expired' })
          await authStore.logout()
          redirectToLogin()
          break
          
        default:
          // Generic auth error
          handleAuthError(error, { action: 'auth_failed' })
          await authStore.logout()
          redirectToLogin()
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
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      handleNetworkError(error, context)
    } else if (error.status === 422 && error.response?.data?.errors) {
      // Handle validation errors
      errorHandler.handleValidationErrors(error.response.data.errors, context)
    } else if (error.status !== 401) {
      // Handle other errors (auth errors are handled by authResponseInterceptor)
      errorHandler.handleError(error, context)
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