// 微信小程序认证工具类
import { apiService } from './request.js'

class WechatAuthService {
  constructor() {
    this.isLoggingIn = false
  }

  /**
   * 微信登录授权流程
   * @param {Object} options 登录选项
   * @returns {Promise} 登录结果
   */
  async wechatLogin(options = {}) {
    if (this.isLoggingIn) {
      throw new Error('正在登录中，请稍候...')
    }

    this.isLoggingIn = true

    try {
      // 1. 获取微信登录凭证
      const loginRes = await this.getWechatCode()
      
      // 2. 获取用户信息（如果需要）
      let userInfo = null
      if (options.getUserInfo) {
        try {
          userInfo = await this.getWechatUserInfo()
        } catch (error) {
          console.warn('获取用户信息失败:', error)
          // 用户拒绝授权时继续登录流程
        }
      }

      // 3. 发送到后端验证
      const response = await apiService.post('/auth/wechat-login', {
        code: loginRes.code,
        userInfo: userInfo
      })

      // 4. 存储登录信息
      if (response.success) {
        await this.saveLoginInfo(response.data)
        
        // 5. 检查是否需要绑定基地
        if (response.data.needsBinding) {
          return {
            ...response.data,
            needsBinding: true
          }
        }

        return response.data
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    } finally {
      this.isLoggingIn = false
    }
  }

  /**
   * 获取微信登录凭证
   * @returns {Promise} 登录凭证
   */
  async getWechatCode() {
    return new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: (res) => {
          if (res.code) {
            resolve(res)
          } else {
            reject(new Error('获取微信登录凭证失败'))
          }
        },
        fail: (error) => {
          reject(new Error('微信登录授权失败'))
        }
      })
    })
  }

  /**
   * 获取微信用户信息
   * @returns {Promise} 用户信息
   */
  async getWechatUserInfo() {
    return new Promise((resolve, reject) => {
      uni.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve(res.userInfo)
        },
        fail: (error) => {
          reject(new Error('获取用户信息失败'))
        }
      })
    })
  }

  /**
   * 绑定用户到基地
   * @param {number} baseId 基地ID
   * @param {string} inviteCode 邀请码
   * @returns {Promise} 绑定结果
   */
  async bindUserToBase(baseId, inviteCode) {
    try {
      const response = await apiService.post('/auth/bind-user', {
        baseId,
        inviteCode
      })

      if (response.success) {
        // 更新本地存储的用户信息
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo) {
          userInfo.base_id = baseId
          uni.setStorageSync('userInfo', userInfo)
        }

        return response.data
      } else {
        throw new Error(response.message || '绑定失败')
      }
    } catch (error) {
      console.error('绑定基地失败:', error)
      throw error
    }
  }

  /**
   * 获取用户资料
   * @returns {Promise} 用户资料
   */
  async getUserProfile() {
    try {
      const response = await apiService.get('/auth/profile')
      
      if (response.success) {
        // 更新本地存储
        await this.saveLoginInfo(response.data)
        return response.data
      } else {
        throw new Error(response.message || '获取用户资料失败')
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
      throw error
    }
  }

  /**
   * 检查登录状态
   * @returns {boolean} 是否已登录
   */
  checkLoginStatus() {
    const token = uni.getStorageSync('token')
    const userInfo = uni.getStorageSync('userInfo')
    
    return !!(token && userInfo)
  }

  /**
   * 获取当前用户信息
   * @returns {Object|null} 用户信息
   */
  getCurrentUser() {
    return uni.getStorageSync('userInfo') || null
  }

  /**
   * 获取当前用户权限
   * @returns {Array} 权限列表
   */
  getCurrentPermissions() {
    return uni.getStorageSync('permissions') || []
  }

  /**
   * 检查用户权限
   * @param {string} permission 权限名称
   * @returns {boolean} 是否有权限
   */
  hasPermission(permission) {
    const permissions = this.getCurrentPermissions()
    return permissions.includes(permission) || permissions.includes('*')
  }

  /**
   * 检查用户角色
   * @param {string} role 角色名称
   * @returns {boolean} 是否有该角色
   */
  hasRole(role) {
    const userInfo = this.getCurrentUser()
    return userInfo && userInfo.role && userInfo.role.name === role
  }

  /**
   * 保存登录信息
   * @param {Object} data 登录数据
   */
  async saveLoginInfo(data) {
    const { token, user, permissions } = data
    
    if (token) {
      uni.setStorageSync('token', token)
    }
    
    if (user) {
      uni.setStorageSync('userInfo', user)
    }
    
    if (permissions) {
      uni.setStorageSync('permissions', permissions)
    }

    // 设置登录时间
    uni.setStorageSync('loginTime', Date.now())
  }

  /**
   * 刷新Token
   * @returns {Promise} 刷新结果
   */
  async refreshToken() {
    try {
      const response = await apiService.post('/auth/refresh')
      
      if (response.success && response.data.token) {
        uni.setStorageSync('token', response.data.token)
        return response.data.token
      } else {
        throw new Error('Token刷新失败')
      }
    } catch (error) {
      console.error('Token刷新失败:', error)
      // Token刷新失败，清除登录状态
      this.logout()
      throw error
    }
  }

  /**
   * 登出
   */
  async logout() {
    try {
      // 调用后端登出接口
      await apiService.post('/auth/logout')
    } catch (error) {
      console.warn('后端登出失败:', error)
    } finally {
      // 清除本地存储
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
      uni.removeStorageSync('permissions')
      uni.removeStorageSync('loginTime')
      
      // 跳转到登录页
      uni.reLaunch({
        url: '/pages/login/index'
      })
    }
  }

  /**
   * 检查Token是否过期
   * @returns {boolean} 是否过期
   */
  isTokenExpired() {
    const loginTime = uni.getStorageSync('loginTime')
    if (!loginTime) return true
    
    // Token有效期24小时
    const tokenExpiry = 24 * 60 * 60 * 1000
    return Date.now() - loginTime > tokenExpiry
  }

  /**
   * 自动刷新Token（如果需要）
   * @returns {Promise} 刷新结果
   */
  async autoRefreshToken() {
    if (this.isTokenExpired()) {
      try {
        await this.refreshToken()
        return true
      } catch (error) {
        return false
      }
    }
    return true
  }

  /**
   * 获取基地列表（用于绑定选择）
   * @returns {Promise} 基地列表
   */
  async getAvailableBases() {
    try {
      const response = await apiService.get('/bases?available=true')
      
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || '获取基地列表失败')
      }
    } catch (error) {
      console.error('获取基地列表失败:', error)
      throw error
    }
  }

  /**
   * 验证邀请码
   * @param {string} inviteCode 邀请码
   * @param {number} baseId 基地ID
   * @returns {Promise} 验证结果
   */
  async validateInviteCode(inviteCode, baseId) {
    try {
      const response = await apiService.post('/auth/validate-invite', {
        inviteCode,
        baseId
      })
      
      return response.success
    } catch (error) {
      console.error('验证邀请码失败:', error)
      return false
    }
  }
}

// 创建单例实例
export const wechatAuth = new WechatAuthService()

// 默认导出
export default wechatAuth