import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cattleApi } from '@/api/cattle'
import type { Cattle, CattleListParams } from '@/api/cattle'

export const useCattleStore = defineStore('cattle', () => {
  const cattleList = ref<Cattle[]>([])
  const currentCattle = ref<Cattle | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const searchParams = ref<CattleListParams>({
    page: 1,
    limit: 20
  })

  // 计算属性
  const healthyCount = computed(() => 
    cattleList.value.filter(cattle => cattle.healthStatus === 'healthy').length
  )
  
  const sickCount = computed(() => 
    cattleList.value.filter(cattle => cattle.healthStatus === 'sick').length
  )
  
  const treatmentCount = computed(() => 
    cattleList.value.filter(cattle => cattle.healthStatus === 'treatment').length
  )

  // 获取牛只列表
  const fetchCattleList = async (params?: CattleListParams) => {
    loading.value = true
    try {
      if (params) {
        searchParams.value = { ...searchParams.value, ...params }
      }
      const response = await cattleApi.getList(searchParams.value)
      cattleList.value = response.data.data
      total.value = response.data.total
    } catch (error) {
      console.error('获取牛只列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取牛只详情
  const fetchCattleById = async (id: string) => {
    loading.value = true
    try {
      const response = await cattleApi.getById(id)
      currentCattle.value = response.data
      return response.data
    } catch (error) {
      console.error('获取牛只详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建牛只
  const createCattle = async (data: any) => {
    loading.value = true
    try {
      const response = await cattleApi.create(data)
      cattleList.value.unshift(response.data)
      total.value += 1
      return response.data
    } catch (error) {
      console.error('创建牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新牛只
  const updateCattle = async (id: string, data: any) => {
    loading.value = true
    try {
      const response = await cattleApi.update(id, data)
      const index = cattleList.value.findIndex(cattle => cattle.id === id)
      if (index !== -1) {
        cattleList.value[index] = response.data
      }
      if (currentCattle.value?.id === id) {
        currentCattle.value = response.data
      }
      return response.data
    } catch (error) {
      console.error('更新牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除牛只
  const deleteCattle = async (id: string) => {
    loading.value = true
    try {
      await cattleApi.delete(id)
      const index = cattleList.value.findIndex(cattle => cattle.id === id)
      if (index !== -1) {
        cattleList.value.splice(index, 1)
        total.value -= 1
      }
      if (currentCattle.value?.id === id) {
        currentCattle.value = null
      }
    } catch (error) {
      console.error('删除牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  const resetState = () => {
    cattleList.value = []
    currentCattle.value = null
    total.value = 0
    searchParams.value = { page: 1, limit: 20 }
  }

  return {
    cattleList,
    currentCattle,
    total,
    loading,
    searchParams,
    healthyCount,
    sickCount,
    treatmentCount,
    fetchCattleList,
    fetchCattleById,
    createCattle,
    updateCattle,
    deleteCattle,
    resetState
  }
})