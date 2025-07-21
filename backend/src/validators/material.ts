const { body, param, query } = require('express-validator');

// Material Category validators
export const createMaterialCategoryValidator = [
  body('name')
    .notEmpty()
    .withMessage('分类名称不能为空')
    .isLength({ max: 100 })
    .withMessage('分类名称长度不能超过100个字符'),
  body('code')
    .notEmpty()
    .withMessage('分类编码不能为空')
    .isLength({ max: 50 })
    .withMessage('分类编码长度不能超过50个字符')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('分类编码只能包含大写字母、数字和下划线'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述长度不能超过500个字符'),
  body('parent_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('父分类ID必须是正整数'),
];

export const updateMaterialCategoryValidator = [
  param('id').isInt({ min: 1 }).withMessage('分类ID必须是正整数'),
  ...createMaterialCategoryValidator,
];

// Supplier validators
export const createSupplierValidator = [
  body('name')
    .notEmpty()
    .withMessage('供应商名称不能为空')
    .isLength({ max: 100 })
    .withMessage('供应商名称长度不能超过100个字符'),
  body('contact_person')
    .optional()
    .isLength({ max: 100 })
    .withMessage('联系人姓名长度不能超过100个字符'),
  body('phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号码'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('rating')
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage('评级必须是0-5之间的整数'),
  body('supplier_type')
    .optional()
    .isIn(['饲料供应商', '药品供应商', '设备供应商', '添加剂供应商', '其他'])
    .withMessage('供应商类型无效'),
  body('credit_limit')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('信用额度格式无效'),
];

export const updateSupplierValidator = [
  param('id').isInt({ min: 1 }).withMessage('供应商ID必须是正整数'),
  ...createSupplierValidator,
];

// Production Material validators
export const createProductionMaterialValidator = [
  body('name')
    .notEmpty()
    .withMessage('物资名称不能为空')
    .isLength({ max: 100 })
    .withMessage('物资名称长度不能超过100个字符'),
  body('code')
    .notEmpty()
    .withMessage('物资编码不能为空')
    .isLength({ max: 50 })
    .withMessage('物资编码长度不能超过50个字符')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('物资编码只能包含大写字母、数字和下划线'),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  body('unit')
    .notEmpty()
    .withMessage('单位不能为空')
    .isIn(['kg', 'g', 't', 'L', 'ml', '瓶', '袋', '包', '盒', '个'])
    .withMessage('单位无效'),
  body('specification')
    .optional()
    .isLength({ max: 500 })
    .withMessage('规格说明长度不能超过500个字符'),
  body('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('供应商ID必须是正整数'),
  body('purchase_price')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('采购价格格式无效'),
  body('safety_stock')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('安全库存格式无效'),
];

export const updateProductionMaterialValidator = [
  param('id').isInt({ min: 1 }).withMessage('物资ID必须是正整数'),
  ...createProductionMaterialValidator,
];

// Inventory Transaction validators
export const createInventoryTransactionValidator = [
  body('material_id')
    .isInt({ min: 1 })
    .withMessage('物资ID必须是正整数'),
  body('base_id')
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  body('transaction_type')
    .isIn(['入库', '出库', '调拨', '盘点'])
    .withMessage('交易类型无效'),
  body('quantity')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('数量格式无效')
    .custom((value: any) => {
      if (parseFloat(value) <= 0) {
        throw new Error('数量必须大于0');
      }
      return true;
    }),
  body('unit_price')
    .optional()
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('单价格式无效'),
  body('reference_type')
    .optional()
    .isIn(['purchase_order', 'feeding_record', 'health_record', 'manual'])
    .withMessage('关联单据类型无效'),
  body('reference_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('关联单据ID必须是正整数'),
  body('batch_number')
    .optional()
    .isLength({ max: 50 })
    .withMessage('批次号长度不能超过50个字符'),
  body('expiry_date')
    .optional()
    .isISO8601()
    .withMessage('过期日期格式无效'),
  body('remark')
    .optional()
    .isLength({ max: 500 })
    .withMessage('备注长度不能超过500个字符'),
];

// Query validators
export const materialListQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  query('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  query('supplier_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('供应商ID必须是正整数'),
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('状态无效'),
  query('keyword')
    .optional()
    .isLength({ max: 100 })
    .withMessage('关键词长度不能超过100个字符'),
];

export const inventoryQueryValidator = [
  query('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  query('material_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('物资ID必须是正整数'),
  query('low_stock')
    .optional()
    .isBoolean()
    .withMessage('低库存筛选必须是布尔值'),
];

export const transactionQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  query('material_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('物资ID必须是正整数'),
  query('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  query('transaction_type')
    .optional()
    .isIn(['入库', '出库', '调拨', '盘点'])
    .withMessage('交易类型无效'),
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
];

// Common validators
export const idParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID必须是正整数'),
];