import { apiService } from '@/utils/request'

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
  // 获取牛只列表 - 使用安全数据访问
  async getList(params: CattleListParams = {}): Promise<CattleListResponse> {
    try {
      console.log('cattleApi.getList 调用，参数:', params)
      const response = await apiService.get('/cattle', params)
      console.log('cattleApi.getList 原始响应:', response)
      
      // 后端返回 { success: true, data: [], pagination: {} }
      const data = Array.isArray(response.data) ? response.data : []
      const pagination = response.pagination || {}
      
      const result: CattleListResponse = {
        data,
        pagination: {
          total: typeof pagination.total === 'number' ? pagination.total : 0,
          page: typeof pagination.page === 'number' ? Math.max(1, pagination.page) : 1,
          limit: typeof pagination.limit === 'number' ? Math.max(1, pagination.limit) : 20,
          totalPages: typeof pagination.totalPages === 'number' ? Math.max(1, pagination.totalPages) : Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || 20)))
        }
      }
      
      console.log('cattleApi.getList 处理后数据:', result)
      return result
    } catch (error) {
      console.error('cattleApi.getList 请求失败:', error)
      // 返回安全的默认值而不是抛出错误
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    }
  },

  // 获取牛只统计 - 使用安全数据访问
  async getStatistics(baseId?: number): Promise<CattleStatistics> {
    try {
      const params = baseId ? { baseId } : {}
      const response = await apiService.get('/cattle/statistics', params)
      const data = response.data || {}
      return {
        total: typeof data.total === 'number' ? data.total : 0,
        health_status: Array.isArray(data.health_status) ? data.health_status : [],
        gender: Array.isArray(data.gender) ? data.gender : [],
        breeds: Array.isArray(data.breeds) ? data.breeds : []
      }
    } catch (error) {
      console.error('获取牛只统计失败:', error)
      return {
        total: 0,
        health_status: [],
        gender: [],
        breeds: []
      }
    }
  },

  // 获取牛只详情 - 使用安全数据访问
  async getById(id: number): Promise<Cattle> {
    try {
      const response = await apiService.get(`/cattle/${id}`)
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid cattle data received')
      }
      return response.data
    } catch (error) {
      console.error('获取牛只详情失败:', error)
      throw error
    }
  },

  // 获取牛只详情 (别名方法)
  async getCattle(id: number): Promise<{ data: Cattle }> {
    const cattle = await this.getById(id)
    return { data: cattle }
  },

  // 通过耳标获取牛只信息 - 使用安全数据访问
  async getByEarTag(earTag: string): Promise<Cattle> {
    if (!earTag || typeof earTag !== 'string') {
      throw new Error('Invalid ear tag provided')
    }
    try {
      const response = await apiService.get(`/cattle/scan/${earTag}`)
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid cattle data received')
      }
      return response.data
    } catch (error) {
      console.error('通过耳标获取牛只信息失败:', error)
      throw error
    }
  },

  // 创建牛只记录 - 使用安全数据访问
  async create(data: CreateCattleRequest): Promise<Cattle> {
    try {
      const response = await apiService.post('/cattle', data)
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid cattle data received')
      }
      return response.data
    } catch (error) {
      console.error('创建牛只失败:', error)
      throw error
    }
  },

  // 更新牛只信息 - 使用安全数据访问
  async update(id: number, data: UpdateCattleRequest): Promise<Cattle> {
    try {
      const response = await apiService.put(`/cattle/${id}`, data)
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid cattle data received')
      }
      return response.data
    } catch (error) {
      console.error('更新牛只失败:', error)
      throw error
    }
  },

  // 删除牛只记录 - 使用安全数据访问
  async delete(id: number): Promise<void> {
    if (!id || typeof id !== 'number') {
      throw new Error('Invalid cattle ID provided')
    }
    try {
      await apiService.delete(`/cattle/${id}`)
    } catch (error) {
      console.error('删除牛只失败:', error)
      throw error
    }
  },

  // 获取牛只生命周期事件 - 使用安全数据访问
  async getEvents(cattleId: number, params?: { page?: number; limit?: number }): Promise<{ data: CattleEvent[]; pagination: any }> {
    try {
      const response = await apiService.get(`/cattle/${cattleId}/events`, params)
      return {
        data: Array.isArray(response.data) ? response.data : [],
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    } catch (error) {
      console.error('获取牛只事件失败:', error)
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    }
  },

  // 获取事件类型 - 使用安全数据访问
  async getEventTypes(): Promise<Array<{ value: string; label: string; category: string }>> {
    try {
      const response = await apiService.get('/cattle/events/types')
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error('获取事件类型失败:', error)
      return []
    }
  },

  // 添加牛只事件 - 使用安全数据访问
  async addEvent(cattleId: number, event: Omit<CattleEvent, 'id' | 'cattle_id' | 'operator_id' | 'created_at' | 'updated_at'>): Promise<CattleEvent> {
    try {
      const response = await apiService.post(`/cattle/${cattleId}/events`, { ...event, cattle_id: cattleId })
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid event data received')
      }
      return response
    } catch (error) {
      console.error('添加牛只事件失败:', error)
      throw error
    }
  },

  // 批量导入牛只 - 使用安全数据访问
  async batchImport(file: File): Promise<BatchImportResponse> {
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided')
    }
    try {
      // 注意：文件上传需要特殊处理，暂时使用fetch直接上传
      const formData = new FormData()
      formData.append('file', file)
      
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/cattle/batch/import', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const result = await response.json()
      const data = result.data || {}
      return {
        imported_count: typeof data.imported_count === 'number' ? data.imported_count : 0,
        cattle: Array.isArray(data.cattle) ? data.cattle : []
      }
    } catch (error) {
      console.error('批量导入牛只失败:', error)
      throw error
    }
  },

  // 获取导入模板 - 使用安全数据访问
  async getImportTemplate(): Promise<Blob> {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/cattle/batch/template', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const blob = await response.blob()
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid template data received')
      }
      return blob
    } catch (error) {
      console.error('获取导入模板失败:', error)
      throw error
    }
  },

  // 导出牛只数据 - 使用安全数据访问
  async export(params: CattleListParams = {}): Promise<Blob> {
    try {
      const token = localStorage.getItem('token')
      const queryString = new URLSearchParams(params as any).toString()
      const url = `/api/v1/cattle/batch/export${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const blob = await response.blob()
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid export data received')
      }
      return blob
    } catch (error) {
      console.error('导出牛只数据失败:', error)
      throw error
    }
  },

  // 生成耳标 - 使用安全数据访问
  async generateEarTags(data: GenerateEarTagsRequest): Promise<GenerateEarTagsResponse> {
    if (!data || !data.prefix || !data.count) {
      throw new Error('Invalid ear tag generation parameters')
    }
    try {
      const response = await apiService.post('/cattle/batch/generate-tags', data)
      return {
        ear_tags: Array.isArray(response.ear_tags) ? response.ear_tags : [],
        prefix: typeof response.prefix === 'string' ? response.prefix : data.prefix,
        count: typeof response.count === 'number' ? response.count : 0
      }
    } catch (error) {
      console.error('生成耳标失败:', error)
      throw error
    }
  },

  // 批量转移牛只 - 使用安全数据访问
  async batchTransfer(data: BatchTransferRequest): Promise<{ transferred_count: number; cattle: Cattle[] }> {
    if (!data || !Array.isArray(data.cattle_ids) || data.cattle_ids.length === 0) {
      throw new Error('Invalid transfer parameters')
    }
    try {
      const response = await apiService.post('/cattle/batch/transfer', data)
      return {
        transferred_count: typeof response.transferred_count === 'number' ? response.transferred_count : 0,
        cattle: Array.isArray(response.cattle) ? response.cattle : []
      }
    } catch (error) {
      console.error('批量转移牛只失败:', error)
      throw error
    }
  }
}