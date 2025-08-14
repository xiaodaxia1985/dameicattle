import { baseServiceApi } from './microservices'

// 基地和牛棚相关类型定义
export interface Base {
  id: number
  name: string
  code: string
  address?: string
  latitude?: number
  longitude?: number
  area?: number
  manager_id?: number
  created_at: string
  updated_at: string
  // 关联数据
  manager?: {
    id: number
    real_name: string
    username: string
    phone?: string
    email?: string
  }
}

export interface Barn {
  id: number
  name: string
  code: string
  base_id: number
  capacity: number
  current_count: number
  barn_type?: string
  description?: string
  facilities?: object
  created_at: string
  updated_at: string
  // 关联数据
  base?: {
    id: number
    name: string
    code: string
  }
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
  async getBases(params: BaseListParams = {}): Promise<{ data: { bases: Base[], pagination: any } }> {
    try {
      console.log('🔍 baseApi.getBases 调用参数:', params)
      
      const response = await baseServiceApi.getBases(params)
      console.log('📥 baseServiceApi 原始响应:', response)
      
      // 直接解析微服务返回的数据
      const responseData = response?.data || response || {}
      console.log('📊 解析响应数据结构:', responseData)
      
      let bases = []
      let total = 0
      let page = 1
      let limit = 20
      
      // 处理不同的数据结构
      if (Array.isArray(responseData)) {
        // 直接是数组
        bases = responseData
        total = bases.length
      } else if (responseData.data && Array.isArray(responseData.data)) {
        // 有data字段且是数组
        bases = responseData.data
        total = responseData.total || responseData.pagination?.total || bases.length
        page = responseData.page || responseData.pagination?.page || 1
        limit = responseData.limit || responseData.pagination?.limit || 20
      } else if (responseData.bases && Array.isArray(responseData.bases)) {
        // 有bases字段且是数组
        bases = responseData.bases
        total = responseData.total || responseData.pagination?.total || bases.length
        page = responseData.page || responseData.pagination?.page || 1
        limit = responseData.limit || responseData.pagination?.limit || 20
      } else if (responseData.items && Array.isArray(responseData.items)) {
        // 有items字段且是数组
        bases = responseData.items
        total = responseData.total || responseData.pagination?.total || bases.length
        page = responseData.page || responseData.pagination?.page || 1
        limit = responseData.limit || responseData.pagination?.limit || 20
      }
      
      const result = { 
        data: {
          bases: bases,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        }
      }
      
      console.log('✅ baseApi.getBases 解析结果:', { 
        basesCount: bases.length, 
        total, 
        page, 
        limit,
        sampleBase: bases[0] || null
      })
      
      return result
    } catch (error) {
      console.error('获取基地列表失败:', error)
      return { 
        data: {
          bases: [],
          pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
        }
      }
    }
  },

  // 获取所有基地（不分页）
  async getAllBases(): Promise<{ data: Base[] }> {
    try {
      const response = await baseServiceApi.get('/bases/all')
      console.log('baseApi.getAllBases 原始响应:', response)
      
      // 安全获取数据
      const data = response?.data || []
      const validatedData = Array.isArray(data) ? data.filter(base => 
        base && typeof base === 'object' && base.id && base.name
      ) : []
      
      return { data: validatedData }
    } catch (error) {
      console.error('获取所有基地失败:', error)
      return { data: [] }
    }
  },

  // 获取基地详情
  async getBaseById(id: number): Promise<{ data: Base }> {
    const response = await baseServiceApi.getBase(id)
    return { data: response.data }
  },

  // 创建基地
  async createBase(data: CreateBaseRequest): Promise<{ data: Base }> {
    const response = await baseServiceApi.createBase(data)
    return { data: response.data }
  },

  // 更新基地信息
  async updateBase(id: number, data: UpdateBaseRequest): Promise<{ data: Base }> {
    const response = await baseServiceApi.updateBase(id, data)
    return { data: response.data }
  },

  // 删除基地
  async deleteBase(id: number): Promise<void> {
    await baseServiceApi.deleteBase(id)
  },

  // 获取基地统计信息
  async getBaseStatistics(id: number): Promise<{ data: any }> {
    const response = await baseServiceApi.get(`/bases/${id}/statistics`)
    return { data: response.data }
  },

  // 获取基地GPS位置
  async getBaseLocation(id: number): Promise<{ data: { latitude: number; longitude: number; address: string } }> {
    const response = await baseServiceApi.get(`/bases/${id}/location`)
    return { data: response.data }
  },

  // 获取牛棚列表
  async getBarns(params: BarnListParams = {}): Promise<{ data: BarnListResponse }> {
    const response = await baseServiceApi.getBarns(params?.baseId, params)
    return { data: response.data }
  },

  // 获取指定基地的牛棚列表
  async getBarnsByBaseId(baseId: number): Promise<{ data: { barns: Barn[], base_info: any } }> {
    const response = await baseServiceApi.get(`/bases/${baseId}/barns`)
    return { data: response.data }
  },

  // 获取牛棚详情
  async getBarnById(id: number): Promise<{ data: Barn }> {
    const response = await baseServiceApi.getBarn(id)
    return { data: response.data }
  },

  // 创建牛棚
  async createBarn(data: CreateBarnRequest): Promise<{ data: Barn }> {
    const response = await baseServiceApi.createBarn(data)
    return { data: response.data }
  },

  // 更新牛棚信息
  async updateBarn(id: number, data: UpdateBarnRequest): Promise<{ data: Barn }> {
    const response = await baseServiceApi.updateBarn(id, data)
    return { data: response.data }
  },

  // 删除牛棚
  async deleteBarn(id: number): Promise<void> {
    await baseServiceApi.deleteBarn(id)
  },

  // 获取牛棚统计信息
  async getBarnStatistics(id: number): Promise<{ data: any }> {
    const response = await baseServiceApi.get(`/barns/${id}/statistics`)
    return { data: response.data }
  },

  // 获取牛棚内的牛只列表
  async getBarnCattle(barnId: number): Promise<{ data: any[] }> {
    const response = await baseServiceApi.get(`/barns/${barnId}/cattle`)
    return { data: response.data }
  }
}