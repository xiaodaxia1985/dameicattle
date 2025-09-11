// 声明uni全局变量类型
declare const uni: any

// 统一的请求工具类，支持Web端和小程序端
export class RequestService {
  private baseURL: string
  private timeout: number
  private defaultHeaders: Record<string, string>

  constructor(config: {
    baseURL: string
    timeout?: number
    headers?: Record<string, string>
  }) {
    this.baseURL = config.baseURL
    this.timeout = config.timeout || 10000
    this.defaultHeaders = config.headers || {}
  }

  // 通用请求方法
  async request<T = any>(options: {
    url: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    data?: any
    headers?: Record<string, string>
    timeout?: number
  }): Promise<T> {
    const {
      url,
      method = 'GET',
      data,
      headers = {},
      timeout = this.timeout
    } = options

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    // 添加认证token
    const token = this.getToken()
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }

    try {
      // 判断环境：小程序 vs Web
      if (typeof uni !== 'undefined') {
        // 小程序环境
        return await this.uniRequest({
          url: fullUrl,
          method,
          data,
          header: requestHeaders,
          timeout
        })
      } else {
        // Web环境
        return await this.webRequest({
          url: fullUrl,
          method,
          data,
          headers: requestHeaders,
          timeout
        })
      }
    } catch (error) {
      console.error('Request failed:', error)
      throw error
    }
  }

  // 小程序请求
  private uniRequest(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      uni.request({
        ...options,
        success: (res: any) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (res.data.success) {
              resolve(res.data.data)
            } else {
              reject(new Error(res.data.message || '请求失败'))
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        },
        fail: (err: any) => {
          reject(err)
        }
      })
    })
  }

  // Web请求
  private async webRequest(options: any): Promise<any> {
    const { url, method, data, headers, timeout } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const result = await response.json()

      if (!response.ok) {
        // 创建包含状态码和响应数据的错误对象
        const error = new Error(result.error?.message || result.message || `HTTP ${response.status}`) as any
        error.response = {
          status: response.status,
          data: result
        }
        error.status = response.status
        throw error
      }
      
      if (result.success) {
        // 返回完整的结果对象，而不仅仅是data字段
        // 这样API层可以访问pagination等其他字段
        return result
      } else {
        const error = new Error(result.error?.message || result.message || '请求失败') as any
        error.response = {
          status: response.status,
          data: result
        }
        throw error
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // 获取token
  private getToken(): string | null {
    if (typeof uni !== 'undefined') {
      // 小程序环境
      return uni.getStorageSync('token')
    } else {
      // Web环境
      return localStorage.getItem('token')
    }
  }

  // GET请求
  get<T = any>(url: string, params?: any): Promise<T> {
    const queryString = params ? this.buildQueryString(params) : ''
    const fullUrl = queryString ? `${url}?${queryString}` : url
    
    return this.request<T>({
      url: fullUrl,
      method: 'GET'
    })
  }

  // POST请求
  post<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>({
      url,
      method: 'POST',
      data
    })
  }

  // PUT请求
  put<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>({
      url,
      method: 'PUT',
      data
    })
  }

  // DELETE请求
  delete<T = any>(url: string, data?: any): Promise<T> {
    return this.request<T>({
      url,
      method: 'DELETE',
      data
    })
  }

  // 构建查询字符串
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    
    Object.keys(params).forEach(key => {
      const value = params[key]
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    
    return searchParams.toString()
  }
}

// 创建默认实例 - 不再使用统一baseURL
export const apiService = new RequestService({
  baseURL: '', // 直连微服务，不使用统一前缀
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default apiService