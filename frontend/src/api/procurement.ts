import { procurementServiceApi } from './microservices'
import type { ApiResponse } from './request'
import { adaptPaginatedResponse, adaptSingleResponse, adaptStatisticsResponse } from '@/utils/dataAdapter'

// 采购管理相关类型定义
export interface Supplier {
  id: number
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  business_license?: string
  notes?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface ProcurementOrder {
  id: number
  order_number: string
  supplier_id: number
  base_id: number
  items: ProcurementOrderItem[]
  total_amount: number
  order_date: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  notes?: string
  status: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled'
  created_by: number
  created_at: string
  updated_at: string
  supplier?: Supplier
  creator?: any
}

export interface ProcurementOrderItem {
  material_name: string
  specification?: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string
}

export interface ProcurementStatistics {
  overview: {
    total_orders: number
    total_amount: number
    average_amount: number
  }
  status_statistics: Record<string, number>
  supplier_statistics: Record<string, { count: number; amount: number }>
  monthly_statistics: Record<string, { count: number; amount: number }>
}

export interface ProcurementListParams {
  page?: number
  limit?: number
  status?: string
  supplier_id?: number
  start_date?: string
  end_date?: string
  base_id?: number
}

export interface ProcurementListResponse {
  orders: ProcurementOrder[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface SupplierListParams {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive'
}

export interface SupplierListResponse {
  suppliers: Supplier[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface CreateProcurementOrderRequest {
  supplier_id: number
  base_id: number
  items: ProcurementOrderItem[]
  total_amount: number
  order_date: string
  expected_delivery_date?: string
  notes?: string
}

export interface UpdateProcurementOrderRequest {
  supplier_id?: number
  items?: ProcurementOrderItem[]
  total_amount?: number
  expected_delivery_date?: string
  actual_delivery_date?: string
  notes?: string
  status?: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled'
}

export interface CreateSupplierRequest {
  name: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  business_license?: string
  notes?: string
}

export interface UpdateSupplierRequest {
  name?: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  business_license?: string
  notes?: string
  status?: 'active' | 'inactive'
}

export const procurementApi = {
  // 采购订单管理

  /**
   * 获取采购订单列表
   */
  async getProcurementOrders(params: ProcurementListParams = {}): Promise<{ data: ProcurementListResponse }> {
    const response = await procurementServiceApi.getProcurementOrders(params)
    // 使用数据适配器处理响应
    const adapted = adaptPaginatedResponse<ProcurementOrder>(response, 'orders')
    return { 
      data: {
        orders: adapted.data,
        pagination: {
          total: adapted.pagination.total,
          page: adapted.pagination.page,
          limit: adapted.pagination.limit,
          pages: adapted.pagination.pages || adapted.pagination.totalPages || Math.ceil(adapted.pagination.total / adapted.pagination.limit)
        }
      }
    }
  },

  /**
   * 获取采购订单详情
   */
  async getProcurementOrderById(id: number): Promise<{ data: ProcurementOrder }> {
    const response = await procurementServiceApi.getById('/orders', id)
    return { data: response.data }
  },

  /**
   * 创建采购订单
   */
  async createProcurementOrder(data: CreateProcurementOrderRequest): Promise<{ data: ProcurementOrder }> {
    const response = await procurementServiceApi.createProcurementOrder(data)
    return { data: response.data }
  },

  /**
   * 更新采购订单
   */
  async updateProcurementOrder(id: number, data: UpdateProcurementOrderRequest): Promise<{ data: ProcurementOrder }> {
    const response = await procurementServiceApi.update('/orders', id, data)
    return { data: response.data }
  },

  /**
   * 删除采购订单
   */
  async deleteProcurementOrder(id: number): Promise<void> {
    await procurementServiceApi.remove('/orders', id)
  },

  /**
   * 审批采购订单
   */
  async approveProcurementOrder(id: number): Promise<{ data: ProcurementOrder }> {
    const response = await procurementServiceApi.post(`/orders/${id}/approve`)
    return { data: response.data }
  },

  /**
   * 取消采购订单
   */
  async cancelProcurementOrder(id: number, reason?: string): Promise<{ data: ProcurementOrder }> {
    const response = await procurementServiceApi.post(`/orders/${id}/cancel`, { reason })
    return { data: response.data }
  },

  /**
   * 确认收货
   */
  async confirmDelivery(id: number, data: { actual_delivery_date: string; notes?: string }): Promise<{ data: ProcurementOrder }> {
    const response = await procurementServiceApi.post(`/orders/${id}/delivery`, data)
    return { data: response.data }
  },

  // 供应商管理

  /**
   * 获取供应商列表
   */
  async getSuppliers(params: SupplierListParams = {}): Promise<{ data: SupplierListResponse }> {
    const response = await procurementServiceApi.getSuppliers(params)
    // 使用数据适配器处理响应
    const adapted = adaptPaginatedResponse<Supplier>(response, 'suppliers')
    return { 
      data: {
        suppliers: adapted.data,
        pagination: {
          total: adapted.pagination.total,
          page: adapted.pagination.page,
          limit: adapted.pagination.limit,
          pages: adapted.pagination.pages || adapted.pagination.totalPages || Math.ceil(adapted.pagination.total / adapted.pagination.limit)
        }
      }
    }
  },

  /**
   * 获取供应商详情
   */
  async getSupplierById(id: number): Promise<{ data: Supplier }> {
    const response = await procurementServiceApi.getById('/suppliers', id)
    return { data: response.data }
  },

  /**
   * 创建供应商
   */
  async createSupplier(data: CreateSupplierRequest): Promise<{ data: Supplier }> {
    const response = await procurementServiceApi.createSupplier(data)
    return { data: response.data }
  },

  /**
   * 更新供应商
   */
  async updateSupplier(id: number, data: UpdateSupplierRequest): Promise<{ data: Supplier }> {
    const response = await procurementServiceApi.update('/suppliers', id, data)
    return { data: response.data }
  },

  /**
   * 删除供应商
   */
  async deleteSupplier(id: number): Promise<void> {
    await procurementServiceApi.remove('/suppliers', id)
  },

  /**
   * 启用/禁用供应商
   */
  async toggleSupplierStatus(id: number, status: 'active' | 'inactive'): Promise<{ data: Supplier }> {
    const response = await procurementServiceApi.update('/suppliers', id, { status })
    return { data: response.data }
  },

  // 统计和报表

  /**
   * 获取采购统计信息
   */
  async getProcurementStatistics(params: { base_id?: number; start_date?: string; end_date?: string } = {}): Promise<{ data: ProcurementStatistics }> {
    const response = await procurementServiceApi.getProcurementStatistics(params.base_id)
    return { data: response.data }
  },

  /**
   * 获取供应商评价统计
   */
  async getSupplierStatistics(supplierId: number, params: { start_date?: string; end_date?: string } = {}): Promise<{ data: any }> {
    const response = await procurementServiceApi.get(`/suppliers/${supplierId}/statistics`, params)
    return { data: response.data }
  },

  /**
   * 获取采购趋势分析
   */
  async getProcurementTrend(params: { base_id?: number; start_date?: string; end_date?: string; period?: string } = {}): Promise<{ data: any[] }> {
    const response = await procurementServiceApi.get('/trend', params)
    return { data: response.data }
  },

  /**
   * 导出采购订单
   */
  async exportProcurementOrders(params: ProcurementListParams = {}): Promise<Blob> {
    const response = await procurementServiceApi.get('/orders/export', params, { responseType: 'blob' })
    return response.data
  },

  /**
   * 导出供应商列表
   */
  async exportSuppliers(params: SupplierListParams = {}): Promise<Blob> {
    const response = await procurementServiceApi.get('/suppliers/export', params, { responseType: 'blob' })
    return response.data
  }
}