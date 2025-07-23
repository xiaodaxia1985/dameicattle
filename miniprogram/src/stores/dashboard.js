// Simple dashboard store without pinia
import { cacheStore } from './cache.js'

export const dashboardStore = {
  // State
  keyIndicators: {},
  trendData: {},
  realTimeStats: {},
  pendingTasks: [],
  healthDistribution: [],
  feedingStats: {},
  loading: false,
  lastUpdated: null,

  // 获取关键业务指标
  async fetchKeyIndicators(params = {}) {
    this.loading = true
    try {
      const response = await uni.request({
        url: '/api/v1/dashboard/indicators',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        this.keyIndicators = response.data.data
        
        // 缓存数据
        const cacheKey = `indicators_${params.baseId || 'all'}`
        cacheStore.setCacheData(cacheKey, response.data.data, 5) // 5分钟缓存
        
        this.lastUpdated = new Date()
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取关键指标失败')
      }
    } catch (error) {
      console.error('获取关键指标失败:', error)
      
      // 尝试从缓存获取
      const cacheKey = `indicators_${params.baseId || 'all'}`
      const cachedData = cacheStore.getCacheData(cacheKey)
      if (cachedData) {
        this.keyIndicators = cachedData
        return cachedData
      }
      
      throw error
    } finally {
      this.loading = false
    }
  },

  // 获取实时统计数据
  async fetchRealTimeStats(params = {}) {
    try {
      const response = await uni.request({
        url: '/api/v1/dashboard/realtime',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        this.realTimeStats = response.data.data
        
        // 实时数据缓存时间较短
        const cacheKey = `realtime_${params.baseId || 'all'}`
        cacheStore.setCacheData(cacheKey, response.data.data, 2) // 2分钟缓存
        
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取实时统计失败')
      }
    } catch (error) {
      console.error('获取实时统计失败:', error)
      
      // 尝试从缓存获取
      const cacheKey = `realtime_${params.baseId || 'all'}`
      const cachedData = cacheStore.getCacheData(cacheKey)
      if (cachedData) {
        this.realTimeStats = cachedData
        return cachedData
      }
      
      throw error
    }
  },

  // 获取待处理任务
  async fetchPendingTasks(params = {}) {
    try {
      const response = await uni.request({
        url: '/api/v1/dashboard/tasks',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        this.pendingTasks = response.data.data.tasks || []
        
        // 缓存数据
        const cacheKey = `tasks_${params.baseId || 'all'}`
        cacheStore.setCacheData(cacheKey, response.data.data, 3) // 3分钟缓存
        
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取待处理任务失败')
      }
    } catch (error) {
      console.error('获取待处理任务失败:', error)
      
      // 尝试从缓存获取
      const cacheKey = `tasks_${params.baseId || 'all'}`
      const cachedData = cacheStore.getCacheData(cacheKey)
      if (cachedData) {
        this.pendingTasks = cachedData.tasks || []
        return cachedData
      }
      
      throw error
    }
  },

  // 刷新所有数据
  async refreshAll(baseId) {
    const params = baseId ? { baseId } : {}
    
    try {
      this.loading = true
      
      await Promise.allSettled([
        this.fetchKeyIndicators(params),
        this.fetchRealTimeStats(params),
        this.fetchPendingTasks(params)
      ])
      
      this.lastUpdated = new Date()
    } catch (error) {
      console.error('刷新数据失败:', error)
      throw error
    } finally {
      this.loading = false
    }
  },

  // 清除缓存
  clearCache() {
    cacheStore.clearAllCache()
  }
}