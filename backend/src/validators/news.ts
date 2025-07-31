const { body, param, query } = require('express-validator');

// News category validators
export const createNewsCategoryValidator = [
  body('name')
    .notEmpty()
    .withMessage('分类名称不能为空')
    .isLength({ max: 100 })
    .withMessage('分类名称不能超过100个字符'),
  body('code')
    .notEmpty()
    .withMessage('分类代码不能为空')
    .isLength({ max: 50 })
    .withMessage('分类代码不能超过50个字符')
    .matches(/^[A-Z_]+$/)
    .withMessage('分类代码只能包含大写字母和下划线'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('排序必须是非负整数'),
];

export const updateNewsCategoryValidator = [
  param('id').isInt().withMessage('分类ID必须是整数'),
  body('name')
    .optional()
    .notEmpty()
    .withMessage('分类名称不能为空')
    .isLength({ max: 100 })
    .withMessage('分类名称不能超过100个字符'),
  body('code')
    .optional()
    .notEmpty()
    .withMessage('分类代码不能为空')
    .isLength({ max: 50 })
    .withMessage('分类代码不能超过50个字符')
    .matches(/^[A-Z_]+$/)
    .withMessage('分类代码只能包含大写字母和下划线'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('描述不能超过500个字符'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('排序必须是非负整数'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('状态必须是布尔值'),
];

// News article validators
export const createNewsArticleValidator = [
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('文章标题不能超过200个字符'),
  body('subtitle')
    .optional()
    .isLength({ max: 300 })
    .withMessage('副标题不能超过300个字符'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  body('content')
    .optional(),
  body('summary')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('摘要不能超过1000个字符'),
  body('coverImage')
    .optional()
    .custom((value: any) => {
      if (!value || value === '' || value === null || value === undefined) {
        return true; // 允许空值
      }
      // 简单的URL格式检查
      return typeof value === 'string' && /^https?:\/\/.+/.test(value);
    })
    .withMessage('封面图片必须是有效的URL'),
  body('tags')
    .optional()
    .isLength({ max: 500 })
    .withMessage('标签不能超过500个字符'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('状态必须是draft、published或archived'),
  body('isFeatured')
    .optional()
    .custom((value: any) => {
      if (value === undefined || value === null || value === '') {
        return true; // 允许空值
      }
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    })
    .withMessage('推荐状态必须是布尔值'),
  body('isTop')
    .optional()
    .custom((value: any) => {
      if (value === undefined || value === null || value === '') {
        return true; // 允许空值
      }
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    })
    .withMessage('置顶状态必须是布尔值'),
  body('seoTitle')
    .optional()
    .isLength({ max: 200 })
    .withMessage('SEO标题不能超过200个字符'),
  body('seoKeywords')
    .optional()
    .isLength({ max: 500 })
    .withMessage('SEO关键词不能超过500个字符'),
  body('seoDescription')
    .optional()
    .isLength({ max: 500 })
    .withMessage('SEO描述不能超过500个字符'),
];

export const updateNewsArticleValidator = [
  param('id').isInt().withMessage('文章ID必须是整数'),
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('文章标题不能超过200个字符'),
  body('subtitle')
    .optional()
    .isLength({ max: 300 })
    .withMessage('副标题不能超过300个字符'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  body('content')
    .optional(),
  body('summary')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('摘要不能超过1000个字符'),
  body('coverImage')
    .optional()
    .custom((value: any) => {
      if (!value || value === '' || value === null || value === undefined) {
        return true; // 允许空值
      }
      // 简单的URL格式检查
      return typeof value === 'string' && /^https?:\/\/.+/.test(value);
    })
    .withMessage('封面图片必须是有效的URL'),
  body('tags')
    .optional()
    .isLength({ max: 500 })
    .withMessage('标签不能超过500个字符'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('状态必须是draft、published或archived'),
  body('isFeatured')
    .optional()
    .custom((value: any) => {
      if (value === undefined || value === null || value === '') {
        return true; // 允许空值
      }
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    })
    .withMessage('推荐状态必须是布尔值'),
  body('isTop')
    .optional()
    .custom((value: any) => {
      if (value === undefined || value === null || value === '') {
        return true; // 允许空值
      }
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    })
    .withMessage('置顶状态必须是布尔值'),
  body('seoTitle')
    .optional()
    .isLength({ max: 200 })
    .withMessage('SEO标题不能超过200个字符'),
  body('seoKeywords')
    .optional()
    .isLength({ max: 500 })
    .withMessage('SEO关键词不能超过500个字符'),
  body('seoDescription')
    .optional()
    .isLength({ max: 500 })
    .withMessage('SEO描述不能超过500个字符'),
  body('publishTime')
    .optional()
    .isISO8601()
    .withMessage('发布时间格式不正确'),
];



// Query validators
export const getNewsArticlesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须是1-100之间的整数'),
  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('分类ID必须是正整数'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('状态必须是draft、published或archived'),
  query('isFeatured')
    .optional()
    .custom((value: any) => {
      if (value === undefined || value === null || value === '') {
        return true; // 允许空值
      }
      return ['true', 'false', true, false].includes(value);
    })
    .withMessage('推荐状态必须是true或false'),
  query('isTop')
    .optional()
    .custom((value: any) => {
      if (value === undefined || value === null || value === '') {
        return true; // 允许空值
      }
      return ['true', 'false', true, false].includes(value);
    })
    .withMessage('置顶状态必须是true或false'),
  query('keyword')
    .optional()
    .isLength({ max: 100 })
    .withMessage('关键词不能超过100个字符'),
];

export const idParamValidator = [
  param('id').isInt().withMessage('ID必须是整数'),
];

export const publishNewsArticleValidator = [
  param('id').isInt().withMessage('文章ID必须是整数'),
  body('publishTime')
    .optional()
    .isISO8601()
    .withMessage('发布时间格式不正确'),
];