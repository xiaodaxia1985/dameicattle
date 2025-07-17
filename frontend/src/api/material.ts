import request from './request'
import type { ApiResponse } from './request'

export const materialApi = {
  // 获取物资列表
  getMaterials(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/materials', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取库存信息
  getInventory(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/inventory', { params })
      .then(response => ({ data: response.data.data }))
  }
}