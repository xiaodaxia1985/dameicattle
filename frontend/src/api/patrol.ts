import { feedingServiceApi } from './microservices'
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
    console.log('🔍 patrolApi.getPatrolRecords 调用参数:', params)
    
    const response = await feedingServiceApi.get('/patrol/records', params)
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
        records: records,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    }
    
    console.log('✅ patrolApi.getPatrolRecords 解析结果:', { 
      recordsCount: records.length, 
      total, 
      page, 
      limit,
      sampleRecord: records[0] || null
    })
    
    return result
  },

  // 获取巡圈记录详情
  async getPatrolRecordById(id: number): Promise<{ data: PatrolRecord }> {
    console.log('🔍 patrolApi.getPatrolRecordById 调用参数:', id)
    
    const response = await feedingServiceApi.get(`/patrol/records/${id}`)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    const responseData = response?.data || response || {}
    console.log('✅ patrolApi.getPatrolRecordById 解析结果:', responseData)
    
    return { data: responseData }
  },

  // 创建巡圈记录
  async createPatrolRecord(data: CreatePatrolRecordRequest): Promise<{ data: PatrolRecord }> {
    console.log('🔍 patrolApi.createPatrolRecord 调用参数:', data)
    
    const response = await feedingServiceApi.post('/patrol/records', data)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    const responseData = response?.data || response || {}
    console.log('✅ patrolApi.createPatrolRecord 解析结果:', responseData)
    
    return { data: responseData }
  },

  // 更新巡圈记录
  async updatePatrolRecord(id: number, data: UpdatePatrolRecordRequest): Promise<{ data: PatrolRecord }> {
    console.log('🔍 patrolApi.updatePatrolRecord 调用参数:', { id, data })
    
    const response = await feedingServiceApi.put(`/patrol/records/${id}`, data)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    const responseData = response?.data || response || {}
    console.log('✅ patrolApi.updatePatrolRecord 解析结果:', responseData)
    
    return { data: responseData }
  },

  // 删除巡圈记录
  async deletePatrolRecord(id: number): Promise<void> {
    console.log('🔍 patrolApi.deletePatrolRecord 调用参数:', id)
    
    await feedingServiceApi.delete(`/patrol/records/${id}`)
    console.log('✅ patrolApi.deletePatrolRecord 删除成功')
  },

  // 获取巡圈统计数据
  async getPatrolStatistics(params: { base_id: number; start_date: string; end_date: string }): Promise<{ data: PatrolStatistics }> {
    console.log('🔍 patrolApi.getPatrolStatistics 调用参数:', params)
    
    const response = await feedingServiceApi.get('/patrol/statistics', params)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    const responseData = response?.data || response || {}
    console.log('✅ patrolApi.getPatrolStatistics 解析结果:', responseData)
    
    return { data: responseData }
  },

  // 获取今日巡圈任务
  async getTodayPatrolTasks(params: { base_id?: number } = {}): Promise<{ data: TodayPatrolTasks }> {
    console.log('🔍 patrolApi.getTodayPatrolTasks 调用参数:', params)
    
    const response = await feedingServiceApi.get('/patrol/tasks/today', params)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    const responseData = response?.data || response || {}
    console.log('✅ patrolApi.getTodayPatrolTasks 解析结果:', responseData)
    
    return { data: responseData }
  },

  // 获取物联网设备数据
  async getIoTDeviceData(params: { barn_id: number }): Promise<{ data: IoTDeviceData }> {
    console.log('🔍 patrolApi.getIoTDeviceData 调用参数:', params)
    
    const response = await feedingServiceApi.get('/patrol/iot/device-data', params)
    console.log('📥 feedingServiceApi 原始响应:', response)
    
    const responseData = response?.data || response || {}
    console.log('✅ patrolApi.getIoTDeviceData 解析结果:', responseData)
    
    return { data: responseData }
  }
}