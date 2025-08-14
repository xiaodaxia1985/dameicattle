import { salesServiceApi } from './microservices'
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
  async getOrders(params: any = {}): Promise<{ data: { items: SalesOrder[], total: number, page: number, limit: number } }> {
    console.log('🔍 salesApi.getOrders 调用参数:', params)
    
    const response = await salesServiceApi.getSalesOrders(params)
    console.log('📥 salesServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    let orders = []
    let total = 0
    let page = 1
    let limit = 20
    
    // 处理不同的数据结构
    if (Array.isArray(responseData)) {
      // 直接是数组
      orders = responseData
      total = orders.length
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // 有data字段且是数组
      orders = responseData.data
      total = responseData.total || responseData.pagination?.total || orders.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.orders && Array.isArray(responseData.orders)) {
      // 有orders字段且是数组
      orders = responseData.orders
      total = responseData.total || responseData.pagination?.total || orders.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.items && Array.isArray(responseData.items)) {
      // 有items字段且是数组
      orders = responseData.items
      total = responseData.total || responseData.pagination?.total || orders.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    }
    
    const result = { 
      data: {
        items: orders,
        total,
        page,
        limit
      }
    }
    
    console.log('✅ salesApi.getOrders 解析结果:', { 
      ordersCount: orders.length, 
      total, 
      page, 
      limit,
      sampleOrder: orders[0] || null
    })
    
    return result
  },

  // 获取销售订单详情
  async getOrder(id: number): Promise<{ data: SalesOrder }> {
    const response = await salesServiceApi.getById('/orders', id)
    return { data: response.data }
  },

  // 创建销售订单
  async createOrder(data: any): Promise<{ data: SalesOrder }> {
    const response = await salesServiceApi.createSalesOrder(data)
    return { data: response.data }
  },

  // 更新销售订单
  async updateOrder(id: number, data: any): Promise<{ data: SalesOrder }> {
    const response = await salesServiceApi.update('/orders', id, data)
    return { data: response.data }
  },

  // 审批销售订单
  async approveOrder(id: number): Promise<{ data: SalesOrder }> {
    const response = await salesServiceApi.post(`/orders/${id}/approve`)
    return { data: response.data }
  },

  // 取消销售订单
  async cancelOrder(id: number, reason: string): Promise<{ data: SalesOrder }> {
    const response = await salesServiceApi.post(`/orders/${id}/cancel`, { reason })
    return { data: response.data }
  },

  // 更新订单交付状态
  async updateDeliveryStatus(id: number, data: any): Promise<{ data: SalesOrder }> {
    const response = await salesServiceApi.post(`/orders/${id}/delivery`, data)
    return { data: response.data }
  },

  // 更新订单付款状态
  async updatePaymentStatus(id: number, data: any): Promise<{ data: SalesOrder }> {
    const response = await salesServiceApi.post(`/orders/${id}/payment`, data)
    return { data: response.data }
  },

  // 获取销售统计数据
  async getStatistics(params: any = {}): Promise<{ data: any }> {
    const response = await salesServiceApi.getSalesStatistics(params.baseId)
    return { data: response.data }
  },

  // 获取客户列表
  async getCustomers(params: any = {}): Promise<{ data: { items: Customer[], total: number, page: number, limit: number } }> {
    console.log('🔍 salesApi.getCustomers 调用参数:', params)
    
    const response = await salesServiceApi.getCustomers(params)
    console.log('📥 salesServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    let customers = []
    let total = 0
    let page = 1
    let limit = 20
    
    // 处理不同的数据结构
    if (Array.isArray(responseData)) {
      // 直接是数组
      customers = responseData
      total = customers.length
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // 有data字段且是数组
      customers = responseData.data
      total = responseData.total || responseData.pagination?.total || customers.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.customers && Array.isArray(responseData.customers)) {
      // 有customers字段且是数组
      customers = responseData.customers
      total = responseData.total || responseData.pagination?.total || customers.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.items && Array.isArray(responseData.items)) {
      // 有items字段且是数组
      customers = responseData.items
      total = responseData.total || responseData.pagination?.total || customers.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    }
    
    const result = { 
      data: {
        items: customers,
        total,
        page,
        limit
      }
    }
    
    console.log('✅ salesApi.getCustomers 解析结果:', { 
      customersCount: customers.length, 
      total, 
      page, 
      limit,
      sampleCustomer: customers[0] || null
    })
    
    return result
  },

  // 获取客户详情
  async getCustomer(id: number): Promise<{ data: Customer }> {
    const response = await salesServiceApi.getById('/customers', id)
    return { data: response.data }
  },

  // 创建客户
  async createCustomer(data: any): Promise<{ data: Customer }> {
    const response = await salesServiceApi.createCustomer(data)
    return { data: response.data }
  },

  // 更新客户
  async updateCustomer(id: number, data: any): Promise<{ data: Customer }> {
    const response = await salesServiceApi.update('/customers', id, data)
    return { data: response.data }
  },

  // 删除客户
  async deleteCustomer(id: number): Promise<void> {
    await salesServiceApi.remove('/customers', id)
  },

  // 更新客户信用评级
  async updateCustomerRating(id: number, data: { credit_rating: number, comment?: string }): Promise<{ data: any }> {
    const response = await salesServiceApi.put(`/customers/${id}/rating`, data)
    return { data: response.data }
  },

  // 获取客户统计信息
  async getCustomerStatistics(id: number, params: any = {}): Promise<{ data: any }> {
    const response = await salesServiceApi.get(`/customers/${id}/statistics`, params)
    return { data: response.data }
  },

  // 获取客户回访记录
  async getCustomerVisits(customerId: number, params: any = {}): Promise<{ data: any }> {
    const response = await salesServiceApi.get(`/customers/${customerId}/visits`, params)
    return { data: response.data }
  },

  // 创建客户回访记录
  async createCustomerVisit(customerId: number, data: any): Promise<{ data: CustomerVisitRecord }> {
    const response = await salesServiceApi.post(`/customers/${customerId}/visits`, data)
    return { data: response.data }
  },

  // 更新客户回访记录
  async updateCustomerVisit(id: number, data: any): Promise<{ data: CustomerVisitRecord }> {
    const response = await salesServiceApi.put(`/customers/visits/${id}`, data)
    return { data: response.data }
  },

  // 获取客户类型列表
  async getCustomerTypes(): Promise<{ data: any[] }> {
    const response = await salesServiceApi.get('/customers/types')
    return { data: response.data }
  },

  // 获取客户价值分析
  async getCustomerValueAnalysis(params: any = {}): Promise<{ data: any }> {
    const response = await salesServiceApi.get('/customers/value-analysis', params)
    return { data: response.data }
  },

  // 获取基地列表（用于下拉选择）
  async getBases(): Promise<{ data: any[] }> {
    const response = await salesServiceApi.get('/bases')
    return { data: response.data }
  },

  // 获取牛只列表（用于销售订单选择）
  async getCattle(params: any = {}): Promise<{ data: any }> {
    const response = await salesServiceApi.get('/cattle', params)
    return { data: response.data }
  }
}