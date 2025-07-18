import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { wechatAuth } from '@/utils/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const userInfo = ref(null)
  const permissions = ref([])
  const isLoggedIn = ref(false)
  const needsBinding = ref(false)

  // 计算属性
  const currentUser = computed(() => userInfo.value)
  const hasBaseBinding = computed(() => userInfo.value && userInfo.value.base_id)
  const userRole = computed(() => userInfo.value?.role?.name || '')

  // 微信登录
  const wechatLogin = async (options = {}) => {
    try {
      const result = await wechatAuth.wechatLogin({
        getUserInfo: true,
        ...options
      })
      
      // 更新状态
      token.value = result.token
      userInfo.value = result.user
      permissions.value = result.permissions || []
      isLoggedIn.value = true
      needsBinding.value = result.needsBinding || false
      
      return result
    } catch (error) {
      console.error('微信登录失败:', error)
      throw error
    }
  }

  // 绑定用户到基地
  const bindUserToBase = async (baseId, inviteCode) => {
    try {
      const result = await wechatAuth.bindUserToBase(baseId, inviteCode)
      
      // 更新用户信息
      if (result.user) {
        userInfo.value = result.user
        needsBinding.value = false
      }
      
      return result
    } catch (error) {
      console.error('绑定基地失败:', error)
      throw error
    }
  }

  // 获取用户资料
  const getUserProfile = async () => {
    try {
      const result = await wechatAuth.getUserProfile()
      
      // 更新状态
      if (result.user) {
        userInfo.value = result.user
        permissions.value = result.permissions || []
      }
      
      return result
    } catch (error) {
      console.error('获取用户资料失败:', error)
      throw error
    }
  }

  // 检查登录状态
  const checkLoginStatus = async () => {
    const hasLogin = wechatAuth.checkLoginStatus()
    
    if (hasLogin) {
      const savedToken = uni.getStorageSync('token')
      const savedUserInfo = uni.getStorageSync('userInfo')
      const savedPermissions = uni.getStorageSync('permissions')
      
      token.value = savedToken
      userInfo.value = savedUserInfo
      permissions.value = savedPermissions || []
      isLoggedIn.value = true
      needsBinding.value = !savedUserInfo?.base_id
      
      // 检查Token是否过期，如果过期尝试刷新
      if (wechatAuth.isTokenExpired()) {
        try {
          await wechatAuth.autoRefreshToken()
        } catch (error) {
          console.warn('Token自动刷新失败:', error)
          await logout()
        }
      }
    } else {
      // 清除状态
      token.value = ''
      userInfo.value = null
      permissions.value = []
      isLoggedIn.value = false
      needsBinding.value = false
    }
  }

  // 刷新Token
  const refreshToken = async () => {
    try {
      const newToken = await wechatAuth.refreshToken()
      token.value = newToken
      return newToken
    } catch (error) {
      console.error('Token刷新失败:', error)
      await logout()
      throw error
    }
  }

  // 检查权限
  const hasPermission = (permission) => {
    return wechatAuth.hasPermission(permission)
  }

  // 检查角色
  const hasRole = (role) => {
    return wechatAuth.hasRole(role)
  }

  // 登出
  const logout = async () => {
    try {
      await wechatAuth.logout()
    } finally {
      // 清除状态
      token.value = ''
      userInfo.value = null
      permissions.value = []
      isLoggedIn.value = false
      needsBinding.value = false
    }
  }

  // 获取可用基地列表
  const getAvailableBases = async () => {
    try {
      return await wechatAuth.getAvailableBases()
    } catch (error) {
      console.error('获取基地列表失败:', error)
      throw error
    }
  }

  // 验证邀请码
  const validateInviteCode = async (inviteCode, baseId) => {
    try {
      return await wechatAuth.validateInviteCode(inviteCode, baseId)
    } catch (error) {
      console.error('验证邀请码失败:', error)
      return false
    }
  }

  return {
    // 状态
    token,
    userInfo,
    permissions,
    isLoggedIn,
    needsBinding,
    
    // 计算属性
    currentUser,
    hasBaseBinding,
    userRole,
    
    // 方法
    wechatLogin,
    bindUserToBase,
    getUserProfile,
    checkLoginStatus,
    refreshToken,
    hasPermission,
    hasRole,
    logout,
    getAvailableBases,
    validateInviteCode
  }
})