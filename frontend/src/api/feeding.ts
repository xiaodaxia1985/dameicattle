import { feedingServiceApi } from './microservices'
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
  async getFormulas(params: FormulaListParams = {}): Promise<{ data: FormulaListResponse }> {
    console.log('🔍 feedingApi.getFormulas 调用参数:', params)
    
    const response = await feedingServiceApi.getFeedFormulas(params)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    let formulas = []
    let total = 0
    let page = 1
    let limit = 20
    
    // 处理不同的数据结构
    if (Array.isArray(responseData)) {
      // 直接是数组
      formulas = responseData
      total = formulas.length
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // 有data字段且是数组
      formulas = responseData.data
      total = responseData.total || responseData.pagination?.total || formulas.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.formulas && Array.isArray(responseData.formulas)) {
      // 有formulas字段且是数组
      formulas = responseData.formulas
      total = responseData.total || responseData.pagination?.total || formulas.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.items && Array.isArray(responseData.items)) {
      // 有items字段且是数组
      formulas = responseData.items
      total = responseData.total || responseData.pagination?.total || formulas.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    }
    
    const result = {
      data: {
        data: formulas,
        total,
        page,
        limit
      }
    }
    
    console.log('✅ feedingApi.getFormulas 解析结果:', { 
      formulasCount: formulas.length, 
      total, 
      page, 
      limit,
      sampleFormula: formulas[0] || null
    })
    
    return result
  },

  // 获取饲料配方详情
  async getFormulaById(id: string): Promise<{ data: FeedFormula }> {
    const response = await feedingServiceApi.getById('/formulas', id)
    return { data: response.data }
  },

  // 创建饲料配方
  async createFormula(data: CreateFormulaRequest): Promise<{ data: FeedFormula }> {
    const response = await feedingServiceApi.createFeedFormula(data)
    return { data: response.data }
  },

  // 更新饲料配方
  async updateFormula(id: string, data: UpdateFormulaRequest): Promise<{ data: FeedFormula }> {
    const response = await feedingServiceApi.update('/formulas', id, data)
    return { data: response.data }
  },

  // 删除饲料配方
  async deleteFormula(id: string): Promise<void> {
    console.log('🔍 feedingApi.deleteFormula 调用参数:', id)
    
    try {
      await feedingServiceApi.remove('/formulas', id)
      console.log('✅ feedingApi.deleteFormula 删除成功')
    } catch (error: any) {
      console.error('❌ feedingApi.deleteFormula 删除失败:', error)
      
      // 如果是404错误，说明后端还没有实现这个端点
      if (error.response?.status === 404 || error.message?.includes('404') || error.message?.includes('Route not found')) {
        throw new Error('删除功能暂时不可用，后端服务正在开发中。请联系系统管理员。')
      }
      
      // 其他错误直接抛出
      throw error
    }
  },

  // 获取饲喂记录列表
  async getFeedingRecords(params: FeedingListParams = {}): Promise<{ data: FeedingListResponse }> {
    console.log('🔍 feedingApi.getFeedingRecords 调用参数:', params)
    
    const response = await feedingServiceApi.getFeedingRecords(params)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    let records = []
    let total = 0
    let page = 1
    let limit = 20
    
    // 处理不同的数据结构
    if (Array.isArray(responseData)) {
      // 直接是数组
      records = responseData
      total = records.length
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // 有data字段且是数组
      records = responseData.data
      total = responseData.total || responseData.pagination?.total || records.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.records && Array.isArray(responseData.records)) {
      // 有records字段且是数组
      records = responseData.records
      total = responseData.total || responseData.pagination?.total || records.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    } else if (responseData.items && Array.isArray(responseData.items)) {
      // 有items字段且是数组
      records = responseData.items
      total = responseData.total || responseData.pagination?.total || records.length
      page = responseData.page || responseData.pagination?.page || 1
      limit = responseData.limit || responseData.pagination?.limit || 20
    }
    
    const result = { 
      data: {
        data: records,
        total,
        page,
        limit
      }
    }
    
    console.log('✅ feedingApi.getFeedingRecords 解析结果:', { 
      recordsCount: records.length, 
      total, 
      page, 
      limit,
      sampleRecord: records[0] || null
    })
    
    return result
  },

  // 获取饲喂记录详情
  async getFeedingRecordById(id: string): Promise<{ data: FeedingRecord }> {
    console.log('🔍 feedingApi.getFeedingRecordById 调用参数:', id)
    
    const response = await feedingServiceApi.get(`/records/${id}`)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    console.log('✅ feedingApi.getFeedingRecordById 解析结果:', responseData)
    
    return { data: responseData }
  },

  // 创建饲喂记录
  async createFeedingRecord(data: CreateFeedingRecordRequest): Promise<{ data: FeedingRecord }> {
    // 转换字段名为后端期望的格式
    const requestData = {
      formula_id: data.formulaId,
      base_id: data.baseId,
      barn_id: data.barnId,
      amount: data.amount,
      feeding_date: data.feedingDate,
      remark: data.remark
    }
    const response = await feedingServiceApi.createFeedingRecord(requestData)
    return { data: response.data }
  },

  // 更新饲喂记录
  async updateFeedingRecord(id: string, data: UpdateFeedingRecordRequest): Promise<{ data: FeedingRecord }> {
    console.log('🔍 feedingApi.updateFeedingRecord 调用参数:', { id, data })
    
    const response = await feedingServiceApi.put(`/records/${id}`, data)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据
    const responseData = response?.data || response || {}
    console.log('📊 解析响应数据结构:', responseData)
    
    console.log('✅ feedingApi.updateFeedingRecord 解析结果:', responseData)
    
    return { data: responseData }
  },

  // 删除饲喂记录
  async deleteFeedingRecord(id: string): Promise<void> {
    console.log('🔍 feedingApi.deleteFeedingRecord 调用参数:', id)
    
    try {
      await feedingServiceApi.remove('/records', id)
      console.log('✅ feedingApi.deleteFeedingRecord 删除成功')
    } catch (error: any) {
      console.error('❌ feedingApi.deleteFeedingRecord 删除失败:', error)
      
      // 如果是404错误，说明后端还没有实现这个端点
      if (error.response?.status === 404 || error.message?.includes('404') || error.message?.includes('Route not found')) {
        throw new Error('删除功能暂时不可用，后端服务正在开发中。请联系系统管理员。')
      }
      
      // 其他错误直接抛出
      throw error
    }
  },

  // 获取饲喂统计数据
  async getFeedingStatistics(params: { base_id?: number; start_date?: string; end_date?: string } = {}): Promise<{ data: FeedingStatistics }> {
    console.log('饲喂统计API调用参数:', params)
    const response = await feedingServiceApi.getFeedingStatistics(params)
    console.log('饲喂统计API原始响应:', response)
    return { data: response.data }
  },

  // 生成饲喂计划
  async generateFeedingPlan(params: { base_id: number; barn_id?: number; days: number }): Promise<{ data: any[] }> {
    console.log('生成饲喂计划API调用参数:', params)
    const response = await feedingServiceApi.post('/plans/generate', params)
    console.log('生成饲喂计划API响应:', response)
    return { data: response.data }
  },

  // 获取饲喂效率分析（使用统计数据计算效率）
  async getFeedingEfficiency(params: { base_id?: number; start_date?: string; end_date?: string } = {}): Promise<{ data: any }> {
    console.log('饲喂效率分析API调用参数:', params)
    // 使用统计API获取数据，然后在前端计算效率指标
    const response = await feedingServiceApi.getFeedingStatistics(params)
    console.log('饲喂统计API响应:', response)
    const statsData = response.data
    
    // 从统计数据中提取效率指标
    const efficiency = statsData.efficiency || {
      totalAmount: 0,
      totalCost: 0,
      averageCostPerKg: 0,
      recordCount: 0
    }
    
    return { data: efficiency }
  },

  // 获取饲喂趋势数据
  async getFeedingTrend(params: { base_id?: number; start_date?: string; end_date?: string; period?: string } = {}): Promise<{ data: any[] }> {
    console.log('饲喂趋势数据API调用参数:', params)
    const response = await feedingServiceApi.get('/trend', params)
    console.log('饲喂趋势数据API响应:', response)
    return { data: response.data }
  }
}