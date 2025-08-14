import { procurementServiceApi, baseServiceApi } from './microservices'
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
  async getOrders(params: any = {}): Promise<{ data: any }> {
    const response = await procurementServiceApi.getProcurementOrders(params)
    return { data: response.data }
  },

  // 获取供应商列表
  async getSuppliers(params: any = {}): Promise<{ data: any }> {
    const response = await procurementServiceApi.getSuppliers(params)
    return { data: response.data }
  },

  // 创建采购订单
  async createOrder(data: any): Promise<{ data: PurchaseOrder }> {
    const response = await procurementServiceApi.createProcurementOrder(data)
    return { data: response.data }
  },

  // 更新采购订单
  async updateOrder(id: string, data: any): Promise<{ data: PurchaseOrder }> {
    const response = await procurementServiceApi.update('/orders', id, data)
    return { data: response.data }
  },

  // 删除采购订单
  async deleteOrder(id: string): Promise<void> {
    await procurementServiceApi.remove('/orders', id)
  },

  // 审批采购订单
  async approveOrder(id: string, data?: any): Promise<{ data: PurchaseOrder }> {
    const response = await procurementServiceApi.post(`/orders/${id}/approve`, data)
    return { data: response.data }
  },

  // 取消采购订单
  async cancelOrder(id: string, reason?: string): Promise<{ data: PurchaseOrder }> {
    const response = await procurementServiceApi.post(`/orders/${id}/cancel`, { reason })
    return { data: response.data }
  },

  // 批量审批订单
  async batchApproveOrders(orderIds: string[]): Promise<void> {
    await procurementServiceApi.post('/orders/batch-approve', { orderIds })
  },

  // 创建供应商
  async createSupplier(data: any): Promise<{ data: Supplier }> {
    // 确保数据格式正确
    const supplierData = {
      name: data.name,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email || '',
      address: data.address || '',
      supplierType: data.supplierType || 'material',
      businessLicense: data.businessLicense || '',
      taxNumber: data.taxNumber || '',
      bankAccount: data.bankAccount || '',
      creditLimit: Number(data.creditLimit) || 0,
      paymentTerms: data.paymentTerms || '',
      rating: Number(data.rating) || 5,
      remark: data.remark || ''
    }
    const response = await procurementServiceApi.createSupplier(supplierData)
    return { data: response.data }
  },

  // 更新供应商
  async updateSupplier(id: number, data: any): Promise<{ data: Supplier }> {
    const response = await procurementServiceApi.put(`/suppliers/${id}`, data)
    return { data: response.data }
  },

  // 删除供应商
  async deleteSupplier(id: number): Promise<void> {
    await procurementServiceApi.delete(`/suppliers/${id}`)
  },

  // 获取采购统计数据
  async getStatistics(params: any = {}): Promise<{ data: any }> {
    const response = await procurementServiceApi.get('/statistics', params)
    return { data: response.data }
  },

  // 获取采购趋势数据
  async getTrendData(params: any = {}): Promise<{ data: any }> {
    const response = await procurementServiceApi.get('/statistics/trend', params)
    return { data: response.data }
  },

  // 获取采购类型分布
  async getTypeDistribution(params: any = {}): Promise<{ data: any }> {
    const response = await procurementServiceApi.get('/statistics/type-distribution', params)
    return { data: response.data }
  },

  // 获取供应商排行
  async getSupplierRanking(params: any = {}): Promise<{ data: any }> {
    const response = await procurementServiceApi.get('/statistics/supplier-ranking', params)
    return { data: response.data }
  },

  // 获取订单状态分布
  async getStatusDistribution(params: any = {}): Promise<{ data: any }> {
    const response = await procurementServiceApi.get('/statistics/status-distribution', params)
    return { data: response.data }
  },

  // 获取月度统计详情
  async getMonthlyData(params: any = {}): Promise<{ data: any }> {
    const response = await procurementServiceApi.get('/statistics/monthly', params)
    return { data: response.data }
  },

  // 订单状态流转 - 交付确认
  async deliverOrder(id: string, data: any): Promise<{ data: PurchaseOrder }> {
    const response = await procurementServiceApi.post(`/orders/${id}/deliver`, data)
    return { data: response.data }
  },

  // 订单状态流转 - 付款确认
  async payOrder(id: string, data: any): Promise<{ data: PurchaseOrder }> {
    const response = await procurementServiceApi.post(`/orders/${id}/pay`, data)
    return { data: response.data }
  },

  // 订单状态流转 - 完成订单
  async completeOrder(id: string, data: any): Promise<{ data: PurchaseOrder }> {
    const response = await procurementServiceApi.post(`/orders/${id}/complete`, data)
    return { data: response.data }
  },

  // 获取订单时间线
  async getOrderTimeline(id: string): Promise<{ data: any }> {
    const response = await procurementServiceApi.get(`/orders/${id}/timeline`)
    return { data: response.data }
  },

  // 获取基地列表（用于下拉选择）
  async getBases(): Promise<{ data: any[] }> {
    const response = await baseServiceApi.getBases()
    return { data: response.data }
  },

  // 导出采购报表
  async exportReport(params: any = {}): Promise<Blob> {
    await procurementServiceApi.download('/export', 'purchase_report.xlsx')
    // 返回一个空的Blob，实际下载由微服务API处理
    return new Blob()
  }
}