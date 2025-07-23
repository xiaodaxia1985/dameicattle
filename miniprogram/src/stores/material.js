// Simple material store without pinia
export const materialStore = {
  // State
  materials: [],
  inventory: [],
  transactions: [],
  alerts: [],
  categories: [],
  suppliers: [],
  statistics: {},
  loading: false,
  total: 0,

  // Computed getters
  get lowStockCount() {
    return this.inventory.filter(item => 
      item.current_stock <= (item.material?.safety_stock || 0)
    ).length
  },

  get totalInventoryValue() {
    return this.inventory.reduce((sum, item) => 
      sum + (item.current_stock * (item.material?.purchase_price || 0)), 0
    )
  },

  get activeAlertsCount() {
    return this.alerts.filter(alert => !alert.is_resolved).length
  },

  // 获取物资列表
  async fetchMaterials(params = {}) {
    this.loading = true
    try {
      const response = await uni.request({
        url: '/api/v1/materials/production-materials',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        const result = response.data
        this.materials = result.data
        this.total = result.pagination?.total || result.data.length
        
        // 缓存数据
        const cacheKey = `materials_${JSON.stringify(params)}`
        uni.setStorageSync(cacheKey, { data: result.data, total: this.total })
        
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
        this.materials = cachedData.data
        this.total = cachedData.total
        uni.showToast({
          title: '已加载离线数据',
          icon: 'none'
        })
        return cachedData
      }
      
      throw error
    } finally {
      this.loading = false
    }
  },

  // 获取库存列表
  async fetchInventory(params = {}) {
    this.loading = true
    try {
      const response = await uni.request({
        url: '/api/v1/materials/inventory',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        const result = response.data
        this.inventory = result.data
        this.total = result.pagination?.total || result.data.length
        
        // 缓存数据
        const cacheKey = `inventory_${JSON.stringify(params)}`
        uni.setStorageSync(cacheKey, { data: result.data, total: this.total })
        
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
        this.inventory = cachedData.data
        this.total = cachedData.total
        uni.showToast({
          title: '已加载离线数据',
          icon: 'none'
        })
        return cachedData
      }
      
      throw error
    } finally {
      this.loading = false
    }
  },

  // 获取交易记录
  async fetchTransactions(params = {}) {
    this.loading = true
    try {
      const response = await uni.request({
        url: '/api/v1/materials/inventory/transactions',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        const result = response.data
        this.transactions = result.data
        this.total = result.pagination?.total || result.data.length
        
        // 缓存数据
        const cacheKey = `transactions_${JSON.stringify(params)}`
        uni.setStorageSync(cacheKey, { data: result.data, total: this.total })
        
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
        this.transactions = cachedData.data
        this.total = cachedData.total
        uni.showToast({
          title: '已加载离线数据',
          icon: 'none'
        })
        return cachedData
      }
      
      throw error
    } finally {
      this.loading = false
    }
  },

  // 重置状态
  resetState() {
    this.materials = []
    this.inventory = []
    this.transactions = []
    this.alerts = []
    this.categories = []
    this.suppliers = []
    this.statistics = {}
    this.total = 0
  }
}