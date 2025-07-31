import { Router } from 'express';
import { NewsController } from '@/controllers/NewsController';
import { auth as authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/permission';
import { dataPermissionMiddleware } from '@/middleware/dataPermission';
import { validate } from '@/middleware/validation';
import {
  createNewsCategoryValidator,
  updateNewsCategoryValidator,
  createNewsArticleValidator,
  updateNewsArticleValidator,
  getNewsArticlesValidator,
  idParamValidator,
  publishNewsArticleValidator,
} from '@/validators/news';

const router = Router();

// News Categories Routes
router.get('/categories', NewsController.getNewsCategories);

// 添加一个简单的测试端点
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '新闻模块测试成功',
    timestamp: new Date().toISOString()
  });
});

router.post('/categories', 
  authenticate,
  authorize(['news:create']),
  dataPermissionMiddleware,
  ...createNewsCategoryValidator,
  validate,
  NewsController.createNewsCategory
);

router.put('/categories/:id',
  authenticate,
  authorize(['news:update']),
  dataPermissionMiddleware,
  ...updateNewsCategoryValidator,
  validate,
  NewsController.updateNewsCategory
);

router.delete('/categories/:id',
  authenticate,
  authorize(['news:delete']),
  dataPermissionMiddleware,
  ...idParamValidator,
  validate,
  NewsController.deleteNewsCategory
);

// 添加一个简单的测试端点来验证路由
router.get('/articles/test', (req, res) => {
  console.log('🧪 [NEWS ROUTE TEST] 测试端点被访问');
  res.json({
    success: true,
    message: '新闻文章路由测试成功',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

// News Articles Routes
router.get('/articles',
  ...getNewsArticlesValidator,
  validate,
  NewsController.getNewsArticles
);

router.get('/articles/search',
  ...getNewsArticlesValidator,
  validate,
  NewsController.searchNewsArticles
);

router.get('/articles/:id',
  ...idParamValidator,
  validate,
  NewsController.getNewsArticleById
);

router.post('/articles',
  authenticate,
  authorize(['news:create']),
  dataPermissionMiddleware,
  ...createNewsArticleValidator,
  validate,
  NewsController.createNewsArticle
);

router.put('/articles/:id',
  authenticate,
  authorize(['news:update']),
  dataPermissionMiddleware,
  ...updateNewsArticleValidator,
  validate,
  NewsController.updateNewsArticle
);

router.delete('/articles/:id',
  authenticate,
  authorize(['news:delete']),
  dataPermissionMiddleware,
  ...idParamValidator,
  validate,
  NewsController.deleteNewsArticle
);

router.post('/articles/:id/publish',
  authenticate,
  authorize(['news:update']),
  dataPermissionMiddleware,
  ...publishNewsArticleValidator,
  validate,
  NewsController.publishNewsArticle
);



export default router;