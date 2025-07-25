/**
 * Unit tests for pagination helpers
 */

import { describe, it, expect } from 'vitest'
import {
  createSafePagination,
  normalizePaginationParams,
  getPaginationDisplayInfo,
  generatePageNumbers,
  validatePaginationParams,
  createPaginationState,
  mergePaginationData,
  paginationToSearchParams,
  paginationFromSearchParams,
  isPaginationEqual,
  DEFAULT_PAGINATION_CONFIG
} from '@/utils/paginationHelpers'

describe('paginationHelpers', () => {
  describe('createSafePagination', () => {
    it('should create safe pagination from valid data', () => {
      const data = {
        total: 100,
        page: 2,
        limit: 20
      }

      const result = createSafePagination(data)
      expect(result.total).toBe(100)
      expect(result.page).toBe(2)
      expect(result.limit).toBe(20)
      expect(result.totalPages).toBe(5)
      expect(result.hasNext).toBe(true)
      expect(result.hasPrev).toBe(true)
    })

    it('should handle invalid data with defaults', () => {
      const data = {
        total: 'invalid',
        page: -1,
        limit: 0
      }

      const result = createSafePagination(data)
      expect(result.total).toBe(0)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(1) // Minimum limit is 1, not the default config limit
      expect(result.totalPages).toBe(1)
      expect(result.hasNext).toBe(false)
      expect(result.hasPrev).toBe(false)
    })

    it('should adjust page to be within bounds', () => {
      const data = {
        total: 50,
        page: 10, // Too high
        limit: 20
      }

      const result = createSafePagination(data)
      expect(result.page).toBe(3) // Max page for 50 items with 20 per page
      expect(result.totalPages).toBe(3)
    })

    it('should enforce maximum limit', () => {
      const data = {
        total: 100,
        page: 1,
        limit: 200 // Too high
      }

      const result = createSafePagination(data)
      expect(result.limit).toBe(DEFAULT_PAGINATION_CONFIG.maxLimit)
    })
  })

  describe('normalizePaginationParams', () => {
    it('should normalize valid params', () => {
      const params = { page: 2, limit: 50 }
      const result = normalizePaginationParams(params)
      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)
    })

    it('should apply defaults for missing params', () => {
      const result = normalizePaginationParams({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(DEFAULT_PAGINATION_CONFIG.limit)
    })

    it('should enforce minimum values', () => {
      const params = { page: 0, limit: -5 }
      const result = normalizePaginationParams(params)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(1)
    })
  })

  describe('getPaginationDisplayInfo', () => {
    it('should calculate display info correctly', () => {
      const pagination = {
        total: 100,
        page: 3,
        limit: 20,
        totalPages: 5,
        hasNext: true,
        hasPrev: true
      }

      const result = getPaginationDisplayInfo(pagination)
      expect(result.start).toBe(41) // (3-1) * 20 + 1
      expect(result.end).toBe(60)   // min(3 * 20, 100)
      expect(result.total).toBe(100)
      expect(result.displayText).toBe('显示第 41 到第 60 项，共 100 项')
    })

    it('should handle empty results', () => {
      const pagination = {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }

      const result = getPaginationDisplayInfo(pagination)
      expect(result.start).toBe(0)
      expect(result.end).toBe(0)
      expect(result.displayText).toBe('暂无数据')
    })

    it('should handle last page correctly', () => {
      const pagination = {
        total: 95,
        page: 5,
        limit: 20,
        totalPages: 5,
        hasNext: false,
        hasPrev: true
      }

      const result = getPaginationDisplayInfo(pagination)
      expect(result.start).toBe(81)
      expect(result.end).toBe(95) // Should not exceed total
    })
  })

  describe('generatePageNumbers', () => {
    it('should generate all pages when total is small', () => {
      const pagination = { page: 3, totalPages: 5, total: 100, limit: 20, hasNext: true, hasPrev: true }
      const result = generatePageNumbers(pagination, 7)
      expect(result).toEqual([1, 2, 3, 4, 5])
    })

    it('should generate centered pages when total is large', () => {
      const pagination = { page: 10, totalPages: 20, total: 400, limit: 20, hasNext: true, hasPrev: true }
      const result = generatePageNumbers(pagination, 7)
      expect(result).toEqual([7, 8, 9, 10, 11, 12, 13])
    })

    it('should adjust for beginning pages', () => {
      const pagination = { page: 2, totalPages: 20, total: 400, limit: 20, hasNext: true, hasPrev: true }
      const result = generatePageNumbers(pagination, 7)
      expect(result).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it('should adjust for ending pages', () => {
      const pagination = { page: 19, totalPages: 20, total: 400, limit: 20, hasNext: true, hasPrev: true }
      const result = generatePageNumbers(pagination, 7)
      expect(result).toEqual([14, 15, 16, 17, 18, 19, 20])
    })
  })

  describe('validatePaginationParams', () => {
    it('should validate correct params', () => {
      const params = { page: 2, limit: 50 }
      const result = validatePaginationParams(params)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.normalized).toEqual({ page: 2, limit: 50 })
    })

    it('should detect invalid params', () => {
      const params = { page: -1, limit: 200 }
      const result = validatePaginationParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.normalized.page).toBe(1)
      expect(result.normalized.limit).toBe(DEFAULT_PAGINATION_CONFIG.maxLimit)
    })
  })

  describe('createPaginationState', () => {
    it('should create pagination state manager', () => {
      const state = createPaginationState({ page: 2, limit: 50 })
      
      expect(state.getState().page).toBe(2)
      expect(state.getState().limit).toBe(50)
      expect(state.getState().total).toBe(0)
    })

    it('should update pagination info', () => {
      const state = createPaginationState()
      state.updatePagination({ total: 100, page: 1, limit: 20, totalPages: 5 })
      
      expect(state.getState().total).toBe(100)
      expect(state.getPaginationInfo().totalPages).toBe(5)
    })

    it('should change page', () => {
      const state = createPaginationState()
      state.changePage(3)
      
      expect(state.getState().page).toBe(3)
    })

    it('should change page size and adjust page', () => {
      const state = createPaginationState({ page: 3, limit: 20 })
      state.changePageSize(50)
      
      expect(state.getState().limit).toBe(50)
      // The page adjustment logic should maintain roughly the same position
      // Page 3 with limit 20 means items 41-60, with limit 50 that should be page 1
      expect(state.getState().page).toBe(1) // Adjusted to maintain position
    })

    it('should reset to first page', () => {
      const state = createPaginationState({ page: 5 })
      state.reset()
      
      expect(state.getState().page).toBe(1)
    })

    it('should adjust page when total changes', () => {
      const state = createPaginationState({ page: 10, limit: 20 })
      state.updatePagination({ total: 50 }) // Only 3 pages possible
      
      expect(state.getState().page).toBe(3) // Adjusted to max page
    })
  })

  describe('mergePaginationData', () => {
    it('should merge multiple pagination sources', () => {
      const source1 = { total: 100 }
      const source2 = { page: 2, limit: 50 }
      const source3 = { totalPages: 2 }
      
      const result = mergePaginationData(source1, source2, source3)
      expect(result.total).toBe(100)
      expect(result.page).toBe(2)
      expect(result.limit).toBe(50)
      expect(result.totalPages).toBe(2)
    })

    it('should handle invalid sources', () => {
      const result = mergePaginationData(null, undefined, 'invalid')
      expect(result.total).toBe(0)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(DEFAULT_PAGINATION_CONFIG.limit)
    })
  })

  describe('paginationToSearchParams', () => {
    it('should convert pagination to search params', () => {
      const pagination = { page: 3, limit: 50 }
      const result = paginationToSearchParams(pagination)
      expect(result).toBe('page=3&limit=50')
    })

    it('should omit default values', () => {
      const pagination = { page: 1, limit: DEFAULT_PAGINATION_CONFIG.limit }
      const result = paginationToSearchParams(pagination)
      expect(result).toBe('')
    })
  })

  describe('paginationFromSearchParams', () => {
    it('should parse pagination from search params', () => {
      const params = new URLSearchParams('page=3&limit=50')
      const result = paginationFromSearchParams(params)
      expect(result.page).toBe(3)
      expect(result.limit).toBe(50)
    })

    it('should handle string input', () => {
      const result = paginationFromSearchParams('page=2&limit=100')
      expect(result.page).toBe(2)
      expect(result.limit).toBe(DEFAULT_PAGINATION_CONFIG.maxLimit) // Capped at max
    })

    it('should apply defaults for missing params', () => {
      const result = paginationFromSearchParams('')
      expect(result.page).toBe(1)
      expect(result.limit).toBe(DEFAULT_PAGINATION_CONFIG.limit)
    })
  })

  describe('isPaginationEqual', () => {
    it('should detect equal pagination states', () => {
      const a = { page: 2, limit: 50 }
      const b = { page: 2, limit: 50 }
      expect(isPaginationEqual(a, b)).toBe(true)
    })

    it('should detect different pagination states', () => {
      const a = { page: 2, limit: 50 }
      const b = { page: 3, limit: 50 }
      expect(isPaginationEqual(a, b)).toBe(false)
    })
  })
})