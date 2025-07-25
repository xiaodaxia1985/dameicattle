/**
 * Data structure validation and transformation utilities
 * Provides validation, normalization, and transformation for API responses
 */

import type { 
  BaseApiResponse, 
  PaginatedApiResponse, 
  PaginationInfo, 
  ValidationError,
  TransformOptions 
} from '@/types/api'
import { 
  safeGet, 
  ensureArray, 
  ensureNumber, 
  ensureString, 
  ensureBoolean,
  transformData 
} from './safeAccess'

/**
 * Validate and normalize API response structure
 * @param response - Raw API response
 * @returns Normalized API response
 */
export function validateApiResponse<T = any>(response: any): BaseApiResponse<T> {
  if (!response || typeof response !== 'object') {
    return {
      success: false,
      data: null as T,
      message: 'Invalid response format',
      errors: [{
        field: 'response',
        message: 'Response is not a valid object',
        code: 'INVALID_RESPONSE'
      }]
    }
  }

  // Handle different response formats
  const success = ensureBoolean(safeGet(response, 'success', true))
  const data = safeGet(response, 'data', null)
  const message = ensureString(safeGet(response, 'message', ''))
  const errors = ensureArray(safeGet(response, 'errors', []))

  // Validate errors array
  const validatedErrors: ValidationError[] = errors
    .filter(error => error && typeof error === 'object')
    .map(error => ({
      field: ensureString(error.field, 'unknown'),
      message: ensureString(error.message, 'Unknown error'),
      code: ensureString(error.code, 'UNKNOWN_ERROR'),
      value: error.value
    }))

  return {
    success,
    data,
    message: message || undefined,
    errors: validatedErrors.length > 0 ? validatedErrors : undefined,
    meta: {
      timestamp: ensureString(safeGet(response, 'meta.timestamp', new Date().toISOString())),
      requestId: ensureString(safeGet(response, 'meta.requestId', '')),
      version: ensureString(safeGet(response, 'meta.version', '1.0')),
      processingTime: ensureNumber(safeGet(response, 'meta.processingTime'))
    }
  }
}

/**
 * Validate and normalize paginated API response
 * @param response - Raw paginated API response
 * @returns Normalized paginated API response
 */
export function validatePaginatedResponse<T = any>(response: any): PaginatedApiResponse<T> {
  const baseResponse = validateApiResponse<T[]>(response)
  
  // Ensure data is an array - if it's not an array, convert to empty array
  const data = Array.isArray(baseResponse.data) ? baseResponse.data : []
  
  // Extract and validate pagination info
  const paginationData = safeGet(response, 'pagination', {})
  const total = ensureNumber(paginationData.total, 0)
  const page = ensureNumber(paginationData.page, 1)
  const limit = ensureNumber(paginationData.limit, 20)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const pagination: PaginationInfo = {
    total,
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }

  return {
    ...baseResponse,
    data,
    pagination
  }
}

/**
 * Normalize list response that might be paginated or not
 * @param response - Raw list response
 * @returns Normalized list response with pagination info
 */
export function normalizeListResponse<T = any>(response: any): PaginatedApiResponse<T> {
  // Check if response has pagination info
  if (safeGet(response, 'pagination')) {
    return validatePaginatedResponse<T>(response)
  }

  // Handle non-paginated list response
  const baseResponse = validateApiResponse<T[]>(response)
  const data = ensureArray(baseResponse.data, [])

  return {
    ...baseResponse,
    data,
    pagination: {
      total: data.length,
      page: 1,
      limit: data.length || 20,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    }
  }
}

/**
 * Validate and transform object data with schema
 * @param data - Raw data object
 * @param schema - Validation schema
 * @returns Validated and transformed data
 */
export function validateWithSchema<T = any>(
  data: any,
  schema: ValidationSchema<T>
): ValidationResult<T> {
  const errors: ValidationError[] = []
  const result: any = {}

  for (const [key, fieldSchema] of Object.entries(schema)) {
    const value = safeGet(data, key)
    const fieldResult = validateField(key, value, fieldSchema as FieldSchema)
    
    if (fieldResult.errors.length > 0) {
      errors.push(...fieldResult.errors)
    }
    
    result[key] = fieldResult.value
  }

  return {
    data: result as T,
    errors,
    isValid: errors.length === 0
  }
}

/**
 * Validate individual field with schema
 * @param fieldName - Field name
 * @param value - Field value
 * @param schema - Field schema
 * @returns Field validation result
 */
function validateField(
  fieldName: string,
  value: any,
  schema: FieldSchema
): FieldValidationResult {
  const errors: ValidationError[] = []
  let transformedValue = value

  // Check required
  if (schema.required && (value == null || value === '')) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED',
      value
    })
    return { value: schema.default, errors }
  }

  // Apply default value
  if (value == null && schema.default !== undefined) {
    transformedValue = schema.default
  }

  // Skip further validation if value is null/undefined and not required
  if (transformedValue == null) {
    return { value: transformedValue, errors }
  }

  // Type validation and coercion
  switch (schema.type) {
    case 'string':
      transformedValue = ensureString(transformedValue, schema.default as string)
      break
    case 'number':
      transformedValue = ensureNumber(transformedValue, schema.default as number)
      if (isNaN(transformedValue)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be a valid number`,
          code: 'INVALID_NUMBER',
          value
        })
      }
      break
    case 'boolean':
      transformedValue = ensureBoolean(transformedValue, schema.default as boolean)
      break
    case 'array':
      transformedValue = ensureArray(transformedValue, schema.default as any[])
      break
    case 'object':
      if (typeof transformedValue !== 'object' || transformedValue === null) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be an object`,
          code: 'INVALID_OBJECT',
          value
        })
        transformedValue = schema.default || {}
      }
      break
  }

  // Custom validation
  if (schema.validate && typeof schema.validate === 'function') {
    const customResult = schema.validate(transformedValue)
    if (customResult !== true) {
      errors.push({
        field: fieldName,
        message: typeof customResult === 'string' ? customResult : `${fieldName} is invalid`,
        code: 'CUSTOM_VALIDATION',
        value: transformedValue
      })
    }
  }

  return { value: transformedValue, errors }
}

/**
 * Transform API response data with safe access patterns
 * @param data - Raw response data
 * @param transformMap - Transformation mapping
 * @returns Transformed data
 */
export function transformResponseData<T = any>(
  data: any,
  transformMap: TransformMap<T>
): T {
  if (!data || typeof data !== 'object') {
    return data
  }

  const result: any = {}

  for (const [targetKey, sourceConfig] of Object.entries(transformMap)) {
    if (typeof sourceConfig === 'string') {
      // Simple path mapping
      result[targetKey] = safeGet(data, sourceConfig)
    } else if (typeof sourceConfig === 'function') {
      // Transform function
      result[targetKey] = sourceConfig(data)
    } else if (sourceConfig && typeof sourceConfig === 'object') {
      // Complex mapping with options
      const { path, transform, default: defaultValue } = sourceConfig as TransformConfig
      let value = safeGet(data, path, defaultValue)
      
      if (transform && typeof transform === 'function') {
        value = transform(value, data)
      }
      
      result[targetKey] = value
    }
  }

  return result as T
}

/**
 * Sanitize data by removing unsafe properties
 * @param data - Data to sanitize
 * @param options - Sanitization options
 * @returns Sanitized data
 */
export function sanitizeData<T = any>(
  data: any,
  options: SanitizeOptions = {}
): T {
  const {
    removeNulls = true,
    removeUndefined = true,
    removeEmpty = false,
    allowedKeys,
    blockedKeys = [],
    maxDepth = 10
  } = options

  return sanitizeRecursive(data, 0, maxDepth, {
    removeNulls,
    removeUndefined,
    removeEmpty,
    allowedKeys,
    blockedKeys
  })
}

function sanitizeRecursive(
  data: any,
  currentDepth: number,
  maxDepth: number,
  options: Required<Omit<SanitizeOptions, 'maxDepth'>>
): any {
  if (currentDepth >= maxDepth) {
    return data
  }

  if (data == null) {
    return data
  }

  if (Array.isArray(data)) {
    return data
      .map(item => sanitizeRecursive(item, currentDepth + 1, maxDepth, options))
      .filter(item => {
        if (options.removeNulls && item === null) return false
        if (options.removeUndefined && item === undefined) return false
        if (options.removeEmpty && item === '') return false
        return true
      })
  }

  if (typeof data === 'object') {
    const result: any = {}
    
    for (const [key, value] of Object.entries(data)) {
      // Check blocked keys
      if (options.blockedKeys.includes(key)) {
        continue
      }
      
      // Check allowed keys
      if (options.allowedKeys && !options.allowedKeys.includes(key)) {
        continue
      }
      
      const sanitizedValue = sanitizeRecursive(value, currentDepth + 1, maxDepth, options)
      
      // Apply filtering rules
      if (options.removeNulls && sanitizedValue === null) continue
      if (options.removeUndefined && sanitizedValue === undefined) continue
      if (options.removeEmpty && sanitizedValue === '') continue
      
      result[key] = sanitizedValue
    }
    
    return result
  }

  return data
}

// Type definitions
export interface ValidationSchema<T> {
  [K in keyof T]?: FieldSchema
}

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required?: boolean
  default?: any
  validate?: (value: any) => boolean | string
}

export interface ValidationResult<T> {
  data: T
  errors: ValidationError[]
  isValid: boolean
}

export interface FieldValidationResult {
  value: any
  errors: ValidationError[]
}

export interface TransformMap<T> {
  [K in keyof T]: string | TransformConfig | ((data: any) => any)
}

export interface TransformConfig {
  path: string
  transform?: (value: any, data: any) => any
  default?: any
}

export interface SanitizeOptions {
  removeNulls?: boolean
  removeUndefined?: boolean
  removeEmpty?: boolean
  allowedKeys?: string[]
  blockedKeys?: string[]
  maxDepth?: number
}