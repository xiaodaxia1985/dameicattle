// 权限控制工具
import { wechatAuth } from './auth.js'

/**
 * 权限控制类
 */
class PermissionManager {
  constructor() {
    this.permissions = []
    this.userRole = null
    this.baseId = null
  }

  /**
   * 初始化权限信息
   */
  init() {
    const userInfo = wechatAuth.getCurrentUser()
    const permissions = wechatAuth.getCurrentPermissions()
    
    this.permissions = permissions || []
    this.userRole = userInfo?.role?.name || null
    this.baseId = userInfo?.base_id || null
  }

  /**
   * 检查是否有指定权限
   * @param {string} permission 权限名称
   * @returns {boolean} 是否有权限
   */
  hasPermission(permission) {
    if (!permission) return true
    
    // 超级管理员拥有所有权限
    if (this.permissions.includes('*') || this.permissions.includes('admin:*')) {
      return true
    }
    
    // 检查具体权限
    return this.permissions.includes(permission)
  }

  /**
   * 检查是否有指定角色
   * @param {string} role 角色名称
   * @returns {boolean} 是否有该角色
   */
  hasRole(role) {
    return this.userRole === role
  }

  /**
   * 检查是否有任一权限
   * @param {Array} permissions 权限列表
   * @returns {boolean} 是否有任一权限
   */
  hasAnyPermission(permissions) {
    if (!permissions || permissions.length === 0) return true
    
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * 检查是否有所有权限
   * @param {Array} permissions 权限列表
   * @returns {boolean} 是否有所有权限
   */
  hasAllPermissions(permissions) {
    if (!permissions || permissions.length === 0) return true
    
    return permissions.every(permission => this.hasPermission(permission))
  }

  /**
   * 检查数据权限（基地级别）
   * @param {number} dataBaseId 数据所属基地ID
   * @returns {boolean} 是否有权限访问
   */
  hasDataPermission(dataBaseId) {
    // 超级管理员可以访问所有数据
    if (this.hasPermission('admin:*')) {
      return true
    }
    
    // 基地管理员只能访问自己基地的数据
    if (this.hasRole('base_manager')) {
      return this.baseId === dataBaseId
    }
    
    // 普通员工只能访问自己基地的数据
    if (this.hasRole('employee')) {
      return this.baseId === dataBaseId
    }
    
    return false
  }

  /**
   * 获取用户可访问的基地ID列表
   * @returns {Array} 基地ID列表
   */
  getAccessibleBaseIds() {
    // 超级管理员可以访问所有基地
    if (this.hasPermission('admin:*')) {
      return [] // 空数组表示所有基地
    }
    
    // 其他角色只能访问自己的基地
    return this.baseId ? [this.baseId] : []
  }

  /**
   * 检查页面访问权限
   * @param {string} pagePath 页面路径
   * @returns {boolean} 是否可以访问
   */
  canAccessPage(pagePath) {
    const pagePermissions = this.getPagePermissions(pagePath)
    
    if (!pagePermissions || pagePermissions.length === 0) {
      return true // 无权限要求的页面可以访问
    }
    
    return this.hasAnyPermission(pagePermissions)
  }

  /**
   * 获取页面所需权限
   * @param {string} pagePath 页面路径
   * @returns {Array} 权限列表
   */
  getPagePermissions(pagePath) {
    const pagePermissionMap = {
      // 牛只管理
      '/pages/cattle/list': ['cattle:read'],
      '/pages/cattle/detail': ['cattle:read'],
      '/pages/cattle/add': ['cattle:create'],
      '/pages/cattle/edit': ['cattle:update'],
      
      // 健康管理
      '/pages/health/list': ['health:read'],
      '/pages/health/record': ['health:create', 'health:update'],
      '/pages/health/detail': ['health:read'],
      
      // 饲喂管理
      '/pages/feeding/list': ['feeding:read'],
      '/pages/feeding/record': ['feeding:create', 'feeding:update'],
      '/pages/feeding/formula': ['feeding:formula'],
      
      // 物资管理
      '/pages/material/list': ['material:read'],
      '/pages/material/inventory': ['material:inventory'],
      '/pages/material/inbound': ['material:inbound'],
      '/pages/material/outbound': ['material:outbound'],
      
      // 设备管理
      '/pages/equipment/list': ['equipment:read'],
      '/pages/equipment/maintenance': ['equipment:maintenance'],
      '/pages/equipment/failure': ['equipment:failure'],
      
      // 采购管理
      '/pages/purchase/list': ['purchase:read'],
      '/pages/purchase/order': ['purchase:create', 'purchase:update'],
      '/pages/purchase/approve': ['purchase:approve'],
      
      // 销售管理
      '/pages/sales/list': ['sales:read'],
      '/pages/sales/order': ['sales:create', 'sales:update'],
      '/pages/sales/approve': ['sales:approve'],
      
      // 用户管理
      '/pages/user/list': ['user:read'],
      '/pages/user/manage': ['user:manage'],
      
      // 系统管理
      '/pages/system/settings': ['system:settings'],
      '/pages/system/logs': ['system:logs'],
    }
    
    return pagePermissionMap[pagePath] || []
  }

  /**
   * 检查操作权限
   * @param {string} action 操作名称
   * @param {Object} context 上下文信息
   * @returns {boolean} 是否有权限
   */
  canPerformAction(action, context = {}) {
    const actionPermissions = this.getActionPermissions(action)
    
    if (!actionPermissions || actionPermissions.length === 0) {
      return true
    }
    
    // 检查基础权限
    if (!this.hasAnyPermission(actionPermissions)) {
      return false
    }
    
    // 检查数据权限
    if (context.baseId && !this.hasDataPermission(context.baseId)) {
      return false
    }
    
    return true
  }

  /**
   * 获取操作所需权限
   * @param {string} action 操作名称
   * @returns {Array} 权限列表
   */
  getActionPermissions(action) {
    const actionPermissionMap = {
      // 牛只操作
      'cattle:create': ['cattle:create'],
      'cattle:update': ['cattle:update'],
      'cattle:delete': ['cattle:delete'],
      'cattle:export': ['cattle:export'],
      'cattle:import': ['cattle:import'],
      
      // 健康操作
      'health:diagnose': ['health:create'],
      'health:treat': ['health:update'],
      'health:vaccinate': ['health:vaccinate'],
      
      // 饲喂操作
      'feeding:record': ['feeding:create'],
      'feeding:plan': ['feeding:plan'],
      'feeding:formula_create': ['feeding:formula'],
      
      // 物资操作
      'material:inbound': ['material:inbound'],
      'material:outbound': ['material:outbound'],
      'material:transfer': ['material:transfer'],
      'material:inventory': ['material:inventory'],
      
      // 设备操作
      'equipment:maintain': ['equipment:maintenance'],
      'equipment:repair': ['equipment:repair'],
      'equipment:report_failure': ['equipment:failure'],
      
      // 采购操作
      'purchase:create_order': ['purchase:create'],
      'purchase:approve_order': ['purchase:approve'],
      'purchase:receive': ['purchase:receive'],
      
      // 销售操作
      'sales:create_order': ['sales:create'],
      'sales:approve_order': ['sales:approve'],
      'sales:deliver': ['sales:deliver'],
    }
    
    return actionPermissionMap[action] || []
  }

  /**
   * 权限检查装饰器
   * @param {Array} requiredPermissions 所需权限
   * @returns {Function} 装饰器函数
   */
  requirePermissions(requiredPermissions) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value
      
      descriptor.value = function(...args) {
        if (!this.hasAllPermissions(requiredPermissions)) {
          uni.showToast({
            title: '权限不足',
            icon: 'none'
          })
          return Promise.reject(new Error('权限不足'))
        }
        
        return originalMethod.apply(this, args)
      }
      
      return descriptor
    }
  }

  /**
   * 页面权限检查
   * @param {string} pagePath 页面路径
   * @returns {Promise} 检查结果
   */
  async checkPagePermission(pagePath) {
    // 确保权限信息是最新的
    this.init()
    
    if (!this.canAccessPage(pagePath)) {
      uni.showToast({
        title: '无权限访问此页面',
        icon: 'none'
      })
      
      // 跳转到首页
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index/index'
        })
      }, 1500)
      
      return false
    }
    
    return true
  }
}

// 创建权限管理器实例
export const permissionManager = new PermissionManager()

// 页面权限检查混入
export const permissionMixin = {
  onLoad() {
    // 检查页面权限
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const pagePath = '/' + currentPage.route
    
    permissionManager.checkPagePermission(pagePath)
  }
}

// 权限指令（用于条件渲染）
export const vPermission = {
  mounted(el, binding) {
    const { value } = binding
    
    if (value && !permissionManager.hasAnyPermission(Array.isArray(value) ? value : [value])) {
      el.style.display = 'none'
    }
  },
  
  updated(el, binding) {
    const { value } = binding
    
    if (value && !permissionManager.hasAnyPermission(Array.isArray(value) ? value : [value])) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }
  }
}

export default permissionManager