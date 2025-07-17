import request from './request'
import type { ApiResponse } from './request'

// 牛只相关类型定义
export interface Cattle {
  id: string
  earTag: string
  breed: string
  gender: 'male' | 'female'
  birthDate: string
  weight: number
  healthStatus: 'healthy' | 'sick' | 'treatment'
  baseId: number
  barnId: number
  photos: string[]
  createdAt: string
  updatedAt: string
}

export interface CattleListParams {
  page?: number
  limit?: number
  baseId?: number
  barnId?: number
  breed?: string
  gender?: 'male' | 'female'
  healthStatus?: 'healthy' | 'sick' | 'treatment'
  keyword?: string
}

export interface CattleListResponse {
  data: Cattle[]
  total: number
  page: number
  limit: number
}

export interface CreateCattleRequest {
  earTag: string
  breed: string
  gender: 'male' | 'female'
  birthDate: string
  weight: number
  baseId: number
  barnId: number
  photos?: string[]
}

export interface UpdateCattleRequest {
  breed?: string
  weight?: number
  healthStatus?: 'healthy' | 'sick' | 'treatment'
  baseId?: number
  barnId?: number
  photos?: string[]
}

export interface CattleEvent {
  id: string
  cattleId: string
  eventType: string
  eventDate: string
  description: string
  operatorId: string
  operatorName: string
  createdAt: string
}

export interface BatchImportResponse {
  success: number
  failed: number
  errors: Array<{
    row: number
    message: string
  }>
}

export const cattleApi = {
  // 获取牛只列表
  getList(params: CattleListParams = {}): Promise<{ data: CattleListResponse }> {
    return request.get<ApiResponse<CattleListResponse>>('/cattle', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取牛只详情
  getById(id: string): Promise<{ data: Cattle }> {
    return request.get<ApiResponse<Cattle>>(`/cattle/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 通过耳标获取牛只信息
  getByEarTag(earTag: string): Promise<{ data: Cattle }> {
    return request.get<ApiResponse<Cattle>>(`/cattle/scan/${earTag}`)
      .then(response => ({ data: response.data.data }))
  },

  // 创建牛只记录
  create(data: CreateCattleRequest): Promise<{ data: Cattle }> {
    return request.post<ApiResponse<Cattle>>('/cattle', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新牛只信息
  update(id: string, data: UpdateCattleRequest): Promise<{ data: Cattle }> {
    return request.put<ApiResponse<Cattle>>(`/cattle/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除牛只记录
  delete(id: string): Promise<void> {
    return request.delete(`/cattle/${id}`)
  },

  // 批量删除牛只
  batchDelete(ids: string[]): Promise<void> {
    return request.delete('/cattle/batch', { data: { ids } })
  },

  // 获取牛只生命周期事件
  getEvents(cattleId: string): Promise<{ data: CattleEvent[] }> {
    return request.get<ApiResponse<CattleEvent[]>>(`/cattle/${cattleId}/events`)
      .then(response => ({ data: response.data.data }))
  },

  // 添加牛只事件
  addEvent(cattleId: string, event: Omit<CattleEvent, 'id' | 'cattleId' | 'operatorId' | 'operatorName' | 'createdAt'>): Promise<{ data: CattleEvent }> {
    return request.post<ApiResponse<CattleEvent>>(`/cattle/${cattleId}/events`, event)
      .then(response => ({ data: response.data.data }))
  },

  // 批量导入牛只
  batchImport(file: File): Promise<{ data: BatchImportResponse }> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<ApiResponse<BatchImportResponse>>('/cattle/batch-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => ({ data: response.data.data }))
  },

  // 导出牛只数据
  export(params: CattleListParams = {}): Promise<Blob> {
    return request.get('/cattle/export', { 
      params,
      responseType: 'blob'
    }).then(response => response.data)
  },

  // 生成耳标
  generateEarTags(count: number, prefix?: string): Promise<{ data: string[] }> {
    return request.post<ApiResponse<string[]>>('/cattle/generate-ear-tags', { count, prefix })
      .then(response => ({ data: response.data.data }))
  },

  // 打印耳标
  printEarTags(earTags: string[]): Promise<{ data: { printUrl: string } }> {
    return request.post<ApiResponse<{ printUrl: string }>>('/cattle/print-ear-tags', { earTags })
      .then(response => ({ data: response.data.data }))
  }
}