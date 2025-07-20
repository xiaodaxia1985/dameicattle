import request from './request'
import type { ApiResponse } from './request'

export interface PurchaseOrder {
  id: string
  orderNumber: string
  supplierId: number
  supplierName: string
  baseId: number
  baseName: string
  orderType: 'cattle' | 'material' | 'equipment'
  totalAmount: number
  taxAmount: number
  discountAmount: number
  status: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled'
  orderDate: string
  expectedDeliveryDate: string
  actualDeliveryDate?: string
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  paymentMethod?: string
  contractNumber?: string
  remark?: string
  createdBy: string
  createdByName: string
  approvedBy?: string
  approvedByName?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: number
  name: string
  contactPerson: string
  phone: string
  email: string
  address: string
  rating: number
  supplierType: string
  businessLicense: string
  taxNumber: string
  bankAccount: string
  creditLimit: number
  paymentTerms: string
  createdAt: string
  updatedAt: string
}

export const purchaseApi = {
  // 获取采购订单列表
  getOrders(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/purchase/orders', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取供应商列表
  getSuppliers(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/suppliers', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 创建采购订单
  createOrder(data: any): Promise<{ data: PurchaseOrder }> {
    return request.post<ApiResponse<PurchaseOrder>>('/purchase/orders', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新采购订单
  updateOrder(id: string, data: any): Promise<{ data: PurchaseOrder }> {
    return request.put<ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除采购订单
  deleteOrder(id: string): Promise<void> {
    return request.delete(`/purchase/orders/${id}`)
  },

  // 审批采购订单
  approveOrder(id: string, data?: any): Promise<{ data: PurchaseOrder }> {
    return request.post<ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/approve`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 取消采购订单
  cancelOrder(id: string, reason?: string): Promise<{ data: PurchaseOrder }> {
    return request.post<ApiResponse<PurchaseOrder>>(`/purchase/orders/${id}/cancel`, { reason })
      .then(response => ({ data: response.data.data }))
  },

  // 批量审批订单
  batchApproveOrders(orderIds: string[]): Promise<void> {
    return request.post('/purchase/orders/batch-approve', { orderIds })
  },

  // 创建供应商
  createSupplier(data: any): Promise<{ data: Supplier }> {
    return request.post<ApiResponse<Supplier>>('/suppliers', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新供应商
  updateSupplier(id: number, data: any): Promise<{ data: Supplier }> {
    return request.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除供应商
  deleteSupplier(id: number): Promise<void> {
    return request.delete(`/suppliers/${id}`)
  },

  // 获取采购统计数据
  getStatistics(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/purchase/statistics', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取基地列表（用于下拉选择）
  getBases(): Promise<{ data: any[] }> {
    return request.get<ApiResponse<any[]>>('/bases')
      .then(response => ({ data: response.data.data }))
  },

  // 导出采购报表
  exportReport(params: any = {}): Promise<Blob> {
    return request.get('/purchase/export', { 
      params, 
      responseType: 'blob' 
    }).then(response => response.data)
  }
}