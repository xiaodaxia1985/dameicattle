import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { NewsArticle, NewsCategory, User } from '../models';
import { logger } from '../utils/logger';

export class NewsController {
  // 新闻文章管理

  /**
   * 获取新闻文章列表
   */
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

      // 搜索过滤
      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { summary: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // 分类过滤
      if (category_id) {
        whereClause.category_id = category_id;
      }

      // 状态过滤
      if (status) {
        whereClause.status = status;
      }

      // 作者过滤
      if (author_id) {
        whereClause.author_id = author_id;
      }

      // 推荐过滤
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

      res.success({
        articles: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取新闻文章列表成功');
    } catch (error) {
      logger.error('获取新闻文章列表失败:', error);
      res.error('获取新闻文章列表失败', 500, 'NEWS_ARTICLES_ERROR');
    }
  }

  /**
   * 获取单篇新闻文章
   */
  static async getNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const article = await NewsArticle.findByPk(id, {
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

      if (!article) {
        return res.error('新闻文章不存在', 404, 'NEWS_ARTICLE_NOT_FOUND');
      }

      // 增加浏览量
      await article.increment('view_count');

      res.success(article, '获取新闻文章成功');
    } catch (error) {
      logger.error('获取新闻文章失败:', error);
      res.error('获取新闻文章失败', 500, 'GET_NEWS_ARTICLE_ERROR');
    }
  }

  /**
   * 创建新闻文章
   */
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
      const author_id = req.user?.id;

      // 验证分类是否存在
      if (category_id) {
        const category = await NewsCategory.findByPk(category_id);
        if (!category) {
          return res.error('指定的分类不存在', 404, 'CATEGORY_NOT_FOUND');
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

      // 获取完整的文章信息
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

      res.success(fullArticle, '创建新闻文章成功', 201);
    } catch (error) {
      logger.error('创建新闻文章失败:', error);
      res.error('创建新闻文章失败', 500, 'CREATE_NEWS_ARTICLE_ERROR');
    }
  }

  /**
   * 更新新闻文章
   */
  static async updateNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const article = await NewsArticle.findByPk(id);
      if (!article) {
        return res.error('新闻文章不存在', 404, 'NEWS_ARTICLE_NOT_FOUND');
      }

      // 验证分类是否存在（如果更新了分类）
      if (updateData.category_id) {
        const category = await NewsCategory.findByPk(updateData.category_id);
        if (!category) {
          return res.error('指定的分类不存在', 404, 'CATEGORY_NOT_FOUND');
        }
      }

      await article.update(updateData);

      // 获取更新后的完整文章信息
      const updatedArticle = await NewsArticle.findByPk(article.id, {
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

      res.success(updatedArticle, '更新新闻文章成功');
    } catch (error) {
      logger.error('更新新闻文章失败:', error);
      res.error('更新新闻文章失败', 500, 'UPDATE_NEWS_ARTICLE_ERROR');
    }
  }

  /**
   * 删除新闻文章
   */
  static async deleteNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const article = await NewsArticle.findByPk(id);
      if (!article) {
        return res.error('新闻文章不存在', 404, 'NEWS_ARTICLE_NOT_FOUND');
      }

      await article.destroy();

      res.success(null, '删除新闻文章成功');
    } catch (error) {
      logger.error('删除新闻文章失败:', error);
      res.error('删除新闻文章失败', 500, 'DELETE_NEWS_ARTICLE_ERROR');
    }
  }

  // 新闻分类管理

  /**
   * 获取新闻分类列表
   */
  static async getNewsCategories(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status = 'active'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = { status };

      // 搜索过滤
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await NewsCategory.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['sort_order', 'ASC'], ['created_at', 'DESC']]
      });

      res.success({
        categories: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取新闻分类列表成功');
    } catch (error) {
      logger.error('获取新闻分类列表失败:', error);
      res.error('获取新闻分类列表失败', 500, 'NEWS_CATEGORIES_ERROR');
    }
  }

  /**
   * 创建新闻分类
   */
  static async createNewsCategory(req: Request, res: Response) {
    try {
      const {
        name,
        slug,
        description,
        sort_order = 0
      } = req.body;

      // 检查分类名称是否已存在
      const existingCategory = await NewsCategory.findOne({
        where: { 
          [Op.or]: [
            { name },
            { slug }
          ]
        }
      });

      if (existingCategory) {
        return res.error('分类名称或别名已存在', 409, 'CATEGORY_EXISTS');
      }

      const category = await NewsCategory.create({
        name,
        slug,
        description,
        sort_order,
        status: 'active'
      });

      res.success(category, '创建新闻分类成功', 201);
    } catch (error) {
      logger.error('创建新闻分类失败:', error);
      res.error('创建新闻分类失败', 500, 'CREATE_NEWS_CATEGORY_ERROR');
    }
  }

  /**
   * 更新新闻分类
   */
  static async updateNewsCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const category = await NewsCategory.findByPk(id);
      if (!category) {
        return res.error('新闻分类不存在', 404, 'NEWS_CATEGORY_NOT_FOUND');
      }

      // 如果更新名称或别名，检查是否重复
      if (updateData.name || updateData.slug) {
        const whereClause: any = {
          id: { [Op.ne]: id }
        };

        if (updateData.name && updateData.name !== category.name) {
          whereClause[Op.or] = whereClause[Op.or] || [];
          whereClause[Op.or].push({ name: updateData.name });
        }

        if (updateData.slug && updateData.slug !== category.slug) {
          whereClause[Op.or] = whereClause[Op.or] || [];
          whereClause[Op.or].push({ slug: updateData.slug });
        }

        if (whereClause[Op.or]) {
          const existingCategory = await NewsCategory.findOne({ where: whereClause });
          if (existingCategory) {
            return res.error('分类名称或别名已存在', 409, 'CATEGORY_EXISTS');
          }
        }
      }

      await category.update(updateData);

      res.success(category, '更新新闻分类成功');
    } catch (error) {
      logger.error('更新新闻分类失败:', error);
      res.error('更新新闻分类失败', 500, 'UPDATE_NEWS_CATEGORY_ERROR');
    }
  }

  /**
   * 删除新闻分类
   */
  static async deleteNewsCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await NewsCategory.findByPk(id);
      if (!category) {
        return res.error('新闻分类不存在', 404, 'NEWS_CATEGORY_NOT_FOUND');
      }

      // 检查是否有关联的文章
      const articleCount = await NewsArticle.count({
        where: { category_id: id }
      });

      if (articleCount > 0) {
        return res.error('该分类下有文章，无法删除', 400, 'CATEGORY_HAS_ARTICLES');
      }

      await category.destroy();

      res.success(null, '删除新闻分类成功');
    } catch (error) {
      logger.error('删除新闻分类失败:', error);
      res.error('删除新闻分类失败', 500, 'DELETE_NEWS_CATEGORY_ERROR');
    }
  }

  /**
   * 获取新闻统计信息
   */
  static async getNewsStatistics(req: Request, res: Response) {
    try {
      const { start_date, end_date } = req.query;

      const whereClause: any = {};

      // 日期过滤
      if (start_date || end_date) {
        whereClause.created_at = {};
        if (start_date) {
          whereClause.created_at[Op.gte] = start_date;
        }
        if (end_date) {
          whereClause.created_at[Op.lte] = end_date;
        }
      }

      const articles = await NewsArticle.findAll({
        where: whereClause,
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      // 计算统计数据
      const totalArticles = articles.length;
      const publishedArticles = articles.filter(a => a.status === 'published').length;
      const draftArticles = articles.filter(a => a.status === 'draft').length;
      const featuredArticles = articles.filter(a => a.is_featured).length;
      const totalViews = articles.reduce((sum, article) => sum + Number(article.view_count), 0);

      // 按状态统计
      const statusStats = articles.reduce((acc, article) => {
        acc[article.status] = (acc[article.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // 按分类统计
      const categoryStats = articles.reduce((acc, article) => {
        const categoryName = (article as any).category?.name || '未分类';
        if (!acc[categoryName]) {
          acc[categoryName] = { count: 0, views: 0 };
        }
        acc[categoryName].count += 1;
        acc[categoryName].views += Number(article.view_count);
        return acc;
      }, {} as Record<string, { count: number; views: number }>);

      // 按月份统计
      const monthlyStats = articles.reduce((acc, article) => {
        const month = new Date(article.created_at).toISOString().slice(0, 7);
        if (!acc[month]) {
          acc[month] = { count: 0, views: 0 };
        }
        acc[month].count += 1;
        acc[month].views += Number(article.view_count);
        return acc;
      }, {} as Record<string, { count: number; views: number }>);

      const statistics = {
        overview: {
          total_articles: totalArticles,
          published_articles: publishedArticles,
          draft_articles: draftArticles,
          featured_articles: featuredArticles,
          total_views: totalViews,
          average_views: totalArticles > 0 ? totalViews / totalArticles : 0
        },
        status_statistics: statusStats,
        category_statistics: categoryStats,
        monthly_statistics: monthlyStats
      };

      res.success(statistics, '获取新闻统计信息成功');
    } catch (error) {
      logger.error('获取新闻统计信息失败:', error);
      res.error('获取新闻统计信息失败', 500, 'NEWS_STATISTICS_ERROR');
    }
  }

  /**
   * 获取门户网站新闻列表（公开接口）
   */
  static async getPublicNewsArticles(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        category_id,
        is_featured
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = { status: 'published' };

      // 分类过滤
      if (category_id) {
        whereClause.category_id = category_id;
      }

      // 推荐过滤
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
          }
        ],
        attributes: ['id', 'title', 'summary', 'cover_image', 'is_featured', 'view_count', 'created_at'],
        limit: Number(limit),
        offset,
        order: [['is_featured', 'DESC'], ['created_at', 'DESC']]
      });

      res.success({
        articles: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取新闻列表成功');
    } catch (error) {
      logger.error('获取公开新闻列表失败:', error);
      res.error('获取新闻列表失败', 500, 'PUBLIC_NEWS_ERROR');
    }
  }
}