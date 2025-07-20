import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMaterialStore = defineStore('material', () => {
  // State
  const materials = ref([])
  const inventory = ref([])
  const transactions = ref([])
  const alerts = ref([])
  const categories = ref([])
  const suppliers = ref([])
  const statistics = ref({})
  const loading = ref(false)
  const total = ref(0)

  // Computed
  const lowStockCount = computed(() => 
    inventory.value.filter(item => 
      item.current_stock <= (item.material?.safety_stock || 0)
    ).length
  )

  const totalInventoryValue = computed(() =>
    inventory.value.reduce((sum, item) => 
      sum + (item.current_stock * (item.material?.purchase_price || 0)), 0
    )
  )

  const activeAlertsCount = computed(() =>
    alerts.value.filter(alert => !alert.is_resolved).length
  )

  // 获取物资列表
  const fetchMaterials = async (params = {}) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: '/api/v1/materials/production-materials',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        const result = response.data
        materials.value = result.data
        total.value = result.pagination?.total || result.data.length
        
        // 缓存数据
        const cacheKey = `materials_${JSON.stringify(params)}`
        uni.setStorageSync(cacheKey, { data: result.data, total: total.value })
        
        return result
      } else {
        throw new Error(response.data.error?.message || '获取物资列表失败')
      }
    } catch (error) {
      console.error('获取物资列表失败:', error)
      
      // 尝试从缓存加载
      const cacheKey = `materials_${JSON.stringify(params)}`
      const cachedData = uni.getStorageSync(cacheKey)
      if (cachedData) {
        materials.value = cachedData.data
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

  // 获取库存列表
  const fetchInventory = async (params = {}) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: '/api/v1/materials/inventory',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        const result = response.data
        inventory.value = result.data
        total.value = result.pagination?.total || result.data.length
        
        // 缓存数据
        const cacheKey = `inventory_${JSON.stringify(params)}`
        uni.setStorageSync(cacheKey, { data: result.data, total: total.value })
        
        return result
      } else {
        throw new Error(response.data.error?.message || '获取库存列表失败')
      }
    } catch (error) {
      console.error('获取库存列表失败:', error)
      
      // 尝试从缓存加载
      const cacheKey = `inventory_${JSON.stringify(params)}`
      const cachedData = uni.getStorageSync(cacheKey)
      if (cachedData) {
        inventory.value = cachedData.data
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

  // 获取交易记录
  const fetchTransactions = async (params = {}) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: '/api/v1/materials/inventory/transactions',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        const result = response.data
        transactions.value = result.data
        total.value = result.pagination?.total || result.data.length
        
        // 缓存数据
        const cacheKey = `transactions_${JSON.stringify(params)}`
        uni.setStorageSync(cacheKey, { data: result.data, total: total.value })
        
        return result
      } else {
        throw new Error(response.data.error?.message || '获取交易记录失败')
      }
    } catch (error) {
      console.error('获取交易记录失败:', error)
      
      // 尝试从缓存加载
      const cacheKey = `transactions_${JSON.stringify(params)}`
      const cachedData = uni.getStorageSync(cacheKey)
      if (cachedData) {
        transactions.value = cachedData.data
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

  // 获取库存预警
  const fetchAlerts = async (params = {}) => {
    loading.value = true
    try {
      const response = await uni.request({
        url: '/api/v1/materials/inventory/alerts',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        const result = response.data
        alerts.value = result.data
        total.value = result.pagination?.total || result.data.length
        
        // 缓存数据
        const cacheKey = `alerts_${JSON.stringify(params)}`
        uni.setStorageSync(cacheKey, { data: result.data, total: total.value })
        
        return result
      } else {
        throw new Error(response.data.error?.message || '获取预警列表失败')
      }
    } catch (error) {
      console.error('获取预警列表失败:', error)
      
      // 尝试从缓存加载
      const cacheKey = `alerts_${JSON.stringify(params)}`
      const cachedData = uni.getStorageSync(cacheKey)
      if (cachedData) {
        alerts.value = cachedData.data
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

  // 获取物资分类
  const fetchCategories = async () => {
    try {
      const response = await uni.request({
        url: '/api/v1/materials/categories',
        method: 'GET'
      })
      
      if (response.data.success) {
        categories.value = response.data.data
        
        // 缓存数据
        uni.setStorageSync('material_categories', categories.value)
        
        return categories.value
      } else {
        throw new Error(response.data.error?.message || '获取分类失败')
      }
    } catch (error) {
      console.error('获取物资分类失败:', error)
      
      // 尝试从缓存加载
      const cachedCategories = uni.getStorageSync('material_categories')
      if (cachedCategories) {
        categories.value = cachedCategories
        return cachedCategories
      }
      
      throw error
    }
  }

  // 获取供应商列表
  const fetchSuppliers = async () => {
    try {
      const response = await uni.request({
        url: '/api/v1/materials/suppliers',
        method: 'GET',
        data: { limit: 1000 } // 获取所有供应商
      })
      
      if (response.data.success) {
        suppliers.value = response.data.data
        
        // 缓存数据
        uni.setStorageSync('material_suppliers', suppliers.value)
        
        return suppliers.value
      } else {
        throw new Error(response.data.error?.message || '获取供应商失败')
      }
    } catch (error) {
      console.error('获取供应商列表失败:', error)
      
      // 尝试从缓存加载
      const cachedSuppliers = uni.getStorageSync('material_suppliers')
      if (cachedSuppliers) {
        suppliers.value = cachedSuppliers
        return cachedSuppliers
      }
      
      throw error
    }
  }

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      const response = await uni.request({
        url: '/api/v1/materials/inventory/statistics',
        method: 'GET'
      })
      
      if (response.data.success) {
        statistics.value = response.data.data
        
        // 缓存数据
        uni.setStorageSync('material_statistics', statistics.value)
        
        return statistics.value
      } else {
        throw new Error(response.data.error?.message || '获取统计数据失败')
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      
      // 尝试从缓存加载
      const cachedStats = uni.getStorageSync('material_statistics')
      if (cachedStats) {
        statistics.value = cachedStats
        return cachedStats
      }
      
      throw error
    }
  }

  // 创建库存交易
  const createTransaction = async (data) => {
    try {
      const response = await uni.request({
        url: '/api/v1/materials/inventory/transactions',
        method: 'POST',
        data: data
      })
      
      if (response.data.success) {
        const newTransaction = response.data.data
        transactions.value.unshift(newTransaction)
        
        // 清除相关缓存
        clearInventoryCache()
        
        return newTransaction
      } else {
        throw new Error(response.data.error?.message || '创建交易记录失败')
      }
    } catch (error) {
      console.error('创建库存交易失败:', error)
      
      // 如果网络失败，添加到离线队列
      if (error.errMsg && error.errMsg.includes('fail')) {
        addOfflineRecord('inventory_transaction', data)
        uni.showToast({
          title: '网络异常，已保存到离线队列',
          icon: 'none'
        })
        return null
      }
      
      throw error
    }
  }

  // 解决预警
  const resolveAlert = async (alertId) => {
    try {
      const response = await uni.request({
        url: `/api/v1/materials/inventory/alerts/${alertId}/resolve`,
        method: 'PUT'
      })
      
      if (response.data.success) {
        // 更新本地状态
        const index = alerts.value.findIndex(alert => alert.id === alertId)
        if (index !== -1) {
          alerts.value[index].is_resolved = true
          alerts.value[index].resolved_at = new Date().toISOString()
        }
        
        return true
      } else {
        throw new Error(response.data.error?.message || '解决预警失败')
      }
    } catch (error) {
      console.error('解决预警失败:', error)
      throw error
    }
  }

  // 获取特定物资的库存信息
  const getInventoryByMaterial = async (materialId, baseId) => {
    try {
      const response = await uni.request({
        url: `/api/v1/materials/inventory/${materialId}/${baseId}`,
        method: 'GET'
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.error?.message || '获取库存信息失败')
      }
    } catch (error) {
      console.error('获取库存信息失败:', error)
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

  // 离线数据同步
  const syncOfflineData = async () => {
    try {
      const offlineRecords = uni.getStorageSync('offlineRecords') || []
      const materialRecords = offlineRecords.filter(record => 
        record.type.startsWith('inventory_') || record.type.startsWith('material_')
      )
      
      if (materialRecords.length === 0) {
        return { synced: 0, failed: 0 }
      }

      const response = await uni.request({
        url: '/api/v1/sync/offline-data',
        method: 'POST',
        data: {
          records: materialRecords
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
        
        // 清除缓存，强制重新加载数据
        clearAllCache()
        
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

  // 清除库存相关缓存
  const clearInventoryCache = () => {
    const keys = uni.getStorageInfoSync().keys
    keys.forEach(key => {
      if (key.startsWith('inventory_') || key.startsWith('transactions_') || key === 'material_statistics') {
        uni.removeStorageSync(key)
      }
    })
  }

  // 清除所有缓存
  const clearAllCache = () => {
    const keys = uni.getStorageInfoSync().keys
    keys.forEach(key => {
      if (key.startsWith('materials_') || 
          key.startsWith('inventory_') || 
          key.startsWith('transactions_') || 
          key.startsWith('alerts_') ||
          key === 'material_categories' ||
          key === 'material_suppliers' ||
          key === 'material_statistics') {
        uni.removeStorageSync(key)
      }
    })
  }

  // 重置状态
  const resetState = () => {
    materials.value = []
    inventory.value = []
    transactions.value = []
    alerts.value = []
    categories.value = []
    suppliers.value = []
    statistics.value = {}
    total.value = 0
  }

  return {
    // State
    materials,
    inventory,
    transactions,
    alerts,
    categories,
    suppliers,
    statistics,
    loading,
    total,

    // Computed
    lowStockCount,
    totalInventoryValue,
    activeAlertsCount,

    // Actions
    fetchMaterials,
    fetchInventory,
    fetchTransactions,
    fetchAlerts,
    fetchCategories,
    fetchSuppliers,
    fetchStatistics,
    createTransaction,
    resolveAlert,
    getInventoryByMaterial,
    addOfflineRecord,
    syncOfflineData,
    clearInventoryCache,
    clearAllCache,
    resetState
  }
})