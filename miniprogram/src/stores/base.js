// Simple base utility without pinia
export const baseStore = {
  // State
  bases: [],
  currentBase: null,
  loading: false,
  currentLocation: null,

  // Initialize from storage
  init() {
    this.currentBase = uni.getStorageSync('currentBase') || null
  },

  // Mock API methods - replace with actual API calls
  async fetchAllBases() {
    this.loading = true
    try {
      // Mock data
      const mockBases = [
        { id: 1, name: '主基地', code: 'BASE001', address: '北京市朝阳区' },
        { id: 2, name: '分基地', code: 'BASE002', address: '北京市海淀区' }
      ]
      this.bases = mockBases
      return mockBases
    } catch (error) {
      console.error('获取基地列表失败:', error)
      throw error
    } finally {
      this.loading = false
    }
  },

  async fetchBaseDetail(baseId) {
    if (!baseId) return null
    
    try {
      // Mock data
      return { id: baseId, name: `基地${baseId}`, address: '测试地址' }
    } catch (error) {
      console.error('获取基地详情失败:', error)
      throw error
    }
  },

  setCurrentBase(base) {
    this.currentBase = base
    if (base) {
      uni.setStorageSync('currentBase', base)
    } else {
      uni.removeStorageSync('currentBase')
    }
  },

  async getBaseLocation(baseId) {
    try {
      // Mock data
      return { latitude: 39.9042, longitude: 116.4074, address: '测试地址' }
    } catch (error) {
      console.error('获取基地位置失败:', error)
      throw error
    }
  },

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          const location = {
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: res.accuracy,
            altitude: res.altitude,
            speed: res.speed,
            timestamp: Date.now()
          }
          this.currentLocation = location
          resolve(location)
        },
        fail: (error) => {
          console.error('获取当前位置失败:', error)
          reject(error)
        }
      })
    })
  },

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000 // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  restoreCurrentBase() {
    try {
      const cached = uni.getStorageSync('currentBase')
      if (cached) {
        this.currentBase = cached
        return cached
      }
    } catch (error) {
      console.error('恢复当前基地失败:', error)
    }
    return null
  },

  clearData() {
    this.bases = []
    this.currentBase = null
    this.currentLocation = null
    uni.removeStorageSync('currentBase')
  }
}