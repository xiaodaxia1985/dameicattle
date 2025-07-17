import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref({})
  const todos = ref([])
  const loading = ref(false)

  // 获取统计数据
  const fetchStats = async (params = {}) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: '/api/v1/dashboard/stats',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        stats.value = response.data.data
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取统计数据失败')
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取待处理事项
  const fetchTodos = async (params = {}) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: '/api/v1/dashboard/todos',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        todos.value = response.data.data
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取待处理事项失败')
      }
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