/**
 * Unified API Client for Web and Miniprogram environments
 * Supports automatic retry, error handling, and environment-specific configurations
 */

// Environment detection
const isUniApp = typeof window !== 'undefined' && 'uni' in window
const isWeb = typeof window !== 'undefined' && !isUniApp
const uni = isUniApp ? (window as any).uni : null

// Types
export interface ApiClientConfig {
  baseURL: string
  timeout?: number
  headers?: Record<string, string>
  retryAttempts?: number
  retryDelay?: number
  enableLogging?: boolean
}

export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
  skipRetry?: boolean
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: ValidationError[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ApiError extends Error {
  code?: string
  status?: number
  response?: any
  isRetryable?: boolean
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Request/Response interceptors
export interface RequestInterceptor {
  (config: RequestConfig): RequestConfig | Promise<RequestConfig>
}

export interface ResponseInterceptor {
  onFulfilled?: (response: any) => any
  onRejected?: (error: ApiError) => any
}

export class UnifiedApiClient {
  private config: Required<ApiClientConfig>
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableLogging: process.env.NODE_ENV === 'development',
      headers: {
        'Content-Type': 'application/json'
      },
      ...config
    }
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  // Main request method with retry logic
  async request<T = any>(requestConfig: RequestConfig): Promise<ApiResponse<T>> {
    let lastError: ApiError
    const maxAttempts = requestConfig.skipRetry ? 1 : this.config.retryAttempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Apply request interceptors
        let config = { ...requestConfig }
        for (const interceptor of this.requestInterceptors) {
          config = await interceptor(config)
        }

        // Make the actual request
        const response = await this.makeRequest<T>(config)

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

  // Environment-specific request implementation
  private async makeRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const fullUrl = this.buildUrl(config.url, config.params)
    const headers = { ...this.config.headers, ...config.headers }
    const timeout = config.timeout || this.config.timeout

    // Add authentication token
    const token = this.getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    if (isUniApp) {
      return this.makeUniRequest<T>(fullUrl, config, headers, timeout)
    } else if (isWeb) {
      return this.makeWebRequest<T>(fullUrl, config, headers, timeout)
    } else {
      throw new Error('Unsupported environment')
    }
  }

  // Miniprogram request implementation
  private makeUniRequest<T>(
    url: string, 
    config: RequestConfig, 
    headers: Record<string, string>, 
    timeout: number
  ): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      if (!uni) {
        reject(new Error('uni is not available'))
        return
      }
      uni.request({
        url,
        method: config.method || 'GET',
        data: config.data,
        header: headers,
        timeout,
        success: (res: any) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = this.normalizeResponse<T>(res.data, res.statusCode)
            resolve(response)
          } else {
            const error = this.createHttpError(res.statusCode, res.data, url)
            reject(error)
          }
        },
        fail: (err: any) => {
          const error = this.createNetworkError(err, url)
          reject(error)
        }
      })
    })
  }

  // Web request implementation using fetch
  private async makeWebRequest<T>(
    url: string, 
    config: RequestConfig, 
    headers: Record<string, string>, 
    timeout: number
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // 检查是否是FormData，特殊处理文件上传
      let body = config.data;
      let requestHeaders = { ...headers };
      
      if (config.data instanceof FormData) {
        // 移除Content-Type，让浏览器自动设置multipart/form-data
        delete requestHeaders['Content-Type'];
      } else if (config.data) {
        // 非FormData数据才进行JSON序列化
        body = JSON.stringify(config.data);
      }

      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: requestHeaders,
        body: body,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw this.createHttpError(response.status, errorData, url)
      }

      const data = await response.json()
      return this.normalizeResponse<T>(data, response.status)

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw this.createTimeoutError(url)
      }
      
      throw this.normalizeError(error)
    }
  }

  // Convenience methods
  async get<T = any>(url: string, params?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'GET', params, ...config })
  }

  async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'POST', data, ...config })
  }

  async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PUT', data, ...config })
  }

  async delete<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', data, ...config })
  }

  async patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PATCH', data, ...config })
  }

  // Utility methods
  private buildUrl(url: string, params?: Record<string, any>): string {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`
    
    if (!params || Object.keys(params).length === 0) {
      return fullUrl
    }

    const searchParams = new URLSearchParams()
    Object.keys(params).forEach(key => {
      const value = params[key]
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    return queryString ? `${fullUrl}?${queryString}` : fullUrl
  }

  private getToken(): string | null {
    if (isUniApp && uni) {
      return uni.getStorageSync('token')
    } else if (isWeb) {
      return localStorage.getItem('token')
    }
    return null
  }

  private normalizeResponse<T>(data: any, status: number): ApiResponse<T> {
    // If response already follows our standard format
    if (data && typeof data === 'object' && 'success' in data) {
      return data as ApiResponse<T>
    }

    // Normalize non-standard responses
    return {
      success: status >= 200 && status < 300,
      data: data as T,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
        version: '1.0'
      }
    }
  }

  private normalizeError(error: any): ApiError {
    const apiError = new Error(error.message || 'Unknown error') as ApiError
    
    if (error.name === 'AbortError') {
      apiError.message = 'Request timeout'
      apiError.code = 'TIMEOUT'
      apiError.isRetryable = true
      return apiError
    }

    if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
      apiError.message = 'Network connection failed'
      apiError.code = 'NETWORK_ERROR'
      apiError.isRetryable = true
      return apiError
    }

    apiError.message = error.message || 'Unknown error'
    apiError.code = error.code || 'UNKNOWN'
    apiError.status = error.status
    apiError.response = error.response
    apiError.isRetryable = error.isRetryable || false

    return apiError
  }

  private createHttpError(status: number, data: any, url: string): ApiError {
    let message = `HTTP ${status}`
    let code = `HTTP_${status}`
    
    // Extract error message from response
    if (data && typeof data === 'object') {
      message = data.error?.message || data.message || message
      code = data.error?.code || code
    }
    
    const error = new Error(message) as ApiError
    error.status = status
    error.response = data
    error.code = code
    error.isRetryable = status >= 500 || status === 429 || status === 408

    return error
  }

  private createNetworkError(err: any, url: string): ApiError {
    const error = new Error('Network request failed') as ApiError
    error.code = 'NETWORK_ERROR'
    error.isRetryable = true
    return error
  }

  private createTimeoutError(url: string): ApiError {
    const error = new Error('Request timeout') as ApiError
    error.code = 'TIMEOUT'
    error.isRetryable = true
    return error
  }

  private isRetryableError(error: ApiError): boolean {
    if (error.isRetryable !== undefined) {
      return error.isRetryable
    }

    // Default retry logic
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'HTTP_500', 'HTTP_502', 'HTTP_503', 'HTTP_504', 'HTTP_429']
    return retryableCodes.includes(error.code || '')
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 0.1 * exponentialDelay
    return Math.min(exponentialDelay + jitter, 30000) // Max 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private log(message: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[ApiClient] ${message}`, data || '')
    }
  }

  // Error categorization
  categorizeError(error: ApiError): ErrorCategory {
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

// Default configuration for different environments
export const createApiClient = (environment: 'development' | 'production' | 'test' = 'development'): UnifiedApiClient => {
  const configs = {
    development: {
      baseURL: '/api/v1',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableLogging: true
    },
    production: {
      baseURL: '/api/v1',
      timeout: 15000,
      retryAttempts: 2,
      retryDelay: 2000,
      enableLogging: false
    },
    test: {
      baseURL: '/api/v1',
      timeout: 5000,
      retryAttempts: 1,
      retryDelay: 500,
      enableLogging: false
    }
  }

  return new UnifiedApiClient(configs[environment])
}

// Export default instance
export const apiClient = createApiClient(
  (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
)

export default apiClient