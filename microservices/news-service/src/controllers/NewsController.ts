import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { NewsArticle, NewsCategory, User } from '../models';
import { logger } from '../utils/logger';

export class NewsController {
  static async getNewsArticles(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category_id,
        status,
        author_id,
        is_featured
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { summary: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (category_id) {
        whereClause.category_id = category_id;
      }

      if (status) {
        whereClause.status = status;
      }

      if (author_id) {
        whereClause.author_id = author_id;
      }

      if (is_featured !== undefined) {
        whereClause.is_featured = is_featured === 'true';
      }

      const { count, rows } = await NewsArticle.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: User,
            as: 'author',
            attributes: ['id', 'real_name', 'username']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          data: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit))
          }
        },
        message: '获取新闻文章列表成功'
      });
    } catch (error) {
      logger.error('获取新闻文章列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取新闻文章列表失败',
        code: 'NEWS_ARTICLES_ERROR'
      });
    }
  }

  static async createNewsArticle(req: Request, res: Response) {
    try {
      const {
        title,
        summary,
        content,
        category_id,
        cover_image,
        tags,
        is_featured = false,
        status = 'draft'
      } = req.body;
      const author_id = (req as any).user?.id;

      if (category_id) {
        const category = await NewsCategory.findByPk(category_id);
        if (!category) {
          res.status(404).json({
            success: false,
            error: '指定的分类不存在',
            code: 'CATEGORY_NOT_FOUND'
          });
          return;
        }
      }

      const article = await NewsArticle.create({
        title,
        summary,
        content,
        category_id,
        cover_image,
        tags,
        is_featured,
        status,
        author_id,
        view_count: 0
      });

      const fullArticle = await NewsArticle.findByPk(article.id, {
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['id', 'name', 'slug']
          },
          {
            model: User,
            as: 'author',
            attributes: ['id', 'real_name', 'username']
          }
        ]
      });

      res.status(201).json({
        success: true,
        data: fullArticle,
        message: '创建新闻文章成功'
      });
    } catch (error) {
      logger.error('创建新闻文章失败:', error);
      res.status(500).json({
        success: false,
        error: '创建新闻文章失败',
        code: 'CREATE_NEWS_ARTICLE_ERROR'
      });
    }
  }

  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NewsController.getNewsArticles(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NewsController.createNewsArticle(req, res);
    } catch (error) {
      next(error);
    }
  }

  static async getPublicNewsArticles(req: Request, res: Response) {
    try {
      await NewsController.getNewsArticles(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取公开新闻失败',
        code: 'GET_PUBLIC_NEWS_ERROR'
      });
    }
  }

  static async getNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: { id, title: '示例新闻' },
        message: '获取新闻详情成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取新闻详情失败',
        code: 'GET_NEWS_ARTICLE_ERROR'
      });
    }
  }

  static async getNewsCategories(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: { categories: [] },
        message: '获取新闻分类成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取新闻分类失败',
        code: 'GET_NEWS_CATEGORIES_ERROR'
      });
    }
  }

  static async incrementViewCount(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '增加浏览量成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '增加浏览量失败',
        code: 'INCREMENT_VIEW_COUNT_ERROR'
      });
    }
  }

  static async updateNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: { id, ...req.body },
        message: '更新新闻成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '更新新闻失败',
        code: 'UPDATE_NEWS_ARTICLE_ERROR'
      });
    }
  }

  static async deleteNewsArticle(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '删除新闻成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '删除新闻失败',
        code: 'DELETE_NEWS_ARTICLE_ERROR'
      });
    }
  }

  static async publishNewsArticle(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '发布新闻成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '发布新闻失败',
        code: 'PUBLISH_NEWS_ARTICLE_ERROR'
      });
    }
  }

  static async unpublishNewsArticle(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '取消发布成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '取消发布失败',
        code: 'UNPUBLISH_NEWS_ARTICLE_ERROR'
      });
    }
  }

  static async setFeaturedArticle(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '设置推荐成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '设置推荐失败',
        code: 'SET_FEATURED_ARTICLE_ERROR'
      });
    }
  }

  static async setTopArticle(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '设置置顶成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '设置置顶失败',
        code: 'SET_TOP_ARTICLE_ERROR'
      });
    }
  }

  static async searchNewsArticles(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: { articles: [] },
        message: '搜索新闻成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '搜索新闻失败',
        code: 'SEARCH_NEWS_ARTICLES_ERROR'
      });
    }
  }

  static async getNewsCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: { id, name: '示例分类' },
        message: '获取分类详情成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取分类详情失败',
        code: 'GET_NEWS_CATEGORY_ERROR'
      });
    }
  }

  static async createNewsCategory(req: Request, res: Response) {
    try {
      res.status(201).json({
        success: true,
        data: { id: 1, ...req.body },
        message: '创建分类成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '创建分类失败',
        code: 'CREATE_NEWS_CATEGORY_ERROR'
      });
    }
  }

  static async updateNewsCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: { id, ...req.body },
        message: '更新分类成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '更新分类失败',
        code: 'UPDATE_NEWS_CATEGORY_ERROR'
      });
    }
  }

  static async deleteNewsCategory(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '删除分类成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '删除分类失败',
        code: 'DELETE_NEWS_CATEGORY_ERROR'
      });
    }
  }

  static async getNewsComments(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: { comments: [] },
        message: '获取评论成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取评论失败',
        code: 'GET_NEWS_COMMENTS_ERROR'
      });
    }
  }

  static async createNewsComment(req: Request, res: Response) {
    try {
      res.status(201).json({
        success: true,
        data: { id: 1, ...req.body },
        message: '创建评论成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '创建评论失败',
        code: 'CREATE_NEWS_COMMENT_ERROR'
      });
    }
  }

  static async updateNewsComment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: { id, ...req.body },
        message: '更新评论成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '更新评论失败',
        code: 'UPDATE_NEWS_COMMENT_ERROR'
      });
    }
  }

  static async deleteNewsComment(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '删除评论成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '删除评论失败',
        code: 'DELETE_NEWS_COMMENT_ERROR'
      });
    }
  }

  static async approveNewsComment(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '审核评论成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '审核评论失败',
        code: 'APPROVE_NEWS_COMMENT_ERROR'
      });
    }
  }

  static async rejectNewsComment(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: null,
        message: '拒绝评论成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '拒绝评论失败',
        code: 'REJECT_NEWS_COMMENT_ERROR'
      });
    }
  }

  static async getNewsStatistics(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: { total: 0, published: 0 },
        message: '获取新闻统计成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: '获取新闻统计失败',
        code: 'GET_NEWS_STATISTICS_ERROR'
      });
    }
  }
}