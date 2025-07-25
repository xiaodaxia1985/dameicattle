/**
 * Legacy request module - maintained for backward compatibility
 * New code should use the unified API client from @/api/client
 */

import { api, apiClient } from './client'
import type { ApiResponse } from '@/utils/apiClient'

// Re-export types for backward compatibility
export interface PaginatedResponse<T = any> {
  success: boolean
  data: T
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  message?: string
  error?: {
    code: string
    message: string
    details?: any
    timestamp: string
    path: string
  }
}

// Export the ApiResponse type
export type { ApiResponse }

// Create a backward-compatible request object that uses the new API client
const request = {
  // GET method
  get: <T = any>(url: string, config?: any): Promise<{ data: ApiResponse<T> }> => {
    const params = config?.params
    return api.get<T>(url, params).then(response => ({ data: response }))
  },

  // POST method
  post: <T = any>(url: string, data?: any, config?: any): Promise<{ data: ApiResponse<T> }> => {
    return api.post<T>(url, data, config).then(response => ({ data: response }))
  },

  // PUT method
  put: <T = any>(url: string, data?: any, config?: any): Promise<{ data: ApiResponse<T> }> => {
    return api.put<T>(url, data, config).then(response => ({ data: response }))
  },

  // DELETE method
  delete: <T = any>(url: string, config?: any): Promise<{ data: ApiResponse<T> }> => {
    return api.delete<T>(url, undefined, config).then(response => ({ data: response }))
  },

  // PATCH method
  patch: <T = any>(url: string, data?: any, config?: any): Promise<{ data: ApiResponse<T> }> => {
    return api.patch<T>(url, data, config).then(response => ({ data: response }))
  },

  // Interceptors for backward compatibility (these are now handled by the unified client)
  interceptors: {
    request: {
      use: (onFulfilled?: any, onRejected?: any) => {
        console.warn('request.interceptors.request.use is deprecated. Use the unified API client interceptors instead.')
        // For backward compatibility, we can add interceptors to the unified client
        if (onFulfilled) {
          apiClient.addRequestInterceptor(onFulfilled)
        }
      }
    },
    response: {
      use: (onFulfilled?: any, onRejected?: any) => {
        console.warn('request.interceptors.response.use is deprecated. Use the unified API client interceptors instead.')
        // For backward compatibility, we can add interceptors to the unified client
        if (onFulfilled || onRejected) {
          apiClient.addResponseInterceptor({ onFulfilled, onRejected })
        }
      }
    }
  }
}

export default request