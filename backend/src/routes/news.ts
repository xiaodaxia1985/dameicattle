import { Router } from 'express';
import { NewsController } from '@/controllers/NewsController';
import { auth as authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/permission';
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

router.post('/categories', 
  authenticate,
  authorize(['news:create']),
  createNewsCategoryValidator,
  validate,
  NewsController.createNewsCategory
);

router.put('/categories/:id',
  authenticate,
  authorize(['news:update']),
  updateNewsCategoryValidator,
  validate,
  NewsController.updateNewsCategory
);

router.delete('/categories/:id',
  authenticate,
  authorize(['news:delete']),
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
  createNewsArticleValidator,
  validate,
  NewsController.createNewsArticle
);

router.put('/articles/:id',
  authenticate,
  authorize(['news:update']),
  updateNewsArticleValidator,
  validate,
  NewsController.updateNewsArticle
);

router.delete('/articles/:id',
  authenticate,
  authorize(['news:delete']),
  idParamValidator,
  validate,
  NewsController.deleteNewsArticle
);

router.post('/articles/:id/publish',
  authenticate,
  authorize(['news:update']),
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