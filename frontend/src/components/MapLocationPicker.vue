<template>
  <div class="map-location-picker">
    <BaiduMap
      :width="width"
      :height="height"
      :center="center"
      :zoom="zoom"
      :enable-click="true"
      @map-click="handleMapClick"
      @map-ready="handleMapReady"
      ref="mapRef"
    />
    
    <div class="location-info" v-if="selectedLocation">
      <div class="info-item">
        <span class="label">经度:</span>
        <span class="value">{{ selectedLocation.lng.toFixed(6) }}</span>
      </div>
      <div class="info-item">
        <span class="label">纬度:</span>
        <span class="value">{{ selectedLocation.lat.toFixed(6) }}</span>
      </div>
      <div class="info-item" v-if="address">
        <span class="label">地址:</span>
        <span class="value">{{ address }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaiduMap from './BaiduMap.vue'

interface Props {
  width?: string
  height?: string
  center?: { lng: number; lat: number }
  zoom?: number
  modelValue?: { lng: number; lat: number } | null
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '400px',
  center: () => ({ lng: 116.404, lat: 39.915 }),
  zoom: 11,
  modelValue: null
})

const emit = defineEmits<{
  'update:modelValue': [value: { lng: number; lat: number } | null]
  'location-change': [location: { lng: number; lat: number }, address?: string]
}>()

const mapRef = ref()
const selectedLocation = ref<{ lng: number; lat: number } | null>(props.modelValue)
const address = ref<string>('')
const currentMarker = ref<any>(null)

// 处理地图点击
const handleMapClick = (event: { lng: number; lat: number }) => {
  selectedLocation.value = event
  emit('update:modelValue', event)
  
  // 清除之前的标记
  if (currentMarker.value && mapRef.value?.map) {
    mapRef.value.map.removeOverlay(currentMarker.value)
  }
  
  // 添加新标记
  if (mapRef.value) {
    currentMarker.value = mapRef.value.addMarker(event.lng, event.lat, '选中位置')
  }
  
  // 获取地址信息
  getAddressByLocation(event.lng, event.lat)
  
  emit('location-change', event, address.value)
}

// 地图准备就绪
const handleMapReady = (map: any) => {
  // 如果有初始位置，添加标记
  if (selectedLocation.value) {
    currentMarker.value = mapRef.value.addMarker(
      selectedLocation.value.lng, 
      selectedLocation.value.lat, 
      '当前位置'
    )
    getAddressByLocation(selectedLocation.value.lng, selectedLocation.value.lat)
  }
}

// 根据坐标获取地址
const getAddressByLocation = async (lng: number, lat: number) => {
  try {
    const { waitForBaiduMap } = await import('@/utils/baiduMap')
    await waitForBaiduMap()
    const BMap = (window as any).BMap
    
    if (!BMap || !BMap.Geocoder) {
      console.error('百度地图Geocoder未加载')
      return
    }
    
    const geocoder = new BMap.Geocoder()
    const point = new BMap.Point(lng, lat)
    
    geocoder.getLocation(point, (result: any) => {
      if (result) {
        address.value = result.address || ''
      }
    })
  } catch (error) {
    console.error('获取地址失败:', error)
  }
}

// 监听外部传入的位置变化
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== selectedLocation.value) {
    selectedLocation.value = newValue
    
    // 更新地图中心和标记
    if (mapRef.value) {
      mapRef.value.setCenter(newValue.lng, newValue.lat)
      
      // 清除之前的标记
      if (currentMarker.value) {
        mapRef.value.map.removeOverlay(currentMarker.value)
      }
      
      // 添加新标记
      currentMarker.value = mapRef.value.addMarker(newValue.lng, newValue.lat, '当前位置')
      getAddressByLocation(newValue.lng, newValue.lat)
    }
  }
}, { deep: true })

// 暴露方法
defineExpose({
  setLocation: (lng: number, lat: number) => {
    handleMapClick({ lng, lat })
  }
})
</script>

<style scoped lang="scss">
.map-location-picker {
  position: relative;
  
  .location-info {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.95);
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-size: 12px;
    min-width: 200px;
    
    .info-item {
      display: flex;
      margin-bottom: 4px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        font-weight: 500;
        color: #606266;
        width: 40px;
        flex-shrink: 0;
      }
      
      .value {
        color: #303133;
        flex: 1;
        word-break: break-all;
      }
    }
  }
}
</style>