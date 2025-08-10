import { cattleServiceApi } from './microservices'

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
  async getList(params: CattleListParams = {}): Promise<CattleListResponse> {
    try {
      console.log('cattleApi.getList 调用，参数:', params)
      const response = await cattleServiceApi.getCattleList(params)
      console.log('cattleApi.getList 原始响应:', response)
      
      // 后端返回的数据结构是 { data: { cattle: [...], pagination: {...} } }
      const responseData = response.data || {}
      const data = Array.isArray(responseData.cattle) ? responseData.cattle : []
      const pagination = responseData.pagination || {}
      
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

  // 获取牛只统计
  async getStatistics(baseId?: number): Promise<CattleStatistics> {
    try {
      const response = await cattleServiceApi.getCattleStatistics(baseId)
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

  // 获取牛只详情
  async getById(id: number): Promise<Cattle> {
    try {
      const response = await cattleServiceApi.getCattle(id)
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
    const response = await cattleServiceApi.getCattle(id)
    return { data: response.data }
  },

  // 通过耳标获取牛只信息
  async getByEarTag(earTag: string): Promise<Cattle> {
    if (!earTag || typeof earTag !== 'string') {
      throw new Error('Invalid ear tag provided')
    }
    try {
      const response = await cattleServiceApi.getCattleByEarTag(earTag)
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid cattle data received')
      }
      return response.data
    } catch (error) {
      console.error('通过耳标获取牛只信息失败:', error)
      throw error
    }
  },

  // 创建牛只记录
  async create(data: CreateCattleRequest): Promise<Cattle> {
    try {
      const response = await cattleServiceApi.createCattle(data)
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid cattle data received')
      }
      return response.data
    } catch (error) {
      console.error('创建牛只失败:', error)
      throw error
    }
  },

  // 更新牛只信息
  async update(id: number, data: UpdateCattleRequest): Promise<Cattle> {
    try {
      const response = await cattleServiceApi.updateCattle(id, data)
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid cattle data received')
      }
      return response.data
    } catch (error) {
      console.error('更新牛只失败:', error)
      throw error
    }
  },

  // 删除牛只记录
  async delete(id: number): Promise<void> {
    if (!id || typeof id !== 'number') {
      throw new Error('Invalid cattle ID provided')
    }
    try {
      await cattleServiceApi.deleteCattle(id)
    } catch (error) {
      console.error('删除牛只失败:', error)
      throw error
    }
  },

  // 获取牛只生命周期事件
  async getEvents(cattleId: number, params?: { page?: number; limit?: number }): Promise<{ data: CattleEvent[]; pagination: any }> {
    try {
      const response = await cattleServiceApi.getCattleEvents(cattleId, params)
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

  // 获取事件类型
  async getEventTypes(): Promise<Array<{ value: string; label: string; category: string }>> {
    try {
      const response = await cattleServiceApi.get('/events/types')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('获取事件类型失败:', error)
      return []
    }
  },

  // 添加牛只事件
  async addEvent(cattleId: number, event: Omit<CattleEvent, 'id' | 'cattle_id' | 'operator_id' | 'created_at' | 'updated_at'>): Promise<CattleEvent> {
    try {
      const response = await cattleServiceApi.addCattleEvent(cattleId, event)
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid event data received')
      }
      return response.data
    } catch (error) {
      console.error('添加牛只事件失败:', error)
      throw error
    }
  },

  // 批量导入牛只
  async batchImport(file: File): Promise<BatchImportResponse> {
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided')
    }
    try {
      const response = await cattleServiceApi.batchImportCattle(file)
      const data = response.data || {}
      return {
        imported_count: typeof data.imported_count === 'number' ? data.imported_count : 0,
        cattle: Array.isArray(data.cattle) ? data.cattle : []
      }
    } catch (error) {
      console.error('批量导入牛只失败:', error)
      throw error
    }
  },

  // 获取导入模板
  async getImportTemplate(): Promise<Blob> {
    try {
      await cattleServiceApi.download('/batch/template', 'cattle_import_template.xlsx')
    } catch (error) {
      console.error('获取导入模板失败:', error)
      throw error
    }
  },

  // 导出牛只数据
  async export(params: CattleListParams = {}): Promise<Blob> {
    try {
      await cattleServiceApi.exportCattle(params)
    } catch (error) {
      console.error('导出牛只数据失败:', error)
      throw error
    }
  },

  // 生成耳标
  async generateEarTags(data: GenerateEarTagsRequest): Promise<GenerateEarTagsResponse> {
    if (!data || !data.prefix || !data.count) {
      throw new Error('Invalid ear tag generation parameters')
    }
    try {
      const response = await cattleServiceApi.generateEarTags(data)
      return {
        ear_tags: Array.isArray(response.data.ear_tags) ? response.data.ear_tags : [],
        prefix: typeof response.data.prefix === 'string' ? response.data.prefix : data.prefix,
        count: typeof response.data.count === 'number' ? response.data.count : 0
      }
    } catch (error) {
      console.error('生成耳标失败:', error)
      throw error
    }
  },

  // 批量转移牛只
  async batchTransfer(data: BatchTransferRequest): Promise<{ transferred_count: number; cattle: Cattle[] }> {
    if (!data || !Array.isArray(data.cattle_ids) || data.cattle_ids.length === 0) {
      throw new Error('Invalid transfer parameters')
    }
    try {
      const response = await cattleServiceApi.batchTransferCattle(data)
      return {
        transferred_count: typeof response.data.transferred_count === 'number' ? response.data.transferred_count : 0,
        cattle: Array.isArray(response.data.cattle) ? response.data.cattle : []
      }
    } catch (error) {
      console.error('批量转移牛只失败:', error)
      throw error
    }
  }
}