/**
 * Authentication Utilities
 * Cross-platform authentication helpers for web and miniprogram
 */

import type { User, LoginRequest, LoginResponse } from '@/types/auth'

// Platform detection
const isUniApp = typeof window !== 'undefined' && 'uni' in window
const uni = isUniApp ? (window as any).uni : null

// Token storage utilities
export const tokenStorage = {
  // Get token from storage
  getToken(): string | null {
    if (isUniApp && uni) {
      // Miniprogram environment
      return uni.getStorageSync('token') || null
    } else if (typeof window !== 'undefined') {
      // Web environment
      return window.localStorage.getItem('token') || window.sessionStorage.getItem('token')
    }
    return null
  },

  // Set token in storage
  setToken(token: string): void {
    if (isUniApp && uni) {
      // Miniprogram environment
      uni.setStorageSync('token', token)
    } else if (typeof window !== 'undefined') {
      // Web environment
      window.localStorage.setItem('token', token)
    }
  },

  // Remove token from storage
  removeToken(): void {
    if (isUniApp && uni) {
      // Miniprogram environment
      uni.removeStorageSync('token')
    } else if (typeof window !== 'undefined') {
      // Web environment
      window.localStorage.removeItem('token')
      window.sessionStorage.removeItem('token')
    }
  },

  // Get token expiration time
  getTokenExpiration(): number | null {
    if (isUniApp && uni) {
      // Miniprogram environment
      const expiration = uni.getStorageSync('tokenExpiration')
      return expiration ? parseInt(expiration) : null
    } else if (typeof window !== 'undefined') {
      // Web environment
      const expiration = window.localStorage.getItem('tokenExpiration')
      return expiration ? parseInt(expiration) : null
    }
    return null
  },

  // Set token expiration time
  setTokenExpiration(expirationTime: number): void {
    if (isUniApp && uni) {
      // Miniprogram environment
      uni.setStorageSync('tokenExpiration', expirationTime.toString())
    } else if (typeof window !== 'undefined') {
      // Web environment
      window.localStorage.setItem('tokenExpiration', expirationTime.toString())
    }
  },

  // Remove token expiration time
  removeTokenExpiration(): void {
    if (isUniApp && uni) {
      // Miniprogram environment
      uni.removeStorageSync('tokenExpiration')
    } else if (typeof window !== 'undefined') {
      // Web environment
      window.localStorage.removeItem('tokenExpiration')
    }
  }
}

// User data storage utilities
export const userStorage = {
  // Get user data from storage
  getUser(): User | null {
    if (isUniApp && uni) {
      // Miniprogram environment
      const userData = uni.getStorageSync('user')
      return userData ? JSON.parse(userData) : null
    } else if (typeof window !== 'undefined') {
      // Web environment
      const userData = window.localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
    return null
  },

  // Set user data in storage
  setUser(user: User): void {
    const userData = JSON.stringify(user)
    if (isUniApp && uni) {
      // Miniprogram environment
      uni.setStorageSync('user', userData)
    } else if (typeof window !== 'undefined') {
      // Web environment
      window.localStorage.setItem('user', userData)
    }
  },

  // Remove user data from storage
  removeUser(): void {
    if (isUniApp && uni) {
      // Miniprogram environment
      uni.removeStorageSync('user')
    } else if (typeof window !== 'undefined') {
      // Web environment
      window.localStorage.removeItem('user')
    }
  }
}

// Permissions storage utilities
export const permissionsStorage = {
  // Get permissions from storage
  getPermissions(): string[] {
    if (isUniApp && uni) {
      // Miniprogram environment
      const permissions = uni.getStorageSync('permissions')
      return permissions ? JSON.parse(permissions) : []
    } else if (typeof window !== 'undefined') {
      // Web environment
      const permissions = window.localStorage.getItem('permissions')
      return permissions ? JSON.parse(permissions) : []
    }
    return []
  },

  // Set permissions in storage
  setPermissions(permissions: string[]): void {
    const permissionsData = JSON.stringify(permissions)
    if (isUniApp && uni) {
      // Miniprogram environment
      uni.setStorageSync('permissions', permissionsData)
    } else if (typeof window !== 'undefined') {
      // Web environment
      window.localStorage.setItem('permissions', permissionsData)
    }
  },

  // Remove permissions from storage
  removePermissions(): void {
    if (isUniApp && uni) {
      // Miniprogram environment
      uni.removeStorageSync('permissions')
    } else if (typeof window !== 'undefined') {
      // Web environment
      window.localStorage.removeItem('permissions')
    }
  }
}

// Authentication state utilities
export const authState = {
  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = tokenStorage.getToken()
    const user = userStorage.getUser()
    return !!(token && user)
  },

  // Check if token is expired
  isTokenExpired(): boolean {
    const expiration = tokenStorage.getTokenExpiration()
    if (!expiration) return true
    
    return Date.now() > expiration
  },

  // Check if token is near expiration (within 5 minutes)
  isTokenNearExpiration(): boolean {
    const expiration = tokenStorage.getTokenExpiration()
    if (!expiration) return true
    
    const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
    return (expiration - Date.now()) < fiveMinutes
  },

  // Clear all authentication data
  clearAuthData(): void {
    tokenStorage.removeToken()
    tokenStorage.removeTokenExpiration()
    userStorage.removeUser()
    permissionsStorage.removePermissions()
  },

  // Store authentication data
  storeAuthData(loginResponse: LoginResponse, expiresIn?: number): void {
    const { token, user, permissions } = loginResponse
    
    // Store token
    tokenStorage.setToken(token)
    
    // Store user data
    userStorage.setUser(user)
    
    // Store permissions
    permissionsStorage.setPermissions(permissions || [])
    
    // Store token expiration time
    if (expiresIn) {
      const expirationTime = Date.now() + (expiresIn * 1000)
      tokenStorage.setTokenExpiration(expirationTime)
    }
  }
}

// Permission checking utilities
export const permissionUtils = {
  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const permissions = permissionsStorage.getPermissions()
    
    // 如果没有权限数据，返回false
    if (!permissions || permissions.length === 0) {
      return false
    }
    
    // 检查通配符权限（超级管理员）
    if (permissions.includes('*')) {
      return true
    }
    
    // 检查具体权限
    return permissions.includes(permission)
  },

  // Check if user has any of the specified permissions
  hasAnyPermission(permissionList: string[]): boolean {
    const permissions = permissionsStorage.getPermissions()
    return permissionList.some(permission => permissions.includes(permission))
  },

  // Check if user has all of the specified permissions
  hasAllPermissions(permissionList: string[]): boolean {
    const permissions = permissionsStorage.getPermissions()
    return permissionList.every(permission => permissions.includes(permission))
  },

  // Get user's role from stored user data
  getUserRole(): string | null {
    const user = userStorage.getUser()
    return user?.role?.name || null
  },

  // Check if user has specific role
  hasRole(roleName: string): boolean {
    const userRole = this.getUserRole()
    return userRole === roleName
  },

  // Check if user has any of the specified roles
  hasAnyRole(roleNames: string[]): boolean {
    const userRole = this.getUserRole()
    return userRole ? roleNames.includes(userRole) : false
  }
}

// Navigation utilities for different platforms
export const navigationUtils = {
  // Redirect to login page
  redirectToLogin(redirectPath?: string): void {
    if (isUniApp && uni) {
      // Miniprogram environment
      const url = redirectPath ? `/pages/login/index?redirect=${encodeURIComponent(redirectPath)}` : '/pages/login/index'
      uni.reLaunch({ url })
    } else if (typeof window !== 'undefined') {
      // Web environment - this will be handled by the router in the interceptor
      const event = new CustomEvent('auth:redirect-to-login', {
        detail: { redirectPath }
      })
      window.dispatchEvent(event)
    }
  },

  // Get current page path
  getCurrentPath(): string {
    if (isUniApp && uni && typeof (window as any).getCurrentPages === 'function') {
      // Miniprogram environment
      const pages = (window as any).getCurrentPages()
      const currentPage = pages[pages.length - 1]
      return currentPage ? currentPage.route || '' : ''
    } else if (typeof window !== 'undefined' && window.location) {
      // Web environment
      return window.location.pathname
    }
    return ''
  }
}

// Auth error utilities
export const authErrorUtils = {
  // Check if error is authentication related
  isAuthError(error: any): boolean {
    return error?.status === 401 || error?.response?.status === 401
  },

  // Check if error is permission related
  isPermissionError(error: any): boolean {
    return error?.status === 403 || error?.response?.status === 403
  },

  // Handle authentication errors
  handleAuthError(error: any): void {
    console.error('Authentication error:', error)
    authState.clearAuthData()
  }
}

export default {
  tokenStorage,
  userStorage,
  permissionsStorage,
  authState,
  permissionUtils,
  navigationUtils,
  authErrorUtils
}