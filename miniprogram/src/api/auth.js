import { authServiceApi } from './microservices'

export const authApi = {
  // 微信小程序登录
  async wxLogin() {
    try {
      // 获取微信登录code
      const loginRes = await uni.login({
        provider: 'weixin'
      })
      
      if (loginRes.errMsg === 'login:ok') {
        const response = await authServiceApi.wxLogin(loginRes.code)
        
        if (response.success) {
          // 保存token和用户信息
          uni.setStorageSync('token', response.data.token)
          uni.setStorageSync('user', response.data.user)
          
          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })
          
          return response.data
        } else {
          throw new Error(response.message || '登录失败')
        }
      } else {
        throw new Error('微信登录失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    }
  },

  // 用户名密码登录
  async login(credentials) {
    try {
      const response = await authServiceApi.login(credentials)
      
      if (response.success) {
        // 保存token和用户信息
        uni.setStorageSync('token', response.data.token)
        uni.setStorageSync('user', response.data.user)
        
        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
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
      await authServiceApi.logout()
      
      // 清除本地存储
      uni.removeStorageSync('token')
      uni.removeStorageSync('user')
      
      uni.showToast({
        title: '已退出登录',
        icon: 'success'
      })
      
      // 跳转到登录页
      uni.reLaunch({
        url: '/pages/login/index'
      })
    } catch (error) {
      console.error('登出失败:', error)
      // 即使登出失败也要清除本地数据
      uni.removeStorageSync('token')
      uni.removeStorageSync('user')
      
      uni.reLaunch({
        url: '/pages/login/index'
      })
    }
  },

  // 获取用户信息
  async getProfile() {
    try {
      const response = await authServiceApi.getProfile()
      
      if (response.success) {
        // 更新本地用户信息
        uni.setStorageSync('user', response.data.user)
        return response.data
      } else {
        throw new Error(response.message || '获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  },

  // 更新用户信息
  async updateProfile(data) {
    try {
      const response = await authServiceApi.updateProfile(data)
      
      if (response.success) {
        // 更新本地用户信息
        uni.setStorageSync('user', response.data.user)
        
        uni.showToast({
          title: '信息更新成功',
          icon: 'success'
        })
        
        return response.data
      } else {
        throw new Error(response.message || '更新用户信息失败')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    }
  },

  // 绑定手机号
  async bindPhone(phoneData) {
    try {
      const response = await authServiceApi.bindPhone(phoneData)
      
      if (response.success) {
        // 更新本地用户信息
        const user = uni.getStorageSync('user')
        user.phone = response.data.phone
        uni.setStorageSync('user', user)
        
        uni.showToast({
          title: '手机号绑定成功',
          icon: 'success'
        })
        
        return response.data
      } else {
        throw new Error(response.message || '绑定手机号失败')
      }
    } catch (error) {
      console.error('绑定手机号失败:', error)
      throw error
    }
  },

  // 刷新token
  async refreshToken() {
    try {
      const response = await authServiceApi.refreshToken()
      
      if (response.success) {
        uni.setStorageSync('token', response.data.token)
        return response.data
      } else {
        throw new Error(response.message || '刷新token失败')
      }
    } catch (error) {
      console.error('刷新token失败:', error)
      throw error
    }
  },

  // 检查登录状态
  isLoggedIn() {
    const token = uni.getStorageSync('token')
    const user = uni.getStorageSync('user')
    return !!(token && user)
  },

  // 获取当前用户
  getCurrentUser() {
    return uni.getStorageSync('user')
  },

  // 获取token
  getToken() {
    return uni.getStorageSync('token')
  }
}