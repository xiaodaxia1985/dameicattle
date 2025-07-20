import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// API response interface
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
    timestamp: string
    path: string
  }
}

// Paginated response interface
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

// Create axios instance
const request: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
request.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    
    // Add auth token
    if (authStore.token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${authStore.token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    
    // Handle successful response
    if (data.success) {
      return response
    } else {
      // Handle business logic errors
      const errorMessage = data.error?.message || data.message || '请求失败'
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
  },
  async (error) => {
    const { response, message } = error
    
    if (response) {
      const { status, data } = response
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          const authStore = useAuthStore()
          
          if (data.error?.code === 'TOKEN_EXPIRED') {
            // Try to refresh token
            try {
              await authStore.refreshToken()
              // Retry the original request
              return request(error.config)
            } catch (refreshError) {
              // Refresh failed, redirect to login
              ElMessageBox.alert('登录已过期，请重新登录', '提示', {
                confirmButtonText: '确定',
                type: 'warning'
              }).then(() => {
                authStore.logout()
                router.push('/login')
              })
            }
          } else {
            ElMessage.error(data.error?.message || '认证失败')
            authStore.logout()
            router.push('/login')
          }
          break
          
        case 403:
          ElMessage.error(data.error?.message || '权限不足')
          break
          
        case 404:
          ElMessage.error(data.error?.message || '请求的资源不存在')
          break
          
        case 422:
          // Validation errors
          if (data.error?.details) {
            const validationErrors = data.error.details
            if (Array.isArray(validationErrors)) {
              const errorMessages = validationErrors.map((err: any) => err.message).join('; ')
              ElMessage.error(errorMessages)
            } else {
              ElMessage.error(data.error.message || '数据验证失败')
            }
          } else {
            ElMessage.error(data.error?.message || '数据验证失败')
          }
          break
          
        case 500:
          ElMessage.error(data.error?.message || '服务器内部错误')
          break
          
        default:
          ElMessage.error(data.error?.message || `请求失败 (${status})`)
      }
    } else if (message.includes('timeout')) {
      ElMessage.error('请求超时，请稍后重试')
    } else if (message.includes('Network Error')) {
      ElMessage.error('网络连接失败，请检查网络设置')
    } else {
      ElMessage.error(message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default request