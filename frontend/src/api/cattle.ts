import request from './request'
import type { ApiResponse } from './request'

// 牛只相关类型定义
export interface Cattle {
  id: number
  ear_tag: string
  breed: string
  gender: 'male' | 'female'
  birth_date?: string
  weight?: number
  health_status: 'healthy' | 'sick' | 'treatment'
  base_id: number
  barn_id?: number
  photos?: string[]
  parent_male_id?: number
  parent_female_id?: number
  source: 'born' | 'purchased' | 'transferred'
  purchase_price?: number
  purchase_date?: string
  supplier_id?: number
  status: 'active' | 'sold' | 'dead' | 'transferred'
  notes?: string
  created_at: string
  updated_at: string
  age_months?: number
  age_days?: number
  base?: {
    id: number
    name: string
    code: string
  }
  barn?: {
    id: number
    name: string
    code: string
  }
  father?: {
    id: number
    ear_tag: string
    breed: string
  }
  mother?: {
    id: number
    ear_tag: string
    breed: string
  }
}

export interface CattleListParams {
  page?: number
  limit?: number
  baseId?: number
  barnId?: number
  breed?: string
  gender?: 'male' | 'female'
  healthStatus?: 'healthy' | 'sick' | 'treatment'
  status?: 'active' | 'sold' | 'dead' | 'transferred'
  search?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface CattleListResponse {
  data: Cattle[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface CreateCattleRequest {
  ear_tag: string
  breed: string
  gender: 'male' | 'female'
  birth_date?: string
  weight?: number
  base_id: number
  barn_id?: number
  photos?: string[]
  parent_male_id?: number
  parent_female_id?: number
  source?: 'born' | 'purchased' | 'transferred'
  purchase_price?: number
  purchase_date?: string
  supplier_id?: number
  notes?: string
}

export interface UpdateCattleRequest {
  ear_tag?: string
  breed?: string
  weight?: number
  health_status?: 'healthy' | 'sick' | 'treatment'
  barn_id?: number
  photos?: string[]
  notes?: string
}

export interface CattleEvent {
  id: number
  cattle_id: number
  event_type: string
  event_date: string
  description?: string
  data?: any
  operator_id?: number
  created_at: string
  updated_at: string
  cattle?: {
    id: number
    ear_tag: string
    breed: string
    gender: string
  }
  operator?: {
    id: number
    real_name: string
  }
}

export interface CattleStatistics {
  total: number
  health_status: Array<{
    health_status: string
    count: number
  }>
  gender: Array<{
    gender: string
    count: number
  }>
  breeds: Array<{
    breed: string
    count: number
  }>
}

export interface BatchImportResponse {
  imported_count: number
  cattle: Cattle[]
}

export interface BatchTransferRequest {
  cattle_ids: number[]
  from_barn_id?: number
  to_barn_id?: number
  reason?: string
}

export interface GenerateEarTagsRequest {
  prefix: string
  count: number
  startNumber?: number
}

export interface GenerateEarTagsResponse {
  ear_tags: string[]
  prefix: string
  count: number
}

export const cattleApi = {
  // 获取牛只列表
  getList(params: CattleListParams = {}): Promise<CattleListResponse> {
    console.log('cattleApi.getList 调用，参数:', params)
    return request.get('/cattle', { params })
      .then(response => {
        console.log('cattleApi.getList 原始响应:', response)
        const responseData = response.data
        console.log('cattleApi.getList 响应数据:', responseData)
        
        // 后端返回的是 {success: true, data: [...], pagination: {...}} 格式
        const result: CattleListResponse = {
          data: responseData.data || [],
          pagination: responseData.pagination || {
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0
          }
        }
        
        console.log('cattleApi.getList 处理后数据:', result)
        return result
      })
      .catch(error => {
        console.error('cattleApi.getList 请求失败:', error)
        throw error
      })
  },

  // 获取牛只统计
  getStatistics(baseId?: number): Promise<CattleStatistics> {
    return request.get<ApiResponse<CattleStatistics>>('/cattle/statistics', { 
      params: baseId ? { baseId } : {} 
    }).then(response => response.data.data)
  },

  // 获取牛只详情
  getById(id: number): Promise<Cattle> {
    return request.get<ApiResponse<Cattle>>(`/cattle/${id}`)
      .then(response => response.data.data)
  },

  // 通过耳标获取牛只信息
  getByEarTag(earTag: string): Promise<Cattle> {
    return request.get<ApiResponse<Cattle>>(`/cattle/scan/${earTag}`)
      .then(response => response.data.data)
  },

  // 创建牛只记录
  create(data: CreateCattleRequest): Promise<Cattle> {
    return request.post<ApiResponse<Cattle>>('/cattle', data)
      .then(response => response.data.data)
  },

  // 更新牛只信息
  update(id: number, data: UpdateCattleRequest): Promise<Cattle> {
    return request.put<ApiResponse<Cattle>>(`/cattle/${id}`, data)
      .then(response => response.data.data)
  },

  // 删除牛只记录
  delete(id: number): Promise<void> {
    return request.delete(`/cattle/${id}`)
  },

  // 获取牛只生命周期事件
  getEvents(cattleId: number, params?: { page?: number; limit?: number }): Promise<{ data: CattleEvent[]; pagination: any }> {
    return request.get<ApiResponse<{ data: CattleEvent[]; pagination: any }>>(`/cattle/${cattleId}/events`, { params })
      .then(response => response.data.data)
  },

  // 获取事件类型
  getEventTypes(): Promise<Array<{ value: string; label: string; category: string }>> {
    return request.get<ApiResponse<Array<{ value: string; label: string; category: string }>>>('/cattle/events/types')
      .then(response => response.data.data)
  },

  // 添加牛只事件
  addEvent(cattleId: number, event: Omit<CattleEvent, 'id' | 'cattle_id' | 'operator_id' | 'created_at' | 'updated_at'>): Promise<CattleEvent> {
    return request.post<ApiResponse<CattleEvent>>(`/cattle/${cattleId}/events`, { ...event, cattle_id: cattleId })
      .then(response => response.data.data)
  },

  // 批量导入牛只
  batchImport(file: File): Promise<BatchImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<ApiResponse<BatchImportResponse>>('/cattle/batch/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => response.data.data)
  },

  // 获取导入模板
  getImportTemplate(): Promise<Blob> {
    return request.get('/cattle/batch/template', { 
      responseType: 'blob'
    }).then(response => response.data)
  },

  // 导出牛只数据
  export(params: CattleListParams = {}): Promise<Blob> {
    return request.get('/cattle/batch/export', { 
      params,
      responseType: 'blob'
    }).then(response => response.data)
  },

  // 生成耳标
  generateEarTags(data: GenerateEarTagsRequest): Promise<GenerateEarTagsResponse> {
    return request.post<ApiResponse<GenerateEarTagsResponse>>('/cattle/batch/generate-tags', data)
      .then(response => response.data.data)
  },

  // 批量转移牛只
  batchTransfer(data: BatchTransferRequest): Promise<{ transferred_count: number; cattle: Cattle[] }> {
    return request.post<ApiResponse<{ transferred_count: number; cattle: Cattle[] }>>('/cattle/batch/transfer', data)
      .then(response => response.data.data)
  }
}