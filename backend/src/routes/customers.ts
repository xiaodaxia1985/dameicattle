import { Router } from 'express';
import { CustomerController } from '@/controllers/CustomerController';
import { customerValidators } from '@/validators/customer';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { validate } from '@/middleware/validation';

const router = Router();

// 所有路由都需要认证
router.use(auth);

// 获取客户列表
router.get('/', 
  customerValidators.list,
  validate,
  permission('customer:read'),
  CustomerController.getCustomers
);

// 获取客户类型列表
router.get('/types',
  permission('customer:read'),
  CustomerController.getCustomerTypes
);

// 客户价值分析
router.get('/value-analysis',
  customerValidators.valueAnalysis,
  validate,
  permission('customer:read'),
  CustomerController.analyzeCustomerValue
);

// 获取客户详情
router.get('/:id',
  customerValidators.detail,
  validate,
  permission('customer:read'),
  CustomerController.getCustomer
);

// 创建客户
router.post('/',
  customerValidators.create,
  validate,
  permission('customer:create'),
  CustomerController.createCustomer
);

// 更新客户
router.put('/:id',
  customerValidators.update,
  validate,
  permission('customer:update'),
  CustomerController.updateCustomer
);

// 删除客户
router.delete('/:id',
  customerValidators.delete,
  validate,
  permission('customer:delete'),
  CustomerController.deleteCustomer
);

// 获取客户统计信息
router.get('/:id/statistics',
  customerValidators.statistics,
  validate,
  permission('customer:read'),
  CustomerController.getCustomerStatistics
);

// 更新客户信用评级
router.put('/:id/rating',
  customerValidators.updateRating,
  validate,
  permission('customer:update'),
  CustomerController.updateCustomerRating
);

// 获取客户回访记录列表
router.get('/:customer_id/visits',
  customerValidators.visitList,
  validate,
  permission('customer:read'),
  CustomerController.getVisitRecords
);

// 创建客户回访记录
router.post('/:customer_id/visits',
  customerValidators.createVisit,
  validate,
  permission('customer:create'),
  CustomerController.createVisitRecord
);

// 更新客户回访记录
router.put('/visits/:id',
  customerValidators.updateVisit,
  validate,
  permission('customer:update'),
  CustomerController.updateVisitRecord
);

export default router;