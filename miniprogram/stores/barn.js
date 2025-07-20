import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBarnStore = defineStore('barn', () => {
  const barns = ref([])
  const currentBarn = ref(null)
  const loading = ref(false)

  // 获取指定基地的牛棚列表
  const fetchBarnsByBase = async (baseId) => {
    if (!baseId) return []
    
    loading.value = true
    try {
      const response = await uni.request({
        url: `/api/v1/barns?baseId=${baseId}`,
        method: 'GET'
      })
      
      if (response.data.success) {
        barns.value = response.data.data
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取牛棚列表失败')
      }
    } catch (error) {
      console.error('获取牛棚列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取牛棚详情
  const fetchBarnDetail = async (barnId) => {
    if (!barnId) return null
    
    try {
      const response = await uni.request({
        url: `/api/v1/barns/${barnId}`,
        method: 'GET'
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取牛棚详情失败')
      }
    } catch (error) {
      console.error('获取牛棚详情失败:', error)
      throw error
    }
  }

  // 设置当前牛棚
  const setCurrentBarn = (barn) => {
    currentBarn.value = barn
    if (barn) {
      uni.setStorageSync('currentBarn', barn)
    } else {
      uni.removeStorageSync('currentBarn')
    }
  }

  // 获取牛棚统计信息
  const getBarnStats = async (barnId) => {
    if (!barnId) return null
    
    try {
      const response = await uni.request({
        url: `/api/v1/barns/${barnId}/stats`,
        method: 'GET'
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取牛棚统计失败')
      }
    } catch (error) {
      console.error('获取牛棚统计失败:', error)
      throw error
    }
  }

  // 更新牛棚信息
  const updateBarn = async (barnId, data) => {
    if (!barnId) return false
    
    try {
      const response = await uni.request({
        url: `/api/v1/barns/${barnId}`,
        method: 'PUT',
        data
      })
      
      if (response.data.success) {
        // 更新本地数据
        const index = barns.value.findIndex(barn => barn.id === barnId)
        if (index !== -1) {
          barns.value[index] = { ...barns.value[index], ...data }
        }
        
        if (currentBarn.value && currentBarn.value.id === barnId) {
          currentBarn.value = { ...currentBarn.value, ...data }
          setCurrentBarn(currentBarn.value)
        }
        
        return response.data.data
      } else {
        throw new Error(response.data.message || '更新牛棚信息失败')
      }
    } catch (error) {
      console.error('更新牛棚信息失败:', error)
      throw error
    }
  }

  // 获取牛棚容量使用率
  const getBarnUtilization = (barn) => {
    if (!barn || !barn.capacity || barn.capacity === 0) return 0
    return Math.min(Math.round((barn.currentCount / barn.capacity) * 100), 100)
  }

  // 获取牛棚状态
  const getBarnStatus = (barn) => {
    const utilization = getBarnUtilization(barn)
    if (utilization === 0) return 'empty'
    if (utilization >= 100) return 'full'
    if (utilization >= 80) return 'near_full'
    return 'normal'
  }

  // 清空数据
  const clearData = () => {
    barns.value = []
    currentBarn.value = null
    uni.removeStorageSync('currentBarn')
  }

  return {
    barns,
    currentBarn,
    loading,
    fetchBarnsByBase,
    fetchBarnDetail,
    setCurrentBarn,
    getBarnStats,
    updateBarn,
    getBarnUtilization,
    getBarnStatus,
    clearData
  }
})