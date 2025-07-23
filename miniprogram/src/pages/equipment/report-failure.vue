<template>
  <view class="report-failure">
    <form @submit="handleSubmit">
      <!-- 设备信息 -->
      <view class="form-section">
        <view class="section-title">设备信息</view>
        
        <view class="form-item" v-if="!equipmentId">
          <view class="label required">选择设备</view>
          <picker
            mode="selector"
            :range="equipmentOptions"
            range-key="name"
            @change="handleEquipmentChange"
          >
            <view class="picker-input">
              {{ selectedEquipment ? selectedEquipment.name : '请选择设备' }}
              <uni-icons type="arrowdown" size="14" color="#999" />
            </view>
          </picker>
        </view>
        
        <view class="form-item" v-else>
          <view class="label">设备名称</view>
          <view class="value">{{ equipmentName }}</view>
        </view>
      </view>

      <!-- 故障信息 -->
      <view class="form-section">
        <view class="section-title">故障信息</view>
        
        <view class="form-item">
          <view class="label">故障类型</view>
          <picker
            mode="selector"
            :range="failureTypes"
            @change="handleFailureTypeChange"
          >
            <view class="picker-input">
              {{ form.failure_type || '请选择故障类型' }}
              <uni-icons type="arrowdown" size="14" color="#999" />
            </view>
          </picker>
        </view>
        
        <view class="form-item">
          <view class="label">严重程度</view>
          <uni-segmented-control
            :current="severityIndex"
            :values="severityOptions"
            @clickItem="handleSeverityChange"
            style-type="button"
          />
        </view>
        
        <view class="form-item">
          <view class="label required">故障描述</view>
          <textarea
            v-model="form.description"
            placeholder="请详细描述故障现象、发生时间等"
            maxlength="500"
            show-confirm-bar
            class="textarea-input"
          />
          <view class="char-count">{{ form.description.length }}/500</view>
        </view>
        
        <view class="form-item">
          <view class="label">影响描述</view>
          <textarea
            v-model="form.impact_description"
            placeholder="请描述故障对生产的影响"
            maxlength="300"
            show-confirm-bar
            class="textarea-input"
          />
          <view class="char-count">{{ form.impact_description.length }}/300</view>
        </view>
      </view>

      <!-- 现场照片 -->
      <view class="form-section">
        <view class="section-title">现场照片</view>
        
        <view class="photo-upload">
          <view class="photo-grid">
            <view
              v-for="(photo, index) in photos"
              :key="index"
              class="photo-item"
            >
              <image :src="photo" mode="aspectFill" @click="previewPhoto(index)" />
              <view class="photo-delete" @click="deletePhoto(index)">
                <uni-icons type="close" size="12" color="#fff" />
              </view>
            </view>
            
            <view
              v-if="photos.length < 6"
              class="photo-add"
              @click="addPhoto"
            >
              <uni-icons type="camera" size="24" color="#999" />
              <text>添加照片</text>
            </view>
          </view>
          <view class="photo-tip">最多可上传6张照片</view>
        </view>
      </view>

      <!-- 位置信息 -->
      <view class="form-section">
        <view class="section-title">位置信息</view>
        
        <view class="location-info">
          <view class="location-item" @click="getLocation">
            <uni-icons type="location" size="16" color="#007AFF" />
            <text class="location-text">
              {{ location ? `${location.address}` : '点击获取当前位置' }}
            </text>
            <uni-icons type="arrowright" size="14" color="#999" />
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button
          class="submit-btn"
          type="primary"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ submitting ? '提交中...' : '提交故障报告' }}
        </button>
      </view>
    </form>
  </view>
</template>

<script>
import { equipmentApi } from '@/utils/api'
import { showToast, showModal } from '@/utils/common'
import { getLocation, uploadImage } from '@/utils/common'

export default {
  data() {
    return {
      equipmentId: '',
      equipmentName: '',
      equipmentOptions: [],
      selectedEquipment: null,
      form: {
        equipment_id: '',
        failure_type: '',
        severity: 'medium',
        description: '',
        impact_description: '',
      },
      failureTypes: [
        '机械故障',
        '电气故障',
        '软件故障',
        '传感器故障',
        '通信故障',
        '其他故障',
      ],
      severityOptions: ['轻微', '中等', '严重', '紧急'],
      severityValues: ['low', 'medium', 'high', 'critical'],
      severityIndex: 1,
      photos: [],
      location: null,
      submitting: false,
    }
  },

  computed: {
    canSubmit() {
      return (
        (this.equipmentId || this.selectedEquipment) &&
        this.form.description.trim() &&
        !this.submitting
      )
    },
  },

  onLoad(options) {
    this.equipmentId = options.equipmentId || ''
    this.equipmentName = options.equipmentName || ''
    
    if (this.equipmentId) {
      this.form.equipment_id = this.equipmentId
    } else {
      this.loadEquipmentOptions()
    }
    
    // 自动获取位置
    this.getLocation()
  },

  methods: {
    // 加载设备选项
    async loadEquipmentOptions() {
      try {
        const response = await equipmentApi.getEquipment({ limit: 100 })
        this.equipmentOptions = response.data.data || []
      } catch (error) {
        console.error('加载设备列表失败:', error)
      }
    },

    // 处理设备选择
    handleEquipmentChange(e) {
      const index = e.detail.value
      this.selectedEquipment = this.equipmentOptions[index]
      this.form.equipment_id = this.selectedEquipment.id
    },

    // 处理故障类型选择
    handleFailureTypeChange(e) {
      const index = e.detail.value
      this.form.failure_type = this.failureTypes[index]
    },

    // 处理严重程度选择
    handleSeverityChange(e) {
      this.severityIndex = e.currentIndex
      this.form.severity = this.severityValues[e.currentIndex]
    },

    // 添加照片
    addPhoto() {
      uni.chooseImage({
        count: 6 - this.photos.length,
        sizeType: ['compressed'],
        sourceType: ['camera', 'album'],
        success: (res) => {
          this.photos.push(...res.tempFilePaths)
        },
        fail: (error) => {
          showToast('选择照片失败')
          console.error('选择照片失败:', error)
        },
      })
    },

    // 预览照片
    previewPhoto(index) {
      uni.previewImage({
        urls: this.photos,
        current: index,
      })
    },

    // 删除照片
    deletePhoto(index) {
      this.photos.splice(index, 1)
    },

    // 获取位置
    async getLocation() {
      try {
        uni.showLoading({ title: '获取位置中...' })
        
        const location = await new Promise((resolve, reject) => {
          uni.getLocation({
            type: 'gcj02',
            success: resolve,
            fail: reject,
          })
        })

        // 逆地理编码获取地址
        const address = await this.reverseGeocode(location.latitude, location.longitude)
        
        this.location = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address || `${location.latitude}, ${location.longitude}`,
        }
      } catch (error) {
        showToast('获取位置失败')
        console.error('获取位置失败:', error)
      } finally {
        uni.hideLoading()
      }
    },

    // 逆地理编码
    async reverseGeocode(latitude, longitude) {
      // 这里应该调用地图服务API进行逆地理编码
      // 暂时返回坐标
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    },

    // 上传照片
    async uploadPhotos() {
      if (this.photos.length === 0) return []

      const uploadPromises = this.photos.map(async (photo) => {
        try {
          const result = await uploadImage(photo, 'equipment_failure')
          return result.url
        } catch (error) {
          console.error('上传照片失败:', error)
          return null
        }
      })

      const results = await Promise.all(uploadPromises)
      return results.filter(url => url !== null)
    },

    // 提交故障报告
    async handleSubmit() {
      if (!this.canSubmit) return

      try {
        this.submitting = true
        uni.showLoading({ title: '提交中...' })

        // 上传照片
        const photoUrls = await this.uploadPhotos()

        // 准备提交数据
        const submitData = {
          ...this.form,
          photos: photoUrls.length > 0 ? { urls: photoUrls } : null,
          location: this.location,
        }

        // 提交故障报告
        await equipmentApi.reportFailure(submitData)

        showToast('故障报告提交成功')
        
        // 返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (error) {
        showToast('提交失败，请重试')
        console.error('提交故障报告失败:', error)
      } finally {
        this.submitting = false
        uni.hideLoading()
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.report-failure {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

.form-section {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  
  &.required::after {
    content: '*';
    color: #ff4d4f;
    margin-left: 4rpx;
  }
}

.value {
  font-size: 28rpx;
  color: #666;
  padding: 20rpx 0;
}

.picker-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #f8f9fa;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
}

.textarea-input {
  width: 100%;
  min-height: 200rpx;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 8rpx;
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.photo-upload {
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;
    margin-bottom: 20rpx;
  }
  
  .photo-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 8rpx;
    overflow: hidden;
    
    image {
      width: 100%;
      height: 100%;
    }
    
    .photo-delete {
      position: absolute;
      top: 10rpx;
      right: 10rpx;
      width: 40rpx;
      height: 40rpx;
      background-color: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .photo-add {
    aspect-ratio: 1;
    background-color: #f8f9fa;
    border: 2rpx dashed #ddd;
    border-radius: 8rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    
    text {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .photo-tip {
    font-size: 24rpx;
    color: #999;
    text-align: center;
  }
}

.location-info {
  .location-item {
    display: flex;
    align-items: center;
    gap: 15rpx;
    padding: 20rpx;
    background-color: #f8f9fa;
    border-radius: 8rpx;
    
    .location-text {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }
  }
}

.submit-section {
  padding: 40rpx 0;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}
</style>