import { Request, Response } from 'express';
import { NewsService } from '../services/NewsService';
import { createLogger } from '@cattle-management/shared';

const logger = createLogger('news-controller');
const newsService = new NewsService();

export class NewsController {
  // 新闻分类相关方法
  static async getNewsCategories(req: Request, res: Response) {
    try {
      const { isActive } = req.query;
      const filters = { isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined };

      const categories = await newsService.getNewsCategories(filters);

      res.success(categories, '获取新闻分类成功');
    } catch (error) {
      logger.error('获取新闻分类失败', { error: (error as Error).message });
      res.error('获取新闻分类失败', 500, 'GET_CATEGORIES_FAILED');
    }
  }

  static async createNewsCategory(req: Request, res: Response) {
    try {
      const category = await newsService.createNewsCategory(req.body);
      res.success(category, '新闻分类创建成功');
    } catch (error) {
      logger.error('创建新闻分类失败', { error: (error as Error).message });
      if ((error as Error).message === '分类代码已存在') {
        res.error('分类代码已存在', 400, 'CATEGORY_CODE_EXISTS');
      } else {
        res.error('创建新闻分类失败', 500, 'CREATE_CATEGORY_FAILED');
      }
    }
  }

  static async updateNewsCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await newsService.updateNewsCategory(parseInt(id), req.body);
      res.success(category, '新闻分类更新成功');
    } catch (error) {
      logger.error('更新新闻分类失败', { error: (error as Error).message });
      if ((error as Error).message === '新闻分类不存在') {
        res.error('新闻分类不存在', 404, 'CATEGORY_NOT_FOUND');
      } else if ((error as Error).message === '分类代码已存在') {
        res.error('分类代码已存在', 400, 'CATEGORY_CODE_EXISTS');
      } else {
        res.error('更新新闻分类失败', 500, 'UPDATE_CATEGORY_FAILED');
      }
    }
  }

  static async deleteNewsCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await newsService.deleteNewsCategory(parseInt(id));
      res.success(null, '新闻分类删除成功');
    } catch (error) {
      logger.error('删除新闻分类失败', { error: (error as Error).message });
      if ((error as Error).message === '新闻分类不存在') {
        res.error('新闻分类不存在', 404, 'CATEGORY_NOT_FOUND');
      } else if ((error as Error).message === '该分类下还有文章，无法删除') {
        res.error('该分类下还有文章，无法删除', 400, 'CATEGORY_HAS_ARTICLES');
      } else {
        res.error('删除新闻分类失败', 500, 'DELETE_CATEGORY_FAILED');
      }
    }
  }

  // 新闻文章相关方法
  static async getNewsArticles(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        categoryId,
        status,
        isFeatured,
        isTop,
        keyword
      } = req.query;

      const filters = {
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        status,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        isTop: isTop === 'true' ? true : isTop === 'false' ? false : undefined,
        keyword,
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await newsService.getNewsArticles(filters, pagination);
      res.success(result, '获取新闻文章成功');
    } catch (error) {
      logger.error('获取新闻文章失败', { error: (error as Error).message });
      res.error('获取新闻文章失败', 500, 'GET_ARTICLES_FAILED');
    }
  }

  static async getNewsArticleById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const article = await newsService.getNewsArticleById(parseInt(id));
      res.success(article, '获取新闻文章详情成功');
    } catch (error) {
      logger.error('获取新闻文章详情失败', { error: (error as Error).message });
      if ((error as Error).message === '新闻文章不存在') {
        res.error('新闻文章不存在', 404, 'ARTICLE_NOT_FOUND');
      } else {
        res.error('获取新闻文章详情失败', 500, 'GET_ARTICLE_FAILED');
      }
    }
  }

  static async createNewsArticle(req: Request, res: Response) {
    try {
      const article = await newsService.createNewsArticle(req.body);
      res.success(article, '新闻文章创建成功');
    } catch (error) {
      logger.error('创建新闻文章失败', { error: (error as Error).message });
      if ((error as Error).message === '新闻分类不存在') {
        res.error('新闻分类不存在', 400, 'CATEGORY_NOT_FOUND');
      } else {
        res.error('创建新闻文章失败', 500, 'CREATE_ARTICLE_FAILED');
      }
    }
  }

  static async updateNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const article = await newsService.updateNewsArticle(parseInt(id), req.body);
      res.success(article, '新闻文章更新成功');
    } catch (error) {
      logger.error('更新新闻文章失败', { error: (error as Error).message });
      if ((error as Error).message === '新闻文章不存在') {
        res.error('新闻文章不存在', 404, 'ARTICLE_NOT_FOUND');
      } else if ((error as Error).message === '新闻分类不存在') {
        res.error('新闻分类不存在', 400, 'CATEGORY_NOT_FOUND');
      } else {
        res.error('更新新闻文章失败', 500, 'UPDATE_ARTICLE_FAILED');
      }
    }
  }

  static async deleteNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await newsService.deleteNewsArticle(parseInt(id));
      res.success(null, '新闻文章删除成功');
    } catch (error) {
      logger.error('删除新闻文章失败', { error: (error as Error).message });
      if ((error as Error).message === '新闻文章不存在') {
        res.error('新闻文章不存在', 404, 'ARTICLE_NOT_FOUND');
      } else {
        res.error('删除新闻文章失败', 500, 'DELETE_ARTICLE_FAILED');
      }
    }
  }

  static async publishNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { publishTime } = req.body;
      const article = await newsService.publishNewsArticle(parseInt(id), publishTime ? new Date(publishTime) : undefined);
      res.success(article, '新闻文章发布成功');
    } catch (error) {
      logger.error('发布新闻文章失败', { error: (error as Error).message });
      if ((error as Error).message === '新闻文章不存在') {
        res.error('新闻文章不存在', 404, 'ARTICLE_NOT_FOUND');
      } else {
        res.error('发布新闻文章失败', 500, 'PUBLISH_ARTICLE_FAILED');
      }
    }
  }

  static async incrementViewCount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await newsService.incrementViewCount(parseInt(id));
      res.success(null, '浏览量已更新');
    } catch (error) {
      logger.error('更新浏览量失败', { error: (error as Error).message });
      if ((error as Error).message === '新闻文章不存在或未发布') {
        res.error('新闻文章不存在或未发布', 404, 'ARTICLE_NOT_FOUND');
      } else {
        res.error('更新浏览量失败', 500, 'UPDATE_VIEW_COUNT_FAILED');
      }
    }
  }

  static async searchNewsArticles(req: Request, res: Response) {
    try {
      const { keyword, page = 1, limit = 20 } = req.query;

      if (!keyword) {
        return res.error('搜索关键词不能为空', 400, 'KEYWORD_REQUIRED');
      }

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      };

      const result = await newsService.searchNewsArticles(keyword as string, pagination);
      res.success(result, '搜索新闻文章成功');
    } catch (error) {
      logger.error('搜索新闻文章失败', { error: (error as Error).message });
      res.error('搜索新闻文章失败', 500, 'SEARCH_ARTICLES_FAILED');
    }
  }
}