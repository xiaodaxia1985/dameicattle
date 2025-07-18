<template>
  <!-- 小程序根组件 -->
</template>

<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { dataSyncManager } from '@/utils/sync'
import { permissionManager } from '@/utils/permission'

const authStore = useAuthStore()

onLaunch(() => {
  console.log('App Launch')
  // 初始化应用
  initApp()
})

onShow(() => {
  console.log('App Show')
  // 应用从后台进入前台时，检查登录状态和同步数据
  handleAppShow()
})

onHide(() => {
  console.log('App Hide')
  // 应用进入后台时，保存同步队列
  handleAppHide()
})

const initApp = async () => {
  try {
    // 1. 获取系统信息
    const systemInfo = await getSystemInfo()
    console.log('系统信息:', systemInfo)
    
    // 2. 初始化数据同步管理器
    dataSyncManager.init()
    
    // 3. 检查登录状态
    await authStore.checkLoginStatus()
    
    // 4. 初始化权限管理器
    permissionManager.init()
    
    // 5. 设置全局错误处理
    setupGlobalErrorHandler()
    
    // 6. 监听同步事件
    setupSyncEventListeners()
    
    console.log('应用初始化完成')
  } catch (error) {
    console.error('应用初始化失败:', error)
  }
}

const handleAppShow = async () => {
  try {
    // 检查登录状态是否有变化
    if (authStore.isLoggedIn) {
      // 刷新权限信息
      permissionManager.init()
      
      // 检查Token是否需要刷新
      if (authStore.token) {
        try {
          await authStore.getUserProfile()
        } catch (error) {
          console.warn('获取用户资料失败:', error)
        }
      }
      
      // 触发数据同步
      if (dataSyncManager.isOnline && dataSyncManager.syncQueue.length > 0) {
        dataSyncManager.syncOfflineData()
      }
    }
  } catch (error) {
    console.error('应用显示处理失败:', error)
  }
}

const handleAppHide = () => {
  try {
    // 保存同步队列到本地存储
    dataSyncManager.saveSyncQueue()
  } catch (error) {
    console.error('应用隐藏处理失败:', error)
  }
}

const getSystemInfo = () => {
  return new Promise((resolve, reject) => {
    uni.getSystemInfo({
      success: (res) => {
        // 保存系统信息到全局
        getApp().globalData = {
          ...getApp().globalData,
          systemInfo: res
        }
        resolve(res)
      },
      fail: reject
    })
  })
}

const setupGlobalErrorHandler = () => {
  // 监听未处理的Promise拒绝
  uni.onUnhandledRejection((event) => {
    console.error('未处理的Promise拒绝:', event)
    
    // 如果是认证错误，跳转到登录页
    if (event.reason && event.reason.message && 
        (event.reason.message.includes('登录') || event.reason.message.includes('认证'))) {
      authStore.logout()
    }
  })
  
  // 监听页面错误
  uni.onError((error) => {
    console.error('页面错误:', error)
  })
}

const setupSyncEventListeners = () => {
  // 监听同步完成事件
  uni.$on('syncCompleted', (data) => {
    console.log('数据同步完成:', data)
    
    if (data.syncedCount > 0) {
      uni.showToast({
        title: `已同步${data.syncedCount}条数据`,
        icon: 'success',
        duration: 2000
      })
    }
  })
  
  // 监听网络状态变化
  uni.onNetworkStatusChange((res) => {
    console.log('网络状态变化:', res)
    
    if (res.isConnected) {
      uni.showToast({
        title: '网络已连接',
        icon: 'success',
        duration: 1500
      })
    } else {
      uni.showToast({
        title: '网络已断开',
        icon: 'none',
        duration: 1500
      })
    }
  })
  
  // 监听登录状态变化
  uni.$on('loginStatusChanged', (isLoggedIn) => {
    console.log('登录状态变化:', isLoggedIn)
    
    if (isLoggedIn) {
      // 登录成功后初始化权限
      permissionManager.init()
    } else {
      // 登出后清理数据
      dataSyncManager.clearSyncQueue()
    }
  })
}
</script>

<style lang="scss">
/* 全局样式 */
@import '@/styles/index.scss';

page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', SimSun, sans-serif;
}

/* 通用样式 */
.container {
  padding: 20rpx;
}

.card {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.flex {
  display: flex;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.text-primary {
  color: #1890ff;
}

.text-success {
  color: #52c41a;
}

.text-warning {
  color: #faad14;
}

.text-danger {
  color: #ff4d4f;
}

.text-gray {
  color: #999;
}

.text-center {
  text-align: center;
}

.mb-20 {
  margin-bottom: 20rpx;
}

.mt-20 {
  margin-top: 20rpx;
}
</style>