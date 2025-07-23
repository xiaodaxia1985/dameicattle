// Simple cattle store without pinia
export const cattleStore = {
  // State
  cattleList: [],
  currentCattle: null,
  statistics: {},
  loading: false,
  total: 0,

  // Computed getters
  get healthyCount() {
    return this.cattleList.filter(cattle => cattle.health_status === 'healthy').length
  },
  
  get sickCount() {
    return this.cattleList.filter(cattle => cattle.health_status === 'sick').length
  },
  
  get treatmentCount() {
    return this.cattleList.filter(cattle => cattle.health_status === 'treatment').length
  },

  // 获取牛只列表
  async fetchCattleList(params = {}) {
    this.loading = true
    try {
      const response = await uni.request({
        url: '/api/v1/cattle',
        method: 'GET',
        data: params
      })
      
      if (response.data.success) {
        const result = response.data.data
        this.cattleList = result.data
        this.total = result.pagination.total
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
        this.cattleList = cachedData.data
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

  // 获取牛只统计
  async fetchCattleStatistics(baseId) {
    try {
      const response = await uni.request({
        url: '/api/v1/cattle/statistics',
        method: 'GET',
        data: baseId ? { baseId } : {}
      })
      
      if (response.data.success) {
        this.statistics = response.data.data
        
        // 缓存统计数据
        const cacheKey = `cattle_stats_${baseId || 'all'}`
        uni.setStorageSync(cacheKey, this.statistics)
        
        return this.statistics
      } else {
        throw new Error(response.data.error?.message || '获取统计数据失败')
      }
    } catch (error) {
      console.error('获取牛只统计失败:', error)
      
      // 尝试从缓存加载
      const cacheKey = `cattle_stats_${baseId || 'all'}`
      const cachedStats = uni.getStorageSync(cacheKey)
      if (cachedStats) {
        this.statistics = cachedStats
        return cachedStats
      }
      
      throw error
    }
  },

  // 获取牛只详情
  async fetchCattleById(id) {
    this.loading = true
    try {
      const response = await uni.request({
        url: `/api/v1/cattle/${id}`,
        method: 'GET'
      })
      
      if (response.data.success) {
        this.currentCattle = response.data.data
        
        // 缓存牛只详情
        const cacheKey = `cattle_detail_${id}`
        uni.setStorageSync(cacheKey, this.currentCattle)
        
        return this.currentCattle
      } else {
        throw new Error(response.data.error?.message || '获取牛只详情失败')
      }
    } catch (error) {
      console.error('获取牛只详情失败:', error)
      
      // 尝试从缓存加载
      const cacheKey = `cattle_detail_${id}`
      const cachedCattle = uni.getStorageSync(cacheKey)
      if (cachedCattle) {
        this.currentCattle = cachedCattle
        uni.showToast({
          title: '已加载离线数据',
          icon: 'none'
        })
        return cachedCattle
      }
      
      throw error
    } finally {
      this.loading = false
    }
  },

  // 重置状态
  resetState() {
    this.cattleList = []
    this.currentCattle = null
    this.statistics = {}
    this.total = 0
  }
}