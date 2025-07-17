import request from './request'
import type { ApiResponse } from './request'

export const userApi = {
  // 获取用户列表
  getUsers(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/users', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 创建用户
  createUser(data: any): Promise<{ data: any }> {
    return request.post<ApiResponse<any>>('/users', data)
      .then(response => ({ data: response.data.data }))
  }
}