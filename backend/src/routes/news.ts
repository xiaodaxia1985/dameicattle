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
  createNewsCommentValidator,
  getNewsArticlesValidator,
  getNewsCommentsValidator,
  idParamValidator,
  publishNewsArticleValidator,
  likeNewsArticleValidator,
  updateCommentStatusValidator,
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
  createNewsCategoryValidator,
  validate,
  NewsController.createNewsCategory
);

router.put('/categories/:id',
  authenticate,
  authorize(['news:update']),
  dataPermissionMiddleware,
  updateNewsCategoryValidator,
  validate,
  NewsController.updateNewsCategory
);

router.delete('/categories/:id',
  authenticate,
  authorize(['news:delete']),
  dataPermissionMiddleware,
  idParamValidator,
  validate,
  NewsController.deleteNewsCategory
);

// News Articles Routes
router.get('/articles',
  getNewsArticlesValidator,
  validate,
  NewsController.getNewsArticles
);

router.get('/articles/search',
  getNewsArticlesValidator,
  validate,
  NewsController.searchNewsArticles
);

router.get('/articles/:id',
  idParamValidator,
  validate,
  NewsController.getNewsArticleById
);

router.post('/articles',
  authenticate,
  authorize(['news:create']),
  dataPermissionMiddleware,
  createNewsArticleValidator,
  validate,
  NewsController.createNewsArticle
);

router.put('/articles/:id',
  authenticate,
  authorize(['news:update']),
  dataPermissionMiddleware,
  updateNewsArticleValidator,
  validate,
  NewsController.updateNewsArticle
);

router.delete('/articles/:id',
  authenticate,
  authorize(['news:delete']),
  dataPermissionMiddleware,
  idParamValidator,
  validate,
  NewsController.deleteNewsArticle
);

router.post('/articles/:id/publish',
  authenticate,
  authorize(['news:update']),
  dataPermissionMiddleware,
  publishNewsArticleValidator,
  validate,
  NewsController.publishNewsArticle
);

router.post('/articles/:id/like',
  likeNewsArticleValidator,
  validate,
  NewsController.likeNewsArticle
);

// News Comments Routes
router.get('/articles/:articleId/comments',
  getNewsCommentsValidator,
  validate,
  NewsController.getNewsComments
);

router.post('/articles/:articleId/comments',
  createNewsCommentValidator,
  validate,
  NewsController.createNewsComment
);

router.put('/comments/:id/status',
  authenticate,
  authorize(['news:update']),
  updateCommentStatusValidator,
  validate,
  NewsController.updateCommentStatus
);

router.delete('/comments/:id',
  authenticate,
  authorize(['news:delete']),
  idParamValidator,
  validate,
  NewsController.deleteNewsComment
);

export default router;