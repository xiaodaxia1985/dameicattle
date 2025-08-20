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
      console.log('🔄 salesApi.getOrders 开始调用，参数:', params)
      const response = await salesServiceApi.getSalesOrders(params)
      console.log('📥 salesServiceApi.getSalesOrders 原始响应:', response)
      
      // 统一类型断言，避免 TS 报错
      const responseData: any = response?.data || response || {};
      console.log('📊 responseData 解析:', responseData)
      
      let orders: SalesOrder[] = [];
      let total = 0;
      let page = 1;
      let limit = 20;
      
      // 处理标准微服务响应格式 { success: true, data: {...}, message: "..." }
      if (responseData.success && responseData.data) {
        const apiData = responseData.data;
        console.log('📋 标准格式 apiData:', apiData)
        
        if (Array.isArray(apiData.orders)) {
          orders = apiData.orders as SalesOrder[];
          total = apiData.pagination?.total || orders.length;
          page = apiData.pagination?.page || 1;
          limit = apiData.pagination?.limit || 20;
        } else if (Array.isArray(apiData.items)) {
          orders = apiData.items as SalesOrder[];
          total = apiData.total || orders.length;
          page = apiData.page || 1;
          limit = apiData.limit || 20;
        } else if (Array.isArray(apiData)) {
          orders = apiData as SalesOrder[];
          total = orders.length;
        }
      }
      // 处理直接数组格式
      else if (Array.isArray(responseData)) {
        orders = responseData as SalesOrder[];
        total = orders.length;
      } 
      // 处理其他可能的格式
      else if (Array.isArray(responseData.data)) {
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
      
      console.log('🎯 数据解析结果:', { ordersCount: orders.length, total, page, limit })
      
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
      console.log('🔄 salesApi.getOrder 开始调用，ID:', id)
      const response = await salesServiceApi.get(`/orders/${id}`)
      console.log('📥 salesServiceApi.get 原始响应:', response)
      
      // 统一处理响应数据
      const responseData: any = response?.data || response || {};
      console.log('📊 responseData 解析:', responseData)
      
      let orderData = null;
      
      // 处理标准微服务响应格式 { success: true, data: {...}, message: "..." }
      if (responseData.success && responseData.data) {
        orderData = responseData.data;
        console.log('📋 标准格式 orderData:', orderData)
      }
      // 处理直接返回订单对象的格式
      else if (responseData.id && typeof responseData.id === 'number') {
        orderData = responseData;
      }
      // 处理其他可能的格式
      else if (responseData.order && typeof responseData.order.id === 'number') {
        orderData = responseData.order;
      }
      
      console.log('🎯 最终解析的 orderData:', orderData);
      
      // 严格校验数据有效性
      if (!orderData || typeof orderData !== 'object' || typeof orderData.id !== 'number') {
        const backendMsg = typeof responseData?.message === 'string' ? responseData.message : '';
        throw new Error(`订单不存在或无效。${backendMsg}`)
      }
      
      // 数据格式转换：将数据库字段名转换为前端期望的字段名
      const transformedOrder = {
        ...orderData,
        order_number: orderData.orderNumber || orderData.order_number,
        customer_name: orderData.customerName || orderData.customer_name,
        total_amount: orderData.totalAmount || orderData.total_amount,
        tax_amount: orderData.taxAmount || orderData.tax_amount,
        discount_amount: orderData.discountAmount || orderData.discount_amount,
        payment_status: orderData.paymentStatus || orderData.payment_status,
        payment_method: orderData.paymentMethod || orderData.payment_method,
        order_date: orderData.orderDate || orderData.order_date,
        delivery_date: orderData.expectedDeliveryDate || orderData.delivery_date,
        actual_delivery_date: orderData.actualDeliveryDate || orderData.actual_delivery_date,
        contract_number: orderData.contractNumber || orderData.contract_number,
        logistics_company: orderData.logisticsCompany || orderData.logistics_company,
        tracking_number: orderData.trackingNumber || orderData.tracking_number,
        created_by: orderData.createdBy || orderData.created_by,
        created_by_name: orderData.createdByName || orderData.created_by_name,
        approved_by: orderData.approvedBy || orderData.approved_by,
        approved_by_name: orderData.approvedByName || orderData.approved_by_name,
        approved_at: orderData.approvedAt || orderData.approved_at,
        created_at: orderData.createdAt || orderData.created_at,
        updated_at: orderData.updatedAt || orderData.updated_at,
        customer: orderData.customer || { name: orderData.customerName || orderData.customer_name },
        creator: orderData.creator || { real_name: orderData.createdByName || orderData.created_by_name }
      };
      
      console.log('✅ salesApi.getOrder 解析结果:', transformedOrder);
      return { data: transformedOrder };
    })
  },

  // 创建销售订单
  async createOrder(data: any): Promise<{ data: SalesOrder }> {
    return withAuth(async () => {
      console.log('🔄 salesApi.createOrder 开始调用，原始数据:', data)
      
      // 转换前端数据格式为后端期望的格式
      const backendData = {
        customer_id: data.customer_id,
        base_id: data.base_id || 1, // 默认基地ID，应该从用户权限获取
        cattle_ids: [], // 从items中提取cattle_id
        total_amount: data.total_amount || 0,
        order_date: data.order_date,
        expected_delivery_date: data.delivery_date || null,
        notes: data.remark || ''
      };
      
      // 从items中提取cattle_ids
      if (data.items && Array.isArray(data.items)) {
        backendData.cattle_ids = data.items
          .filter(item => item.itemType === 'cattle' && item.cattle_id)
          .map(item => item.cattle_id);
      }
      
      console.log('📊 转换后的后端数据:', backendData)
      
      const response = await salesServiceApi.createSalesOrder(backendData)
      console.log('📥 后端响应:', response)
      
      // 处理响应数据
      const responseData = response?.data || response || {};
      let orderData = null;
      
      if (responseData.success && responseData.data) {
        orderData = responseData.data;
      } else if (responseData.id) {
        orderData = responseData;
      }
      
      console.log('✅ salesApi.createOrder 解析结果:', orderData);
      return { data: orderData };
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
      console.log('🔄 salesApi.getCustomers 开始调用，参数:', params)
      const response = await salesServiceApi.getCustomers(params)
      console.log('📥 salesServiceApi.getCustomers 原始响应:', response)
      
      // 统一类型断言，避免 TS 报错
      const responseData: any = response?.data || response || {};
      console.log('📊 responseData 解析:', responseData)
      
      let customers: Customer[] = [];
      let total = 0;
      let page = 1;
      let limit = 20;
      
      // 处理标准微服务响应格式 { success: true, data: {...}, message: "..." }
      if (responseData.success && responseData.data) {
        const apiData = responseData.data;
        console.log('📋 标准格式 apiData:', apiData)
        
        if (Array.isArray(apiData.customers)) {
          customers = apiData.customers as Customer[];
          total = apiData.pagination?.total || customers.length;
          page = apiData.pagination?.page || 1;
          limit = apiData.pagination?.limit || 20;
        } else if (Array.isArray(apiData.items)) {
          customers = apiData.items as Customer[];
          total = apiData.total || customers.length;
          page = apiData.page || 1;
          limit = apiData.limit || 20;
        } else if (Array.isArray(apiData)) {
          customers = apiData as Customer[];
          total = customers.length;
        }
      }
      // 处理直接数组格式
      else if (Array.isArray(responseData)) {
        customers = responseData as Customer[];
        total = customers.length;
      }
      // 处理其他可能的格式
      else if (Array.isArray(responseData.data)) {
        customers = responseData.data as Customer[];
        total = responseData.total || responseData.pagination?.total || customers.length;
        page = responseData.page || responseData.pagination?.page || 1;
        limit = responseData.limit || responseData.pagination?.limit || 20;
      } else if (Array.isArray(responseData.customers)) {
        customers = responseData.customers as Customer[];
        total = responseData.total || responseData.pagination?.total || customers.length;
        page = responseData.page || responseData.pagination?.page || 1;
        limit = responseData.limit || responseData.pagination?.limit || 20;
      } else if (Array.isArray(responseData.items)) {
        customers = responseData.items as Customer[];
        total = responseData.total || responseData.pagination?.total || customers.length;
        page = responseData.page || responseData.pagination?.page || 1;
        limit = responseData.limit || responseData.pagination?.limit || 20;
      }
      
      console.log('🎯 数据解析结果:', { customersCount: customers.length, total, page, limit })
      
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
      console.log('🔄 salesApi.getCustomer 开始调用，ID:', id)
      const response = await salesServiceApi.get(`/customers/${id}`)
      console.log('📥 salesServiceApi.get 原始响应:', response)
      
      // 统一处理响应数据
      const responseData: any = response?.data || response || {};
      console.log('📊 responseData 解析:', responseData)
      
      let customerData = null;
      
      // 处理标准微服务响应格式 { success: true, data: {...}, message: "..." }
      if (responseData.success && responseData.data) {
        customerData = responseData.data;
        console.log('📋 标准格式 customerData:', customerData)
      }
      // 处理直接返回客户对象的格式
      else if (responseData.id && typeof responseData.id === 'number') {
        customerData = responseData;
      }
      // 处理其他可能的格式
      else if (responseData.customer && typeof responseData.customer.id === 'number') {
        customerData = responseData.customer;
      }
      
      console.log('🎯 最终解析的 customerData:', customerData);
      
      // 严格校验数据有效性
      if (!customerData || typeof customerData !== 'object' || typeof customerData.id !== 'number') {
        const backendMsg = typeof responseData?.message === 'string' ? responseData.message : '';
        throw new Error(`客户不存在或无效。${backendMsg}`)
      }
      
      // 数据格式转换：将数据库字段名转换为前端期望的字段名
      const transformedCustomer = {
        ...customerData,
        contact_person: customerData.contactPerson || customerData.contact_person,
        customer_type: customerData.customerType || customerData.customer_type,
        business_license: customerData.businessLicense || customerData.business_license,
        tax_number: customerData.taxNumber || customerData.tax_number,
        bank_account: customerData.bankAccount || customerData.bank_account,
        credit_limit: customerData.creditLimit || customerData.credit_limit,
        credit_rating: customerData.creditRating || customerData.credit_rating,
        payment_terms: customerData.paymentTerms || customerData.payment_terms,
        created_at: customerData.createdAt || customerData.created_at,
        updated_at: customerData.updatedAt || customerData.updated_at,
        visit_records: customerData.visitRecords || customerData.visit_records || []
      };
      
      console.log('✅ salesApi.getCustomer 解析结果:', transformedCustomer);
      return { data: transformedCustomer };
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
      console.log('🔄 salesApi.getCattle 开始调用，参数:', params)
      const response = await salesServiceApi.get('/cattle', params)
      console.log('📥 salesServiceApi.get cattle 原始响应:', response)
      
      // 统一处理响应数据
      const responseData: any = response?.data || response || {};
      console.log('📊 cattle responseData 解析:', responseData)
      
      let cattleData = [];
      
      // 处理标准微服务响应格式
      if (responseData.success && responseData.data) {
        const apiData = responseData.data;
        if (Array.isArray(apiData.cattle)) {
          cattleData = apiData.cattle;
        } else if (Array.isArray(apiData.items)) {
          cattleData = apiData.items;
        } else if (Array.isArray(apiData)) {
          cattleData = apiData;
        }
      } else if (Array.isArray(responseData)) {
        cattleData = responseData;
      }
      
      console.log('✅ salesApi.getCattle 解析结果:', cattleData);
      return { data: cattleData };
    })
  }
}