/**
 * Unit tests for safe access utilities
 */

import { describe, it, expect } from 'vitest'
import {
  safeGet,
  safeAccess,
  hasProperty,
  safeArrayGet,
  safeFirst,
  safeLast,
  ensureArray,
  ensureNumber,
  ensureString,
  ensureBoolean,
  transformData,
  createSafeAccessor,
  safeJsonParse,
  safeJsonStringify
} from '@/utils/safeAccess'

describe('safeAccess utilities', () => {
  const testObject = {
    user: {
      profile: {
        name: 'John Doe',
        age: 30,
        settings: {
          theme: 'dark',
          notifications: true
        }
      },
      posts: [
        { id: 1, title: 'First Post' },
        { id: 2, title: 'Second Post' }
      ]
    },
    count: 0,
    active: false,
    data: null
  }

  describe('safeGet', () => {
    it('should return nested property value', () => {
      expect(safeGet(testObject, 'user.profile.name')).toBe('John Doe')
      expect(safeGet(testObject, ['user', 'profile', 'age'])).toBe(30)
    })

    it('should return default value for non-existent property', () => {
      expect(safeGet(testObject, 'user.profile.email', 'default@example.com')).toBe('default@example.com')
      expect(safeGet(testObject, 'nonexistent.path', 'default')).toBe('default')
    })

    it('should handle null/undefined objects', () => {
      expect(safeGet(null, 'user.name', 'default')).toBe('default')
      expect(safeGet(undefined, 'user.name', 'default')).toBe('default')
    })

    it('should handle falsy values correctly', () => {
      expect(safeGet(testObject, 'count', 10)).toBe(0)
      expect(safeGet(testObject, 'active', true)).toBe(false)
      expect(safeGet(testObject, 'data', 'default')).toBe('default')
    })
  })

  describe('safeAccess', () => {
    it('should return detailed access result', () => {
      const result = safeAccess(testObject, 'user.profile.name', 'default')
      expect(result.value).toBe('John Doe')
      expect(result.exists).toBe(true)
      expect(result.path).toBe('user.profile.name')
    })

    it('should indicate non-existent property', () => {
      const result = safeAccess(testObject, 'user.profile.email', 'default')
      expect(result.value).toBe('default')
      expect(result.exists).toBe(false)
      expect(result.path).toBe('user.profile.email')
    })
  })

  describe('hasProperty', () => {
    it('should check property existence', () => {
      expect(hasProperty(testObject, 'user.profile.name')).toBe(true)
      expect(hasProperty(testObject, 'user.profile.email')).toBe(false)
      expect(hasProperty(testObject, 'count')).toBe(true)
    })
  })

  describe('safeArrayGet', () => {
    it('should return array element safely', () => {
      expect(safeArrayGet(testObject.user.posts, 0)).toEqual({ id: 1, title: 'First Post' })
      expect(safeArrayGet(testObject.user.posts, 1)).toEqual({ id: 2, title: 'Second Post' })
    })

    it('should return default for out of bounds', () => {
      expect(safeArrayGet(testObject.user.posts, 5, 'default')).toBe('default')
      expect(safeArrayGet(testObject.user.posts, -1, 'default')).toBe('default')
    })

    it('should handle non-arrays', () => {
      expect(safeArrayGet('not an array', 0, 'default')).toBe('default')
      expect(safeArrayGet(null, 0, 'default')).toBe('default')
    })
  })

  describe('safeFirst and safeLast', () => {
    it('should return first and last elements', () => {
      expect(safeFirst(testObject.user.posts)).toEqual({ id: 1, title: 'First Post' })
      expect(safeLast(testObject.user.posts)).toEqual({ id: 2, title: 'Second Post' })
    })

    it('should handle empty arrays', () => {
      expect(safeFirst([], 'default')).toBe('default')
      expect(safeLast([], 'default')).toBe('default')
    })
  })

  describe('ensureArray', () => {
    it('should return array as-is', () => {
      expect(ensureArray([1, 2, 3])).toEqual([1, 2, 3])
    })

    it('should wrap non-array values', () => {
      expect(ensureArray('test')).toEqual(['test'])
      expect(ensureArray(123)).toEqual([123])
    })

    it('should return default for null/undefined', () => {
      expect(ensureArray(null)).toEqual([])
      expect(ensureArray(undefined, ['default'])).toEqual(['default'])
    })
  })

  describe('ensureNumber', () => {
    it('should return valid numbers', () => {
      expect(ensureNumber(42)).toBe(42)
      expect(ensureNumber('123')).toBe(123)
      expect(ensureNumber('123.45')).toBe(123.45)
    })

    it('should return default for invalid numbers', () => {
      expect(ensureNumber('not a number')).toBe(0)
      expect(ensureNumber('not a number', 10)).toBe(10)
      expect(ensureNumber(null, 5)).toBe(5)
    })
  })

  describe('ensureString', () => {
    it('should return strings as-is', () => {
      expect(ensureString('hello')).toBe('hello')
    })

    it('should convert non-strings', () => {
      expect(ensureString(123)).toBe('123')
      expect(ensureString(true)).toBe('true')
    })

    it('should return default for null/undefined', () => {
      expect(ensureString(null)).toBe('')
      expect(ensureString(undefined, 'default')).toBe('default')
    })
  })

  describe('ensureBoolean', () => {
    it('should return booleans as-is', () => {
      expect(ensureBoolean(true)).toBe(true)
      expect(ensureBoolean(false)).toBe(false)
    })

    it('should convert string values', () => {
      expect(ensureBoolean('true')).toBe(true)
      expect(ensureBoolean('false')).toBe(false)
      expect(ensureBoolean('1')).toBe(true)
      expect(ensureBoolean('0')).toBe(false)
    })

    it('should return default for null/undefined', () => {
      expect(ensureBoolean(null)).toBe(false)
      expect(ensureBoolean(undefined, true)).toBe(true)
    })
  })

  describe('transformData', () => {
    it('should remove null values', () => {
      const data = { a: 1, b: null, c: 'test' }
      const result = transformData(data, { removeNulls: true })
      expect(result).toEqual({ a: 1, c: 'test' })
    })

    it('should apply default values', () => {
      const data = { a: 1, b: null }
      const result = transformData(data, { 
        defaultValues: { b: 'default', c: 'new' }
      })
      expect(result).toEqual({ a: 1, b: 'default' })
    })

    it('should apply type coercion', () => {
      const data = { a: '123', b: 'true', c: 'false' }
      const result = transformData(data, { typeCoercion: true })
      expect(result).toEqual({ a: 123, b: true, c: false })
    })
  })

  describe('createSafeAccessor', () => {
    it('should create proxy with safe access', () => {
      const accessor = createSafeAccessor(testObject, { 
        'user.email': 'default@example.com' 
      })
      
      expect(accessor.user.profile.name).toBe('John Doe')
      expect(accessor['user.email']).toBe('default@example.com')
    })
  })

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"name": "John"}')).toEqual({ name: 'John' })
    })

    it('should return default for invalid JSON', () => {
      expect(safeJsonParse('invalid json', { error: true })).toEqual({ error: true })
    })
  })

  describe('safeJsonStringify', () => {
    it('should stringify valid objects', () => {
      expect(safeJsonStringify({ name: 'John' })).toBe('{"name":"John"}')
    })

    it('should return default for circular references', () => {
      const circular: any = { name: 'test' }
      circular.self = circular
      expect(safeJsonStringify(circular, 'error')).toBe('error')
    })
  })
})