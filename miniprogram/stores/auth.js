import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const userInfo = ref(null)
  const isLoggedIn = ref(false)

  // 微信登录
  const wechatLogin = async () => {
    try {
      // 获取微信登录凭证
      const loginRes = await uni.login()
      
      if (loginRes.code) {
        // 获取用户信息
        const userRes = await uni.getUserProfile({
          desc: '用于完善用户资料'
        })
        
        // 发送到后端验证
        const response = await uni.request({
          url: '/api/v1/auth/wechat-login',
          method: 'POST',
          data: {
            code: loginRes.code,
            userInfo: userRes.userInfo
          }
        })
        
        if (response.data.success) {
          token.value = response.data.data.token
          userInfo.value = response.data.data.user
          isLoggedIn.value = true
          
          // 存储到本地
          uni.setStorageSync('token', token.value)
          uni.setStorageSync('userInfo', userInfo.value)
          
          return response.data.data
        } else {
          throw new Error(response.data.message || '登录失败')
        }
      } else {
        throw new Error('获取微信登录凭证失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    }
  }

  // 检查登录状态
  const checkLoginStatus = () => {
    const savedToken = uni.getStorageSync('token')
    const savedUserInfo = uni.getStorageSync('userInfo')
    
    if (savedToken && savedUserInfo) {
      token.value = savedToken
      userInfo.value = savedUserInfo
      isLoggedIn.value = true
    }
  }

  // 登出
  const logout = () => {
    token.value = ''
    userInfo.value = null
    isLoggedIn.value = false
    
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    wechatLogin,
    checkLoginStatus,
    logout
  }
})