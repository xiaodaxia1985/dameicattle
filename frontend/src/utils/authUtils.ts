/**
 * Authentication Utilities
 * Cross-platform authentication helpers for web and miniprogram
 */

import type { User, LoginRequest, LoginResponse } from '@/types/auth'

// Token storage utilities
export const tokenStorage = {
  // Get token from storage
  getToken(): string | null {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      return uni.getStorageSync('token') || null
    } else if (typeof window !== 'undefined') {
      // Web environment
      return localStorage.getItem('token') || sessionStorage.getItem('token')
    }
    return null
  },

  // Set token in storage
  setToken(token: string): void {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      uni.setStorageSync('token', token)
    } else if (typeof window !== 'undefined') {
      // Web environment
      localStorage.setItem('token', token)
    }
  },

  // Remove token from storage
  removeToken(): void {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      uni.removeStorageSync('token')
    } else if (typeof window !== 'undefined') {
      // Web environment
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
    }
  },

  // Get token expiration time
  getTokenExpiration(): number | null {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      const expiration = uni.getStorageSync('tokenExpiration')
      return expiration ? parseInt(expiration) : null
    } else if (typeof window !== 'undefined') {
      // Web environment
      const expiration = localStorage.getItem('tokenExpiration')
      return expiration ? parseInt(expiration) : null
    }
    return null
  },

  // Set token expiration time
  setTokenExpiration(expirationTime: number): void {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      uni.setStorageSync('tokenExpiration', expirationTime.toString())
    } else if (typeof window !== 'undefined') {
      // Web environment
      localStorage.setItem('tokenExpiration', expirationTime.toString())
    }
  },

  // Remove token expiration time
  removeTokenExpiration(): void {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      uni.removeStorageSync('tokenExpiration')
    } else if (typeof window !== 'undefined') {
      // Web environment
      localStorage.removeItem('tokenExpiration')
    }
  }
}

// User data storage utilities
export const userStorage = {
  // Get user data from storage
  getUser(): User | null {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      const userData = uni.getStorageSync('user')
      return userData ? JSON.parse(userData) : null
    } else if (typeof window !== 'undefined') {
      // Web environment
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
    return null
  },

  // Set user data in storage
  setUser(user: User): void {
    const userData = JSON.stringify(user)
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      uni.setStorageSync('user', userData)
    } else if (typeof window !== 'undefined') {
      // Web environment
      localStorage.setItem('user', userData)
    }
  },

  // Remove user data from storage
  removeUser(): void {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      uni.removeStorageSync('user')
    } else if (typeof window !== 'undefined') {
      // Web environment
      localStorage.removeItem('user')
    }
  }
}

// Permissions storage utilities
export const permissionsStorage = {
  // Get permissions from storage
  getPermissions(): string[] {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      const permissions = uni.getStorageSync('permissions')
      return permissions ? JSON.parse(permissions) : []
    } else if (typeof window !== 'undefined') {
      // Web environment
      const permissions = localStorage.getItem('permissions')
      return permissions ? JSON.parse(permissions) : []
    }
    return []
  },

  // Set permissions in storage
  setPermissions(permissions: string[]): void {
    const permissionsData = JSON.stringify(permissions)
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      uni.setStorageSync('permissions', permissionsData)
    } else if (typeof window !== 'undefined') {
      // Web environment
      localStorage.setItem('permissions', permissionsData)
    }
  },

  // Remove permissions from storage
  removePermissions(): void {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      uni.removeStorageSync('permissions')
    } else if (typeof window !== 'undefined') {
      // Web environment
      localStorage.removeItem('permissions')
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
    if (typeof uni !== 'undefined') {
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

  // Redirect to home page after login
  redirectToHome(): void {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      uni.reLaunch({ url: '/pages/index/index' })
    } else if (typeof window !== 'undefined') {
      // Web environment
      const event = new CustomEvent('auth:redirect-to-home')
      window.dispatchEvent(event)
    }
  },

  // Get current page path
  getCurrentPath(): string {
    if (typeof uni !== 'undefined') {
      // Miniprogram environment
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      return currentPage ? currentPage.route || '' : ''
    } else if (typeof window !== 'undefined' && window.location) {
      // Web environment
      return window.location.pathname
    }
    return ''
  }
}

// Error handling utilities
export const authErrorUtils = {
  // Get user-friendly error message
  getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      'MISSING_TOKEN': '请先登录',
      'INVALID_TOKEN_FORMAT': '登录信息格式错误，请重新登录',
      'INVALID_TOKEN': '登录信息无效，请重新登录',
      'TOKEN_EXPIRED': '登录已过期，请重新登录',
      'TOKEN_NOT_IN_SESSION': '会话已失效，请重新登录',
      'TOKEN_MISMATCH': '登录状态异常，请重新登录',
      'USER_NOT_FOUND': '用户不存在',
      'ACCOUNT_INACTIVE': '账户已被禁用，请联系管理员',
      'ACCOUNT_LOCKED': '账户已被锁定，请联系管理员',
      'TOKEN_EXPIRED_BEYOND_GRACE': '登录已过期，请重新登录',
      'INSUFFICIENT_PERMISSIONS': '权限不足，无法执行此操作',
      'NO_ROLE_ASSIGNED': '用户未分配角色，请联系管理员',
      'NO_PERMISSIONS_CONFIGURED': '角色权限未配置，请联系管理员'
    }
    
    return errorMessages[errorCode] || '认证失败，请重新登录'
  },

  // Check if error requires re-login
  requiresReLogin(errorCode: string): boolean {
    const reLoginCodes = [
      'MISSING_TOKEN',
      'INVALID_TOKEN_FORMAT',
      'INVALID_TOKEN',
      'TOKEN_EXPIRED',
      'TOKEN_NOT_IN_SESSION',
      'TOKEN_MISMATCH',
      'USER_NOT_FOUND',
      'ACCOUNT_INACTIVE',
      'ACCOUNT_LOCKED',
      'TOKEN_EXPIRED_BEYOND_GRACE'
    ]
    
    return reLoginCodes.includes(errorCode)
  },

  // Check if error can be recovered by token refresh
  canRefreshToken(errorCode: string): boolean {
    const refreshableCodes = [
      'TOKEN_EXPIRED',
      'TOKEN_NOT_IN_SESSION',
      'TOKEN_MISMATCH'
    ]
    
    return refreshableCodes.includes(errorCode)
  }
}

// Platform detection utilities
export const platformUtils = {
  // Check if running in miniprogram
  isMiniprogram(): boolean {
    return typeof uni !== 'undefined'
  },

  // Check if running in web browser
  isWeb(): boolean {
    return typeof window !== 'undefined' && typeof uni === 'undefined'
  },

  // Get platform name
  getPlatform(): 'miniprogram' | 'web' | 'unknown' {
    if (this.isMiniprogram()) return 'miniprogram'
    if (this.isWeb()) return 'web'
    return 'unknown'
  }
}

export default {
  tokenStorage,
  userStorage,
  permissionsStorage,
  authState,
  permissionUtils,
  navigationUtils,
  authErrorUtils,
  platformUtils
}