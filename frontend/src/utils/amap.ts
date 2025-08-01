/**
 * 高德地图工具类
 */

// 检查高德地图API是否已加载
export const isAMapLoaded = (): boolean => {
  const AMap = (window as any).AMap
  return AMap && 
         typeof AMap === 'object' && 
         typeof AMap.Map === 'function' &&
         typeof AMap.LngLat === 'function'
}

// 等待高德地图API加载完成
export const waitForAMap = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // 检查是否已经加载完成
    if (isAMapLoaded()) {
      console.log('高德地图API已经加载完成')
      resolve((window as any).AMap)
      return
    }

    console.log('等待高德地图API加载...')
    
    let attempts = 0
    const maxAttempts = 200 // 20秒超时 (200 * 100ms)

    const checkInterval = setInterval(() => {
      attempts++
      
      if (isAMapLoaded()) {
        console.log(`高德地图API加载完成 (尝试 ${attempts} 次)`)
        clearInterval(checkInterval)
        resolve((window as any).AMap)
      } else if (attempts >= maxAttempts) {
        console.error('高德地图API加载超时')
        clearInterval(checkInterval)
        reject(new Error('高德地图API加载超时'))
      } else if (attempts % 50 === 0) {
        console.log(`等待高德地图API加载... (${attempts}/${maxAttempts})`)
      }
    }, 100)
  })
}

// 坐标转换：WGS84 -> GCJ02 (高德坐标系)
export const wgs84ToGcj02 = (lng: number, lat: number): Promise<{ lng: number; lat: number }> => {
  return new Promise((resolve, reject) => {
    waitForAMap().then((AMap) => {
      // 高德地图默认使用GCJ02坐标系，可以直接使用转换工具
      AMap.convertFrom([lng, lat], 'gps', (status: string, result: any) => {
        if (status === 'complete' && result.locations && result.locations.length > 0) {
          const location = result.locations[0]
          resolve({
            lng: location.lng,
            lat: location.lat
          })
        } else {
          reject(new Error('坐标转换失败'))
        }
      })
    }).catch(reject)
  })
}

// 坐标转换：GCJ02 -> WGS84
export const gcj02ToWgs84 = (lng: number, lat: number): Promise<{ lng: number; lat: number }> => {
  return new Promise((resolve, reject) => {
    // 高德地图API没有直接的GCJ02转WGS84方法，使用算法转换
    const converted = gcj02ToWgs84Algorithm(lng, lat)
    resolve(converted)
  })
}

// GCJ02转WGS84算法实现
const gcj02ToWgs84Algorithm = (lng: number, lat: number): { lng: number; lat: number } => {
  const a = 6378245.0
  const ee = 0.00669342162296594323
  
  const dlat = transformLat(lng - 105.0, lat - 35.0)
  const dlng = transformLng(lng - 105.0, lat - 35.0)
  
  const radlat = lat / 180.0 * Math.PI
  let magic = Math.sin(radlat)
  magic = 1 - ee * magic * magic
  const sqrtmagic = Math.sqrt(magic)
  
  const dlat2 = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * Math.PI)
  const dlng2 = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * Math.PI)
  
  return {
    lng: lng - dlng2,
    lat: lat - dlat2
  }
}

const transformLat = (lng: number, lat: number): number => {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0
  return ret
}

const transformLng = (lng: number, lat: number): number => {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0
  return ret
}

// 地理编码：地址 -> 坐标
export const geocodeAddress = (address: string): Promise<{ lng: number; lat: number }> => {
  return new Promise((resolve, reject) => {
    waitForAMap().then((AMap) => {
      AMap.plugin('AMap.Geocoder', () => {
        const geocoder = new AMap.Geocoder()
        
        geocoder.getLocation(address, (status: string, result: any) => {
          if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
            const location = result.geocodes[0].location
            resolve({
              lng: location.lng,
              lat: location.lat
            })
          } else {
            reject(new Error('地址解析失败'))
          }
        })
      })
    }).catch(reject)
  })
}

// 逆地理编码：坐标 -> 地址
export const reverseGeocode = (lng: number, lat: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    waitForAMap().then((AMap) => {
      AMap.plugin('AMap.Geocoder', () => {
        const geocoder = new AMap.Geocoder()
        
        geocoder.getAddress([lng, lat], (status: string, result: any) => {
          if (status === 'complete' && result.regeocode) {
            resolve(result.regeocode.formattedAddress || '')
          } else {
            reject(new Error('逆地理编码失败'))
          }
        })
      })
    }).catch(reject)
  })
}

// 计算两点间距离（米）
export const getDistance = (point1: { lng: number; lat: number }, point2: { lng: number; lat: number }): Promise<number> => {
  return new Promise((resolve, reject) => {
    waitForAMap().then((AMap) => {
      const p1 = new AMap.LngLat(point1.lng, point1.lat)
      const p2 = new AMap.LngLat(point2.lng, point2.lat)
      
      const distance = p1.distance(p2)
      resolve(distance)
    }).catch(reject)
  })
}

// 获取当前位置
export const getCurrentPosition = (): Promise<{ lng: number; lat: number }> => {
  return new Promise((resolve, reject) => {
    waitForAMap().then((AMap) => {
      AMap.plugin('AMap.Geolocation', () => {
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
          convert: true, // 自动转换为高德坐标系
          showButton: false,
          showMarker: false,
          showCircle: false
        })

        geolocation.getCurrentPosition((status: string, result: any) => {
          if (status === 'complete') {
            resolve({
              lng: result.position.lng,
              lat: result.position.lat
            })
          } else {
            reject(new Error(`定位失败: ${result.message}`))
          }
        })
      })
    }).catch(reject)
  })
}

// 默认的地图配置
export const DEFAULT_MAP_CONFIG = {
  center: { lng: 116.404, lat: 39.915 }, // 北京
  zoom: 11,
  minZoom: 3,
  maxZoom: 19
}

// 搜索地点（POI搜索）- 更精确的搜索
export const searchPOI = (keyword: string, city?: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    waitForAMap().then((AMap) => {
      AMap.plugin('AMap.PlaceSearch', () => {
        const placeSearch = new AMap.PlaceSearch({
          city: city || '全国',
          citylimit: false,
          pageSize: 20, // 增加搜索结果数量
          pageIndex: 1,
          extensions: 'all' // 返回详细信息
        })
        
        placeSearch.search(keyword, (status: string, result: any) => {
          console.log('POI搜索详细结果:', status, result)
          if (status === 'complete' && result.poiList && result.poiList.pois) {
            // 按相关性排序，优先返回精确匹配的结果
            const sortedPois = result.poiList.pois.sort((a: any, b: any) => {
              // 优先显示名称完全匹配的结果
              const aExactMatch = a.name.toLowerCase().includes(keyword.toLowerCase())
              const bExactMatch = b.name.toLowerCase().includes(keyword.toLowerCase())
              
              if (aExactMatch && !bExactMatch) return -1
              if (!aExactMatch && bExactMatch) return 1
              
              // 其次按距离排序（如果有距离信息）
              if (a.distance && b.distance) {
                return a.distance - b.distance
              }
              
              return 0
            })
            
            resolve(sortedPois)
          } else {
            reject(new Error(`搜索失败: ${result?.info || '未知错误'}`))
          }
        })
      })
    }).catch(reject)
  })
}

// 精确地址搜索（结合POI和地理编码）
export const searchAccurateLocation = (keyword: string, city?: string): Promise<{
  lng: number
  lat: number
  address: string
  name: string
  type: 'poi' | 'geocode'
}> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('开始精确地址搜索:', keyword)
      
      // 首先尝试POI搜索
      try {
        const pois = await searchPOI(keyword, city)
        if (pois && pois.length > 0) {
          const bestPoi = pois[0]
          console.log('POI搜索成功，找到最佳结果:', bestPoi)
          
          resolve({
            lng: bestPoi.location.lng,
            lat: bestPoi.location.lat,
            address: bestPoi.address || bestPoi.pname + bestPoi.cityname + bestPoi.adname,
            name: bestPoi.name,
            type: 'poi'
          })
          return
        }
      } catch (poiError) {
        console.log('POI搜索失败，尝试地理编码:', poiError)
      }
      
      // 如果POI搜索失败，使用地理编码
      try {
        const location = await geocodeAddress(keyword)
        console.log('地理编码搜索成功:', location)
        
        // 获取详细地址信息
        const address = await reverseGeocode(location.lng, location.lat)
        
        resolve({
          lng: location.lng,
          lat: location.lat,
          address: address,
          name: keyword,
          type: 'geocode'
        })
      } catch (geocodeError) {
        console.error('地理编码也失败:', geocodeError)
        reject(new Error(`无法找到"${keyword}"的位置信息`))
      }
    } catch (error) {
      reject(error)
    }
  })
}

// 自动完成搜索建议
export const getSearchSuggestions = (keyword: string, city?: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    waitForAMap().then((AMap) => {
      AMap.plugin('AMap.AutoComplete', () => {
        const autoComplete = new AMap.AutoComplete({
          city: city || '全国',
          citylimit: false
        })
        
        autoComplete.search(keyword, (status: string, result: any) => {
          if (status === 'complete' && result.tips) {
            resolve(result.tips)
          } else {
            resolve([])
          }
        })
      })
    }).catch(reject)
  })
}

// 中国主要城市坐标 (GCJ02坐标系)
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