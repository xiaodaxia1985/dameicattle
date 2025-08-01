<template>
  <div class="geocode-test">
    <h2>地理编码测试</h2>
    
    <div class="test-section">
      <h3>地址转坐标测试</h3>
      <el-form :model="testForm" inline>
        <el-form-item label="地址">
          <el-input
            v-model="testForm.address"
            placeholder="请输入地址，如：北京市朝阳区"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            @click="testGeocode"
            :loading="geocoding"
          >
            地理编码
          </el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="geocodeResult" class="result">
        <h4>结果：</h4>
        <p><strong>经度：</strong>{{ geocodeResult.lng }}</p>
        <p><strong>纬度：</strong>{{ geocodeResult.lat }}</p>
        <p><strong>地址：</strong>{{ geocodeResult.address }}</p>
        <p><strong>名称：</strong>{{ geocodeResult.name }}</p>
        <p><strong>类型：</strong>{{ geocodeResult.type }}</p>
      </div>
    </div>

    <div class="test-section">
      <h3>地图选择测试</h3>
      <AMapLocationPicker
        v-model="selectedLocation"
        :center="{ lng: 116.404, lat: 39.915 }"
        :show-search="true"
        :show-map-type-switch="true"
        height="400px"
        @location-change="handleLocationChange"
      />
      
      <div v-if="selectedLocation" class="result">
        <h4>选择的位置：</h4>
        <p><strong>经度：</strong>{{ selectedLocation.lng }}</p>
        <p><strong>纬度：</strong>{{ selectedLocation.lat }}</p>
        <p v-if="selectedAddress"><strong>地址：</strong>{{ selectedAddress }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import AMapLocationPicker from '@/components/AMapLocationPicker.vue'
import { searchAccurateLocation } from '@/utils/amap'

const testForm = reactive({
  address: ''
})

const geocoding = ref(false)
const geocodeResult = ref<any>(null)
const selectedLocation = ref<{ lng: number; lat: number } | null>(null)
const selectedAddress = ref('')

const testGeocode = async () => {
  if (!testForm.address.trim()) {
    ElMessage.warning('请输入地址')
    return
  }

  geocoding.value = true
  geocodeResult.value = null

  try {
    const result = await searchAccurateLocation(testForm.address)
    geocodeResult.value = result
    ElMessage.success('地理编码成功')
  } catch (error: any) {
    ElMessage.error(`地理编码失败：${error.message}`)
    console.error('地理编码失败:', error)
  } finally {
    geocoding.value = false
  }
}

const handleLocationChange = (location: { lng: number; lat: number }, address?: string) => {
  selectedLocation.value = location
  selectedAddress.value = address || ''
}
</script>

<style scoped lang="scss">
.geocode-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h2 {
    color: #303133;
    margin-bottom: 20px;
  }

  .test-section {
    margin-bottom: 40px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    h3 {
      color: #606266;
      margin-bottom: 16px;
    }

    .result {
      margin-top: 16px;
      padding: 16px;
      background: #f0f9ff;
      border: 1px solid #b3d8ff;
      border-radius: 4px;

      h4 {
        margin: 0 0 12px 0;
        color: #409eff;
      }

      p {
        margin: 8px 0;
        color: #303133;

        strong {
          color: #606266;
        }
      }
    }
  }
}
</style>