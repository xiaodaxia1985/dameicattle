// 位置相关工具函数

/**
 * 获取当前位置
 * @param {Object} options 配置选项
 * @returns {Promise} 位置信息
 */
export const getCurrentLocation = (options = {}) => {
  const defaultOptions = {
    type: 'gcj02', // 坐标类型，默认为国测局坐标
    altitude: false, // 是否返回高度信息
    geocode: false, // 是否返回地址信息
    highAccuracyExpireTime: 3000, // 高精度定位超时时间
    timeout: 10000, // 定位超时时间
    ...options
  }

  return new Promise((resolve, reject) => {
    uni.getLocation({
      ...defaultOptions,
      success: (res) => {
        const location = {
          latitude: res.latitude,
          longitude: res.longitude,
          accuracy: res.accuracy,
          altitude: res.altitude,
          speed: res.speed,
          timestamp: Date.now(),
          address: res.address || null
        }
        resolve(location)
      },
      fail: (error) => {
        console.error('获取位置失败:', error)
        reject(error)
      }
    })
  })
}

/**
 * 监听位置变化
 * @param {Function} callback 回调函数
 * @param {Object} options 配置选项
 * @returns {Function} 停止监听函数
 */
export const watchLocation = (callback, options = {}) => {
  const defaultOptions = {
    type: 'gcj02',
    ...options
  }

  uni.startLocationUpdate({
    ...defaultOptions,
    success: () => {
      console.log('开始监听位置变化')
    },
    fail: (error) => {
      console.error('开始监听位置变化失败:', error)
    }
  })

  const onLocationChange = (res) => {
    const location = {
      latitude: res.latitude,
      longitude: res.longitude,
      accuracy: res.accuracy,
      altitude: res.altitude,
      speed: res.speed,
      timestamp: Date.now()
    }
    callback(location)
  }

  uni.onLocationChange(onLocationChange)

  // 返回停止监听函数
  return () => {
    uni.stopLocationUpdate()
    uni.offLocationChange(onLocationChange)
  }
}

/**
 * 计算两点间距离（单位：米）
 * @param {number} lat1 纬度1
 * @param {number} lng1 经度1
 * @param {number} lat2 纬度2
 * @param {number} lng2 经度2
 * @returns {number} 距离（米）
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000 // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 格式化距离显示
 * @param {number} distance 距离（米）
 * @returns {string} 格式化后的距离字符串
 */
export const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  } else if (distance < 10000) {
    return `${(distance / 1000).toFixed(1)}km`
  } else {
    return `${Math.round(distance / 1000)}km`
  }
}

/**
 * 打开地图导航
 * @param {Object} destination 目的地信息
 * @param {Object} options 配置选项
 */
export const openNavigation = (destination, options = {}) => {
  const { latitude, longitude, name, address } = destination
  const { scale = 15 } = options

  if (!latitude || !longitude) {
    uni.showToast({
      title: '位置信息不完整',
      icon: 'error'
    })
    return
  }

  uni.openLocation({
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    name: name || '目的地',
    address: address || '',
    scale
  })
}

/**
 * 选择地图位置
 * @param {Object} options 配置选项
 * @returns {Promise} 选择的位置信息
 */
export const chooseLocation = (options = {}) => {
  return new Promise((resolve, reject) => {
    uni.chooseLocation({
      ...options,
      success: (res) => {
        const location = {
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        }
        resolve(location)
      },
      fail: reject
    })
  })
}

/**
 * 检查位置权限
 * @returns {Promise<boolean>} 是否有位置权限
 */
export const checkLocationPermission = () => {
  return new Promise((resolve) => {
    uni.getSetting({
      success: (res) => {
        const hasPermission = res.authSetting['scope.userLocation']
        resolve(hasPermission !== false) // undefined表示未询问过，也算有权限
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

/**
 * 请求位置权限
 * @returns {Promise<boolean>} 是否获得权限
 */
export const requestLocationPermission = () => {
  return new Promise((resolve) => {
    uni.authorize({
      scope: 'scope.userLocation',
      success: () => {
        resolve(true)
      },
      fail: () => {
        // 权限被拒绝，引导用户到设置页面
        uni.showModal({
          title: '位置权限',
          content: '需要位置权限来提供基地导航功能，请在设置中开启',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              uni.openSetting({
                success: (settingRes) => {
                  const hasPermission = settingRes.authSetting['scope.userLocation']
                  resolve(hasPermission === true)
                },
                fail: () => {
                  resolve(false)
                }
              })
            } else {
              resolve(false)
            }
          }
        })
      }
    })
  })
}

/**
 * 确保有位置权限
 * @returns {Promise<boolean>} 是否有权限
 */
export const ensureLocationPermission = async () => {
  const hasPermission = await checkLocationPermission()
  if (hasPermission) {
    return true
  }
  
  return await requestLocationPermission()
}

/**
 * 获取位置信息（带权限检查）
 * @param {Object} options 配置选项
 * @returns {Promise} 位置信息
 */
export const getLocationWithPermission = async (options = {}) => {
  const hasPermission = await ensureLocationPermission()
  if (!hasPermission) {
    throw new Error('没有位置权限')
  }
  
  return getCurrentLocation(options)
}

/**
 * 地理编码（地址转坐标）
 * 注意：小程序中需要使用第三方地图服务API
 * @param {string} address 地址
 * @returns {Promise} 坐标信息
 */
export const geocode = async (address) => {
  // 这里需要调用第三方地图服务API，如腾讯地图、百度地图等
  // 示例使用腾讯地图API
  try {
    const response = await uni.request({
      url: '/api/v1/geocode',
      method: 'GET',
      data: { address }
    })
    
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '地理编码失败')
    }
  } catch (error) {
    console.error('地理编码失败:', error)
    throw error
  }
}

/**
 * 逆地理编码（坐标转地址）
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 * @returns {Promise} 地址信息
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await uni.request({
      url: '/api/v1/reverse-geocode',
      method: 'GET',
      data: { latitude, longitude }
    })
    
    if (response.data.success) {
      return response.data.data
    } else {
      throw new Error(response.data.message || '逆地理编码失败')
    }
  } catch (error) {
    console.error('逆地理编码失败:', error)
    throw error
  }
}

/**
 * 位置工具类
 */
export class LocationManager {
  constructor() {
    this.currentLocation = null
    this.watchId = null
    this.isWatching = false
  }

  // 获取当前位置
  async getCurrentLocation(options = {}) {
    try {
      this.currentLocation = await getLocationWithPermission(options)
      return this.currentLocation
    } catch (error) {
      console.error('获取当前位置失败:', error)
      throw error
    }
  }

  // 开始监听位置变化
  startWatching(callback, options = {}) {
    if (this.isWatching) {
      this.stopWatching()
    }

    this.watchId = watchLocation((location) => {
      this.currentLocation = location
      callback(location)
    }, options)

    this.isWatching = true
  }

  // 停止监听位置变化
  stopWatching() {
    if (this.watchId) {
      this.watchId()
      this.watchId = null
      this.isWatching = false
    }
  }

  // 计算到目标位置的距离
  async getDistanceTo(targetLatitude, targetLongitude) {
    if (!this.currentLocation) {
      await this.getCurrentLocation()
    }

    return calculateDistance(
      this.currentLocation.latitude,
      this.currentLocation.longitude,
      targetLatitude,
      targetLongitude
    )
  }

  // 导航到目标位置
  navigateTo(destination, options = {}) {
    openNavigation(destination, options)
  }

  // 销毁
  destroy() {
    this.stopWatching()
    this.currentLocation = null
  }
}

// 创建全局位置管理器实例
export const locationManager = new LocationManager()

export default {
  getCurrentLocation,
  watchLocation,
  calculateDistance,
  formatDistance,
  openNavigation,
  chooseLocation,
  checkLocationPermission,
  requestLocationPermission,
  ensureLocationPermission,
  getLocationWithPermission,
  geocode,
  reverseGeocode,
  LocationManager,
  locationManager
}