/**
 * 数据验证和安全处理工具
 * 专门用于处理API返回的空数据、null值、undefined值等情况
 */

import { safeGet, ensureArray, ensureNumber, ensureString, ensureBoolean } from './safeAccess'

/**
 * 验证并标准化API响应数据
 */
export function validateApiResponse<T = any>(response: any, defaultValue?: T): T {
  if (!response) {
    return defaultValue as T
  }

  // 如果响应有data字段，优先使用data
  if (response.data !== undefined) {
    return response.data ?? defaultValue
  }

  return response ?? defaultValue
}

/**
 * 验证并标准化分页数据
 */
export function validatePaginationData(data: any) {
  const items = ensureArray(safeGet(data, 'data', []))
  const pagination = safeGet(data, 'pagination', {})
  
  return {
    data: items,
    pagination: {
      total: ensureNumber(pagination.total, 0),
      page: ensureNumber(pagination.page, 1),
      limit: ensureNumber(pagination.limit, 20),
      totalPages: ensureNumber(pagination.totalPages, Math.ceil(ensureNumber(pagination.total, 0) / ensureNumber(pagination.limit, 20)))
    }
  }
}

/**
 * 验证并标准化分页响应
 */
export function validatePaginatedResponse<T = any>(response: any): { data: T[]; pagination: any } {
  if (!response) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      }
    }
  }

  // 如果响应直接包含分页信息
  if (response.data && response.pagination) {
    return {
      data: ensureArray(response.data),
      pagination: {
        total: ensureNumber(response.pagination.total, 0),
        page: ensureNumber(response.pagination.page, 1),
        limit: ensureNumber(response.pagination.limit, 20),
        totalPages: ensureNumber(response.pagination.totalPages, 0)
      }
    }
  }

  // 如果响应的data字段包含分页信息
  if (response.data && response.data.data && response.data.pagination) {
    return {
      data: ensureArray(response.data.data),
      pagination: {
        total: ensureNumber(response.data.pagination.total, 0),
        page: ensureNumber(response.data.pagination.page, 1),
        limit: ensureNumber(response.data.pagination.limit, 20),
        totalPages: ensureNumber(response.data.pagination.totalPages, 0)
      }
    }
  }

  // 如果只是简单的数组响应，创建默认分页信息
  const items = validateListData<T>(response)
  return {
    data: items,
    pagination: {
      total: items.length,
      page: 1,
      limit: items.length || 20,
      totalPages: 1
    }
  }
}

/**
 * 标准化列表响应，处理分页和非分页情况
 */
export function normalizeListResponse<T = any>(response: any): { data: T[]; pagination: any } {
  return validatePaginatedResponse<T>(response)
}

/**
 * 验证并标准化列表数据
 */
export function validateListData<T = any>(data: any, defaultValue: T[] = []): T[] {
  // 如果data直接是数组
  if (Array.isArray(data)) {
    return data
  }

  // 如果data有items字段
  if (data && Array.isArray(data.items)) {
    return data.items
  }

  // 如果data有data字段且是数组
  if (data && Array.isArray(data.data)) {
    return data.data
  }

  // 如果response有data字段
  if (data && data.data && Array.isArray(data.data.data)) {
    return data.data.data
  }

  return defaultValue
}

/**
 * 验证并标准化用户数据
 */
export function validateUserData(user: any) {
  if (!user || typeof user !== 'object') {
    return null
  }

  return {
    id: ensureNumber(user.id, 0),
    username: ensureString(user.username, ''),
    real_name: ensureString(user.real_name, ''),
    email: ensureString(user.email, ''),
    phone: ensureString(user.phone, ''),
    status: ensureString(user.status, 'active'),
    role: user.role ? {
      id: ensureNumber(user.role.id, 0),
      name: ensureString(user.role.name, ''),
      code: ensureString(user.role.code, '')
    } : null,
    base: user.base ? {
      id: ensureNumber(user.base.id, 0),
      name: ensureString(user.base.name, ''),
      code: ensureString(user.base.code, '')
    } : null,
    role_id: ensureNumber(user.role_id, 0),
    base_id: user.base_id ? ensureNumber(user.base_id, 0) : undefined,
    last_login_at: user.last_login_at || null,
    created_at: ensureString(user.created_at, ''),
    updated_at: ensureString(user.updated_at, '')
  }
}

/**
 * 验证并标准化牛只数据
 */
export function validateCattleData(cattle: any) {
  if (!cattle || typeof cattle !== 'object') {
    return null
  }

  return {
    id: ensureNumber(cattle.id, 0),
    ear_tag: ensureString(cattle.ear_tag, ''),
    breed: ensureString(cattle.breed, ''),
    gender: cattle.gender === 'female' ? 'female' : 'male',
    birth_date: cattle.birth_date || null,
    weight: cattle.weight ? ensureNumber(cattle.weight, 0) : null,
    health_status: ensureString(cattle.health_status, 'healthy'),
    base_id: ensureNumber(cattle.base_id, 0),
    barn_id: cattle.barn_id ? ensureNumber(cattle.barn_id, 0) : null,
    status: ensureString(cattle.status, 'active'),
    age_months: cattle.age_months ? ensureNumber(cattle.age_months, 0) : null,
    age_days: cattle.age_days ? ensureNumber(cattle.age_days, 0) : null,
    base: cattle.base ? {
      id: ensureNumber(cattle.base.id, 0),
      name: ensureString(cattle.base.name, ''),
      code: ensureString(cattle.base.code, '')
    } : null,
    barn: cattle.barn ? {
      id: ensureNumber(cattle.barn.id, 0),
      name: ensureString(cattle.barn.name, ''),
      code: ensureString(cattle.barn.code, '')
    } : null,
    created_at: ensureString(cattle.created_at, ''),
    updated_at: ensureString(cattle.updated_at, '')
  }
}

/**
 * 验证并标准化新闻数据
 */
export function validateNewsData(news: any) {
  if (!news || typeof news !== 'object') {
    return null
  }

  return {
    id: ensureNumber(news.id, 0),
    title: ensureString(news.title, ''),
    subtitle: news.subtitle ? ensureString(news.subtitle, '') : null,
    content: ensureString(news.content, ''),
    summary: news.summary ? ensureString(news.summary, '') : null,
    status: ensureString(news.status, 'draft'),
    categoryId: news.categoryId ? ensureNumber(news.categoryId, 0) : null,
    category: news.category ? {
      id: ensureNumber(news.category.id, 0),
      name: ensureString(news.category.name, ''),
      code: ensureString(news.category.code, '')
    } : null,
    authorId: news.authorId ? ensureNumber(news.authorId, 0) : null,
    authorName: news.authorName ? ensureString(news.authorName, '') : null,
    isFeatured: ensureBoolean(news.isFeatured, false),
    isTop: ensureBoolean(news.isTop, false),
    viewCount: ensureNumber(news.viewCount, 0),
    likeCount: ensureNumber(news.likeCount, 0),
    commentCount: ensureNumber(news.commentCount, 0),
    publishTime: news.publishTime || null,
    created_at: ensureString(news.created_at || news.createdAt, ''),
    updated_at: ensureString(news.updated_at || news.updatedAt, '')
  }
}

/**
 * 验证并标准化订单数据
 */
export function validateOrderData(order: any) {
  if (!order || typeof order !== 'object') {
    return null
  }

  return {
    id: ensureNumber(order.id, 0),
    order_number: ensureString(order.order_number || order.orderNumber, ''),
    total_amount: ensureNumber(order.total_amount || order.totalAmount, 0),
    status: ensureString(order.status, 'pending'),
    payment_status: ensureString(order.payment_status || order.paymentStatus, 'unpaid'),
    order_date: order.order_date || order.orderDate || null,
    delivery_date: order.delivery_date || order.expectedDeliveryDate || null,
    customer: order.customer ? {
      id: ensureNumber(order.customer.id, 0),
      name: ensureString(order.customer.name, '')
    } : null,
    creator: order.creator ? {
      id: ensureNumber(order.creator.id, 0),
      real_name: ensureString(order.creator.real_name, '')
    } : null,
    created_at: ensureString(order.created_at || order.createdAt, ''),
    updated_at: ensureString(order.updated_at || order.updatedAt, '')
  }
}

/**
 * 验证并标准化统计数据
 */
export function validateStatisticsData(stats: any) {
  if (!stats || typeof stats !== 'object') {
    return {
      total: 0,
      healthy: 0,
      sick: 0,
      treatment: 0,
      totalCattle: 0,
      healthRate: 0,
      monthlyRevenue: 0,
      pendingTasks: 0
    }
  }

  return {
    total: ensureNumber(stats.total || stats.totalCattle, 0),
    healthy: ensureNumber(stats.healthy || stats.healthyCount, 0),
    sick: ensureNumber(stats.sick || stats.sickCount, 0),
    treatment: ensureNumber(stats.treatment || stats.treatmentCount, 0),
    totalCattle: ensureNumber(stats.totalCattle || stats.total, 0),
    healthRate: ensureNumber(stats.healthRate, 0),
    monthlyRevenue: ensureNumber(stats.monthlyRevenue, 0),
    pendingTasks: ensureNumber(stats.pendingTasks, 0)
  }
}

/**
 * 验证并标准化基地数据
 */
export function validateBaseData(base: any) {
  if (!base || typeof base !== 'object') {
    return null
  }

  return {
    id: ensureNumber(base.id, 0),
    name: ensureString(base.name, ''),
    code: ensureString(base.code, ''),
    address: ensureString(base.address, ''),
    description: base.description ? ensureString(base.description, '') : null,
    created_at: ensureString(base.created_at, ''),
    updated_at: ensureString(base.updated_at, '')
  }
}

/**
 * 验证并标准化牛棚数据
 */
export function validateBarnData(barn: any) {
  if (!barn || typeof barn !== 'object') {
    return null
  }

  return {
    id: ensureNumber(barn.id, 0),
    name: ensureString(barn.name, ''),
    code: ensureString(barn.code, ''),
    barn_type: ensureString(barn.barn_type, ''),
    capacity: ensureNumber(barn.capacity, 0),
    current_count: ensureNumber(barn.current_count, 0),
    base_id: ensureNumber(barn.base_id, 0),
    base: barn.base ? validateBaseData(barn.base) : null,
    description: barn.description ? ensureString(barn.description, '') : null,
    created_at: ensureString(barn.created_at, ''),
    updated_at: ensureString(barn.updated_at, '')
  }
}

/**
 * 验证并标准化设备数据
 */
export function validateEquipmentData(equipment: any) {
  if (!equipment || typeof equipment !== 'object') {
    return null
  }

  return {
    id: ensureNumber(equipment.id, 0),
    code: ensureString(equipment.code, ''),
    name: ensureString(equipment.name, ''),
    brand: ensureString(equipment.brand, ''),
    model: ensureString(equipment.model, ''),
    status: ensureString(equipment.status, 'normal'),
    purchase_date: equipment.purchase_date || null,
    category: equipment.category ? {
      id: ensureNumber(equipment.category.id, 0),
      name: ensureString(equipment.category.name, '')
    } : null,
    base: equipment.base ? validateBaseData(equipment.base) : null,
    barn: equipment.barn ? validateBarnData(equipment.barn) : null,
    created_at: ensureString(equipment.created_at, ''),
    updated_at: ensureString(equipment.updated_at, '')
  }
}

/**
 * 批量验证数据数组
 */
export function validateDataArray<T>(
  data: any[], 
  validator: (item: any) => T | null
): T[] {
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map(validator)
    .filter((item): item is T => item !== null)
}

/**
 * 安全的数据转换函数
 */
export function safeTransform<T, R>(
  data: T,
  transformer: (data: T) => R,
  defaultValue: R
): R {
  try {
    if (data == null) {
      return defaultValue
    }
    return transformer(data)
  } catch (error) {
    console.warn('数据转换失败:', error)
    return defaultValue
  }
}

/**
 * 验证表单数据
 */
export function validateFormData(formData: any, requiredFields: string[] = []): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!formData || typeof formData !== 'object') {
    errors.push('表单数据无效')
    return { isValid: false, errors }
  }

  for (const field of requiredFields) {
    const value = safeGet(formData, field)
    if (value == null || value === '') {
      errors.push(`${field} 是必填字段`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 清理对象中的空值
 */
export function cleanEmptyValues(obj: any): any {
  if (obj == null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanEmptyValues).filter(item => item != null)
  }

  const cleaned: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value != null && value !== '') {
      if (typeof value === 'object') {
        const cleanedValue = cleanEmptyValues(value)
        if (Array.isArray(cleanedValue) ? cleanedValue.length > 0 : Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue
        }
      } else {
        cleaned[key] = value
      }
    }
  }

  return cleaned
}