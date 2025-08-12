/**
 * 数据适配器工具
 * 用于统一处理微服务返回的数据结构
 */

import { ensureArray, ensureNumber, ensureString } from './safeAccess'

// 标准化分页数据结构
export interface StandardPagination {
  total: number
  page: number
  limit: number
  pages?: number
  totalPages?: number
}

// 标准化列表响应结构
export interface StandardListResponse<T> {
  data: T[]
  pagination: StandardPagination
}

/**
 * 适配微服务返回的分页数据
 * @param response 微服务响应数据
 * @param dataKey 数据字段名，如 'records', 'orders', 'articles' 等
 * @returns 标准化的列表响应
 */
export function adaptPaginatedResponse<T>(
  response: any, 
  dataKey: string = 'data'
): StandardListResponse<T> {
  console.log('adaptPaginatedResponse 输入:', { response, dataKey })
  
  // 处理不同的数据结构
  const responseData = response?.data || response || {}
  console.log('responseData:', responseData)
  
  // 获取实际数据数组 - 增强处理逻辑
  let items: T[] = []
  
  // 1. 检查是否直接是数组
  if (Array.isArray(responseData)) {
    items = responseData
  }
  // 2. 检查特定的数据字段（如 cattle, orders, suppliers 等）
  else if (responseData[dataKey] && Array.isArray(responseData[dataKey])) {
    items = responseData[dataKey]
  }
  // 3. 检查通用的 data 字段
  else if (responseData.data && Array.isArray(responseData.data)) {
    items = responseData.data
  }
  // 4. 检查嵌套的数据结构 response.data.data
  else if (responseData.data && responseData.data.data && Array.isArray(responseData.data.data)) {
    items = responseData.data.data
  }
  // 5. 检查其他可能的字段名
  else if (responseData.items && Array.isArray(responseData.items)) {
    items = responseData.items
  }
  else if (responseData.records && Array.isArray(responseData.records)) {
    items = responseData.records
  }
  else if (responseData.list && Array.isArray(responseData.list)) {
    items = responseData.list
  }
  
  console.log('提取的数据数组:', items)

  // 获取分页信息 - 增强处理逻辑
  let pagination = responseData.pagination || {}
  
  // 如果分页信息在嵌套结构中
  if (!pagination.total && responseData.data && responseData.data.pagination) {
    pagination = responseData.data.pagination
  }
  
  const total = ensureNumber(pagination.total, items.length)
  const page = ensureNumber(pagination.page, 1)
  const limit = ensureNumber(pagination.limit, 20)
  const pages = ensureNumber(pagination.pages || pagination.totalPages, Math.ceil(total / limit))

  const result = {
    data: items,
    pagination: {
      total,
      page,
      limit,
      pages,
      totalPages: pages
    }
  }
  
  console.log('adaptPaginatedResponse 输出:', result)
  return result
}

/**
 * 适配微服务返回的单个数据
 * @param response 微服务响应数据
 * @returns 标准化的数据
 */
export function adaptSingleResponse<T>(response: any): T {
  return response?.data || response || null
}

/**
 * 适配微服务返回的统计数据
 * @param response 微服务响应数据
 * @returns 标准化的统计数据
 */
export function adaptStatisticsResponse(response: any): any {
  const data = response?.data || response || {}
  
  // 确保统计数据的基本结构
  return {
    overview: data.overview || {},
    ...data
  }
}

/**
 * 创建标准的API响应包装器
 * @param data 数据
 * @param message 消息
 * @returns 标准化的API响应
 */
export function createStandardResponse<T>(data: T, message?: string) {
  return {
    data,
    message: message || 'Success'
  }
}

/**
 * 处理API错误响应
 * @param error 错误对象
 * @returns 标准化的错误信息
 */
export function handleApiError(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  if (error?.message) {
    return error.message
  }
  return '操作失败，请稍后重试'
}

/**
 * 安全获取嵌套对象属性
 * @param obj 对象
 * @param path 属性路径，如 'user.profile.name'
 * @param defaultValue 默认值
 * @returns 属性值或默认值
 */
export function safeGet(obj: any, path: string, defaultValue: any = undefined): any {
  if (!obj || typeof obj !== 'object') {
    return defaultValue
  }

  const keys = path.split('.')
  let result = obj

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue
    }
    result = result[key]
  }

  return result !== undefined ? result : defaultValue
}

/**
 * 确保返回数组
 * @param value 值
 * @returns 数组
 */
export function ensureArray<T>(value: any): T[] {
  if (Array.isArray(value)) {
    return value
  }
  if (value === null || value === undefined) {
    return []
  }
  return [value]
}

/**
 * 确保返回数字
 * @param value 值
 * @param defaultValue 默认值
 * @returns 数字
 */
export function ensureNumber(value: any, defaultValue: number = 0): number {
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * 确保返回字符串
 * @param value 值
 * @param defaultValue 默认值
 * @returns 字符串
 */
export function ensureString(value: any, defaultValue: string = ''): string {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return defaultValue
  }
  return String(value)
}

/**
 * 格式化日期
 * @param date 日期
 * @param format 格式
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: any, format: string = 'YYYY-MM-DD'): string {
  if (!date) return ''
  
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  } catch {
    return ''
  }
}

/**
 * 格式化日期时间
 * @param date 日期
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: any): string {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}