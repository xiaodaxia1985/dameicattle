import request from './request'
import type { ApiResponse, PaginatedResponse } from './request'
import type {
  MaterialCategory,
  Supplier,
  ProductionMaterial,
  Inventory,
  InventoryTransaction,
  InventoryAlert,
  MaterialListParams,
  InventoryListParams,
  TransactionListParams,
  CreateMaterialCategoryRequest,
  UpdateMaterialCategoryRequest,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  CreateProductionMaterialRequest,
  UpdateProductionMaterialRequest,
  CreateInventoryTransactionRequest,
  InventoryStatistics
} from '@/types/material'

export const materialApi = {
  // 物资分类管理
  getCategories(): Promise<ApiResponse<MaterialCategory[]>> {
    return request.get('/materials/categories')
  },

  createCategory(data: CreateMaterialCategoryRequest): Promise<ApiResponse<MaterialCategory>> {
    return request.post('/materials/categories', data)
  },

  updateCategory(id: number, data: UpdateMaterialCategoryRequest): Promise<ApiResponse<MaterialCategory>> {
    return request.put(`/materials/categories/${id}`, data)
  },

  deleteCategory(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/materials/categories/${id}`)
  },

  // 供应商管理
  getSuppliers(params: MaterialListParams = {}): Promise<PaginatedResponse<Supplier[]>> {
    return request.get('/materials/suppliers', { params })
  },

  createSupplier(data: CreateSupplierRequest): Promise<ApiResponse<Supplier>> {
    return request.post('/materials/suppliers', data)
  },

  updateSupplier(id: number, data: UpdateSupplierRequest): Promise<ApiResponse<Supplier>> {
    return request.put(`/materials/suppliers/${id}`, data)
  },

  deleteSupplier(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/materials/suppliers/${id}`)
  },

  // 生产物资管理
  getProductionMaterials(params: MaterialListParams = {}): Promise<PaginatedResponse<ProductionMaterial[]>> {
    return request.get('/materials/production-materials', { params })
  },

  getProductionMaterialById(id: number): Promise<ApiResponse<ProductionMaterial>> {
    return request.get(`/materials/production-materials/${id}`)
  },

  createProductionMaterial(data: CreateProductionMaterialRequest): Promise<ApiResponse<ProductionMaterial>> {
    return request.post('/materials/production-materials', data)
  },

  updateProductionMaterial(id: number, data: UpdateProductionMaterialRequest): Promise<ApiResponse<ProductionMaterial>> {
    return request.put(`/materials/production-materials/${id}`, data)
  },

  deleteProductionMaterial(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/materials/production-materials/${id}`)
  },

  // 库存管理
  getInventory(params: InventoryListParams = {}): Promise<PaginatedResponse<Inventory[]>> {
    return request.get('/materials/inventory', { params })
  },

  getInventoryStatistics(): Promise<ApiResponse<InventoryStatistics>> {
    return request.get('/materials/inventory/statistics')
  },

  getInventoryByMaterialAndBase(materialId: number, baseId: number): Promise<ApiResponse<Inventory>> {
    return request.get(`/materials/inventory/${materialId}/${baseId}`)
  },

  // 库存交易记录
  getInventoryTransactions(params: TransactionListParams = {}): Promise<PaginatedResponse<InventoryTransaction[]>> {
    return request.get('/materials/inventory/transactions', { params })
  },

  createInventoryTransaction(data: CreateInventoryTransactionRequest): Promise<ApiResponse<InventoryTransaction>> {
    return request.post('/materials/inventory/transactions', data)
  },

  // 库存预警
  getInventoryAlerts(params: { base_id?: number } = {}): Promise<PaginatedResponse<InventoryAlert[]>> {
    return request.get('/materials/inventory/alerts', { params })
  },

  resolveInventoryAlert(id: number): Promise<ApiResponse<void>> {
    return request.put(`/materials/inventory/alerts/${id}/resolve`)
  }
}