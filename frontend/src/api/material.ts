import { materialServiceApi } from './microservices'
import type { ApiResponse, PaginatedResponse } from './request'
import { adaptPaginatedResponse, adaptSingleResponse, adaptStatisticsResponse } from '@/utils/dataAdapter'

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
    const response = await materialServiceApi.get('/categories')
    return response
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
    const response = await materialServiceApi.getMaterials(params)
    // 使用数据适配器处理响应
    const adapted = adaptPaginatedResponse<ProductionMaterial>(response, 'materials')
    return {
      data: adapted.data,
      pagination: {
        total: adapted.pagination.total,
        page: adapted.pagination.page,
        limit: adapted.pagination.limit,
        totalPages: adapted.pagination.totalPages || adapted.pagination.pages
      }
    }
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
    const response = await materialServiceApi.getInventory(params)
    // 使用数据适配器处理响应
    const adapted = adaptPaginatedResponse<Inventory>(response, 'inventory')
    return {
      data: adapted.data,
      pagination: {
        total: adapted.pagination.total,
        page: adapted.pagination.page,
        limit: adapted.pagination.limit,
        totalPages: adapted.pagination.totalPages || adapted.pagination.pages
      }
    }
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
    const response = await materialServiceApi.getTransactions(params)
    return response
  },

  async createInventoryTransaction(data: any): Promise<ApiResponse<InventoryTransaction>> {
    const response = await materialServiceApi.createTransaction(data)
    return response
  },

  // 库存预警
  async getInventoryAlerts(params: { base_id?: number } = {}): Promise<PaginatedResponse<InventoryAlert[]>> {
    const response = await materialServiceApi.getAlerts(params)
    return response
  },

  async resolveInventoryAlert(id: number): Promise<ApiResponse<void>> {
    const response = await materialServiceApi.resolveAlert(id)
    return response
  }
}