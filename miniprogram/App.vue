<template>
  <!-- 小程序根组件 -->
</template>

<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onLaunch(() => {
  console.log('App Launch')
  // 初始化应用
  initApp()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})

const initApp = () => {
  // 检查登录状态
  authStore.checkLoginStatus()
  
  // 获取系统信息
  uni.getSystemInfo({
    success: (res) => {
      console.log('系统信息:', res)
      // 可以在这里设置全局的系统信息
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