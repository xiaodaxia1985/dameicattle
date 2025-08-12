import { Router } from 'express';
import { NewsController } from '../controllers/NewsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 公开接口（门户网站使用）
router.get('/public/articles', NewsController.getPublicNewsArticles);
router.get('/public/articles/:id', NewsController.getNewsArticle);
router.get('/public/categories', NewsController.getNewsCategories);
router.post('/public/articles/:id/view', NewsController.incrementViewCount);

// 管理接口（需要认证）
router.use(authMiddleware);

// 新闻文章路由
router.get('/articles', NewsController.getNewsArticles);
router.get('/articles/:id', NewsController.getNewsArticle);
router.post('/articles', NewsController.createNewsArticle);
router.put('/articles/:id', NewsController.updateNewsArticle);
router.delete('/articles/:id', NewsController.deleteNewsArticle);

// 新闻文章发布管理
router.post('/articles/:id/publish', NewsController.publishNewsArticle);
router.post('/articles/:id/unpublish', NewsController.unpublishNewsArticle);
router.post('/articles/:id/feature', NewsController.setFeaturedArticle);
router.post('/articles/:id/top', NewsController.setTopArticle);

// 新闻文章搜索
router.get('/articles/search', NewsController.searchNewsArticles);

// 新闻文章浏览量
router.post('/articles/:id/view', NewsController.incrementViewCount);

// 新闻分类路由
router.get('/categories', NewsController.getNewsCategories);
router.get('/categories/:id', NewsController.getNewsCategoryById);
router.post('/categories', NewsController.createNewsCategory);
router.put('/categories/:id', NewsController.updateNewsCategory);
router.delete('/categories/:id', NewsController.deleteNewsCategory);

// 新闻评论路由
router.get('/articles/:articleId/comments', NewsController.getNewsComments);
router.post('/articles/:articleId/comments', NewsController.createNewsComment);
router.put('/comments/:id', NewsController.updateNewsComment);
router.delete('/comments/:id', NewsController.deleteNewsComment);
router.post('/comments/:id/approve', NewsController.approveNewsComment);
router.post('/comments/:id/reject', NewsController.rejectNewsComment);

// 统计路由
router.get('/statistics', NewsController.getNewsStatistics);

export default router;