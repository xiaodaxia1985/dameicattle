/**
 * 快速修复前端数据解析问题
 * 提供临时的数据处理解决方案
 */

// 安全的数据访问函数
export function safeGet(obj: any, path: string, defaultValue: any = undefined): any {
  if (!obj || typeof obj !== 'object') {
    return defaultValue
  }

  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current == null || typeof current !== 'object' || !(key in current)) {
      return defaultValue
    }
    current = current[key]
  }

  return current !== undefined ? current : defaultValue
}

// 确保返回数组
export function ensureArray<T>(value: any): T[] {
  if (Array.isArray(value)) {
    return value
  }
  if (value === null || value === undefined) {
    return []
  }
  return [value]
}

// 确保返回数字
export function ensureNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value
  }
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

// 确保返回字符串
export function ensureString(value: any, defaultValue: string = ''): string {
  if (typeof value === 'string') {
    return value
  }
  if (value === null || value === undefined) {
    return defaultValue
  }
  return String(value)
}

// 标准化API响应
export function normalizeApiResponse(response: any) {
  if (!response) {
    return { data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } }
  }

  // 如果响应有success字段且为true，使用data字段
  if (response.success && response.data) {
    return response.data
  }

  // 直接返回响应
  return response
}

// 标准化列表响应
export function normalizeListResponse<T>(response: any, dataKey: string = 'data'): {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
} {
  const normalized = normalizeApiResponse(response)
  
  let items: T[] = []
  let pagination = {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  }

  // 尝试多种数据结构
  if (Array.isArray(normalized)) {
    items = normalized
    pagination.total = items.length
    pagination.totalPages = 1
  } else if (normalized && typeof normalized === 'object') {
    // 检查特定的数据字段
    if (Array.isArray(normalized[dataKey])) {
      items = normalized[dataKey]
    } else if (Array.isArray(normalized.data)) {
      items = normalized.data
    } else if (Array.isArray(normalized.items)) {
      items = normalized.items
    } else if (Array.isArray(normalized.records)) {
      items = normalized.records
    }

    // 获取分页信息
    if (normalized.pagination) {
      pagination = {
        total: ensureNumber(normalized.pagination.total, items.length),
        page: ensureNumber(normalized.pagination.page, 1),
        limit: ensureNumber(normalized.pagination.limit, 20),
        totalPages: ensureNumber(normalized.pagination.totalPages || normalized.pagination.pages, Math.ceil(ensureNumber(normalized.pagination.total, items.length) / ensureNumber(normalized.pagination.limit, 20)))
      }
    } else {
      pagination.total = items.length
      pagination.totalPages = 1
    }
  }

  return { data: items, pagination }
}

// 安全的API调用包装器
export async function safeApiCall<T>(
  apiCall: () => Promise<any>,
  fallbackValue: T
): Promise<T> {
  try {
    const response = await apiCall()
    return response || fallbackValue
  } catch (error) {
    console.error('API调用失败:', error)
    return fallbackValue
  }
}

// 修复牛只数据
export function fixCattleData(cattle: any) {
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
    base: cattle.base_info || cattle.base || null,
    barn: cattle.barn_info || cattle.barn || null,
    created_at: ensureString(cattle.createdAt || cattle.created_at, ''),
    updated_at: ensureString(cattle.updatedAt || cattle.updated_at, '')
  }
}

// 修复基地数据
export function fixBaseData(base: any) {
  if (!base || typeof base !== 'object') {
    return null
  }

  return {
    id: ensureNumber(base.id, 0),
    name: ensureString(base.name, ''),
    code: ensureString(base.code, ''),
    address: ensureString(base.address, ''),
    latitude: base.latitude ? ensureNumber(base.latitude, 0) : null,
    longitude: base.longitude ? ensureNumber(base.longitude, 0) : null,
    area: base.area ? ensureNumber(base.area, 0) : null,
    manager_id: base.manager_id ? ensureNumber(base.manager_id, 0) : null,
    manager: base.manager || null,
    created_at: ensureString(base.created_at, ''),
    updated_at: ensureString(base.updated_at, '')
  }
}

// 修复订单数据
export function fixOrderData(order: any) {
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
    customer: order.customer || null,
    supplier: order.supplier || null,
    creator: order.creator || null,
    created_at: ensureString(order.created_at || order.createdAt, ''),
    updated_at: ensureString(order.updated_at || order.updatedAt, '')
  }
}

// 全局数据修复函数
export function fixDataIssues() {
  console.log('开始修复前端数据问题...')
  
  // 清理localStorage中的损坏数据
  const localStorageKeys = Object.keys(localStorage)
  let fixedCount = 0

  localStorageKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      if (value) {
        JSON.parse(value)
      }
    } catch (error) {
      console.log('修复损坏的localStorage项:', key)
      localStorage.removeItem(key)
      fixedCount++
    }
  })

  // 清理sessionStorage中的损坏数据
  const sessionStorageKeys = Object.keys(sessionStorage)
  sessionStorageKeys.forEach(key => {
    try {
      const value = sessionStorage.getItem(key)
      if (value) {
        JSON.parse(value)
      }
    } catch (error) {
      console.log('修复损坏的sessionStorage项:', key)
      sessionStorage.removeItem(key)
      fixedCount++
    }
  })

  console.log(`数据修复完成，共修复 ${fixedCount} 个问题`)
  return fixedCount
}

// 测试API连接
export async function testApiConnections() {
  const endpoints = [
    '/api/v1/cattle/cattle?page=1&limit=5',
    '/api/v1/base/bases?page=1&limit=5',
    '/api/v1/sales/orders?page=1&limit=5',
    '/api/v1/procurement/orders?page=1&limit=5'
  ]
  
  const results = []
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint)
      const data = await response.json()
      results.push({
        endpoint,
        success: true,
        data: data,
        structure: Object.keys(data)
      })
      console.log('API测试成功:', endpoint, '数据结构:', Object.keys(data))
    } catch (error) {
      results.push({
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      })
      console.error('API测试失败:', endpoint, error)
    }
  }
  
  return results
}

export default {
  safeGet,
  ensureArray,
  ensureNumber,
  ensureString,
  normalizeApiResponse,
  normalizeListResponse,
  safeApiCall,
  fixCattleData,
  fixBaseData,
  fixOrderData,
  fixDataIssues,
  testApiConnections
}