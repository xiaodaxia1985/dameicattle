/**
 * 推送通知工具类
 */
class NotificationManager {
  constructor() {
    this.isEnabled = false
    this.subscribeIds = {
      healthAlert: 'health_alert_template_id',
      feedingReminder: 'feeding_reminder_template_id',
      equipmentFailure: 'equipment_failure_template_id',
      inventoryAlert: 'inventory_alert_template_id'
    }
  }

  /**
   * 初始化推送通知
   */
  async init() {
    try {
      // 检查是否支持订阅消息
      const setting = await uni.getSetting()
      if (setting.subscriptionsSetting && setting.subscriptionsSetting.mainSwitch) {
        this.isEnabled = true
      }
      
      return this.isEnabled
    } catch (error) {
      console.error('初始化推送通知失败:', error)
      return false
    }
  }

  /**
   * 请求订阅权限
   */
  async requestSubscription(types = ['healthAlert', 'feedingReminder']) {
    if (!this.isEnabled) {
      await this.init()
    }

    try {
      const tmplIds = types.map(type => this.subscribeIds[type]).filter(Boolean)
      
      if (tmplIds.length === 0) {
        throw new Error('没有有效的模板ID')
      }

      const result = await uni.requestSubscribeMessage({
        tmplIds
      })

      // 检查订阅结果
      const subscribedTypes = []
      types.forEach(type => {
        const tmplId = this.subscribeIds[type]
        if (result[tmplId] === 'accept') {
          subscribedTypes.push(type)
        }
      })

      return {
        success: subscribedTypes.length > 0,
        subscribedTypes,
        result
      }
    } catch (error) {
      console.error('请求订阅权限失败:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * 发送本地通知
   */
  showLocalNotification(options) {
    const {
      title = '系统通知',
      content = '',
      type = 'info', // info, warning, error, success
      duration = 3000,
      onClick = null
    } = options

    // 显示Toast通知
    uni.showToast({
      title: content,
      icon: this.getToastIcon(type),
      duration,
      success: () => {
        if (onClick && typeof onClick === 'function') {
          setTimeout(onClick, 100)
        }
      }
    })
  }

  /**
   * 获取Toast图标
   */
  getToastIcon(type) {
    const iconMap = {
      success: 'success',
      error: 'error',
      warning: 'none',
      info: 'none'
    }
    return iconMap[type] || 'none'
  }

  /**
   * 处理健康预警通知
   */
  async sendHealthAlert(data) {
    const { cattleId, earTag, alertType, message } = data
    
    // 显示本地通知
    this.showLocalNotification({
      title: '健康预警',
      content: `${earTag}: ${message}`,
      type: 'warning',
      onClick: () => {
        uni.navigateTo({
          url: `/pages/cattle/detail?id=${cattleId}`
        })
      }
    })

    // 如果有订阅权限，发送订阅消息
    try {
      await this.sendSubscribeMessage('healthAlert', {
        thing1: { value: earTag },
        thing2: { value: alertType },
        thing3: { value: message },
        time4: { value: new Date().toLocaleString() }
      })
    } catch (error) {
      console.error('发送健康预警订阅消息失败:', error)
    }
  }

  /**
   * 处理饲喂提醒通知
   */
  async sendFeedingReminder(data) {
    const { baseId, baseName, feedingTime, formulaName } = data
    
    this.showLocalNotification({
      title: '饲喂提醒',
      content: `${baseName}需要进行饲喂`,
      type: 'info',
      onClick: () => {
        uni.navigateTo({
          url: `/pages/feeding/record?baseId=${baseId}`
        })
      }
    })

    try {
      await this.sendSubscribeMessage('feedingReminder', {
        thing1: { value: baseName },
        thing2: { value: formulaName },
        time3: { value: feedingTime },
        thing4: { value: '请及时进行饲喂操作' }
      })
    } catch (error) {
      console.error('发送饲喂提醒订阅消息失败:', error)
    }
  }

  /**
   * 处理设备故障通知
   */
  async sendEquipmentFailure(data) {
    const { equipmentId, equipmentName, failureType, severity } = data
    
    this.showLocalNotification({
      title: '设备故障',
      content: `${equipmentName}发生${failureType}`,
      type: severity === 'high' ? 'error' : 'warning',
      onClick: () => {
        uni.navigateTo({
          url: `/pages/equipment/detail?id=${equipmentId}`
        })
      }
    })

    try {
      await this.sendSubscribeMessage('equipmentFailure', {
        thing1: { value: equipmentName },
        thing2: { value: failureType },
        thing3: { value: this.getSeverityText(severity) },
        time4: { value: new Date().toLocaleString() }
      })
    } catch (error) {
      console.error('发送设备故障订阅消息失败:', error)
    }
  }

  /**
   * 处理库存预警通知
   */
  async sendInventoryAlert(data) {
    const { materialId, materialName, alertType, currentStock, safetyStock } = data
    
    this.showLocalNotification({
      title: '库存预警',
      content: `${materialName}库存不足`,
      type: 'warning',
      onClick: () => {
        uni.navigateTo({
          url: `/pages/materials/detail?id=${materialId}`
        })
      }
    })

    try {
      await this.sendSubscribeMessage('inventoryAlert', {
        thing1: { value: materialName },
        thing2: { value: alertType },
        number3: { value: currentStock },
        thing4: { value: '请及时补充库存' }
      })
    } catch (error) {
      console.error('发送库存预警订阅消息失败:', error)
    }
  }

  /**
   * 发送订阅消息
   */
  async sendSubscribeMessage(type, data) {
    const tmplId = this.subscribeIds[type]
    if (!tmplId) {
      throw new Error(`未找到类型 ${type} 的模板ID`)
    }

    // 这里应该调用后端API发送订阅消息
    // 实际实现需要后端支持
    console.log('发送订阅消息:', { type, tmplId, data })
  }

  /**
   * 获取严重程度文本
   */
  getSeverityText(severity) {
    const severityMap = {
      low: '轻微',
      medium: '中等',
      high: '严重',
      critical: '紧急'
    }
    return severityMap[severity] || '未知'
  }

  /**
   * 批量处理通知
   */
  async processPendingTasks(tasks) {
    if (!tasks || !Array.isArray(tasks)) return

    for (const task of tasks) {
      try {
        switch (task.type) {
          case 'health_alert':
            await this.sendHealthAlert(task.data)
            break
          case 'feeding_reminder':
            await this.sendFeedingReminder(task.data)
            break
          case 'equipment_failure':
            await this.sendEquipmentFailure(task.data)
            break
          case 'inventory_alert':
            await this.sendInventoryAlert(task.data)
            break
          default:
            console.warn('未知的通知类型:', task.type)
        }
      } catch (error) {
        console.error('处理通知失败:', error)
      }
    }
  }

  /**
   * 清除所有通知
   */
  clearAllNotifications() {
    // 微信小程序没有直接清除通知的API
    // 这里可以实现一些清理逻辑
    console.log('清除所有通知')
  }
}

// 创建单例实例
const notificationManager = new NotificationManager()

export default notificationManager