/**
 * Type-safe API response interfaces and utilities
 * Provides consistent data structures and safe property access
 */

// Base API response structure
export interface BaseApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: ValidationError[]
  meta?: ResponseMeta
}

// Paginated response structure
export interface PaginatedApiResponse<T = any> extends BaseApiResponse<T[]> {
  pagination: PaginationInfo
}

// Validation error structure
export interface ValidationError {
  field: string
  message: string
  code: string
  value?: any
}

// Response metadata
export interface ResponseMeta {
  timestamp: string
  requestId: string
  version: string
  processingTime?: number
}

// Pagination information
export interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext?: boolean
  hasPrev?: boolean
}

// Standard list parameters
export interface BaseListParams {
  page?: number
  limit?: number
  keyword?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

// API error structure
export interface ApiError extends Error {
  code?: string
  status?: number
  response?: any
  isRetryable?: boolean
  category?: ErrorCategory
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Safe property access result
export interface SafeAccessResult<T> {
  value: T
  exists: boolean
  path: string
}

// Data transformation options
export interface TransformOptions {
  removeNulls?: boolean
  removeUndefined?: boolean
  removeEmpty?: boolean
  defaultValues?: Record<string, any>
  typeCoercion?: boolean
}

// Type guards for API responses
export function isBaseApiResponse<T>(obj: any): obj is BaseApiResponse<T> {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean' &&
    'data' in obj
  )
}

export function isPaginatedApiResponse<T>(obj: any): obj is PaginatedApiResponse<T> {
  return (
    isBaseApiResponse<T[]>(obj) &&
    obj.pagination &&
    typeof obj.pagination === 'object' &&
    typeof obj.pagination.total === 'number' &&
    typeof obj.pagination.page === 'number' &&
    typeof obj.pagination.limit === 'number'
  )
}

export function isValidationError(obj: any): obj is ValidationError {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.field === 'string' &&
    typeof obj.message === 'string' &&
    typeof obj.code === 'string'
  )
}

// Default values for common structures
export const DEFAULT_PAGINATION: PaginationInfo = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
}

export const DEFAULT_META: ResponseMeta = {
  timestamp: new Date().toISOString(),
  requestId: '',
  version: '1.0'
}

// Helper function to create safe API response
export function createSafeApiResponse<T>(
  data: T,
  success: boolean = true,
  message?: string,
  errors?: ValidationError[],
  meta?: Partial<ResponseMeta>
): BaseApiResponse<T> {
  return {
    success,
    data,
    message,
    errors,
    meta: {
      ...DEFAULT_META,
      ...meta
    }
  }
}

// Helper function to create safe paginated response
export function createSafePaginatedResponse<T>(
  data: T[],
  pagination: Partial<PaginationInfo>,
  success: boolean = true,
  message?: string,
  errors?: ValidationError[],
  meta?: Partial<ResponseMeta>
): PaginatedApiResponse<T> {
  const safePagination: PaginationInfo = {
    ...DEFAULT_PAGINATION,
    ...pagination,
    totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
    hasNext: (pagination.page || 1) < Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
    hasPrev: (pagination.page || 1) > 1
  }

  return {
    success,
    data,
    pagination: safePagination,
    message,
    errors,
    meta: {
      ...DEFAULT_META,
      ...meta
    }
  }
}