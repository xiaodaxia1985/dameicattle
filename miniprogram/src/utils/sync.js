// 数据同步工具
import { apiService } from './request.js'

/**
 * 数据同步管理器
 */
class DataSyncManager {
  constructor() {
    this.syncQueue = []
    this.isOnline = true
    this.isSyncing = false
    this.syncInterval = null
    
    // 监听网络状态
    this.initNetworkListener()
  }

  /**
   * 初始化网络状态监听
   */
  initNetworkListener() {
    // 监听网络状态变化
    uni.onNetworkStatusChange((res) => {
      const wasOffline = !this.isOnline
      this.isOnline = res.isConnected
      
      console.log('网络状态变化:', res)
      
      // 从离线恢复到在线时，自动同步数据
      if (wasOffline && this.isOnline) {
        this.syncOfflineData()
      }
    })
    
    // 获取初始网络状态
    uni.getNetworkType({
      success: (res) => {
        this.isOnline = res.networkType !== 'none'
      }
    })
  }

  /**
   * 添加离线数据到同步队列
   * @param {Object} data 数据对象
   */
  addToSyncQueue(data) {
    const syncItem = {
      id: this.generateSyncId(),
      type: data.type,
      action: data.action,
      data: data.data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    }
    
    this.syncQueue.push(syncItem)
    this.saveSyncQueue()
    
    console.log('添加到同步队列:', syncItem)
    
    // 如果在线，立即尝试同步
    if (this.isOnline) {
      this.syncOfflineData()
    }
  }

  /**
   * 生成同步ID
   * @returns {string} 同步ID
   */
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 保存同步队列到本地存储
   */
  saveSyncQueue() {
    try {
      uni.setStorageSync('syncQueue', this.syncQueue)
    } catch (error) {
      console.error('保存同步队列失败:', error)
    }
  }

  /**
   * 从本地存储加载同步队列
   */
  loadSyncQueue() {
    try {
      const queue = uni.getStorageSync('syncQueue')
      this.syncQueue = Array.isArray(queue) ? queue : []
    } catch (error) {
      console.error('加载同步队列失败:', error)
      this.syncQueue = []
    }
  }

  /**
   * 同步离线数据
   */
  async syncOfflineData() {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return
    }
    
    this.isSyncing = true
    console.log('开始同步离线数据，队列长度:', this.syncQueue.length)
    
    try {
      // 批量同步数据
      const batchSize = 10
      const batches = this.chunkArray(this.syncQueue, batchSize)
      
      for (const batch of batches) {
        await this.syncBatch(batch)
      }
      
      console.log('离线数据同步完成')
      
      // 触发同步完成事件
      uni.$emit('syncCompleted', {
        syncedCount: this.syncQueue.length
      })
      
    } catch (error) {
      console.error('同步离线数据失败:', error)
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * 同步批次数据
   * @param {Array} batch 批次数据
   */
  async syncBatch(batch) {
    const syncPromises = batch.map(item => this.syncSingleItem(item))
    const results = await Promise.allSettled(syncPromises)
    
    // 处理同步结果
    results.forEach((result, index) => {
      const item = batch[index]
      
      if (result.status === 'fulfilled') {
        // 同步成功，从队列中移除
        this.removeSyncItem(item.id)
      } else {
        // 同步失败，增加重试次数
        item.retryCount++
        
        if (item.retryCount >= item.maxRetries) {
          // 超过最大重试次数，移除或标记为失败
          console.error(`同步项目 ${item.id} 超过最大重试次数，移除队列`)
          this.removeSyncItem(item.id)
        }
      }
    })
    
    this.saveSyncQueue()
  }

  /**
   * 同步单个数据项
   * @param {Object} item 同步项
   */
  async syncSingleItem(item) {
    try {
      let response
      
      switch (item.type) {
        case 'cattle':
          response = await this.syncCattleData(item)
          break
        case 'health':
          response = await this.syncHealthData(item)
          break
        case 'feeding':
          response = await this.syncFeedingData(item)
          break
        case 'inventory':
          response = await this.syncInventoryData(item)
          break
        case 'equipment':
          response = await this.syncEquipmentData(item)
          break
        default:
          throw new Error(`未知的同步类型: ${item.type}`)
      }
      
      console.log(`同步成功: ${item.type} - ${item.id}`)
      return response
      
    } catch (error) {
      console.error(`同步失败: ${item.type} - ${item.id}`, error)
      throw error
    }
  }

  /**
   * 同步牛只数据
   * @param {Object} item 同步项
   */
  async syncCattleData(item) {
    const { action, data } = item
    
    switch (action) {
      case 'create':
        return await apiService.post('/cattle', data)
      case 'update':
        return await apiService.put(`/cattle/${data.id}`, data)
      case 'delete':
        return await apiService.delete(`/cattle/${data.id}`)
      default:
        throw new Error(`未知的牛只操作: ${action}`)
    }
  }

  /**
   * 同步健康数据
   * @param {Object} item 同步项
   */
  async syncHealthData(item) {
    const { action, data } = item
    
    switch (action) {
      case 'create_diagnosis':
        return await apiService.post('/health/diagnosis', data)
      case 'create_vaccination':
        return await apiService.post('/health/vaccination', data)
      case 'update_treatment':
        return await apiService.put(`/health/treatment/${data.id}`, data)
      default:
        throw new Error(`未知的健康操作: ${action}`)
    }
  }

  /**
   * 同步饲喂数据
   * @param {Object} item 同步项
   */
  async syncFeedingData(item) {
    const { action, data } = item
    
    switch (action) {
      case 'create_record':
        return await apiService.post('/feeding/records', data)
      case 'create_formula':
        return await apiService.post('/feeding/formulas', data)
      default:
        throw new Error(`未知的饲喂操作: ${action}`)
    }
  }

  /**
   * 同步库存数据
   * @param {Object} item 同步项
   */
  async syncInventoryData(item) {
    const { action, data } = item
    
    switch (action) {
      case 'inbound':
        return await apiService.post('/inventory/inbound', data)
      case 'outbound':
        return await apiService.post('/inventory/outbound', data)
      case 'transfer':
        return await apiService.post('/inventory/transfer', data)
      default:
        throw new Error(`未知的库存操作: ${action}`)
    }
  }

  /**
   * 同步设备数据
   * @param {Object} item 同步项
   */
  async syncEquipmentData(item) {
    const { action, data } = item
    
    switch (action) {
      case 'create_maintenance':
        return await apiService.post(`/equipment/${data.equipmentId}/maintenance-records`, data)
      case 'report_failure':
        return await apiService.post(`/equipment/${data.equipmentId}/failures`, data)
      default:
        throw new Error(`未知的设备操作: ${action}`)
    }
  }

  /**
   * 从同步队列中移除项目
   * @param {string} syncId 同步ID
   */
  removeSyncItem(syncId) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== syncId)
  }

  /**
   * 数组分块
   * @param {Array} array 原数组
   * @param {number} size 块大小
   * @returns {Array} 分块后的数组
   */
  chunkArray(array, size) {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * 启动自动同步
   * @param {number} interval 同步间隔（毫秒）
   */
  startAutoSync(interval = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncOfflineData()
      }
    }, interval)
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * 获取同步状态
   * @returns {Object} 同步状态
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      pendingItems: this.syncQueue.map(item => ({
        id: item.id,
        type: item.type,
        action: item.action,
        timestamp: item.timestamp,
        retryCount: item.retryCount
      }))
    }
  }

  /**
   * 清空同步队列
   */
  clearSyncQueue() {
    this.syncQueue = []
    this.saveSyncQueue()
  }

  /**
   * 手动触发同步
   */
  async manualSync() {
    if (!this.isOnline) {
      throw new Error('网络未连接，无法同步数据')
    }
    
    await this.syncOfflineData()
  }

  /**
   * 初始化同步管理器
   */
  init() {
    this.loadSyncQueue()
    this.startAutoSync()
    
    // 应用启动时检查是否有待同步数据
    if (this.isOnline && this.syncQueue.length > 0) {
      setTimeout(() => {
        this.syncOfflineData()
      }, 2000) // 延迟2秒开始同步
    }
  }

  /**
   * 销毁同步管理器
   */
  destroy() {
    this.stopAutoSync()
  }
}

// 创建数据同步管理器实例
export const dataSyncManager = new DataSyncManager()

// 离线数据操作助手
export class OfflineDataHelper {
  /**
   * 离线创建牛只记录
   * @param {Object} cattleData 牛只数据
   */
  static createCattleOffline(cattleData) {
    // 生成临时ID
    const tempId = `temp_cattle_${Date.now()}`
    const data = { ...cattleData, tempId }
    
    // 保存到本地存储
    this.saveToLocalStorage('offline_cattle', data)
    
    // 添加到同步队列
    dataSyncManager.addToSyncQueue({
      type: 'cattle',
      action: 'create',
      data
    })
    
    return data
  }

  /**
   * 离线创建健康记录
   * @param {Object} healthData 健康数据
   */
  static createHealthRecordOffline(healthData) {
    const tempId = `temp_health_${Date.now()}`
    const data = { ...healthData, tempId }
    
    this.saveToLocalStorage('offline_health', data)
    
    dataSyncManager.addToSyncQueue({
      type: 'health',
      action: 'create_diagnosis',
      data
    })
    
    return data
  }

  /**
   * 离线创建饲喂记录
   * @param {Object} feedingData 饲喂数据
   */
  static createFeedingRecordOffline(feedingData) {
    const tempId = `temp_feeding_${Date.now()}`
    const data = { ...feedingData, tempId }
    
    this.saveToLocalStorage('offline_feeding', data)
    
    dataSyncManager.addToSyncQueue({
      type: 'feeding',
      action: 'create_record',
      data
    })
    
    return data
  }

  /**
   * 保存到本地存储
   * @param {string} key 存储键
   * @param {Object} data 数据
   */
  static saveToLocalStorage(key, data) {
    try {
      const existingData = uni.getStorageSync(key) || []
      existingData.push(data)
      uni.setStorageSync(key, existingData)
    } catch (error) {
      console.error('保存离线数据失败:', error)
    }
  }

  /**
   * 从本地存储获取数据
   * @param {string} key 存储键
   * @returns {Array} 数据数组
   */
  static getFromLocalStorage(key) {
    try {
      return uni.getStorageSync(key) || []
    } catch (error) {
      console.error('获取离线数据失败:', error)
      return []
    }
  }

  /**
   * 清除本地存储数据
   * @param {string} key 存储键
   */
  static clearLocalStorage(key) {
    try {
      uni.removeStorageSync(key)
    } catch (error) {
      console.error('清除离线数据失败:', error)
    }
  }
}

export default dataSyncManager