import request from './request'
import type { ApiResponse } from './request'

// 饲喂管理相关类型定义
export interface IngredientItem {
  name: string      // 成分名称
  weight: number    // 重量 (kg)
  cost: number      // 成本 (元/kg)
  energy: number    // 能量 (MJ/kg)
  ratio: number     // 所占比重 (%)
}

export interface FeedFormula {
  id: string
  name: string
  description: string
  ingredients: IngredientItem[]
  costPerKg: number
  ingredientsVersion?: number
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface FeedingRecord {
  id: string
  formulaId: string
  formulaName: string
  baseId: number
  baseName: string
  barnId: number
  barnName: string
  amount: number
  feedingDate: string
  operatorId: string
  operatorName: string
  cost: number
  remark?: string
  createdAt: string
}

export interface FeedingStatistics {
  totalAmount: number
  totalCost: number
  avgDailyCost: number
  formulaUsage: Array<{
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

export interface FormulaListParams {
  page?: number
  limit?: number
  keyword?: string
  createdBy?: string
}

export interface FormulaListResponse {
  data: FeedFormula[]
  total: number
  page: number
  limit: number
}

export interface FeedingListParams {
  page?: number
  limit?: number
  baseId?: number
  barnId?: number
  formulaId?: string
  startDate?: string
  endDate?: string
  operatorId?: string
}

export interface FeedingListResponse {
  data: FeedingRecord[]
  total: number
  page: number
  limit: number
}

export interface CreateFormulaRequest {
  name: string
  description?: string
  ingredients: IngredientItem[]
}

export interface UpdateFormulaRequest {
  name?: string
  description?: string
  ingredients?: IngredientItem[]
}

export interface CreateFeedingRecordRequest {
  formulaId: string
  baseId: number
  barnId: number
  amount: number
  feedingDate: string
  remark?: string
}

export interface UpdateFeedingRecordRequest {
  amount?: number
  feedingDate?: string
  remark?: string
}

export const feedingApi = {
  // 获取饲料配方列表
  getFormulas(params: FormulaListParams = {}): Promise<{ data: FormulaListResponse }> {
    return request.get<ApiResponse<any>>('/feeding/formulas', { params })
      .then(response => {
        const responseData = response.data.data;
        return {
          data: {
            data: responseData.formulas || [],
            total: responseData.pagination?.total || 0,
            page: responseData.pagination?.page || 1,
            limit: responseData.pagination?.limit || 20
          }
        };
      })
  },

  // 获取饲料配方详情
  getFormulaById(id: string): Promise<{ data: FeedFormula }> {
    return request.get<ApiResponse<FeedFormula>>(`/feeding/formulas/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 创建饲料配方
  createFormula(data: CreateFormulaRequest): Promise<{ data: FeedFormula }> {
    return request.post<ApiResponse<FeedFormula>>('/feeding/formulas', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新饲料配方
  updateFormula(id: string, data: UpdateFormulaRequest): Promise<{ data: FeedFormula }> {
    return request.put<ApiResponse<FeedFormula>>(`/feeding/formulas/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除饲料配方
  deleteFormula(id: string): Promise<void> {
    return request.delete(`/feeding/formulas/${id}`)
  },

  // 获取饲喂记录列表
  getFeedingRecords(params: FeedingListParams = {}): Promise<{ data: FeedingListResponse }> {
    console.log('饲喂记录API调用参数:', params)
    return request.get<ApiResponse<FeedingListResponse>>('/feeding/records', { params })
      .then(response => {
        console.log('饲喂记录API原始响应:', response)
        return { data: response.data.data }
      })
  },

  // 获取饲喂记录详情
  getFeedingRecordById(id: string): Promise<{ data: FeedingRecord }> {
    return request.get<ApiResponse<FeedingRecord>>(`/feeding/records/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 创建饲喂记录
  createFeedingRecord(data: CreateFeedingRecordRequest): Promise<{ data: FeedingRecord }> {
    // 转换字段名为后端期望的格式
    const requestData = {
      formula_id: data.formulaId,
      base_id: data.baseId,
      barn_id: data.barnId,
      amount: data.amount,
      feeding_date: data.feedingDate,
      remark: data.remark
    }
    return request.post<ApiResponse<FeedingRecord>>('/feeding/records', requestData)
      .then(response => ({ data: response.data.data }))
  },

  // 更新饲喂记录
  updateFeedingRecord(id: string, data: UpdateFeedingRecordRequest): Promise<{ data: FeedingRecord }> {
    return request.put<ApiResponse<FeedingRecord>>(`/feeding/records/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除饲喂记录
  deleteFeedingRecord(id: string): Promise<void> {
    return request.delete(`/feeding/records/${id}`)
  },

  // 获取饲喂统计数据
  getFeedingStatistics(params: { base_id?: number; start_date?: string; end_date?: string } = {}): Promise<{ data: FeedingStatistics }> {
    console.log('饲喂统计API调用参数:', params)
    return request.get<ApiResponse<FeedingStatistics>>('/feeding/statistics', { params })
      .then(response => {
        console.log('饲喂统计API原始响应:', response)
        return { data: response.data.data }
      })
  },

  // 生成饲喂计划
  generateFeedingPlan(params: { base_id: number; barn_id?: number; days: number }): Promise<{ data: any[] }> {
    console.log('生成饲喂计划API调用参数:', params)
    return request.post<ApiResponse<any[]>>('/feeding/plans/generate', params)
      .then(response => {
        console.log('生成饲喂计划API响应:', response)
        return { data: response.data.data }
      })
  },

  // 获取饲喂效率分析（使用统计数据计算效率）
  getFeedingEfficiency(params: { base_id?: number; start_date?: string; end_date?: string } = {}): Promise<{ data: any }> {
    console.log('饲喂效率分析API调用参数:', params)
    // 使用统计API获取数据，然后在前端计算效率指标
    return request.get<ApiResponse<any>>('/feeding/statistics', { params })
      .then(response => {
        console.log('饲喂统计API响应:', response)
        const statsData = response.data.data
        
        // 从统计数据中提取效率指标
        const efficiency = statsData.efficiency || {
          totalAmount: 0,
          totalCost: 0,
          averageCostPerKg: 0,
          recordCount: 0
        }
        
        return { data: efficiency }
      })
  },

  // 获取饲喂趋势数据
  getFeedingTrend(params: { base_id?: number; start_date?: string; end_date?: string; period?: string } = {}): Promise<{ data: any[] }> {
    console.log('饲喂趋势数据API调用参数:', params)
    return request.get<ApiResponse<any[]>>('/feeding/trend', { params })
      .then(response => {
        console.log('饲喂趋势数据API响应:', response)
        return { data: response.data.data }
      })
  }
}