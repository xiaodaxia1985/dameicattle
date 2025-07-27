<template>
  <div class="baidu-map-container">
    <div :id="mapId" :style="{ width: width, height: height }" class="baidu-map"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { waitForBaiduMap, DEFAULT_MAP_CONFIG } from '@/utils/baiduMap'

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
  markers: () => []
})

const emit = defineEmits<{
  'map-click': [event: { lng: number; lat: number }]
  'map-ready': [map: any]
}>()

const mapId = ref(`baidu-map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
const map = ref<any>(null)

// 初始化地图
const initMap = async () => {
  try {
    console.log('开始初始化百度地图...')
    
    // 等待DOM元素准备就绪
    await nextTick()
    
    // 检查DOM元素是否存在
    const mapElement = document.getElementById(mapId.value)
    if (!mapElement) {
      console.error(`地图容器元素未找到: ${mapId.value}`)
      return
    }
    
    // 等待百度地图API加载完成
    await waitForBaiduMap()
    const BMap = (window as any).BMap
    
    console.log('百度地图API已加载:', !!BMap)
    console.log('BMap.Map构造函数:', typeof BMap?.Map)
    console.log('window.BMap:', (window as any).BMap)
    
    if (!BMap || typeof BMap.Map !== 'function') {
      throw new Error('百度地图API未正确加载或BMap.Map不是构造函数')
    }
    
    console.log('创建地图实例...')
    // 创建地图实例
    map.value = new BMap.Map(mapId.value)
    console.log('地图实例创建成功:', !!map.value)
    
    // 设置中心点和缩放级别
    const center = props.center || DEFAULT_MAP_CONFIG.center
    console.log('设置地图中心:', center)
    const point = new BMap.Point(center.lng, center.lat)
    map.value.centerAndZoom(point, props.zoom)
    console.log('地图中心和缩放设置完成')

    // 启用地图功能
    if (props.enableScrollWheelZoom) {
      map.value.enableScrollWheelZoom(true)
    }
    if (props.enableDoubleClickZoom) {
      map.value.enableDoubleClickZoom()
    }
    if (props.enableKeyboard) {
      map.value.enableKeyboard()
    }
    if (props.enableDragging) {
      map.value.enableDragging()
    }

    // 添加控件
    map.value.addControl(new BMap.MapTypeControl({
      mapTypes: [(window as any).BMAP_NORMAL_MAP, (window as any).BMAP_SATELLITE_MAP]
    }))
    map.value.addControl(new BMap.NavigationControl())
    map.value.addControl(new BMap.ScaleControl())

    // 地图点击事件
    if (props.enableClick) {
      map.value.addEventListener('click', (e: any) => {
        emit('map-click', {
          lng: e.point.lng,
          lat: e.point.lat
        })
      })
    }

    // 添加标记点
    addMarkers()

    // 触发地图就绪事件
    emit('map-ready', map.value)
  } catch (error) {
    console.error('初始化百度地图失败:', error)
  }
}

// 添加标记点
const addMarkers = async () => {
  if (!map.value || !props.markers.length) return

  try {
    await waitForBaiduMap()
    const BMap = (window as any).BMap

    props.markers.forEach(marker => {
      const point = new BMap.Point(marker.lng, marker.lat)
      const mapMarker = new BMap.Marker(point)
      map.value.addOverlay(mapMarker)

      // 添加信息窗口
      if (marker.title || marker.content) {
        const infoWindow = new BMap.InfoWindow(
          `<div style="padding: 8px;">
            ${marker.title ? `<h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${marker.title}</h4>` : ''}
            ${marker.content ? `<p style="margin: 0; font-size: 12px; color: #666;">${marker.content}</p>` : ''}
          </div>`,
          {
            width: 200,
            height: 100
          }
        )
        
        mapMarker.addEventListener('click', () => {
          map.value.openInfoWindow(infoWindow, point)
        })
      }
    })
  } catch (error) {
    console.error('添加标记失败:', error)
  }
}

// 清除所有标记
const clearMarkers = () => {
  if (map.value) {
    map.value.clearOverlays()
  }
}

// 设置地图中心
const setCenter = async (lng: number, lat: number) => {
  if (map.value) {
    try {
      await waitForBaiduMap()
      const BMap = (window as any).BMap
      const point = new BMap.Point(lng, lat)
      map.value.setCenter(point)
    } catch (error) {
      console.error('设置地图中心失败:', error)
    }
  }
}

// 添加单个标记
const addMarker = async (lng: number, lat: number, title?: string, content?: string) => {
  if (!map.value) return

  try {
    await waitForBaiduMap()
    const BMap = (window as any).BMap
    const point = new BMap.Point(lng, lat)
    const marker = new BMap.Marker(point)
    map.value.addOverlay(marker)

    if (title || content) {
      const infoWindow = new BMap.InfoWindow(
        `<div style="padding: 8px;">
          ${title ? `<h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">${title}</h4>` : ''}
          ${content ? `<p style="margin: 0; font-size: 12px; color: #666;">${content}</p>` : ''}
        </div>`,
        {
          width: 200,
          height: 100
        }
      )
      
      marker.addEventListener('click', () => {
        map.value.openInfoWindow(infoWindow, point)
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
    clearMarkers()
    addMarkers()
  }
}, { deep: true })

// 监听中心点变化
watch(() => props.center, (newCenter) => {
  if (map.value && newCenter) {
    setCenter(newCenter.lng, newCenter.lat)
  }
}, { deep: true })

// 暴露方法给父组件
defineExpose({
  map,
  setCenter,
  addMarker,
  clearMarkers
})

onMounted(() => {
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  if (map.value) {
    map.value = null
  }
})
</script>

<style scoped lang="scss">
.baidu-map-container {
  .baidu-map {
    border-radius: 4px;
    overflow: hidden;
  }
}
</style>