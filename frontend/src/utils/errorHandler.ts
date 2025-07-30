/**
 * 全局错误处理和数据验证中间件
 * 用于统一处理API错误、空数据、网络异常等情况
 */

import { ElMessage, ElNotification } from 'element-plus'
import { validateApiResponse } from './dataValidation'

/**
 * API错误类型
 */
export interface ApiError {
  code?: string | number
  message: string
  details?: any
  status?: number
}

/**
 * 错误处理配置
 */
export interface ErrorHandlerConfig {
  showMessage?: boolean
  showNotification?: boolean
  logError?: boolean
  fallbackValue?: any
  retryCount?: number
  retryDelay?: number
}

/**
 * 默认错误处理配置
 */
const defaultConfig: ErrorHandlerConfig = {
  showMessage: true,
  showNotification: false,
  logError: true,
  fallbackValue: null,
  retryCount: 0,
  retryDelay: 1000
}

/**
 * 创建标准化的API错误对象
 */
export function createApiError(error: any): ApiError {
  if (error?.response) {
    // HTTP错误响应
    return {
      code: error.response.status,
      message: error.response.data?.message || error.message || '请求失败',
      details: error.response.data,
      status: error.response.status
    }
  } else if (error?.request) {
    // 网络错误
    return {
      code: 'NETWORK_ERROR',
      message: '网络连接失败，请检查网络设置',
      details: error.request
    }
  } else {
    // 其他错误
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || '未知错误',
      details: error
    }
  }
}

/**
 * 获取用户友好的错误消息
 */
export function getFriendlyErrorMessage(error: ApiError): string {
  const { code, message, status } = error

  // HTTP状态码错误消息映射
  const statusMessages: Record<number, string> = {
    400: '请求参数错误',
    401: '未授权访问，请重新登录',
    403: '权限不足，无法访问',
    404: '请求的资源不存在',
    408: '请求超时，请重试',
    409: '数据冲突，请刷新后重试',
    422: '数据验证失败',
    429: '请求过于频繁，请稍后重试',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
    504: '网关超时'
  }

  // 业务错误码消息映射
  const codeMessages: Record<string, string> = {
    'NETWORK_ERROR': '网络连接失败',
    'TIMEOUT_ERROR': '请求超时',
    'VALIDATION_ERROR': '数据验证失败',
    'PERMISSION_DENIED': '权限不足',
    'RESOURCE_NOT_FOUND': '资源不存在',
    'DUPLICATE_RESOURCE': '资源已存在',
    'INVALID_TOKEN': '登录已过期，请重新登录'
  }

  if (status && statusMessages[status]) {
    return statusMessages[status]
  }

  if (code && codeMessages[String(code)]) {
    return codeMessages[String(code)]
  }

  return message || '操作失败'
}

/**
 * 显示错误消息
 */
export function showErrorMessage(error: ApiError, config: ErrorHandlerConfig = {}) {
  const finalConfig = { ...defaultConfig, ...config }
  const friendlyMessage = getFriendlyErrorMessage(error)

  if (finalConfig.showMessage) {
    ElMessage.error(friendlyMessage)
  }

  if (finalConfig.showNotification) {
    ElNotification.error({
      title: '操作失败',
      message: friendlyMessage,
      duration: 5000
    })
  }

  if (finalConfig.logError) {
    console.error('API Error:', error)
  }
}

/**
 * 安全的API调用包装器
 */
export async function safeApiCall<T = any>(
  apiCall: () => Promise<any>,
  config: ErrorHandlerConfig = {}
): Promise<T | null> {
  const finalConfig = { ...defaultConfig, ...config }
  let retryCount = 0

  const executeCall = async (): Promise<T | null> => {
    try {
      const response = await apiCall()
      return validateApiResponse<T>(response, finalConfig.fallbackValue)
    } catch (error) {
      const apiError = createApiError(error)

      // 如果是网络错误或服务器错误，且还有重试次数，则重试
      if (
        finalConfig.retryCount > 0 &&
        retryCount < finalConfig.retryCount &&
        (apiError.code === 'NETWORK_ERROR' || (apiError.status && apiError.status >= 500))
      ) {
        retryCount++
        console.warn(`API调用失败，正在重试 (${retryCount}/${finalConfig.retryCount})...`)
        
        // 等待指定时间后重试
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay))
        return executeCall()
      }

      // 显示错误消息
      showErrorMessage(apiError, finalConfig)

      // 返回fallback值
      return finalConfig.fallbackValue as T
    }
  }

  return executeCall()
}

/**
 * 批量API调用的错误处理
 */
export async function safeBatchApiCall<T = any>(
  apiCalls: Array<() => Promise<any>>,
  config: ErrorHandlerConfig = {}
): Promise<Array<T | null>> {
  const results = await Promise.allSettled(
    apiCalls.map(call => safeApiCall<T>(call, { ...config, showMessage: false }))
  )

  const errors: ApiError[] = []
  const values: Array<T | null> = []

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      values.push(result.value)
    } else {
      const apiError = createApiError(result.reason)
      errors.push(apiError)
      values.push(config.fallbackValue as T)
    }
  })

  // 如果有错误且配置了显示消息，则显示汇总错误
  if (errors.length > 0 && config.showMessage !== false) {
    const errorMessage = errors.length === 1 
      ? getFriendlyErrorMessage(errors[0])
      : `${errors.length} 个请求失败`
    
    ElMessage.error(errorMessage)
  }

  return values
}

/**
 * 页面数据加载的错误处理包装器
 */
export function withPageErrorHandler<T extends any[]>(
  loadFunction: (...args: T) => Promise<void>,
  errorMessage: string = '加载数据失败'
) {
  return async (...args: T) => {
    try {
      await loadFunction(...args)
    } catch (error) {
      const apiError = createApiError(error)
      console.error('页面数据加载失败:', apiError)
      ElMessage.error(errorMessage)
    }
  }
}

/**
 * 表单提交的错误处理包装器
 */
export function withFormErrorHandler<T extends any[]>(
  submitFunction: (...args: T) => Promise<void>,
  successMessage: string = '操作成功',
  errorMessage: string = '操作失败'
) {
  return async (...args: T) => {
    try {
      await submitFunction(...args)
      ElMessage.success(successMessage)
    } catch (error) {
      const apiError = createApiError(error)
      const friendlyMessage = getFriendlyErrorMessage(apiError)
      console.error('表单提交失败:', apiError)
      ElMessage.error(friendlyMessage || errorMessage)
      throw error // 重新抛出错误，让调用者可以处理
    }
  }
}

/**
 * 检查是否为空数据错误
 */
export function isEmptyDataError(error: any): boolean {
  return (
    error?.code === 'EMPTY_DATA' ||
    error?.message?.includes('empty') ||
    error?.message?.includes('no data') ||
    error?.status === 204
  )
}

/**
 * 检查是否为网络错误
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('fetch')
  )
}

/**
 * 检查是否为权限错误
 */
export function isPermissionError(error: any): boolean {
  return (
    error?.status === 401 ||
    error?.status === 403 ||
    error?.code === 'PERMISSION_DENIED' ||
    error?.code === 'INVALID_TOKEN'
  )
}

/**
 * 全局错误处理器（用于Vue的errorHandler）
 */
export function globalErrorHandler(error: any, instance: any, info: string) {
  const apiError = createApiError(error)
  
  console.error('Vue Global Error:', {
    error: apiError,
    instance,
    info
  })

  // 对于严重错误，显示通知
  if (apiError.code === 'NETWORK_ERROR' || isPermissionError(apiError)) {
    ElNotification.error({
      title: '系统错误',
      message: getFriendlyErrorMessage(apiError),
      duration: 0 // 不自动关闭
    })
  }
}

/**
 * Promise rejection处理器
 */
export function unhandledRejectionHandler(event: PromiseRejectionEvent) {
  const apiError = createApiError(event.reason)
  
  console.error('Unhandled Promise Rejection:', apiError)

  // 防止默认的控制台错误输出
  event.preventDefault()

  // 对于网络错误，显示用户友好的消息
  if (isNetworkError(apiError)) {
    ElMessage.error('网络连接异常，请检查网络设置')
  }
}

/**
 * 安装全局错误处理器
 */
export function installGlobalErrorHandlers(app?: any) {
  if (app) {
    app.config.errorHandler = globalErrorHandler
  }

  // 处理未捕获的Promise rejection
  window.addEventListener('unhandledrejection', unhandledRejectionHandler)
}