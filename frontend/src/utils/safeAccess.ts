/**
 * Safe property access utilities
 * Provides safe navigation operators and default values for object property access
 */

import type { SafeAccessResult, TransformOptions } from '@/types/api'

/**
 * Safely access nested object properties with optional chaining
 * @param obj - The object to access
 * @param path - The property path (e.g., 'user.profile.name' or ['user', 'profile', 'name'])
 * @param defaultValue - Default value if property doesn't exist
 * @returns The property value or default value
 */
export function safeGet<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue as T
  }

  const keys = Array.isArray(path) ? path : path.split('.')
  let current = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue as T
    }
    current = current[key]
  }

  return current ?? defaultValue
}

/**
 * Safely access nested object properties with detailed result
 * @param obj - The object to access
 * @param path - The property path
 * @param defaultValue - Default value if property doesn't exist
 * @returns SafeAccessResult with value, existence check, and path
 */
export function safeAccess<T = any>(
  obj: any,
  path: string | string[],
  defaultValue?: T
): SafeAccessResult<T> {
  const pathStr = Array.isArray(path) ? path.join('.') : path
  
  if (!obj || typeof obj !== 'object') {
    return {
      value: defaultValue as T,
      exists: false,
      path: pathStr
    }
  }

  const keys = Array.isArray(path) ? path : path.split('.')
  let current = obj
  let exists = true

  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      exists = false
      break
    }
    current = current[key]
  }

  return {
    value: exists ? current : defaultValue as T,
    exists,
    path: pathStr
  }
}

/**
 * Check if a nested property exists
 * @param obj - The object to check
 * @param path - The property path
 * @returns True if property exists
 */
export function hasProperty(obj: any, path: string | string[]): boolean {
  return safeAccess(obj, path).exists
}

/**
 * Safely access array elements with bounds checking
 * @param arr - The array to access
 * @param index - The index to access
 * @param defaultValue - Default value if index is out of bounds
 * @returns The array element or default value
 */
export function safeArrayGet<T = any>(
  arr: any,
  index: number,
  defaultValue?: T
): T {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue as T
  }
  return arr[index] ?? defaultValue
}

/**
 * Safely get the first element of an array
 * @param arr - The array
 * @param defaultValue - Default value if array is empty
 * @returns The first element or default value
 */
export function safeFirst<T = any>(arr: any, defaultValue?: T): T {
  return safeArrayGet(arr, 0, defaultValue)
}

/**
 * Safely get the last element of an array
 * @param arr - The array
 * @param defaultValue - Default value if array is empty
 * @returns The last element or default value
 */
export function safeLast<T = any>(arr: any, defaultValue?: T): T {
  if (!Array.isArray(arr) || arr.length === 0) {
    return defaultValue as T
  }
  return arr[arr.length - 1] ?? defaultValue
}

/**
 * Ensure a value is an array
 * @param value - The value to check
 * @param defaultValue - Default array if value is not an array
 * @returns Array or default array
 */
export function ensureArray<T = any>(value: any, defaultValue: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value
  }
  if (value == null) {
    return defaultValue
  }
  return [value]
}

/**
 * Ensure a value is a number
 * @param value - The value to check
 * @param defaultValue - Default number if value is not a number
 * @returns Number or default number
 */
export function ensureNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Ensure a value is a string
 * @param value - The value to check
 * @param defaultValue - Default string if value is not a string
 * @returns String or default string
 */
export function ensureString(value: any, defaultValue: string = ''): string {
  if (typeof value === 'string') {
    return value
  }
  if (value == null) {
    return defaultValue
  }
  return String(value)
}

/**
 * Ensure a value is a boolean
 * @param value - The value to check
 * @param defaultValue - Default boolean if value is not a boolean
 * @returns Boolean or default boolean
 */
export function ensureBoolean(value: any, defaultValue: boolean = false): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (value == null) {
    return defaultValue
  }
  // Handle common truthy/falsy string values
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    if (lower === 'true' || lower === '1' || lower === 'yes') return true
    if (lower === 'false' || lower === '0' || lower === 'no') return false
  }
  return Boolean(value)
}

/**
 * Transform object data with safe access and type coercion
 * @param data - The data to transform
 * @param options - Transformation options
 * @returns Transformed data
 */
export function transformData<T = any>(data: any, options: TransformOptions = {}): T {
  if (data == null) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => transformData(item, options)) as T
  }

  if (typeof data !== 'object') {
    return data
  }

  const result: any = {}
  const {
    removeNulls = false,
    removeUndefined = false,
    removeEmpty = false,
    defaultValues = {},
    typeCoercion = false
  } = options

  for (const [key, value] of Object.entries(data)) {
    let transformedValue = value

    // Apply default values
    if (value == null && key in defaultValues) {
      transformedValue = defaultValues[key]
    }

    // Skip null values if requested
    if (removeNulls && transformedValue === null) {
      continue
    }

    // Skip undefined values if requested
    if (removeUndefined && transformedValue === undefined) {
      continue
    }

    // Skip empty values if requested
    if (removeEmpty && (
      transformedValue === '' ||
      (Array.isArray(transformedValue) && transformedValue.length === 0) ||
      (typeof transformedValue === 'object' && transformedValue !== null && Object.keys(transformedValue).length === 0)
    )) {
      continue
    }

    // Apply type coercion if requested
    if (typeCoercion && typeof transformedValue === 'string') {
      // Try to parse numbers
      const numValue = parseFloat(transformedValue)
      if (!isNaN(numValue) && isFinite(numValue)) {
        transformedValue = numValue
      }
      // Try to parse booleans
      else if (transformedValue.toLowerCase() === 'true') {
        transformedValue = true
      }
      else if (transformedValue.toLowerCase() === 'false') {
        transformedValue = false
      }
    }

    // Recursively transform nested objects
    if (typeof transformedValue === 'object' && transformedValue !== null) {
      transformedValue = transformData(transformedValue, options)
    }

    result[key] = transformedValue
  }

  return result
}

/**
 * Create a safe object accessor with default values
 * @param obj - The object to wrap
 * @param defaults - Default values for properties
 * @returns Proxy object with safe access
 */
export function createSafeAccessor<T extends Record<string, any>>(
  obj: any,
  defaults: Partial<T> = {}
): T {
  return new Proxy(obj || {}, {
    get(target, prop) {
      const key = String(prop)
      if (key in target) {
        return target[key]
      }
      if (key in defaults) {
        return defaults[key as keyof T]
      }
      return undefined
    }
  }) as T
}

/**
 * Safely parse JSON with error handling
 * @param jsonString - The JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed object or default value
 */
export function safeJsonParse<T = any>(jsonString: string, defaultValue?: T): T {
  try {
    return JSON.parse(jsonString)
  } catch {
    return defaultValue as T
  }
}

/**
 * Safely stringify object to JSON
 * @param obj - The object to stringify
 * @param defaultValue - Default value if stringification fails
 * @returns JSON string or default value
 */
export function safeJsonStringify(obj: any, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(obj)
  } catch {
    return defaultValue
  }
}