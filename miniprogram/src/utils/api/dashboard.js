// 仪表板API
import { api } from '../apiClient'

export const dashboardApi = {
  // 获取仪表板统计数据
  async getStatistics() {
    try {
      const response = await api.get('/dashboard/statistics')
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取仪表板统计数据失败:', error)
      throw error
    }
  },

  // 获取最近活动
  async getRecentActivities(params = {}) {
    try {
      const response = await api.get('/dashboard/activities', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取最近活动失败:', error)
      throw error
    }
  },

  // 获取图表数据
  async getChartData(type, params = {}) {
    try {
      const response = await api.get(`/dashboard/charts/${type}`, params)
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取图表数据失败:', error)
      throw error
    }
  },

  // 获取预警信息
  async getAlerts(params = {}) {
    try {
      const response = await api.get('/dashboard/alerts', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取预警信息失败:', error)
      throw error
    }
  },

  // 获取天气信息
  async getWeatherInfo() {
    try {
      const response = await api.get('/dashboard/weather')
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取天气信息失败:', error)
      throw error
    }
  }
}

export default dashboardApi