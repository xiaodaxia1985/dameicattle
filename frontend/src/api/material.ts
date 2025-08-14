import { materialServiceApi } from './microservices'
import type { ApiResponse, PaginatedResponse } from './request'

// 简化类型定义，避免复杂的导入
interface MaterialCategory {
  id: number
  name: string
  description?: string
}

interface Supplier {
  id: number
  name: string
  contact?: string
  phone?: string
  address?: string
}

interface ProductionMaterial {
  id: number
  name: string
  category_id: number
  supplier_id?: number
  unit: string
  price?: number
}

interface Inventory {
  id: number
  material_id: number
  base_id: number
  quantity: number
  unit: string
  min_stock?: number
  max_stock?: number
}

interface InventoryTransaction {
  id: number
  material_id: number
  base_id: number
  type: 'in' | 'out'
  quantity: number
  unit_price?: number
  total_price?: number
  reason?: string
}

interface InventoryAlert {
  id: number
  material_id: number
  base_id: number
  alert_type: string
  message: string
  status: string
}

interface InventoryStatistics {
  total_materials: number
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
}

export const materialApi = {
  // 物资分类管理
  async getCategories(): Promise<ApiResponse<MaterialCategory[]>> {
    try {
      const response = await materialServiceApi.get('/categories')
      console.log('物资分类API响应:', response)
      
      // 使用 quickFix 工具进行数据处理
      const { ensureArray, safeGet } = await import('@/utils/quickFix')
      
      // 确保返回正确的数据结构
      const categories = ensureArray(safeGet(response, 'data', []))
      return { ...response, data: categories }
    } catch (error) {
      console.error('获取物资分类失败:', error)
      // 使用 quickFix 工具处理错误
      const { handleApiError } = await import('@/utils/quickFix')
      throw new Error(handleApiError(error, '获取物资分类失败'))
    }
  },

  async createCategory(data: any): Promise<ApiResponse<MaterialCategory>> {
    const response = await materialServiceApi.post('/categories', data)
    return response
  },

  async updateCategory(id: number, data: any): Promise<ApiResponse<MaterialCategory>> {
    const response = await materialServiceApi.update('/categories', id, data)
    return response
  },

  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    const response = await materialServiceApi.remove('/categories', id)
    return response
  },

  // 供应商管理
  async getSuppliers(params: any = {}): Promise<PaginatedResponse<Supplier[]>> {
    const response = await materialServiceApi.get('/suppliers', params)
    return response
  },

  async createSupplier(data: any): Promise<ApiResponse<Supplier>> {
    const response = await materialServiceApi.post('/suppliers', data)
    return response
  },

  async updateSupplier(id: number, data: any): Promise<ApiResponse<Supplier>> {
    const response = await materialServiceApi.update('/suppliers', id, data)
    return response
  },

  async deleteSupplier(id: number): Promise<ApiResponse<void>> {
    const response = await materialServiceApi.remove('/suppliers', id)
    return response
  },

  // 生产物资管理
  async getProductionMaterials(params: any = {}): Promise<PaginatedResponse<ProductionMaterial[]>> {
    console.log('🔍 materialApi.getProductionMaterials 调用参数:', params)
    
    const response = await materialServiceApi.getMaterials(params)
    console.log('📥 materialServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    let materials = []
    let total = 0
    let page = 1
    let limit = 20
    
    // 处理不同的数据结构
    if (Array.isArray(responseData)) {
      // 直接是数组
      materials = responseData
      total = materials.length
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // 有data字段且是数组
      materials = responseData.data
      total = responseData.total || responseData.pagination?.total || materials.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.materials && Array.isArray(responseData.materials)) {
      // 有materials字段且是数组
      materials = responseData.materials
      total = responseData.total || responseData.pagination?.total || materials.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.items && Array.isArray(responseData.items)) {
      // 有items字段且是数组
      materials = responseData.items
      total = responseData.total || responseData.pagination?.total || materials.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    }
    
    const result = {
      data: materials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
    
    console.log('✅ materialApi.getProductionMaterials 解析结果:', { 
      materialsCount: materials.length, 
      total, 
      page, 
      limit,
      sampleMaterial: materials[0] || null
    })
    
    return result
  },

  async getProductionMaterialById(id: number): Promise<ApiResponse<ProductionMaterial>> {
    const response = await materialServiceApi.getById('/materials', id)
    return response
  },

  async createProductionMaterial(data: any): Promise<ApiResponse<ProductionMaterial>> {
    const response = await materialServiceApi.createMaterial(data)
    return response
  },

  async updateProductionMaterial(id: number, data: any): Promise<ApiResponse<ProductionMaterial>> {
    const response = await materialServiceApi.update('/materials', id, data)
    return response
  },

  async deleteProductionMaterial(id: number): Promise<ApiResponse<void>> {
    const response = await materialServiceApi.remove('/materials', id)
    return response
  },

  // 库存管理
  async getInventory(params: any = {}): Promise<PaginatedResponse<Inventory[]>> {
    console.log('🔍 materialApi.getInventory 调用参数:', params)
    
    const response = await materialServiceApi.getInventory(params)
    console.log('📥 materialServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    let inventory = []
    let total = 0
    let page = 1
    let limit = 20
    
    // 处理不同的数据结构
    if (Array.isArray(responseData)) {
      // 直接是数组
      inventory = responseData
      total = inventory.length
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // 有data字段且是数组
      inventory = responseData.data
      total = responseData.total || responseData.pagination?.total || inventory.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.inventory && Array.isArray(responseData.inventory)) {
      // 有inventory字段且是数组
      inventory = responseData.inventory
      total = responseData.total || responseData.pagination?.total || inventory.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.items && Array.isArray(responseData.items)) {
      // 有items字段且是数组
      inventory = responseData.items
      total = responseData.total || responseData.pagination?.total || inventory.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    }
    
    const result = {
      data: inventory,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
    
    console.log('✅ materialApi.getInventory 解析结果:', { 
      inventoryCount: inventory.length, 
      total, 
      page, 
      limit,
      sampleInventory: inventory[0] || null
    })
    
    return result
  },

  async getInventoryStatistics(): Promise<ApiResponse<InventoryStatistics>> {
    const response = await materialServiceApi.getMaterialStatistics()
    return response
  },

  async getInventoryByMaterialAndBase(materialId: number, baseId: number): Promise<ApiResponse<Inventory>> {
    const response = await materialServiceApi.get(`/inventory/${materialId}/${baseId}`)
    return response
  },

  // 库存交易记录
  async getInventoryTransactions(params: any = {}): Promise<PaginatedResponse<InventoryTransaction[]>> {
    console.log('🔍 materialApi.getInventoryTransactions 调用参数:', params)
    
    const response = await materialServiceApi.getTransactions(params)
    console.log('📥 materialServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    let transactions = []
    let total = 0
    let page = 1
    let limit = 20
    
    // 处理不同的数据结构
    if (Array.isArray(responseData)) {
      // 直接是数组
      transactions = responseData
      total = transactions.length
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // 有data字段且是数组
      transactions = responseData.data
      total = responseData.total || responseData.pagination?.total || transactions.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.transactions && Array.isArray(responseData.transactions)) {
      // 有transactions字段且是数组
      transactions = responseData.transactions
      total = responseData.total || responseData.pagination?.total || transactions.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.items && Array.isArray(responseData.items)) {
      // 有items字段且是数组
      transactions = responseData.items
      total = responseData.total || responseData.pagination?.total || transactions.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    }
    
    const result = {
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
    
    console.log('✅ materialApi.getInventoryTransactions 解析结果:', { 
      transactionsCount: transactions.length, 
      total, 
      page, 
      limit,
      sampleTransaction: transactions[0] || null
    })
    
    return result
  },

  async createInventoryTransaction(data: any): Promise<ApiResponse<InventoryTransaction>> {
    const response = await materialServiceApi.createTransaction(data)
    return response
  },

  // 库存预警
  async getInventoryAlerts(params: { base_id?: number } = {}): Promise<PaginatedResponse<InventoryAlert[]>> {
    console.log('🔍 materialApi.getInventoryAlerts 调用参数:', params)
    
    const response = await materialServiceApi.getAlerts(params)
    console.log('📥 materialServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    let alerts = []
    let total = 0
    let page = 1
    let limit = 20
    
    // 处理不同的数据结构
    if (Array.isArray(responseData)) {
      // 直接是数组
      alerts = responseData
      total = alerts.length
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // 有data字段且是数组
      alerts = responseData.data
      total = responseData.total || responseData.pagination?.total || alerts.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.alerts && Array.isArray(responseData.alerts)) {
      // 有alerts字段且是数组
      alerts = responseData.alerts
      total = responseData.total || responseData.pagination?.total || alerts.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.items && Array.isArray(responseData.items)) {
      // 有items字段且是数组
      alerts = responseData.items
      total = responseData.total || responseData.pagination?.total || alerts.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    }
    
    const result = {
      data: alerts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }
    
    console.log('✅ materialApi.getInventoryAlerts 解析结果:', { 
      alertsCount: alerts.length, 
      total, 
      page, 
      limit,
      sampleAlert: alerts[0] || null
    })
    
    return result
  },

  async resolveInventoryAlert(id: number): Promise<ApiResponse<void>> {
    const response = await materialServiceApi.resolveAlert(id)
    return response
  }
}