import { Router } from 'express'
import { SupplierController } from '../controllers/SupplierController'
import { authenticateToken, requirePermission } from '../middleware/auth'

const router = Router()
const controller = new SupplierController()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取供应商列表
router.get('/', controller.getSuppliers.bind(controller))

// 获取供应商选项列表（用于下拉选择）
router.get('/options', controller.getSupplierOptions.bind(controller))

// 获取供应商详情
router.get('/:id', controller.getSupplierById.bind(controller))

// 创建供应商
router.post('/', requirePermission('supplier:create'), controller.createSupplier.bind(controller))

// 更新供应商
router.put('/:id', requirePermission('supplier:update'), controller.updateSupplier.bind(controller))

// 删除供应商
router.delete('/:id', requirePermission('supplier:delete'), controller.deleteSupplier.bind(controller))

// 启用/禁用供应商
router.patch('/:id/status', requirePermission('supplier:update'), controller.toggleSupplierStatus.bind(controller))

export default router