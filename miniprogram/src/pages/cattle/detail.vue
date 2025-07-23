<template>
  <view class="container">
    <view v-if="cattle" class="cattle-detail">
      <!-- 牛只基本信息卡片 -->
      <view class="info-card">
        <view class="card-header">
          <view class="ear-tag-section">
            <text class="ear-tag">{{ cattle.ear_tag }}</text>
            <view class="health-status" :class="cattle.health_status">
              <text>{{ getHealthStatusText(cattle.health_status) }}</text>
            </view>
          </view>
          <view class="actions">
            <ModernIcon name="camera" @click="takeCattlePhoto" />
            <ModernIcon name="more" @click="showMoreActions" />
          </view>
        </view>

        <!-- 牛只照片 -->
        <view class="photo-section">
          <swiper 
            v-if="cattle.photos && cattle.photos.length > 0"
            class="photo-swiper"
            indicator-dots
            autoplay
            circular
          >
            <swiper-item v-for="(photo, index) in cattle.photos" :key="index">
              <image 
                :src="photo" 
                mode="aspectFill" 
                class="cattle-photo"
                @tap="previewPhoto(index)"
              />
            </swiper-item>
          </swiper>
          <view v-else class="no-photo" @tap="takeCattlePhoto">
            <ModernIcon name="camera" size="xl" />
            <text class="photo-text">点击添加照片</text>
          </view>
        </view>

        <!-- 基本信息 -->
        <view class="basic-info">
          <view class="info-row">
            <text class="label">品种</text>
            <text class="value">{{ cattle.breed }}</text>
          </view>
          <view class="info-row">
            <text class="label">性别</text>
            <text class="value">{{ cattle.gender === 'male' ? '公牛' : '母牛' }}</text>
          </view>
          <view class="info-row" v-if="cattle.birth_date">
            <text class="label">出生日期</text>
            <text class="value">{{ formatDate(cattle.birth_date) }}</text>
          </view>
          <view class="info-row" v-if="cattle.age_months">
            <text class="label">年龄</text>
            <text class="value">{{ cattle.age_months }}个月</text>
          </view>
          <view class="info-row" v-if="cattle.weight">
            <text class="label">体重</text>
            <text class="value">{{ cattle.weight }}kg</text>
          </view>
          <view class="info-row" v-if="cattle.base">
            <text class="label">所属基地</text>
            <text class="value">{{ cattle.base.name }}</text>
          </view>
          <view class="info-row" v-if="cattle.barn">
            <text class="label">所属牛棚</text>
            <text class="value">{{ cattle.barn.name }}</text>
          </view>
        </view>
      </view>

      <!-- 快捷操作 -->
      <view class="quick-actions card">
        <view class="section-title">快捷操作</view>
        <view class="action-grid">
          <view class="action-item" @tap="recordHealth">
            <view class="action-icon">
              <ModernIcon name="medical" />
            </view>
            <text class="action-text">健康记录</text>
          </view>
          <view class="action-item" @tap="recordFeeding">
            <view class="action-icon">
              <ModernIcon name="feed" />
            </view>
            <text class="action-text">饲喂记录</text>
          </view>
          <view class="action-item" @tap="recordWeight">
            <view class="action-icon">
              <ModernIcon name="chart" />
            </view>
            <text class="action-text">称重记录</text>
          </view>
          <view class="action-item" @tap="viewEvents">
            <view class="action-icon">
              <ModernIcon name="document" />
            </view>
            <text class="action-text">生命周期</text>
          </view>
        </view>
      </view>

      <!-- 最近事件 -->
      <view class="recent-events card">
        <view class="section-title">
          <text>最近事件</text>
          <text class="view-all" @tap="viewAllEvents">查看全部</text>
        </view>
        <view class="event-list" v-if="recentEvents.length > 0">
          <view class="event-item" v-for="event in recentEvents" :key="event.id">
            <view class="event-icon" :class="event.event_type">
              <ModernIcon :name="getEventIcon(event.event_type)" />
            </view>
            <view class="event-content">
              <text class="event-title">{{ getEventTypeText(event.event_type) }}</text>
              <text class="event-desc">{{ event.description || '-' }}</text>
              <text class="event-time">{{ formatTime(event.event_date) }}</text>
            </view>
          </view>
        </view>
        <view v-else class="no-events">
          <text>暂无事件记录</text>
        </view>
      </view>

      <!-- 家族信息 -->
      <view class="family-info card" v-if="cattle.father || cattle.mother">
        <view class="section-title">家族信息</view>
        <view class="family-members">
          <view class="family-member" v-if="cattle.father" @tap="viewParent(cattle.father)">
            <text class="member-label">父牛</text>
            <text class="member-info">{{ cattle.father.ear_tag }} - {{ cattle.father.breed }}</text>
            <text class="member-arrow">></text>
          </view>
          <view class="family-member" v-if="cattle.mother" @tap="viewParent(cattle.mother)">
            <text class="member-label">母牛</text>
            <text class="member-info">{{ cattle.mother.ear_tag }} - {{ cattle.mother.breed }}</text>
            <text class="member-arrow">></text>
          </view>
        </view>
      </view>

      <!-- 备注信息 -->
      <view class="notes-section card" v-if="cattle.notes">
        <view class="section-title">备注信息</view>
        <text class="notes-text">{{ cattle.notes }}</text>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-else-if="loading" class="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 错误状态 -->
    <view v-else class="error">
      <view class="error-icon">
        <ModernIcon name="error" size="xl" />
      </view>
      <text class="error-text">加载失败</text>
      <button class="retry-btn" @tap="loadCattleDetail">重试</button>
    </view>

    <!-- 更多操作弹窗 -->
    <uni-popup ref="morePopup" type="bottom">
      <view class="more-actions">
        <view class="more-header">
          <text class="more-title">更多操作</text>
        </view>
        <view class="more-list">
          <view class="more-item" @tap="editCattle">
            <view class="more-icon">
              <ModernIcon name="edit" />
            </view>
            <text class="more-text">编辑信息</text>
          </view>
          <view class="more-item" @tap="transferCattle">
            <view class="more-icon">
              <ModernIcon name="refresh" />
            </view>
            <text class="more-text">转群</text>
          </view>
          <view class="more-item" @tap="shareCattle">
            <view class="more-icon">
              <ModernIcon name="upload" />
            </view>
            <text class="more-text">分享</text>
          </view>
        </view>
        <view class="more-cancel" @tap="hideMoreActions">
          <text>取消</text>
        </view>
      </view>
    </uni-popup>

    <!-- 称重记录弹窗 -->
    <uni-popup ref="weightPopup" type="center">
      <view class="weight-record">
        <view class="weight-header">
          <text class="weight-title">称重记录</text>
        </view>
        <view class="weight-content">
          <view class="weight-input">
            <text class="input-label">体重(kg)</text>
            <input 
              v-model="weightValue" 
              type="digit" 
              placeholder="请输入体重"
              class="weight-input-field"
            />
          </view>
          <view class="weight-note">
            <text class="input-label">备注</text>
            <textarea 
              v-model="weightNote" 
              placeholder="请输入备注信息"
              class="weight-textarea"
            />
          </view>
        </view>
        <view class="weight-actions">
          <button class="cancel-btn" @tap="hideWeightPopup">取消</button>
          <button class="confirm-btn" @tap="submitWeight">确定</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCattleStore } from '@/stores/cattle'
import dayjs from 'dayjs'
import ModernIcon from '@/components/ModernIcon.vue'

const cattleStore = useCattleStore()

const cattle = ref(null)
const recentEvents = ref([])
const loading = ref(false)
const cattleId = ref(null)
const weightValue = ref('')
const weightNote = ref('')

const morePopup = ref(null)
const weightPopup = ref(null)

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  cattleId.value = currentPage.options.id
  
  if (cattleId.value) {
    loadCattleDetail()
    loadRecentEvents()
  }
})

const loadCattleDetail = async () => {
  if (!cattleId.value) return
  
  loading.value = true
  
  try {
    const response = await cattleStore.fetchCattleById(parseInt(cattleId.value))
    cattle.value = response
  } catch (error) {
    console.error('加载牛只详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const loadRecentEvents = async () => {
  if (!cattleId.value) return
  
  try {
    const response = await uni.request({
      url: `/api/v1/cattle/${cattleId.value}/events`,
      method: 'GET',
      data: { limit: 5 }
    })
    
    if (response.data.success) {
      recentEvents.value = response.data.data.data
    }
  } catch (error) {
    console.error('加载事件失败:', error)
  }
}

const takeCattlePhoto = () => {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      // 这里可以实现照片上传功能
      console.log('拍照成功:', res)
      uni.showToast({
        title: '照片上传功能开发中',
        icon: 'none'
      })
    },
    fail: (err) => {
      console.error('拍照失败:', err)
    }
  })
}

const previewPhoto = (index) => {
  if (cattle.value.photos && cattle.value.photos.length > 0) {
    uni.previewImage({
      urls: cattle.value.photos,
      current: index
    })
  }
}

const showMoreActions = () => {
  morePopup.value.open()
}

const hideMoreActions = () => {
  morePopup.value.close()
}

const recordHealth = () => {
  uni.navigateTo({
    url: `/pages/health/record?cattleId=${cattleId.value}`
  })
}

const recordFeeding = () => {
  uni.navigateTo({
    url: `/pages/feeding/record?cattleId=${cattleId.value}`
  })
}

const recordWeight = () => {
  weightValue.value = cattle.value.weight || ''
  weightNote.value = ''
  weightPopup.value.open()
}

const hideWeightPopup = () => {
  weightPopup.value.close()
}

const submitWeight = async () => {
  if (!weightValue.value) {
    uni.showToast({
      title: '请输入体重',
      icon: 'none'
    })
    return
  }
  
  try {
    // 更新牛只体重
    await cattleStore.updateCattle(parseInt(cattleId.value), {
      weight: parseFloat(weightValue.value)
    })
    
    // 添加称重事件
    await uni.request({
      url: `/api/v1/cattle/${cattleId.value}/events`,
      method: 'POST',
      data: {
        event_type: 'weight_record',
        event_date: new Date().toISOString().split('T')[0],
        description: `体重记录: ${weightValue.value}kg`,
        data: {
          weight: parseFloat(weightValue.value),
          note: weightNote.value
        }
      }
    })
    
    hideWeightPopup()
    loadCattleDetail()
    loadRecentEvents()
    
    uni.showToast({
      title: '记录成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('记录体重失败:', error)
    uni.showToast({
      title: '记录失败',
      icon: 'none'
    })
  }
}

const viewEvents = () => {
  uni.navigateTo({
    url: `/pages/cattle/events?cattleId=${cattleId.value}`
  })
}

const viewAllEvents = () => {
  viewEvents()
}

const viewParent = (parent) => {
  uni.navigateTo({
    url: `/pages/cattle/detail?id=${parent.id}`
  })
}

const editCattle = () => {
  hideMoreActions()
  uni.showToast({
    title: '编辑功能开发中',
    icon: 'none'
  })
}

const transferCattle = () => {
  hideMoreActions()
  uni.showToast({
    title: '转群功能开发中',
    icon: 'none'
  })
}

const shareCattle = () => {
  hideMoreActions()
  uni.showToast({
    title: '分享功能开发中',
    icon: 'none'
  })
}

const getHealthStatusText = (status) => {
  switch (status) {
    case 'healthy': return '健康'
    case 'sick': return '患病'
    case 'treatment': return '治疗中'
    default: return '未知'
  }
}

const getEventTypeText = (type) => {
  const typeMap = {
    birth: '出生',
    purchase: '采购',
    transfer_in: '转入',
    transfer_out: '转出',
    weight_record: '称重',
    health_check: '健康检查',
    vaccination: '疫苗接种',
    treatment: '治疗',
    breeding: '配种',
    pregnancy_check: '妊娠检查',
    calving: '产犊',
    weaning: '断奶',
    sale: '销售',
    death: '死亡',
    other: '其他'
  }
  return typeMap[type] || type
}

const getEventIcon = (type) => {
  const iconMap = {
    birth: 'star',
    purchase: 'money',
    transfer_in: 'download',
    transfer_out: 'upload',
    weight_record: 'chart',
    health_check: 'search',
    vaccination: 'medical',
    treatment: 'medical',
    breeding: 'heart',
    pregnancy_check: 'user',
    calving: 'star',
    weaning: 'feed',
    sale: 'money',
    death: 'error',
    other: 'document'
  }
  return iconMap[type] || 'document'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.cattle-detail {
  .info-card {
    background: #fff;
    margin-bottom: 20rpx;
    
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32rpx;
      border-bottom: 1rpx solid #f0f0f0;
      
      .ear-tag-section {
        display: flex;
        align-items: center;
        gap: 20rpx;
        
        .ear-tag {
          font-size: 40rpx;
          font-weight: 600;
          color: #1890ff;
        }
        
        .health-status {
          padding: 8rpx 20rpx;
          border-radius: 20rpx;
          font-size: 24rpx;
          
          &.healthy {
            background: #f6ffed;
            color: #52c41a;
          }
          
          &.sick {
            background: #fff2f0;
            color: #ff4d4f;
          }
          
          &.treatment {
            background: #fffbe6;
            color: #faad14;
          }
        }
      }
      
      .actions {
        display: flex;
        gap: 20rpx;
        
        .action-btn {
          width: 60rpx;
          height: 60rpx;
          background: #f5f5f5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28rpx;
        }
      }
    }
    
    .photo-section {
      .photo-swiper {
        height: 400rpx;
        
        .cattle-photo {
          width: 100%;
          height: 100%;
        }
      }
      
      .no-photo {
        height: 400rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        
        .photo-icon {
          font-size: 80rpx;
          color: #ccc;
          margin-bottom: 16rpx;
        }
        
        .photo-text {
          font-size: 28rpx;
          color: #999;
        }
      }
    }
    
    .basic-info {
      padding: 32rpx;
      
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16rpx 0;
        border-bottom: 1rpx solid #f8f9fa;
        
        &:last-child {
          border-bottom: none;
        }
        
        .label {
          font-size: 28rpx;
          color: #666;
        }
        
        .value {
          font-size: 28rpx;
          color: #333;
          font-weight: 500;
        }
      }
    }
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .view-all {
    font-size: 26rpx;
    color: #1890ff;
    font-weight: normal;
  }
}

.quick-actions {
  .action-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32rpx;
    
    .action-item {
      text-align: center;
      
      .action-icon {
        width: 80rpx;
        height: 80rpx;
        background: #f8f9fa;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40rpx;
        margin: 0 auto 12rpx;
      }
      
      .action-text {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
}

.recent-events {
  .event-list {
    .event-item {
      display: flex;
      align-items: flex-start;
      padding: 24rpx 0;
      border-bottom: 1rpx solid #f8f9fa;
      
      &:last-child {
        border-bottom: none;
      }
      
      .event-icon {
        width: 60rpx;
        height: 60rpx;
        background: #f8f9fa;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28rpx;
        margin-right: 20rpx;
        flex-shrink: 0;
      }
      
      .event-content {
        flex: 1;
        
        .event-title {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .event-desc {
          display: block;
          font-size: 26rpx;
          color: #666;
          margin-bottom: 8rpx;
        }
        
        .event-time {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }
  
  .no-events {
    text-align: center;
    padding: 60rpx 0;
    color: #999;
    font-size: 28rpx;
  }
}

.family-info {
  .family-members {
    .family-member {
      display: flex;
      align-items: center;
      padding: 24rpx 0;
      border-bottom: 1rpx solid #f8f9fa;
      
      &:last-child {
        border-bottom: none;
      }
      
      .member-label {
        width: 80rpx;
        font-size: 28rpx;
        color: #666;
      }
      
      .member-info {
        flex: 1;
        font-size: 28rpx;
        color: #333;
      }
      
      .member-arrow {
        color: #ccc;
        font-size: 32rpx;
      }
    }
  }
}

.notes-section {
  .notes-text {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
  }
}

.loading {
  text-align: center;
  padding: 120rpx 40rpx;
  
  .loading-text {
    font-size: 28rpx;
    color: #999;
  }
}

.error {
  text-align: center;
  padding: 120rpx 40rpx;
  
  .error-icon {
    display: block;
    font-size: 80rpx;
    margin-bottom: 24rpx;
  }
  
  .error-text {
    display: block;
    font-size: 28rpx;
    color: #666;
    margin-bottom: 32rpx;
  }
  
  .retry-btn {
    background: #1890ff;
    color: #fff;
    border: none;
    border-radius: 8rpx;
    padding: 16rpx 32rpx;
    font-size: 28rpx;
  }
}

.more-actions {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  
  .more-header {
    padding: 32rpx;
    text-align: center;
    border-bottom: 1rpx solid #f0f0f0;
    
    .more-title {
      font-size: 32rpx;
      font-weight: 600;
    }
  }
  
  .more-list {
    .more-item {
      display: flex;
      align-items: center;
      padding: 32rpx 40rpx;
      border-bottom: 1rpx solid #f8f9fa;
      
      .more-icon {
        font-size: 32rpx;
        margin-right: 20rpx;
      }
      
      .more-text {
        font-size: 30rpx;
        color: #333;
      }
    }
  }
  
  .more-cancel {
    padding: 32rpx;
    text-align: center;
    border-top: 1rpx solid #f0f0f0;
    color: #666;
    font-size: 30rpx;
  }
}

.weight-record {
  background: #fff;
  border-radius: 16rpx;
  width: 600rpx;
  
  .weight-header {
    padding: 32rpx;
    text-align: center;
    border-bottom: 1rpx solid #f0f0f0;
    
    .weight-title {
      font-size: 32rpx;
      font-weight: 600;
    }
  }
  
  .weight-content {
    padding: 32rpx;
    
    .weight-input, .weight-note {
      margin-bottom: 24rpx;
      
      .input-label {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 12rpx;
      }
      
      .weight-input-field {
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
      
      .weight-textarea {
        width: 100%;
        min-height: 120rpx;
        border: 2rpx solid #e8e8e8;
        border-radius: 8rpx;
        padding: 20rpx;
        font-size: 28rpx;
        
        &:focus {
          border-color: #1890ff;
        }
      }
    }
  }
  
  .weight-actions {
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