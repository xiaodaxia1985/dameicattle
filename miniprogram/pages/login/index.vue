<template>
  <view class="login-container">
    <!-- 头部Logo和标题 -->
    <view class="header">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="title">肉牛管理系统</text>
      <text class="subtitle">专业的肉牛全生命周期管理平台</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <!-- 微信登录按钮 -->
      <button 
        class="wechat-login-btn"
        :loading="isLogging"
        :disabled="isLogging"
        @click="handleWechatLogin"
      >
        <image class="wechat-icon" src="/static/wechat-icon.png" mode="aspectFit" />
        <text>{{ isLogging ? '登录中...' : '微信快速登录' }}</text>
      </button>

      <!-- 用户协议 -->
      <view class="agreement">
        <text class="agreement-text">
          登录即表示同意
          <text class="link" @click="showUserAgreement">《用户协议》</text>
          和
          <text class="link" @click="showPrivacyPolicy">《隐私政策》</text>
        </text>
      </view>
    </view>

    <!-- 基地绑定弹窗 -->
    <uni-popup ref="bindingPopup" type="center" :mask-click="false">
      <view class="binding-popup">
        <view class="popup-header">
          <text class="popup-title">绑定工作基地</text>
          <text class="popup-subtitle">请选择您所属的工作基地</text>
        </view>

        <view class="popup-content">
          <!-- 基地选择 -->
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

          <!-- 邀请码输入 -->
          <view class="form-item">
            <text class="label">邀请码</text>
            <input 
              class="input"
              v-model="inviteCode"
              placeholder="请输入邀请码（可选）"
              maxlength="20"
            />
          </view>

          <!-- 基地信息展示 -->
          <view v-if="selectedBase" class="base-info">
            <view class="info-item">
              <text class="info-label">基地地址：</text>
              <text class="info-value">{{ selectedBase.address || '暂无' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">负责人：</text>
              <text class="info-value">{{ selectedBase.manager_name || '暂无' }}</text>
            </view>
          </view>
        </view>

        <view class="popup-actions">
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

    <!-- 用户协议弹窗 -->
    <uni-popup ref="agreementPopup" type="bottom">
      <view class="agreement-popup">
        <view class="popup-header">
          <text class="popup-title">用户协议</text>
          <text class="close-btn" @click="closeAgreement">×</text>
        </view>
        <scroll-view class="agreement-content" scroll-y>
          <text class="agreement-text">
            <!-- 用户协议内容 -->
            欢迎使用肉牛管理系统！请仔细阅读以下用户协议...
            
            1. 服务条款
            本系统为肉牛养殖管理提供数字化解决方案...
            
            2. 用户责任
            用户应当合法使用本系统，不得进行违法违规操作...
            
            3. 隐私保护
            我们重视用户隐私，严格按照隐私政策保护用户信息...
            
            4. 免责声明
            本系统按"现状"提供服务，不对服务的准确性、完整性做出保证...
          </text>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'

const authStore = useAuthStore()

// 响应式数据
const isLogging = ref(false)
const isBinding = ref(false)
const baseOptions = ref([])
const selectedBaseIndex = ref(0)
const selectedBase = ref(null)
const inviteCode = ref('')

// 弹窗引用
const bindingPopup = ref(null)
const agreementPopup = ref(null)

// 页面加载时检查登录状态
onMounted(async () => {
  await authStore.checkLoginStatus()
  
  // 如果已登录且不需要绑定，跳转到首页
  if (authStore.isLoggedIn && !authStore.needsBinding) {
    uni.reLaunch({
      url: '/pages/index/index'
    })
  }
})

// 微信登录处理
const handleWechatLogin = async () => {
  if (isLogging.value) return
  
  isLogging.value = true
  
  try {
    const result = await authStore.wechatLogin()
    
    if (result.needsBinding) {
      // 需要绑定基地，显示绑定弹窗
      await loadAvailableBases()
      bindingPopup.value?.open()
    } else {
      // 登录成功，跳转到首页
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index/index'
        })
      }, 1500)
    }
  } catch (error) {
    console.error('登录失败:', error)
    uni.showToast({
      title: error.message || '登录失败',
      icon: 'none'
    })
  } finally {
    isLogging.value = false
  }
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
    
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }, 1500)
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
  // 登出用户
  authStore.logout()
}

// 显示用户协议
const showUserAgreement = () => {
  agreementPopup.value?.open()
}

// 显示隐私政策
const showPrivacyPolicy = () => {
  uni.showToast({
    title: '隐私政策',
    icon: 'none'
  })
}

// 关闭协议弹窗
const closeAgreement = () => {
  agreementPopup.value?.close()
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 40rpx 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 120rpx;
  
  .logo {
    width: 120rpx;
    height: 120rpx;
    margin-bottom: 30rpx;
  }
  
  .title {
    display: block;
    font-size: 48rpx;
    font-weight: bold;
    color: #fff;
    margin-bottom: 20rpx;
  }
  
  .subtitle {
    display: block;
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.login-form {
  width: 100%;
  max-width: 600rpx;
  
  .wechat-login-btn {
    width: 100%;
    height: 88rpx;
    background: #07c160;
    border-radius: 44rpx;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32rpx;
    color: #fff;
    margin-bottom: 40rpx;
    
    .wechat-icon {
      width: 40rpx;
      height: 40rpx;
      margin-right: 20rpx;
    }
    
    &:disabled {
      opacity: 0.6;
    }
  }
  
  .agreement {
    text-align: center;
    
    .agreement-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.7);
      
      .link {
        color: #fff;
        text-decoration: underline;
      }
    }
  }
}

.binding-popup {
  width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  
  .popup-header {
    padding: 40rpx;
    text-align: center;
    border-bottom: 1rpx solid #f0f0f0;
    
    .popup-title {
      display: block;
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }
    
    .popup-subtitle {
      display: block;
      font-size: 28rpx;
      color: #666;
    }
  }
  
  .popup-content {
    padding: 40rpx;
    
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
    
    .base-info {
      background: #f8f9fa;
      border-radius: 10rpx;
      padding: 20rpx;
      
      .info-item {
        display: flex;
        margin-bottom: 10rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .info-label {
          font-size: 26rpx;
          color: #666;
          width: 140rpx;
        }
        
        .info-value {
          font-size: 26rpx;
          color: #333;
          flex: 1;
        }
      }
    }
  }
  
  .popup-actions {
    display: flex;
    border-top: 1rpx solid #f0f0f0;
    
    .cancel-btn,
    .confirm-btn {
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
  }
}

.agreement-popup {
  height: 70vh;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .popup-title {
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
  
  .agreement-content {
    height: calc(70vh - 120rpx);
    padding: 40rpx;
    
    .agreement-text {
      font-size: 28rpx;
      line-height: 1.6;
      color: #333;
    }
  }
}
</style>