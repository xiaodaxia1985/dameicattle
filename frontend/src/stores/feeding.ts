import { defineStore } from 'pinia'
import { ref } from 'vue'
import { feedingApi } from '@/api/feeding'
import type { FeedFormula, FeedingRecord } from '@/api/feeding'

export const useFeedingStore = defineStore('feeding', () => {
  const formulas = ref<FeedFormula[]>([])
  const feedingRecords = ref<FeedingRecord[]>([])
  const loading = ref(false)

  // 获取配方列表
  const fetchFormulas = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await feedingApi.getFormulas(params)
      formulas.value = response.data.data
      return response.data
    } catch (error) {
      console.error('获取配方列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取饲喂记录
  const fetchFeedingRecords = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await feedingApi.getFeedingRecords(params)
      feedingRecords.value = response.data.data
      return response.data
    } catch (error) {
      console.error('获取饲喂记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    formulas,
    feedingRecords,
    loading,
    fetchFormulas,
    fetchFeedingRecords
  }
})