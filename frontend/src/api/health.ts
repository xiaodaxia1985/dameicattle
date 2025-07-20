import request from './request'
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
  getHealthRecords(params: HealthListParams = {}): Promise<{ data: HealthListResponse }> {
    return request.get<ApiResponse<HealthListResponse>>('/health/records', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取诊疗记录详情
  getHealthRecordById(id: string): Promise<{ data: HealthRecord }> {
    return request.get<ApiResponse<HealthRecord>>(`/health/records/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 创建诊疗记录
  createHealthRecord(data: CreateHealthRecordRequest): Promise<{ data: HealthRecord }> {
    return request.post<ApiResponse<HealthRecord>>('/health/records', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新诊疗记录
  updateHealthRecord(id: string, data: UpdateHealthRecordRequest): Promise<{ data: HealthRecord }> {
    return request.put<ApiResponse<HealthRecord>>(`/health/records/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除诊疗记录
  deleteHealthRecord(id: string): Promise<void> {
    return request.delete(`/health/records/${id}`)
  },

  // 获取疫苗接种记录列表
  getVaccinationRecords(params: VaccinationListParams = {}): Promise<{ data: VaccinationListResponse }> {
    return request.get<ApiResponse<VaccinationListResponse>>('/health/vaccinations', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 创建疫苗接种记录
  createVaccinationRecord(data: CreateVaccinationRequest): Promise<{ data: VaccinationRecord }> {
    return request.post<ApiResponse<VaccinationRecord>>('/health/vaccinations', data)
      .then(response => ({ data: response.data.data }))
  },

  // 更新疫苗接种记录
  updateVaccinationRecord(id: string, data: Partial<CreateVaccinationRequest>): Promise<{ data: VaccinationRecord }> {
    return request.put<ApiResponse<VaccinationRecord>>(`/health/vaccinations/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 删除疫苗接种记录
  deleteVaccinationRecord(id: string): Promise<void> {
    return request.delete(`/health/vaccinations/${id}`)
  },

  // 获取健康统计数据
  getHealthStatistics(params: { baseId?: number; startDate?: string; endDate?: string } = {}): Promise<{ data: HealthStatistics }> {
    return request.get<ApiResponse<HealthStatistics>>('/health/statistics', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取健康预警
  getHealthAlerts(params: { base_id?: number } = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/health/alerts', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取健康趋势分析
  getHealthTrend(params: { base_id?: number; days?: number } = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/health/trend', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 发送健康预警通知
  sendHealthAlertNotifications(data: { base_id?: number; alert_types?: string[] }): Promise<{ data: any }> {
    return request.post<ApiResponse<any>>('/health/alerts/notify', data)
      .then(response => ({ data: response.data.data }))
  },

  // 获取牛只健康档案
  getCattleHealthProfile(cattleId: string): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>(`/health/cattle/${cattleId}/profile`)
      .then(response => ({ data: response.data.data }))
  }
}