import { monitoringServiceApi } from './microservices'
import type { ApiResponse } from './request'

// 巡圈记录相关类型定义
export interface PatrolRecord {
  id: number
  base_id: number
  barn_id: number
  patrol_date: string
  patrol_time: string
  patrol_type: 'before_feeding' | 'after_feeding' | 'routine'
  
  // 牛只状态
  total_cattle_count: number
  standing_cattle_count?: number
  lying_cattle_count?: number
  lying_rate?: number
  
  // 异常牛只
  abnormal_cattle_count?: number
  abnormal_cattle_description?: string
  
  // 设施检查
  feed_trough_clean?: boolean
  feed_trough_notes?: string
  water_trough_clean?: boolean
  water_trough_notes?: string
  
  // 环境数据
  temperature?: number
  humidity?: number
  environment_notes?: string
  
  // 物联网设备
  iot_device_id?: string
  iot_data_source?: 'manual' | 'iot_sensor' | 'api'
  
  // 巡圈人员
  patrol_person_id?: number
  patrol_person_name?: string
  overall_notes?: string
  
  // 图片附件
  images?: string[]
  
  // 关联数据
  base?: { id: number; name: string }
  barn?: { id: number; name: string; code: string }
  patrol_person?: { id: number; real_name: string; username: string }
  
  created_at?: string
  updated_at?: string
}

export interface CreatePatrolRecordRequest {
  base_id: number
  barn_id: number
  patrol_date: string
  patrol_time: string
  patrol_type: 'before_feeding' | 'after_feeding' | 'routine'
  total_cattle_count: number
  standing_cattle_count?: number
  lying_cattle_count?: number
  abnormal_cattle_count?: number
  abnormal_cattle_description?: string
  feed_trough_clean?: boolean
  feed_trough_notes?: string
  water_trough_clean?: boolean
  water_trough_notes?: string
  temperature?: number
  humidity?: number
  environment_notes?: string
  iot_device_id?: string
  iot_data_source?: 'manual' | 'iot_sensor' | 'api'
  overall_notes?: string
  images?: string[]
}

export interface UpdatePatrolRecordRequest {
  total_cattle_count?: number
  standing_cattle_count?: number
  lying_cattle_count?: number
  abnormal_cattle_count?: number
  abnormal_cattle_description?: string
  feed_trough_clean?: boolean
  feed_trough_notes?: string
  water_trough_clean?: boolean
  water_trough_notes?: string
  temperature?: number
  humidity?: number
  environment_notes?: string
  overall_notes?: string
  images?: string[]
}

export interface PatrolListParams {
  page?: number
  limit?: number
  base_id?: number
  barn_id?: number
  patrol_type?: 'before_feeding' | 'after_feeding' | 'routine'
  start_date?: string
  end_date?: string
  patrol_person_id?: number
}

export interface PatrolListResponse {
  records: PatrolRecord[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface PatrolStatistics {
  basic_stats: {
    total_records: number
    avg_lying_rate: number
    avg_temperature: number
    avg_humidity: number
    total_abnormal_cattle: number
  }
  daily_trend: Array<{
    patrol_date: string
    avg_lying_rate: number
    avg_temperature: number
    avg_humidity: number
    patrol_count: number
  }>
  type_distribution: Array<{
    patrol_type: string
    count: number
  }>
  barn_stats: Array<{
    barn_id: number
    barn: { id: number; name: string; code: string }
    patrol_count: number
    avg_lying_rate: number
    total_abnormal: number
  }>
}

export interface TodayPatrolTasks {
  date: string
  base_id: number
  overall_completion: number
  total_barns: number
  total_tasks: number
  completed_tasks: number
  tasks: Array<{
    barn_id: number
    barn_name: string
    barn_code: string
    cattle_count: number
    completed_patrols: string[]
    pending_patrols: string[]
    completion_rate: number
  }>
}

export interface IoTDeviceData {
  device: {
    id: number
    device_id: string
    device_name: string
    status: string
    is_online: boolean
    last_data_time?: string
  } | null
  data: {
    temperature?: number
    humidity?: number
    timestamp?: string
  } | null
  error?: string
  message?: string
}

export const patrolApi = {
  // 获取巡圈记录列表
  async getPatrolRecords(params: PatrolListParams = {}): Promise<{ data: PatrolListResponse }> {
    console.log('巡圈记录API调用参数:', params)
    const response = await monitoringServiceApi.get('/patrol/records', params)
    console.log('巡圈记录API响应:', response)
    return { data: response.data }
  },

  // 获取巡圈记录详情
  async getPatrolRecordById(id: number): Promise<{ data: PatrolRecord }> {
    const response = await monitoringServiceApi.getById('/patrol/records', id)
    return { data: response.data }
  },

  // 创建巡圈记录
  async createPatrolRecord(data: CreatePatrolRecordRequest): Promise<{ data: PatrolRecord }> {
    console.log('创建巡圈记录API调用参数:', data)
    const response = await monitoringServiceApi.post('/patrol/records', data)
    console.log('创建巡圈记录API响应:', response)
    return { data: response.data }
  },

  // 更新巡圈记录
  async updatePatrolRecord(id: number, data: UpdatePatrolRecordRequest): Promise<{ data: PatrolRecord }> {
    const response = await monitoringServiceApi.update('/patrol/records', id, data)
    return { data: response.data }
  },

  // 删除巡圈记录
  async deletePatrolRecord(id: number): Promise<void> {
    await monitoringServiceApi.remove('/patrol/records', id)
  },

  // 获取巡圈统计数据
  async getPatrolStatistics(params: { base_id: number; start_date: string; end_date: string }): Promise<{ data: PatrolStatistics }> {
    console.log('巡圈统计API调用参数:', params)
    const response = await monitoringServiceApi.get('/patrol/statistics', params)
    console.log('巡圈统计API响应:', response)
    return { data: response.data }
  },

  // 获取今日巡圈任务
  async getTodayPatrolTasks(params: { base_id?: number } = {}): Promise<{ data: TodayPatrolTasks }> {
    console.log('今日巡圈任务API调用参数:', params)
    const response = await monitoringServiceApi.get('/patrol/tasks/today', params)
    console.log('今日巡圈任务API响应:', response)
    return { data: response.data }
  },

  // 获取物联网设备数据
  async getIoTDeviceData(params: { barn_id: number }): Promise<{ data: IoTDeviceData }> {
    console.log('物联网设备数据API调用参数:', params)
    const response = await monitoringServiceApi.get('/patrol/iot/device-data', params)
    console.log('物联网设备数据API响应:', response)
    return { data: response.data }
  }
}