import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/api/dashboard'
import type { 
  KeyIndicators, 
  TrendData, 
  RealTimeStats, 
  PendingTasks, 
  ComparativeAnalysis 
} from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', () => {
  const keyIndicators = ref<KeyIndicators | null>(null)
  const trendData = ref<TrendData | null>(null)
  const realTimeStats = ref<RealTimeStats | null>(null)
  const pendingTasks = ref<PendingTasks | null>(null)
  const comparativeAnalysis = ref<ComparativeAnalysis | null>(null)
  const loading = ref(false)

  // 获取关键业务指标
  const fetchKeyIndicators = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await dashboardApi.getKeyIndicators(params)
      keyIndicators.value = response.data
      return response.data
    } catch (error) {
      console.error('获取关键指标失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取趋势分析数据
  const fetchTrendAnalysis = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await dashboardApi.getTrendAnalysis(params)
      trendData.value = response.data
      return response.data
    } catch (error) {
      console.error('获取趋势分析失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取实时统计数据
  const fetchRealTimeStats = async (params: any = {}) => {
    try {
      const response = await dashboardApi.getRealTimeStats(params)
      realTimeStats.value = response.data
      return response.data
    } catch (error) {
      console.error('获取实时统计失败:', error)
      throw error
    }
  }

  // 获取待处理任务
  const fetchPendingTasks = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await dashboardApi.getPendingTasks(params)
      pendingTasks.value = response.data
      return response.data
    } catch (error) {
      console.error('获取待处理任务失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取对比分析数据
  const fetchComparativeAnalysis = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await dashboardApi.getComparativeAnalysis(params)
      comparativeAnalysis.value = response.data
      return response.data
    } catch (error) {
      console.error('获取对比分析失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 刷新所有数据
  const refreshAll = async (baseId?: number) => {
    const params = baseId ? { baseId } : {}
    await Promise.all([
      fetchKeyIndicators(params),
      fetchRealTimeStats(params),
      fetchPendingTasks(params)
    ])
  }

  return {
    keyIndicators,
    trendData,
    realTimeStats,
    pendingTasks,
    comparativeAnalysis,
    loading,
    fetchKeyIndicators,
    fetchTrendAnalysis,
    fetchRealTimeStats,
    fetchPendingTasks,
    fetchComparativeAnalysis,
    refreshAll
  }
})