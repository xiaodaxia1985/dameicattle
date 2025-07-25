/**
 * Pagination handling utilities
 * Provides consistent pagination data structure handling across components
 */

import type { PaginationInfo, BaseListParams } from '@/types/api'
import { ensureNumber, safeGet } from './safeAccess'

/**
 * Default pagination configuration
 */
export const DEFAULT_PAGINATION_CONFIG = {
  page: 1,
  limit: 20,
  maxLimit: 100,
  pageSizes: [10, 20, 50, 100]
}

/**
 * Create safe pagination info from raw data
 * @param data - Raw pagination data
 * @returns Safe pagination info
 */
export function createSafePagination(data: any): PaginationInfo {
  const total = ensureNumber(safeGet(data, 'total', 0), 0)
  const page = Math.max(1, ensureNumber(safeGet(data, 'page', 1), 1))
  const limit = Math.max(1, Math.min(
    ensureNumber(safeGet(data, 'limit', DEFAULT_PAGINATION_CONFIG.limit), DEFAULT_PAGINATION_CONFIG.limit),
    DEFAULT_PAGINATION_CONFIG.maxLimit
  ))
  
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)

  return {
    total,
    page: safePage,
    limit,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1
  }
}

/**
 * Normalize pagination parameters for API requests
 * @param params - Raw pagination parameters
 * @returns Normalized pagination parameters
 */
export function normalizePaginationParams(params: any): Required<Pick<BaseListParams, 'page' | 'limit'>> {
  const page = Math.max(1, ensureNumber(safeGet(params, 'page', 1), 1))
  const limit = Math.max(1, Math.min(
    ensureNumber(safeGet(params, 'limit', DEFAULT_PAGINATION_CONFIG.limit), DEFAULT_PAGINATION_CONFIG.limit),
    DEFAULT_PAGINATION_CONFIG.maxLimit
  ))

  return { page, limit }
}

/**
 * Calculate pagination display info
 * @param pagination - Pagination info
 * @returns Display information for pagination component
 */
export function getPaginationDisplayInfo(pagination: PaginationInfo) {
  const { total, page, limit } = pagination
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return {
    start,
    end,
    total,
    displayText: total === 0 
      ? '暂无数据' 
      : `显示第 ${start} 到第 ${end} 项，共 ${total} 项`
  }
}

/**
 * Generate page numbers for pagination component
 * @param pagination - Pagination info
 * @param maxVisible - Maximum visible page numbers
 * @returns Array of page numbers to display
 */
export function generatePageNumbers(pagination: PaginationInfo, maxVisible: number = 7): number[] {
  const { page, totalPages } = pagination
  
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, page - half)
  let end = Math.min(totalPages, start + maxVisible - 1)

  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

/**
 * Check if pagination parameters are valid
 * @param params - Pagination parameters
 * @returns Validation result
 */
export function validatePaginationParams(params: any): {
  isValid: boolean
  errors: string[]
  normalized: Required<Pick<BaseListParams, 'page' | 'limit'>>
} {
  const errors: string[] = []
  const page = ensureNumber(safeGet(params, 'page', 1), 1)
  const limit = ensureNumber(safeGet(params, 'limit', DEFAULT_PAGINATION_CONFIG.limit), DEFAULT_PAGINATION_CONFIG.limit)

  if (page < 1) {
    errors.push('页码必须大于0')
  }

  if (limit < 1) {
    errors.push('每页数量必须大于0')
  }

  if (limit > DEFAULT_PAGINATION_CONFIG.maxLimit) {
    errors.push(`每页数量不能超过${DEFAULT_PAGINATION_CONFIG.maxLimit}`)
  }

  const normalized = normalizePaginationParams({ page, limit })

  return {
    isValid: errors.length === 0,
    errors,
    normalized
  }
}

/**
 * Create pagination state manager for components
 * @param initialParams - Initial pagination parameters
 * @returns Pagination state manager
 */
export function createPaginationState(initialParams: Partial<BaseListParams> = {}) {
  const normalized = normalizePaginationParams(initialParams)
  
  let state = {
    page: normalized.page,
    limit: normalized.limit,
    total: 0,
    loading: false
  }

  return {
    // Get current state
    getState: () => ({ ...state }),
    
    // Update pagination info
    updatePagination: (pagination: Partial<PaginationInfo>) => {
      const safePagination = createSafePagination(pagination)
      state.total = safePagination.total
      // Ensure current page is within bounds
      if (state.page > safePagination.totalPages) {
        state.page = Math.max(1, safePagination.totalPages)
      }
    },
    
    // Change page
    changePage: (page: number) => {
      state.page = Math.max(1, page)
    },
    
    // Change page size
    changePageSize: (limit: number) => {
      const oldLimit = state.limit
      state.limit = Math.max(1, Math.min(limit, DEFAULT_PAGINATION_CONFIG.maxLimit))
      
      // Adjust page to maintain roughly the same position
      if (oldLimit !== state.limit) {
        const currentItem = (state.page - 1) * oldLimit + 1
        state.page = Math.max(1, Math.ceil(currentItem / state.limit))
      }
    },
    
    // Reset to first page
    reset: () => {
      state.page = 1
    },
    
    // Set loading state
    setLoading: (loading: boolean) => {
      state.loading = loading
    },
    
    // Get current pagination info
    getPaginationInfo: (): PaginationInfo => {
      return createSafePagination({
        total: state.total,
        page: state.page,
        limit: state.limit
      })
    },
    
    // Get parameters for API request
    getRequestParams: () => ({
      page: state.page,
      limit: state.limit
    })
  }
}

/**
 * Merge pagination data from different sources
 * @param sources - Array of pagination data sources
 * @returns Merged pagination info
 */
export function mergePaginationData(...sources: any[]): PaginationInfo {
  const merged = sources.reduce((acc, source) => {
    if (!source || typeof source !== 'object') return acc
    
    return {
      ...acc,
      total: safeGet(source, 'total', acc.total),
      page: safeGet(source, 'page', acc.page),
      limit: safeGet(source, 'limit', acc.limit),
      totalPages: safeGet(source, 'totalPages', acc.totalPages)
    }
  }, {
    total: 0,
    page: 1,
    limit: DEFAULT_PAGINATION_CONFIG.limit,
    totalPages: 1
  })

  return createSafePagination(merged)
}

/**
 * Convert pagination info to URL search params
 * @param pagination - Pagination info
 * @returns URL search params string
 */
export function paginationToSearchParams(pagination: Pick<PaginationInfo, 'page' | 'limit'>): string {
  const params = new URLSearchParams()
  
  if (pagination.page && pagination.page > 1) {
    params.set('page', pagination.page.toString())
  }
  
  if (pagination.limit && pagination.limit !== DEFAULT_PAGINATION_CONFIG.limit) {
    params.set('limit', pagination.limit.toString())
  }
  
  return params.toString()
}

/**
 * Parse pagination info from URL search params
 * @param searchParams - URL search params
 * @returns Pagination parameters
 */
export function paginationFromSearchParams(searchParams: URLSearchParams | string): Pick<BaseListParams, 'page' | 'limit'> {
  const params = typeof searchParams === 'string' 
    ? new URLSearchParams(searchParams) 
    : searchParams

  return normalizePaginationParams({
    page: params.get('page'),
    limit: params.get('limit')
  })
}

/**
 * Check if two pagination states are equal
 * @param a - First pagination state
 * @param b - Second pagination state
 * @returns True if equal
 */
export function isPaginationEqual(
  a: Pick<PaginationInfo, 'page' | 'limit'>, 
  b: Pick<PaginationInfo, 'page' | 'limit'>
): boolean {
  return a.page === b.page && a.limit === b.limit
}