<template>
  <!-- 小程序根组件 -->
</template>

<script>
export default {
  onLaunch() {
    console.log('App Launch')
    // 初始化应用
    this.initApp()
  },
  
  onShow() {
    console.log('App Show')
    // 应用从后台进入前台时，检查登录状态和同步数据
    this.handleAppShow()
  },
  
  onHide() {
    console.log('App Hide')
    // 应用进入后台时，保存同步队列
    this.handleAppHide()
  },
  
  methods: {
    async initApp() {
      try {
        // 1. 获取系统信息
        const systemInfo = await this.getSystemInfo()
        console.log('系统信息:', systemInfo)
        
        // 2. 设置全局错误处理
        this.setupGlobalErrorHandler()
        
        // 3. 监听同步事件
        this.setupSyncEventListeners()
        
        console.log('应用初始化完成')
      } catch (error) {
        console.error('应用初始化失败:', error)
      }
    },

    async handleAppShow() {
      try {
        console.log('应用显示处理')
      } catch (error) {
        console.error('应用显示处理失败:', error)
      }
    },

    handleAppHide() {
      try {
        console.log('应用隐藏处理')
      } catch (error) {
        console.error('应用隐藏处理失败:', error)
      }
    },

    getSystemInfo() {
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
    },

    setupGlobalErrorHandler() {
      // 监听未处理的Promise拒绝
      uni.onUnhandledRejection((event) => {
        console.error('未处理的Promise拒绝:', event)
      })
      
      // 监听页面错误
      uni.onError((error) => {
        console.error('页面错误:', error)
      })
    },

    setupSyncEventListeners() {
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
    }
  }
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