import request from './request'
import type { ApiResponse } from './request'

export interface DashboardStats {
  cattleTotal: number
  healthyCount: number
  sickCount: number
  treatmentCount: number
  monthlyRevenue: number
  monthlyExpense: number
  alerts: Array<{
    id: string
    type: string
    message: string
    level: 'low' | 'medium' | 'high'
    createdAt: string
  }>
}

export const dashboardApi = {
  // 获取仪表盘统计数据
  getStats(params: { baseId?: number } = {}): Promise<{ data: DashboardStats }> {
    return request.get<ApiResponse<DashboardStats>>('/dashboard/stats', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取待处理事项
  getTodos(params: { baseId?: number } = {}): Promise<{ data: any[] }> {
    return request.get<ApiResponse<any[]>>('/dashboard/todos', { params })
      .then(response => ({ data: response.data.data }))
  }
}