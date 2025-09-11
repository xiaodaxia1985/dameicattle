/**
 * 数据验证和规范化工具
 * 用于验证API响应数据的完整性和格式
 */

import { safeGet, ensureArray, ensureNumber, ensureString } from './safeAccess'

/**
 * 验证API响应数据
 */
export function validateApiResponse<T = any>(response: any, fallbackValue?: T): T {
  if (!response) {
    return fallbackValue as T
  }
  
  // 如果响应有data字段，返回data
  if (response.data !== undefined) {
    return response.data
  }
  
  // 否则返回整个响应
  return response
}

/**
 * 验证分页响应数据
 */
export function validatePaginatedResponse<T = any>(response: any): {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
} {
  const data = ensureArray(safeGet(response, 'data', []))
  const pagination = safeGet(response, 'pagination', {})
  
  return {
    data,
    pagination: {
      total: ensureNumber(pagination.total, 0),
      page: ensureNumber(pagination.page, 1),
      limit: ensureNumber(pagination.limit, 20),
      totalPages: ensureNumber(pagination.totalPages, 0)
    }
  }
}

/**
 * 规范化列表响应
 */
export function normalizeListResponse<T = any>(response: any): T[] {
  // 尝试不同的数据结构
  if (Array.isArray(response)) {
    return response
  }
  
  if (response?.data && Array.isArray(response.data)) {
    return response.data
  }
  
  if (response?.items && Array.isArray(response.items)) {
    return response.items
  }
  
  if (response?.list && Array.isArray(response.list)) {
    return response.list
  }
  
  return []
}

/**
 * 验证数组数据
 */
export function validateDataArray<T = any>(data: any, validator?: (item: any) => boolean): T[] {
  const array = ensureArray(data)
  
  if (!validator) {
    return array
  }
  
  return array.filter(validator)
}

/**
 * 验证牛只数据
 */
export function validateCattleData(cattle: any): boolean {
  return !!(
    cattle &&
    typeof cattle === 'object' &&
    cattle.id &&
    cattle.ear_tag
  )
}

/**
 * 验证统计数据
 */
export function validateStatisticsData(stats: any): any {
  if (!stats || typeof stats !== 'object') {
    return {
      healthy: 0,
      sick: 0,
      treatment: 0,
      total: 0
    }
  }
  
  return {
    healthy: ensureNumber(stats.healthy, 0),
    sick: ensureNumber(stats.sick, 0),
    treatment: ensureNumber(stats.treatment, 0),
    total: ensureNumber(stats.total, 0),
    ...stats
  }
}

/**
 * 验证分页数据
 */
export function validatePaginationData(pagination: any): {
  total: number
  page: number
  limit: number
  totalPages: number
} {
  return {
    total: ensureNumber(pagination?.total, 0),
    page: ensureNumber(pagination?.page, 1),
    limit: ensureNumber(pagination?.limit, 20),
    totalPages: ensureNumber(pagination?.totalPages, 0)
  }
}

/**
 * 清理和验证表单数据
 */
export function cleanFormData(formData: any): any {
  if (!formData || typeof formData !== 'object') {
    return {}
  }
  
  const cleaned: any = {}
  
  for (const [key, value] of Object.entries(formData)) {
    // 跳过空值
    if (value === null || value === undefined || value === '') {
      continue
    }
    
    // 处理数字
    if (typeof value === 'string' && !isNaN(Number(value))) {
      cleaned[key] = Number(value)
    } else {
      cleaned[key] = value
    }
  }
  
  return cleaned
}

/**
 * 验证必填字段
 */
export function validateRequiredFields(data: any, requiredFields: string[]): {
  isValid: boolean
  missingFields: string[]
} {
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    const value = safeGet(data, field)
    if (value === null || value === undefined || value === '') {
      missingFields.push(field)
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}

/**
 * 格式化错误消息
 */
export function formatValidationError(field: string, rule: string): string {
  const messages: Record<string, string> = {
    required: `${field}是必填项`,
    email: `${field}格式不正确`,
    phone: `${field}格式不正确`,
    number: `${field}必须是数字`,
    min: `${field}值太小`,
    max: `${field}值太大`,
    length: `${field}长度不符合要求`
  }
  
  return messages[rule] || `${field}验证失败`
}

/**
 * 数据类型检查
 */
export const isValidType = {
  string: (value: any): value is string => typeof value === 'string',
  number: (value: any): value is number => typeof value === 'number' && !isNaN(value),
  boolean: (value: any): value is boolean => typeof value === 'boolean',
  array: (value: any): value is any[] => Array.isArray(value),
  object: (value: any): value is object => value !== null && typeof value === 'object' && !Array.isArray(value),
  date: (value: any): boolean => value instanceof Date || !isNaN(Date.parse(value)),
  email: (value: any): boolean => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value: any): boolean => typeof value === 'string' && /^1[3-9]\d{9}$/.test(value),
  url: (value: any): boolean => {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }
}