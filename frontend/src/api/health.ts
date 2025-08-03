import { healthServiceApi } from './microservices'
import type { ApiResponse } from './request'

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
    const response = await healthServiceApi.getHealthRecords(params)
    return { data: response.data }
  },

  // 获取诊疗记录详情
  async getHealthRecordById(id: string): Promise<{ data: HealthRecord }> {
    const response = await healthServiceApi.getById('/records', id)
    return { data: response.data }
  },

  // 创建诊疗记录
  async createHealthRecord(data: CreateHealthRecordRequest): Promise<{ data: HealthRecord }> {
    const response = await healthServiceApi.createHealthRecord(data)
    return { data: response.data }
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