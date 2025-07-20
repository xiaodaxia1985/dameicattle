import request from './request'
import type { ApiResponse } from './request'

export interface Customer {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_rating: number;
  customer_type?: string;
  business_license?: string;
  tax_number?: string;
  bank_account?: string;
  credit_limit: number;
  payment_terms?: string;
  status: string;
  created_at: string;
  updated_at: string;
  visit_records?: CustomerVisitRecord[];
}

export interface CustomerVisitRecord {
  id: number;
  customer_id: number;
  visit_date: string;
  visit_type: string;
  visitor_id: number;
  purpose: string;
  content: string;
  result?: string;
  next_visit_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
  visitor?: any;
}

export interface SalesOrder {
  id: number;
  order_number: string;
  customer_id: number;
  base_id: number;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  status: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled';
  order_date: string;
  delivery_date?: string;
  actual_delivery_date?: string;
  payment_status: 'unpaid' | 'partial' | 'paid';
  payment_method?: string;
  contract_number?: string;
  logistics_company?: string;
  tracking_number?: string;
  remark?: string;
  created_by: number;
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  base?: any;
  creator?: any;
  approver?: any;
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: number;
  order_id: number;
  cattle_id: number;
  ear_tag: string;
  breed?: string;
  weight?: number;
  unit_price: number;
  total_price: number;
  quality_grade?: string;
  health_certificate?: string;
  quarantine_certificate?: string;
  delivery_status: string;
  remark?: string;
  created_at: string;
  cattle?: any;
}

export const salesApi = {
  // 获取销售订单列表
  getOrders(params: any = {}): Promise<{ data: { items: SalesOrder[], total: number, page: number, limit: number } }> {
    return request.get<ApiResponse<any>>('/sales-orders', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取销售订单详情
  getOrder(id: number): Promise<{ data: SalesOrder }> {
    return request.get<ApiResponse<SalesOrder>>(`/sales-orders/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 创建销售订单
  createOrder(data: any): Promise<{ data: SalesOrder }> {
    return request.post<ApiResponse<SalesOrder>>('/sales-orders', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新销售订单
  updateOrder(id: number, data: any): Promise<{ data: SalesOrder }> {
    return request.put<ApiResponse<SalesOrder>>(`/sales-orders/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 审批销售订单
  approveOrder(id: number): Promise<{ data: SalesOrder }> {
    return request.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/approve`)
      .then(response => ({ data: response.data.data }))
  },

  // 取消销售订单
  cancelOrder(id: number, reason: string): Promise<{ data: SalesOrder }> {
    return request.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/cancel`, { reason })
      .then(response => ({ data: response.data.data }))
  },

  // 更新订单交付状态
  updateDeliveryStatus(id: number, data: any): Promise<{ data: SalesOrder }> {
    return request.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/delivery`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新订单付款状态
  updatePaymentStatus(id: number, data: any): Promise<{ data: SalesOrder }> {
    return request.post<ApiResponse<SalesOrder>>(`/sales-orders/${id}/payment`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 获取销售统计数据
  getStatistics(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/sales-orders/statistics', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取客户列表
  getCustomers(params: any = {}): Promise<{ data: { items: Customer[], total: number, page: number, limit: number } }> {
    return request.get<ApiResponse<any>>('/customers', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取客户详情
  getCustomer(id: number): Promise<{ data: Customer }> {
    return request.get<ApiResponse<Customer>>(`/customers/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 创建客户
  createCustomer(data: any): Promise<{ data: Customer }> {
    return request.post<ApiResponse<Customer>>('/customers', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新客户
  updateCustomer(id: number, data: any): Promise<{ data: Customer }> {
    return request.put<ApiResponse<Customer>>(`/customers/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除客户
  deleteCustomer(id: number): Promise<void> {
    return request.delete(`/customers/${id}`)
  },

  // 更新客户信用评级
  updateCustomerRating(id: number, data: { credit_rating: number, comment?: string }): Promise<{ data: any }> {
    return request.put<ApiResponse<any>>(`/customers/${id}/rating`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 获取客户统计信息
  getCustomerStatistics(id: number, params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>(`/customers/${id}/statistics`, { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取客户回访记录
  getCustomerVisits(customerId: number, params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>(`/customers/${customerId}/visits`, { params })
      .then(response => ({ data: response.data.data }))
  },

  // 创建客户回访记录
  createCustomerVisit(customerId: number, data: any): Promise<{ data: CustomerVisitRecord }> {
    return request.post<ApiResponse<CustomerVisitRecord>>(`/customers/${customerId}/visits`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新客户回访记录
  updateCustomerVisit(id: number, data: any): Promise<{ data: CustomerVisitRecord }> {
    return request.put<ApiResponse<CustomerVisitRecord>>(`/customers/visits/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 获取客户类型列表
  getCustomerTypes(): Promise<{ data: any[] }> {
    return request.get<ApiResponse<any[]>>('/customers/types')
      .then(response => ({ data: response.data.data }))
  },

  // 获取客户价值分析
  getCustomerValueAnalysis(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/customers/value-analysis', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取基地列表（用于下拉选择）
  getBases(): Promise<{ data: any[] }> {
    return request.get<ApiResponse<any[]>>('/bases')
      .then(response => ({ data: response.data.data }))
  },

  // 获取牛只列表（用于销售订单选择）
  getCattle(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/cattle', { params })
      .then(response => ({ data: response.data.data }))
  }
}