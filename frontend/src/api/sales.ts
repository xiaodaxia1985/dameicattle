import request from './request'
import type { ApiResponse } from './request'

export const salesApi = {
  // 获取销售订单列表
  getOrders(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/sales/orders', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取客户列表
  getCustomers(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/customers', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 创建销售订单
  createOrder(data: any): Promise<{ data: any }> {
    return request.post<ApiResponse<any>>('/sales/orders', data)
      .then(response => ({ data: response.data.data }))
  }
}