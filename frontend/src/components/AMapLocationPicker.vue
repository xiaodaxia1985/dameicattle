<template>
  <div class="amap-location-picker">
    <AMapComponent
      ref="mapRef"
      :width="width"
      :height="height"
      :center="center"
      :zoom="zoom"
      :enable-click="true"
      :show-search="showSearch"
      :show-map-type-switch="showMapTypeSwitch"
      @map-click="handleMapClick"
      @map-ready="handleMapReady"
    />
    
    <div v-if="showLocationInfo && selectedLocation && selectedLocation.lng != null && selectedLocation.lat != null" class="location-info">
      <div class="location-coordinates">
        <span>经度: {{ Number(selectedLocation.lng).toFixed(6) }}</span>
        <span>纬度: {{ Number(selectedLocation.lat).toFixed(6) }}</span>
      </div>
      <div v-if="selectedAddress" class="location-address">
        地址: {{ selectedAddress }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import AMapComponent from './AMapComponent.vue'

interface Props {
  width?: string
  height?: string
  center?: { lng: number; lat: number }
  zoom?: number
  modelValue?: { lng: number; lat: number } | null
  showLocationInfo?: boolean
  showSearch?: boolean
  showMapTypeSwitch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '400px',
  center: () => ({ lng: 116.404, lat: 39.915 }),
  zoom: 11,
  modelValue: null,
  showLocationInfo: true,
  showSearch: true,
  showMapTypeSwitch: true
})

const emit = defineEmits<{
  'update:modelValue': [value: { lng: number; lat: number } | null]
  'location-change': [location: { lng: number; lat: number }, address?: string]
}>()

const mapRef = ref()
const selectedLocation = ref<{ lng: number; lat: number } | null>(props.modelValue)
const selectedAddress = ref<string>('')
const currentMarker = ref<any>(null)

// 处理地图点击
const handleMapClick = async (event: { lng: number; lat: number }) => {
  selectedLocation.value = event
  emit('update:modelValue', event)
  
  // 添加或更新标记
  await updateMarker(event.lng, event.lat)
  
  // 获取地址信息
  await getAddressByLocation(event.lng, event.lat)
  
  emit('location-change', event, selectedAddress.value)
}

// 处理地图就绪
const handleMapReady = (map: any) => {
  // 如果有初始位置，添加标记
  if (selectedLocation.value) {
    updateMarker(selectedLocation.value.lng, selectedLocation.value.lat)
    getAddressByLocation(selectedLocation.value.lng, selectedLocation.value.lat)
  }
}

// 更新标记
const updateMarker = async (lng: number, lat: number) => {
  if (!mapRef.value) return
  
  try {
    // 清除之前的标记
    if (currentMarker.value) {
      mapRef.value.map.remove(currentMarker.value)
    }
    
    // 添加新的可拖拽标记
    currentMarker.value = await addDraggableMarker(lng, lat)
  } catch (error) {
    console.error('更新标记失败:', error)
  }
}

// 添加可拖拽标记
const addDraggableMarker = async (lng: number, lat: number) => {
  if (!mapRef.value) return null
  
  try {
    const { waitForAMap } = await import('@/utils/amap')
    await waitForAMap()
    const AMap = (window as any).AMap
    
    const marker = new AMap.Marker({
      position: [lng, lat],
      title: '选中位置',
      map: mapRef.value.map,
      draggable: true, // 使标记可拖拽
      cursor: 'move'
    })
    
    // 监听标记拖拽事件
    marker.on('dragend', async (e: any) => {
      const position = e.target.getPosition()
      const newLocation = {
        lng: position.lng,
        lat: position.lat
      }
      
      // 更新选中位置
      selectedLocation.value = newLocation
      emit('update:modelValue', newLocation)
      
      // 获取新位置的地址信息
      await getAddressByLocation(position.lng, position.lat)
      
      // 触发位置变化事件
      emit('location-change', newLocation, selectedAddress.value)
      
      console.log('标记拖拽到新位置:', position.lng, position.lat)
    })
    
    // 添加信息窗口
    const infoWindow = new AMap.InfoWindow({
      content: `<div style="padding: 8px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">选中位置</h4>
        <p style="margin: 0; font-size: 12px; color: #666;">可拖拽调整位置</p>
      </div>`,
      offset: new AMap.Pixel(0, -30)
    })
    
    marker.on('click', () => {
      infoWindow.open(mapRef.value.map, [lng, lat])
    })
    
    return marker
  } catch (error) {
    console.error('添加可拖拽标记失败:', error)
    return null
  }
}



// 根据坐标获取地址
const getAddressByLocation = async (lng: number, lat: number) => {
  try {
    const { waitForAMap } = await import('@/utils/amap')
    await waitForAMap()
    const AMap = (window as any).AMap
    
    AMap.plugin('AMap.Geocoder', () => {
      const geocoder = new AMap.Geocoder()
      
      geocoder.getAddress([lng, lat], (status: string, result: any) => {
        if (status === 'complete' && result.regeocode) {
          selectedAddress.value = result.regeocode.formattedAddress || ''
        } else {
          selectedAddress.value = '无法获取地址信息'
        }
      })
    })
  } catch (error) {
    console.error('获取地址失败:', error)
    selectedAddress.value = '获取地址失败'
  }
}

// 监听外部传入的位置变化
watch(() => props.modelValue, (newValue) => {
  if (newValue && typeof newValue.lng === 'number' && typeof newValue.lat === 'number') {
    selectedLocation.value = newValue
    if (mapRef.value) {
      mapRef.value.setCenter(newValue.lng, newValue.lat)
      updateMarker(newValue.lng, newValue.lat)
      getAddressByLocation(newValue.lng, newValue.lat)
    }
  }
}, { deep: true })

// 暴露方法
defineExpose({
  setLocation: (lng: number, lat: number) => {
    selectedLocation.value = { lng, lat }
    emit('update:modelValue', { lng, lat })
    if (mapRef.value) {
      mapRef.value.setCenter(lng, lat)
      updateMarker(lng, lat)
      getAddressByLocation(lng, lat)
    }
  },
  clearLocation: () => {
    selectedLocation.value = null
    selectedAddress.value = ''
    emit('update:modelValue', null)
    if (currentMarker.value && mapRef.value) {
      mapRef.value.map.remove(currentMarker.value)
      currentMarker.value = null
    }
  }
})
</script>

<style scoped lang="scss">
.amap-location-picker {
  position: relative;
  
  .location-info {
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.95);
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    font-size: 12px;
    max-width: 250px;
    z-index: 1000;
    
    .location-coordinates {
      display: flex;
      gap: 12px;
      margin-bottom: 6px;
      font-family: monospace;
      color: #666;
      
      span {
        white-space: nowrap;
      }
    }
    
    .location-address {
      color: #333;
      line-height: 1.4;
      word-break: break-all;
    }
  }
}
</style>