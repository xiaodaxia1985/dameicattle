import request from './request'
import type { ApiResponse } from './request'

// 牛棚相关类型定义
export interface Barn {
  id: number
  name: string
  code: string
  base_id: number
  capacity: number
  current_count: number
  barn_type?: string
  description?: string
  facilities?: any
  created_at: string
  updated_at: string
  utilization_rate?: number
  available_capacity?: number
  equipment_count?: number
  base?: {
    id: number
    name: string
    code: string
  }
}

export interface BarnListParams {
  page?: number
  limit?: number
  baseId?: number
  barnType?: string
  search?: string
}

export interface BarnListResponse {
  data: Barn[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateBarnRequest {
  name: string
  code: string
  base_id: number
  capacity: number
  barn_type?: string
  description?: string
  facilities?: any
}

export interface UpdateBarnRequest {
  name?: string
  code?: string
  capacity?: number
  barn_type?: string
  description?: string
  facilities?: any
}

export const barnApi = {
  // 获取牛棚列表
  getList(params: BarnListParams = {}): Promise<BarnListResponse> {
    return request.get<ApiResponse<BarnListResponse>>('/barns', { params })
      .then(response => response.data.data)
  },

  // 获取牛棚详情
  getById(id: number): Promise<Barn> {
    return request.get<ApiResponse<Barn>>(`/barns/${id}`)
      .then(response => response.data.data)
  },

  // 创建牛棚
  create(data: CreateBarnRequest): Promise<Barn> {
    return request.post<ApiResponse<Barn>>('/barns', data)
      .then(response => response.data.data)
  },

  // 更新牛棚
  update(id: number, data: UpdateBarnRequest): Promise<Barn> {
    return request.put<ApiResponse<Barn>>(`/barns/${id}`, data)
      .then(response => response.data.data)
  },

  // 删除牛棚
  delete(id: number): Promise<void> {
    return request.delete(`/barns/${id}`)
  }
}