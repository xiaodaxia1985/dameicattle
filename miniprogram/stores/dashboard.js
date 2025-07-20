import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '../utils/api/dashboard.js'
import { useCacheStore } from './cache.js'

export const useDashboardStore = defineStore('dashboard', () => {
  const keyIndicators = ref({})
  const trendData = ref({})
  const realTimeStats = ref({})
  const pendingTasks = ref([])
  const healthDistribution = ref([])
  const feedingStats = ref({})
  const loading = ref(false)
  const lastUpdated = ref(null)

  const cacheStore = useCacheStore()

  // 获取关键业务指标
  const fetchKeyIndicators = async (params = {}) => {
    loading.value = true
    try {
      const response = await dashboardApi.getKeyIndicators(params)
      keyIndicators.value = response.data
      
      // 缓存数据
      const cacheKey = `indicators_${params.baseId || 'all'}`
      cacheStore.setCacheData(cacheKey, response.data, 5 * 60 * 1000) // 5分钟缓存
      
      lastUpdated.value = new Date()
      return response.data
    } catch (error) {
      console.error('获取关键指标失败:', error)
      
      // 尝试从缓存获取
      const cacheKey = `indicators_${params.baseId || 'all'}`
      const cachedData = cacheStore.getCacheData(cacheKey)
      if (cachedData) {
        keyIndicators.value = cachedData
        return cachedData
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取趋势分析数据
  const fetchTrendAnalysis = async (params = {}) => {
    try {
      const response = await dashboardApi.getTrendAnalysis(params)
      trendData.value = response.data
      
      // 缓存数据
      const cacheKey = `trends_${params.baseId || 'all'}_${params.period || '30d'}`
      cacheStore.setCacheData(cacheKey, response.data, 10 * 60 * 1000) // 10分钟缓存
      
      return response.data
    } catch (error) {
      console.error('获取趋势分析失败:', error)
      
      // 尝试从缓存获取
      const cacheKey = `trends_${params.baseId || 'all'}_${params.period || '30d'}`
      const cachedData = cacheStore.getCacheData(cacheKey)
      if (cachedData) {
        trendData.value = cachedData
        return cachedData
      }
      
      throw error
    }
  }

  // 获取实时统计数据
  const fetchRealTimeStats = async (params = {}) => {
    try {
      const response = await dashboardApi.getRealTimeStats(params)
      realTimeStats.value = response.data
      
      // 实时数据缓存时间较短
      const cacheKey = `realtime_${params.baseId || 'all'}`
      cacheStore.setCacheData(cacheKey, response.data, 2 * 60 * 1000) // 2分钟缓存
      
      return response.data
    } catch (error) {
      console.error('获取实时统计失败:', error)
      
      // 尝试从缓存获取
      const cacheKey = `realtime_${params.baseId || 'all'}`
      const cachedData = cacheStore.getCacheData(cacheKey)
      if (cachedData) {
        realTimeStats.value = cachedData
        return cachedData
      }
      
      throw error
    }
  }

  // 获取待处理任务
  const fetchPendingTasks = async (params = {}) => {
    try {
      const response = await dashboardApi.getPendingTasks(params)
      pendingTasks.value = response.data.tasks || []
      
      // 缓存数据
      const cacheKey = `tasks_${params.baseId || 'all'}`
      cacheStore.setCacheData(cacheKey, response.data, 3 * 60 * 1000) // 3分钟缓存
      
      return response.data
    } catch (error) {
      console.error('获取待处理任务失败:', error)
      
      // 尝试从缓存获取
      const cacheKey = `tasks_${params.baseId || 'all'}`
      const cachedData = cacheStore.getCacheData(cacheKey)
      if (cachedData) {
        pendingTasks.value = cachedData.tasks || []
        return cachedData
      }
      
      throw error
    }
  }

  // 获取健康状态分布
  const fetchHealthDistribution = async (params = {}) => {
    try {
      const response = await dashboardApi.getHealthDistribution(params)
      healthDistribution.value = response.data
      
      // 缓存数据
      const cacheKey = `health_dist_${params.baseId || 'all'}`
      cacheStore.setCacheData(cacheKey, response.data, 5 * 60 * 1000) // 5分钟缓存
      
      return response.data
    } catch (error) {
      console.error('获取健康分布失败:', error)
      
      // 尝试从缓存获取
      const cacheKey = `health_dist_${params.baseId || 'all'}`
      const cachedData = cacheStore.getCacheData(cacheKey)
      if (cachedData) {
        healthDistribution.value = cachedData
        return cachedData
      }
      
      throw error
    }
  }

  // 获取饲喂统计
  const fetchFeedingStats = async (params = {}) => {
    try {
      const response = await dashboardApi.getFeedingStats(params)
      feedingStats.value = response.data
      
      // 缓存数据
      const cacheKey = `feeding_stats_${params.baseId || 'all'}`
      cacheStore.setCacheData(cacheKey, response.data, 5 * 60 * 1000) // 5分钟缓存
      
      return response.data
    } catch (error) {
      console.error('获取饲喂统计失败:', error)
      
      // 尝试从缓存获取
      const cacheKey = `feeding_stats_${params.baseId || 'all'}`
      const cachedData = cacheStore.getCacheData(cacheKey)
      if (cachedData) {
        feedingStats.value = cachedData
        return cachedData
      }
      
      throw error
    }
  }

  // 刷新所有数据
  const refreshAll = async (baseId) => {
    const params = baseId ? { baseId } : {}
    
    try {
      loading.value = true
      
      await Promise.allSettled([
        fetchKeyIndicators(params),
        fetchRealTimeStats(params),
        fetchPendingTasks(params),
        fetchHealthDistribution(params),
        fetchFeedingStats(params)
      ])
      
      lastUpdated.value = new Date()
    } catch (error) {
      console.error('刷新数据失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 清除缓存
  const clearCache = () => {
    cacheStore.clearCacheByPrefix('indicators_')
    cacheStore.clearCacheByPrefix('trends_')
    cacheStore.clearCacheByPrefix('realtime_')
    cacheStore.clearCacheByPrefix('tasks_')
    cacheStore.clearCacheByPrefix('health_dist_')
    cacheStore.clearCacheByPrefix('feeding_stats_')
  }

  return {
    keyIndicators,
    trendData,
    realTimeStats,
    pendingTasks,
    healthDistribution,
    feedingStats,
    loading,
    lastUpdated,
    fetchKeyIndicators,
    fetchTrendAnalysis,
    fetchRealTimeStats,
    fetchPendingTasks,
    fetchHealthDistribution,
    fetchFeedingStats,
    refreshAll,
    clearCache
  }
})