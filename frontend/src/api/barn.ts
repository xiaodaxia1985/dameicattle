import { baseServiceApi } from './microservices'

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
  base?: {
    id: number
    name: string
    code: string
  }
  utilization_rate?: number
  available_capacity?: number
}

export interface BarnListParams {
  page?: number
  limit?: number
  base_id?: number
  barn_type?: string
  search?: string
}

export interface BarnCreateData {
  name: string
  code: string
  base_id: number
  barn_type: string
  capacity: number
  description?: string
  facilities?: object
}

export interface BarnUpdateData extends Partial<BarnCreateData> { }

export interface BarnListResponse {
  success: boolean
  data: {
    barns: Barn[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
}

export interface BarnDetailResponse {
  success: boolean
  data: Barn
}

export interface BarnStatisticsResponse {
  success: boolean
  data: {
    overview: {
      total_barns: number
      total_capacity: number
      total_current_count: number
      total_available_capacity: number
      average_utilization: number
    }
    type_statistics: Record<string, any>
    utilization_distribution: {
      low: number
      medium: number
      high: number
    }
    barns: Barn[]
  }
}

export interface BarnOptionsResponse {
  success: boolean
  data: Array<{
    value: number
    label: string
    capacity: number
    current_count: number
    available_capacity: number
    barn_type: string
    disabled: boolean
  }>
}

export const barnApi = {
  // 获取牛棚列表
  async getBarns(params: BarnListParams = {}): Promise<BarnListResponse> {
    const response = await baseServiceApi.getBarns(params.base_id, params)
    return { success: true, data: response.data }
  },

  // 获取牛棚详情
  async getBarn(id: number): Promise<BarnDetailResponse> {
    const response = await baseServiceApi.getBarn(id)
    return { success: true, data: response.data }
  },

  // 创建牛棚
  async createBarn(data: BarnCreateData): Promise<BarnDetailResponse> {
    const response = await baseServiceApi.createBarn(data)
    return { success: true, data: response.data }
  },

  // 更新牛棚
  async updateBarn(id: number, data: BarnUpdateData): Promise<BarnDetailResponse> {
    const response = await baseServiceApi.updateBarn(id, data)
    return { success: true, data: response.data }
  },

  // 删除牛棚
  async deleteBarn(id: number): Promise<{ success: boolean; message: string }> {
    await baseServiceApi.deleteBarn(id)
    return { success: true, message: '删除成功' }
  },

  // 获取牛棚统计信息
  async getStatistics(params: { base_id?: number } = {}): Promise<BarnStatisticsResponse> {
    const response = await baseServiceApi.get('/barns/statistics', params)
    return { success: true, data: response.data }
  },

  // 获取牛棚选项（用于下拉选择）
  async getBarnOptions(params: { base_id?: number } = {}): Promise<BarnOptionsResponse> {
    const response = await baseServiceApi.get('/barns/options', params)
    return { success: true, data: response.data }
  }
}