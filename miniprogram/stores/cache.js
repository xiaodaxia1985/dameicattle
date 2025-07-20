import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCacheStore = defineStore('cache', () => {
  const cacheData = ref({})
  const cacheExpiry = ref({})
  const syncQueue = ref([])
  const isOnline = ref(true)

  // 默认缓存时间（毫秒）
  const DEFAULT_CACHE_TIME = 30 * 60 * 1000 // 30分钟
  const OFFLINE_CACHE_TIME = 24 * 60 * 60 * 1000 // 24小时

  // 设置缓存数据
  const setCacheData = (key, data, expireTime = DEFAULT_CACHE_TIME) => {
    const now = Date.now()
    cacheData.value[key] = data
    cacheExpiry.value[key] = now + expireTime
    
    // 持久化到本地存储
    try {
      uni.setStorageSync(`cache_${key}`, {
        data,
        expiry: cacheExpiry.value[key],
        timestamp: now
      })
    } catch (error) {
      console.error('缓存数据到本地存储失败:', error)
    }
  }

  // 获取缓存数据
  const getCacheData = (key, allowExpired = false) => {
    const now = Date.now()
    
    // 先从内存缓存获取
    if (cacheData.value[key]) {
      const expiry = cacheExpiry.value[key]
      if (allowExpired || !expiry || now < expiry) {
        return cacheData.value[key]
      }
    }
    
    // 从本地存储获取
    try {
      const cached = uni.getStorageSync(`cache_${key}`)
      if (cached && cached.data) {
        if (allowExpired || !cached.expiry || now < cached.expiry) {
          // 恢复到内存缓存
          cacheData.value[key] = cached.data
          cacheExpiry.value[key] = cached.expiry
          return cached.data
        }
      }
    } catch (error) {
      console.error('从本地存储获取缓存失败:', error)
    }
    
    return null
  }

  // 检查缓存是否存在且有效
  const isCacheValid = (key) => {
    const now = Date.now()
    const expiry = cacheExpiry.value[key]
    
    if (cacheData.value[key] && (!expiry || now < expiry)) {
      return true
    }
    
    // 检查本地存储
    try {
      const cached = uni.getStorageSync(`cache_${key}`)
      return cached && cached.data && (!cached.expiry || now < cached.expiry)
    } catch (error) {
      return false
    }
  }

  // 删除缓存
  const removeCacheData = (key) => {
    delete cacheData.value[key]
    delete cacheExpiry.value[key]
    
    try {
      uni.removeStorageSync(`cache_${key}`)
    } catch (error) {
      console.error('删除本地缓存失败:', error)
    }
  }

  // 清空所有缓存
  const clearAllCache = () => {
    cacheData.value = {}
    cacheExpiry.value = {}
    
    try {
      const storageInfo = uni.getStorageInfoSync()
      storageInfo.keys.forEach(key => {
        if (key.startsWith('cache_')) {
          uni.removeStorageSync(key)
        }
      })
    } catch (error) {
      console.error('清空本地缓存失败:', error)
    }
  }

  // 清理过期缓存
  const cleanExpiredCache = () => {
    const now = Date.now()
    
    // 清理内存缓存
    Object.keys(cacheExpiry.value).forEach(key => {
      if (cacheExpiry.value[key] && now >= cacheExpiry.value[key]) {
        delete cacheData.value[key]
        delete cacheExpiry.value[key]
      }
    })
    
    // 清理本地存储缓存
    try {
      const storageInfo = uni.getStorageInfoSync()
      storageInfo.keys.forEach(key => {
        if (key.startsWith('cache_')) {
          const cached = uni.getStorageSync(key)
          if (cached && cached.expiry && now >= cached.expiry) {
            uni.removeStorageSync(key)
          }
        }
      })
    } catch (error) {
      console.error('清理过期本地缓存失败:', error)
    }
  }

  // 设置网络状态
  const setOnlineStatus = (online) => {
    isOnline.value = online
    
    if (online && syncQueue.value.length > 0) {
      // 网络恢复时，处理同步队列
      processSyncQueue()
    }
  }

  // 添加到同步队列
  const addToSyncQueue = (data) => {
    const syncItem = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      data,
      retryCount: 0,
      maxRetries: 3
    }
    
    syncQueue.value.push(syncItem)
    
    // 持久化同步队列
    try {
      uni.setStorageSync('syncQueue', syncQueue.value)
    } catch (error) {
      console.error('保存同步队列失败:', error)
    }
    
    // 如果在线，立即尝试同步
    if (isOnline.value) {
      processSyncQueue()
    }
  }

  // 处理同步队列
  const processSyncQueue = async () => {
    if (!isOnline.value || syncQueue.value.length === 0) return
    
    const itemsToSync = [...syncQueue.value]
    
    for (const item of itemsToSync) {
      try {
        await syncDataItem(item)
        // 同步成功，从队列中移除
        const index = syncQueue.value.findIndex(i => i.id === item.id)
        if (index !== -1) {
          syncQueue.value.splice(index, 1)
        }
      } catch (error) {
        console.error('同步数据失败:', error)
        
        // 增加重试次数
        item.retryCount++
        
        // 如果超过最大重试次数，移除该项
        if (item.retryCount >= item.maxRetries) {
          const index = syncQueue.value.findIndex(i => i.id === item.id)
          if (index !== -1) {
            syncQueue.value.splice(index, 1)
          }
          console.error('数据同步失败，已达到最大重试次数:', item.data)
        }
      }
    }
    
    // 更新持久化的同步队列
    try {
      uni.setStorageSync('syncQueue', syncQueue.value)
    } catch (error) {
      console.error('更新同步队列失败:', error)
    }
  }

  // 同步单个数据项
  const syncDataItem = async (item) => {
    const { data } = item
    
    // 根据数据类型选择不同的同步接口
    let url = '/sync/offline-data'
    let method = 'POST'
    let requestData = {
      type: data.type,
      action: data.action,
      data: data.data,
      timestamp: item.timestamp,
      localId: item.id
    }
    
    const response = await uni.request({
      url,
      method,
      data: requestData
    })
    
    if (!response.data.success) {
      throw new Error(response.data.message || '同步失败')
    }
    
    return response.data
  }

  // 恢复同步队列
  const restoreSyncQueue = () => {
    try {
      const saved = uni.getStorageSync('syncQueue')
      if (saved && Array.isArray(saved)) {
        syncQueue.value = saved
      }
    } catch (error) {
      console.error('恢复同步队列失败:', error)
    }
  }

  // 获取缓存统计信息
  const getCacheStats = () => {
    const memoryCount = Object.keys(cacheData.value).length
    let storageCount = 0
    let totalSize = 0
    
    try {
      const storageInfo = uni.getStorageInfoSync()
      storageCount = storageInfo.keys.filter(key => key.startsWith('cache_')).length
      totalSize = storageInfo.currentSize
    } catch (error) {
      console.error('获取存储信息失败:', error)
    }
    
    return {
      memoryCount,
      storageCount,
      totalSize,
      syncQueueLength: syncQueue.value.length,
      isOnline: isOnline.value
    }
  }

  // 预加载关键数据
  const preloadCriticalData = async () => {
    const criticalKeys = [
      'bases',
      'currentBase',
      'userInfo',
      'permissions'
    ]
    
    for (const key of criticalKeys) {
      try {
        const cached = uni.getStorageSync(`cache_${key}`)
        if (cached && cached.data) {
          cacheData.value[key] = cached.data
          cacheExpiry.value[key] = cached.expiry
        }
      } catch (error) {
        console.error(`预加载 ${key} 失败:`, error)
      }
    }
  }

  // 初始化缓存系统
  const initCache = () => {
    // 恢复同步队列
    restoreSyncQueue()
    
    // 预加载关键数据
    preloadCriticalData()
    
    // 清理过期缓存
    cleanExpiredCache()
    
    // 监听网络状态变化
    uni.onNetworkStatusChange((res) => {
      setOnlineStatus(res.isConnected)
    })
    
    // 获取当前网络状态
    uni.getNetworkType({
      success: (res) => {
        setOnlineStatus(res.networkType !== 'none')
      }
    })
  }

  return {
    cacheData,
    syncQueue,
    isOnline,
    setCacheData,
    getCacheData,
    isCacheValid,
    removeCacheData,
    clearAllCache,
    cleanExpiredCache,
    setOnlineStatus,
    addToSyncQueue,
    processSyncQueue,
    getCacheStats,
    initCache
  }
})