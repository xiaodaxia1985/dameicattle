<template>
  <view class="container">
    <view class="scan-area">
      <view class="scan-tips">
        <text>将牛只耳标对准扫描框进行识别</text>
      </view>
      
      <view class="scan-actions">
        <button class="scan-btn" @tap="startScan">
          <ModernIcon name="camera" size="lg" />
          <text>扫码识别</text>
        </button>
        
        <button class="manual-btn" @tap="showManualInput">
          <ModernIcon name="edit" size="lg" />
          <text>手动输入</text>
        </button>
      </view>
    </view>

    <!-- 最近扫描记录 -->
    <view class="recent-scans card" v-if="recentScans.length > 0">
      <view class="section-title">最近扫描</view>
      <view class="scan-list">
        <view 
          class="scan-item" 
          v-for="scan in recentScans" 
          :key="scan.earTag"
          @tap="viewCattleDetail(scan)"
        >
          <view class="scan-info">
            <text class="ear-tag">{{ scan.earTag }}</text>
            <text class="scan-time">{{ formatTime(scan.scanTime) }}</text>
          </view>
          <text class="arrow">></text>
        </view>
      </view>
    </view>

    <!-- 手动输入弹窗 -->
    <uni-popup ref="manualPopup" type="center">
      <view class="manual-input">
        <view class="input-header">
          <text class="input-title">输入耳标号</text>
        </view>
        <view class="input-body">
          <input 
            class="ear-tag-input" 
            v-model="manualEarTag" 
            placeholder="请输入牛只耳标号"
            maxlength="20"
          />
        </view>
        <view class="input-actions">
          <button class="cancel-btn" @tap="hideManualInput">取消</button>
          <button class="confirm-btn" @tap="searchByEarTag">确定</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import ModernIcon from '@/components/ModernIcon.vue'

const recentScans = ref([])
const manualEarTag = ref('')
const manualPopup = ref(null)

onMounted(() => {
  loadRecentScans()
})

const startScan = () => {
  uni.scanCode({
    success: (res) => {
      console.log('扫码结果:', res)
      const earTag = res.result
      searchCattle(earTag)
    },
    fail: (err) => {
      console.error('扫码失败:', err)
      uni.showToast({
        title: '扫码失败',
        icon: 'none'
      })
    }
  })
}

const showManualInput = () => {
  manualPopup.value.open()
}

const hideManualInput = () => {
  manualEarTag.value = ''
  manualPopup.value.close()
}

const searchByEarTag = () => {
  if (!manualEarTag.value.trim()) {
    uni.showToast({
      title: '请输入耳标号',
      icon: 'none'
    })
    return
  }
  
  searchCattle(manualEarTag.value.trim())
  hideManualInput()
}

const searchCattle = async (earTag) => {
  uni.showLoading({ title: '查询中...' })
  
  try {
    const response = await uni.request({
      url: `/api/v1/cattle/scan/${earTag}`,
      method: 'GET'
    })
    
    if (response.data.success) {
      const cattle = response.data.data
      
      // 保存扫描记录
      saveRecentScan({
        earTag: cattle.ear_tag,
        scanTime: new Date().toISOString(),
        cattle: cattle
      })
      
      // 跳转到牛只详情页
      uni.navigateTo({
        url: `/pages/cattle/detail?id=${cattle.id}`
      })
    } else {
      uni.showToast({
        title: response.data.error?.message || '未找到该牛只',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('查询牛只失败:', error)
    uni.showToast({
      title: '查询失败',
      icon: 'none'
    })
  } finally {
    uni.hideLoading()
  }
}

const loadRecentScans = () => {
  const scans = uni.getStorageSync('recentScans') || []
  recentScans.value = scans.slice(0, 10) // 只显示最近10条
}

const saveRecentScan = (scan) => {
  let scans = uni.getStorageSync('recentScans') || []
  
  // 去重
  scans = scans.filter(item => item.earTag !== scan.earTag)
  
  // 添加到开头
  scans.unshift(scan)
  
  // 只保留最近20条
  scans = scans.slice(0, 20)
  
  uni.setStorageSync('recentScans', scans)
  recentScans.value = scans.slice(0, 10)
}

const viewCattleDetail = (scan) => {
  uni.navigateTo({
    url: `/pages/cattle/detail?id=${scan.cattle.id}`
  })
}

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.scan-area {
  text-align: center;
  padding: 80rpx 40rpx;
}

.scan-tips {
  margin-bottom: 60rpx;
  
  text {
    font-size: 28rpx;
    color: #666;
  }
}

.scan-actions {
  display: flex;
  justify-content: center;
  gap: 40rpx;
}

.scan-btn, .manual-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 200rpx;
  height: 200rpx;
  border-radius: 20rpx;
  border: none;
  font-size: 28rpx;
  
  .scan-icon, .manual-icon {
    font-size: 60rpx;
    margin-bottom: 16rpx;
  }
}

.scan-btn {
  background: linear-gradient(135deg, #1890ff, #40a9ff);
  color: #fff;
}

.manual-btn {
  background: #f5f5f5;
  color: #333;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.scan-list {
  .scan-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .scan-info {
    .ear-tag {
      display: block;
      font-size: 30rpx;
      font-weight: 600;
      margin-bottom: 8rpx;
    }
    
    .scan-time {
      font-size: 26rpx;
      color: #999;
    }
  }
  
  .arrow {
    color: #ccc;
    font-size: 32rpx;
  }
}

.manual-input {
  background: #fff;
  border-radius: 16rpx;
  width: 600rpx;
  
  .input-header {
    padding: 40rpx 40rpx 20rpx;
    text-align: center;
    border-bottom: 1rpx solid #f0f0f0;
    
    .input-title {
      font-size: 32rpx;
      font-weight: 600;
    }
  }
  
  .input-body {
    padding: 40rpx;
    
    .ear-tag-input {
      width: 100%;
      height: 80rpx;
      border: 2rpx solid #e8e8e8;
      border-radius: 8rpx;
      padding: 0 20rpx;
      font-size: 30rpx;
      
      &:focus {
        border-color: #1890ff;
      }
    }
  }
  
  .input-actions {
    display: flex;
    border-top: 1rpx solid #f0f0f0;
    
    .cancel-btn, .confirm-btn {
      flex: 1;
      height: 88rpx;
      border: none;
      font-size: 30rpx;
      
      &:first-child {
        border-right: 1rpx solid #f0f0f0;
      }
    }
    
    .cancel-btn {
      background: #fff;
      color: #666;
    }
    
    .confirm-btn {
      background: #1890ff;
      color: #fff;
    }
  }
}
</style>