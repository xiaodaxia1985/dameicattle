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
      console.log('fetchBases 原始响应:', response)
      
      // 使用安全访问处理响应数据
      const responseData = response?.data || response || {}
      let basesData: Base[] = []
      
      // 尝试多种可能的数据结构
      if (Array.isArray(responseData)) {
        basesData = responseData
      } else if (Array.isArray(responseData.bases)) {
        basesData = responseData.bases
      } else if (Array.isArray(responseData.data)) {
        basesData = responseData.data
      } else if (responseData.data && Array.isArray(responseData.data.bases)) {
        basesData = responseData.data.bases
      }
      
      // 验证数据完整性
      const validatedBases = basesData.filter(base => 
        base && typeof base === 'object' && base.id && base.name
      )
      
      if (validatedBases.length !== basesData.length) {
        console.warn(`过滤了 ${basesData.length - validatedBases.length} 条无效基地数据`)
      }
      
      bases.value = validatedBases
      console.log('处理后的基地数据:', bases.value)
      
      return responseData
    } catch (error) {
      console.error('获取基地列表失败:', error)
      bases.value = []
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取所有基地（不分页）
  const fetchAllBases = async () => {
    loading.value = true
    try {
      const response = await baseApi.getBases({ limit: 1000 }) // 使用getBases方法并设置较大的limit参数
      
      // 使用安全访问处理响应数据
      const responseData = response?.data || response || {} 
      let basesData: Base[] = []
      
      // 尝试多种可能的数据结构
      if (Array.isArray(responseData)) {
        basesData = responseData
      } else if (Array.isArray(responseData.bases)) {
        basesData = responseData.bases
      } else if (Array.isArray(responseData.data)) {
        basesData = responseData.data
      } else if (responseData.data && Array.isArray(responseData.data.bases)) {
        basesData = responseData.data.bases
      }
      
      bases.value = basesData
      return basesData
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
      // 后端返回的数据结构是 { data: { barns: [], pagination: {} } }
      barns.value = response.data.barns || response.data.data || []
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
      // 安全处理响应数据
      const responseData = response?.data || response || {}
      // 后端返回 { data: { barns: [], base_info: {} } }
      return responseData.barns || []
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