import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/api/dashboard'
import type { DashboardStats } from '@/api/dashboard'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats | null>(null)
  const todos = ref<any[]>([])
  const loading = ref(false)

  // 获取仪表盘统计数据
  const fetchStats = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await dashboardApi.getStats(params)
      stats.value = response.data
      return response.data
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取待处理事项
  const fetchTodos = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await dashboardApi.getTodos(params)
      todos.value = response.data
      return response.data
    } catch (error) {
      console.error('获取待处理事项失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    todos,
    loading,
    fetchStats,
    fetchTodos
  }
})