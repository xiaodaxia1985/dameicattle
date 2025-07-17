import request from './request'
import type { ApiResponse } from './request'

// 基地和牛棚相关类型定义
export interface Base {
  id: number
  name: string
  code: string
  address: string
  latitude: number
  longitude: number
  area: number
  managerId: number
  managerName: string
  createdAt: string
  updatedAt: string
}

export interface Barn {
  id: number
  name: string
  code: string
  baseId: number
  baseName: string
  capacity: number
  currentCount: number
  barnType: string
  createdAt: string
  updatedAt: string
}

export interface BaseListParams {
  page?: number
  limit?: number
  keyword?: string
  managerId?: number
}

export interface BaseListResponse {
  data: Base[]
  total: number
  page: number
  limit: number
}

export interface BarnListParams {
  page?: number
  limit?: number
  baseId?: number
  keyword?: string
  barnType?: string
}

export interface BarnListResponse {
  data: Barn[]
  total: number
  page: number
  limit: number
}

export interface CreateBaseRequest {
  name: string
  code: string
  address: string
  latitude?: number
  longitude?: number
  area?: number
  managerId?: number
}

export interface UpdateBaseRequest {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  area?: number
  managerId?: number
}

export interface CreateBarnRequest {
  name: string
  code: string
  baseId: number
  capacity: number
  barnType?: string
}

export interface UpdateBarnRequest {
  name?: string
  capacity?: number
  barnType?: string
}

export const baseApi = {
  // 获取基地列表
  getBases(params: BaseListParams = {}): Promise<{ data: BaseListResponse }> {
    return request.get<ApiResponse<BaseListResponse>>('/bases', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取所有基地（不分页）
  getAllBases(): Promise<{ data: Base[] }> {
    return request.get<ApiResponse<Base[]>>('/bases/all')
      .then(response => ({ data: response.data.data }))
  },

  // 获取基地详情
  getBaseById(id: number): Promise<{ data: Base }> {
    return request.get<ApiResponse<Base>>(`/bases/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 创建基地
  createBase(data: CreateBaseRequest): Promise<{ data: Base }> {
    return request.post<ApiResponse<Base>>('/bases', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新基地信息
  updateBase(id: number, data: UpdateBaseRequest): Promise<{ data: Base }> {
    return request.put<ApiResponse<Base>>(`/bases/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除基地
  deleteBase(id: number): Promise<void> {
    return request.delete(`/bases/${id}`)
  },

  // 获取基地统计信息
  getBaseStatistics(id: number): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>(`/bases/${id}/statistics`)
      .then(response => ({ data: response.data.data }))
  },

  // 获取基地GPS位置
  getBaseLocation(id: number): Promise<{ data: { latitude: number; longitude: number; address: string } }> {
    return request.get<ApiResponse<{ latitude: number; longitude: number; address: string }>>(`/bases/${id}/location`)
      .then(response => ({ data: response.data.data }))
  },

  // 获取牛棚列表
  getBarns(params: BarnListParams = {}): Promise<{ data: BarnListResponse }> {
    return request.get<ApiResponse<BarnListResponse>>('/barns', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取指定基地的牛棚列表
  getBarnsByBaseId(baseId: number): Promise<{ data: Barn[] }> {
    return request.get<ApiResponse<Barn[]>>(`/bases/${baseId}/barns`)
      .then(response => ({ data: response.data.data }))
  },

  // 获取牛棚详情
  getBarnById(id: number): Promise<{ data: Barn }> {
    return request.get<ApiResponse<Barn>>(`/barns/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 创建牛棚
  createBarn(data: CreateBarnRequest): Promise<{ data: Barn }> {
    return request.post<ApiResponse<Barn>>('/barns', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新牛棚信息
  updateBarn(id: number, data: UpdateBarnRequest): Promise<{ data: Barn }> {
    return request.put<ApiResponse<Barn>>(`/barns/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除牛棚
  deleteBarn(id: number): Promise<void> {
    return request.delete(`/barns/${id}`)
  },

  // 获取牛棚统计信息
  getBarnStatistics(id: number): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>(`/barns/${id}/statistics`)
      .then(response => ({ data: response.data.data }))
  }
}