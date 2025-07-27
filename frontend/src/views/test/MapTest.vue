<template>
  <div class="map-test-container">
    <el-card header="百度地图测试页面">
      <el-row :gutter="20">
        <el-col :span="12">
          <h3>基础地图组件</h3>
          <BaiduMap
            :center="mapCenter"
            :zoom="11"
            :markers="markers"
            height="300px"
            @map-ready="handleMapReady"
          />
          
          <div class="controls">
            <el-button @click="changeCenter">切换到上海</el-button>
            <el-button @click="addMarker">添加标记</el-button>
          </div>
        </el-col>
        
        <el-col :span="12">
          <h3>位置选择组件</h3>
          <MapLocationPicker
            v-model="selectedLocation"
            :center="mapCenter"
            height="300px"
            @location-change="handleLocationChange"
          />
          
          <div class="location-info" v-if="selectedLocation">
            <p><strong>选中位置:</strong></p>
            <p>经度: {{ selectedLocation.lng.toFixed(6) }}</p>
            <p>纬度: {{ selectedLocation.lat.toFixed(6) }}</p>
            <p v-if="selectedAddress">地址: {{ selectedAddress }}</p>
          </div>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <h3>工具函数测试</h3>
          <el-space>
            <el-button @click="testGeocode">地址解析测试</el-button>
            <el-button @click="testReverseGeocode">逆地理编码测试</el-button>
            <el-button @click="testCurrentPosition">获取当前位置</el-button>
          </el-space>
          
          <div class="test-results" v-if="testResults">
            <h4>测试结果:</h4>
            <pre>{{ JSON.stringify(testResults, null, 2) }}</pre>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaiduMap from '@/components/BaiduMap.vue'
import MapLocationPicker from '@/components/MapLocationPicker.vue'
import { 
  geocodeAddress, 
  reverseGeocode, 
  getCurrentPosition,
  CITY_COORDINATES 
} from '@/utils/baiduMap'
import { ElMessage } from 'element-plus'

// 地图中心
const mapCenter = ref({ lng: 116.404, lat: 39.915 })

// 标记点
const markers = ref([
  {
    lng: 116.404,
    lat: 39.915,
    title: '北京',
    content: '中国首都'
  }
])

// 选中的位置
const selectedLocation = ref<{ lng: number; lat: number } | null>(null)
const selectedAddress = ref('')

// 测试结果
const testResults = ref<any>(null)

// 地图就绪回调
const handleMapReady = (map: any) => {
  console.log('地图加载完成', map)
  ElMessage.success('地图加载完成')
}

// 位置变化回调
const handleLocationChange = (location: { lng: number; lat: number }, address?: string) => {
  console.log('位置变化:', location, '地址:', address)
  selectedAddress.value = address || ''
}

// 切换地图中心
const changeCenter = () => {
  mapCenter.value = CITY_COORDINATES.上海
  ElMessage.info('地图中心已切换到上海')
}

// 添加标记
const addMarker = () => {
  const newMarker = {
    lng: 116.404 + (Math.random() - 0.5) * 0.1,
    lat: 39.915 + (Math.random() - 0.5) * 0.1,
    title: `标记${markers.value.length + 1}`,
    content: '随机生成的标记点'
  }
  markers.value.push(newMarker)
  ElMessage.success('标记已添加')
}

// 测试地址解析
const testGeocode = async () => {
  try {
    const result = await geocodeAddress('北京市朝阳区')
    testResults.value = {
      type: '地址解析',
      input: '北京市朝阳区',
      result
    }
    ElMessage.success('地址解析成功')
  } catch (error) {
    ElMessage.error('地址解析失败: ' + (error as Error).message)
  }
}

// 测试逆地理编码
const testReverseGeocode = async () => {
  try {
    const result = await reverseGeocode(116.404, 39.915)
    testResults.value = {
      type: '逆地理编码',
      input: { lng: 116.404, lat: 39.915 },
      result
    }
    ElMessage.success('逆地理编码成功')
  } catch (error) {
    ElMessage.error('逆地理编码失败: ' + (error as Error).message)
  }
}

// 测试获取当前位置
const testCurrentPosition = async () => {
  try {
    const result = await getCurrentPosition()
    testResults.value = {
      type: '获取当前位置',
      result
    }
    ElMessage.success('获取当前位置成功')
  } catch (error) {
    ElMessage.error('获取当前位置失败: ' + (error as Error).message)
  }
}
</script>

<style scoped lang="scss">
.map-test-container {
  padding: 20px;
  
  .controls {
    margin-top: 16px;
    
    .el-button {
      margin-right: 8px;
    }
  }
  
  .location-info {
    margin-top: 16px;
    padding: 12px;
    background: var(--el-bg-color-page);
    border-radius: 4px;
    
    p {
      margin: 4px 0;
      font-size: 14px;
      
      strong {
        color: var(--el-text-color-primary);
      }
    }
  }
  
  .test-results {
    margin-top: 16px;
    
    h4 {
      margin-bottom: 8px;
      color: var(--el-text-color-primary);
    }
    
    pre {
      background: var(--el-bg-color-page);
      padding: 12px;
      border-radius: 4px;
      font-size: 12px;
      overflow-x: auto;
    }
  }
}
</style>