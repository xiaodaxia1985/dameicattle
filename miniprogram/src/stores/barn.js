// Simple barn utility without pinia
export const barnStore = {
  // State
  barns: [],
  currentBarn: null,
  loading: false,

  // Initialize from storage
  init() {
    this.currentBarn = uni.getStorageSync('currentBarn') || null
  },

  // Mock API methods - replace with actual API calls
  async fetchBarnsByBase(baseId) {
    if (!baseId) return []
    
    this.loading = true
    try {
      // Mock data
      const mockBarns = [
        { id: 1, name: '1号牛棚', capacity: 50, currentCount: 35, baseId: baseId },
        { id: 2, name: '2号牛棚', capacity: 60, currentCount: 42, baseId: baseId }
      ]
      this.barns = mockBarns
      return mockBarns
    } catch (error) {
      console.error('获取牛棚列表失败:', error)
      throw error
    } finally {
      this.loading = false
    }
  },

  async fetchBarnDetail(barnId) {
    if (!barnId) return null
    
    try {
      // Mock data
      return { id: barnId, name: `${barnId}号牛棚`, capacity: 50, currentCount: 35 }
    } catch (error) {
      console.error('获取牛棚详情失败:', error)
      throw error
    }
  },

  setCurrentBarn(barn) {
    this.currentBarn = barn
    if (barn) {
      uni.setStorageSync('currentBarn', barn)
    } else {
      uni.removeStorageSync('currentBarn')
    }
  },

  async getBarnStats(barnId) {
    if (!barnId) return null
    
    try {
      // Mock data
      return { totalCattle: 35, healthyCattle: 33, sickCattle: 2 }
    } catch (error) {
      console.error('获取牛棚统计失败:', error)
      throw error
    }
  },

  getBarnUtilization(barn) {
    if (!barn || !barn.capacity || barn.capacity === 0) return 0
    return Math.min(Math.round((barn.currentCount / barn.capacity) * 100), 100)
  },

  getBarnStatus(barn) {
    const utilization = this.getBarnUtilization(barn)
    if (utilization === 0) return 'empty'
    if (utilization >= 100) return 'full'
    if (utilization >= 80) return 'near_full'
    return 'normal'
  },

  clearData() {
    this.barns = []
    this.currentBarn = null
    uni.removeStorageSync('currentBarn')
  }
}