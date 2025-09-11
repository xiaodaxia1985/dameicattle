import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import { authState, tokenStorage, userStorage, permissionsStorage, permissionUtils } from '@/utils/authUtils'
import type { User, LoginRequest, LoginResponse } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>('')
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const isRefreshing = ref<boolean>(false)
  const refreshPromise = ref<Promise<void> | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  
  // Check if token is close to expiration (within 5 minutes)
  const isTokenNearExpiration = computed(() => authState.isTokenNearExpiration())

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await authApi.login(credentials)
      
      const { token: authToken, user: userData, permissions: userPermissions, expiresIn } = response.data
      
      // Update reactive state
      token.value = authToken
      user.value = userData
      permissions.value = userPermissions || []
      
      // Store authentication data using cross-platform utilities
      authState.storeAuthData(response.data, expiresIn)
      
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      // 只有在有有效token时才调用后端logout API
      if (token.value) {
        console.log('调用后端logout API...')
        await authApi.logout()
        console.log('后端logout成功')
      }
    } catch (error: any) {
      console.error('Logout API error:', error)
      // 即使后端logout失败，也要继续清除本地状态
      // 不要抛出错误，避免影响用户体验
    } finally {
      console.log('清除本地认证状态...')
      
      // Clear reactive state
      token.value = ''
      user.value = null
      permissions.value = []
      
      // Clear authentication data using cross-platform utilities
      authState.clearAuthData()
      
      console.log('本地认证状态已清除')
    }
  }

  const refreshToken = async (): Promise<void> => {
    // 简化token刷新逻辑，避免复杂的并发控制
    if (isRefreshing.value) {
      console.log('Token刷新已在进行中，跳过')
      return
    }

    isRefreshing.value = true
    
    try {
      console.log('开始刷新token...')
      const response = await authApi.refreshToken()
      
      const { token: newToken, user: userData, permissions: userPermissions, expiresIn } = response.data
      
      // Update reactive state with fresh data
      token.value = newToken
      user.value = userData
      permissions.value = userPermissions || []
      
      // Store authentication data using cross-platform utilities
      authState.storeAuthData(response.data, expiresIn)
      
      console.log('Token刷新成功')
    } catch (error: any) {
      console.error('Token刷新失败:', error)
      
      // Token刷新失败，清除认证状态
      token.value = ''
      user.value = null
      permissions.value = []
      authState.clearAuthData()
      
      throw new Error('登录已过期，请重新登录')
    } finally {
      isRefreshing.value = false
    }
  }



  // Proactive token refresh when near expiration
  const checkAndRefreshToken = async (): Promise<void> => {
    // 简化token检查逻辑
    if (!isAuthenticated.value || isRefreshing.value) {
      console.log('跳过token检查：未认证或正在刷新中')
      return
    }

    if (isTokenNearExpiration.value) {
      console.log('Token即将过期，尝试刷新')
      try {
        await refreshToken()
      } catch (error) {
        console.error('主动token刷新失败:', error)
        // 刷新失败时清除认证状态
        await logout()
      }
    }
  }

  const initializeAuth = async (): Promise<void> => {
    console.log('初始化认证状态...')
    
    try {
      const storedToken = tokenStorage.getToken()
      const storedUser = userStorage.getUser()
      const storedPermissions = permissionsStorage.getPermissions()
      
      console.log('从存储中读取的数据:', {
        hasToken: !!storedToken,
        hasUser: !!storedUser,
        permissionsCount: storedPermissions.length
      })
      
      if (storedToken && storedUser) {
        // 直接设置认证状态，不进行复杂的验证
        token.value = storedToken
        user.value = storedUser
        permissions.value = storedPermissions
        console.log('认证状态已恢复')
      } else {
        console.log('没有有效的认证数据')
        token.value = ''
        user.value = null
        permissions.value = []
      }
    } catch (error) {
      console.error('认证状态初始化失败:', error)
      // 初始化失败时清除状态
      authState.clearAuthData()
      token.value = ''
      user.value = null
      permissions.value = []
    }
    
    console.log('认证状态初始化完成:', {
      isAuthenticated: isAuthenticated.value,
      hasToken: !!token.value,
      hasUser: !!user.value
    })
  }

  const hasPermission = (permission: string): boolean => {
    return permissionUtils.hasPermission(permission)
  }

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionUtils.hasAnyPermission(permissionList)
  }

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionUtils.hasAllPermissions(permissionList)
  }

  const hasRole = (roleName: string): boolean => {
    return permissionUtils.hasRole(roleName)
  }

  const hasAnyRole = (roleNames: string[]): boolean => {
    return permissionUtils.hasAnyRole(roleNames)
  }

  const updateProfile = (userData: Partial<User>): void => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      // Use cross-platform utilities to store updated user data
      userStorage.setUser(user.value)
    }
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    isRefreshing,
    isTokenNearExpiration,
    login,
    logout,
    refreshToken,
    checkAndRefreshToken,
    initializeAuth,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    updateProfile
  }
})