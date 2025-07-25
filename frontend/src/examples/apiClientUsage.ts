/**
 * Example usage of the Unified API Client
 * Demonstrates how to use the API client in different scenarios
 */

import { api } from '@/api/client'
import { handleApiError, handleValidationError } from '@/utils/errorHandler'
import type { ApiResponse } from '@/utils/apiClient'

// Example interfaces
interface User {
  id: number
  name: string
  email: string
  role: string
}

interface Base {
  id: number
  name: string
  code: string
  address: string
}

interface PaginatedData<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Example API service class
export class ExampleApiService {
  
  // GET request with parameters
  async getUsers(params: { page?: number; limit?: number; search?: string } = {}): Promise<User[]> {
    try {
      const response: ApiResponse<PaginatedData<User>> = await api.get('/users', params)
      return response.data.data
    } catch (error) {
      handleApiError(error, { component: 'UserService', action: 'getUsers' })
      throw error
    }
  }

  // POST request with data
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      const response: ApiResponse<User> = await api.post('/users', userData)
      return response.data
    } catch (error) {
      // Handle validation errors specifically
      if (error.status === 422 && error.response?.data?.errors) {
        handleValidationError(error.response.data.errors, { 
          component: 'UserService', 
          action: 'createUser' 
        })
      } else {
        handleApiError(error, { component: 'UserService', action: 'createUser' })
      }
      throw error
    }
  }

  // PUT request for updates
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    try {
      const response: ApiResponse<User> = await api.put(`/users/${id}`, userData)
      return response.data
    } catch (error) {
      handleApiError(error, { component: 'UserService', action: 'updateUser' })
      throw error
    }
  }

  // DELETE request
  async deleteUser(id: number): Promise<void> {
    try {
      await api.delete(`/users/${id}`)
    } catch (error) {
      handleApiError(error, { component: 'UserService', action: 'deleteUser' })
      throw error
    }
  }

  // File upload example
  async uploadAvatar(userId: number, file: File): Promise<{ url: string }> {
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      formData.append('userId', userId.toString())

      const response: ApiResponse<{ url: string }> = await api.upload('/upload/avatar', formData)
      return response.data
    } catch (error) {
      handleApiError(error, { component: 'UserService', action: 'uploadAvatar' })
      throw error
    }
  }

  // Download example
  async downloadUserReport(userId: number): Promise<void> {
    try {
      await api.download(`/users/${userId}/report`, `user-${userId}-report.pdf`)
    } catch (error) {
      handleApiError(error, { component: 'UserService', action: 'downloadUserReport' })
      throw error
    }
  }

  // Request with custom timeout and no retry
  async getCriticalData(): Promise<any> {
    try {
      const response = await api.get('/critical-data', {}, {
        timeout: 30000, // 30 seconds
        skipRetry: true // Don't retry this request
      })
      return response.data
    } catch (error) {
      handleApiError(error, { component: 'UserService', action: 'getCriticalData' })
      throw error
    }
  }
}

// Example Vue 3 Composition API usage
export function useApiExample() {
  const userService = new ExampleApiService()

  // Reactive state
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load users with error handling
  const loadUsers = async (params: { page?: number; limit?: number; search?: string } = {}) => {
    loading.value = true
    error.value = null

    try {
      users.value = await userService.getUsers(params)
    } catch (err) {
      error.value = 'Failed to load users'
      console.error('Load users error:', err)
    } finally {
      loading.value = false
    }
  }

  // Create user with validation error handling
  const createUser = async (userData: Omit<User, 'id'>) => {
    loading.value = true
    error.value = null

    try {
      const newUser = await userService.createUser(userData)
      users.value.push(newUser)
      return newUser
    } catch (err) {
      error.value = 'Failed to create user'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    users: readonly(users),
    loading: readonly(loading),
    error: readonly(error),
    loadUsers,
    createUser
  }
}

// Example Pinia store usage
export const useUserStore = defineStore('user', () => {
  const userService = new ExampleApiService()
  
  const users = ref<User[]>([])
  const currentUser = ref<User | null>(null)
  const loading = ref(false)

  const fetchUsers = async (params?: any) => {
    loading.value = true
    try {
      users.value = await userService.getUsers(params)
    } catch (error) {
      // Error is already handled by the service
      console.error('Store: Failed to fetch users')
    } finally {
      loading.value = false
    }
  }

  const createUser = async (userData: Omit<User, 'id'>) => {
    try {
      const newUser = await userService.createUser(userData)
      users.value.push(newUser)
      return newUser
    } catch (error) {
      // Error is already handled by the service
      throw error
    }
  }

  return {
    users: readonly(users),
    currentUser: readonly(currentUser),
    loading: readonly(loading),
    fetchUsers,
    createUser
  }
})

// Example error handling patterns
export const errorHandlingExamples = {
  
  // Basic error handling
  async basicExample() {
    try {
      const response = await api.get('/data')
      return response.data
    } catch (error) {
      // Error is automatically handled by interceptors
      // Just log and re-throw if needed
      console.error('Request failed:', error)
      throw error
    }
  },

  // Custom error handling
  async customErrorHandling() {
    try {
      const response = await api.get('/data')
      return response.data
    } catch (error) {
      // Handle specific error types
      if (error.status === 404) {
        console.log('Data not found, using default')
        return { default: true }
      } else if (error.code === 'NETWORK_ERROR') {
        console.log('Network error, will retry later')
        // Could implement custom retry logic here
      }
      throw error
    }
  },

  // Silent error handling (no user feedback)
  async silentRequest() {
    try {
      const response = await api.get('/optional-data')
      return response.data
    } catch (error) {
      // Handle error silently, don't show user feedback
      handleApiError(error, { component: 'Background' }, 'SILENT')
      return null // Return fallback data
    }
  }
}

export default ExampleApiService