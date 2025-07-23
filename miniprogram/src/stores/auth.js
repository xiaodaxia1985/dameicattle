// Simple auth utility without pinia
export const authStore = {
  // State
  token: '',
  userInfo: null,
  permissions: [],
  isLoggedIn: false,
  needsBinding: false,

  // Initialize from storage
  init() {
    this.token = uni.getStorageSync('token') || ''
    this.userInfo = uni.getStorageSync('userInfo') || null
    this.permissions = uni.getStorageSync('permissions') || []
    this.isLoggedIn = !!this.token
    this.needsBinding = this.userInfo && !this.userInfo.base_id
  },

  // Save to storage
  save() {
    uni.setStorageSync('token', this.token)
    uni.setStorageSync('userInfo', this.userInfo)
    uni.setStorageSync('permissions', this.permissions)
  },

  // Clear storage
  clear() {
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('permissions')
    this.token = ''
    this.userInfo = null
    this.permissions = []
    this.isLoggedIn = false
    this.needsBinding = false
  },

  // Mock login for development
  async login(userInfo) {
    this.token = 'mock-token-' + Date.now()
    this.userInfo = userInfo || { id: 1, name: '测试用户', role: { name: 'admin' } }
    this.permissions = ['read', 'write', 'admin']
    this.isLoggedIn = true
    this.needsBinding = false
    this.save()
    return { success: true }
  },

  // Logout
  async logout() {
    this.clear()
    return { success: true }
  },

  // Check permission
  hasPermission(permission) {
    return this.permissions.includes(permission)
  },

  // Check role
  hasRole(role) {
    return this.userInfo && this.userInfo.role && this.userInfo.role.name === role
  }
}