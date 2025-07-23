// 通用工具函数

/**
 * 显示消息提示框
 * @param {string} message 提示内容
 * @param {string} icon 图标类型，可选值：success, error, none
 * @param {number} duration 提示持续时间，单位毫秒
 */
export function showToast(message, icon = 'none', duration = 2000) {
  uni.showToast({
    title: message,
    icon,
    duration
  })
}

/**
 * 显示模态对话框
 * @param {Object} options 对话框配置
 * @param {string} options.title 标题
 * @param {string} options.content 内容
 * @param {boolean} options.showCancel 是否显示取消按钮
 * @param {string} options.cancelText 取消按钮文字
 * @param {string} options.confirmText 确认按钮文字
 * @param {boolean} options.editable 是否可编辑内容
 * @param {string} options.placeholderText 编辑框占位文字
 * @returns {Promise<Object>} 返回用户操作结果
 */
export function showModal(options) {
  const {
    title = '提示',
    content = '',
    showCancel = true,
    cancelText = '取消',
    confirmText = '确定',
    editable = false,
    placeholderText = ''
  } = options

  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      showCancel,
      cancelText,
      confirmText,
      editable,
      placeholderText,
      success: (res) => {
        resolve(res)
      },
      fail: () => {
        resolve({ confirm: false, cancel: true })
      }
    })
  })
}

/**
 * 格式化日期
 * @param {string|Date} date 日期对象或日期字符串
 * @param {string} format 格式化模板，默认 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '-'
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return '-'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化金额
 * @param {number} amount 金额
 * @param {number} decimals 小数位数
 * @param {boolean} useThousandSeparator 是否使用千分位分隔符
 * @returns {string} 格式化后的金额字符串
 */
export function formatAmount(amount, decimals = 2, useThousandSeparator = true) {
  if (amount === null || amount === undefined) return '0'
  
  const num = Number(amount)
  if (isNaN(num)) return '0'
  
  const fixed = num.toFixed(decimals)
  
  if (!useThousandSeparator) return fixed
  
  const parts = fixed.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  
  return parts.join('.')
}

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间，单位毫秒
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null
  
  return function(...args) {
    if (timer) clearTimeout(timer)
    
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {number} interval 间隔时间，单位毫秒
 * @returns {Function} 节流后的函数
 */
export function throttle(fn, interval = 300) {
  let lastTime = 0
  
  return function(...args) {
    const now = Date.now()
    
    if (now - lastTime >= interval) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 深拷贝对象
 * @param {Object} obj 要拷贝的对象
 * @returns {Object} 拷贝后的对象
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  
  const clone = Array.isArray(obj) ? [] : {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key])
    }
  }
  
  return clone
}

/**
 * 生成UUID
 * @returns {string} UUID字符串
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 检查网络状态
 * @returns {Promise<boolean>} 是否有网络连接
 */
export function checkNetworkStatus() {
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        resolve(res.networkType !== 'none')
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

export default {
  showToast,
  showModal,
  formatDate,
  formatAmount,
  debounce,
  throttle,
  deepClone,
  generateUUID,
  checkNetworkStatus
}