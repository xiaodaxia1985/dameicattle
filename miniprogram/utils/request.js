// 小程序专用请求工具
class RequestService {
  constructor(config = {}) {
    this.baseURL = config.baseURL || '/api/v1'
    this.timeout = config.timeout || 10000
    this.defaultHeaders = config.headers || {}
  }

  // 通用请求方法
  request(options) {
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
    const token = uni.getStorageSync('token')
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }

    return new Promise((resolve, reject) => {
      uni.request({
        url: fullUrl,
        method,
        data,
        header: requestHeaders,
        timeout,
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            if (res.data.success) {
              resolve(res.data)
            } else {
              const error = new Error(res.data.message || '请求失败')
              error.code = res.data.error?.code
              error.details = res.data.error?.details
              reject(error)
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        },
        fail: (err) => {
          console.error('Request failed:', err)
          if (err.errMsg && err.errMsg.includes('timeout')) {
            reject(new Error('请求超时'))
          } else if (err.errMsg && err.errMsg.includes('fail')) {
            reject(new Error('网络请求失败'))
          } else {
            reject(err)
          }
        }
      })
    })
  }

  // GET请求
  get(url, params) {
    const queryString = params ? this.buildQueryString(params) : ''
    const fullUrl = queryString ? `${url}?${queryString}` : url
    
    return this.request({
      url: fullUrl,
      method: 'GET'
    })
  }

  // POST请求
  post(url, data) {
    return this.request({
      url,
      method: 'POST',
      data
    })
  }

  // PUT请求
  put(url, data) {
    return this.request({
      url,
      method: 'PUT',
      data
    })
  }

  // DELETE请求
  delete(url, data) {
    return this.request({
      url,
      method: 'DELETE',
      data
    })
  }

  // 文件上传
  uploadFile(options) {
    const {
      url,
      filePath,
      name = 'file',
      formData = {},
      timeout = this.timeout
    } = options

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`
    const token = uni.getStorageSync('token')
    const headers = {}
    
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: fullUrl,
        filePath,
        name,
        formData,
        header: headers,
        timeout,
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            if (data.success) {
              resolve(data)
            } else {
              reject(new Error(data.message || '上传失败'))
            }
          } catch (error) {
            reject(new Error('响应数据解析失败'))
          }
        },
        fail: (err) => {
          console.error('Upload failed:', err)
          reject(err)
        }
      })
    })
  }

  // 构建查询字符串
  buildQueryString(params) {
    const pairs = []
    
    Object.keys(params).forEach(key => {
      const value = params[key]
      if (value !== null && value !== undefined && value !== '') {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      }
    })
    
    return pairs.join('&')
  }
}

// 创建默认实例
export const apiService = new RequestService({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default apiService