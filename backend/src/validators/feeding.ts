import { body, param, query } from 'express-validator';

// Feed Formula validators
export const createFeedFormulaValidator = [
  body('name')
    .notEmpty()
    .withMessage('配方名称不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('配方名称长度必须在1-100字符之间'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('配方描述不能超过1000字符'),
  
  body('ingredients')
    .notEmpty()
    .withMessage('配方成分不能为空')
    .isObject()
    .withMessage('配方成分必须是对象格式')
    .custom((value) => {
      if (!value || typeof value !== 'object') {
        throw new Error('配方成分必须是有效的对象');
      }
      
      let totalRatio = 0;
      const ingredientNames = Object.keys(value);
      
      if (ingredientNames.length === 0) {
        throw new Error('至少需要一种配方成分');
      }
      
      for (const [ingredient, details] of Object.entries(value)) {
        if (!details || typeof details !== 'object') {
          throw new Error(`配方成分 ${ingredient} 的详情格式不正确`);
        }
        
        const detailsObj = details as any;
        if (!('ratio' in detailsObj) || !('unit' in detailsObj) || !('cost' in detailsObj)) {
          throw new Error(`配方成分 ${ingredient} 缺少必要字段 (ratio, unit, cost)`);
        }
        
        const ratio = parseFloat(detailsObj.ratio);
        const cost = parseFloat(detailsObj.cost);
        
        if (isNaN(ratio) || ratio <= 0 || ratio > 100) {
          throw new Error(`配方成分 ${ingredient} 的比例必须在 0-100 之间`);
        }
        
        if (isNaN(cost) || cost < 0) {
          throw new Error(`配方成分 ${ingredient} 的成本必须大于等于0`);
        }
        
        totalRatio += ratio;
      }
      
      if (Math.abs(totalRatio - 100) > 0.01) {
        throw new Error(`配方成分比例总和必须等于100%，当前为 ${totalRatio.toFixed(2)}%`);
      }
      
      return true;
    }),
  
  body('cost_per_kg')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('每公斤成本必须大于等于0'),
];

export const updateFeedFormulaValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('配方ID必须是正整数'),
  
  body('name')
    .optional()
    .notEmpty()
    .withMessage('配方名称不能为空')
    .isLength({ min: 1, max: 100 })
    .withMessage('配方名称长度必须在1-100字符之间'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('配方描述不能超过1000字符'),
  
  body('ingredients')
    .optional()
    .isObject()
    .withMessage('配方成分必须是对象格式')
    .custom((value) => {
      if (value && typeof value === 'object') {
        let totalRatio = 0;
        for (const [ingredient, details] of Object.entries(value)) {
          if (!details || typeof details !== 'object') {
            throw new Error(`配方成分 ${ingredient} 的详情格式不正确`);
          }
          
          const detailsObj = details as any;
          if (!('ratio' in detailsObj) || !('unit' in detailsObj) || !('cost' in detailsObj)) {
            throw new Error(`配方成分 ${ingredient} 缺少必要字段 (ratio, unit, cost)`);
          }
          
          const ratio = parseFloat(detailsObj.ratio);
          const cost = parseFloat(detailsObj.cost);
          
          if (isNaN(ratio) || ratio <= 0 || ratio > 100) {
            throw new Error(`配方成分 ${ingredient} 的比例必须在 0-100 之间`);
          }
          
          if (isNaN(cost) || cost < 0) {
            throw new Error(`配方成分 ${ingredient} 的成本必须大于等于0`);
          }
          
          totalRatio += ratio;
        }
        
        if (Math.abs(totalRatio - 100) > 0.01) {
          throw new Error(`配方成分比例总和必须等于100%，当前为 ${totalRatio.toFixed(2)}%`);
        }
      }
      return true;
    }),
  
  body('cost_per_kg')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('每公斤成本必须大于等于0'),
];

export const getFeedFormulaValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('配方ID必须是正整数'),
];

export const getFeedFormulasValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('搜索关键词不能超过100字符'),
  
  query('created_by')
    .optional()
    .isInt({ min: 1 })
    .withMessage('创建者ID必须是正整数'),
];

// Feeding Record validators
export const createFeedingRecordValidator = [
  body('formula_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('配方ID必须是正整数'),
  
  body('base_id')
    .notEmpty()
    .withMessage('基地ID不能为空')
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  body('barn_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
  
  body('amount')
    .notEmpty()
    .withMessage('饲喂量不能为空')
    .isFloat({ min: 0.01, max: 99999.99 })
    .withMessage('饲喂量必须在0.01-99999.99之间'),
  
  body('feeding_date')
    .notEmpty()
    .withMessage('饲喂日期不能为空')
    .isISO8601()
    .withMessage('饲喂日期格式不正确')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      if (date > today) {
        throw new Error('饲喂日期不能是未来日期');
      }
      
      if (date < oneYearAgo) {
        throw new Error('饲喂日期不能超过一年前');
      }
      
      return true;
    }),
  
  body('operator_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('操作员ID必须是正整数'),
];

export const updateFeedingRecordValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('饲喂记录ID必须是正整数'),
  
  body('formula_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('配方ID必须是正整数'),
  
  body('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  body('barn_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 99999.99 })
    .withMessage('饲喂量必须在0.01-99999.99之间'),
  
  body('feeding_date')
    .optional()
    .isISO8601()
    .withMessage('饲喂日期格式不正确')
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        if (date > today) {
          throw new Error('饲喂日期不能是未来日期');
        }
        
        if (date < oneYearAgo) {
          throw new Error('饲喂日期不能超过一年前');
        }
      }
      return true;
    }),
  
  body('operator_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('操作员ID必须是正整数'),
];

export const getFeedingRecordValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('饲喂记录ID必须是正整数'),
];

export const getFeedingRecordsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  
  query('base_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  query('barn_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
  
  query('formula_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('配方ID必须是正整数'),
  
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式不正确')
    .custom((value, { req }) => {
      if (value && req.query.start_date) {
        const startDate = new Date(req.query.start_date as string);
        const endDate = new Date(value);
        
        if (endDate < startDate) {
          throw new Error('结束日期不能早于开始日期');
        }
        
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 365) {
          throw new Error('查询时间范围不能超过365天');
        }
      }
      return true;
    }),
  
  query('operator_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('操作员ID必须是正整数'),
];

// Feeding Statistics validators
export const getFeedingStatisticsValidator = [
  query('base_id')
    .notEmpty()
    .withMessage('基地ID不能为空')
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  query('start_date')
    .notEmpty()
    .withMessage('开始日期不能为空')
    .isISO8601()
    .withMessage('开始日期格式不正确'),
  
  query('end_date')
    .notEmpty()
    .withMessage('结束日期不能为空')
    .isISO8601()
    .withMessage('结束日期格式不正确')
    .custom((value, { req }) => {
      const startDate = new Date(req.query.start_date as string);
      const endDate = new Date(value);
      
      if (endDate < startDate) {
        throw new Error('结束日期不能早于开始日期');
      }
      
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 365) {
        throw new Error('统计时间范围不能超过365天');
      }
      
      return true;
    }),
  
  query('barn_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
  
  query('formula_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('配方ID必须是正整数'),
];

// Batch operations validators
export const batchCreateFeedingRecordsValidator = [
  body('records')
    .isArray({ min: 1, max: 100 })
    .withMessage('批量记录必须是数组，且数量在1-100之间'),
  
  body('records.*.formula_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('配方ID必须是正整数'),
  
  body('records.*.base_id')
    .notEmpty()
    .withMessage('基地ID不能为空')
    .isInt({ min: 1 })
    .withMessage('基地ID必须是正整数'),
  
  body('records.*.barn_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('牛棚ID必须是正整数'),
  
  body('records.*.amount')
    .notEmpty()
    .withMessage('饲喂量不能为空')
    .isFloat({ min: 0.01, max: 99999.99 })
    .withMessage('饲喂量必须在0.01-99999.99之间'),
  
  body('records.*.feeding_date')
    .notEmpty()
    .withMessage('饲喂日期不能为空')
    .isISO8601()
    .withMessage('饲喂日期格式不正确'),
];