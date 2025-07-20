import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBaseStore = defineStore('base', () => {
  const bases = ref([])
  const currentBase = ref(null)
  const loading = ref(false)
  const currentLocation = ref(null)

  // 获取所有基地
  const fetchAllBases = async () => {
    loading.value = true
    try {
      const response = await uni.request({
        url: '/api/v1/bases/all',
        method: 'GET'
      })
      
      if (response.data.success) {
        bases.value = response.data.data
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取基地列表失败')
      }
    } catch (error) {
      console.error('获取基地列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取基地详情
  const fetchBaseDetail = async (baseId) => {
    if (!baseId) return null
    
    try {
      const response = await uni.request({
        url: `/api/v1/bases/${baseId}`,
        method: 'GET'
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取基地详情失败')
      }
    } catch (error) {
      console.error('获取基地详情失败:', error)
      throw error
    }
  }

  // 设置当前基地
  const setCurrentBase = (base) => {
    currentBase.value = base
    if (base) {
      uni.setStorageSync('currentBase', base)
      // 触发基地切换事件
      uni.$emit('baseChanged', base)
    } else {
      uni.removeStorageSync('currentBase')
    }
  }

  // 获取基地位置
  const getBaseLocation = async (baseId) => {
    try {
      const response = await uni.request({
        url: `/api/v1/bases/${baseId}/location`,
        method: 'GET'
      })
      
      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || '获取基地位置失败')
      }
    } catch (error) {
      console.error('获取基地位置失败:', error)
      throw error
    }
  }

  // 获取当前位置
  const getCurrentLocation = () => {
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
          currentLocation.value = location
          resolve(location)
        },
        fail: (error) => {
          console.error('获取当前位置失败:', error)
          reject(error)
        }
      })
    })
  }

  // 计算两点间距离（单位：米）
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000 // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // 获取到基地的距离
  const getDistanceToBase = async (baseId) => {
    try {
      const [currentPos, baseLocation] = await Promise.all([
        getCurrentLocation(),
        getBaseLocation(baseId)
      ])
      
      if (baseLocation && baseLocation.latitude && baseLocation.longitude) {
        const distance = calculateDistance(
          currentPos.latitude,
          currentPos.longitude,
          parseFloat(baseLocation.latitude),
          parseFloat(baseLocation.longitude)
        )
        return Math.round(distance)
      }
      
      return null
    } catch (error) {
      console.error('计算到基地距离失败:', error)
      return null
    }
  }

  // 导航到基地
  const navigateToBase = async (baseId) => {
    try {
      const baseLocation = await getBaseLocation(baseId)
      
      if (baseLocation && baseLocation.latitude && baseLocation.longitude) {
        const base = bases.value.find(b => b.id === baseId) || currentBase.value
        
        uni.openLocation({
          latitude: parseFloat(baseLocation.latitude),
          longitude: parseFloat(baseLocation.longitude),
          name: base?.name || '基地',
          address: baseLocation.address || base?.address || '',
          scale: 15
        })
        
        return true
      } else {
        throw new Error('基地位置信息不完整')
      }
    } catch (error) {
      console.error('导航到基地失败:', error)
      uni.showToast({
        title: error.message || '导航失败',
        icon: 'error'
      })
      return false
    }
  }

  // 检查是否在基地范围内
  const isInBaseRange = async (baseId, range = 1000) => {
    try {
      const distance = await getDistanceToBase(baseId)
      return distance !== null && distance <= range
    } catch (error) {
      console.error('检查基地范围失败:', error)
      return false
    }
  }

  // 获取附近的基地
  const getNearbyBases = async (maxDistance = 10000) => {
    try {
      const currentPos = await getCurrentLocation()
      const nearbyBases = []
      
      for (const base of bases.value) {
        try {
          const baseLocation = await getBaseLocation(base.id)
          if (baseLocation && baseLocation.latitude && baseLocation.longitude) {
            const distance = calculateDistance(
              currentPos.latitude,
              currentPos.longitude,
              parseFloat(baseLocation.latitude),
              parseFloat(baseLocation.longitude)
            )
            
            if (distance <= maxDistance) {
              nearbyBases.push({
                ...base,
                distance: Math.round(distance)
              })
            }
          }
        } catch (error) {
          console.error(`获取基地 ${base.id} 位置失败:`, error)
        }
      }
      
      // 按距离排序
      return nearbyBases.sort((a, b) => a.distance - b.distance)
    } catch (error) {
      console.error('获取附近基地失败:', error)
      return []
    }
  }

  // 自动选择最近的基地
  const autoSelectNearestBase = async () => {
    try {
      const nearbyBases = await getNearbyBases()
      if (nearbyBases.length > 0) {
        const nearestBase = nearbyBases[0]
        setCurrentBase(nearestBase)
        
        uni.showToast({
          title: `已自动选择最近的基地: ${nearestBase.name}`,
          icon: 'success'
        })
        
        return nearestBase
      } else {
        uni.showToast({
          title: '附近没有找到基地',
          icon: 'none'
        })
        return null
      }
    } catch (error) {
      console.error('自动选择最近基地失败:', error)
      uni.showToast({
        title: '自动选择基地失败',
        icon: 'error'
      })
      return null
    }
  }

  // 恢复当前基地
  const restoreCurrentBase = () => {
    try {
      const cached = uni.getStorageSync('currentBase')
      if (cached) {
        currentBase.value = cached
        return cached
      }
    } catch (error) {
      console.error('恢复当前基地失败:', error)
    }
    return null
  }

  // 清空数据
  const clearData = () => {
    bases.value = []
    currentBase.value = null
    currentLocation.value = null
    uni.removeStorageSync('currentBase')
  }

  return {
    bases,
    currentBase,
    currentLocation,
    loading,
    fetchAllBases,
    fetchBaseDetail,
    setCurrentBase,
    getBaseLocation,
    getCurrentLocation,
    calculateDistance,
    getDistanceToBase,
    navigateToBase,
    isInBaseRange,
    getNearbyBases,
    autoSelectNearestBase,
    restoreCurrentBase,
    clearData
  }
})