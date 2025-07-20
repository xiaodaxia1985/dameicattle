import { defineStore } from 'pinia'
import { ref } from 'vue'
import { barnApi } from '@/api/barn'
import type { Barn } from '@/api/barn'

export const useBarnStore = defineStore('barn', () => {
  const barnList = ref<Barn[]>([])
  const currentBarn = ref<Barn | null>(null)
  const loading = ref(false)

  // 获取牛棚列表
  const fetchBarnList = async (baseId?: number) => {
    loading.value = true
    try {
      const response = await barnApi.getList({ baseId })
      barnList.value = response.data
      return response
    } catch (error) {
      console.error('获取牛棚列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取牛棚详情
  const fetchBarnById = async (id: number) => {
    loading.value = true
    try {
      const response = await barnApi.getById(id)
      currentBarn.value = response
      return response
    } catch (error) {
      console.error('获取牛棚详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建牛棚
  const createBarn = async (data: any) => {
    loading.value = true
    try {
      const response = await barnApi.create(data)
      barnList.value.unshift(response)
      return response
    } catch (error) {
      console.error('创建牛棚失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新牛棚
  const updateBarn = async (id: number, data: any) => {
    loading.value = true
    try {
      const response = await barnApi.update(id, data)
      const index = barnList.value.findIndex(barn => barn.id === id)
      if (index !== -1) {
        barnList.value[index] = response
      }
      if (currentBarn.value?.id === id) {
        currentBarn.value = response
      }
      return response
    } catch (error) {
      console.error('更新牛棚失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除牛棚
  const deleteBarn = async (id: number) => {
    loading.value = true
    try {
      await barnApi.delete(id)
      const index = barnList.value.findIndex(barn => barn.id === id)
      if (index !== -1) {
        barnList.value.splice(index, 1)
      }
      if (currentBarn.value?.id === id) {
        currentBarn.value = null
      }
    } catch (error) {
      console.error('删除牛棚失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  const resetState = () => {
    barnList.value = []
    currentBarn.value = null
  }

  return {
    barnList,
    currentBarn,
    loading,
    fetchBarnList,
    fetchBarnById,
    createBarn,
    updateBarn,
    deleteBarn,
    resetState
  }
})