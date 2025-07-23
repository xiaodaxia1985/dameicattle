import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginRequest, LoginResponse } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>('')
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      console.log('Attempting login with:', credentials)
      const response = await authApi.login(credentials)
      console.log('Login response:', response)
      
      const { token: authToken, user: userData, permissions: userPermissions } = response.data
      
      token.value = authToken
      user.value = userData
      permissions.value = userPermissions || []
      
      // Store in localStorage
      localStorage.setItem('token', authToken)
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('permissions', JSON.stringify(userPermissions || []))
      
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
      // Clear state
      token.value = ''
      user.value = null
      permissions.value = []
      
      // Clear localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('permissions')
    }
  }

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authApi.refreshToken()
      token.value = response.data.token
      localStorage.setItem('token', response.data.token)
    } catch (error) {
      // If refresh fails, logout
      await logout()
      throw error
    }
  }

  const initializeAuth = (): void => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedPermissions = localStorage.getItem('permissions')
    
    if (storedToken && storedUser && storedPermissions) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
      permissions.value = JSON.parse(storedPermissions)
    }
  }

  const hasPermission = (permission: string): boolean => {
    return permissions.value.includes(permission)
  }

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.value.includes(permission))
  }

  const updateProfile = (userData: Partial<User>): void => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    token,
    user,
    permissions,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    initializeAuth,
    hasPermission,
    hasAnyPermission,
    updateProfile
  }
})