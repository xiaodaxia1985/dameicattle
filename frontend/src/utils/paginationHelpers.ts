/**
 * 分页辅助工具
 * 提供分页数据处理和参数规范化功能
 */

import { ensureNumber } from './safeAccess'

/**
 * 分页信息接口
 */
export interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 分页参数接口
 */
export interface PaginationParams {
  page?: number
  limit?: number
  [key: string]: any
}

/**
 * 创建安全的分页信息
 */
export function createSafePagination(pagination: any): PaginationInfo {
  const total = ensureNumber(pagination?.total, 0)
  const page = ensureNumber(pagination?.page, 1)
  const limit = ensureNumber(pagination?.limit, 20)
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0
  
  return {
    total,
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    totalPages: Math.max(0, totalPages)
  }
}

/**
 * 规范化分页参数
 */
export function normalizePaginationParams(params: PaginationParams): PaginationParams {
  const normalized = { ...params }
  
  // 确保页码至少为1
  if (normalized.page !== undefined) {
    normalized.page = Math.max(1, ensureNumber(normalized.page, 1))
  }
  
  // 确保每页数量在合理范围内
  if (normalized.limit !== undefined) {
    normalized.limit = Math.min(100, Math.max(1, ensureNumber(normalized.limit, 20)))
  }
  
  return normalized
}

/**
 * 计算分页偏移量
 */
export function calculateOffset(page: number, limit: number): number {
  const safePage = Math.max(1, ensureNumber(page, 1))
  const safeLimit = Math.max(1, ensureNumber(limit, 20))
  return (safePage - 1) * safeLimit
}

/**
 * 获取分页范围信息
 */
export function getPaginationRange(pagination: PaginationInfo): {
  start: number
  end: number
  hasNext: boolean
  hasPrev: boolean
} {
  const { total, page, limit } = pagination
  const start = Math.min(total, (page - 1) * limit + 1)
  const end = Math.min(total, page * limit)
  
  return {
    start: total > 0 ? start : 0,
    end: total > 0 ? end : 0,
    hasNext: page * limit < total,
    hasPrev: page > 1
  }
}

/**
 * 生成页码数组
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  
  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, start + maxVisible - 1)
  
  // 调整起始位置
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/**
 * 分页数据处理器
 */
export class PaginationHandler {
  private _pagination: PaginationInfo
  
  constructor(pagination: any = {}) {
    this._pagination = createSafePagination(pagination)
  }
  
  get pagination(): PaginationInfo {
    return { ...this._pagination }
  }
  
  get range() {
    return getPaginationRange(this._pagination)
  }
  
  get pageNumbers() {
    return generatePageNumbers(this._pagination.page, this._pagination.totalPages)
  }
  
  /**
   * 更新分页信息
   */
  update(pagination: any): void {
    this._pagination = createSafePagination(pagination)
  }
  
  /**
   * 跳转到指定页
   */
  goToPage(page: number): PaginationParams {
    const safePage = Math.max(1, Math.min(this._pagination.totalPages, page))
    return {
      page: safePage,
      limit: this._pagination.limit
    }
  }
  
  /**
   * 下一页
   */
  nextPage(): PaginationParams | null {
    if (!this.range.hasNext) {
      return null
    }
    return this.goToPage(this._pagination.page + 1)
  }
  
  /**
   * 上一页
   */
  prevPage(): PaginationParams | null {
    if (!this.range.hasPrev) {
      return null
    }
    return this.goToPage(this._pagination.page - 1)
  }
  
  /**
   * 第一页
   */
  firstPage(): PaginationParams {
    return this.goToPage(1)
  }
  
  /**
   * 最后一页
   */
  lastPage(): PaginationParams {
    return this.goToPage(this._pagination.totalPages)
  }
  
  /**
   * 改变每页数量
   */
  changePageSize(limit: number): PaginationParams {
    const safeLimit = Math.min(100, Math.max(1, ensureNumber(limit, 20)))
    // 计算新的页码，保持当前数据位置
    const currentOffset = (this._pagination.page - 1) * this._pagination.limit
    const newPage = Math.floor(currentOffset / safeLimit) + 1
    
    return {
      page: Math.max(1, newPage),
      limit: safeLimit
    }
  }
  
  /**
   * 获取分页摘要文本
   */
  getSummary(): string {
    const { start, end } = this.range
    const { total } = this._pagination
    
    if (total === 0) {
      return '暂无数据'
    }
    
    if (total === 1) {
      return '共 1 条记录'
    }
    
    return `显示第 ${start}-${end} 条，共 ${total} 条记录`
  }
}

/**
 * 创建分页处理器
 */
export function createPaginationHandler(pagination: any = {}): PaginationHandler {
  return new PaginationHandler(pagination)
}

/**
 * 分页配置常量
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1,
  DEFAULT_PAGE: 1,
  MAX_VISIBLE_PAGES: 7
} as const

/**
 * 常用分页大小选项
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

/**
 * 验证分页参数
 */
export function validatePaginationParams(params: any): {
  isValid: boolean
  errors: string[]
  normalized: PaginationParams
} {
  const errors: string[] = []
  const normalized: PaginationParams = {}
  
  // 验证页码
  if (params.page !== undefined) {
    const page = ensureNumber(params.page)
    if (page < 1) {
      errors.push('页码必须大于0')
      normalized.page = 1
    } else {
      normalized.page = page
    }
  }
  
  // 验证每页数量
  if (params.limit !== undefined) {
    const limit = ensureNumber(params.limit)
    if (limit < PAGINATION_CONFIG.MIN_PAGE_SIZE) {
      errors.push(`每页数量不能小于${PAGINATION_CONFIG.MIN_PAGE_SIZE}`)
      normalized.limit = PAGINATION_CONFIG.DEFAULT_PAGE_SIZE
    } else if (limit > PAGINATION_CONFIG.MAX_PAGE_SIZE) {
      errors.push(`每页数量不能大于${PAGINATION_CONFIG.MAX_PAGE_SIZE}`)
      normalized.limit = PAGINATION_CONFIG.MAX_PAGE_SIZE
    } else {
      normalized.limit = limit
    }
  }
  
  // 复制其他参数
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'page' && key !== 'limit') {
      normalized[key] = value
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    normalized
  }
}