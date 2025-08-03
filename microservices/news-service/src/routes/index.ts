import { Router } from 'express';
import { NewsController } from '../controllers/NewsController';

const router = Router();

// 新闻分类路由
router.get('/categories', NewsController.getNewsCategories);
router.post('/categories', NewsController.createNewsCategory);
router.put('/categories/:id', NewsController.updateNewsCategory);
router.delete('/categories/:id', NewsController.deleteNewsCategory);

// 新闻文章路由
router.get('/articles', NewsController.getNewsArticles);
router.get('/articles/search', NewsController.searchNewsArticles);
router.get('/articles/:id', NewsController.getNewsArticleById);
router.post('/articles', NewsController.createNewsArticle);
router.put('/articles/:id', NewsController.updateNewsArticle);
router.delete('/articles/:id', NewsController.deleteNewsArticle);
router.post('/articles/:id/publish', NewsController.publishNewsArticle);
router.post('/articles/:id/view', NewsController.incrementViewCount);

export default router;