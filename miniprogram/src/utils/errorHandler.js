/**
 * Miniprogram Error Handler and User Feedback System
 * Provides comprehensive error handling with user-friendly feedback
 */

// Error categories specific to miniprogram
export const MiniprogramErrorCategory = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  WECHAT_API: 'WECHAT_API',
  PERMISSION: 'PERMISSION',
  VALIDATION: 'VALIDATION',
  BUSINESS: 'BUSINESS',
  SYSTEM: 'SYSTEM',
  UNKNOWN: 'UNKNOWN'
}

// User-friendly error messages in Chinese
const errorMessages = {
  // Network errors
  NETWORK_ERROR: '网络连接失败，请检查网络设置后重试',
  TIMEOUT: '请求超时，请稍后重试',
  CONNECTION_REFUSED: '无法连接到服务器，请稍后重试',
  
  // Authentication errors
  AUTH_FAILED: '认证失败，请重新登录',
  TOKEN_EXPIRED: '登录已过期，请重新登录',
  TOKEN_INVALID: '登录状态异常，请重新登录',
  UNAUTHORIZED: '权限不足，无法访问该功能',
  ACCOUNT_LOCKED: '账户已被锁定，请联系管理员',
  ACCOUNT_DISABLED: '账户已被禁用，请联系管理员',
  
  // WeChat API errors
  WECHAT_LOGIN_FAILED: '微信登录失败，请重试',
  WECHAT_AUTH_DENIED: '微信授权被拒绝，无法继续',
  WECHAT_API_ERROR: '微信接口调用失败，请重试',
  WECHAT_NETWORK_ERROR: '微信网络异常，请检查网络后重试',
  
  // Permission errors
  LOCATION_PERMISSION_DENIED: '需要位置权限才能使用此功能',
  CAMERA_PERMISSION_DENIED: '需要相机权限才能使用此功能',
  STORAGE_PERMISSION_DENIED: '需要存储权限才能使用此功能',
  
  // Validation errors
  VALIDATION_ERROR: '输入数据格式不正确，请检查后重试',
  REQUIRED_FIELD_MISSING: '请填写必填字段',
  INVALID_FORMAT: '数据格式不正确',
  
  // Business errors
  BUSINESS_RULE_VIOLATION: '操作违反业务规则',
  RESOURCE_NOT_FOUND: '请求的资源不存在',
  RESOURCE_CONFLICT: '资源冲突，请刷新后重试',
  OPERATION_NOT_ALLOWED: '当前状态下不允许此操作',
  
  // System errors
  SERVER_ERROR: '服务器内部错误，请稍后重试',
  SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后重试',
  MAINTENANCE_MODE: '系统正在维护中，请稍后重试',
  
  // Default
  UNKNOWN: '未知错误，请联系技术支持'
}

class MiniprogramErrorHandler {
  constructor() {
    this.errorLog = []
    this.maxLogSize = 100
  }

  /**
   * Handle error with user feedback
   * @param {Error} error - The error object
   * @param {Object} context - Error context information
   * @param {Object} options - Handling options
   */
  handleError(error, context = {}, options = {}) {
    // Log error
    this.logError(error, context)

    // Categorize error
    const category = this.categorizeError(error)
    
    // Get user message
    const userMessage = this.getUserMessage(error, category)
    
    // Show user feedback
    this.showUserFeedback(userMessage, category, options)
    
    // Handle specific error types
    this.handleSpecificError(error, category, context)
    
    return {
      category,
      message: userMessage,
      handled: true
    }
  }

  /**
   * Categorize error type
   * @param {Error} error - The error object
   * @returns {string} Error category
   */
  categorizeError(error) {
    if (!error) return MiniprogramErrorCategory.UNKNOWN

    const errorCode = error.code || ''
    const errorMessage = error.message || ''

    // Network errors
    if (errorCode.includes('NETWORK') || errorCode.includes('TIMEOUT') || 
        errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return MiniprogramErrorCategory.NETWORK
    }

    // Authentication errors
    if (errorCode.includes('AUTH') || errorCode.includes('TOKEN') || 
        error.status === 401 || error.status === 403) {
      return MiniprogramErrorCategory.AUTH
    }

    // WeChat API errors
    if (errorCode.includes('WECHAT') || errorMessage.includes('wx.') ||
        errorMessage.includes('微信')) {
      return MiniprogramErrorCategory.WECHAT_API
    }

    // Permission errors
    if (errorCode.includes('PERMISSION') || errorMessage.includes('permission') ||
        errorMessage.includes('权限')) {
      return MiniprogramErrorCategory.PERMISSION
    }

    // Validation errors
    if (errorCode.includes('VALIDATION') || error.status === 422 ||
        errorMessage.includes('validation')) {
      return MiniprogramErrorCategory.VALIDATION
    }

    // Business errors
    if (error.status >= 400 && error.status < 500) {
      return MiniprogramErrorCategory.BUSINESS
    }

    // System errors
    if (error.status >= 500) {
      return MiniprogramErrorCategory.SYSTEM
    }

    return MiniprogramErrorCategory.UNKNOWN
  }

  /**
   * Get user-friendly error message
   * @param {Error} error - The error object
   * @param {string} category - Error category
   * @returns {string} User message
   */
  getUserMessage(error, category) {
    // Check for specific error codes first
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code]
    }

    // Check for HTTP status codes
    if (error.status) {
      switch (error.status) {
        case 400: return '请求参数错误，请检查输入'
        case 401: return errorMessages.AUTH_FAILED
        case 403: return errorMessages.UNAUTHORIZED
        case 404: return errorMessages.RESOURCE_NOT_FOUND
        case 408: return errorMessages.TIMEOUT
        case 409: return errorMessages.RESOURCE_CONFLICT
        case 422: return errorMessages.VALIDATION_ERROR
        case 429: return '请求过于频繁，请稍后重试'
        case 500: return errorMessages.SERVER_ERROR
        case 502: return '网关错误，请稍后重试'
        case 503: return errorMessages.SERVICE_UNAVAILABLE
        case 504: return '网关超时，请稍后重试'
      }
    }

    // Fallback to category-based messages
    switch (category) {
      case MiniprogramErrorCategory.NETWORK:
        return errorMessages.NETWORK_ERROR
      case MiniprogramErrorCategory.AUTH:
        return errorMessages.AUTH_FAILED
      case MiniprogramErrorCategory.WECHAT_API:
        return errorMessages.WECHAT_API_ERROR
      case MiniprogramErrorCategory.PERMISSION:
        return '权限不足，无法执行此操作'
      case MiniprogramErrorCategory.VALIDATION:
        return errorMessages.VALIDATION_ERROR
      case MiniprogramErrorCategory.BUSINESS:
        return errorMessages.BUSINESS_RULE_VIOLATION
      case MiniprogramErrorCategory.SYSTEM:
        return errorMessages.SERVER_ERROR
      default:
        return error.message || errorMessages.UNKNOWN
    }
  }

  /**
   * Show user feedback
   * @param {string} message - User message
   * @param {string} category - Error category
   * @param {Object} options - Display options
   */
  showUserFeedback(message, category, options = {}) {
    const {
      showToast = true,
      showModal = false,
      duration = 3000,
      icon = 'none'
    } = options

    if (showModal) {
      uni.showModal({
        title: '错误提示',
        content: message,
        showCancel: false,
        confirmText: '确定'
      })
    } else if (showToast) {
      uni.showToast({
        title: message,
        icon: icon,
        duration: duration,
        mask: true
      })
    }
  }

  /**
   * Handle specific error types
   * @param {Error} error - The error object
   * @param {string} category - Error category
   * @param {Object} context - Error context
   */
  handleSpecificError(error, category, context) {
    switch (category) {
      case MiniprogramErrorCategory.AUTH:
        this.handleAuthError(error, context)
        break
      case MiniprogramErrorCategory.NETWORK:
        this.handleNetworkError(error, context)
        break
      case MiniprogramErrorCategory.WECHAT_API:
        this.handleWechatApiError(error, context)
        break
      case MiniprogramErrorCategory.PERMISSION:
        this.handlePermissionError(error, context)
        break
    }
  }

  /**
   * Handle authentication errors
   * @param {Error} error - The error object
   * @param {Object} context - Error context
   */
  handleAuthError(error, context) {
    if (error.status === 401 || error.code === 'TOKEN_EXPIRED') {
      // Redirect to login after a delay
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/login/index'
        })
      }, 2000)
    }
  }

  /**
   * Handle network errors
   * @param {Error} error - The error object
   * @param {Object} context - Error context
   */
  handleNetworkError(error, context) {
    // Could implement retry logic or offline mode here
    console.log('Network error handled:', error.message)
  }

  /**
   * Handle WeChat API errors
   * @param {Error} error - The error object
   * @param {Object} context - Error context
   */
  handleWechatApiError(error, context) {
    // Handle specific WeChat API errors
    if (error.errMsg) {
      if (error.errMsg.includes('auth deny')) {
        uni.showModal({
          title: '授权失败',
          content: '需要您的授权才能继续使用，请重新授权',
          confirmText: '重新授权',
          success: (res) => {
            if (res.confirm) {
              // Retry authorization
              console.log('Retrying WeChat authorization')
            }
          }
        })
      }
    }
  }

  /**
   * Handle permission errors
   * @param {Error} error - The error object
   * @param {Object} context - Error context
   */
  handlePermissionError(error, context) {
    uni.showModal({
      title: '权限不足',
      content: '此功能需要相应权限，请在设置中开启',
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) {
          uni.openSetting()
        }
      }
    })
  }

  /**
   * Log error for debugging
   * @param {Error} error - The error object
   * @param {Object} context - Error context
   */
  logError(error, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack
      },
      context: {
        page: getCurrentPages().pop()?.route || 'unknown',
        userAgent: uni.getSystemInfoSync(),
        ...context
      }
    }

    // Add to error log
    this.errorLog.unshift(logEntry)
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Log')
      console.error('Error:', error)
      console.info('Context:', context)
      console.info('Log Entry:', logEntry)
      console.groupEnd()
    }
  }

  /**
   * Get error log
   * @returns {Array} Error log entries
   */
  getErrorLog() {
    return [...this.errorLog]
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = []
  }

  /**
   * Export error log for debugging
   * @returns {string} JSON string of error log
   */
  exportErrorLog() {
    return JSON.stringify(this.errorLog, null, 2)
  }
}

// Create singleton instance
export const miniprogramErrorHandler = new MiniprogramErrorHandler()

// Convenience functions
export const handleError = (error, context, options) => {
  return miniprogramErrorHandler.handleError(error, context, options)
}

export const logError = (error, context) => {
  return miniprogramErrorHandler.logError(error, context)
}

export const showErrorToast = (message, duration = 3000) => {
  uni.showToast({
    title: message,
    icon: 'none',
    duration,
    mask: true
  })
}

export const showErrorModal = (message, title = '错误提示') => {
  uni.showModal({
    title,
    content: message,
    showCancel: false,
    confirmText: '确定'
  })
}

// Global error handler setup
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  if (typeof uni !== 'undefined') {
    const originalOnError = uni.onError
    uni.onError = function(error) {
      handleError(new Error(error), { type: 'global' })
      if (originalOnError) {
        originalOnError.call(this, error)
      }
    }
  }

  // Handle Vue errors if Vue is available
  if (typeof Vue !== 'undefined') {
    Vue.config.errorHandler = function(err, vm, info) {
      handleError(err, { 
        type: 'vue',
        component: vm?.$options.name || 'unknown',
        info 
      })
    }
  }
}

export default miniprogramErrorHandler