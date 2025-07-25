// 认证API
import { api } from '../apiClient'

export const authApi = {
  // 用户登录
  async login(data) {
    try {
      const response = await api.post('/auth/login', data)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  },

  // 用户登出
  async logout() {
    try {
      const response = await api.post('/auth/logout')
      return response.success
    } catch (error) {
      console.error('登出失败:', error)
      // 即使后端登出失败，也要清除本地状态
      return true
    }
  },

  // 刷新Token
  async refreshToken() {
    try {
      const response = await api.post('/auth/refresh')
      if (response.success && response.data.token) {
        return response.data
      } else {
        throw new Error(response.message || 'Token刷新失败')
      }
    } catch (error) {
      console.error('Token刷新失败:', error)
      throw error
    }
  },

  // 微信登录
  async wxLogin(data) {
    try {
      const response = await api.post('/auth/wechat-login', data)
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || '微信登录失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    }
  },

  // 绑定用户到基地
  async bindUser(data) {
    try {
      const response = await api.post('/auth/bind-user', data)
      if (response.success) {
        uni.showToast({
          title: '绑定成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '绑定失败')
      }
    } catch (error) {
      console.error('绑定用户失败:', error)
      throw error
    }
  },

  // 获取用户资料
  async getProfile() {
    try {
      const response = await api.get('/auth/profile')
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取用户资料失败:', error)
      throw error
    }
  },

  // 验证邀请码
  async validateInvite(data) {
    try {
      const response = await api.post('/auth/validate-invite', data)
      return response.success
    } catch (error) {
      console.error('验证邀请码失败:', error)
      return false
    }
  }
}

export default authApi