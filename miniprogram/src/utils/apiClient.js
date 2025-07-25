/**
 * Unified API Client for Miniprogram
 * Shares the same interface as the web version but uses uni-app APIs
 */

// Environment configuration
const config = {
  development: {
    baseURL: 'http://localhost:3000/api/v1',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableLogging: true
  },
  production: {
    baseURL: 'https://api.cattle-management.com/api/v1',
    timeout: 15000,
    retryAttempts: 2,
    retryDelay: 2000,
    enableLogging: false
  }
}

// Get current environment config
const currentEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const apiConfig = config[currentEnv]

// Error categories
const ErrorCategory = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  UNKNOWN: 'UNKNOWN'
}

class UnifiedApiClient {
  constructor(config) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableLogging: false,
      headers: {
        'Content-Type': 'application/json'
      },
      ...config
    }
    this.requestInterceptors = []
    this.responseInterceptors = []
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor)
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor)
  }

  // Main request method with retry logic
  async request(requestConfig) {
    let lastError
    const maxAttempts = requestConfig.skipRetry ? 1 : this.config.retryAttempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Apply request interceptors
        let config = { ...requestConfig }
        for (const interceptor of this.requestInterceptors) {
          config = await interceptor(config)
        }

        // Make the actual request
        const response = await this.makeRequest(config)

        // Apply response interceptors (success)
        let processedResponse = response
        for (const interceptor of this.responseInterceptors) {
          if (interceptor.onFulfilled) {
            processedResponse = await interceptor.onFulfilled(processedResponse)
          }
        }

        this.log('Request successful', { url: config.url, attempt })
        return processedResponse

      } catch (error) {
        lastError = this.normalizeError(error)
        
        // Apply response interceptors (error)
        for (const interceptor of this.responseInterceptors) {
          if (interceptor.onRejected) {
            try {
              const result = await interceptor.onRejected(lastError)
              if (result) {
                return result // Interceptor handled the error
              }
            } catch (interceptorError) {
              this.log('Response interceptor error', interceptorError)
            }
          }
        }

        // Check if error is retryable
        if (attempt < maxAttempts && this.isRetryableError(lastError)) {
          const delay = this.calculateRetryDelay(attempt)
          this.log(`Request failed, retrying in ${delay}ms`, { 
            url: requestConfig.url, 
            attempt, 
            error: lastError.message 
          })
          await this.sleep(delay)
          continue
        }

        // Max attempts reached or non-retryable error
        this.log('Request failed permanently', { 
          url: requestConfig.url, 
          attempts: attempt, 
          error: lastError.message 
        })
        break
      }
    }

    throw lastError
  }

  // Miniprogram request implementation
  async makeRequest(config) {
    const fullUrl = this.buildUrl(config.url, config.params)
    const headers = { ...this.config.headers, ...config.headers }
    const timeout = config.timeout || this.config.timeout

    // Add authentication token
    const token = this.getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return new Promise((resolve, reject) => {
      uni.request({
        url: fullUrl,
        method: config.method || 'GET',
        data: config.data,
        header: headers,
        timeout,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = this.normalizeResponse(res.data, res.statusCode)
            resolve(response)
          } else {
            const error = this.createHttpError(res.statusCode, res.data, fullUrl)
            reject(error)
          }
        },
        fail: (err) => {
          const error = this.createNetworkError(err, fullUrl)
          reject(error)
        }
      })
    })
  }

  // Convenience methods
  async get(url, params, config) {
    return this.request({ url, method: 'GET', params, ...config })
  }

  async post(url, data, config) {
    return this.request({ url, method: 'POST', data, ...config })
  }

  async put(url, data, config) {
    return this.request({ url, method: 'PUT', data, ...config })
  }

  async delete(url, data, config) {
    return this.request({ url, method: 'DELETE', data, ...config })
  }

  async patch(url, data, config) {
    return this.request({ url, method: 'PATCH', data, ...config })
  }

  // Utility methods
  buildUrl(url, params) {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`
    
    if (!params || Object.keys(params).length === 0) {
      return fullUrl
    }

    const queryString = Object.keys(params)
      .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')

    return queryString ? `${fullUrl}?${queryString}` : fullUrl
  }

  getToken() {
    return uni.getStorageSync('token')
  }

  normalizeResponse(data, status) {
    // If response already follows our standard format
    if (data && typeof data === 'object' && 'success' in data) {
      return data
    }

    // Normalize non-standard responses
    return {
      success: status >= 200 && status < 300,
      data: data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        version: '1.0'
      }
    }
  }

  normalizeError(error) {
    const apiError = new Error()
    
    if (error.errMsg && error.errMsg.includes('timeout')) {
      apiError.message = 'Request timeout'
      apiError.code = 'TIMEOUT'
      apiError.isRetryable = true
      return apiError
    }

    if (error.errMsg && (error.errMsg.includes('fail') || error.errMsg.includes('network'))) {
      apiError.message = 'Network connection failed'
      apiError.code = 'NETWORK_ERROR'
      apiError.isRetryable = true
      return apiError
    }

    apiError.message = error.message || error.errMsg || 'Unknown error'
    apiError.code = error.code || 'UNKNOWN'
    apiError.status = error.status
    apiError.response = error.response
    apiError.isRetryable = error.isRetryable || false

    return apiError
  }

  createHttpError(status, data, url) {
    const error = new Error()
    error.status = status
    error.response = data
    
    // Extract error message from response
    if (data && typeof data === 'object') {
      error.message = data.error?.message || data.message || `HTTP ${status}`
      error.code = data.error?.code || `HTTP_${status}`
    } else {
      error.message = `HTTP ${status}`
      error.code = `HTTP_${status}`
    }

    // Determine if error is retryable
    error.isRetryable = status >= 500 || status === 429 || status === 408

    return error
  }

  createNetworkError(err, url) {
    const error = new Error()
    error.message = 'Network request failed'
    error.code = 'NETWORK_ERROR'
    error.isRetryable = true
    error.originalError = err
    return error
  }

  isRetryableError(error) {
    if (error.isRetryable !== undefined) {
      return error.isRetryable
    }

    // Default retry logic
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'HTTP_500', 'HTTP_502', 'HTTP_503', 'HTTP_504', 'HTTP_429']
    return retryableCodes.includes(error.code || '')
  }

  calculateRetryDelay(attempt) {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 0.1 * exponentialDelay
    return Math.min(exponentialDelay + jitter, 30000) // Max 30 seconds
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  log(message, data) {
    if (this.config.enableLogging) {
      console.log(`[ApiClient] ${message}`, data || '')
    }
  }

  // Error categorization
  categorizeError(error) {
    if (!error.code) return ErrorCategory.UNKNOWN

    if (error.code.includes('NETWORK') || error.code.includes('TIMEOUT')) {
      return ErrorCategory.NETWORK
    }
    
    if (error.code.includes('AUTH') || error.status === 401) {
      return ErrorCategory.AUTH
    }
    
    if (error.code.includes('VALIDATION') || error.status === 422) {
      return ErrorCategory.VALIDATION
    }
    
    if (error.status && error.status >= 500) {
      return ErrorCategory.SERVER
    }
    
    if (error.status && error.status >= 400 && error.status < 500) {
      return ErrorCategory.CLIENT
    }

    return ErrorCategory.UNKNOWN
  }
}

// Error handling utilities for miniprogram
const errorHandler = {
  handleError(error, context) {
    const message = this.getUserMessage(error)
    
    // Show user feedback using uni.showToast
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })

    // Log error
    console.error('[ErrorHandler]', {
      message: error.message,
      code: error.code,
      status: error.status,
      context,
      timestamp: new Date().toISOString()
    })
  },

  getUserMessage(error) {
    const errorMessages = {
      NETWORK_ERROR: '网络连接失败，请检查网络设置',
      TIMEOUT: '请求超时，请稍后重试',
      AUTH_FAILED: '认证失败，请重新登录',
      TOKEN_EXPIRED: '登录已过期，请重新登录',
      UNAUTHORIZED: '权限不足，无法访问该资源',
      VALIDATION_ERROR: '数据验证失败，请检查输入',
      SERVER_ERROR: '服务器内部错误，请稍后重试',
      SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后重试',
      NOT_FOUND: '请求的资源不存在',
      UNKNOWN: '未知错误，请联系管理员'
    }

    // Check for specific error codes first
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code]
    }

    // Check for HTTP status codes
    if (error.status) {
      switch (error.status) {
        case 400: return '请求参数错误'
        case 401: return errorMessages.AUTH_FAILED
        case 403: return errorMessages.UNAUTHORIZED
        case 404: return errorMessages.NOT_FOUND
        case 408: return errorMessages.TIMEOUT
        case 422: return errorMessages.VALIDATION_ERROR
        case 429: return '请求过于频繁，请稍后重试'
        case 500: return errorMessages.SERVER_ERROR
        case 502: return '网关错误，请稍后重试'
        case 503: return errorMessages.SERVICE_UNAVAILABLE
        case 504: return '网关超时，请稍后重试'
        default: return error.status >= 500 ? errorMessages.SERVER_ERROR : errorMessages.UNKNOWN
      }
    }

    return error.message || errorMessages.UNKNOWN
  },

  handleAuthError(error) {
    if (error.status === 401) {
      uni.showModal({
        title: '认证失败',
        content: '登录已过期，是否重新登录？',
        success: (res) => {
          if (res.confirm) {
            uni.reLaunch({
              url: '/pages/login/index'
            })
          }
        }
      })
    } else {
      this.handleError(error)
    }
  }
}

// Request interceptors
const authRequestInterceptor = (config) => {
  const token = uni.getStorageSync('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

const loggingRequestInterceptor = (config) => {
  if (apiConfig.enableLogging) {
    console.log('[API Request]', {
      method: config.method,
      url: config.url,
      data: config.data,
      params: config.params
    })
  }
  return config
}

// Response interceptors
const authResponseInterceptor = {
  onFulfilled: (response) => response,
  onRejected: async (error) => {
    if (error.status === 401) {
      errorHandler.handleAuthError(error)
    }
    throw error
  }
}

const errorHandlingResponseInterceptor = {
  onFulfilled: (response) => response,
  onRejected: (error) => {
    const context = {
      url: error.response?.config?.url,
      method: error.response?.config?.method,
      timestamp: new Date().toISOString()
    }

    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      errorHandler.handleError(error, context)
    } else if (error.status === 422 && error.response?.data?.errors) {
      // Handle validation errors
      const errors = error.response.data.errors
      const message = Array.isArray(errors) 
        ? errors.map(err => err.message || err.toString()).join('; ')
        : '数据验证失败'
      
      uni.showToast({
        title: `数据验证失败: ${message}`,
        icon: 'none',
        duration: 5000
      })
    } else if (error.status !== 401) {
      errorHandler.handleError(error, context)
    }

    throw error
  }
}

// Create configured API client instance
const apiClient = new UnifiedApiClient(apiConfig)

// Setup interceptors
apiClient.addRequestInterceptor(authRequestInterceptor)
apiClient.addRequestInterceptor(loggingRequestInterceptor)
apiClient.addResponseInterceptor(authResponseInterceptor)
apiClient.addResponseInterceptor(errorHandlingResponseInterceptor)

// Export convenience API
const api = {
  get: (url, params, config) => apiClient.get(url, params, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  delete: (url, data, config) => apiClient.delete(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  
  // File upload helper
  upload: (url, filePath, formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const token = uni.getStorageSync('token')
      const headers = {
        'Authorization': token ? `Bearer ${token}` : undefined
      }

      uni.uploadFile({
        url: url.startsWith('http') ? url : `${apiConfig.baseURL}${url}`,
        filePath,
        name: 'file',
        formData,
        header: headers,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(res.data)
              resolve(data)
            } catch (e) {
              resolve(res.data)
            }
          } else {
            reject(new Error(`Upload failed: ${res.statusCode}`))
          }
        },
        fail: reject
      })
    })
  }
}

export { apiClient, api, errorHandler, ErrorCategory }
export default api