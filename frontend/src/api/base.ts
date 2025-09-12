import { baseServiceApi } from './microservices'

// 基地管理相关类型定义
export interface Base {
  id: number
  name: string
  code: string
  address: string
  area: number
  capacity: number
  manager_name?: string
  manager_phone?: string
  description?: string
  location?: {
    latitude: number
    longitude: number
  }
  facilities?: string[]
  status: 'active' | 'inactive' | 'maintenance'
  created_at: string
  updated_at: string
  barn_count?: number
  cattle_count?: number
}

export interface Barn {
  id: number
  base_id: number
  name: string
  code: string
  barn_type: 'breeding' | 'fattening' | 'calving' | 'quarantine' | 'hospital'
  capacity: number
  current_count: number
  area: number
  location?: string
  equipment?: string[]
  environment?: {
    temperature_range: [number, number]
    humidity_range: [number, number]
    ventilation: string
  }
  status: 'active' | 'inactive' | 'maintenance' | 'full'
  notes?: string
  created_at: string
  updated_at: string
  base?: Base
}

export interface BaseStatistics {
  total_bases: number
  active_bases: number
  total_barns: number
  total_capacity: number
  current_cattle_count: number
  utilization_rate: number
  base_distribution: Array<{
    base_id: number
    base_name: string
    cattle_count: number
    capacity: number
    utilization_rate: number
  }>
}

export const baseApi = {
  // 获取基地列表
  async getBases(params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ data: { bases: Base[] }; pagination: any }> {
    try {
      const response = await baseServiceApi.getBases(params)
      
      // 处理不同的响应结构
      let bases = []
      if (response.data?.bases) {
        bases = response.data.bases
      } else if (Array.isArray(response.data)) {
        bases = response.data
      } else if (response.data?.data) {
        bases = response.data.data
      }
      
      return {
        data: { bases: Array.isArray(bases) ? bases : [] },
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    } catch (error) {
      console.error('获取基地列表失败:', error)
      return {
        data: { bases: [] },
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    }
  },

  // 获取基地详情
  async getBase(id: number): Promise<{ data: Base }> {
    try {
      const response = await baseServiceApi.getBase(id)
      return { data: response.data }
    } catch (error) {
      console.error('获取基地详情失败:', error)
      throw error
    }
  },

  // 创建基地
  async createBase(data: Omit<Base, 'id' | 'created_at' | 'updated_at' | 'barn_count' | 'cattle_count'>): Promise<Base> {
    try {
      const response = await baseServiceApi.createBase(data)
      return response.data
    } catch (error) {
      console.error('创建基地失败:', error)
      throw error
    }
  },

  // 更新基地
  async updateBase(id: number, data: Partial<Base>): Promise<Base> {
    try {
      const response = await baseServiceApi.updateBase(id, data)
      return response.data
    } catch (error) {
      console.error('更新基地失败:', error)
      throw error
    }
  },

  // 删除基地
  async deleteBase(id: number): Promise<void> {
    try {
      await baseServiceApi.deleteBase(id)
    } catch (error) {
      console.error('删除基地失败:', error)
      throw error
    }
  },

  // 获取牛舍列表
  async getBarns(params?: {
    base_id?: number
    barn_type?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<{ data: Barn[]; pagination: any }> {
    try {
      const response = await baseServiceApi.getBarns(params?.base_id, params)
      
      // 处理不同的响应结构
      let barns = []
      if (response.data?.barns) {
        barns = response.data.barns
      } else if (Array.isArray(response.data)) {
        barns = response.data
      } else if (response.data?.data) {
        barns = response.data.data
      }
      
      return {
        data: Array.isArray(barns) ? barns : [],
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    } catch (error) {
      console.error('获取牛舍列表失败:', error)
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    }
  },

  // 根据基地ID获取牛舍列表
  async getBarnsByBaseId(baseId: number): Promise<Barn[]> {
    try {
      const response = await baseServiceApi.getBarns(baseId)
      
      // 增强健壮性，先检查 response 是否存在
      if (!response) {
        return []
      }
      
      // 处理不同的响应结构
      if (response.data?.barns) {
        return response.data.barns
      } else if (Array.isArray(response.data)) {
        return response.data
      } else if (response.data?.data) {
        return response.data.data
      }
      
      return []
    } catch (error) {
      console.error('获取基地牛舍失败:', error)
      return []
    }
  },

  // 获取牛舍详情
  async getBarn(id: number): Promise<{ data: Barn }> {
    try {
      const response = await baseServiceApi.getBarn(id)
      return { data: response.data }
    } catch (error) {
      console.error('获取牛舍详情失败:', error)
      throw error
    }
  },

  // 创建牛舍
  async createBarn(data: Omit<Barn, 'id' | 'created_at' | 'updated_at' | 'current_count'>): Promise<Barn> {
    try {
      const response = await baseServiceApi.createBarn(data)
      return response.data
    } catch (error) {
      console.error('创建牛舍失败:', error)
      throw error
    }
  },

  // 更新牛舍
  async updateBarn(id: number, data: Partial<Barn>): Promise<Barn> {
    try {
      const response = await baseServiceApi.updateBarn(id, data)
      return response.data
    } catch (error) {
      console.error('更新牛舍失败:', error)
      throw error
    }
  },

  // 删除牛舍
  async deleteBarn(id: number): Promise<void> {
    try {
      await baseServiceApi.deleteBarn(id)
    } catch (error) {
      console.error('删除牛舍失败:', error)
      throw error
    }
  },

  // 获取基地统计
  async getBaseStatistics(): Promise<{ data: BaseStatistics }> {
    try {
      // 尝试使用更通用的路径格式
      let response
      try {
        response = await baseServiceApi.get('/statistics')
      } catch (error) {
        // 如果路径不存在，直接返回默认空数据
        return {
          data: {
            total_bases: 0,
            active_bases: 0,
            total_barns: 0,
            total_capacity: 0,
            current_cattle_count: 0,
            utilization_rate: 0,
            base_distribution: []
          }
        }
      }
      
      const data = response.data || {}
      
      return {
        data: {
          total_bases: data.total_bases || 0,
          active_bases: data.active_bases || 0,
          total_barns: data.total_barns || 0,
          total_capacity: data.total_capacity || 0,
          current_cattle_count: data.current_cattle_count || 0,
          utilization_rate: data.utilization_rate || 0,
          base_distribution: Array.isArray(data.base_distribution) ? data.base_distribution : []
        }
      }
    } catch (error) {
      console.error('获取基地统计失败:', error)
      return {
        data: {
          total_bases: 0,
          active_bases: 0,
          total_barns: 0,
          total_capacity: 0,
          current_cattle_count: 0,
          utilization_rate: 0,
          base_distribution: []
        }
      }
    }
  }
}