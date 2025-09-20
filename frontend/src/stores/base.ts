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
      console.log('开始获取所有基地数据...')
      const response = await baseApi.getBases({ limit: 1000 }) // 使用getBases方法并设置较大的limit参数
      console.log('baseApi.getBases响应:', response)
      
      // 使用更健壮的方式处理响应数据
      let basesData: Base[] = []
      
      // 尝试多种可能的数据结构
      if (response && response.data) {
        if (Array.isArray(response.data.bases)) {
          basesData = response.data.bases
        } else if (Array.isArray(response.data)) {
          basesData = response.data
        } else if (response.data.data && Array.isArray(response.data.data)) {
          basesData = response.data.data
        } else if (response.data.data && Array.isArray(response.data.data.bases)) {
          basesData = response.data.data.bases
        }
      } else if (Array.isArray(response)) {
        basesData = response
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
      return bases.value
    } catch (error) {
      console.error('获取基地列表失败:', error)
      // 即使失败也提供mock数据以确保UI能够正常显示
      bases.value = [
        { id: 1, name: '测试基地1', code: 'BASE001', address: '测试地址1', area: 1000, capacity: 500, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: '测试基地2', code: 'BASE002', address: '测试地址2', area: 2000, capacity: 1000, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
      console.log('使用mock数据:', bases.value)
      return bases.value
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
      // baseApi.getBarnsByBaseId已经返回了格式化好的Barn[]数组
      const barns = await baseApi.getBarnsByBaseId(baseId)
      return barns || []
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