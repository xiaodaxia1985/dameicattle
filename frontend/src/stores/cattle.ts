import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cattleApi } from '@/api/cattle'
import type { Cattle, CattleListParams, CattleStatistics, CreateCattleRequest, UpdateCattleRequest } from '@/api/cattle'

export const useCattleStore = defineStore('cattle', () => {
  const cattleList = ref<Cattle[]>([])
  const currentCattle = ref<Cattle | null>(null)
  const statistics = ref<CattleStatistics | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const searchParams = ref<CattleListParams>({
    page: 1,
    limit: 20
  })

  // 计算属性
  const healthyCount = computed(() => 
    cattleList.value?.filter(cattle => cattle.health_status === 'healthy').length || 0
  )
  
  const sickCount = computed(() => 
    cattleList.value?.filter(cattle => cattle.health_status === 'sick').length || 0
  )
  
  const treatmentCount = computed(() => 
    cattleList.value?.filter(cattle => cattle.health_status === 'treatment').length || 0
  )

  const maleCount = computed(() => 
    cattleList.value?.filter(cattle => cattle.gender === 'male').length || 0
  )

  const femaleCount = computed(() => 
    cattleList.value?.filter(cattle => cattle.gender === 'female').length || 0
  )

  // 获取牛只列表
  const fetchCattleList = async (params?: CattleListParams) => {
    loading.value = true
    try {
      if (params) {
        searchParams.value = { ...searchParams.value, ...params }
      }
      console.log('发送API请求，参数:', searchParams.value)
      const response = await cattleApi.getList(searchParams.value)
      console.log('API响应数据:', response)
      
      // 检查响应数据结构
      if (!response) {
        throw new Error('API返回空响应')
      }
      
      if (!response.data) {
        console.warn('响应中缺少data字段，使用空数组')
        cattleList.value = []
      } else {
        cattleList.value = response.data
      }
      
      if (!response.pagination) {
        console.warn('响应中缺少pagination字段，使用默认值')
        total.value = 0
      } else {
        total.value = response.pagination.total || 0
      }
      
      console.log('处理后的数据 - 列表长度:', cattleList.value.length, '总数:', total.value)
    } catch (error) {
      console.error('获取牛只列表失败:', error)
      cattleList.value = []
      total.value = 0
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取牛只统计
  const fetchCattleStatistics = async (baseId?: number) => {
    try {
      const response = await cattleApi.getStatistics(baseId)
      statistics.value = response
      return response
    } catch (error) {
      console.error('获取牛只统计失败:', error)
      throw error
    }
  }

  // 获取牛只详情
  const fetchCattleById = async (id: number) => {
    loading.value = true
    try {
      const response = await cattleApi.getById(id)
      currentCattle.value = response
      return response
    } catch (error) {
      console.error('获取牛只详情失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 通过耳标获取牛只
  const fetchCattleByEarTag = async (earTag: string) => {
    loading.value = true
    try {
      const response = await cattleApi.getByEarTag(earTag)
      return response
    } catch (error) {
      console.error('获取牛只信息失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建牛只
  const createCattle = async (data: CreateCattleRequest) => {
    loading.value = true
    try {
      const response = await cattleApi.create(data)
      cattleList.value.unshift(response)
      total.value += 1
      return response
    } catch (error) {
      console.error('创建牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新牛只
  const updateCattle = async (id: number, data: UpdateCattleRequest) => {
    loading.value = true
    try {
      const response = await cattleApi.update(id, data)
      const index = cattleList.value.findIndex(cattle => cattle.id === id)
      if (index !== -1) {
        cattleList.value[index] = response
      }
      if (currentCattle.value?.id === id) {
        currentCattle.value = response
      }
      return response
    } catch (error) {
      console.error('更新牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除牛只
  const deleteCattle = async (id: number) => {
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

  // 批量导入牛只
  const batchImportCattle = async (file: File) => {
    loading.value = true
    try {
      const response = await cattleApi.batchImport(file)
      // 重新加载列表
      await fetchCattleList()
      return response
    } catch (error) {
      console.error('批量导入牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 批量转移牛只
  const batchTransferCattle = async (cattleIds: number[], fromBarnId?: number, toBarnId?: number, reason?: string) => {
    loading.value = true
    try {
      const response = await cattleApi.batchTransfer({
        cattle_ids: cattleIds,
        from_barn_id: fromBarnId,
        to_barn_id: toBarnId,
        reason
      })
      // 重新加载列表
      await fetchCattleList()
      return response
    } catch (error) {
      console.error('批量转移牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 重置状态
  const resetState = () => {
    cattleList.value = []
    currentCattle.value = null
    statistics.value = null
    total.value = 0
    searchParams.value = { page: 1, limit: 20 }
  }

  return {
    cattleList,
    currentCattle,
    statistics,
    total,
    loading,
    searchParams,
    healthyCount,
    sickCount,
    treatmentCount,
    maleCount,
    femaleCount,
    fetchCattleList,
    fetchCattleStatistics,
    fetchCattleById,
    fetchCattleByEarTag,
    createCattle,
    updateCattle,
    deleteCattle,
    batchImportCattle,
    batchTransferCattle,
    resetState
  }
})