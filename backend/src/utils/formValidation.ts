/**
 * Form validation and data processing utilities
 */

/**
 * Type guard to check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard to check if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard to check if value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Safely convert value to string
 */
export function safeToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Safely convert value to number
 */
export function safeToNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isValidNumber(num) ? num : null;
}

/**
 * Safely convert value to integer
 */
export function safeToInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  
  const num = typeof value === 'string' ? parseInt(value, 10) : Math.floor(Number(value));
  return isValidNumber(num) ? num : null;
}

/**
 * Safely convert value to boolean
 */
export function safeToBoolean(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}

/**
 * Safely convert value to Date
 */
export function safeToDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  
  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isValidDate(date) ? date : null;
  }
  
  return null;
}

/**
 * Validate required field
 */
export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined) {
    return `${fieldName} is required`;
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} cannot be empty`;
  }
  
  return null;
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string | null | undefined,
  fieldName: string,
  min?: number,
  max?: number
): string | null {
  if (!value) return null;
  
  const length = value.length;
  if (min !== undefined && length < min) {
    return `${fieldName} must be at least ${min} characters long`;
  }
  if (max !== undefined && length > max) {
    return `${fieldName} must be at most ${max} characters long`;
  }
  return null;
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number | null | undefined,
  fieldName: string,
  min?: number,
  max?: number
): string | null {
  if (value === null || value === undefined) return null;
  
  if (!isValidNumber(value)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (min !== undefined && value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  if (max !== undefined && value > max) {
    return `${fieldName} must be at most ${max}`;
  }
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Invalid email format';
  }
  return null;
}

/**
 * Validate phone format (Chinese mobile number)
 */
export function validatePhone(value: string | null | undefined): string | null {
  if (!value) return null;
  
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(value)) {
    return 'Invalid phone number format';
  }
  return null;
}

/**
 * Clean form data by removing null, undefined, and empty string values
 */
export function cleanFormData<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned: Partial<T> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== '') {
          cleaned[key as keyof T] = trimmed as T[keyof T];
        }
      } else {
        cleaned[key as keyof T] = value;
      }
    }
  }
  
  return cleaned;
}

/**
 * Sanitize form data for database insertion
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, 'string' | 'number' | 'integer' | 'boolean' | 'date'>
): Partial<T> {
  const sanitized: Partial<T> = {};
  
  for (const [key, type] of Object.entries(schema)) {
    const value = data[key as keyof T];
    
    switch (type) {
      case 'string':
        const strValue = safeToString(value);
        if (strValue !== '') {
          sanitized[key as keyof T] = strValue as T[keyof T];
        }
        break;
        
      case 'number':
        const numValue = safeToNumber(value);
        if (numValue !== null) {
          sanitized[key as keyof T] = numValue as T[keyof T];
        }
        break;
        
      case 'integer':
        const intValue = safeToInteger(value);
        if (intValue !== null) {
          sanitized[key as keyof T] = intValue as T[keyof T];
        }
        break;
        
      case 'boolean':
        sanitized[key as keyof T] = safeToBoolean(value) as T[keyof T];
        break;
        
      case 'date':
        const dateValue = safeToDate(value);
        if (dateValue !== null) {
          sanitized[key as keyof T] = dateValue as T[keyof T];
        }
        break;
    }
  }
  
  return sanitized;
}

/**
 * Validate form data against schema
 */
export function validateFormData<T extends Record<string, any>>(
  data: T,
  validationRules: Record<keyof T, {
    required?: boolean;
    type?: 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'email' | 'phone';
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  }>
): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  
  for (const [field, rules] of Object.entries(validationRules)) {
    const fieldErrors: string[] = [];
    const value = data[field as keyof T];
    
    // Check required
    if (rules.required) {
      const requiredError = validateRequired(value, field);
      if (requiredError) {
        fieldErrors.push(requiredError);
        continue; // Skip other validations if required check fails
      }
    }
    
    // Skip other validations if value is empty and not required
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    // Type-specific validations
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          fieldErrors.push(`${field} must be a string`);
        } else {
          const lengthError = validateStringLength(value, field, rules.minLength, rules.maxLength);
          if (lengthError) fieldErrors.push(lengthError);
        }
        break;
        
      case 'number':
      case 'integer':
        const numValue = safeToNumber(value);
        if (numValue === null) {
          fieldErrors.push(`${field} must be a valid number`);
        } else {
          const rangeError = validateNumberRange(numValue, field, rules.min, rules.max);
          if (rangeError) fieldErrors.push(rangeError);
          
          if (rules.type === 'integer' && !Number.isInteger(numValue)) {
            fieldErrors.push(`${field} must be an integer`);
          }
        }
        break;
        
      case 'email':
        const emailError = validateEmail(safeToString(value));
        if (emailError) fieldErrors.push(emailError);
        break;
        
      case 'phone':
        const phoneError = validatePhone(safeToString(value));
        if (phoneError) fieldErrors.push(phoneError);
        break;
        
      case 'date':
        const dateValue = safeToDate(value);
        if (dateValue === null) {
          fieldErrors.push(`${field} must be a valid date`);
        }
        break;
    }
    
    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
      if (!rules.pattern.test(value)) {
        fieldErrors.push(`${field} format is invalid`);
      }
    }
    
    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        fieldErrors.push(customError);
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Format validation errors for API response
 */
export function formatValidationErrors(errors: Record<string, string[]>): Array<{
  field: string;
  message: string;
}> {
  const formatted: Array<{ field: string; message: string }> = [];
  
  for (const [field, fieldErrors] of Object.entries(errors)) {
    for (const error of fieldErrors) {
      formatted.push({ field, message: error });
    }
  }
  
  return formatted;
}