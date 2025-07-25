/**
 * Tests for the Error Handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorHandler, ErrorSeverity, FeedbackType, handleApiError } from '@/utils/errorHandler'
import type { ApiError } from '@/utils/apiClient'

// Mock Element Plus components
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    warning: vi.fn()
  },
  ElMessageBox: {
    alert: vi.fn().mockResolvedValue(undefined),
    confirm: vi.fn().mockResolvedValue(undefined)
  },
  ElNotification: vi.fn()
}))

// Mock router
vi.mock('@/router', () => ({
  default: {
    currentRoute: {
      value: { path: '/dashboard' }
    },
    push: vi.fn()
  }
}))

import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      showUserFeedback: true,
      logErrors: false, // Disable logging for tests
      reportErrors: false,
      defaultFeedbackType: FeedbackType.MESSAGE
    })

    // Reset mocks
    vi.clearAllMocks()
  })

  describe('getUserMessage', () => {
    it('should return specific message for known error codes', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Network failed',
        code: 'NETWORK_ERROR'
      }

      const message = errorHandler.getUserMessage(error)
      expect(message).toBe('网络连接失败，请检查网络设置')
    })

    it('should return message based on HTTP status code', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Not found',
        status: 404
      }

      const message = errorHandler.getUserMessage(error)
      expect(message).toBe('请求的资源不存在')
    })

    it('should return error message as fallback', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Custom error message'
      }

      const message = errorHandler.getUserMessage(error)
      expect(message).toBe('Custom error message')
    })

    it('should return default message for unknown errors', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: ''
      }

      const message = errorHandler.getUserMessage(error)
      expect(message).toBe('未知错误，请联系管理员')
    })
  })

  describe('getErrorSeverity', () => {
    it('should return HIGH severity for server errors', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Server error',
        status: 500
      }

      const severity = errorHandler.getErrorSeverity(error)
      expect(severity).toBe(ErrorSeverity.HIGH)
    })

    it('should return MEDIUM severity for auth errors', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Unauthorized',
        status: 401
      }

      const severity = errorHandler.getErrorSeverity(error)
      expect(severity).toBe(ErrorSeverity.MEDIUM)
    })

    it('should return LOW severity for client errors', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Bad request',
        status: 400
      }

      const severity = errorHandler.getErrorSeverity(error)
      expect(severity).toBe(ErrorSeverity.LOW)
    })

    it('should return MEDIUM severity for network errors', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Network error',
        code: 'NETWORK_ERROR'
      }

      const severity = errorHandler.getErrorSeverity(error)
      expect(severity).toBe(ErrorSeverity.MEDIUM)
    })
  })

  describe('handleError', () => {
    it('should show message feedback by default', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Test error',
        code: 'TEST_ERROR'
      }

      errorHandler.handleError(error)

      expect(ElMessage.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          type: 'warning'
        })
      )
    })

    it('should show error message for high severity errors', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Server error',
        status: 500
      }

      errorHandler.handleError(error)

      expect(ElMessage.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '服务器内部错误，请稍后重试',
          type: 'error'
        })
      )
    })

    it('should show notification when specified', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Test error',
        code: 'TEST_ERROR'
      }

      errorHandler.handleError(error, undefined, FeedbackType.NOTIFICATION)

      expect(ElNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '操作失败',
          message: 'Test error',
          type: 'warning'
        })
      )
    })

    it('should show modal for critical errors', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Critical error',
        status: 500
      }

      errorHandler.handleError(error, undefined, FeedbackType.MODAL)

      expect(ElMessageBox.alert).toHaveBeenCalledWith(
        '服务器内部错误，请稍后重试',
        '错误',
        expect.objectContaining({
          confirmButtonText: '确定',
          type: 'error'
        })
      )
    })

    it('should not show feedback when type is SILENT', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Silent error',
        code: 'TEST_ERROR'
      }

      errorHandler.handleError(error, undefined, FeedbackType.SILENT)

      expect(ElMessage.error).not.toHaveBeenCalled()
      expect(ElMessage.warning).not.toHaveBeenCalled()
      expect(ElNotification).not.toHaveBeenCalled()
      expect(ElMessageBox.alert).not.toHaveBeenCalled()
    })
  })

  describe('handleValidationErrors', () => {
    it('should handle array of validation errors', () => {
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Email is invalid' }
      ]

      errorHandler.handleValidationErrors(errors)

      expect(ElMessage.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          message: '数据验证失败: Name is required; Email is invalid',
          type: 'warning'
        })
      )
    })

    it('should limit number of displayed errors', () => {
      const errors = Array.from({ length: 5 }, (_, i) => ({
        field: `field${i}`,
        message: `Error ${i}`
      }))

      errorHandler.handleValidationErrors(errors)

      expect(ElMessage.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('(共5个错误)')
        })
      )
    })

    it('should handle empty error array', () => {
      errorHandler.handleValidationErrors([])

      expect(ElMessage.warning).not.toHaveBeenCalled()
    })
  })

  describe('handleAuthError', () => {
    it('should show confirmation dialog for 401 errors', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Unauthorized',
        status: 401
      }

      errorHandler.handleAuthError(error)

      expect(ElMessageBox.confirm).toHaveBeenCalledWith(
        '登录已过期，是否重新登录？',
        '认证失败',
        expect.objectContaining({
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        })
      )
    })

    it('should handle non-401 auth errors normally', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Forbidden',
        status: 403
      }

      errorHandler.handleAuthError(error)

      expect(ElMessage.warning).toHaveBeenCalled()
      expect(ElMessageBox.confirm).not.toHaveBeenCalled()
    })
  })

  describe('handleNetworkError', () => {
    it('should show network error notification', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Network failed',
        code: 'NETWORK_ERROR'
      }

      errorHandler.handleNetworkError(error)

      expect(ElNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '网络错误',
          message: '网络连接不稳定，请检查网络设置后重试',
          type: 'error',
          duration: 8000
        })
      )
    })
  })

  describe('Utility Functions', () => {
    it('should export handleApiError function', () => {
      const error: ApiError = {
        name: 'ApiError',
        message: 'Test error'
      }

      handleApiError(error)

      expect(ElMessage.warning).toHaveBeenCalled()
    })
  })

  describe('Configuration', () => {
    it('should respect showUserFeedback setting', () => {
      const handler = new ErrorHandler({
        showUserFeedback: false
      })

      const error: ApiError = {
        name: 'ApiError',
        message: 'Test error'
      }

      handler.handleError(error)

      expect(ElMessage.error).not.toHaveBeenCalled()
      expect(ElMessage.warning).not.toHaveBeenCalled()
    })

    it('should use custom default feedback type', () => {
      const handler = new ErrorHandler({
        defaultFeedbackType: FeedbackType.NOTIFICATION
      })

      const error: ApiError = {
        name: 'ApiError',
        message: 'Test error'
      }

      handler.handleError(error)

      expect(ElNotification).toHaveBeenCalled()
      expect(ElMessage.warning).not.toHaveBeenCalled()
    })
  })
})