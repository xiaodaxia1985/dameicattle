/**
 * Error handling utilities for API client
 * Provides user-friendly error messages and feedback mechanisms
 */

import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { ApiError, ErrorCategory } from './apiClient'

// Error message mappings
const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT: '请求超时，请稍后重试',
  
  // Authentication errors
  AUTH_FAILED: '认证失败，请重新登录',
  TOKEN_EXPIRED: '登录已过期，请重新登录',
  UNAUTHORIZED: '权限不足，无法访问该资源',
  
  // Validation errors
  VALIDATION_ERROR: '数据验证失败，请检查输入',
  REQUIRED_FIELD: '必填字段不能为空',
  INVALID_FORMAT: '数据格式不正确',
  
  // Server errors
  SERVER_ERROR: '服务器内部错误，请稍后重试',
  SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后重试',
  
  // Client errors
  NOT_FOUND: '请求的资源不存在',
  METHOD_NOT_ALLOWED: '请求方法不被允许',
  
  // Default
  UNKNOWN: '未知错误，请联系管理员'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// User feedback types
export enum FeedbackType {
  MESSAGE = 'message',
  NOTIFICATION = 'notification',
  MODAL = 'modal',
  SILENT = 'silent'
}

export interface ErrorHandlerConfig {
  showUserFeedback?: boolean
  logErrors?: boolean
  reportErrors?: boolean
  defaultFeedbackType?: FeedbackType
}

export interface ErrorContext {
  url?: string
  method?: string
  userId?: string
  timestamp?: string
  userAgent?: string
  component?: string
  action?: string
}

export class ErrorHandler {
  private config: Required<ErrorHandlerConfig>

  constructor(config: ErrorHandlerConfig = {}) {
    this.config = {
      showUserFeedback: true,
      logErrors: true,
      reportErrors: false,
      defaultFeedbackType: FeedbackType.MESSAGE,
      ...config
    }
  }

  // Main error handling method
  handleError(error: ApiError, context?: ErrorContext, feedbackType?: FeedbackType): void {
    // Log error if enabled
    if (this.config.logErrors) {
      this.logError(error, context)
    }

    // Report error if enabled
    if (this.config.reportErrors) {
      this.reportError(error, context)
    }

    // Show user feedback if enabled
    if (this.config.showUserFeedback) {
      const type = feedbackType || this.config.defaultFeedbackType
      this.showUserFeedback(error, type, context)
    }
  }

  // Get user-friendly error message
  getUserMessage(error: ApiError): string {
    // Check for specific error codes first
    if (error.code && ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES]) {
      return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES]
    }

    // Check for HTTP status codes
    if (error.status) {
      switch (error.status) {
        case 400:
          return '请求参数错误'
        case 401:
          return ERROR_MESSAGES.AUTH_FAILED
        case 403:
          return ERROR_MESSAGES.UNAUTHORIZED
        case 404:
          return ERROR_MESSAGES.NOT_FOUND
        case 405:
          return ERROR_MESSAGES.METHOD_NOT_ALLOWED
        case 408:
          return ERROR_MESSAGES.TIMEOUT
        case 422:
          return ERROR_MESSAGES.VALIDATION_ERROR
        case 429:
          return '请求过于频繁，请稍后重试'
        case 500:
          return ERROR_MESSAGES.SERVER_ERROR
        case 502:
          return '网关错误，请稍后重试'
        case 503:
          return ERROR_MESSAGES.SERVICE_UNAVAILABLE
        case 504:
          return '网关超时，请稍后重试'
        default:
          return error.status >= 500 ? ERROR_MESSAGES.SERVER_ERROR : ERROR_MESSAGES.UNKNOWN
      }
    }

    // Fallback to error message or default
    return error.message || ERROR_MESSAGES.UNKNOWN
  }

  // Determine error severity
  getErrorSeverity(error: ApiError): ErrorSeverity {
    if (error.status) {
      if (error.status >= 500) {
        return ErrorSeverity.HIGH
      } else if (error.status === 401 || error.status === 403) {
        return ErrorSeverity.MEDIUM
      } else if (error.status >= 400) {
        return ErrorSeverity.LOW
      }
    }

    if (error.code) {
      const criticalCodes = ['NETWORK_ERROR', 'TIMEOUT']
      if (criticalCodes.includes(error.code)) {
        return ErrorSeverity.MEDIUM
      }
    }

    return ErrorSeverity.LOW
  }

  // Show user feedback based on type
  private showUserFeedback(error: ApiError, type: FeedbackType, context?: ErrorContext): void {
    const message = this.getUserMessage(error)
    const severity = this.getErrorSeverity(error)

    switch (type) {
      case FeedbackType.MESSAGE:
        this.showMessage(message, severity)
        break
      case FeedbackType.NOTIFICATION:
        this.showNotification(message, severity, error)
        break
      case FeedbackType.MODAL:
        this.showModal(message, error, context)
        break
      case FeedbackType.SILENT:
        // Do nothing, just log
        break
    }
  }

  // Show Element Plus message
  private showMessage(message: string, severity: ErrorSeverity): void {
    const type = severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL ? 'error' : 'warning'
    
    ElMessage({
      message,
      type,
      duration: severity === ErrorSeverity.HIGH ? 5000 : 3000,
      showClose: true
    })
  }

  // Show Element Plus notification
  private showNotification(message: string, severity: ErrorSeverity, error: ApiError): void {
    const type = severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL ? 'error' : 'warning'
    
    ElNotification({
      title: '操作失败',
      message,
      type,
      duration: severity === ErrorSeverity.HIGH ? 8000 : 5000,
      position: 'top-right'
    })
  }

  // Show modal dialog for critical errors
  private showModal(message: string, error: ApiError, context?: ErrorContext): void {
    ElMessageBox.alert(message, '错误', {
      confirmButtonText: '确定',
      type: 'error',
      showClose: false
    }).catch(() => {
      // User closed the modal
    })
  }

  // Log error to console
  private logError(error: ApiError, context?: ErrorContext): void {
    const logData = {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    }

    console.error('[ErrorHandler]', logData)
  }

  // Report error to external service (placeholder)
  private reportError(error: ApiError, context?: ErrorContext): void {
    // This would typically send error data to an error reporting service
    // like Sentry, LogRocket, etc.
    
    const errorReport = {
      message: error.message,
      code: error.code,
      status: error.status,
      url: context?.url,
      userId: context?.userId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      component: context?.component,
      action: context?.action
    }

    // Example: Send to error reporting service
    // errorReportingService.report(errorReport)
    
    console.log('[ErrorHandler] Error reported:', errorReport)
  }

  // Handle validation errors specifically
  handleValidationErrors(errors: any[], context?: ErrorContext): void {
    if (!Array.isArray(errors) || errors.length === 0) {
      return
    }

    // Show first few validation errors
    const maxErrors = 3
    const errorMessages = errors
      .slice(0, maxErrors)
      .map(err => err.message || err.toString())
      .join('; ')

    const message = errors.length > maxErrors 
      ? `${errorMessages}... (共${errors.length}个错误)`
      : errorMessages

    ElMessage({
      message: `数据验证失败: ${message}`,
      type: 'warning',
      duration: 5000,
      showClose: true
    })

    if (this.config.logErrors) {
      console.warn('[ErrorHandler] Validation errors:', errors)
    }
  }

  // Handle authentication errors specifically
  handleAuthError(error: ApiError, context?: ErrorContext): void {
    if (error.status === 401) {
      ElMessageBox.confirm(
        '登录已过期，是否重新登录？',
        '认证失败',
        {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // Redirect to login
        window.location.href = '/login'
      }).catch(() => {
        // User cancelled
      })
    } else {
      this.handleError(error, context, FeedbackType.MESSAGE)
    }
  }

  // Handle network errors specifically
  handleNetworkError(error: ApiError, context?: ErrorContext): void {
    ElNotification({
      title: '网络错误',
      message: '网络连接不稳定，请检查网络设置后重试',
      type: 'error',
      duration: 8000,
      position: 'top-right'
    })

    if (this.config.logErrors) {
      this.logError(error, context)
    }
  }
}

// Create default error handler instance
export const errorHandler = new ErrorHandler({
  showUserFeedback: true,
  logErrors: true,
  reportErrors: false,
  defaultFeedbackType: FeedbackType.MESSAGE
})

// Utility functions for common error scenarios
export const handleApiError = (error: ApiError, context?: ErrorContext) => {
  errorHandler.handleError(error, context)
}

export const handleValidationError = (errors: any[], context?: ErrorContext) => {
  errorHandler.handleValidationErrors(errors, context)
}

export const handleAuthError = (error: ApiError, context?: ErrorContext) => {
  errorHandler.handleAuthError(error, context)
}

export const handleNetworkError = (error: ApiError, context?: ErrorContext) => {
  errorHandler.handleNetworkError(error, context)
}

export default errorHandler