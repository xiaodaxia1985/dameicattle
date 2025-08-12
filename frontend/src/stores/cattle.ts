import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cattleApi } from '@/api/cattle'
import type { Cattle, CattleListParams, CattleStatistics, CreateCattleRequest, UpdateCattleRequest } from '@/api/cattle'
import type { PaginatedApiResponse } from '@/types/api'
import { safeGet, ensureArray, ensureNumber } from '@/utils/safeAccess'
import { createSafePagination, normalizePaginationParams } from '@/utils/paginationHelpers'

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

  // 计算属性 - 使用安全访问
  const healthyCount = computed(() => 
    ensureArray(cattleList.value).filter(cattle => 
      safeGet(cattle, 'health_status') === 'healthy'
    ).length
  )
  
  const sickCount = computed(() => 
    ensureArray(cattleList.value).filter(cattle => 
      safeGet(cattle, 'health_status') === 'sick'
    ).length
  )
  
  const treatmentCount = computed(() => 
    ensureArray(cattleList.value).filter(cattle => 
      safeGet(cattle, 'health_status') === 'treatment'
    ).length
  )

  const maleCount = computed(() => 
    ensureArray(cattleList.value).filter(cattle => 
      safeGet(cattle, 'gender') === 'male'
    ).length
  )

  const femaleCount = computed(() => 
    ensureArray(cattleList.value).filter(cattle => 
      safeGet(cattle, 'gender') === 'female'
    ).length
  )

  // 获取牛只列表 - 使用安全数据访问和统一响应处理
  const fetchCattleList = async (params?: CattleListParams) => {
    loading.value = true
    try {
      // 规范化分页参数
      const normalizedParams = normalizePaginationParams(params || searchParams.value)
      searchParams.value = { ...searchParams.value, ...params, ...normalizedParams }
      
      console.log('发送API请求，参数:', searchParams.value)
      const response = await cattleApi.getList(searchParams.value)
      console.log('API响应数据:', response)
      
      // 使用安全访问获取数据，增强错误处理
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid API response')
      }
      
      const data = ensureArray(safeGet(response, 'data', []))
      const paginationData = safeGet(response, 'pagination', {})
      
      // 验证数据完整性
      const validatedData = data.filter(item => {
        return item && typeof item === 'object' && item.id && item.ear_tag
      })
      
      if (validatedData.length !== data.length) {
        console.warn(`过滤了 ${data.length - validatedData.length} 条无效数据`)
      }
      
      // 创建安全的分页信息
      const safePagination = createSafePagination(paginationData)
      
      cattleList.value = validatedData
      total.value = safePagination.total
      
      console.log('处理后的数据 - 列表长度:', cattleList.value.length, '总数:', total.value)
    } catch (error) {
      console.error('获取牛只列表失败:', error)
      cattleList.value = []
      total.value = 0
      
      // 提供用户友好的错误信息
      const errorMessage = error instanceof Error ? error.message : '获取牛只列表失败'
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // 获取牛只统计 - 使用安全数据访问
  const fetchCattleStatistics = async (baseId?: number) => {
    try {
      const response = await cattleApi.getStatistics(baseId)
      // 确保统计数据的安全访问
      const safeStatistics = {
        total: ensureNumber(safeGet(response, 'total', 0)),
        health_status: ensureArray(safeGet(response, 'health_status', [])),
        gender: ensureArray(safeGet(response, 'gender', [])),
        breeds: ensureArray(safeGet(response, 'breeds', []))
      }
      statistics.value = safeStatistics as CattleStatistics
      return safeStatistics
    } catch (error) {
      console.error('获取牛只统计失败:', error)
      statistics.value = null
      throw error
    }
  }

  // 获取牛只详情 - 使用安全数据访问
  const fetchCattleById = async (id: number) => {
    loading.value = true
    try {
      const response = await cattleApi.getById(id)
      // 确保牛只数据的完整性
      if (response && typeof response === 'object') {
        currentCattle.value = response
        return response
      } else {
        throw new Error('Invalid cattle data received')
      }
    } catch (error) {
      console.error('获取牛只详情失败:', error)
      currentCattle.value = null
      throw error
    } finally {
      loading.value = false
    }
  }

  // 通过耳标获取牛只 - 使用安全数据访问
  const fetchCattleByEarTag = async (earTag: string) => {
    loading.value = true
    try {
      if (!earTag || typeof earTag !== 'string') {
        throw new Error('Invalid ear tag provided')
      }
      const response = await cattleApi.getByEarTag(earTag)
      return response
    } catch (error) {
      console.error('获取牛只信息失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建牛只 - 使用安全数据访问
  const createCattle = async (data: CreateCattleRequest) => {
    loading.value = true
    try {
      const response = await cattleApi.create(data)
      if (response && typeof response === 'object') {
        ensureArray(cattleList.value).unshift(response)
        total.value = ensureNumber(total.value) + 1
        return response
      } else {
        throw new Error('Invalid response data received')
      }
    } catch (error) {
      console.error('创建牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新牛只 - 使用安全数据访问
  const updateCattle = async (id: number, data: UpdateCattleRequest) => {
    loading.value = true
    try {
      const response = await cattleApi.update(id, data)
      if (response && typeof response === 'object') {
        const safeList = ensureArray(cattleList.value)
        const index = safeList.findIndex(cattle => safeGet(cattle, 'id') === id)
        if (index !== -1) {
          safeList[index] = response
        }
        if (safeGet(currentCattle.value, 'id') === id) {
          currentCattle.value = response
        }
        return response
      } else {
        throw new Error('Invalid response data received')
      }
    } catch (error) {
      console.error('更新牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除牛只 - 使用安全数据访问
  const deleteCattle = async (id: number) => {
    loading.value = true
    try {
      await cattleApi.delete(id)
      const safeList = ensureArray(cattleList.value)
      const index = safeList.findIndex(cattle => safeGet(cattle, 'id') === id)
      if (index !== -1) {
        safeList.splice(index, 1)
        total.value = Math.max(0, ensureNumber(total.value) - 1)
      }
      if (safeGet(currentCattle.value, 'id') === id) {
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