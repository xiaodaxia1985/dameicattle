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
      console.log('Attempting login with:', credentials)
      const response = await authApi.login(credentials)
      console.log('Login response:', response)
      
      const { token: authToken, user: userData, permissions: userPermissions, expiresIn } = response.data
      
      // Update reactive state
      token.value = authToken
      user.value = userData
      permissions.value = userPermissions || []
      
      // Store authentication data using cross-platform utilities
      authState.storeAuthData(response.data, expiresIn)
      
      console.log('Login successful, token stored:', authToken.substring(0, 20) + '...')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    try {
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear reactive state
      token.value = ''
      user.value = null
      permissions.value = []
      
      // Clear authentication data using cross-platform utilities
      authState.clearAuthData()
    }
  }

  const refreshToken = async (): Promise<void> => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing.value && refreshPromise.value) {
      return refreshPromise.value
    }

    isRefreshing.value = true
    refreshPromise.value = performTokenRefresh()
    
    try {
      await refreshPromise.value
    } finally {
      isRefreshing.value = false
      refreshPromise.value = null
    }
  }

  const performTokenRefresh = async (): Promise<void> => {
    try {
      console.log('Attempting to refresh token...')
      const response = await authApi.refreshToken()
      
      const { token: newToken, user: userData, permissions: userPermissions, expiresIn } = response.data
      
      // Update reactive state with fresh data
      token.value = newToken
      user.value = userData
      permissions.value = userPermissions || []
      
      // Store authentication data using cross-platform utilities
      authState.storeAuthData(response.data, expiresIn)
      
      console.log('Token refreshed successfully')
    } catch (error: any) {
      console.error('Token refresh failed:', error)
      
      // Handle specific refresh errors
      if (error.code === 'TOKEN_EXPIRED_BEYOND_GRACE' || 
          error.code === 'TOKEN_NOT_IN_SESSION' ||
          error.code === 'ACCOUNT_INACTIVE' ||
          error.code === 'ACCOUNT_LOCKED') {
        // These errors require re-login
        await logout()
        throw new Error('Session expired. Please login again.')
      }
      
      // For other errors, still logout but with different message
      await logout()
      throw error
    }
  }

  // Proactive token refresh when near expiration
  const checkAndRefreshToken = async (): Promise<void> => {
    if (!isAuthenticated.value || isRefreshing.value) {
      return
    }

    if (isTokenNearExpiration.value) {
      try {
        await refreshToken()
      } catch (error) {
        console.error('Proactive token refresh failed:', error)
        // Error is already handled in refreshToken method
      }
    }
  }

  const initializeAuth = (): void => {
    // Use cross-platform utilities to get stored data
    const storedToken = tokenStorage.getToken()
    const storedUser = userStorage.getUser()
    const storedPermissions = permissionsStorage.getPermissions()
    
    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = storedUser
      permissions.value = storedPermissions
    }
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