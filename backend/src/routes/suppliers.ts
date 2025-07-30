import { Router } from 'express';
import { SupplierController } from '@/controllers/SupplierController';
import { supplierValidators } from '@/validators/supplier';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { dataPermissionMiddleware } from '@/middleware/dataPermission';
import { validate } from '@/middleware/validation';

const router = Router();

// 所有路由都需要认证和数据权限检查
router.use(auth);
router.use(dataPermissionMiddleware);

// 获取供应商列表
router.get('/', 
  supplierValidators.list,
  validate(supplierValidators.list),
  permission('supplier:read'),
  SupplierController.getSuppliers
);

// 获取供应商类型列表
router.get('/types',
  permission('supplier:read'),
  SupplierController.getSupplierTypes
);

// 获取供应商详情
router.get('/:id',
  supplierValidators.detail,
  validate(supplierValidators.detail),
  permission('supplier:read'),
  SupplierController.getSupplier
);

// 创建供应商
router.post('/',
  supplierValidators.create,
  validate(supplierValidators.create),
  permission('supplier:create'),
  SupplierController.createSupplier
);

// 更新供应商
router.put('/:id',
  supplierValidators.update,
  validate(supplierValidators.update),
  permission('supplier:update'),
  SupplierController.updateSupplier
);

// 删除供应商
router.delete('/:id',
  supplierValidators.delete,
  validate(supplierValidators.delete),
  permission('supplier:delete'),
  SupplierController.deleteSupplier
);

// 获取供应商统计信息
router.get('/:id/statistics',
  supplierValidators.statistics,
  validate(supplierValidators.statistics),
  permission('supplier:read'),
  SupplierController.getSupplierStatistics
);

// 更新供应商评级
router.put('/:id/rating',
  supplierValidators.updateRating,
  validate(supplierValidators.updateRating),
  permission('supplier:update'),
  SupplierController.updateSupplierRating
);

// 供应商对比分析
router.post('/compare',
  supplierValidators.compare,
  validate(supplierValidators.compare),
  permission('supplier:read'),
  SupplierController.compareSuppliers
);

export default router;