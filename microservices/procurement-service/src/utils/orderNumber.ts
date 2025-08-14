import { ProcurementOrder } from '../models/ProcurementOrder'

/**
 * 生成采购订单号
 * 格式: PO-YYYYMMDD-XXXX
 * 例如: PO-20250814-0001
 */
export const generateOrderNumber = async (): Promise<string> => {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  
  // 查找今天已有的订单数量
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  
  const todayOrderCount = await ProcurementOrder.count({
    where: {
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }
  })
  
  // 生成序号，从1开始
  const sequence = (todayOrderCount + 1).toString().padStart(4, '0')
  
  return `PO-${dateStr}-${sequence}`
}

/**
 * 验证订单号格式
 */
export const validateOrderNumber = (orderNumber: string): boolean => {
  const pattern = /^PO-\d{8}-\d{4}$/
  return pattern.test(orderNumber)
}