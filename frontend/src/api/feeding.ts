import { feedingServiceApi } from './microservices'

// 饲喂管理相关类型定义
export interface FeedFormula {
  id: number
  name: string
  description?: string
  formula_type: 'concentrate' | 'roughage' | 'mixed'
  target_group: 'calf' | 'young' | 'adult' | 'pregnant' | 'lactating'
  ingredients: Array<{
    material_id: number
    material_name: string
    percentage: number
    amount_per_kg: number
  }>
  nutritional_info: {
    protein_content: number
    fat_content: number
    fiber_content: number
    energy_value: number
  }
  cost_per_kg: number
  status: 'active' | 'inactive' | 'draft'
  created_by: number
  created_at: string
  updated_at: string
}

export interface FeedingRecord {
  id: number
  cattle_id?: number
  base_id: number
  barn_id?: number
  formula_id: number
  feeding_date: string
  feeding_time: string
  amount: number
  actual_amount?: number
  cost: number
  weather_condition?: string
  temperature?: number
  humidity?: number
  operator_id: number
  notes?: string
  status: 'planned' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  formula?: FeedFormula
  base?: {
    id: number
    name: string
  }
  barn?: {
    id: number
    name: string
  }
  operator?: {
    id: number
    real_name: string
    username: string
  }
}

export interface FeedingStatistics {
  totalAmount: number
  totalCost: number
  avgDailyCost: number
  formulaUsage: Array<{
    formulaId: number
    formulaName: string
    amount: number
    cost: number
    percentage: number
  }>
  trend: Array<{
    date: string
    amount: number
    cost: number
  }>
}

export interface FeedingPlan {
  id: number
  base_id: number
  plan_name: string
  start_date: string
  end_date: string
  target_cattle_count: number
  daily_plans: Array<{
    date: string
    formula_id: number
    planned_amount: number
    feeding_times: number
    notes?: string
  }>
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  created_by: number
  created_at: string
  updated_at: string
}

export const feedingApi = {
  // 获取饲料配方列表
  async getFeedFormulas(params?: {
    formula_type?: string
    target_group?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<{ data: FeedFormula[]; pagination: any }> {
    try {
      const response = await feedingServiceApi.getFeedFormulas(params)
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
      console.error('获取饲料配方失败:', error)
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    }
  },

  // 创建饲料配方
  async createFeedFormula(data: Omit<FeedFormula, 'id' | 'created_at' | 'updated_at'>): Promise<FeedFormula> {
    try {
      const response = await feedingServiceApi.createFeedFormula(data)
      return response.data
    } catch (error) {
      console.error('创建饲料配方失败:', error)
      throw error
    }
  },

  // 获取饲喂记录列表
  async getFeedingRecords(params?: {
    base_id?: number
    barn_id?: number
    formula_id?: number
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
  }): Promise<{ data: { records: FeedingRecord[] }; pagination: any }> {
    try {
      const response = await feedingServiceApi.getFeedingRecords(params)
      
      // 处理不同的响应结构
      let records = []
      if (response.data?.records) {
        records = response.data.records
      } else if (Array.isArray(response.data)) {
        records = response.data
      } else if (response.data?.data) {
        records = response.data.data
      }
      
      return {
        data: { records: Array.isArray(records) ? records : [] },
        pagination: response.pagination || {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    } catch (error) {
      console.error('获取饲喂记录失败:', error)
      return {
        data: { records: [] },
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    }
  },

  // 创建饲喂记录
  async createFeedingRecord(data: Omit<FeedingRecord, 'id' | 'created_at' | 'updated_at'>): Promise<FeedingRecord> {
    try {
      const response = await feedingServiceApi.createFeedingRecord(data)
      return response.data
    } catch (error) {
      console.error('创建饲喂记录失败:', error)
      throw error
    }
  },

  // 获取饲喂统计
  async getFeedingStatistics(params: {
    base_id: number
    start_date: string
    end_date: string
  }): Promise<{ data: any }> {
    try {
      const response = await feedingServiceApi.getFeedingStatistics(params)
      return { data: response.data || {} }
    } catch (error) {
      console.error('获取饲喂统计失败:', error)
      return {
        data: {
          totalAmount: 0,
          totalCost: 0,
          avgDailyCost: 0,
          formulaUsage: [],
          trend: []
        }
      }
    }
  },

  // 获取饲喂效率分析
  async getFeedingEfficiency(params: {
    base_id: number
    start_date: string
    end_date: string
  }): Promise<{ data: any }> {
    try {
      const response = await feedingServiceApi.get('/efficiency', params)
      return { data: response.data || {} }
    } catch (error) {
      console.error('获取饲喂效率失败:', error)
      return {
        data: {
          averageCostPerKg: 0,
          efficiency: 0,
          utilization: 0,
          wasteRate: 0
        }
      }
    }
  },

  // 获取饲喂趋势
  async getFeedingTrend(params: {
    base_id: number
    start_date: string
    end_date: string
    period: string
  }): Promise<{ data: Array<{ date: string; total_amount: number; total_cost: number }> }> {
    try {
      const response = await feedingServiceApi.get('/trend', params)
      return {
        data: Array.isArray(response.data) ? response.data : []
      }
    } catch (error) {
      console.error('获取饲喂趋势失败:', error)
      return { data: [] }
    }
  },

  // 生成饲喂计划
  async generateFeedingPlan(params: {
    base_id: number
    days: number
  }): Promise<{ data: any }> {
    try {
      const response = await feedingServiceApi.post('/plans/generate', params)
      return { data: response.data || {} }
    } catch (error) {
      console.error('生成饲喂计划失败:', error)
      throw error
    }
  },

  // 获取饲喂计划列表
  async getFeedingPlans(params?: {
    base_id?: number
    status?: string
    page?: number
    limit?: number
  }): Promise<{ data: FeedingPlan[]; pagination: any }> {
    try {
      const response = await feedingServiceApi.getFeedingPlans(params)
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
      console.error('获取饲喂计划失败:', error)
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    }
  },

  // 创建饲喂计划
  async createFeedingPlan(data: Omit<FeedingPlan, 'id' | 'created_at' | 'updated_at'>): Promise<FeedingPlan> {
    try {
      const response = await feedingServiceApi.createFeedingPlan(data)
      return response.data
    } catch (error) {
      console.error('创建饲喂计划失败:', error)
      throw error
    }
  }
}