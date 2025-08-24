/**
 * Configured API Client Instance
 * Pre-configured with interceptors, error handling, and environment settings
 * Enhanced with safe data access and validation
 */

import { UnifiedApiClient } from '@/utils/apiClient'
import { setupApiInterceptors } from '@/utils/apiInterceptors'
import { getApiConfig } from '@/config/apiConfig'
import type { ApiResponse } from '@/utils/apiClient'
import type { BaseApiResponse, PaginatedApiResponse } from '@/types/api'
import { validateApiResponse, validatePaginatedResponse, normalizeListResponse } from '@/utils/dataValidation'

// Create configured API client instance
const config = getApiConfig()
export const apiClient = new UnifiedApiClient(config)

// Setup all interceptors
setupApiInterceptors(apiClient)

// Export convenience methods with proper typing and validation
export const api = {
  // GET request with validation
  get: <T = any>(url: string, params?: any, config?: any): Promise<ApiResponse<T>> => {
    return apiClient.get<T>(url, params, config)
  },

  // POST request with validation
  post: <T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> => {
    return apiClient.post<T>(url, data, config)
  },

  // PUT request with validation
  put: <T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> => {
    return apiClient.put<T>(url, data, config)
  },

  // DELETE request with validation
  delete: <T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> => {
    return apiClient.delete<T>(url, data, config)
  },

  // PATCH request with validation
  patch: <T = any>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> => {
    return apiClient.patch<T>(url, data, config)
  },

  // Safe GET request with response validation
  getSafe: async <T = any>(url: string, params?: any, config?: any): Promise<BaseApiResponse<T>> => {
    const response = await apiClient.get<T>(url, params, config)
    return validateApiResponse<T>(response)
  },

  // Safe POST request with response validation
  postSafe: async <T = any>(url: string, data?: any, config?: any): Promise<BaseApiResponse<T>> => {
    const response = await apiClient.post<T>(url, data, config)
    return validateApiResponse<T>(response)
  },

  // Safe PUT request with response validation
  putSafe: async <T = any>(url: string, data?: any, config?: any): Promise<BaseApiResponse<T>> => {
    const response = await apiClient.put<T>(url, data, config)
    return validateApiResponse<T>(response)
  },

  // Safe DELETE request with response validation
  deleteSafe: async <T = any>(url: string, data?: any, config?: any): Promise<BaseApiResponse<T>> => {
    const response = await apiClient.delete<T>(url, data, config)
    return validateApiResponse<T>(response)
  },

  // Safe list request with pagination validation
  getList: async <T = any>(url: string, params?: any, config?: any): Promise<PaginatedApiResponse<T>> => {
    const response = await apiClient.get<T[]>(url, params, config)
    return {
      success: true,
      data: response.data || [],
      pagination: response.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 }
    } as PaginatedApiResponse<T>
  },

  // File upload helper
  upload: (url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Download helper
  download: async (url: string, filename?: string): Promise<void> => {
    try {
      const response = await apiClient.get(url, {}, {})

      // Create download link
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download failed:', error)
      throw error
    }
  }
}

// Export default as the convenience API
export default api