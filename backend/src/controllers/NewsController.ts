import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { NewsCategory, NewsArticle, User } from '../models';
import { AppError } from '../utils/errors';

export class NewsController {
  // News Category Methods
  static async getNewsCategories(req: Request, res: Response) {
    try {
      const { isActive } = req.query;
      
      const whereClause: any = {};
      if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
      }

      const categories = await NewsCategory.findAll({
        where: whereClause,
        order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      });

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error('获取新闻分类失败:', error);
      res.status(500).json({
        success: false,
        message: '获取新闻分类失败',
      });
    }
  }

  static async createNewsCategory(req: Request, res: Response) {
    try {
      const { name, code, description, sortOrder } = req.body;

      // Check if code already exists
      const existingCategory = await NewsCategory.findOne({ where: { code } });
      if (existingCategory) {
        throw new AppError('分类代码已存在', 400);
      }

      const category = await NewsCategory.create({
        name,
        code,
        description,
        sortOrder: sortOrder || 0,
      });

      res.status(201).json({
        success: true,
        data: category,
        message: '新闻分类创建成功',
      });
    } catch (error) {
      console.error('创建新闻分类失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '创建新闻分类失败',
        });
      }
    }
  }

  static async updateNewsCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code, description, sortOrder, isActive } = req.body;

      const category = await NewsCategory.findByPk(id);
      if (!category) {
        throw new AppError('新闻分类不存在', 404);
      }

      // Check if code already exists (excluding current category)
      if (code && code !== category.code) {
        const existingCategory = await NewsCategory.findOne({ 
          where: { 
            code,
            id: { [Op.ne]: id }
          } 
        });
        if (existingCategory) {
          throw new AppError('分类代码已存在', 400);
        }
      }

      await category.update({
        name: name || category.name,
        code: code || category.code,
        description: description !== undefined ? description : category.description,
        sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder,
        isActive: isActive !== undefined ? isActive : category.isActive,
      });

      res.json({
        success: true,
        data: category,
        message: '新闻分类更新成功',
      });
    } catch (error) {
      console.error('更新新闻分类失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新新闻分类失败',
        });
      }
    }
  }

  static async deleteNewsCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await NewsCategory.findByPk(id);
      if (!category) {
        throw new AppError('新闻分类不存在', 404);
      }

      // Check if category has articles
      const articleCount = await NewsArticle.count({ where: { categoryId: id } });
      if (articleCount > 0) {
        throw new AppError('该分类下还有文章，无法删除', 400);
      }

      await category.destroy();

      res.json({
        success: true,
        message: '新闻分类删除成功',
      });
    } catch (error) {
      console.error('删除新闻分类失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '删除新闻分类失败',
        });
      }
    }
  }

  // News Article Methods
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

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 构建查询条件
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }
      if (status) {
        whereClause.status = status;
      }
      if (isFeatured !== undefined) {
        whereClause.isFeatured = isFeatured === 'true';
      }
      if (isTop !== undefined) {
        whereClause.isTop = isTop === 'true';
      }
      if (keyword) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${keyword}%` } },
          { content: { [Op.iLike]: `%${keyword}%` } },
          { tags: { [Op.iLike]: `%${keyword}%` } },
        ];
      }

      const { count, rows: articles } = await NewsArticle.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'author',
            attributes: ['id', 'real_name'],
          },
        ],
        order: [
          ['isTop', 'DESC'],
          ['isFeatured', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit: Number(limit),
        offset,
      });

      res.json({
        success: true,
        data: articles,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      console.error('获取新闻文章失败:', error);
      res.status(500).json({
        success: false,
        message: '获取新闻文章失败',
      });
    }
  }

  static async getNewsArticleById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const article = await NewsArticle.findByPk(id, {
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: User,
            as: 'author',
            attributes: ['id', 'real_name'],
          },
        ],
      });

      if (!article) {
        throw new AppError('新闻文章不存在', 404);
      }

      res.json({
        success: true,
        data: article,
      });
    } catch (error) {
      console.error('获取新闻文章详情失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '获取新闻文章详情失败',
        });
      }
    }
  }

  static async createNewsArticle(req: Request, res: Response) {
    try {
      const {
        title,
        subtitle,
        categoryId,
        content,
        summary,
        coverImage,
        images,
        tags,
        status = 'draft',
        isFeatured = false,
        isTop = false,
        seoTitle,
        seoKeywords,
        seoDescription,
      } = req.body;

      const userId = (req as any).user?.id;
      const userName = (req as any).user?.real_name;

      // Verify category exists (only if categoryId is provided)
      if (categoryId) {
        const category = await NewsCategory.findByPk(categoryId);
        if (!category) {
          throw new AppError('新闻分类不存在', 400);
        }
      }

      const article = await NewsArticle.create({
        title,
        subtitle,
        categoryId,
        content,
        summary,
        coverImage,
        images,
        tags,
        authorId: userId,
        authorName: userName,
        status,
        isFeatured,
        isTop,
        publishTime: status === 'published' ? new Date() : undefined,
        seoTitle,
        seoKeywords,
        seoDescription,
      });

      res.status(201).json({
        success: true,
        data: article,
        message: '新闻文章创建成功',
      });
    } catch (error) {
      console.error('创建新闻文章失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '创建新闻文章失败',
        });
      }
    }
  }

  static async updateNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const article = await NewsArticle.findByPk(id);
      if (!article) {
        throw new AppError('新闻文章不存在', 404);
      }

      // Verify category exists if categoryId is being updated
      if (updateData.categoryId) {
        const category = await NewsCategory.findByPk(updateData.categoryId);
        if (!category) {
          throw new AppError('新闻分类不存在', 400);
        }
      }

      // Set publish time if status is being changed to published
      if (updateData.status === 'published' && article.status !== 'published') {
        updateData.publishTime = new Date();
      }

      await article.update(updateData);

      res.json({
        success: true,
        data: article,
        message: '新闻文章更新成功',
      });
    } catch (error) {
      console.error('更新新闻文章失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新新闻文章失败',
        });
      }
    }
  }

  static async deleteNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const article = await NewsArticle.findByPk(id);
      if (!article) {
        throw new AppError('新闻文章不存在', 404);
      }

      await article.destroy();

      res.json({
        success: true,
        message: '新闻文章删除成功',
      });
    } catch (error) {
      console.error('删除新闻文章失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '删除新闻文章失败',
        });
      }
    }
  }

  static async publishNewsArticle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { publishTime } = req.body;

      const article = await NewsArticle.findByPk(id);
      if (!article) {
        throw new AppError('新闻文章不存在', 404);
      }

      await article.update({
        status: 'published',
        publishTime: publishTime ? new Date(publishTime) : new Date(),
      });

      res.json({
        success: true,
        data: article,
        message: '新闻文章发布成功',
      });
    } catch (error) {
      console.error('发布新闻文章失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '发布新闻文章失败',
        });
      }
    }
  }



  // Search functionality
  static async searchNewsArticles(req: Request, res: Response) {
    try {
      const { keyword, page = 1, limit = 20 } = req.query;

      if (!keyword) {
        throw new AppError('搜索关键词不能为空', 400);
      }

      const offset = (Number(page) - 1) * Number(limit);

      const { count, rows: articles } = await NewsArticle.findAndCountAll({
        where: {
          status: 'published',
          [Op.or]: [
            { title: { [Op.iLike]: `%${keyword}%` } },
            { content: { [Op.iLike]: `%${keyword}%` } },
            { tags: { [Op.iLike]: `%${keyword}%` } },
          ],
        },
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
        ],
        order: [['publishTime', 'DESC']],
        limit: Number(limit),
        offset,
      });

      res.json({
        success: true,
        data: articles,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      console.error('搜索新闻文章失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '搜索新闻文章失败',
        });
      }
    }
  }

  // ========== 公开接口（门户网站使用） ==========
  
  // 获取公开新闻列表（门户网站使用）
  static async getPublicNews(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        categoryId, 
        status = 'published' 
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = { status };

      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      const { count, rows: articles } = await NewsArticle.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
        ],
        order: [
          ['isTop', 'DESC'],
          ['isFeatured', 'DESC'],
          ['publishTime', 'DESC'],
        ],
        limit: Number(limit),
        offset,
      });

      res.json({
        success: true,
        data: articles,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit)),
        }
      });
    } catch (error) {
      console.error('获取公开新闻失败:', error);
      res.status(500).json({
        success: false,
        message: '获取公开新闻失败',
      });
    }
  }

  // 获取公开新闻详情（门户网站使用）
  static async getPublicNewsById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const article = await NewsArticle.findOne({
        where: { 
          id, 
          status: 'published' 
        },
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      if (!article) {
        throw new AppError('新闻文章不存在或未发布', 404);
      }

      res.json({
        success: true,
        data: article,
      });
    } catch (error) {
      console.error('获取公开新闻详情失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '获取公开新闻详情失败',
        });
      }
    }
  }

  // 增加新闻浏览量
  static async incrementViewCount(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const article = await NewsArticle.findOne({
        where: { 
          id, 
          status: 'published' 
        }
      });

      if (!article) {
        throw new AppError('新闻文章不存在或未发布', 404);
      }

      // 增加浏览量
      await article.increment('viewCount');

      res.json({
        success: true,
        message: '浏览量已更新',
      });
    } catch (error) {
      console.error('更新浏览量失败:', error);
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新浏览量失败',
        });
      }
    }
  }
}