/**
 * 百度地图工具类
 */

// 检查百度地图API是否已加载
export const isBaiduMapLoaded = (): boolean => {
  const BMap = (window as any).BMap
  return BMap && 
         typeof BMap === 'object' && 
         typeof BMap.Map === 'function' &&
         typeof BMap.Point === 'function'
}

// 等待百度地图API加载完成
export const waitForBaiduMap = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载完成
    if (isBaiduMapLoaded()) {
      console.log('百度地图API已经加载完成')
      resolve((window as any).BMap)
      return
    }

    console.log('等待百度地图API加载...')
    
    let attempts = 0
    const maxAttempts = 200 // 20秒超时 (200 * 100ms)

    const checkInterval = setInterval(() => {
      attempts++
      
      if (isBaiduMapLoaded()) {
        console.log(`百度地图API加载完成 (尝试 ${attempts} 次)`)
        clearInterval(checkInterval)
        resolve((window as any).BMap)
      } else if (attempts >= maxAttempts) {
        console.error('百度地图API加载超时')
        clearInterval(checkInterval)
        reject(new Error('百度地图API加载超时'))
      } else if (attempts % 50 === 0) {
        console.log(`等待百度地图API加载... (${attempts}/${maxAttempts})`)
      }
    }, 100)
  })
}

// 坐标转换：WGS84 -> BD09
export const wgs84ToBd09 = (lng: number, lat: number): Promise<{ lng: number; lat: number }> => {
  return new Promise((resolve, reject) => {
    waitForBaiduMap().then((BMap) => {
      const convertor = new BMap.Convertor()
      const point = new BMap.Point(lng, lat)
      
      convertor.translate([point], 1, 5, (data: any) => {
        if (data.status === 0) {
          resolve({
            lng: data.points[0].lng,
            lat: data.points[0].lat
          })
        } else {
          reject(new Error('坐标转换失败'))
        }
      })
    }).catch(reject)
  })
}

// 坐标转换：BD09 -> WGS84
export const bd09ToWgs84 = (lng: number, lat: number): Promise<{ lng: number; lat: number }> => {
  return new Promise((resolve, reject) => {
    waitForBaiduMap().then((BMap) => {
      const convertor = new BMap.Convertor()
      const point = new BMap.Point(lng, lat)
      
      convertor.translate([point], 5, 1, (data: any) => {
        if (data.status === 0) {
          resolve({
            lng: data.points[0].lng,
            lat: data.points[0].lat
          })
        } else {
          reject(new Error('坐标转换失败'))
        }
      })
    }).catch(reject)
  })
}

// 地理编码：地址 -> 坐标
export const geocodeAddress = (address: string): Promise<{ lng: number; lat: number }> => {
  return new Promise((resolve, reject) => {
    waitForBaiduMap().then((BMap) => {
      const geocoder = new BMap.Geocoder()
      
      geocoder.getPoint(address, (point: any) => {
        if (point) {
          resolve({
            lng: point.lng,
            lat: point.lat
          })
        } else {
          reject(new Error('地址解析失败'))
        }
      })
    }).catch(reject)
  })
}

// 逆地理编码：坐标 -> 地址
export const reverseGeocode = (lng: number, lat: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    waitForBaiduMap().then((BMap) => {
      const geocoder = new BMap.Geocoder()
      const point = new BMap.Point(lng, lat)
      
      geocoder.getLocation(point, (result: any) => {
        if (result) {
          resolve(result.address || '')
        } else {
          reject(new Error('逆地理编码失败'))
        }
      })
    }).catch(reject)
  })
}

// 计算两点间距离（米）
export const getDistance = (point1: { lng: number; lat: number }, point2: { lng: number; lat: number }): Promise<number> => {
  return new Promise((resolve, reject) => {
    waitForBaiduMap().then((BMap) => {
      const p1 = new BMap.Point(point1.lng, point1.lat)
      const p2 = new BMap.Point(point2.lng, point2.lat)
      
      const distance = BMap.Map.getDistance(p1, p2)
      resolve(distance)
    }).catch(reject)
  })
}

// 获取当前位置
export const getCurrentPosition = (): Promise<{ lng: number; lat: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords
        // 将GPS坐标转换为百度坐标
        wgs84ToBd09(longitude, latitude).then(resolve).catch(reject)
      },
      (error) => {
        reject(new Error(`定位失败: ${error.message}`))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  })
}

// 默认的地图配置
export const DEFAULT_MAP_CONFIG = {
  center: { lng: 116.404, lat: 39.915 }, // 北京
  zoom: 11,
  minZoom: 3,
  maxZoom: 19
}

// 中国主要城市坐标
export const CITY_COORDINATES = {
  北京: { lng: 116.404, lat: 39.915 },
  上海: { lng: 121.472, lat: 31.231 },
  广州: { lng: 113.280, lat: 23.125 },
  深圳: { lng: 114.085, lat: 22.547 },
  杭州: { lng: 120.153, lat: 30.287 },
  南京: { lng: 118.767, lat: 32.041 },
  武汉: { lng: 114.298, lat: 30.584 },
  成都: { lng: 104.065, lat: 30.659 },
  西安: { lng: 108.948, lat: 34.263 },
  重庆: { lng: 106.504, lat: 29.533 }
}