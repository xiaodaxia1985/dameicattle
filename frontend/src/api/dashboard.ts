import request from './request'
import type { ApiResponse } from './request'

export interface KeyIndicators {
  totalCattle: number
  healthRate: number
  monthlyRevenue: number
  recentPurchases: number
  cattleByHealth: Array<{
    health_status: string
    count: number
  }>
  pendingTasks: {
    total: number
    breakdown: {
      healthAlerts: number
      inventoryAlerts: number
      equipmentFailures: number
      overdueVaccinations: number
    }
  }
}

export interface TrendData {
  period: string
  startDate: string
  endDate: string
  trends: {
    cattle?: Array<{
      date: string
      total: number
      healthy: number
      sick: number
      treatment: number
    }>
    health?: Array<{
      date: string
      total_records: number
      completed: number
      ongoing: number
    }>
    feeding?: Array<{
      date: string
      feeding_count: number
      total_amount: number
      avg_amount: number
    }>
    sales?: Array<{
      date: string
      order_count: number
      total_revenue: number
      avg_order_value: number
    }>
  }
}

export interface RealTimeStats {
  activeCattle: number
  todayFeeding: number
  todayHealthRecords: number
  activeAlerts: number
  equipmentFailures: number
  lastUpdated: string
}

export interface PendingTask {
  id: string
  type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  dueDate: string | null
  createdAt: string
  url: string
}

export interface PendingTasks {
  tasks: PendingTask[]
  total: number
  summary: {
    high: number
    medium: number
    low: number
  }
}

export interface ComparativeAnalysis {
  compareType: 'period' | 'base'
  currentPeriod?: {
    start: string
    end: string
  }
  previousPeriod?: {
    start: string
    end: string
  }
  comparison?: {
    cattle: {
      current: number
      previous: number
      change: number
      changePercent: string
    }
    revenue: {
      current: number
      previous: number
      change: number
      changePercent: string
    }
    feeding: {
      current: number
      previous: number
      change: number
      changePercent: string
    }
  }
}

export const dashboardApi = {
  // 获取关键业务指标
  getKeyIndicators(params: { baseId?: number; startDate?: string; endDate?: string } = {}): Promise<{ data: KeyIndicators }> {
    return request.get<ApiResponse<KeyIndicators>>('/dashboard/indicators', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取趋势分析
  getTrendAnalysis(params: { 
    baseId?: number
    period?: '7d' | '30d' | '90d' | '1y'
    metrics?: string
  } = {}): Promise<{ data: TrendData }> {
    return request.get<ApiResponse<TrendData>>('/dashboard/trends', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取实时统计
  getRealTimeStats(params: { baseId?: number } = {}): Promise<{ data: RealTimeStats }> {
    return request.get<ApiResponse<RealTimeStats>>('/dashboard/realtime', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取待处理任务
  getPendingTasks(params: { baseId?: number; limit?: number } = {}): Promise<{ data: PendingTasks }> {
    return request.get<ApiResponse<PendingTasks>>('/dashboard/tasks', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取对比分析
  getComparativeAnalysis(params: {
    compareType?: 'period' | 'base'
    currentPeriod?: string
    previousPeriod?: string
    baseIds?: string
  } = {}): Promise<{ data: ComparativeAnalysis }> {
    return request.get<ApiResponse<ComparativeAnalysis>>('/dashboard/compare', { params })
      .then(response => ({ data: response.data.data }))
  }
}