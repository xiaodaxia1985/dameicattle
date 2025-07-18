<template>
  <view class="profile-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-avatar">
        <image 
          :src="userInfo?.avatar || '/static/default-avatar.png'" 
          mode="aspectFill"
          class="avatar-img"
        />
      </view>
      <view class="user-info">
        <text class="user-name">{{ userInfo?.real_name || '未设置' }}</text>
        <text class="user-role">{{ userRoleText }}</text>
        <text class="user-base">{{ userBaseText }}</text>
      </view>
      <view class="user-status">
        <view class="status-dot" :class="{ online: isOnline }"></view>
        <text class="status-text">{{ isOnline ? '在线' : '离线' }}</text>
      </view>
    </view>

    <!-- 绑定状态 -->
    <view v-if="needsBinding" class="binding-notice">
      <view class="notice-icon">⚠️</view>
      <view class="notice-content">
        <text class="notice-title">需要绑定工作基地</text>
        <text class="notice-desc">请绑定您的工作基地以使用完整功能</text>
      </view>
      <button class="bind-btn" @click="showBindingModal">立即绑定</button>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="section-title">账户管理</view>
      <view class="menu-list">
        <view class="menu-item" @click="editProfile">
          <view class="menu-icon">👤</view>
          <text class="menu-text">编辑资料</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="changeBase" v-if="hasPermission('user:change_base')">
          <view class="menu-icon">🏢</view>
          <text class="menu-text">更换基地</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="viewPermissions">
          <view class="menu-icon">🔐</view>
          <text class="menu-text">权限信息</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 数据同步 -->
    <view class="menu-section">
      <view class="section-title">数据管理</view>
      <view class="menu-list">
        <view class="menu-item" @click="viewSyncStatus">
          <view class="menu-icon">🔄</view>
          <text class="menu-text">同步状态</text>
          <view class="sync-badge" v-if="syncStatus.queueLength > 0">
            {{ syncStatus.queueLength }}
          </view>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="manualSync">
          <view class="menu-icon">📤</view>
          <text class="menu-text">手动同步</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="clearOfflineData">
          <view class="menu-icon">🗑️</view>
          <text class="menu-text">清除离线数据</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 系统设置 -->
    <view class="menu-section">
      <view class="section-title">系统设置</view>
      <view class="menu-list">
        <view class="menu-item" @click="viewAbout">
          <view class="menu-icon">ℹ️</view>
          <text class="menu-text">关于应用</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="contactSupport">
          <view class="menu-icon">📞</view>
          <text class="menu-text">联系客服</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>

    <!-- 基地绑定弹窗 -->
    <uni-popup ref="bindingPopup" type="center" :mask-click="false">
      <view class="binding-modal">
        <view class="modal-header">
          <text class="modal-title">绑定工作基地</text>
        </view>
        <view class="modal-content">
          <view class="form-item">
            <text class="label">选择基地</text>
            <picker 
              :value="selectedBaseIndex" 
              :range="baseOptions" 
              range-key="name"
              @change="onBaseChange"
            >
              <view class="picker">
                {{ selectedBase ? selectedBase.name : '请选择基地' }}
                <text class="arrow">></text>
              </view>
            </picker>
          </view>
          <view class="form-item">
            <text class="label">邀请码</text>
            <input 
              class="input"
              v-model="inviteCode"
              placeholder="请输入邀请码（可选）"
              maxlength="20"
            />
          </view>
        </view>
        <view class="modal-actions">
          <button class="cancel-btn" @click="cancelBinding">取消</button>
          <button 
            class="confirm-btn" 
            :loading="isBinding"
            :disabled="!selectedBase || isBinding"
            @click="confirmBinding"
          >
            {{ isBinding ? '绑定中...' : '确认绑定' }}
          </button>
        </view>
      </view>
    </uni-popup>

    <!-- 权限信息弹窗 -->
    <uni-popup ref="permissionPopup" type="bottom">
      <view class="permission-modal">
        <view class="modal-header">
          <text class="modal-title">权限信息</text>
          <text class="close-btn" @click="closePermissionModal">×</text>
        </view>
        <scroll-view class="permission-content" scroll-y>
          <view class="permission-section">
            <text class="permission-title">当前角色</text>
            <text class="permission-value">{{ userRoleText }}</text>
          </view>
          <view class="permission-section">
            <text class="permission-title">所属基地</text>
            <text class="permission-value">{{ userBaseText }}</text>
          </view>
          <view class="permission-section">
            <text class="permission-title">权限列表</text>
            <view class="permission-list">
              <view 
                v-for="permission in permissions" 
                :key="permission"
                class="permission-item"
              >
                {{ getPermissionText(permission) }}
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>

    <!-- 同步状态弹窗 -->
    <uni-popup ref="syncPopup" type="center">
      <view class="sync-modal">
        <view class="modal-header">
          <text class="modal-title">数据同步状态</text>
        </view>
        <view class="sync-content">
          <view class="sync-item">
            <text class="sync-label">网络状态</text>
            <text class="sync-value" :class="{ online: syncStatus.isOnline }">
              {{ syncStatus.isOnline ? '在线' : '离线' }}
            </text>
          </view>
          <view class="sync-item">
            <text class="sync-label">同步状态</text>
            <text class="sync-value">
              {{ syncStatus.isSyncing ? '同步中...' : '空闲' }}
            </text>
          </view>
          <view class="sync-item">
            <text class="sync-label">待同步数据</text>
            <text class="sync-value">{{ syncStatus.queueLength }} 条</text>
          </view>
          <view v-if="syncStatus.pendingItems.length > 0" class="pending-list">
            <text class="pending-title">待同步项目</text>
            <view 
              v-for="item in syncStatus.pendingItems" 
              :key="item.id"
              class="pending-item"
            >
              <text class="pending-type">{{ getSyncTypeText(item.type) }}</text>
              <text class="pending-action">{{ getSyncActionText(item.action) }}</text>
              <text class="pending-time">{{ formatTime(item.timestamp) }}</text>
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button class="close-btn" @click="closeSyncModal">关闭</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { dataSyncManager } from '@/utils/sync'
import { permissionManager } from '@/utils/permission'

const authStore = useAuthStore()

// 响应式数据
const isOnline = ref(true)
const syncStatus = ref({
  isOnline: true,
  isSyncing: false,
  queueLength: 0,
  pendingItems: []
})
const baseOptions = ref([])
const selectedBaseIndex = ref(0)
const selectedBase = ref(null)
const inviteCode = ref('')
const isBinding = ref(false)

// 弹窗引用
const bindingPopup = ref(null)
const permissionPopup = ref(null)
const syncPopup = ref(null)

// 计算属性
const userInfo = computed(() => authStore.currentUser)
const permissions = computed(() => authStore.permissions)
const needsBinding = computed(() => authStore.needsBinding)

const userRoleText = computed(() => {
  const roleMap = {
    'admin': '系统管理员',
    'base_manager': '基地管理员',
    'employee': '员工',
    'veterinarian': '兽医',
    'feeder': '饲养员'
  }
  return roleMap[authStore.userRole] || '未知角色'
})

const userBaseText = computed(() => {
  return userInfo.value?.base_name || '未绑定基地'
})

// 页面加载
onMounted(() => {
  initPage()
  startStatusUpdate()
})

onUnmounted(() => {
  stopStatusUpdate()
})

// 初始化页面
const initPage = async () => {
  try {
    // 更新同步状态
    updateSyncStatus()
    
    // 更新网络状态
    updateNetworkStatus()
    
    // 如果需要绑定，加载基地列表
    if (needsBinding.value) {
      await loadAvailableBases()
    }
  } catch (error) {
    console.error('页面初始化失败:', error)
  }
}

// 更新同步状态
const updateSyncStatus = () => {
  syncStatus.value = dataSyncManager.getSyncStatus()
}

// 更新网络状态
const updateNetworkStatus = () => {
  uni.getNetworkType({
    success: (res) => {
      isOnline.value = res.networkType !== 'none'
    }
  })
}

// 开始状态更新
const startStatusUpdate = () => {
  // 每5秒更新一次状态
  statusInterval = setInterval(() => {
    updateSyncStatus()
    updateNetworkStatus()
  }, 5000)
}

// 停止状态更新
let statusInterval = null
const stopStatusUpdate = () => {
  if (statusInterval) {
    clearInterval(statusInterval)
    statusInterval = null
  }
}

// 检查权限
const hasPermission = (permission) => {
  return permissionManager.hasPermission(permission)
}

// 显示绑定弹窗
const showBindingModal = async () => {
  await loadAvailableBases()
  bindingPopup.value?.open()
}

// 加载可用基地列表
const loadAvailableBases = async () => {
  try {
    const bases = await authStore.getAvailableBases()
    baseOptions.value = bases || []
    
    if (bases && bases.length > 0) {
      selectedBase.value = bases[0]
      selectedBaseIndex.value = 0
    }
  } catch (error) {
    console.error('加载基地列表失败:', error)
    uni.showToast({
      title: '加载基地列表失败',
      icon: 'none'
    })
  }
}

// 基地选择变化
const onBaseChange = (e) => {
  const index = e.detail.value
  selectedBaseIndex.value = index
  selectedBase.value = baseOptions.value[index]
}

// 确认绑定
const confirmBinding = async () => {
  if (!selectedBase.value) {
    uni.showToast({
      title: '请选择基地',
      icon: 'none'
    })
    return
  }
  
  isBinding.value = true
  
  try {
    await authStore.bindUserToBase(selectedBase.value.id, inviteCode.value)
    
    uni.showToast({
      title: '绑定成功',
      icon: 'success'
    })
    
    bindingPopup.value?.close()
  } catch (error) {
    console.error('绑定失败:', error)
    uni.showToast({
      title: error.message || '绑定失败',
      icon: 'none'
    })
  } finally {
    isBinding.value = false
  }
}

// 取消绑定
const cancelBinding = () => {
  bindingPopup.value?.close()
}

// 编辑资料
const editProfile = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 更换基地
const changeBase = () => {
  showBindingModal()
}

// 查看权限
const viewPermissions = () => {
  permissionPopup.value?.open()
}

// 关闭权限弹窗
const closePermissionModal = () => {
  permissionPopup.value?.close()
}

// 查看同步状态
const viewSyncStatus = () => {
  updateSyncStatus()
  syncPopup.value?.open()
}

// 关闭同步弹窗
const closeSyncModal = () => {
  syncPopup.value?.close()
}

// 手动同步
const manualSync = async () => {
  try {
    uni.showLoading({
      title: '同步中...'
    })
    
    await dataSyncManager.manualSync()
    
    uni.hideLoading()
    uni.showToast({
      title: '同步完成',
      icon: 'success'
    })
    
    updateSyncStatus()
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: error.message || '同步失败',
      icon: 'none'
    })
  }
}

// 清除离线数据
const clearOfflineData = () => {
  uni.showModal({
    title: '确认清除',
    content: '确定要清除所有离线数据吗？此操作不可恢复。',
    success: (res) => {
      if (res.confirm) {
        dataSyncManager.clearSyncQueue()
        updateSyncStatus()
        
        uni.showToast({
          title: '清除成功',
          icon: 'success'
        })
      }
    }
  })
}

// 关于应用
const viewAbout = () => {
  uni.showModal({
    title: '关于应用',
    content: '肉牛管理系统 v1.0.0\n专业的肉牛全生命周期管理平台',
    showCancel: false
  })
}

// 联系客服
const contactSupport = () => {
  uni.showActionSheet({
    itemList: ['拨打电话', '发送邮件', '在线客服'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          uni.makePhoneCall({
            phoneNumber: '400-123-4567'
          })
          break
        case 1:
          uni.showToast({
            title: 'support@cattle-mgmt.com',
            icon: 'none'
          })
          break
        case 2:
          uni.showToast({
            title: '在线客服功能开发中',
            icon: 'none'
          })
          break
      }
    }
  })
}

// 退出登录
const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        authStore.logout()
      }
    }
  })
}

// 获取权限文本
const getPermissionText = (permission) => {
  const permissionMap = {
    'cattle:read': '查看牛只信息',
    'cattle:create': '创建牛只记录',
    'cattle:update': '更新牛只信息',
    'cattle:delete': '删除牛只记录',
    'health:read': '查看健康记录',
    'health:create': '创建健康记录',
    'feeding:read': '查看饲喂记录',
    'feeding:create': '创建饲喂记录',
    'admin:*': '系统管理员权限'
  }
  return permissionMap[permission] || permission
}

// 获取同步类型文本
const getSyncTypeText = (type) => {
  const typeMap = {
    'cattle': '牛只数据',
    'health': '健康记录',
    'feeding': '饲喂记录',
    'inventory': '库存数据',
    'equipment': '设备数据'
  }
  return typeMap[type] || type
}

// 获取同步操作文本
const getSyncActionText = (action) => {
  const actionMap = {
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'inbound': '入库',
    'outbound': '出库'
  }
  return actionMap[action] || action
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}
</script>

<style lang="scss" scoped>
.profile-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.user-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  
  .user-avatar {
    margin-right: 30rpx;
    
    .avatar-img {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      border: 4rpx solid #f0f0f0;
    }
  }
  
  .user-info {
    flex: 1;
    
    .user-name {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }
    
    .user-role {
      display: block;
      font-size: 28rpx;
      color: #1890ff;
      margin-bottom: 5rpx;
    }
    
    .user-base {
      display: block;
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .user-status {
    display: flex;
    align-items: center;
    
    .status-dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 8rpx;
      background: #ccc;
      margin-right: 10rpx;
      
      &.online {
        background: #52c41a;
      }
    }
    
    .status-text {
      font-size: 24rpx;
      color: #666;
    }
  }
}

.binding-notice {
  background: #fff3cd;
  border: 2rpx solid #ffeaa7;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  
  .notice-icon {
    font-size: 40rpx;
    margin-right: 20rpx;
  }
  
  .notice-content {
    flex: 1;
    
    .notice-title {
      display: block;
      font-size: 28rpx;
      font-weight: bold;
      color: #856404;
      margin-bottom: 5rpx;
    }
    
    .notice-desc {
      display: block;
      font-size: 24rpx;
      color: #856404;
    }
  }
  
  .bind-btn {
    background: #ffc107;
    color: #856404;
    border: none;
    border-radius: 20rpx;
    padding: 10rpx 20rpx;
    font-size: 24rpx;
  }
}

.menu-section {
  margin-bottom: 20rpx;
  
  .section-title {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 20rpx;
    padding-left: 20rpx;
  }
  
  .menu-list {
    background: #fff;
    border-radius: 12rpx;
    overflow: hidden;
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: 30rpx 40rpx;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .menu-icon {
        font-size: 32rpx;
        margin-right: 20rpx;
      }
      
      .menu-text {
        flex: 1;
        font-size: 28rpx;
        color: #333;
      }
      
      .sync-badge {
        background: #ff4d4f;
        color: #fff;
        font-size: 20rpx;
        padding: 4rpx 8rpx;
        border-radius: 10rpx;
        margin-right: 10rpx;
      }
      
      .menu-arrow {
        font-size: 24rpx;
        color: #ccc;
      }
    }
  }
}

.logout-section {
  margin-top: 40rpx;
  
  .logout-btn {
    width: 100%;
    height: 88rpx;
    background: #ff4d4f;
    color: #fff;
    border: none;
    border-radius: 44rpx;
    font-size: 32rpx;
  }
}

.binding-modal,
.sync-modal {
  width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  
  .modal-header {
    padding: 40rpx;
    text-align: center;
    border-bottom: 1rpx solid #f0f0f0;
    
    .modal-title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .modal-content,
  .sync-content {
    padding: 40rpx;
  }
  
  .modal-actions {
    display: flex;
    border-top: 1rpx solid #f0f0f0;
    
    .cancel-btn,
    .confirm-btn,
    .close-btn {
      flex: 1;
      height: 88rpx;
      line-height: 88rpx;
      text-align: center;
      font-size: 32rpx;
      border: none;
      background: none;
    }
    
    .cancel-btn {
      color: #666;
      border-right: 1rpx solid #f0f0f0;
    }
    
    .confirm-btn {
      color: #1890ff;
      font-weight: bold;
      
      &:disabled {
        color: #ccc;
      }
    }
    
    .close-btn {
      color: #1890ff;
    }
  }
}

.form-item {
  margin-bottom: 30rpx;
  
  .label {
    display: block;
    font-size: 28rpx;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .picker {
    height: 80rpx;
    line-height: 80rpx;
    padding: 0 20rpx;
    background: #f8f8f8;
    border-radius: 10rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .arrow {
      color: #999;
    }
  }
  
  .input {
    height: 80rpx;
    line-height: 80rpx;
    padding: 0 20rpx;
    background: #f8f8f8;
    border-radius: 10rpx;
    font-size: 28rpx;
  }
}

.permission-modal {
  height: 70vh;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .modal-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .close-btn {
      font-size: 48rpx;
      color: #999;
      width: 60rpx;
      height: 60rpx;
      line-height: 60rpx;
      text-align: center;
    }
  }
  
  .permission-content {
    height: calc(70vh - 120rpx);
    padding: 40rpx;
    
    .permission-section {
      margin-bottom: 40rpx;
      
      .permission-title {
        display: block;
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
      }
      
      .permission-value {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 10rpx;
      }
      
      .permission-list {
        .permission-item {
          background: #f8f9fa;
          padding: 15rpx 20rpx;
          border-radius: 8rpx;
          margin-bottom: 10rpx;
          font-size: 24rpx;
          color: #333;
        }
      }
    }
  }
}

.sync-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  
  .sync-label {
    font-size: 28rpx;
    color: #333;
  }
  
  .sync-value {
    font-size: 26rpx;
    color: #666;
    
    &.online {
      color: #52c41a;
    }
  }
}

.pending-list {
  margin-top: 30rpx;
  
  .pending-title {
    display: block;
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .pending-item {
    background: #f8f9fa;
    padding: 20rpx;
    border-radius: 8rpx;
    margin-bottom: 10rpx;
    
    .pending-type {
      display: block;
      font-size: 26rpx;
      color: #1890ff;
      margin-bottom: 5rpx;
    }
    
    .pending-action {
      display: inline-block;
      font-size: 24rpx;
      color: #666;
      margin-right: 20rpx;
    }
    
    .pending-time {
      font-size: 22rpx;
      color: #999;
    }
  }
}
</style>