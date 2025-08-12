/**
 * 分页辅助工具
 * 用于标准化分页参数和分页信息处理
 */

import { ensureNumber } from './safeAccess'

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
  [key: string]: any
}

export interface SafePagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  offset: number
}

/**
 * 规范化分页参数
 * @param params 原始分页参数
 * @returns 规范化后的分页参数
 */
export function normalizePaginationParams(params: PaginationParams = {}): PaginationParams {
  const page = Math.max(1, ensureNumber(params.page, 1))
  const limit = Math.max(1, Math.min(100, ensureNumber(params.limit, 20))) // 限制最大100条
  const offset = (page - 1) * limit

  return {
    ...params,
    page,
    limit,
    offset
  }
}

/**
 * 创建安全的分页信息
 * @param paginationData 原始分页数据
 * @returns 安全的分页信息
 */
export function createSafePagination(paginationData: any = {}): SafePagination {
  const total = ensureNumber(paginationData.total, 0)
  const page = Math.max(1, ensureNumber(paginationData.page, 1))
  const limit = Math.max(1, ensureNumber(paginationData.limit, 20))
  const totalPages = Math.max(1, Math.ceil(total / limit))
  
  // 确保当前页不超过总页数
  const safePage = Math.min(page, totalPages)
  
  return {
    total,
    page: safePage,
    limit,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
    offset: (safePage - 1) * limit
  }
}

/**
 * 计算分页范围
 * @param page 当前页
 * @param totalPages 总页数
 * @param maxVisible 最大显示页数
 * @returns 分页范围
 */
export function calculatePaginationRange(
  page: number, 
  totalPages: number, 
  maxVisible: number = 7
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, page - half)
  let end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/**
 * 验证分页参数
 * @param params 分页参数
 * @returns 验证结果
 */
export function validatePaginationParams(params: PaginationParams): {
  isValid: boolean
  errors: string[]
  normalized: PaginationParams
} {
  const errors: string[] = []
  
  const page = params.page
  const limit = params.limit

  if (page !== undefined && (typeof page !== 'number' || page < 1)) {
    errors.push('页码必须是大于0的数字')
  }

  if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 100)) {
    errors.push('每页数量必须是1-100之间的数字')
  }

  const normalized = normalizePaginationParams(params)

  return {
    isValid: errors.length === 0,
    errors,
    normalized
  }
}

/**
 * 创建分页查询字符串
 * @param params 分页参数
 * @returns 查询字符串
 */
export function createPaginationQuery(params: PaginationParams): string {
  const normalized = normalizePaginationParams(params)
  const queryParams = new URLSearchParams()

  Object.entries(normalized).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })

  return queryParams.toString()
}

/**
 * 从URL解析分页参数
 * @param url URL字符串或URLSearchParams
 * @returns 分页参数
 */
export function parsePaginationFromUrl(url: string | URLSearchParams): PaginationParams {
  const searchParams = typeof url === 'string' 
    ? new URLSearchParams(url.split('?')[1] || '') 
    : url

  const params: PaginationParams = {}

  if (searchParams.has('page')) {
    params.page = parseInt(searchParams.get('page') || '1', 10)
  }

  if (searchParams.has('limit')) {
    params.limit = parseInt(searchParams.get('limit') || '20', 10)
  }

  // 解析其他查询参数
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'page' && key !== 'limit') {
      params[key] = value
    }
  }

  return normalizePaginationParams(params)
}

/**
 * 分页数据切片
 * @param data 原始数据数组
 * @param page 当前页
 * @param limit 每页数量
 * @returns 切片后的数据和分页信息
 */
export function paginateArray<T>(
  data: T[], 
  page: number = 1, 
  limit: number = 20
): {
  data: T[]
  pagination: SafePagination
} {
  const normalizedParams = normalizePaginationParams({ page, limit })
  const total = data.length
  const startIndex = normalizedParams.offset!
  const endIndex = startIndex + normalizedParams.limit!
  
  const slicedData = data.slice(startIndex, endIndex)
  const pagination = createSafePagination({
    total,
    page: normalizedParams.page,
    limit: normalizedParams.limit
  })

  return {
    data: slicedData,
    pagination
  }
}

/**
 * 合并分页结果
 * @param results 多个分页结果
 * @returns 合并后的结果
 */
export function mergePaginationResults<T>(
  results: Array<{ data: T[]; pagination: SafePagination }>
): { data: T[]; pagination: SafePagination } {
  if (results.length === 0) {
    return {
      data: [],
      pagination: createSafePagination()
    }
  }

  if (results.length === 1) {
    return results[0]
  }

  const mergedData = results.flatMap(result => result.data)
  const totalItems = results.reduce((sum, result) => sum + result.pagination.total, 0)
  
  // 使用第一个结果的分页参数作为基础
  const basePagination = results[0].pagination
  const mergedPagination = createSafePagination({
    total: totalItems,
    page: basePagination.page,
    limit: mergedData.length
  })

  return {
    data: mergedData,
    pagination: mergedPagination
  }
}

/**
 * 创建分页导航信息
 * @param pagination 分页信息
 * @returns 导航信息
 */
export function createPaginationNavigation(pagination: SafePagination) {
  const { page, totalPages } = pagination
  
  return {
    first: 1,
    last: totalPages,
    prev: pagination.hasPrev ? page - 1 : null,
    next: pagination.hasNext ? page + 1 : null,
    pages: calculatePaginationRange(page, totalPages),
    info: {
      from: pagination.offset + 1,
      to: Math.min(pagination.offset + pagination.limit, pagination.total),
      total: pagination.total
    }
  }
}

export default {
  normalizePaginationParams,
  createSafePagination,
  calculatePaginationRange,
  validatePaginationParams,
  createPaginationQuery,
  parsePaginationFromUrl,
  paginateArray,
  mergePaginationResults,
  createPaginationNavigation
}