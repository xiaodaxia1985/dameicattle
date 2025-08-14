import { Router } from 'express'
import { ProcurementOrderController } from '../controllers/ProcurementOrderController'
import { authenticateToken, requirePermission } from '../middleware/auth'

const router = Router()
const controller = new ProcurementOrderController()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取采购订单列表
router.get('/', controller.getOrders.bind(controller))

// 获取采购订单详情
router.get('/:id', controller.getOrderById.bind(controller))

// 创建采购订单
router.post('/', requirePermission('procurement:create'), controller.createOrder.bind(controller))

// 更新采购订单
router.put('/:id', requirePermission('procurement:update'), controller.updateOrder.bind(controller))

// 审批采购订单
router.post('/:id/approve', requirePermission('procurement:approve'), controller.approveOrder.bind(controller))

// 取消采购订单
router.post('/:id/cancel', requirePermission('procurement:cancel'), controller.cancelOrder.bind(controller))

// 批量审批订单
router.post('/batch-approve', requirePermission('procurement:approve'), controller.batchApproveOrders.bind(controller))

// 删除采购订单
router.delete('/:id', requirePermission('procurement:delete'), controller.deleteOrder.bind(controller))

// 获取采购统计数据
router.get('/statistics', controller.getStatistics.bind(controller))

export default router