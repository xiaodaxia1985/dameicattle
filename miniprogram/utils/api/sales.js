// 销售管理API
import { apiService } from '../request'

export const salesApi = {
  // 销售订单
  getOrders: (params) => apiService.get('/sales-orders', params),
  getOrder: (id) => apiService.get(`/sales-orders/${id}`),
  createOrder: (data) => apiService.post('/sales-orders', data),
  updateOrder: (id, data) => apiService.put(`/sales-orders/${id}`, data),
  approveOrder: (id) => apiService.post(`/sales-orders/${id}/approve`),
  cancelOrder: (id, reason) => apiService.post(`/sales-orders/${id}/cancel`, { reason }),
  updateDeliveryStatus: (id, data) => apiService.post(`/sales-orders/${id}/delivery`, data),
  updatePaymentStatus: (id, data) => apiService.post(`/sales-orders/${id}/payment`, data),
  
  // 销售统计
  getStatistics: (params) => apiService.get('/sales-orders/statistics', params),
  
  // 客户管理
  getCustomers: (params) => apiService.get('/customers', params),
  getCustomer: (id) => apiService.get(`/customers/${id}`),
  createCustomer: (data) => apiService.post('/customers', data),
  updateCustomer: (id, data) => apiService.put(`/customers/${id}`, data),
  deleteCustomer: (id) => apiService.delete(`/customers/${id}`),
  
  // 客户评级
  updateCustomerRating: (id, data) => apiService.put(`/customers/${id}/rating`, data),
  
  // 客户统计
  getCustomerStatistics: (id, params) => apiService.get(`/customers/${id}/statistics`, params),
  
  // 客户回访记录
  getCustomerVisits: (customerId, params) => apiService.get(`/customers/${customerId}/visits`, params),
  createCustomerVisit: (customerId, data) => apiService.post(`/customers/${customerId}/visits`, data),
  updateCustomerVisit: (id, data) => apiService.put(`/customers/visits/${id}`, data),
  
  // 客户类型
  getCustomerTypes: () => apiService.get('/customers/types'),
  
  // 客户价值分析
  getCustomerValueAnalysis: (params) => apiService.get('/customers/value-analysis', params)
}

export default salesApi