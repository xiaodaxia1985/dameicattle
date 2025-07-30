/**
 * 数据加载组合函数
 * 提供统一的数据加载、错误处理、空数据处理功能
 */

import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { safeApiCall, type ErrorHandlerConfig } from '@/utils/errorHandler'
import { validatePaginationData, validateListData, validateDataArray } from '@/utils/dataValidation'

/**
 * 分页配置
 */
export interface PaginationConfig {
  page: number
  limit: number
  total: number
  totalPages?: number
}

/**
 * 数据加载配置
 */
export interface DataLoaderConfig<T> extends ErrorHandlerConfig {
  initialData?: T[]
  initialPagination?: Partial<PaginationConfig>
  validator?: (item: any) => T | null
  autoLoad?: boolean
  cacheKey?: string
  cacheDuration?: number
}

/**
 * 数据加载状态
 */
export interface DataLoaderState<T> {
  data: T[]
  loading: boolean
  error: any
  pagination: PaginationConfig
  isEmpty: boolean
  hasError: boolean
}

/**
 * 数据加载组合函数
 */
export function useDataLoader<T = any>(
  apiCall: (params?: any) => Promise<any>,
  config: DataLoaderConfig<T> = {}
) {
  const {
    initialData = [],
    initialPagination = { page: 1, limit: 20, total: 0 },
    validator,
    autoLoad = false,
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5分钟缓存
    ...errorConfig
  } = config

  // 响应式状态
  const data = ref<T[]>(initialData)
  const loading = ref(false)
  const error = ref<any>(null)
  const pagination = reactive<PaginationConfig>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    ...initialPagination
  })

  // 缓存相关
  const cacheData = ref<any>(null)
  const cacheTimestamp = ref<number>(0)

  // 计算属性
  const isEmpty = computed(() => data.value.length === 0)
  const hasError = computed(() => error.value !== null)
  const hasData = computed(() => data.value.length > 0)
  const isFirstPage = computed(() => pagination.page === 1)
  const isLastPage = computed(() => pagination.page >= (pagination.totalPages || 1))

  // 状态对象
  const state = computed<DataLoaderState<T>>(() => ({
    data: data.value,
    loading: loading.value,
    error: error.value,
    pagination: { ...pagination },
    isEmpty: isEmpty.value,
    hasError: hasError.value
  }))

  /**
   * 检查缓存是否有效
   */
  const isCacheValid = () => {
    if (!cacheKey || !cacheData.value) return false
    const now = Date.now()
    return (now - cacheTimestamp.value) < cacheDuration
  }

  /**
   * 设置缓存
   */
  const setCache = (responseData: any) => {
    if (cacheKey) {
      cacheData.value = responseData
      cacheTimestamp.value = Date.now()
    }
  }

  /**
   * 获取缓存
   */
  const getCache = () => {
    return isCacheValid() ? cacheData.value : null
  }

  /**
   * 加载数据
   */
  const load = async (params: any = {}) => {
    // 检查缓存
    const cached = getCache()
    if (cached) {
      processResponse(cached)
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await safeApiCall(
        () => apiCall({ ...params, page: pagination.page, limit: pagination.limit }),
        {
          ...errorConfig,
          fallbackValue: { data: [], pagination: { total: 0, page: 1, limit: pagination.limit } }
        }
      )

      if (response) {
        processResponse(response)
        setCache(response)
      }
    } catch (err) {
      error.value = err
      console.error('数据加载失败:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理响应数据
   */
  const processResponse = (response: any) => {
    try {
      // 验证分页数据
      const validatedData = validatePaginationData(response)
      
      // 验证列表数据
      let processedData = validatedData.data
      if (validator) {
        processedData = validateDataArray(processedData, validator)
      }

      // 更新状态
      data.value = processedData
      Object.assign(pagination, validatedData.pagination)
      
      // 计算总页数
      pagination.totalPages = Math.ceil(pagination.total / pagination.limit) || 1
    } catch (err) {
      console.error('数据处理失败:', err)
      data.value = []
      pagination.total = 0
      pagination.totalPages = 1
    }
  }

  /**
   * 刷新数据
   */
  const refresh = async (params: any = {}) => {
    // 清除缓存
    if (cacheKey) {
      cacheData.value = null
      cacheTimestamp.value = 0
    }
    await load(params)
  }

  /**
   * 重置到第一页
   */
  const reset = async (params: any = {}) => {
    pagination.page = 1
    await refresh(params)
  }

  /**
   * 跳转到指定页
   */
  const goToPage = async (page: number, params: any = {}) => {
    if (page < 1 || page > (pagination.totalPages || 1)) {
      return
    }
    pagination.page = page
    await load(params)
  }

  /**
   * 上一页
   */
  const prevPage = async (params: any = {}) => {
    if (pagination.page > 1) {
      await goToPage(pagination.page - 1, params)
    }
  }

  /**
   * 下一页
   */
  const nextPage = async (params: any = {}) => {
    if (pagination.page < (pagination.totalPages || 1)) {
      await goToPage(pagination.page + 1, params)
    }
  }

  /**
   * 改变每页大小
   */
  const changePageSize = async (size: number, params: any = {}) => {
    pagination.limit = size
    pagination.page = 1
    await load(params)
  }

  /**
   * 添加数据项
   */
  const addItem = (item: T, position: 'start' | 'end' = 'start') => {
    if (position === 'start') {
      data.value.unshift(item)
    } else {
      data.value.push(item)
    }
    pagination.total += 1
  }

  /**
   * 更新数据项
   */
  const updateItem = (predicate: (item: T) => boolean, updatedItem: Partial<T>) => {
    const index = data.value.findIndex(predicate)
    if (index !== -1) {
      data.value[index] = { ...data.value[index], ...updatedItem }
    }
  }

  /**
   * 删除数据项
   */
  const removeItem = (predicate: (item: T) => boolean) => {
    const index = data.value.findIndex(predicate)
    if (index !== -1) {
      data.value.splice(index, 1)
      pagination.total = Math.max(0, pagination.total - 1)
    }
  }

  /**
   * 清空数据
   */
  const clear = () => {
    data.value = []
    pagination.total = 0
    pagination.page = 1
    pagination.totalPages = 0
    error.value = null
  }

  // 自动加载
  if (autoLoad) {
    load()
  }

  return {
    // 状态
    data,
    loading,
    error,
    pagination,
    state,
    
    // 计算属性
    isEmpty,
    hasError,
    hasData,
    isFirstPage,
    isLastPage,
    
    // 方法
    load,
    refresh,
    reset,
    goToPage,
    prevPage,
    nextPage,
    changePageSize,
    addItem,
    updateItem,
    removeItem,
    clear
  }
}

/**
 * 简单列表数据加载组合函数
 */
export function useSimpleDataLoader<T = any>(
  apiCall: () => Promise<any>,
  config: Omit<DataLoaderConfig<T>, 'initialPagination'> = {}
) {
  const data = ref<T[]>(config.initialData || [])
  const loading = ref(false)
  const error = ref<any>(null)

  const isEmpty = computed(() => data.value.length === 0)
  const hasError = computed(() => error.value !== null)
  const hasData = computed(() => data.value.length > 0)

  const load = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await safeApiCall(
        apiCall,
        {
          ...config,
          fallbackValue: []
        }
      )

      if (response) {
        let processedData = validateListData(response, [])
        if (config.validator) {
          processedData = validateDataArray(processedData, config.validator)
        }
        data.value = processedData
      }
    } catch (err) {
      error.value = err
      console.error('数据加载失败:', err)
    } finally {
      loading.value = false
    }
  }

  const refresh = () => load()

  const addItem = (item: T, position: 'start' | 'end' = 'start') => {
    if (position === 'start') {
      data.value.unshift(item)
    } else {
      data.value.push(item)
    }
  }

  const updateItem = (predicate: (item: T) => boolean, updatedItem: Partial<T>) => {
    const index = data.value.findIndex(predicate)
    if (index !== -1) {
      data.value[index] = { ...data.value[index], ...updatedItem }
    }
  }

  const removeItem = (predicate: (item: T) => boolean) => {
    const index = data.value.findIndex(predicate)
    if (index !== -1) {
      data.value.splice(index, 1)
    }
  }

  const clear = () => {
    data.value = []
    error.value = null
  }

  if (config.autoLoad) {
    load()
  }

  return {
    data,
    loading,
    error,
    isEmpty,
    hasError,
    hasData,
    load,
    refresh,
    addItem,
    updateItem,
    removeItem,
    clear
  }
}

/**
 * 统计数据加载组合函数
 */
export function useStatsLoader<T = any>(
  apiCall: () => Promise<any>,
  defaultStats: T,
  config: Omit<DataLoaderConfig<T>, 'initialData' | 'validator'> = {}
) {
  const stats = ref<T>(defaultStats)
  const loading = ref(false)
  const error = ref<any>(null)

  const load = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await safeApiCall(
        apiCall,
        {
          ...config,
          fallbackValue: defaultStats
        }
      )

      if (response) {
        stats.value = { ...defaultStats, ...response }
      }
    } catch (err) {
      error.value = err
      console.error('统计数据加载失败:', err)
    } finally {
      loading.value = false
    }
  }

  const refresh = () => load()

  if (config.autoLoad) {
    load()
  }

  return {
    stats,
    loading,
    error,
    load,
    refresh
  }
}