/**
 * 表单验证和数据处理工具函数
 */

/**
 * 类型守卫：检查值是否为非空字符串
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * 类型守卫：检查值是否为有效数字
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * 类型守卫：检查值是否为有效日期
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * 安全地转换为字符串
 */
export function safeToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

/**
 * 安全地转换为数字
 */
export function safeToNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return isValidNumber(num) ? num : null
}

/**
 * 安全地转换为日期
 */
export function safeToDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null
  
  if (value instanceof Date) {
    return isValidDate(value) ? value : null
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return isValidDate(date) ? date : null
  }
  
  return null
}

/**
 * 安全地访问对象属性
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  return obj?.[key]
}

/**
 * 安全地访问嵌套对象属性
 */
export function safeGetNested<T>(obj: any, path: string): T | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = current[key]
  }
  
  return current as T
}

/**
 * 验证表单字段是否为必填且有效
 */
export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName}是必填项`
  }
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName}不能为空`
  }
  return null
}

/**
 * 验证字符串长度
 */
export function validateStringLength(
  value: string | null | undefined, 
  fieldName: string, 
  min?: number, 
  max?: number
): string | null {
  if (!value) return null
  
  const length = value.length
  if (min !== undefined && length < min) {
    return `${fieldName}至少需要${min}个字符`
  }
  if (max !== undefined && length > max) {
    return `${fieldName}最多允许${max}个字符`
  }
  return null
}

/**
 * 验证数字范围
 */
export function validateNumberRange(
  value: number | null | undefined,
  fieldName: string,
  min?: number,
  max?: number
): string | null {
  if (value === null || value === undefined) return null
  
  if (!isValidNumber(value)) {
    return `${fieldName}必须是有效数字`
  }
  
  if (min !== undefined && value < min) {
    return `${fieldName}不能小于${min}`
  }
  if (max !== undefined && value > max) {
    return `${fieldName}不能大于${max}`
  }
  return null
}

/**
 * 验证邮箱格式
 */
export function validateEmail(value: string | null | undefined): string | null {
  if (!value) return null
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return '邮箱格式不正确'
  }
  return null
}

/**
 * 验证手机号格式
 */
export function validatePhone(value: string | null | undefined): string | null {
  if (!value) return null
  
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(value)) {
    return '手机号格式不正确'
  }
  return null
}

/**
 * 清理表单数据，移除空值和无效值
 */
export function cleanFormData<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned: Partial<T> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string' && value.trim() !== '') {
        cleaned[key as keyof T] = value.trim() as T[keyof T]
      } else if (typeof value !== 'string') {
        cleaned[key as keyof T] = value
      }
    }
  }
  
  return cleaned
}

/**
 * 格式化表单错误信息
 */
export function formatFormErrors(errors: Record<string, string[]>): string[] {
  const messages: string[] = []
  
  for (const [field, fieldErrors] of Object.entries(errors)) {
    for (const error of fieldErrors) {
      messages.push(`${field}: ${error}`)
    }
  }
  
  return messages
}