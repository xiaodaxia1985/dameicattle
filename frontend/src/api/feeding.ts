import request from './request'
import type { ApiResponse } from './request'

// 饲喂管理相关类型定义
export interface FeedFormula {
  id: string
  name: string
  description: string
  ingredients: Array<{
    name: string
    ratio: number
    unit: string
    cost?: number
  }>
  costPerKg: number
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
  ingredients: Array<{
    name: string
    ratio: number
    unit: string
    cost?: number
  }>
}

export interface UpdateFormulaRequest {
  name?: string
  description?: string
  ingredients?: Array<{
    name: string
    ratio: number
    unit: string
    cost?: number
  }>
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
    return request.get<ApiResponse<FormulaListResponse>>('/feeding/formulas', { params })
      .then(response => ({ data: response.data.data }))
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
    return request.get<ApiResponse<FeedingListResponse>>('/feeding/records', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取饲喂记录详情
  getFeedingRecordById(id: string): Promise<{ data: FeedingRecord }> {
    return request.get<ApiResponse<FeedingRecord>>(`/feeding/records/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 创建饲喂记录
  createFeedingRecord(data: CreateFeedingRecordRequest): Promise<{ data: FeedingRecord }> {
    return request.post<ApiResponse<FeedingRecord>>('/feeding/records', data)
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
  getFeedingStatistics(params: { baseId?: number; startDate?: string; endDate?: string } = {}): Promise<{ data: FeedingStatistics }> {
    return request.get<ApiResponse<FeedingStatistics>>('/feeding/statistics', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 生成饲喂计划
  generateFeedingPlan(params: { baseId: number; barnId?: number; days: number }): Promise<{ data: any[] }> {
    return request.post<ApiResponse<any[]>>('/feeding/generate-plan', params)
      .then(response => ({ data: response.data.data }))
  },

  // 获取饲喂效率分析
  getFeedingEfficiency(params: { baseId?: number; startDate?: string; endDate?: string } = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/feeding/efficiency', { params })
      .then(response => ({ data: response.data.data }))
  }
}