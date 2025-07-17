import { defineStore } from 'pinia'
import { ref } from 'vue'
import { baseApi } from '@/api/base'
import type { Base, Barn } from '@/api/base'

export const useBaseStore = defineStore('base', () => {
  const bases = ref<Base[]>([])
  const barns = ref<Barn[]>([])
  const currentBase = ref<Base | null>(null)
  const loading = ref(false)

  // 获取基地列表
  const fetchBases = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await baseApi.getBases(params)
      bases.value = response.data.data
      return response.data
    } catch (error) {
      console.error('获取基地列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取所有基地（不分页）
  const fetchAllBases = async () => {
    loading.value = true
    try {
      const response = await baseApi.getAllBases()
      bases.value = response.data
      return response.data
    } catch (error) {
      console.error('获取基地列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取牛棚列表
  const fetchBarns = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await baseApi.getBarns(params)
      barns.value = response.data.data
      return response.data
    } catch (error) {
      console.error('获取牛棚列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 根据基地ID获取牛棚
  const fetchBarnsByBaseId = async (baseId: number) => {
    loading.value = true
    try {
      const response = await baseApi.getBarnsByBaseId(baseId)
      return response.data
    } catch (error) {
      console.error('获取牛棚列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 设置当前基地
  const setCurrentBase = (base: Base | null) => {
    currentBase.value = base
  }

  return {
    bases,
    barns,
    currentBase,
    loading,
    fetchBases,
    fetchAllBases,
    fetchBarns,
    fetchBarnsByBaseId,
    setCurrentBase
  }
})