<template>
  <div class="map-test-container">
    <el-card header="高德地图测试页面">
      <el-row :gutter="20">
        <el-col :span="12">
          <h3>完整功能地图（搜索+卫星地图）</h3>
          <AMapComponent
            :center="mapCenter"
            :zoom="11"
            :markers="markers"
            :show-search="true"
            :show-map-type-switch="true"
            height="300px"
            @map-ready="handleMapReady"
          />
          
          <div class="controls">
            <el-button @click="changeCenter">切换到上海</el-button>
            <el-button @click="addMarker">添加标记</el-button>
          </div>
        </el-col>
        
        <el-col :span="12">
          <h3>位置选择组件（可拖拽标记）</h3>
          <MapLocationPicker
            v-model="selectedLocation"
            :center="mapCenter"
            :show-search="true"
            :show-map-type-switch="true"
            height="300px"
            @location-change="handleLocationChange"
          />
          
          <div class="location-info" v-if="selectedLocation">
            <p><strong>选中位置:</strong></p>
            <p>经度: {{ selectedLocation.lng.toFixed(6) }}</p>
            <p>纬度: {{ selectedLocation.lat.toFixed(6) }}</p>
            <p v-if="selectedAddress">地址: {{ selectedAddress }}</p>
            <p style="color: #666; font-size: 12px; margin-top: 8px;">
              💡 提示：可以搜索地点或拖拽标记调整位置
            </p>
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
            <el-button @click="testSearch">搜索功能测试</el-button>
            <el-button @click="testSearchSuggestions">搜索建议测试</el-button>
            <el-button @click="testDirectSearch">直接搜索测试</el-button>
            <el-button @click="testSearchAccuracy">搜索准确性测试</el-button>
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
import AMapComponent from '@/components/AMapComponent.vue'
import MapLocationPicker from '@/components/MapLocationPicker.vue'
import { 
  geocodeAddress, 
  reverseGeocode, 
  getCurrentPosition,
  searchPOI,
  getSearchSuggestions,
  CITY_COORDINATES 
} from '@/utils/amap'
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

// 测试搜索功能
const testSearch = async () => {
  try {
    const result = await searchPOI('北京大学', '北京')
    testResults.value = {
      type: 'POI搜索',
      input: { keyword: '北京大学', city: '北京' },
      result: result.slice(0, 3) // 只显示前3个结果
    }
    ElMessage.success('搜索功能测试成功')
  } catch (error) {
    ElMessage.error('搜索功能测试失败: ' + (error as Error).message)
  }
}

// 测试搜索建议
const testSearchSuggestions = async () => {
  try {
    const result = await getSearchSuggestions('北京', '北京')
    testResults.value = {
      type: '搜索建议',
      input: { keyword: '北京', city: '北京' },
      result: result.slice(0, 5) // 只显示前5个建议
    }
    ElMessage.success('搜索建议测试成功')
  } catch (error) {
    ElMessage.error('搜索建议测试失败: ' + (error as Error).message)
  }
}

// 测试直接搜索
const testDirectSearch = async () => {
  try {
    const testAddresses = [
      '天安门广场',
      '北京大学',
      '上海外滩',
      '广州塔',
      '深圳市民中心',
      '西湖',
      '故宫博物院',
      '东方明珠塔'
    ]
    
    const randomAddress = testAddresses[Math.floor(Math.random() * testAddresses.length)]
    
    // 使用新的精确搜索功能
    const { searchAccurateLocation } = await import('@/utils/amap')
    const result = await searchAccurateLocation(randomAddress)
    
    testResults.value = {
      type: '精确搜索测试',
      input: randomAddress,
      result: {
        坐标: `${result.lng.toFixed(6)}, ${result.lat.toFixed(6)}`,
        地址: result.address,
        名称: result.name,
        搜索类型: result.type === 'poi' ? 'POI精确匹配' : '地理编码',
        原始数据: result
      }
    }
    
    // 如果搜索成功，更新地图中心
    if (result && result.lng && result.lat) {
      mapCenter.value = { lng: result.lng, lat: result.lat }
      ElMessage.success(`精确搜索"${randomAddress}"成功，地图已定位到准确位置`)
    } else {
      ElMessage.warning(`搜索"${randomAddress}"无结果`)
    }
  } catch (error) {
    ElMessage.error('精确搜索测试失败: ' + (error as Error).message)
    testResults.value = {
      type: '精确搜索测试',
      input: '测试失败',
      result: { error: (error as Error).message }
    }
  }
}

// 测试多个地址的搜索准确性
const testSearchAccuracy = async () => {
  try {
    const testCases = [
      { name: '北京天安门', expectedArea: '北京市东城区' },
      { name: '上海外滩', expectedArea: '上海市黄浦区' },
      { name: '广州塔', expectedArea: '广州市海珠区' },
      { name: '深圳平安金融中心', expectedArea: '深圳市福田区' }
    ]
    
    const results = []
    const { searchAccurateLocation } = await import('@/utils/amap')
    
    for (const testCase of testCases) {
      try {
        const result = await searchAccurateLocation(testCase.name)
        results.push({
          搜索词: testCase.name,
          找到位置: result.name,
          坐标: `${result.lng.toFixed(6)}, ${result.lat.toFixed(6)}`,
          地址: result.address,
          搜索类型: result.type === 'poi' ? 'POI精确匹配' : '地理编码',
          状态: '成功'
        })
      } catch (error) {
        results.push({
          搜索词: testCase.name,
          状态: '失败',
          错误: (error as Error).message
        })
      }
    }
    
    testResults.value = {
      type: '搜索准确性测试',
      input: '多个知名地标',
      result: results
    }
    
    const successCount = results.filter(r => r.状态 === '成功').length
    ElMessage.success(`搜索准确性测试完成：${successCount}/${testCases.length} 个地址搜索成功`)
    
  } catch (error) {
    ElMessage.error('搜索准确性测试失败: ' + (error as Error).message)
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