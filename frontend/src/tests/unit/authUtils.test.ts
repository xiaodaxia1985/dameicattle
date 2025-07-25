/**
 * Authentication Utilities Tests
 * Tests cross-platform authentication utilities for web and miniprogram
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  tokenStorage,
  userStorage,
  permissionsStorage,
  authState,
  permissionUtils,
  navigationUtils,
  authErrorUtils,
  platformUtils
} from '@/utils/authUtils'
import type { User, LoginResponse } from '@/types/auth'

// Mock uni for miniprogram environment
const mockUni = {
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  reLaunch: vi.fn()
}

// Mock localStorage for web environment
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

// Mock sessionStorage for web environment
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}

// Mock window object
const mockWindow = {
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  location: { pathname: '/test' },
  dispatchEvent: vi.fn()
}

describe('Authentication Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset global objects
    delete (global as any).uni
    delete (global as any).window
  })

  describe('Token Storage', () => {
    describe('Web Environment', () => {
      beforeEach(() => {
        (global as any).window = mockWindow
      })

      it('should get token from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue('test-token')
        
        const token = tokenStorage.getToken()
        
        expect(token).toBe('test-token')
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('token')
      })

      it('should fallback to sessionStorage if localStorage is empty', () => {
        mockLocalStorage.getItem.mockReturnValue(null)
        mockSessionStorage.getItem.mockReturnValue('session-token')
        
        const token = tokenStorage.getToken()
        
        expect(token).toBe('session-token')
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('token')
      })

      it('should set token in localStorage', () => {
        tokenStorage.setToken('new-token')
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'new-token')
      })

      it('should remove token from both storages', () => {
        tokenStorage.removeToken()
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('token')
      })
    })

    describe('Miniprogram Environment', () => {
      beforeEach(() => {
        (global as any).uni = mockUni
      })

      it('should get token from uni storage', () => {
        mockUni.getStorageSync.mockReturnValue('uni-token')
        
        const token = tokenStorage.getToken()
        
        expect(token).toBe('uni-token')
        expect(mockUni.getStorageSync).toHaveBeenCalledWith('token')
      })

      it('should set token in uni storage', () => {
        tokenStorage.setToken('uni-new-token')
        
        expect(mockUni.setStorageSync).toHaveBeenCalledWith('token', 'uni-new-token')
      })

      it('should remove token from uni storage', () => {
        tokenStorage.removeToken()
        
        expect(mockUni.removeStorageSync).toHaveBeenCalledWith('token')
      })
    })
  })

  describe('User Storage', () => {
    const testUser: User = {
      id: 1,
      username: 'testuser',
      real_name: 'Test User',
      status: 'active',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      role: {
        id: 1,
        name: 'employee',
        description: 'Employee',
        permissions: ['user:read', 'cattle:read'],
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    }

    describe('Web Environment', () => {
      beforeEach(() => {
        (global as any).window = mockWindow
      })

      it('should get user from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testUser))
        
        const user = userStorage.getUser()
        
        expect(user).toEqual(testUser)
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user')
      })

      it('should return null for invalid JSON', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid-json')
        
        expect(() => userStorage.getUser()).toThrow()
      })

      it('should set user in localStorage', () => {
        userStorage.setUser(testUser)
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(testUser))
      })

      it('should remove user from localStorage', () => {
        userStorage.removeUser()
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
      })
    })

    describe('Miniprogram Environment', () => {
      beforeEach(() => {
        (global as any).uni = mockUni
      })

      it('should get user from uni storage', () => {
        mockUni.getStorageSync.mockReturnValue(JSON.stringify(testUser))
        
        const user = userStorage.getUser()
        
        expect(user).toEqual(testUser)
        expect(mockUni.getStorageSync).toHaveBeenCalledWith('user')
      })

      it('should set user in uni storage', () => {
        userStorage.setUser(testUser)
        
        expect(mockUni.setStorageSync).toHaveBeenCalledWith('user', JSON.stringify(testUser))
      })
    })
  })

  describe('Permissions Storage', () => {
    const testPermissions = ['user:read', 'cattle:read', 'cattle:write']

    describe('Web Environment', () => {
      beforeEach(() => {
        (global as any).window = mockWindow
      })

      it('should get permissions from localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testPermissions))
        
        const permissions = permissionsStorage.getPermissions()
        
        expect(permissions).toEqual(testPermissions)
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('permissions')
      })

      it('should return empty array if no permissions', () => {
        mockLocalStorage.getItem.mockReturnValue(null)
        
        const permissions = permissionsStorage.getPermissions()
        
        expect(permissions).toEqual([])
      })

      it('should set permissions in localStorage', () => {
        permissionsStorage.setPermissions(testPermissions)
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('permissions', JSON.stringify(testPermissions))
      })
    })
  })

  describe('Auth State', () => {
    beforeEach(() => {
      (global as any).window = mockWindow
    })

    it('should check if user is authenticated', () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce('test-token')
        .mockReturnValueOnce(JSON.stringify({ id: 1, username: 'test' }))
      
      const isAuth = authState.isAuthenticated()
      
      expect(isAuth).toBe(true)
    })

    it('should return false if no token', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const isAuth = authState.isAuthenticated()
      
      expect(isAuth).toBe(false)
    })

    it('should check if token is expired', () => {
      const pastTime = Date.now() - 1000
      mockLocalStorage.getItem.mockReturnValue(pastTime.toString())
      
      const isExpired = authState.isTokenExpired()
      
      expect(isExpired).toBe(true)
    })

    it('should check if token is near expiration', () => {
      const nearFutureTime = Date.now() + (2 * 60 * 1000) // 2 minutes from now
      mockLocalStorage.getItem.mockReturnValue(nearFutureTime.toString())
      
      const isNearExpiration = authState.isTokenNearExpiration()
      
      expect(isNearExpiration).toBe(true)
    })

    it('should store auth data', () => {
      const loginResponse: LoginResponse = {
        token: 'test-token',
        user: {
          id: 1,
          username: 'testuser',
          real_name: 'Test User',
          status: 'active',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        permissions: ['user:read']
      }
      const expiresIn = 3600 // 1 hour
      
      authState.storeAuthData(loginResponse, expiresIn)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(loginResponse.user))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('permissions', JSON.stringify(['user:read']))
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('tokenExpiration', expect.any(String))
    })

    it('should clear auth data', () => {
      authState.clearAuthData()
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('permissions')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tokenExpiration')
    })
  })

  describe('Permission Utils', () => {
    beforeEach(() => {
      (global as any).window = mockWindow
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'permissions') {
          return JSON.stringify(['user:read', 'cattle:read', 'cattle:write'])
        }
        if (key === 'user') {
          return JSON.stringify({
            id: 1,
            username: 'test',
            role: { name: 'employee' }
          })
        }
        return null
      })
    })

    it('should check if user has permission', () => {
      expect(permissionUtils.hasPermission('user:read')).toBe(true)
      expect(permissionUtils.hasPermission('admin:access')).toBe(false)
    })

    it('should check if user has any permission', () => {
      expect(permissionUtils.hasAnyPermission(['admin:access', 'user:read'])).toBe(true)
      expect(permissionUtils.hasAnyPermission(['admin:access', 'super:admin'])).toBe(false)
    })

    it('should check if user has all permissions', () => {
      expect(permissionUtils.hasAllPermissions(['user:read', 'cattle:read'])).toBe(true)
      expect(permissionUtils.hasAllPermissions(['user:read', 'admin:access'])).toBe(false)
    })

    it('should get user role', () => {
      expect(permissionUtils.getUserRole()).toBe('employee')
    })

    it('should check if user has role', () => {
      expect(permissionUtils.hasRole('employee')).toBe(true)
      expect(permissionUtils.hasRole('admin')).toBe(false)
    })

    it('should check if user has any role', () => {
      expect(permissionUtils.hasAnyRole(['admin', 'employee'])).toBe(true)
      expect(permissionUtils.hasAnyRole(['admin', 'manager'])).toBe(false)
    })
  })

  describe('Navigation Utils', () => {
    describe('Web Environment', () => {
      beforeEach(() => {
        (global as any).window = mockWindow
      })

      it('should dispatch redirect to login event', () => {
        navigationUtils.redirectToLogin('/dashboard')
        
        expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'auth:redirect-to-login',
            detail: { redirectPath: '/dashboard' }
          })
        )
      })

      it('should dispatch redirect to home event', () => {
        navigationUtils.redirectToHome()
        
        expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'auth:redirect-to-home'
          })
        )
      })

      it('should get current path', () => {
        const path = navigationUtils.getCurrentPath()
        
        expect(path).toBe('/test')
      })
    })

    describe('Miniprogram Environment', () => {
      beforeEach(() => {
        (global as any).uni = mockUni
        // Mock getCurrentPages
        ;(global as any).getCurrentPages = vi.fn().mockReturnValue([
          { route: 'pages/dashboard/index' }
        ])
      })

      it('should redirect to login page', () => {
        navigationUtils.redirectToLogin('/pages/dashboard/index')
        
        expect(mockUni.reLaunch).toHaveBeenCalledWith({
          url: '/pages/login/index?redirect=%2Fpages%2Fdashboard%2Findex'
        })
      })

      it('should redirect to home page', () => {
        navigationUtils.redirectToHome()
        
        expect(mockUni.reLaunch).toHaveBeenCalledWith({
          url: '/pages/index/index'
        })
      })

      it('should get current path', () => {
        const path = navigationUtils.getCurrentPath()
        
        expect(path).toBe('pages/dashboard/index')
      })
    })
  })

  describe('Auth Error Utils', () => {
    it('should get user-friendly error messages', () => {
      expect(authErrorUtils.getErrorMessage('MISSING_TOKEN')).toBe('请先登录')
      expect(authErrorUtils.getErrorMessage('TOKEN_EXPIRED')).toBe('登录已过期，请重新登录')
      expect(authErrorUtils.getErrorMessage('ACCOUNT_LOCKED')).toBe('账户已被锁定，请联系管理员')
      expect(authErrorUtils.getErrorMessage('UNKNOWN_ERROR')).toBe('认证失败，请重新登录')
    })

    it('should check if error requires re-login', () => {
      expect(authErrorUtils.requiresReLogin('TOKEN_EXPIRED')).toBe(true)
      expect(authErrorUtils.requiresReLogin('ACCOUNT_LOCKED')).toBe(true)
      expect(authErrorUtils.requiresReLogin('INSUFFICIENT_PERMISSIONS')).toBe(false)
    })

    it('should check if error can be recovered by token refresh', () => {
      expect(authErrorUtils.canRefreshToken('TOKEN_EXPIRED')).toBe(true)
      expect(authErrorUtils.canRefreshToken('TOKEN_NOT_IN_SESSION')).toBe(true)
      expect(authErrorUtils.canRefreshToken('ACCOUNT_LOCKED')).toBe(false)
    })
  })

  describe('Platform Utils', () => {
    it('should detect miniprogram environment', () => {
      (global as any).uni = mockUni
      
      expect(platformUtils.isMiniprogram()).toBe(true)
      expect(platformUtils.isWeb()).toBe(false)
      expect(platformUtils.getPlatform()).toBe('miniprogram')
    })

    it('should detect web environment', () => {
      (global as any).window = mockWindow
      
      expect(platformUtils.isMiniprogram()).toBe(false)
      expect(platformUtils.isWeb()).toBe(true)
      expect(platformUtils.getPlatform()).toBe('web')
    })

    it('should detect unknown environment', () => {
      expect(platformUtils.isMiniprogram()).toBe(false)
      expect(platformUtils.isWeb()).toBe(false)
      expect(platformUtils.getPlatform()).toBe('unknown')
    })
  })
})