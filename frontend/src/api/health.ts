import { healthServiceApi } from './microservices'

// 健康管理相关类型定义
export interface HealthRecord {
  id: number
  cattle_id: number
  record_type: 'checkup' | 'treatment' | 'vaccination' | 'disease'
  record_date: string
  description?: string
  symptoms?: string
  diagnosis?: string
  treatment?: string
  medication?: string
  dosage?: string
  veterinarian?: string
  next_checkup_date?: string
  status: 'active' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
  cattle?: {
    id: number
    ear_tag: string
    breed: string
  }
  operator?: {
    id: number
    real_name: string
  }
}

export interface HealthStatistics {
  healthy: number
  sick: number
  treatment: number
  total: number
  health_rate: number
  vaccination_rate: number
  disease_distribution: Array<{
    disease_name: string
    count: number
  }>
  trend: Array<{
    date: string
    healthy_count: number
    sick_count: number
    treatment_count: number
  }>
}

export interface HealthAlert {
  id: number
  cattle_id: number
  alert_type: 'health_check_due' | 'vaccination_due' | 'treatment_reminder' | 'abnormal_symptoms'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  due_date?: string
  status: 'active' | 'resolved' | 'dismissed'
  data?: any
  created_at: string
  updated_at: string
}

export interface VaccineRecord {
  id: number
  cattle_id: number
  vaccine_name: string
  vaccine_type: string
  batch_number?: string
  manufacturer?: string
  vaccination_date: string
  next_due_date?: string
  veterinarian?: string
  dosage?: string
  injection_site?: string
  reaction?: string
  status: 'scheduled' | 'completed' | 'overdue'
  notes?: string
  created_at: string
  updated_at: string
}

export const healthApi = {
  // 获取健康记录列表
  async getHealthRecords(params?: {
    cattle_id?: number
    record_type?: string
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
  }): Promise<{ data: HealthRecord[]; pagination: any }> {
    try {
      const response = await healthServiceApi.getHealthRecords(params)
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
      console.error('获取健康记录失败:', error)
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    }
  },

  // 创建健康记录
  async createHealthRecord(data: Omit<HealthRecord, 'id' | 'created_at' | 'updated_at'>): Promise<HealthRecord> {
    try {
      const response = await healthServiceApi.createHealthRecord(data)
      return response.data
    } catch (error) {
      console.error('创建健康记录失败:', error)
      throw error
    }
  },

  // 获取健康统计
  async getHealthStatistics(baseId?: number): Promise<{ data: HealthStatistics }> {
    try {
      const response = await healthServiceApi.getHealthStatistics(baseId)
      const data = response.data || {}
      
      return {
        data: {
          healthy: data.healthy || 0,
          sick: data.sick || 0,
          treatment: data.treatment || 0,
          total: data.total || 0,
          health_rate: data.health_rate || 0,
          vaccination_rate: data.vaccination_rate || 0,
          disease_distribution: Array.isArray(data.disease_distribution) ? data.disease_distribution : [],
          trend: Array.isArray(data.trend) ? data.trend : []
        }
      }
    } catch (error) {
      console.error('获取健康统计失败:', error)
      return {
        data: {
          healthy: 0,
          sick: 0,
          treatment: 0,
          total: 0,
          health_rate: 0,
          vaccination_rate: 0,
          disease_distribution: [],
          trend: []
        }
      }
    }
  },

  // 获取健康预警
  async getHealthAlerts(params?: {
    cattle_id?: number
    alert_type?: string
    severity?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<{ data: { alerts: HealthAlert[]; total: number; critical_count: number; high_count: number; medium_count: number; low_count: number } }> {
    try {
      const response = await healthServiceApi.get('/alerts', params)
      const data = response.data || {}
      
      return {
        data: {
          alerts: Array.isArray(data.alerts) ? data.alerts : [],
          total: data.total || 0,
          critical_count: data.critical_count || 0,
          high_count: data.high_count || 0,
          medium_count: data.medium_count || 0,
          low_count: data.low_count || 0
        }
      }
    } catch (error) {
      console.error('获取健康预警失败:', error)
      return {
        data: {
          alerts: [],
          total: 0,
          critical_count: 0,
          high_count: 0,
          medium_count: 0,
          low_count: 0
        }
      }
    }
  },

  // 获取健康趋势
  async getHealthTrend(params: { days: number }): Promise<{ data: { trends: Array<{ period: string; healthy_count: number; sick_count: number; treatment_count: number }> } }> {
    try {
      const response = await healthServiceApi.get('/trend', params)
      const data = response.data || {}
      
      return {
        data: {
          trends: Array.isArray(data.trends) ? data.trends : []
        }
      }
    } catch (error) {
      console.error('获取健康趋势失败:', error)
      return {
        data: {
          trends: []
        }
      }
    }
  },

  // 获取疫苗记录
  async getVaccineRecords(params?: {
    cattle_id?: number
    vaccine_type?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<{ data: VaccineRecord[]; pagination: any }> {
    try {
      const response = await healthServiceApi.getVaccineRecords(params)
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
      console.error('获取疫苗记录失败:', error)
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    }
  },

  // 创建疫苗记录
  async createVaccineRecord(data: Omit<VaccineRecord, 'id' | 'created_at' | 'updated_at'>): Promise<VaccineRecord> {
    try {
      const response = await healthServiceApi.createVaccineRecord(data)
      return response.data
    } catch (error) {
      console.error('创建疫苗记录失败:', error)
      throw error
    }
  }
}