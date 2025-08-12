import { healthServiceApi } from './microservices'
import type { ApiResponse } from './request'
import { adaptPaginatedResponse, adaptSingleResponse, adaptStatisticsResponse } from '@/utils/dataAdapter'

// 健康管理相关类型定义
export interface HealthRecord {
  id: string
  cattleId: string
  cattleEarTag: string
  symptoms: string
  diagnosis: string
  treatment: string
  veterinarianId: string
  veterinarianName: string
  diagnosisDate: string
  status: 'ongoing' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface VaccinationRecord {
  id: string
  cattleId: string
  cattleEarTag: string
  vaccineName: string
  vaccinationDate: string
  nextDueDate: string
  veterinarianId: string
  veterinarianName: string
  batchNumber: string
  createdAt: string
}

export interface HealthStatistics {
  healthy: number
  sick: number
  treatment: number
  total: number
  trend: Array<{
    date: string
    healthy: number
    sick: number
    treatment: number
  }>
}

export interface HealthListParams {
  page?: number
  limit?: number
  cattleId?: string
  baseId?: number
  status?: 'ongoing' | 'completed' | 'cancelled'
  startDate?: string
  endDate?: string
  veterinarianId?: string
}

export interface HealthListResponse {
  data: HealthRecord[]
  total: number
  page: number
  limit: number
}

export interface CreateHealthRecordRequest {
  cattleId: string
  symptoms: string
  diagnosis: string
  treatment: string
  diagnosisDate: string
}

export interface UpdateHealthRecordRequest {
  symptoms?: string
  diagnosis?: string
  treatment?: string
  status?: 'ongoing' | 'completed' | 'cancelled'
}

export interface CreateVaccinationRequest {
  cattleId: string
  vaccineName: string
  vaccinationDate: string
  nextDueDate?: string
  batchNumber?: string
}

export interface VaccinationListParams {
  page?: number
  limit?: number
  cattleId?: string
  baseId?: number
  vaccineName?: string
  startDate?: string
  endDate?: string
}

export interface VaccinationListResponse {
  data: VaccinationRecord[]
  total: number
  page: number
  limit: number
}

export const healthApi = {
  // 获取诊疗记录列表
  async getHealthRecords(params: HealthListParams = {}): Promise<{ data: HealthListResponse }> {
    console.log('🔍 healthApi.getHealthRecords 调用参数:', params)
    
    const response = await healthServiceApi.getHealthRecords(params)
    console.log('📥 healthServiceApi 原始响应:', response)
    
    // 直接解析微服务返回的数据，不使用复杂的适配器
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
    
    console.log('✅ healthApi.getHealthRecords 解析结果:', { 
      recordsCount: records.length, 
      total, 
      page, 
      limit,
      sampleRecord: records[0] || null
    })
    
    return result
  },

  // 获取诊疗记录详情
  async getHealthRecordById(id: string): Promise<{ data: HealthRecord }> {
    const response = await healthServiceApi.getById('/records', id)
    return { data: response.data }
  },

  // 创建诊疗记录
  async createHealthRecord(data: CreateHealthRecordRequest): Promise<{ data: HealthRecord }> {
    try {
      console.log('创建健康记录API调用，参数:', data)
      
      // 直接处理数据，避免复杂的导入问题
      const ensureString = (value: any, defaultValue: string = '') => {
        return typeof value === 'string' ? value : (value ? String(value) : defaultValue)
      }
      
      // 转换字段名为后端期望的格式
      const requestData = {
        cattle_id: ensureString(data.cattleId),
        symptoms: ensureString(data.symptoms),
        diagnosis: ensureString(data.diagnosis),
        treatment: ensureString(data.treatment),
        diagnosis_date: ensureString(data.diagnosisDate)
      }
      
      console.log('清理后的请求数据:', requestData)
      const response = await healthServiceApi.createHealthRecord(requestData)
      console.log('创建健康记录API响应:', response)
      return { data: response.data }
    } catch (error) {
      console.error('创建健康记录失败:', error)
      throw error
    }
  },

  // 更新诊疗记录
  async updateHealthRecord(id: string, data: UpdateHealthRecordRequest): Promise<{ data: HealthRecord }> {
    const response = await healthServiceApi.update('/records', id, data)
    return { data: response.data }
  },

  // 删除诊疗记录
  async deleteHealthRecord(id: string): Promise<void> {
    await healthServiceApi.remove('/records', id)
  },

  // 获取疫苗接种记录列表
  async getVaccinationRecords(params: VaccinationListParams = {}): Promise<{ data: VaccinationListResponse }> {
    const response = await healthServiceApi.getVaccineRecords(params)
    return { data: response.data }
  },

  // 创建疫苗接种记录
  async createVaccinationRecord(data: CreateVaccinationRequest): Promise<{ data: VaccinationRecord }> {
    const response = await healthServiceApi.createVaccineRecord(data)
    return { data: response.data }
  },

  // 更新疫苗接种记录
  async updateVaccinationRecord(id: string, data: Partial<CreateVaccinationRequest>): Promise<{ data: VaccinationRecord }> {
    const response = await healthServiceApi.update('/vaccines', id, data)
    return { data: response.data }
  },

  // 删除疫苗接种记录
  async deleteVaccinationRecord(id: string): Promise<void> {
    await healthServiceApi.remove('/vaccines', id)
  },

  // 获取健康统计数据
  async getHealthStatistics(params: { baseId?: number; startDate?: string; endDate?: string } = {}): Promise<{ data: HealthStatistics }> {
    const response = await healthServiceApi.getHealthStatistics(params.baseId)
    return { data: response.data }
  },

  // 获取健康预警
  async getHealthAlerts(params: { base_id?: number } = {}): Promise<{ data: any }> {
    const response = await healthServiceApi.get('/alerts', params)
    return { data: response.data }
  },

  // 获取健康趋势分析
  async getHealthTrend(params: { base_id?: number; days?: number } = {}): Promise<{ data: any }> {
    const response = await healthServiceApi.get('/trend', params)
    return { data: response.data }
  },

  // 发送健康预警通知
  async sendHealthAlertNotifications(data: { base_id?: number; alert_types?: string[] }): Promise<{ data: any }> {
    const response = await healthServiceApi.post('/alerts/notify', data)
    return { data: response.data }
  },

  // 获取牛只健康档案
  async getCattleHealthProfile(cattleId: string): Promise<{ data: any }> {
    const response = await healthServiceApi.get(`/cattle/${cattleId}/profile`)
    return { data: response.data }
  }
}