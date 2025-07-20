// 小程序专用请求工具
class RequestService {
  constructor(config = {}) {
    this.baseURL = config.baseURL || '/api/v1'
    this.timeout = config.timeout || 10000
    this.defaultHeaders = config.headers || {}
    this.isRefreshingToken = false
    this.refreshTokenPromise = null
  }

  // 通用请求方法
  request(options) {
    const {
      url,
      method = 'GET',
      data,
      headers = {},
      timeout = this.timeout,
      skipAuth = false
    } = options

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    // 添加认证token
    if (!skipAuth) {
      const token = uni.getStorageSync('token')
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`
      }
    }

    return new Promise((resolve, reject) => {
      uni.request({
        url: fullUrl,
        method,
        data,
        header: requestHeaders,
        timeout,
        success: (res) => {
          this.handleResponse(res, resolve, reject, options)
        },
        fail: (err) => {
          this.handleError(err, reject, options)
        }
      })
    })
  }

  // 处理响应
  handleResponse(res, resolve, reject, originalOptions) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.data.success) {
        resolve(res.data)
      } else {
        const error = new Error(res.data.message || '请求失败')
        error.code = res.data.error?.code
        error.details = res.data.error?.details
        reject(error)
      }
    } else if (res.statusCode === 401) {
      // Token过期，尝试刷新
      this.handleTokenExpired(originalOptions)
        .then(resolve)
        .catch(reject)
    } else {
      const error = new Error(`HTTP ${res.statusCode}`)
      error.statusCode = res.statusCode
      error.response = res.data
      reject(error)
    }
  }

  // 处理请求错误
  handleError(err, reject, options) {
    console.error('Request failed:', err)
    
    // 网络错误，如果支持离线模式，添加到同步队列
    if (this.shouldAddToOfflineQueue(options)) {
      this.addToOfflineQueue(options)
      
      // 返回离线提示
      const offlineError = new Error('网络连接失败，数据已保存到离线队列')
      offlineError.isOffline = true
      reject(offlineError)
      return
    }
    
    if (err.errMsg && err.errMsg.includes('timeout')) {
      reject(new Error('请求超时'))
    } else if (err.errMsg && err.errMsg.includes('fail')) {
      reject(new Error('网络请求失败'))
    } else {
      reject(err)
    }
  }

  // 处理Token过期
  async handleTokenExpired(originalOptions) {
    if (this.isRefreshingToken) {
      // 如果正在刷新Token，等待刷新完成
      await this.refreshTokenPromise
      return this.request(originalOptions)
    }

    this.isRefreshingToken = true
    this.refreshTokenPromise = this.refreshToken()

    try {
      await this.refreshTokenPromise
      // Token刷新成功，重新发起原请求
      return this.request(originalOptions)
    } catch (error) {
      // Token刷新失败，跳转到登录页
      this.handleAuthFailure()
      throw error
    } finally {
      this.isRefreshingToken = false
      this.refreshTokenPromise = null
    }
  }

  // 刷新Token
  async refreshToken() {
    try {
      const response = await this.request({
        url: '/auth/refresh',
        method: 'POST',
        skipAuth: false // 需要当前Token
      })

      if (response.success && response.data.token) {
        uni.setStorageSync('token', response.data.token)
        return response.data.token
      } else {
        throw new Error('Token刷新失败')
      }
    } catch (error) {
      console.error('Token刷新失败:', error)
      throw error
    }
  }

  // 处理认证失败
  handleAuthFailure() {
    // 清除本地存储
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('permissions')

    // 跳转到登录页
    uni.reLaunch({
      url: '/pages/login/index'
    })

    // 显示提示
    uni.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none'
    })
  }

  // 判断是否应该添加到离线队列
  shouldAddToOfflineQueue(options) {
    // 只有POST、PUT、DELETE等修改操作才添加到离线队列
    const modifyMethods = ['POST', 'PUT', 'DELETE']
    return modifyMethods.includes(options.method?.toUpperCase()) && 
           !options.skipOffline &&
           options.offlineSupport !== false
  }

  // 添加到离线队列
  addToOfflineQueue(options) {
    try {
      // 动态导入同步管理器（避免循环依赖）
      import('./sync.js').then(({ dataSyncManager }) => {
        const syncData = this.convertToSyncData(options)
        if (syncData) {
          dataSyncManager.addToSyncQueue(syncData)
        }
      })
    } catch (error) {
      console.error('添加到离线队列失败:', error)
    }
  }

  // 转换为同步数据格式
  convertToSyncData(options) {
    const { url, method, data } = options
    
    // 根据URL和方法推断数据类型和操作
    if (url.includes('/cattle')) {
      return {
        type: 'cattle',
        action: method === 'POST' ? 'create' : method === 'PUT' ? 'update' : 'delete',
        data
      }
    } else if (url.includes('/health')) {
      return {
        type: 'health',
        action: 'create_diagnosis',
        data
      }
    } else if (url.includes('/feeding')) {
      return {
        type: 'feeding',
        action: 'create_record',
        data
      }
    } else if (url.includes('/inventory')) {
      return {
        type: 'inventory',
        action: url.includes('inbound') ? 'inbound' : 'outbound',
        data
      }
    } else if (url.includes('/equipment')) {
      return {
        type: 'equipment',
        action: url.includes('maintenance') ? 'create_maintenance' : 'report_failure',
        data
      }
    }
    
    return null
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

// 健康管理API
export const healthApi = {
  // 获取健康统计
  getHealthStatistics: () => apiService.get('/health/statistics'),
  
  // 健康记录
  getHealthRecords: (params) => apiService.get('/health/records', params),
  getHealthRecordById: (id) => apiService.get(`/health/records/${id}`),
  createHealthRecord: (data) => apiService.post('/health/records', data),
  updateHealthRecord: (id, data) => apiService.put(`/health/records/${id}`, data),
  deleteHealthRecord: (id) => apiService.delete(`/health/records/${id}`),
  
  // 疫苗接种记录
  getVaccinationRecords: (params) => apiService.get('/health/vaccinations', params),
  getVaccinationRecordById: (id) => apiService.get(`/health/vaccinations/${id}`),
  createVaccinationRecord: (data) => apiService.post('/health/vaccinations', data),
  updateVaccinationRecord: (id, data) => apiService.put(`/health/vaccinations/${id}`, data),
  deleteVaccinationRecord: (id) => apiService.delete(`/health/vaccinations/${id}`),
  
  // 健康预警
  getHealthAlerts: (params) => apiService.get('/health/alerts', params),
  getHealthAlertById: (id) => apiService.get(`/health/alerts/${id}`),
  markAlertAsRead: (id) => apiService.put(`/health/alerts/${id}/read`),
  
  // 牛只健康档案
  getCattleHealthProfile: (cattleId) => apiService.get(`/health/cattle/${cattleId}/profile`),
  getCattleHealthHistory: (cattleId, params) => apiService.get(`/health/cattle/${cattleId}/history`, params)
}

// 牛只管理API
export const cattleApi = {
  getCattleList: (params) => apiService.get('/cattle', params),
  getCattleById: (id) => apiService.get(`/cattle/${id}`),
  getCattleByEarTag: (earTag) => apiService.get(`/cattle/ear-tag/${earTag}`),
  createCattle: (data) => apiService.post('/cattle', data),
  updateCattle: (id, data) => apiService.put(`/cattle/${id}`, data),
  deleteCattle: (id) => apiService.delete(`/cattle/${id}`)
}

// 用户管理API
export const userApi = {
  getUserList: (params) => apiService.get('/users', params),
  getUserById: (id) => apiService.get(`/users/${id}`),
  getUserProfile: () => apiService.get('/users/profile'),
  updateUserProfile: (data) => apiService.put('/users/profile', data)
}

// 认证API
export const authApi = {
  login: (data) => apiService.post('/auth/login', data),
  logout: () => apiService.post('/auth/logout'),
  refreshToken: () => apiService.post('/auth/refresh'),
  wxLogin: (data) => apiService.post('/auth/wx-login', data)
}

export default apiService