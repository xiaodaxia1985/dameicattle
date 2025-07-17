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
  }
}