/**
 * Unit tests for data validation utilities
 */

import { describe, it, expect } from 'vitest'
import {
  validateApiResponse,
  validatePaginatedResponse,
  normalizeListResponse,
  validateWithSchema,
  transformResponseData,
  sanitizeData
} from '@/utils/dataValidation'

describe('dataValidation utilities', () => {
  describe('validateApiResponse', () => {
    it('should validate correct API response', () => {
      const response = {
        success: true,
        data: { id: 1, name: 'Test' },
        message: 'Success',
        meta: {
          timestamp: '2023-01-01T00:00:00Z',
          requestId: 'req-123',
          version: '1.0'
        }
      }

      const result = validateApiResponse(response)
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: 1, name: 'Test' })
      expect(result.message).toBe('Success')
      expect(result.meta?.timestamp).toBe('2023-01-01T00:00:00Z')
    })

    it('should handle invalid response format', () => {
      const result = validateApiResponse(null)
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0].code).toBe('INVALID_RESPONSE')
    })

    it('should normalize missing fields', () => {
      const response = { data: 'test' }
      const result = validateApiResponse(response)
      expect(result.success).toBe(true)
      expect(result.data).toBe('test')
      expect(result.meta).toBeDefined()
    })
  })

  describe('validatePaginatedResponse', () => {
    it('should validate paginated response', () => {
      const response = {
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        pagination: {
          total: 10,
          page: 1,
          limit: 2,
          totalPages: 5
        }
      }

      const result = validatePaginatedResponse(response)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.pagination.total).toBe(10)
      expect(result.pagination.hasNext).toBe(true)
      expect(result.pagination.hasPrev).toBe(false)
    })

    it('should handle missing pagination info', () => {
      const response = {
        success: true,
        data: [{ id: 1 }]
      }

      const result = validatePaginatedResponse(response)
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(20)
    })

    it('should ensure data is array', () => {
      const response = {
        success: true,
        data: { id: 1 }
      }

      const result = validatePaginatedResponse(response)
      expect(Array.isArray(result.data)).toBe(true)
      // When data is not an array, it should be converted to empty array
      expect(result.data).toEqual([])
    })
  })

  describe('normalizeListResponse', () => {
    it('should handle paginated response', () => {
      const response = {
        success: true,
        data: [{ id: 1 }],
        pagination: { total: 1, page: 1, limit: 20 }
      }

      const result = normalizeListResponse(response)
      expect(result.pagination).toBeDefined()
      expect(result.pagination.totalPages).toBe(1)
    })

    it('should handle non-paginated response', () => {
      const response = {
        success: true,
        data: [{ id: 1 }, { id: 2 }]
      }

      const result = normalizeListResponse(response)
      expect(result.pagination.total).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.totalPages).toBe(1)
    })
  })

  describe('validateWithSchema', () => {
    it('should validate data with schema', () => {
      const data = {
        name: 'John',
        age: '30',
        active: 'true'
      }

      const schema = {
        name: { type: 'string' as const, required: true },
        age: { type: 'number' as const, required: true },
        active: { type: 'boolean' as const, default: false }
      }

      const result = validateWithSchema(data, schema)
      expect(result.isValid).toBe(true)
      expect(result.data.name).toBe('John')
      expect(result.data.age).toBe(30)
      expect(result.data.active).toBe(true)
    })

    it('should handle validation errors', () => {
      const data = {
        age: 'not a number'
      }

      const schema = {
        name: { type: 'string' as const, required: true },
        age: { type: 'number' as const, required: true }
      }

      const result = validateWithSchema(data, schema)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0) // Should have validation errors
      // Check that we have at least the required field error
      expect(result.errors.some(error => error.field === 'name' && error.code === 'REQUIRED')).toBe(true)
    })

    it('should apply default values', () => {
      const data = {}

      const schema = {
        name: { type: 'string' as const, default: 'Anonymous' },
        active: { type: 'boolean' as const, default: true }
      }

      const result = validateWithSchema(data, schema)
      expect(result.data.name).toBe('Anonymous')
      expect(result.data.active).toBe(true)
    })
  })

  describe('transformResponseData', () => {
    it('should transform data with mapping', () => {
      const data = {
        user_name: 'John',
        user_age: 30,
        profile: {
          email: 'john@example.com'
        }
      }

      const transformMap = {
        name: 'user_name',
        age: 'user_age',
        email: 'profile.email',
        fullName: (data: any) => `${data.user_name} Doe`
      }

      const result = transformResponseData(data, transformMap)
      expect(result.name).toBe('John')
      expect(result.age).toBe(30)
      expect(result.email).toBe('john@example.com')
      expect(result.fullName).toBe('John Doe')
    })

    it('should handle complex transform config', () => {
      const data = {
        created_at: '2023-01-01T00:00:00Z',
        status: 'active'
      }

      const transformMap = {
        createdAt: {
          path: 'created_at',
          transform: (value: string) => new Date(value).getTime()
        },
        isActive: {
          path: 'status',
          transform: (value: string) => value === 'active',
          default: false
        }
      }

      const result = transformResponseData(data, transformMap)
      expect(result.createdAt).toBe(new Date('2023-01-01T00:00:00Z').getTime())
      expect(result.isActive).toBe(true)
    })
  })

  describe('sanitizeData', () => {
    it('should remove null values', () => {
      const data = {
        name: 'John',
        email: null,
        age: 30
      }

      const result = sanitizeData(data, { removeNulls: true })
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should remove undefined values', () => {
      const data = {
        name: 'John',
        email: undefined,
        age: 30
      }

      const result = sanitizeData(data, { removeUndefined: true })
      expect(result).toEqual({ name: 'John', age: 30 })
    })

    it('should filter by allowed keys', () => {
      const data = {
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
        age: 30
      }

      const result = sanitizeData(data, { 
        allowedKeys: ['name', 'email', 'age'] 
      })
      expect(result).toEqual({ 
        name: 'John', 
        email: 'john@example.com', 
        age: 30 
      })
    })

    it('should block specific keys', () => {
      const data = {
        name: 'John',
        email: 'john@example.com',
        password: 'secret',
        token: 'abc123'
      }

      const result = sanitizeData(data, { 
        blockedKeys: ['password', 'token'] 
      })
      expect(result).toEqual({ 
        name: 'John', 
        email: 'john@example.com' 
      })
    })

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          password: 'secret',
          profile: {
            email: 'john@example.com',
            token: 'abc123'
          }
        }
      }

      const result = sanitizeData(data, { 
        blockedKeys: ['password', 'token'] 
      })
      expect(result.user.name).toBe('John')
      expect(result.user.password).toBeUndefined()
      expect(result.user.profile.email).toBe('john@example.com')
      expect(result.user.profile.token).toBeUndefined()
    })

    it('should handle arrays', () => {
      const data = {
        users: [
          { name: 'John', password: 'secret1' },
          { name: 'Jane', password: 'secret2' }
        ]
      }

      const result = sanitizeData(data, { 
        blockedKeys: ['password'] 
      })
      expect(result.users[0].name).toBe('John')
      expect(result.users[0].password).toBeUndefined()
      expect(result.users[1].name).toBe('Jane')
      expect(result.users[1].password).toBeUndefined()
    })
  })
})