/**
 * 统一的API响应处理器
 * 用于标准化所有微服务的响应数据格式
 */

import { adaptPaginatedResponse, adaptSingleResponse, adaptStatisticsResponse } from './dataAdapter'
import { safeGet, ensureArray, ensureNumber, ensureString } from './safeAccess'
import { validateApiResponse, validatePaginatedResponse } from './dataValidation'
import { ElMessage } from 'element-plus'

export interface ApiResponseHandler {
  success: boolean
  data: any
  message?: string
  error?: string
}

/**
 * 统一处理API响应
 * @param response API响应
 * @param options 处理选项
 * @returns 标准化的响应数据
 */
export function handleApiResponse<T = any>(
  response: any,
  options: {
    type?: 'single' | 'list' | 'statistics'
    dataKey?: string
    showError?: boolean
    fallbackValue?: T
  } = {}
): ApiResponseHandler {
  const { type = 'single', dataKey = 'data', showError = true, fallbackValue } = options

  try {
    // 检查响应是否存在
    if (!response) {
      throw new Error('响应数据为空')
    }

    // 检查是否有错误
    if (response.error || (response.data && response.data.error)) {
      const errorMessage = response.error || response.data.error || '请求失败'
      if (showError) {
        ElMessage.error(errorMessage)
      }
      return {
        success: false,
        data: fallbackValue,
        error: errorMessage
      }
    }

    let processedData: any

    // 根据类型处理数据
    switch (type) {
      case 'list':
        processedData = adaptPaginatedResponse(response, dataKey)
        break
      case 'statistics':
        processedData = adaptStatisticsResponse(response)
        break
      case 'single':
      default:
        processedData = adaptSingleResponse(response)
        break
    }

    return {
      success: true,
      data: processedData,
      message: safeGet(response, 'message', 'Success')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '数据处理失败'
    console.error('API响应处理失败:', error)
    
    if (showError) {
      ElMessage.error(errorMessage)
    }

    return {
      success: false,
      data: fallbackValue,
      error: errorMessage
    }
  }
}

/**
 * 处理列表响应
 * @param response API响应
 * @param dataKey 数据字段名
 * @returns 标准化的列表数据
 */
export function handleListResponse<T = any>(response: any, dataKey: string = 'data') {
  return handleApiResponse<T[]>(response, { type: 'list', dataKey })
}

/**
 * 处理单个数据响应
 * @param response API响应
 * @returns 标准化的单个数据
 */
export function handleSingleResponse<T = any>(response: any) {
  return handleApiResponse<T>(response, { type: 'single' })
}

/**
 * 处理统计数据响应
 * @param response API响应
 * @returns 标准化的统计数据
 */
export function handleStatisticsResponse(response: any) {
  return handleApiResponse(response, { type: 'statistics' })
}

/**
 * 安全的API调用包装器
 * @param apiCall API调用函数
 * @param options 处理选项
 * @returns Promise<ApiResponseHandler>
 */
export async function safeApiCall<T = any>(
  apiCall: () => Promise<any>,
  options: {
    type?: 'single' | 'list' | 'statistics'
    dataKey?: string
    showError?: boolean
    fallbackValue?: T
    retryCount?: number
    retryDelay?: number
  } = {}
): Promise<ApiResponseHandler> {
  const { retryCount = 0, retryDelay = 1000, ...handlerOptions } = options
  let lastError: any

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const response = await apiCall()
      return handleApiResponse<T>(response, handlerOptions)
    } catch (error) {
      lastError = error
      console.error(`API调用失败 (尝试 ${attempt + 1}/${retryCount + 1}):`, error)

      // 如果还有重试次数，等待后重试
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        continue
      }
    }
  }

  // 所有重试都失败了
  const errorMessage = lastError?.message || '网络请求失败'
  if (handlerOptions.showError !== false) {
    ElMessage.error(errorMessage)
  }

  return {
    success: false,
    data: handlerOptions.fallbackValue,
    error: errorMessage
  }
}

/**
 * 批量API调用处理器
 * @param apiCalls API调用数组
 * @param options 处理选项
 * @returns Promise<ApiResponseHandler[]>
 */
export async function batchApiCall<T = any>(
  apiCalls: Array<() => Promise<any>>,
  options: {
    type?: 'single' | 'list' | 'statistics'
    dataKey?: string
    showError?: boolean
    fallbackValue?: T
    failFast?: boolean
  } = {}
): Promise<ApiResponseHandler[]> {
  const { failFast = false, ...handlerOptions } = options

  if (failFast) {
    // 快速失败模式：任何一个失败就停止
    const results: ApiResponseHandler[] = []
    for (const apiCall of apiCalls) {
      const result = await safeApiCall(apiCall, handlerOptions)
      results.push(result)
      if (!result.success) {
        break
      }
    }
    return results
  } else {
    // 并行执行所有调用
    const promises = apiCalls.map(apiCall => safeApiCall(apiCall, handlerOptions))
    return Promise.all(promises)
  }
}

/**
 * 创建API调用钩子
 * @param apiCall API调用函数
 * @param options 处理选项
 * @returns 钩子函数
 */
export function createApiHook<T = any>(
  apiCall: (...args: any[]) => Promise<any>,
  options: {
    type?: 'single' | 'list' | 'statistics'
    dataKey?: string
    showError?: boolean
    fallbackValue?: T
    onSuccess?: (data: T) => void
    onError?: (error: string) => void
  } = {}
) {
  const { onSuccess, onError, ...handlerOptions } = options

  return async (...args: any[]): Promise<ApiResponseHandler> => {
    const result = await safeApiCall(() => apiCall(...args), handlerOptions)
    
    if (result.success && onSuccess) {
      onSuccess(result.data)
    } else if (!result.success && onError) {
      onError(result.error || '未知错误')
    }

    return result
  }
}

/**
 * 数据验证装饰器
 * @param validator 验证函数
 * @returns 装饰器函数
 */
export function withDataValidation<T = any>(
  validator: (data: any) => boolean,
  errorMessage: string = '数据验证失败'
) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function(...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args)
        
        if (result.success && !validator(result.data)) {
          return {
            success: false,
            data: null,
            error: errorMessage
          }
        }

        return result
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : '未知错误'
        }
      }
    }

    return descriptor
  }
}

/**
 * 缓存装饰器
 * @param ttl 缓存时间（毫秒）
 * @param keyGenerator 缓存键生成器
 * @returns 装饰器函数
 */
export function withCache(
  ttl: number = 5 * 60 * 1000, // 默认5分钟
  keyGenerator?: (...args: any[]) => string
) {
  const cache = new Map<string, { data: any; timestamp: number }>()

  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function(...args: any[]) {
      const cacheKey = keyGenerator ? keyGenerator(...args) : `${propertyKey}_${JSON.stringify(args)}`
      const now = Date.now()
      
      // 检查缓存
      const cached = cache.get(cacheKey)
      if (cached && (now - cached.timestamp) < ttl) {
        return cached.data
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args)
      
      // 只缓存成功的结果
      if (result.success) {
        cache.set(cacheKey, { data: result, timestamp: now })
      }

      return result
    }

    return descriptor
  }
}

export default {
  handleApiResponse,
  handleListResponse,
  handleSingleResponse,
  handleStatisticsResponse,
  safeApiCall,
  batchApiCall,
  createApiHook,
  withDataValidation,
  withCache
}