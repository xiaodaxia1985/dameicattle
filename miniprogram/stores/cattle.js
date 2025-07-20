import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCattleStore = defineStore('cattle', () => {
  const cattleList = ref([])
  const currentCattle = ref(null)
  const statistics = ref({})
  const loading = ref(false)
  const total = ref(0)

  // 计算属性
  const healthyCount = computed(() => 
    cattleList.value.filter(cattle => cattle.health_status === 'healthy').length
  )
  
  const sickCount = computed(() => 
    cattleList.value.filter(cattle => cattle.health_status === 'sick').length
  )
  
  const treatmentCount = computed(() => 
    cattleList.value.filter(cattle => cattle.health_status === 'treatment').length
  )

  // 获取牛只列表
  const fetchCattleList = async (params = {}) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: '/api/v1/cattle',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        const result = response.data.data
        cattleList.value = result.data
        total.value = result.pagination.total
        return result
      } else {
        throw new Error(response.data.error?.message || '获取牛只列表失败')
      }
    } catch (error) {
      console.error('获取牛只列表失败:', error)
      
      // 尝试从缓存加载
      const cacheKey = `cattle_list_${JSON.stringify(params)}`
      const cachedData = uni.getStorageSync(cacheKey)
      if (cachedData) {
        cattleList.value = cachedData.data
        total.value = cachedData.total
        uni.showToast({
          title: '已加载离线数据',
          icon: 'none'
        })
        return cachedData
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取牛只统计
  const fetchCattleStatistics = async (baseId) => {
    try {
      const response = await uni.request({
        url: '/api/v1/cattle/statistics',
        method: 'GET',
        data: baseId ? { baseId } : {}
      })
      
      if (response.data.success) {
        statistics.value = response.data.data
        
        // 缓存统计数据
        const cacheKey = `cattle_stats_${baseId || 'all'}`
        uni.setStorageSync(cacheKey, statistics.value)
        
        return statistics.value
      } else {
        throw new Error(response.data.error?.message || '获取统计数据失败')
      }
    } catch (error) {
      console.error('获取牛只统计失败:', error)
      
      // 尝试从缓存加载
      const cacheKey = `cattle_stats_${baseId || 'all'}`
      const cachedStats = uni.getStorageSync(cacheKey)
      if (cachedStats) {
        statistics.value = cachedStats
        return cachedStats
      }
      
      throw error
    }
  }

  // 获取牛只详情
  const fetchCattleById = async (id) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: `/api/v1/cattle/${id}`,
        method: 'GET'
      })
      
      if (response.data.success) {
        currentCattle.value = response.data.data
        
        // 缓存牛只详情
        const cacheKey = `cattle_detail_${id}`
        uni.setStorageSync(cacheKey, currentCattle.value)
        
        return currentCattle.value
      } else {
        throw new Error(response.data.error?.message || '获取牛只详情失败')
      }
    } catch (error) {
      console.error('获取牛只详情失败:', error)
      
      // 尝试从缓存加载
      const cacheKey = `cattle_detail_${id}`
      const cachedCattle = uni.getStorageSync(cacheKey)
      if (cachedCattle) {
        currentCattle.value = cachedCattle
        uni.showToast({
          title: '已加载离线数据',
          icon: 'none'
        })
        return cachedCattle
      }
      
      throw error
    } finally {
      loading.value = false
    }
  }

  // 通过耳标获取牛只
  const fetchCattleByEarTag = async (earTag) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: `/api/v1/cattle/scan/${earTag}`,
        method: 'GET'
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || '未找到该牛只')
      }
    } catch (error) {
      console.error('获取牛只信息失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新牛只信息
  const updateCattle = async (id, data) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: `/api/v1/cattle/${id}`,
        method: 'PUT',
        data: data
      })
      
      if (response.data.success) {
        const updatedCattle = response.data.data
        
        // 更新列表中的牛只
        const index = cattleList.value.findIndex(cattle => cattle.id === id)
        if (index !== -1) {
          cattleList.value[index] = updatedCattle
        }
        
        // 更新当前牛只
        if (currentCattle.value?.id === id) {
          currentCattle.value = updatedCattle
        }
        
        // 更新缓存
        const cacheKey = `cattle_detail_${id}`
        uni.setStorageSync(cacheKey, updatedCattle)
        
        return updatedCattle
      } else {
        throw new Error(response.data.error?.message || '更新牛只失败')
      }
    } catch (error) {
      console.error('更新牛只失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 添加牛只事件
  const addCattleEvent = async (cattleId, eventData) => {
    try {
      const response = await uni.request({
        url: `/api/v1/cattle/${cattleId}/events`,
        method: 'POST',
        data: eventData
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || '添加事件失败')
      }
    } catch (error) {
      console.error('添加牛只事件失败:', error)
      throw error
    }
  }

  // 获取牛只事件
  const fetchCattleEvents = async (cattleId, params = {}) => {
    try {
      const response = await uni.request({
        url: `/api/v1/cattle/${cattleId}/events`,
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || '获取事件失败')
      }
    } catch (error) {
      console.error('获取牛只事件失败:', error)
      throw error
    }
  }

  // 上传牛只照片
  const uploadCattlePhoto = async (cattleId, filePath) => {
    try {
      const response = await uni.uploadFile({
        url: '/api/v1/upload/image',
        filePath: filePath,
        name: 'file',
        formData: {
          type: 'cattle_photo',
          cattleId: cattleId
        }
      })
      
      const result = JSON.parse(response.data)
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error?.message || '上传照片失败')
      }
    } catch (error) {
      console.error('上传牛只照片失败:', error)
      throw error
    }
  }

  // 离线数据同步
  const syncOfflineData = async () => {
    try {
      const offlineRecords = uni.getStorageSync('offlineRecords') || []
      if (offlineRecords.length === 0) {
        return { synced: 0, failed: 0 }
      }

      const response = await uni.request({
        url: '/api/v1/sync/offline-data',
        method: 'POST',
        data: {
          records: offlineRecords
        }
      })

      if (response.data.success) {
        const syncResult = response.data.data
        
        // 清除已同步的记录
        const syncedIds = syncResult.synced
          .filter(item => item.status === 'success')
          .map(item => item.localId)
        
        const remainingRecords = offlineRecords.filter(
          record => !syncedIds.includes(record.localId)
        )
        
        uni.setStorageSync('offlineRecords', remainingRecords)
        
        return {
          synced: syncResult.synced.filter(item => item.status === 'success').length,
          failed: syncResult.synced.filter(item => item.status === 'failed').length
        }
      } else {
        throw new Error(response.data.error?.message || '同步失败')
      }
    } catch (error) {
      console.error('离线数据同步失败:', error)
      throw error
    }
  }

  // 添加离线记录
  const addOfflineRecord = (type, data) => {
    const offlineRecords = uni.getStorageSync('offlineRecords') || []
    const record = {
      localId: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    }
    
    offlineRecords.push(record)
    uni.setStorageSync('offlineRecords', offlineRecords)
    
    return record
  }

  // 重置状态
  const resetState = () => {
    cattleList.value = []
    currentCattle.value = null
    statistics.value = {}
    total.value = 0
  }

  return {
    cattleList,
    currentCattle,
    statistics,
    loading,
    total,
    healthyCount,
    sickCount,
    treatmentCount,
    fetchCattleList,
    fetchCattleStatistics,
    fetchCattleById,
    fetchCattleByEarTag,
    updateCattle,
    addCattleEvent,
    fetchCattleEvents,
    uploadCattlePhoto,
    syncOfflineData,
    addOfflineRecord,
    resetState
  }
})