import { Router } from 'express';
import { NewsController } from '../controllers/NewsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 公开接口（门户网站使用）
router.get('/public/articles', NewsController.getPublicNewsArticles);
router.get('/public/articles/:id', NewsController.getNewsArticle);
router.get('/public/categories', NewsController.getNewsCategories);

// 管理接口（需要认证）
router.use(authMiddleware);

// 新闻文章路由
router.get('/articles', NewsController.getNewsArticles);
router.get('/articles/:id', NewsController.getNewsArticle);
router.post('/articles', NewsController.createNewsArticle);
router.put('/articles/:id', NewsController.updateNewsArticle);
router.delete('/articles/:id', NewsController.deleteNewsArticle);

// 新闻分类路由
router.get('/categories', NewsController.getNewsCategories);
router.post('/categories', NewsController.createNewsCategory);
router.put('/categories/:id', NewsController.updateNewsCategory);
router.delete('/categories/:id', NewsController.deleteNewsCategory);

// 统计路由
router.get('/statistics', NewsController.getNewsStatistics);

export default router;