import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { salesApi, type Customer, type SalesOrder } from '@/api/sales'
import { ElMessage } from 'element-plus'

interface SalesState {
  // Orders state
  orders: SalesOrder[]
  ordersLoading: boolean
  ordersTotal: number
  ordersPage: number
  ordersLimit: number
  ordersPagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  
  // Customers state
  customers: Customer[]
  customersLoading: boolean
  customersTotal: number
  customersPage: number
  customersLimit: number
  customersPagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  
  // Cache state
  orderCache: Map<number, SalesOrder>
  customerCache: Map<number, Customer>
  lastOrdersFetch: number
  lastCustomersFetch: number
  cacheExpiry: number // 5 minutes
  
  // UI state
  selectedOrderIds: number[]
  selectedCustomerIds: number[]
  orderFilters: Record<string, any>
  customerFilters: Record<string, any>
}

export const useSalesStore = defineStore('sales', () => {
  // State - Use individual refs for better reactivity
  const orders = ref<SalesOrder[]>([])
  const ordersLoading = ref(false)
  const ordersTotal = ref(0)
  const ordersPage = ref(1)
  const ordersLimit = ref(20)
  const ordersPagination = ref({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })
  
  const customers = ref<Customer[]>([])
  const customersLoading = ref(false)
  const customersTotal = ref(0)
  const customersPage = ref(1)
  const customersLimit = ref(20)
  const customersPagination = ref({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  })
  
  const orderCache = ref(new Map<number, SalesOrder>())
  const customerCache = ref(new Map<number, Customer>())
  const lastOrdersFetch = ref(0)
  const lastCustomersFetch = ref(0)
  const cacheExpiry = ref(5 * 60 * 1000) // 5 minutes
  
  const selectedOrderIds = ref<number[]>([])
  const selectedCustomerIds = ref<number[]>([])
  const orderFilters = ref<Record<string, any>>({})
  const customerFilters = ref<Record<string, any>>({})

  // Computed
  const ordersCount = computed(() => orders.value.length)
  const customersCount = computed(() => customers.value.length)
  
  const hasOrdersCache = computed(() => {
    const now = Date.now()
    return lastOrdersFetch.value > 0 && 
           (now - lastOrdersFetch.value) < cacheExpiry.value
  })
  
  const hasCustomersCache = computed(() => {
    const now = Date.now()
    return lastCustomersFetch.value > 0 && 
           (now - lastCustomersFetch.value) < cacheExpiry.value
  })

  // Orders Actions
  const fetchOrders = async (params: any = {}, forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh && hasOrdersCache.value && Object.keys(params).length === 0) {
        console.log('📦 使用缓存的订单数据')
        return {
          items: orders.value,
          total: ordersTotal.value,
          page: ordersPage.value,
          limit: ordersLimit.value
        }
      }

      ordersLoading.value = true
      console.log('🔄 获取销售订单列表:', params)
      
      const response = await salesApi.getOrders(params)
      console.log('📥 销售订单API原始响应:', response)
      
      const { items, total, page, limit } = response.data
      
      // Update state
      orders.value = items || []
      ordersTotal.value = total || 0
      ordersPage.value = page || 1
      ordersLimit.value = limit || 20
      ordersPagination.value = {
        total: total || 0,
        page: page || 1,
        limit: limit || 20,
        totalPages: Math.ceil((total || 0) / (limit || 20))
      }
      
      // Update cache
      items?.forEach(order => {
        if (order.id) {
          orderCache.value.set(order.id, order)
        }
      })
      lastOrdersFetch.value = Date.now()
      
      console.log('✅ 订单列表获取成功:', {
        count: items?.length || 0,
        total,
        page,
        limit,
        ordersInStore: orders.value.length
      })
      
      return response.data
    } catch (error) {
      console.error('❌ 获取订单列表失败:', error)
      ElMessage.error('获取订单列表失败')
      throw error
    } finally {
      ordersLoading.value = false
    }
  }

  const getOrderById = async (id: number, forceRefresh = false): Promise<SalesOrder> => {
    try {
      // Check cache first
      if (!forceRefresh && orderCache.value.has(id)) {
        console.log('📦 使用缓存的订单数据:', id)
        return orderCache.value.get(id)!
      }

      console.log('🔄 获取订单详情:', id)
      const response = await salesApi.getOrder(id)
      const order = response.data
      
      // Update cache
      if (order && order.id) {
        orderCache.value.set(order.id, order)
        
        // Update orders list if order exists in it
        const index = orders.value.findIndex(o => o.id === order.id)
        if (index !== -1) {
          orders.value[index] = order
        }
      }
      
      console.log('✅ 订单详情获取成功:', order)
      return order
    } catch (error) {
      console.error('❌ 获取订单详情失败:', error)
      ElMessage.error('获取订单详情失败')
      throw error
    }
  }

  const createOrder = async (orderData: any): Promise<SalesOrder> => {
    try {
      console.log('🔄 创建销售订单:', orderData)
      const response = await salesApi.createOrder(orderData)
      const newOrder = response.data
      
      // Update state
      if (newOrder && newOrder.id) {
        orders.value.unshift(newOrder)
        ordersTotal.value += 1
        ordersPagination.value.total += 1
        orderCache.value.set(newOrder.id, newOrder)
      }
      
      console.log('✅ 订单创建成功:', newOrder)
      ElMessage.success('订单创建成功')
      return newOrder
    } catch (error) {
      console.error('❌ 创建订单失败:', error)
      ElMessage.error('创建订单失败')
      throw error
    }
  }

  const updateOrder = async (id: number, orderData: any): Promise<SalesOrder> => {
    try {
      console.log('🔄 更新销售订单:', id, orderData)
      const response = await salesApi.updateOrder(id, orderData)
      const updatedOrder = response.data
      
      // Update state
      if (updatedOrder && updatedOrder.id) {
        // Update cache
        orderCache.value.set(updatedOrder.id, updatedOrder)
        
        // Update orders list
        const index = orders.value.findIndex(o => o.id === updatedOrder.id)
        if (index !== -1) {
          orders.value[index] = updatedOrder
        }
      }
      
      console.log('✅ 订单更新成功:', updatedOrder)
      ElMessage.success('订单更新成功')
      return updatedOrder
    } catch (error) {
      console.error('❌ 更新订单失败:', error)
      ElMessage.error('更新订单失败')
      throw error
    }
  }

  const approveOrder = async (id: number): Promise<SalesOrder> => {
    try {
      console.log('🔄 审批销售订单:', id)
      const response = await salesApi.approveOrder(id)
      const approvedOrder = response.data
      
      // Update state
      if (approvedOrder && approvedOrder.id) {
        orderCache.value.set(approvedOrder.id, approvedOrder)
        
        const index = orders.value.findIndex(o => o.id === approvedOrder.id)
        if (index !== -1) {
          orders.value[index] = approvedOrder
        }
      }
      
      console.log('✅ 订单审批成功:', approvedOrder)
      ElMessage.success('订单审批成功')
      return approvedOrder
    } catch (error) {
      console.error('❌ 订单审批失败:', error)
      ElMessage.error('订单审批失败')
      throw error
    }
  }

  const cancelOrder = async (id: number, reason: string): Promise<SalesOrder> => {
    try {
      console.log('🔄 取消销售订单:', id, reason)
      const response = await salesApi.cancelOrder(id, reason)
      const cancelledOrder = response.data
      
      // Update state
      if (cancelledOrder && cancelledOrder.id) {
        orderCache.value.set(cancelledOrder.id, cancelledOrder)
        
        const index = orders.value.findIndex(o => o.id === cancelledOrder.id)
        if (index !== -1) {
          orders.value[index] = cancelledOrder
        }
      }
      
      console.log('✅ 订单取消成功:', cancelledOrder)
      ElMessage.success('订单取消成功')
      return cancelledOrder
    } catch (error) {
      console.error('❌ 订单取消失败:', error)
      ElMessage.error('订单取消失败')
      throw error
    }
  }

  // Customers Actions
  const fetchCustomers = async (params: any = {}, forceRefresh = false) => {
    try {
      // Check cache first
      if (!forceRefresh && hasCustomersCache.value && Object.keys(params).length === 0) {
        console.log('📦 使用缓存的客户数据')
        return {
          items: customers.value,
          total: customersTotal.value,
          page: customersPage.value,
          limit: customersLimit.value
        }
      }

      customersLoading.value = true
      console.log('🔄 获取客户列表:', params)
      
      const response = await salesApi.getCustomers(params)
      console.log('📥 客户API原始响应:', response)
      
      const { items, total, page, limit } = response.data
      
      // Update state
      customers.value = items || []
      customersTotal.value = total || 0
      customersPage.value = page || 1
      customersLimit.value = limit || 20
      customersPagination.value = {
        total: total || 0,
        page: page || 1,
        limit: limit || 20,
        totalPages: Math.ceil((total || 0) / (limit || 20))
      }
      
      // Update cache
      items?.forEach(customer => {
        if (customer.id) {
          customerCache.value.set(customer.id, customer)
        }
      })
      lastCustomersFetch.value = Date.now()
      
      console.log('✅ 客户列表获取成功:', {
        count: items?.length || 0,
        total,
        page,
        limit,
        customersInStore: customers.value.length
      })
      
      return response.data
    } catch (error) {
      console.error('❌ 获取客户列表失败:', error)
      ElMessage.error('获取客户列表失败')
      throw error
    } finally {
      customersLoading.value = false
    }
  }

  const getCustomerById = async (id: number, forceRefresh = false): Promise<Customer> => {
    try {
      // Check cache first
      if (!forceRefresh && customerCache.value.has(id)) {
        console.log('📦 使用缓存的客户数据:', id)
        return customerCache.value.get(id)!
      }

      console.log('🔄 获取客户详情:', id)
      const response = await salesApi.getCustomer(id)
      const customer = response.data
      
      // Update cache
      if (customer && customer.id) {
        customerCache.value.set(customer.id, customer)
        
        // Update customers list if customer exists in it
        const index = customers.value.findIndex(c => c.id === customer.id)
        if (index !== -1) {
          customers.value[index] = customer
        }
      }
      
      console.log('✅ 客户详情获取成功:', customer)
      return customer
    } catch (error) {
      console.error('❌ 获取客户详情失败:', error)
      ElMessage.error('获取客户详情失败')
      throw error
    }
  }

  const createCustomer = async (customerData: any): Promise<Customer> => {
    try {
      console.log('🔄 创建客户:', customerData)
      const response = await salesApi.createCustomer(customerData)
      const newCustomer = response.data
      
      // Update state
      if (newCustomer && newCustomer.id) {
        customers.value.unshift(newCustomer)
        customersTotal.value += 1
        customersPagination.value.total += 1
        customerCache.value.set(newCustomer.id, newCustomer)
      }
      
      console.log('✅ 客户创建成功:', newCustomer)
      ElMessage.success('客户创建成功')
      return newCustomer
    } catch (error) {
      console.error('❌ 创建客户失败:', error)
      ElMessage.error('创建客户失败')
      throw error
    }
  }

  const updateCustomer = async (id: number, customerData: any): Promise<Customer> => {
    try {
      console.log('🔄 更新客户:', id, customerData)
      const response = await salesApi.updateCustomer(id, customerData)
      const updatedCustomer = response.data
      
      // Update state
      if (updatedCustomer && updatedCustomer.id) {
        // Update cache
        customerCache.value.set(updatedCustomer.id, updatedCustomer)
        
        // Update customers list
        const index = customers.value.findIndex(c => c.id === updatedCustomer.id)
        if (index !== -1) {
          customers.value[index] = updatedCustomer
        }
      }
      
      console.log('✅ 客户更新成功:', updatedCustomer)
      ElMessage.success('客户更新成功')
      return updatedCustomer
    } catch (error) {
      console.error('❌ 更新客户失败:', error)
      ElMessage.error('更新客户失败')
      throw error
    }
  }

  const deleteCustomer = async (id: number): Promise<void> => {
    try {
      console.log('🔄 删除客户:', id)
      await salesApi.deleteCustomer(id)
      
      // Update state
      customers.value = customers.value.filter(c => c.id !== id)
      customersTotal.value -= 1
      customersPagination.value.total -= 1
      customerCache.value.delete(id)
      
      console.log('✅ 客户删除成功')
      ElMessage.success('客户删除成功')
    } catch (error) {
      console.error('❌ 删除客户失败:', error)
      ElMessage.error('删除客户失败')
      throw error
    }
  }

  // Utility Actions
  const clearOrdersCache = () => {
    orderCache.value.clear()
    lastOrdersFetch.value = 0
    console.log('🧹 订单缓存已清空')
  }

  const clearCustomersCache = () => {
    customerCache.value.clear()
    lastCustomersFetch.value = 0
    console.log('🧹 客户缓存已清空')
  }

  const clearAllCache = () => {
    clearOrdersCache()
    clearCustomersCache()
    console.log('🧹 所有缓存已清空')
  }

  const setOrderFilters = (filters: Record<string, any>) => {
    orderFilters.value = { ...filters }
  }

  const setCustomerFilters = (filters: Record<string, any>) => {
    customerFilters.value = { ...filters }
  }

  const selectOrders = (ids: number[]) => {
    selectedOrderIds.value = [...ids]
  }

  const selectCustomers = (ids: number[]) => {
    selectedCustomerIds.value = [...ids]
  }

  const clearSelections = () => {
    selectedOrderIds.value = []
    selectedCustomerIds.value = []
  }

  // Batch Operations
  const batchApproveOrders = async (orderIds: number[]): Promise<void> => {
    try {
      console.log('🔄 批量审批订单:', orderIds)
      
      const promises = orderIds.map(id => approveOrder(id))
      await Promise.all(promises)
      
      console.log('✅ 批量审批成功')
      ElMessage.success(`成功审批 ${orderIds.length} 个订单`)
    } catch (error) {
      console.error('❌ 批量审批失败:', error)
      ElMessage.error('批量审批失败')
      throw error
    }
  }

  // Statistics
  const getOrdersStatistics = computed(() => {
    const ordersList = orders.value
    return {
      total: ordersList.length,
      pending: ordersList.filter(o => o.status === 'pending').length,
      approved: ordersList.filter(o => o.status === 'approved').length,
      delivered: ordersList.filter(o => o.status === 'delivered').length,
      completed: ordersList.filter(o => o.status === 'completed').length,
      cancelled: ordersList.filter(o => o.status === 'cancelled').length,
      totalAmount: ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    }
  })

  const getCustomersStatistics = computed(() => {
    const customersList = customers.value
    return {
      total: customersList.length,
      active: customersList.filter(c => c.status === 'active').length,
      inactive: customersList.filter(c => c.status === 'inactive').length,
      highCredit: customersList.filter(c => c.credit_rating >= 4).length,
      lowCredit: customersList.filter(c => c.credit_rating < 3).length
    }
  })

  return {
    // State - Individual refs
    orders,
    ordersLoading,
    ordersTotal,
    ordersPage,
    ordersLimit,
    ordersPagination,
    
    customers,
    customersLoading,
    customersTotal,
    customersPage,
    customersLimit,
    customersPagination,
    
    orderCache,
    customerCache,
    lastOrdersFetch,
    lastCustomersFetch,
    cacheExpiry,
    
    selectedOrderIds,
    selectedCustomerIds,
    orderFilters,
    customerFilters,
    
    // Computed
    ordersCount,
    customersCount,
    hasOrdersCache,
    hasCustomersCache,
    getOrdersStatistics,
    getCustomersStatistics,
    
    // Orders Actions
    fetchOrders,
    getOrderById,
    createOrder,
    updateOrder,
    approveOrder,
    cancelOrder,
    
    // Customers Actions
    fetchCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    
    // Utility Actions
    clearOrdersCache,
    clearCustomersCache,
    clearAllCache,
    setOrderFilters,
    setCustomerFilters,
    selectOrders,
    selectCustomers,
    clearSelections,
    batchApproveOrders,
    
    // Additional utility methods for forms
    // 获取基地列表（直接调用基地服务）
    getBases: async () => {
      try {
        console.log('🔄 salesStore.getBases: 直接调用基地服务...')
        // 直接使用基地API，和牛场管理模块一样
        const { baseApi } = await import('@/api/base')
        const response = await baseApi.getBases()
        console.log('✅ salesStore.getBases: 基地数据获取成功:', response)
        return response
      } catch (error) {
        console.error('❌ salesStore.getBases: 获取基地列表失败:', error)
        throw error
      }
    },
    getCattle: async (params: any = {}) => {
      try {
        console.log('🔄 salesStore.getCattle: 直接调用牛只服务...', params)
        // 直接使用牛只 API
        const { CattleServiceApi } = await import('@/api/microservices')
        const cattleApi = new CattleServiceApi()
        const response = await cattleApi.getCattleList(params)
        console.log('✅ salesStore.getCattle: 牛只数据获取成功:', response)
        return response
      } catch (error) {
        console.error('❌ salesStore.getCattle: 获取牛只列表失败:', error)
        throw error
      }
    },
    getMaterials: async (params: any = {}) => {
      try {
        console.log('🔄 salesStore.getMaterials: 调用销售服务获取物资...', params)
        const response = await salesApi.getMaterials(params)
        console.log('✅ salesStore.getMaterials: 物资数据获取成功:', response)
        return response
      } catch (error) {
        console.error('❌ salesStore.getMaterials: 获取物资列表失败:', error)
        // 物资服务可能不可用，返回空数据而不是抛出错误
        return { data: [] }
      }
    },
    getEquipment: async (params: any = {}) => {
      try {
        console.log('🔄 salesStore.getEquipment: 调用销售服务获取设备...', params)
        const response = await salesApi.getEquipment(params)
        console.log('✅ salesStore.getEquipment: 设备数据获取成功:', response)
        return response
      } catch (error) {
        console.error('❌ salesStore.getEquipment: 获取设备列表失败:', error)
        // 设备服务可能不可用，返回空数据而不是抛出错误
        return { data: [] }
      }
    }
  }
})