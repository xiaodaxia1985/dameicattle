import { monitoringServiceApi, cattleServiceApi, healthServiceApi, feedingServiceApi, salesServiceApi } from './microservices'
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
  async getKeyIndicators(params: { baseId?: number; startDate?: string; endDate?: string } = {}): Promise<{ data: KeyIndicators }> {
    try {
      // 聚合多个微服务的数据来构建仪表板指标
      const [cattleStats, healthStats] = await Promise.all([
        cattleServiceApi.getCattleStatistics(params.baseId),
        healthServiceApi.getHealthStatistics(params.baseId)
      ])

      const indicators: KeyIndicators = {
        totalCattle: cattleStats.data.total || 0,
        healthRate: cattleStats.data.health_status ? 
          (cattleStats.data.health_status.find((h: any) => h.health_status === 'healthy')?.count || 0) / cattleStats.data.total * 100 : 0,
        monthlyRevenue: 0, // 需要从销售服务获取
        recentPurchases: 0, // 需要从采购服务获取
        cattleByHealth: cattleStats.data.health_status || [],
        pendingTasks: {
          total: 0,
          breakdown: {
            healthAlerts: 0,
            inventoryAlerts: 0,
            equipmentFailures: 0,
            overdueVaccinations: 0
          }
        }
      }

      return { data: indicators }
    } catch (error) {
      console.error('获取关键指标失败:', error)
      // 返回默认值
      return {
        data: {
          totalCattle: 0,
          healthRate: 0,
          monthlyRevenue: 0,
          recentPurchases: 0,
          cattleByHealth: [],
          pendingTasks: {
            total: 0,
            breakdown: {
              healthAlerts: 0,
              inventoryAlerts: 0,
              equipmentFailures: 0,
              overdueVaccinations: 0
            }
          }
        }
      }
    }
  },

  // 获取趋势分析
  async getTrendAnalysis(params: { 
    baseId?: number
    period?: '7d' | '30d' | '90d' | '1y'
    metrics?: string
  } = {}): Promise<{ data: TrendData }> {
    try {
      // 从监控服务获取业务指标
      const response = await monitoringServiceApi.getBusinessMetrics(params.baseId)
      
      const trendData: TrendData = {
        period: params.period || '30d',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        trends: response.data.trends || {}
      }

      return { data: trendData }
    } catch (error) {
      console.error('获取趋势分析失败:', error)
      return {
        data: {
          period: params.period || '30d',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          trends: {}
        }
      }
    }
  },

  // 获取实时统计
  async getRealTimeStats(params: { baseId?: number } = {}): Promise<{ data: RealTimeStats }> {
    try {
      const response = await monitoringServiceApi.getBusinessMetrics(params.baseId)
      
      const stats: RealTimeStats = {
        activeCattle: response.data.activeCattle || 0,
        todayFeeding: response.data.todayFeeding || 0,
        todayHealthRecords: response.data.todayHealthRecords || 0,
        activeAlerts: response.data.activeAlerts || 0,
        equipmentFailures: response.data.equipmentFailures || 0,
        lastUpdated: new Date().toISOString()
      }

      return { data: stats }
    } catch (error) {
      console.error('获取实时统计失败:', error)
      return {
        data: {
          activeCattle: 0,
          todayFeeding: 0,
          todayHealthRecords: 0,
          activeAlerts: 0,
          equipmentFailures: 0,
          lastUpdated: new Date().toISOString()
        }
      }
    }
  },

  // 获取待处理任务
  async getPendingTasks(params: { baseId?: number; limit?: number } = {}): Promise<{ data: PendingTasks }> {
    try {
      const response = await monitoringServiceApi.get('/tasks', params)
      
      const tasks: PendingTasks = {
        tasks: response.data.tasks || [],
        total: response.data.total || 0,
        summary: response.data.summary || {
          high: 0,
          medium: 0,
          low: 0
        }
      }

      return { data: tasks }
    } catch (error) {
      console.error('获取待处理任务失败:', error)
      return {
        data: {
          tasks: [],
          total: 0,
          summary: {
            high: 0,
            medium: 0,
            low: 0
          }
        }
      }
    }
  },

  // 获取对比分析
  async getComparativeAnalysis(params: {
    compareType?: 'period' | 'base'
    currentPeriod?: string
    previousPeriod?: string
    baseIds?: string
  } = {}): Promise<{ data: ComparativeAnalysis }> {
    try {
      const response = await monitoringServiceApi.get('/compare', params)
      
      const analysis: ComparativeAnalysis = {
        compareType: params.compareType || 'period',
        currentPeriod: response.data.currentPeriod,
        previousPeriod: response.data.previousPeriod,
        comparison: response.data.comparison
      }

      return { data: analysis }
    } catch (error) {
      console.error('获取对比分析失败:', error)
      return {
        data: {
          compareType: params.compareType || 'period'
        }
      }
    }
  }
}