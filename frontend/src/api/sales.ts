import { salesServiceApi } from './microservices'
import type { ApiResponse } from './request'
import { withAuth } from '@/utils/authGuard'

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
  order_id?: number;
  itemType: 'cattle' | 'material' | 'equipment';
  // 牛只类字段
  cattle_id?: number;
  ear_tag?: string;
  breed?: string;
  weight?: number;
  // 物资类字段
  material_id?: number;
  material_name?: string;
  material_unit?: string;
  // 设备类字段
  equipment_id?: number;
  equipment_name?: string;
  equipment_unit?: string;
  specification?: string;
  // 公共字段
  unit_price: number;
  quantity: number;
  total_price: number;
  delivered?: boolean;
  delivery_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const salesApi = {
  // 获取销售订单列表
  async getOrders(params: any = {}): Promise<{ data: { items: SalesOrder[], total: number, page: number, limit: number } }> {
    return withAuth(async () => {
      const response = await salesServiceApi.getSalesOrders(params)
      // 统一类型断言，避免 TS 报错
      const responseData: any = response?.data || response || {};
      let orders: SalesOrder[] = [];
      let total = 0;
      let page = 1;
      let limit = 20;
      if (Array.isArray(responseData)) {
        orders = responseData as SalesOrder[];
        total = orders.length;
      } else if (Array.isArray(responseData.data)) {
        orders = responseData.data as SalesOrder[];
        total = responseData.total || responseData.pagination?.total || orders.length;
        page = responseData.page || responseData.pagination?.page || 1;
        limit = responseData.limit || responseData.pagination?.limit || 20;
      } else if (Array.isArray(responseData.orders)) {
        orders = responseData.orders as SalesOrder[];
        total = responseData.total || responseData.pagination?.total || orders.length;
        page = responseData.page || responseData.pagination?.page || 1;
        limit = responseData.limit || responseData.pagination?.limit || 20;
      } else if (Array.isArray(responseData.items)) {
        orders = responseData.items as SalesOrder[];
        total = responseData.total || responseData.pagination?.total || orders.length;
        page = responseData.page || responseData.pagination?.page || 1;
        limit = responseData.limit || responseData.pagination?.limit || 20;
      }
      
      // 数据格式转换：将数据库字段名转换为前端期望的字段名
      const transformedOrders = orders.map((order: any) => ({
        ...order,
        order_number: order.orderNumber || order.order_number,
        customer_name: order.customerName || order.customer_name,
        total_amount: order.totalAmount || order.total_amount,
        tax_amount: order.taxAmount || order.tax_amount,
        discount_amount: order.discountAmount || order.discount_amount,
        payment_status: order.paymentStatus || order.payment_status,
        payment_method: order.paymentMethod || order.payment_method,
        order_date: order.orderDate || order.order_date,
        delivery_date: order.expectedDeliveryDate || order.delivery_date,
        actual_delivery_date: order.actualDeliveryDate || order.actual_delivery_date,
        contract_number: order.contractNumber || order.contract_number,
        logistics_company: order.logisticsCompany || order.logistics_company,
        tracking_number: order.trackingNumber || order.tracking_number,
        created_by: order.createdBy || order.created_by,
        created_by_name: order.createdByName || order.created_by_name,
        approved_by: order.approvedBy || order.approved_by,
        approved_by_name: order.approvedByName || order.approved_by_name,
        approved_at: order.approvedAt || order.approved_at,
        created_at: order.createdAt || order.created_at,
        updated_at: order.updatedAt || order.updated_at,
        customer: order.customer || { name: order.customerName || order.customer_name },
        creator: order.creator || { real_name: order.createdByName || order.created_by_name }
      }))
      
      const result = { 
        data: {
          items: transformedOrders,
          total,
          page,
          limit
        }
      }
      
      console.log('✅ salesApi.getOrders 解析结果:', { 
        ordersCount: transformedOrders.length, 
        total, 
        page, 
        limit,
        sampleOrder: transformedOrders[0] || null
      })
      
      return result
    })
  },

  // 获取销售订单详情
  async getOrder(id: number): Promise<{ data: SalesOrder }> {
    return withAuth(async () => {
      console.log('🔍 salesApi.getOrder 调用参数:', id)
      const response = await salesServiceApi.getById('/orders', id)
      console.log('📥 salesServiceApi.getById 原始响应:', response)
      // 兼容多种后端返回格式
      const orderData = response?.data?.order || response?.data || response?.order || response;
      console.log('✅ salesApi.getOrder 解析结果:', orderData);
      // 严格校验数据有效性
      if (!orderData || typeof orderData !== 'object' || typeof orderData.id !== 'number') {
        // 只检查已知的 message 字段，避免类型警告
        const backendMsg = typeof response?.message === 'string' ? response.message : '';
        throw new Error(`订单不存在或无效。${backendMsg}`)
      }
      return { data: orderData };
    })
  },

  // 创建销售订单
  async createOrder(data: any): Promise<{ data: SalesOrder }> {
    return withAuth(async () => {
      const response = await salesServiceApi.createSalesOrder(data)
      return { data: response.data }
    })
  },

  // 更新销售订单
  async updateOrder(id: number, data: any): Promise<{ data: SalesOrder }> {
    return withAuth(async () => {
      const response = await salesServiceApi.update('/orders', id, data)
      return { data: response.data }
    })
  },

  // 审批销售订单
  async approveOrder(id: number): Promise<{ data: SalesOrder }> {
    return withAuth(async () => {
      const response = await salesServiceApi.post(`/orders/${id}/approve`)
      return { data: response.data }
    })
  },

  // 取消销售订单
  async cancelOrder(id: number, reason: string): Promise<{ data: SalesOrder }> {
    return withAuth(async () => {
      const response = await salesServiceApi.post(`/orders/${id}/cancel`, { reason })
      return { data: response.data }
    })
  },

  // 更新订单交付状态
  async updateDeliveryStatus(id: number, data: any): Promise<{ data: SalesOrder }> {
    return withAuth(async () => {
      const response = await salesServiceApi.post(`/orders/${id}/delivery`, data)
      return { data: response.data }
    })
  },

  // 更新订单付款状态
  async updatePaymentStatus(id: number, data: any): Promise<{ data: SalesOrder }> {
    return withAuth(async () => {
      const response = await salesServiceApi.post(`/orders/${id}/payment`, data)
      return { data: response.data }
    })
  },

  // 获取销售统计数据
  async getStatistics(params: any = {}): Promise<{ data: any }> {
    return withAuth(async () => {
      const response = await salesServiceApi.getSalesStatistics(params.baseId)
      return { data: response.data }
    })
  },

  // 获取客户列表
  async getCustomers(params: any = {}): Promise<{ data: { items: Customer[], total: number, page: number, limit: number } }> {
    return withAuth(async () => {
      console.log('🔍 salesApi.getCustomers 调用参数:', params)
      
      const response = await salesServiceApi.getCustomers(params)
      console.log('📥 salesServiceApi 原始响应:', response)
      
      // 直接解析微服务返回的数据，恢复原有逻辑
      const responseData = response?.data || response || {};
      let customers = [];
      let total = 0;
      let page = 1;
      let limit = 20;
      // 处理不同的数据结构，安全访问动态属性
      if (Array.isArray(responseData)) {
        customers = responseData;
        total = customers.length;
      } else if ((responseData as any).customers && Array.isArray((responseData as any).customers)) {
        customers = (responseData as any).customers;
        total = (responseData as any).pagination?.total || customers.length;
        page = (responseData as any).pagination?.page || 1;
        limit = (responseData as any).pagination?.limit || 20;
      } else if ((responseData as any).data && Array.isArray((responseData as any).data)) {
        customers = (responseData as any).data;
        total = (responseData as any).total || (responseData as any).pagination?.total || customers.length;
        page = (responseData as any).page || (responseData as any).pagination?.page || 1;
        limit = (responseData as any).limit || (responseData as any).pagination?.limit || 20;
      } else if ((responseData as any).items && Array.isArray((responseData as any).items)) {
        customers = (responseData as any).items;
        total = (responseData as any).total || (responseData as any).pagination?.total || customers.length;
        page = (responseData as any).page || (responseData as any).pagination?.page || 1;
        limit = (responseData as any).limit || (responseData as any).pagination?.limit || 20;
      } else {
        // fallback: try to extract array from known keys
        customers = Array.isArray(responseData) ? responseData : [];
        total = customers.length;
        page = 1;
        limit = 20;
      }
      
      // 数据格式转换：将数据库字段名转换为前端期望的字段名
      const transformedCustomers = customers.map((customer: any) => ({
        ...customer,
        contact_person: customer.contactPerson || customer.contact_person,
        customer_type: customer.customerType || customer.customer_type,
        business_license: customer.businessLicense || customer.business_license,
        tax_number: customer.taxNumber || customer.tax_number,
        bank_account: customer.bankAccount || customer.bank_account,
        credit_limit: customer.creditLimit || customer.credit_limit,
        credit_rating: customer.creditRating || customer.credit_rating,
        payment_terms: customer.paymentTerms || customer.payment_terms,
        created_at: customer.createdAt || customer.created_at,
        updated_at: customer.updatedAt || customer.updated_at,
        visit_records: customer.visitRecords || customer.visit_records || []
      }))
      
      const result = { 
        data: {
          items: transformedCustomers,
          total,
          page,
          limit
        }
      }
      
      console.log('✅ salesApi.getCustomers 解析结果:', { 
        customersCount: transformedCustomers.length, 
        total, 
        page, 
        limit,
        sampleCustomer: transformedCustomers[0] || null
      })
      
      return result
    })
  },

  // 获取客户详情
  async getCustomer(id: number): Promise<{ data: Customer }> {
    return withAuth(async () => {
      console.log('🔍 salesApi.getCustomer 调用参数:', id)
      const response = await salesServiceApi.getById('/customers', id)
      console.log('📥 salesServiceApi.getById 原始响应:', response)
      // 兼容多种后端返回格式
      const customerData = (response as any)?.data?.customer || (response as any)?.data || (response as any)?.customer || response;
      console.log('✅ salesApi.getCustomer 解析结果:', customerData);
      // 严格校验数据有效性
      if (!customerData || typeof customerData !== 'object' || typeof customerData.id !== 'number') {
        // 只检查已知的 message 字段，避免类型警告
        const backendMsg = typeof response?.message === 'string' ? response.message : '';
        throw new Error(`客户不存在或无效。${backendMsg}`)
      }
      return { data: customerData };
    })
  },

  // 创建客户
  async createCustomer(data: any): Promise<{ data: Customer }> {
    return withAuth(async () => {
      const response = await salesServiceApi.createCustomer(data)
      return { data: response.data }
    })
  },

  // 更新客户
  async updateCustomer(id: number, data: any): Promise<{ data: Customer }> {
    return withAuth(async () => {
      const response = await salesServiceApi.update('/customers', id, data)
      return { data: response.data }
    })
  },

  // 删除客户
  async deleteCustomer(id: number): Promise<void> {
    return withAuth(async () => {
      await salesServiceApi.remove('/customers', id)
    })
  },

  // 更新客户信用评级
  async updateCustomerRating(id: number, data: { credit_rating: number, comment?: string }): Promise<{ data: any }> {
    return withAuth(async () => {
      const response = await salesServiceApi.put(`/customers/${id}/rating`, data)
      return { data: response.data }
    })
  },

  // 获取客户统计信息
  async getCustomerStatistics(id: number, params: any = {}): Promise<{ data: any }> {
    return withAuth(async () => {
      const response = await salesServiceApi.get(`/customers/${id}/statistics`, params)
      return { data: response.data }
    })
  },

  // 获取客户回访记录
  async getCustomerVisits(customerId: number, params: any = {}): Promise<{ data: any }> {
    return withAuth(async () => {
      const response = await salesServiceApi.get(`/customers/${customerId}/visits`, params)
      return { data: response.data }
    })
  },

  // 创建客户回访记录
  async createCustomerVisit(customerId: number, data: any): Promise<{ data: CustomerVisitRecord }> {
    return withAuth(async () => {
      const response = await salesServiceApi.post(`/customers/${customerId}/visits`, data)
      return { data: response.data }
    })
  },

  // 更新客户回访记录
  async updateCustomerVisit(id: number, data: any): Promise<{ data: CustomerVisitRecord }> {
    return withAuth(async () => {
      const response = await salesServiceApi.put(`/customers/visits/${id}`, data)
      return { data: response.data }
    })
  },

  // 获取客户类型列表
  async getCustomerTypes(): Promise<{ data: any[] }> {
    return withAuth(async () => {
      const response = await salesServiceApi.get('/customers/types')
      return { data: response.data }
    })
  },

  // 获取客户价值分析
  async getCustomerValueAnalysis(params: any = {}): Promise<{ data: any }> {
    return withAuth(async () => {
      const response = await salesServiceApi.get('/customers/value-analysis', params)
      return { data: response.data }
    })
  },

  // 获取基地列表（用于下拉选择）
  async getBases(): Promise<{ data: any[] }> {
    return withAuth(async () => {
      const response = await salesServiceApi.get('/bases')
      return { data: response.data }
    })
  },

  // 获取牛只列表（用于销售订单选择）
  async getCattle(params: any = {}): Promise<{ data: any }> {
    return withAuth(async () => {
      const response = await salesServiceApi.get('/cattle', params)
      return { data: response.data }
    })
  }
}