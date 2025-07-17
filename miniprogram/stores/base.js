import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBaseStore = defineStore('base', () => {
  const bases = ref([])
  const currentBase = ref(null)
  const loading = ref(false)

  // 获取所有基地
  const fetchAllBases = async () => {
    loading.value = true
    try {
      const response = await uni.request({
        url: '/api/v1/bases/all',
        method: 'GET'
      })
      
      if (response.data.success) {
        bases.value = response.data.data
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取基地列表失败')
      }
    } catch (error) {
      console.error('获取基地列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 设置当前基地
  const setCurrentBase = (base) => {
    currentBase.value = base
    if (base) {
      uni.setStorageSync('currentBase', base)
    } else {
      uni.removeStorageSync('currentBase')
    }
  }

  // 获取基地位置
  const getBaseLocation = async (baseId) => {
    try {
      const response = await uni.request({
        url: `/api/v1/bases/${baseId}/location`,
        method: 'GET'
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取基地位置失败')
      }
    } catch (error) {
      console.error('获取基地位置失败:', error)
      throw error
    }
  }

  return {
    bases,
    currentBase,
    loading,
    fetchAllBases,
    setCurrentBase,
    getBaseLocation
  }
})