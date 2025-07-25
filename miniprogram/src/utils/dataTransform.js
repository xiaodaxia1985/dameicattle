/**
 * Miniprogram Data Transformation Utilities
 * Handles request/response transformations specific to miniprogram environment
 */

// Data transformation utilities
export const dataTransform = {
  /**
   * Transform request data for miniprogram
   * @param {Object} data - Request data
   * @param {Object} options - Transformation options
   * @returns {Object} Transformed data
   */
  transformRequest(data, options = {}) {
    if (!data || typeof data !== 'object') {
      return data
    }

    const transformed = { ...data }

    // Add miniprogram-specific fields
    if (options.addMiniprogramInfo) {
      const systemInfo = uni.getSystemInfoSync()
      transformed._miniprogram = {
        platform: 'miniprogram',
        version: systemInfo.version,
        model: systemInfo.model,
        system: systemInfo.system,
        timestamp: Date.now()
      }
    }

    // Add user context if available
    if (options.addUserContext) {
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo) {
        transformed._user = {
          id: userInfo.id,
          base_id: userInfo.base_id
        }
      }
    }

    // Transform date fields
    if (options.transformDates) {
      this.transformDates(transformed)
    }

    // Remove empty fields
    if (options.removeEmpty) {
      this.removeEmptyFields(transformed)
    }

    return transformed
  },

  /**
   * Transform response data for miniprogram
   * @param {Object} response - Response data
   * @param {Object} options - Transformation options
   * @returns {Object} Transformed response
   */
  transformResponse(response, options = {}) {
    if (!response || typeof response !== 'object') {
      return response
    }

    const transformed = { ...response }

    // Ensure standard response format
    if (!transformed.success && transformed.success !== false) {
      transformed.success = true
    }

    // Transform data field
    if (transformed.data) {
      transformed.data = this.transformResponseData(transformed.data, options)
    }

    // Transform pagination
    if (transformed.pagination) {
      transformed.pagination = this.transformPagination(transformed.pagination)
    }

    // Transform errors
    if (transformed.errors) {
      transformed.errors = this.transformErrors(transformed.errors)
    }

    return transformed
  },

  /**
   * Transform response data
   * @param {*} data - Response data
   * @param {Object} options - Transformation options
   * @returns {*} Transformed data
   */
  transformResponseData(data, options = {}) {
    if (Array.isArray(data)) {
      return data.map(item => this.transformDataItem(item, options))
    } else if (data && typeof data === 'object') {
      return this.transformDataItem(data, options)
    }
    return data
  },

  /**
   * Transform individual data item
   * @param {Object} item - Data item
   * @param {Object} options - Transformation options
   * @returns {Object} Transformed item
   */
  transformDataItem(item, options = {}) {
    if (!item || typeof item !== 'object') {
      return item
    }

    const transformed = { ...item }

    // Transform date strings to Date objects
    if (options.parseDates) {
      this.parseDateFields(transformed)
    }

    // Transform image URLs for miniprogram
    if (options.transformImages) {
      this.transformImageUrls(transformed)
    }

    // Add safe access helpers
    if (options.addSafeAccess) {
      this.addSafeAccessHelpers(transformed)
    }

    return transformed
  },

  /**
   * Transform date fields to ISO strings
   * @param {Object} obj - Object to transform
   */
  transformDates(obj) {
    const dateFields = ['created_at', 'updated_at', 'deleted_at', 'date', 'time', 'timestamp']
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        
        if (value instanceof Date) {
          obj[key] = value.toISOString()
        } else if (typeof value === 'string' && dateFields.includes(key)) {
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            obj[key] = date.toISOString()
          }
        } else if (value && typeof value === 'object') {
          this.transformDates(value)
        }
      }
    }
  },

  /**
   * Parse date fields from strings to Date objects
   * @param {Object} obj - Object to transform
   */
  parseDateFields(obj) {
    const dateFields = ['created_at', 'updated_at', 'deleted_at', 'date', 'time', 'timestamp']
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        
        if (typeof value === 'string' && dateFields.includes(key)) {
          const date = new Date(value)
          if (!isNaN(date.getTime())) {
            obj[key] = date
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          this.parseDateFields(value)
        }
      }
    }
  },

  /**
   * Transform image URLs for miniprogram
   * @param {Object} obj - Object to transform
   */
  transformImageUrls(obj) {
    const imageFields = ['image', 'avatar', 'photo', 'picture', 'thumbnail', 'cover']
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        
        if (typeof value === 'string' && (imageFields.includes(key) || key.includes('image') || key.includes('photo'))) {
          // Ensure absolute URL
          if (value && !value.startsWith('http') && !value.startsWith('data:')) {
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? 'https://api.cattle-management.com' 
              : 'http://localhost:3000'
            obj[key] = `${baseUrl}${value.startsWith('/') ? '' : '/'}${value}`
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          this.transformImageUrls(value)
        }
      }
    }
  },

  /**
   * Add safe access helpers to object
   * @param {Object} obj - Object to enhance
   */
  addSafeAccessHelpers(obj) {
    if (!obj || typeof obj !== 'object') {
      return
    }

    // Add safe get method
    Object.defineProperty(obj, 'safeGet', {
      value: function(path, defaultValue = null) {
        return path.split('.').reduce((current, key) => {
          return current && current[key] !== undefined ? current[key] : defaultValue
        }, this)
      },
      enumerable: false,
      writable: false
    })

    // Add safe string method
    Object.defineProperty(obj, 'safeString', {
      value: function(path, defaultValue = '') {
        const value = this.safeGet(path, defaultValue)
        return value !== null && value !== undefined ? String(value) : defaultValue
      },
      enumerable: false,
      writable: false
    })

    // Add safe number method
    Object.defineProperty(obj, 'safeNumber', {
      value: function(path, defaultValue = 0) {
        const value = this.safeGet(path, defaultValue)
        const num = Number(value)
        return isNaN(num) ? defaultValue : num
      },
      enumerable: false,
      writable: false
    })
  },

  /**
   * Remove empty fields from object
   * @param {Object} obj - Object to clean
   */
  removeEmptyFields(obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        
        if (value === null || value === undefined || value === '') {
          delete obj[key]
        } else if (Array.isArray(value) && value.length === 0) {
          delete obj[key]
        } else if (typeof value === 'object' && Object.keys(value).length === 0) {
          delete obj[key]
        }
      }
    }
  },

  /**
   * Transform pagination data
   * @param {Object} pagination - Pagination data
   * @returns {Object} Transformed pagination
   */
  transformPagination(pagination) {
    if (!pagination || typeof pagination !== 'object') {
      return pagination
    }

    return {
      total: Number(pagination.total) || 0,
      page: Number(pagination.page) || 1,
      limit: Number(pagination.limit) || 10,
      totalPages: Number(pagination.totalPages) || Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasNext: pagination.hasNext !== undefined ? Boolean(pagination.hasNext) : (pagination.page || 1) < (pagination.totalPages || 1),
      hasPrev: pagination.hasPrev !== undefined ? Boolean(pagination.hasPrev) : (pagination.page || 1) > 1
    }
  },

  /**
   * Transform error data
   * @param {Array|Object} errors - Error data
   * @returns {Array} Transformed errors
   */
  transformErrors(errors) {
    if (!errors) {
      return []
    }

    if (Array.isArray(errors)) {
      return errors.map(error => this.transformError(error))
    }

    return [this.transformError(errors)]
  },

  /**
   * Transform individual error
   * @param {Object|string} error - Error data
   * @returns {Object} Transformed error
   */
  transformError(error) {
    if (typeof error === 'string') {
      return {
        message: error,
        field: null,
        code: null
      }
    }

    return {
      message: error.message || '未知错误',
      field: error.field || null,
      code: error.code || null
    }
  }
}

// List data transformation utilities
export const listTransform = {
  /**
   * Transform list response to standardized format
   * @param {Object} response - API response
   * @returns {Object} Standardized list response
   */
  transformListResponse(response) {
    if (!response || typeof response !== 'object') {
      return {
        data: [],
        pagination: null,
        success: false
      }
    }

    // Handle different response formats
    let data = []
    let pagination = null

    if (Array.isArray(response)) {
      // Direct array response
      data = response
    } else if (response.data) {
      // Standard format with data field
      data = Array.isArray(response.data) ? response.data : []
      pagination = response.pagination || null
    } else if (response.items) {
      // Alternative format with items field
      data = Array.isArray(response.items) ? response.items : []
      pagination = response.pagination || response.meta || null
    }

    return {
      data: data.map(item => dataTransform.transformDataItem(item, {
        parseDates: true,
        transformImages: true,
        addSafeAccess: true
      })),
      pagination: pagination ? dataTransform.transformPagination(pagination) : null,
      success: response.success !== false
    }
  },

  /**
   * Merge list data for pagination
   * @param {Array} existingData - Existing data
   * @param {Array} newData - New data to merge
   * @param {string} keyField - Key field for deduplication
   * @returns {Array} Merged data
   */
  mergeListData(existingData = [], newData = [], keyField = 'id') {
    if (!Array.isArray(existingData) || !Array.isArray(newData)) {
      return newData || []
    }

    const existingKeys = new Set(existingData.map(item => item[keyField]))
    const uniqueNewData = newData.filter(item => !existingKeys.has(item[keyField]))
    
    return [...existingData, ...uniqueNewData]
  },

  /**
   * Sort list data
   * @param {Array} data - Data to sort
   * @param {string} field - Field to sort by
   * @param {string} order - Sort order ('asc' or 'desc')
   * @returns {Array} Sorted data
   */
  sortListData(data, field, order = 'asc') {
    if (!Array.isArray(data)) {
      return []
    }

    return [...data].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]

      if (aValue === bValue) return 0

      const comparison = aValue > bValue ? 1 : -1
      return order === 'desc' ? -comparison : comparison
    })
  },

  /**
   * Filter list data
   * @param {Array} data - Data to filter
   * @param {Function|Object} filter - Filter function or filter object
   * @returns {Array} Filtered data
   */
  filterListData(data, filter) {
    if (!Array.isArray(data)) {
      return []
    }

    if (typeof filter === 'function') {
      return data.filter(filter)
    }

    if (typeof filter === 'object' && filter !== null) {
      return data.filter(item => {
        return Object.keys(filter).every(key => {
          const filterValue = filter[key]
          const itemValue = item[key]

          if (filterValue === null || filterValue === undefined) {
            return true
          }

          if (typeof filterValue === 'string' && typeof itemValue === 'string') {
            return itemValue.toLowerCase().includes(filterValue.toLowerCase())
          }

          return itemValue === filterValue
        })
      })
    }

    return data
  }
}

// Form data transformation utilities
export const formTransform = {
  /**
   * Transform form data for submission
   * @param {Object} formData - Form data
   * @param {Object} options - Transformation options
   * @returns {Object} Transformed form data
   */
  transformFormData(formData, options = {}) {
    if (!formData || typeof formData !== 'object') {
      return formData
    }

    const transformed = { ...formData }

    // Remove empty fields
    if (options.removeEmpty !== false) {
      dataTransform.removeEmptyFields(transformed)
    }

    // Transform dates
    if (options.transformDates !== false) {
      dataTransform.transformDates(transformed)
    }

    // Add form metadata
    if (options.addMetadata) {
      transformed._form = {
        submitted_at: new Date().toISOString(),
        platform: 'miniprogram'
      }
    }

    return transformed
  },

  /**
   * Validate form data
   * @param {Object} formData - Form data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result
   */
  validateFormData(formData, rules) {
    const errors = []

    for (const field in rules) {
      const rule = rules[field]
      const value = formData[field]

      if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push({
          field,
          message: rule.message || `${field}是必填字段`
        })
        continue
      }

      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field,
          message: rule.message || `${field}格式不正确`
        })
      }

      if (value && rule.minLength && value.length < rule.minLength) {
        errors.push({
          field,
          message: rule.message || `${field}长度不能少于${rule.minLength}个字符`
        })
      }

      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field,
          message: rule.message || `${field}长度不能超过${rule.maxLength}个字符`
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

export default {
  dataTransform,
  listTransform,
  formTransform
}