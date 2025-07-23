import request from '../request.js'

/**
 * 仪表盘API接口
 */
export const dashboardApi = {
  // 获取关键业务指标
  async getKeyIndicators(params = {}) {
    return await request({
      url: '/dashboard/indicators',
      method: 'GET',
      data: params
    })
  },

  // 获取趋势分析
  async getTrendAnalysis(params = {}) {
    return await request({
      url: '/dashboard/trends',
      method: 'GET',
      data: params
    })
  },

  // 获取实时统计
  async getRealTimeStats(params = {}) {
    return await request({
      url: '/dashboard/realtime',
      method: 'GET',
      data: params
    })
  },

  // 获取待处理任务
  async getPendingTasks(params = {}) {
    return await request({
      url: '/dashboard/tasks',
      method: 'GET',
      data: params
    })
  },

  // 获取对比分析
  async getComparativeAnalysis(params = {}) {
    return await request({
      url: '/dashboard/compare',
      method: 'GET',
      data: params
    })
  },

  // 获取基地统计数据
  async getBaseStats(baseId) {
    return await request({
      url: `/bases/${baseId}/stats`,
      method: 'GET'
    })
  },

  // 获取健康状态分布
  async getHealthDistribution(params = {}) {
    return await request({
      url: '/dashboard/health-distribution',
      method: 'GET',
      data: params
    })
  },

  // 获取饲喂统计
  async getFeedingStats(params = {}) {
    return await request({
      url: '/dashboard/feeding-stats',
      method: 'GET',
      data: params
    })
  }
}