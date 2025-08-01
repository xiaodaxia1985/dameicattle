<template>
  <div class="amap-container">
    <!-- 搜索框 -->
    <div v-if="showSearch" class="search-container">
      <div class="search-box">
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索地点..."
          class="search-input"
          @keyup.enter="handleSearch"
          @input="handleSearchInput"
        />
        <button class="search-btn" @click="handleSearch">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
        </button>
      </div>
      <!-- 搜索建议列表 -->
      <div v-if="searchSuggestions.length > 0" class="suggestions-list">
        <div
          v-for="(suggestion, index) in searchSuggestions"
          :key="index"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          <div class="suggestion-name">{{ suggestion.name }}</div>
          <div class="suggestion-address">{{ suggestion.district }}</div>
        </div>
      </div>
    </div>

    <!-- 地图类型显示（仅显示当前为卫星模式） -->
    <div v-if="showMapTypeSwitch" class="map-type-indicator">
      <div class="map-type-label">
        卫星地图
      </div>
    </div>

    <div :id="mapId" :style="{ width: width, height: height }" class="amap"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { waitForAMap, DEFAULT_MAP_CONFIG } from '@/utils/amap'

interface Props {
  width?: string
  height?: string
  center?: { lng: number; lat: number }
  zoom?: number
  enableScrollWheelZoom?: boolean
  enableDoubleClickZoom?: boolean
  enableKeyboard?: boolean
  enableDragging?: boolean
  enableClick?: boolean
  showSearch?: boolean
  showMapTypeSwitch?: boolean
  markers?: Array<{
    lng: number
    lat: number
    title?: string
    content?: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '400px',
  center: () => ({ lng: 116.404, lat: 39.915 }), // 默认北京
  zoom: 11,
  enableScrollWheelZoom: true,
  enableDoubleClickZoom: true,
  enableKeyboard: true,
  enableDragging: true,
  enableClick: false,
  showSearch: true,
  showMapTypeSwitch: true,
  markers: () => []
})

const emit = defineEmits<{
  'map-click': [event: { lng: number; lat: number }]
  'map-ready': [map: any]
}>()

const mapId = ref(`amap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
const map = ref<any>(null)
const markerInstances = ref<any[]>([])

// 搜索相关
const searchKeyword = ref('')
const searchSuggestions = ref<any[]>([])
const autoComplete = ref<any>(null)
let searchTimeout: NodeJS.Timeout | null = null

// 地图类型 - 默认卫星模式
const currentMapType = ref<'satellite'>('satellite')
const satelliteLayer = ref<any>(null)
const roadNetLayer = ref<any>(null)

// 初始化地图
const initMap = async () => {
  try {
    console.log('开始初始化高德地图...')
    
    // 等待DOM元素准备就绪
    await nextTick()
    
    // 检查DOM元素是否存在
    const mapElement = document.getElementById(mapId.value)
    if (!mapElement) {
      console.error(`地图容器元素未找到: ${mapId.value}`)
      return
    }
    
    // 等待高德地图API加载完成
    await waitForAMap()
    const AMap = (window as any).AMap
    
    console.log('高德地图API已加载:', !!AMap)
    console.log('AMap.Map构造函数:', typeof AMap?.Map)
    
    if (!AMap || typeof AMap.Map !== 'function') {
      throw new Error('高德地图API未正确加载或AMap.Map不是构造函数')
    }
    
    console.log('创建地图实例...')
    // 创建地图实例
    map.value = new AMap.Map(mapId.value, {
      center: [props.center.lng, props.center.lat],
      zoom: props.zoom,
      scrollWheel: props.enableScrollWheelZoom,
      doubleClickZoom: props.enableDoubleClickZoom,
      keyboardEnable: props.enableKeyboard,
      dragEnable: props.enableDragging,
      resizeEnable: true,
      rotateEnable: false,
      pitchEnable: false,
      mapStyle: 'amap://styles/normal'
    })
    
    console.log('地图实例创建成功:', !!map.value)

    // 初始化图层
    initLayers(AMap)

    // 添加控件
    AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
      map.value.addControl(new AMap.Scale())
      map.value.addControl(new AMap.ToolBar())
    })

    // 地图点击事件
    if (props.enableClick) {
      map.value.on('click', (e: any) => {
        emit('map-click', {
          lng: e.lnglat.lng,
          lat: e.lnglat.lat
        })
      })
    }

    // 初始化搜索功能
    if (props.showSearch) {
      initSearch()
    }

    // 添加标记点
    addMarkers()

    // 触发地图就绪事件
    emit('map-ready', map.value)
  } catch (error) {
    console.error('初始化高德地图失败:', error)
  }
}

// 添加标记点
const addMarkers = async () => {
  if (!map.value || !props.markers.length) return

  try {
    await waitForAMap()
    const AMap = (window as any).AMap

    // 清除之前的标记
    clearMarkers()

    props.markers.forEach(marker => {
      const markerInstance = new AMap.Marker({
        position: [marker.lng, marker.lat],
        title: marker.title || '',
        map: map.value
      })

      markerInstances.value.push(markerInstance)

      // 添加信息窗口
      if (marker.title || marker.content) {
        const infoWindow = new AMap.InfoWindow({
          content: `<div style="padding: 8px;">
            ${marker.title ? `<h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${marker.title}</h4>` : ''}
            ${marker.content ? `<p style="margin: 0; font-size: 12px; color: #666;">${marker.content}</p>` : ''}
          </div>`,
          offset: new AMap.Pixel(0, -30)
        })
        
        markerInstance.on('click', () => {
          infoWindow.open(map.value, [marker.lng, marker.lat])
        })
      }
    })
  } catch (error) {
    console.error('添加标记失败:', error)
  }
}

// 清除所有标记
const clearMarkers = () => {
  if (markerInstances.value.length > 0) {
    markerInstances.value.forEach(marker => {
      map.value.remove(marker)
    })
    markerInstances.value = []
  }
}

// 设置地图中心
const setCenter = async (lng: number, lat: number) => {
  if (map.value) {
    try {
      await waitForAMap()
      map.value.setCenter([lng, lat])
    } catch (error) {
      console.error('设置地图中心失败:', error)
    }
  }
}

// 添加单个标记
const addMarker = async (lng: number, lat: number, title?: string, content?: string, draggable: boolean = false) => {
  if (!map.value) return

  try {
    await waitForAMap()
    const AMap = (window as any).AMap
    
    const marker = new AMap.Marker({
      position: [lng, lat],
      title: title || '',
      map: map.value,
      draggable: draggable,
      cursor: draggable ? 'move' : 'pointer'
    })

    markerInstances.value.push(marker)

    // 如果标记可拖拽，添加拖拽事件监听
    if (draggable) {
      marker.on('dragend', (e: any) => {
        const position = e.target.getPosition()
        emit('map-click', {
          lng: position.lng,
          lat: position.lat
        })
        console.log('标记拖拽到新位置:', position.lng, position.lat)
      })
    }

    if (title || content) {
      const infoWindow = new AMap.InfoWindow({
        content: `<div style="padding: 8px;">
          ${title ? `<h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${title}</h4>` : ''}
          ${content ? `<p style="margin: 0; font-size: 12px; color: #666;">${content}</p>` : ''}
          ${draggable ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">可拖拽调整位置</p>` : ''}
        </div>`,
        offset: new AMap.Pixel(0, -30)
      })
      
      marker.on('click', () => {
        infoWindow.open(map.value, [lng, lat])
      })
    }

    return marker
  } catch (error) {
    console.error('添加标记失败:', error)
    return null
  }
}

// 监听标记变化
watch(() => props.markers, () => {
  if (map.value) {
    addMarkers()
  }
}, { deep: true })

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    setCenter(newCenter.lng, newCenter.lat)
  }
}, { deep: true })

// 初始化图层
const initLayers = (AMap: any) => {
  try {
    // 只创建卫星图层实例
    satelliteLayer.value = new AMap.TileLayer.Satellite()
    roadNetLayer.value = new AMap.TileLayer.RoadNet()
    
    // 默认设置为卫星地图
    map.value.setLayers([satelliteLayer.value, roadNetLayer.value])
    
    console.log('卫星图层初始化完成并设置为默认')
  } catch (error) {
    console.error('图层初始化失败:', error)
  }
}

// 初始化搜索功能
const initSearch = async () => {
  try {
    await waitForAMap()
    const AMap = (window as any).AMap
    
    AMap.plugin('AMap.AutoComplete', () => {
      autoComplete.value = new AMap.AutoComplete({
        city: '全国',
        citylimit: false
      })
    })
  } catch (error) {
    console.error('初始化搜索功能失败:', error)
  }
}

// 处理搜索输入
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    if (searchKeyword.value.trim() && autoComplete.value) {
      console.log('搜索建议:', searchKeyword.value)
      autoComplete.value.search(searchKeyword.value, (status: string, result: any) => {
        console.log('搜索建议结果:', status, result)
        if (status === 'complete' && result.tips) {
          // 过滤掉无效的建议
          const validTips = result.tips.filter((tip: any) => tip.name && tip.name.trim())
          searchSuggestions.value = validTips.slice(0, 8) // 限制显示8个建议
          console.log('有效搜索建议:', searchSuggestions.value)
        } else {
          searchSuggestions.value = []
        }
      })
    } else {
      searchSuggestions.value = []
    }
  }, 300)
}

// 处理搜索
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return
  
  try {
    // 使用新的精确搜索功能
    const { searchAccurateLocation } = await import('@/utils/amap')
    const result = await searchAccurateLocation(searchKeyword.value)
    
    // 清除之前的标记
    clearMarkers()
    
    // 直接设置地图中心和缩放
    map.value.setCenter([result.lng, result.lat])
    map.value.setZoom(17)
    
    // 添加标记
    const AMap = (window as any).AMap
    const marker = new AMap.Marker({
      position: [result.lng, result.lat],
      title: result.name,
      map: map.value,
      draggable: true
    })
    
    markerInstances.value.push(marker)
    
    // 触发位置选择事件
    emit('map-click', {
      lng: result.lng,
      lat: result.lat
    })
    
  } catch (error) {
    console.error('精确搜索失败:', error)
    alert(`搜索失败: ${(error as Error).message}`)
  }
  
  searchSuggestions.value = []
}

// 选择搜索建议
const selectSuggestion = (suggestion: any) => {
  searchKeyword.value = suggestion.name
  console.log('选择搜索建议:', suggestion)
  
  // 优先使用建议中的位置信息，如果没有则进行地理编码搜索
  if (suggestion.location && suggestion.location.lng && suggestion.location.lat) {
    searchLocation(suggestion.name, suggestion.location)
  } else {
    searchLocation(suggestion.name)
  }
  searchSuggestions.value = []
}

// 搜索位置
const searchLocation = async (keyword: string, location?: any) => {
  try {
    console.log('开始搜索位置:', keyword, location)
    await waitForAMap()
    const AMap = (window as any).AMap
    
    // 清除之前的搜索标记
    clearMarkers()
    
    if (location) {
      // 如果有具体位置信息，直接定位
      const lng = parseFloat(location.lng)
      const lat = parseFloat(location.lat)
      console.log('使用建议位置信息:', lng, lat)
      
      if (!isNaN(lng) && !isNaN(lat)) {
        map.value.setCenter([lng, lat])
        map.value.setZoom(15)
        
        // 添加搜索结果标记
        const marker = new AMap.Marker({
          position: [lng, lat],
          title: keyword,
          map: map.value,
          draggable: true // 使标记可拖拽
        })
        
        // 监听标记拖拽事件
        marker.on('dragend', (e: any) => {
          const position = e.target.getPosition()
          emit('map-click', {
            lng: position.lng,
            lat: position.lat
          })
          console.log('标记拖拽到新位置:', position.lng, position.lat)
        })
        
        markerInstances.value.push(marker)
        
        // 触发位置选择事件
        console.log('AMapComponent: 准备触发 map-click 事件 (searchLocation)', lng, lat)
        emit('map-click', { lng, lat })
        console.log('AMapComponent: 搜索定位成功，事件已触发:', lng, lat)
      } else {
        console.error('位置信息无效:', location)
        // 如果位置信息无效，回退到地理编码搜索
        performGeocode(keyword, AMap)
      }
    } else {
      // 使用地理编码搜索
      performGeocode(keyword, AMap)
    }
  } catch (error) {
    console.error('搜索位置失败:', error)
  }
}

// 执行地理编码搜索
const performGeocode = (keyword: string, AMap: any) => {
  console.log('执行地理编码搜索:', keyword)
  
  // 优先使用PlaceSearch进行POI搜索，更精确
  AMap.plugin('AMap.PlaceSearch', () => {
    const placeSearch = new AMap.PlaceSearch({
      city: '全国',
      citylimit: false,
      pageSize: 10,
      pageIndex: 1,
      extensions: 'all' // 返回详细信息
    })
    
    placeSearch.search(keyword, (status: string, result: any) => {
      console.log('POI搜索结果:', status, result)
      
      if (status === 'complete' && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
        const poi = result.poiList.pois[0] // 取第一个最相关的结果
        const location = poi.location
        
        console.log('找到POI搜索结果:', poi)
        console.log('精确位置坐标:', location.lng, location.lat)
        console.log('地址:', poi.address)
        console.log('名称:', poi.name)
        
        // 设置地图中心和缩放级别
        map.value.setCenter([location.lng, location.lat])
        map.value.setZoom(17) // 使用更高的缩放级别以显示更精确的位置
        
        // 添加搜索结果标记
        const marker = new AMap.Marker({
          position: [location.lng, location.lat],
          title: poi.name || keyword,
          map: map.value,
          draggable: true // 使标记可拖拽
        })
        
        // 添加详细信息窗口
        const infoWindow = new AMap.InfoWindow({
          content: `<div style="padding: 10px; max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${poi.name || keyword}</h4>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${poi.address || '搜索结果'}</p>
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #999;">坐标: ${location.lng.toFixed(6)}, ${location.lat.toFixed(6)}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">可拖拽调整位置</p>
          </div>`,
          offset: new AMap.Pixel(0, -30)
        })
        
        marker.on('click', () => {
          infoWindow.open(map.value, [location.lng, location.lat])
        })
        
        // 监听标记拖拽事件
        marker.on('dragend', (e: any) => {
          const position = e.target.getPosition()
          emit('map-click', {
            lng: position.lng,
            lat: position.lat
          })
          console.log('标记拖拽到新位置:', position.lng, position.lat)
        })
        
        markerInstances.value.push(marker)
        
        // 触发位置选择事件
        emit('map-click', {
          lng: location.lng,
          lat: location.lat
        })
        
        console.log('POI搜索成功，已精确定位到:', location.lng, location.lat)
      } else {
        // 如果POI搜索失败，回退到地理编码搜索
        console.log('POI搜索无结果，回退到地理编码搜索')
        performGeocodeSearch(keyword, AMap)
      }
    })
  })
}

// 地理编码搜索（作为备用方案）
const performGeocodeSearch = (keyword: string, AMap: any) => {
  console.log('执行地理编码搜索（备用方案）:', keyword)
  
  AMap.plugin('AMap.Geocoder', () => {
    const geocoder = new AMap.Geocoder({
      city: '全国',
      radius: 1000,
      extensions: 'all' // 返回详细信息
    })
    
    geocoder.getLocation(keyword, (status: string, result: any) => {
      console.log('地理编码搜索结果:', status, result)
      
      if (status === 'complete') {
        if (result.geocodes && result.geocodes.length > 0) {
          const geocode = result.geocodes[0]
          const location = geocode.location
          
          console.log('找到地理编码结果:', geocode)
          console.log('位置坐标:', location.lng, location.lat)
          console.log('格式化地址:', geocode.formattedAddress)
          
          // 设置地图中心和缩放级别
          map.value.setCenter([location.lng, location.lat])
          map.value.setZoom(15)
          
          // 添加搜索结果标记
          const marker = new AMap.Marker({
            position: [location.lng, location.lat],
            title: keyword,
            map: map.value,
            draggable: true // 使标记可拖拽
          })
          
          // 添加信息窗口
          const infoWindow = new AMap.InfoWindow({
            content: `<div style="padding: 10px; max-width: 250px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${keyword}</h4>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${geocode.formattedAddress || '搜索结果'}</p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #999;">坐标: ${location.lng.toFixed(6)}, ${location.lat.toFixed(6)}</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">可拖拽调整位置</p>
            </div>`,
            offset: new AMap.Pixel(0, -30)
          })
          
          marker.on('click', () => {
            infoWindow.open(map.value, [location.lng, location.lat])
          })
          
          // 监听标记拖拽事件
          marker.on('dragend', (e: any) => {
            const position = e.target.getPosition()
            emit('map-click', {
              lng: position.lng,
              lat: position.lat
            })
            console.log('标记拖拽到新位置:', position.lng, position.lat)
          })
          
          markerInstances.value.push(marker)
          
          // 触发位置选择事件
          emit('map-click', {
            lng: location.lng,
            lat: location.lat
          })
          
          console.log('地理编码搜索成功，已定位到:', location.lng, location.lat)
        } else {
          console.warn('地理编码搜索无结果:', keyword)
          alert(`未找到"${keyword}"的位置信息，请尝试更具体的地址`)
        }
      } else {
        console.error('地理编码搜索失败:', status, result)
        alert(`搜索失败: ${result?.info || '未知错误'}`)
      }
    })
  })
}

// 由于只使用卫星模式，移除切换功能

// 暴露方法给父组件
defineExpose({
  map,
  setCenter,
  addMarker,
  clearMarkers,
  searchLocation
})

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  clearMarkers()
  if (map.value) {
    map.value.destroy()
    map.value = null
  }
})
</script>

<style scoped lang="scss">
.amap-container {
  position: relative;
  
  .amap {
    border-radius: 4px;
    overflow: hidden;
  }
  
  // 搜索框样式
  .search-container {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    width: 300px;
    
    .search-box {
      display: flex;
      background: white;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      
      .search-input {
        flex: 1;
        padding: 10px 12px;
        border: none;
        outline: none;
        font-size: 14px;
        background: transparent;
        
        &::placeholder {
          color: #999;
        }
      }
      
      .search-btn {
        padding: 10px 12px;
        border: none;
        background: #1890ff;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
        
        &:hover {
          background: #40a9ff;
        }
        
        svg {
          width: 16px;
          height: 16px;
        }
      }
    }
    
    // 搜索建议列表
    .suggestions-list {
      background: white;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      margin-top: 4px;
      max-height: 300px;
      overflow-y: auto;
      
      .suggestion-item {
        padding: 10px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.2s;
        
        &:hover {
          background: #f5f5f5;
        }
        
        &:last-child {
          border-bottom: none;
        }
        
        .suggestion-name {
          font-size: 14px;
          color: #333;
          margin-bottom: 2px;
        }
        
        .suggestion-address {
          font-size: 12px;
          color: #666;
        }
      }
    }
  }
  
  // 地图类型指示器
  .map-type-indicator {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    
    .map-type-label {
      padding: 8px 16px;
      color: white;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
      white-space: nowrap;
    }
  }
  
  // 响应式设计
  @media (max-width: 768px) {
    .search-container {
      width: calc(100% - 120px);
      max-width: 250px;
    }
    
    .map-type-switch {
      .map-type-btn {
        padding: 6px 12px;
        font-size: 11px;
      }
    }
  }
}
</style>