import Vue from 'vue'
import App from './App.vue'
import store from './stores'

// Import error handling and API client
import { setupGlobalErrorHandler } from './utils/errorHandler'
import { authStore } from './stores/auth'

Vue.config.productionTip = false

// Setup global error handling
setupGlobalErrorHandler()

// Initialize auth store
authStore.init()

// Global mixins for common functionality
Vue.mixin({
  methods: {
    // Safe navigation helper
    $safeGet(obj, path, defaultValue = null) {
      if (!obj || typeof obj !== 'object') return defaultValue
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : defaultValue
      }, obj)
    },

    // Format date helper
    $formatDate(date, format = 'YYYY-MM-DD') {
      if (!date) return ''
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
    },

    // Show loading helper
    $showLoading(title = '加载中...') {
      uni.showLoading({ title, mask: true })
    },

    // Hide loading helper
    $hideLoading() {
      uni.hideLoading()
    },

    // Show success toast
    $showSuccess(title, duration = 2000) {
      uni.showToast({
        title,
        icon: 'success',
        duration,
        mask: true
      })
    },

    // Show error toast
    $showError(title, duration = 3000) {
      uni.showToast({
        title,
        icon: 'none',
        duration,
        mask: true
      })
    },

    // Navigate with error handling
    $navigateTo(url, options = {}) {
      uni.navigateTo({
        url,
        ...options,
        fail: (error) => {
          console.error('Navigation failed:', error)
          this.$showError('页面跳转失败')
        }
      })
    },

    // Check authentication
    $checkAuth() {
      if (!authStore.isAuthenticated) {
        uni.showModal({
          title: '未登录',
          content: '请先登录后再使用此功能',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.reLaunch({
                url: '/pages/login/index'
              })
            }
          }
        })
        return false
      }
      return true
    },

    // Check permission
    $checkPermission(permission) {
      if (!authStore.hasPermission(permission)) {
        this.$showError('权限不足，无法执行此操作')
        return false
      }
      return true
    }
  }
})

// Global properties
Vue.prototype.$authStore = authStore

App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})

app.$mount()