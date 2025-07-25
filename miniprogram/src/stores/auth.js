// Enhanced auth store with standardized API integration
import { wechatAuth } from '../utils/auth'

export const authStore = {
  // State
  token: '',
  userInfo: null,
  permissions: [],
  isLoggedIn: false,
  needsBinding: false,
  isRefreshing: false,

  // Initialize from storage
  init() {
    this.token = uni.getStorageSync('token') || ''
    this.userInfo = uni.getStorageSync('userInfo') || null
    this.permissions = uni.getStorageSync('permissions') || []
    this.isLoggedIn = !!this.token
    this.needsBinding = this.userInfo && !this.userInfo.base_id
  },

  // Save to storage
  save() {
    uni.setStorageSync('token', this.token)
    uni.setStorageSync('userInfo', this.userInfo)
    uni.setStorageSync('permissions', this.permissions)
    uni.setStorageSync('loginTime', Date.now())
  },

  // Clear storage
  clear() {
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('permissions')
    uni.removeStorageSync('loginTime')
    this.token = ''
    this.userInfo = null
    this.permissions = []
    this.isLoggedIn = false
    this.needsBinding = false
  },

  // WeChat login
  async wechatLogin(options = {}) {
    try {
      const result = await wechatAuth.wechatLogin(options)
      
      if (result.token) {
        this.token = result.token
        this.userInfo = result.user
        this.permissions = result.permissions || []
        this.isLoggedIn = true
        this.needsBinding = result.needsBinding || false
        this.save()
      }
      
      return result
    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    }
  },

  // Regular login (for testing)
  async login(credentials) {
    try {
      // For development/testing purposes
      if (process.env.NODE_ENV === 'development') {
        this.token = 'mock-token-' + Date.now()
        this.userInfo = credentials.userInfo || { 
          id: 1, 
          username: credentials.username || '测试用户', 
          real_name: '测试用户',
          role: { name: 'admin' } 
        }
        this.permissions = ['read', 'write', 'admin']
        this.isLoggedIn = true
        this.needsBinding = false
        this.save()
        return { success: true, data: this.userInfo }
      }
      
      // In production, this would call the actual login API
      throw new Error('请使用微信登录')
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },

  // Logout
  async logout() {
    try {
      await wechatAuth.logout()
      this.clear()
      return { success: true }
    } catch (error) {
      // Even if logout API fails, clear local state
      this.clear()
      return { success: true }
    }
  },

  // Refresh token
  async refreshToken() {
    if (this.isRefreshing) {
      return
    }

    this.isRefreshing = true
    try {
      const newToken = await wechatAuth.refreshToken()
      this.token = newToken
      this.save()
      return newToken
    } catch (error) {
      // If refresh fails, logout user
      await this.logout()
      throw error
    } finally {
      this.isRefreshing = false
    }
  },

  // Check if token is near expiration
  get isTokenNearExpiration() {
    const loginTime = uni.getStorageSync('loginTime')
    if (!loginTime) return true
    
    // Check if token will expire in next 30 minutes
    const thirtyMinutes = 30 * 60 * 1000
    const tokenAge = Date.now() - loginTime
    const tokenExpiry = 24 * 60 * 60 * 1000 // 24 hours
    
    return tokenAge > (tokenExpiry - thirtyMinutes)
  },

  // Auto refresh token if needed
  async checkAndRefreshToken() {
    if (this.isTokenNearExpiration && !this.isRefreshing) {
      try {
        await this.refreshToken()
      } catch (error) {
        console.warn('自动刷新Token失败:', error)
      }
    }
  },

  // Bind user to base
  async bindToBase(baseId, inviteCode) {
    try {
      const result = await wechatAuth.bindUserToBase(baseId, inviteCode)
      
      // Update user info
      if (this.userInfo) {
        this.userInfo.base_id = baseId
        this.needsBinding = false
        this.save()
      }
      
      return result
    } catch (error) {
      console.error('绑定基地失败:', error)
      throw error
    }
  },

  // Get user profile
  async getUserProfile() {
    try {
      const profile = await wechatAuth.getUserProfile()
      
      if (profile) {
        this.userInfo = profile.user
        this.permissions = profile.permissions || []
        this.save()
      }
      
      return profile
    } catch (error) {
      console.error('获取用户资料失败:', error)
      throw error
    }
  },

  // Check permission
  hasPermission(permission) {
    if (!this.permissions || this.permissions.length === 0) {
      return false
    }
    return this.permissions.includes(permission) || this.permissions.includes('*')
  },

  // Check role
  hasRole(role) {
    return this.userInfo && this.userInfo.role && this.userInfo.role.name === role
  },

  // Check if user is authenticated
  get isAuthenticated() {
    return this.isLoggedIn && !!this.token && !!this.userInfo
  },

  // Get current user
  get currentUser() {
    return this.userInfo
  },

  // Get current base ID
  get currentBaseId() {
    return this.userInfo?.base_id || null
  }
}