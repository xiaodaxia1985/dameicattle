import { Op } from 'sequelize';
import { NewsCategory, NewsArticle } from '../models';
import { createLogger } from '@cattle-management/shared';

const logger = createLogger('news-service');

export class NewsService {
  // 新闻分类相关方法
  async getNewsCategories(filters: any = {}) {
    try {
      const whereClause: any = {};
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      const categories = await NewsCategory.findAll({
        where: whereClause,
        order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
      });

      return categories;
    } catch (error) {
      logger.error('获取新闻分类失败', { error: (error as Error).message });
      throw error;
    }
  }

  async createNewsCategory(data: any) {
    try {
      // 检查代码是否已存在
      const existingCategory = await NewsCategory.findOne({ where: { code: data.code } });
      if (existingCategory) {
        throw new Error('分类代码已存在');
      }

      const category = await NewsCategory.create({
        name: data.name,
        code: data.code,
        description: data.description,
        sortOrder: data.sortOrder || 0,
      });

      logger.info('新闻分类创建成功', { categoryId: category.id, name: category.name });
      return category;
    } catch (error) {
      logger.error('创建新闻分类失败', { error: (error as Error).message });
      throw error;
    }
  }

  async updateNewsCategory(id: number, data: any) {
    try {
      const category = await NewsCategory.findByPk(id);
      if (!category) {
        throw new Error('新闻分类不存在');
      }

      // 检查代码是否已存在（排除当前分类）
      if (data.code && data.code !== category.code) {
        const existingCategory = await NewsCategory.findOne({ 
          where: { 
            code: data.code,
            id: { [Op.ne]: id }
          } 
        });
        if (existingCategory) {
          throw new Error('分类代码已存在');
        }
      }

      await category.update(data);
      logger.info('新闻分类更新成功', { categoryId: id });
      return category;
    } catch (error) {
      logger.error('更新新闻分类失败', { error: (error as Error).message });
      throw error;
    }
  }

  async deleteNewsCategory(id: number) {
    try {
      const category = await NewsCategory.findByPk(id);
      if (!category) {
        throw new Error('新闻分类不存在');
      }

      // 检查分类下是否有文章
      const articleCount = await NewsArticle.count({ where: { categoryId: id } });
      if (articleCount > 0) {
        throw new Error('该分类下还有文章，无法删除');
      }

      await category.destroy();
      logger.info('新闻分类删除成功', { categoryId: id });
      return true;
    } catch (error) {
      logger.error('删除新闻分类失败', { error: (error as Error).message });
      throw error;
    }
  }

  // 新闻文章相关方法
  async getNewsArticles(filters: any = {}, pagination: any = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;
      const whereClause: any = {};

      // 构建查询条件
      if (filters.categoryId) {
        whereClause.categoryId = filters.categoryId;
      }
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.isFeatured !== undefined) {
        whereClause.isFeatured = filters.isFeatured;
      }
      if (filters.isTop !== undefined) {
        whereClause.isTop = filters.isTop;
      }
      if (filters.keyword) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${filters.keyword}%` } },
          { content: { [Op.iLike]: `%${filters.keyword}%` } },
          { tags: { [Op.iLike]: `%${filters.keyword}%` } },
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
        ],
        order: [
          ['isTop', 'DESC'],
          ['isFeatured', 'DESC'],
          ['createdAt', 'DESC'],
        ],
        limit,
        offset,
      });

      return {
        articles,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('获取新闻文章失败', { error: (error as Error).message });
      throw error;
    }
  }

  async getNewsArticleById(id: number) {
    try {
      const article = await NewsArticle.findByPk(id, {
        include: [
          {
            model: NewsCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
        ],
      });

      if (!article) {
        throw new Error('新闻文章不存在');
      }

      return article;
    } catch (error) {
      logger.error('获取新闻文章详情失败', { error: (error as Error).message });
      throw error;
    }
  }

  async createNewsArticle(data: any) {
    try {
      // 验证分类是否存在
      if (data.categoryId) {
        const category = await NewsCategory.findByPk(data.categoryId);
        if (!category) {
          throw new Error('新闻分类不存在');
        }
      }

      const article = await NewsArticle.create({
        ...data,
        publishTime: data.status === 'published' ? new Date() : undefined,
      });

      logger.info('新闻文章创建成功', { articleId: article.id, title: article.title });
      return article;
    } catch (error) {
      logger.error('创建新闻文章失败', { error: (error as Error).message });
      throw error;
    }
  }

  async updateNewsArticle(id: number, data: any) {
    try {
      const article = await NewsArticle.findByPk(id);
      if (!article) {
        throw new Error('新闻文章不存在');
      }

      // 验证分类是否存在
      if (data.categoryId) {
        const category = await NewsCategory.findByPk(data.categoryId);
        if (!category) {
          throw new Error('新闻分类不存在');
        }
      }

      // 设置发布时间
      if (data.status === 'published' && article.status !== 'published') {
        data.publishTime = new Date();
      }

      await article.update(data);
      logger.info('新闻文章更新成功', { articleId: id });
      return article;
    } catch (error) {
      logger.error('更新新闻文章失败', { error: (error as Error).message });
      throw error;
    }
  }

  async deleteNewsArticle(id: number) {
    try {
      const article = await NewsArticle.findByPk(id);
      if (!article) {
        throw new Error('新闻文章不存在');
      }

      await article.destroy();
      logger.info('新闻文章删除成功', { articleId: id });
      return true;
    } catch (error) {
      logger.error('删除新闻文章失败', { error: (error as Error).message });
      throw error;
    }
  }

  async publishNewsArticle(id: number, publishTime?: Date) {
    try {
      const article = await NewsArticle.findByPk(id);
      if (!article) {
        throw new Error('新闻文章不存在');
      }

      await article.update({
        status: 'published',
        publishTime: publishTime || new Date(),
      });

      logger.info('新闻文章发布成功', { articleId: id });
      return article;
    } catch (error) {
      logger.error('发布新闻文章失败', { error: (error as Error).message });
      throw error;
    }
  }

  async incrementViewCount(id: number) {
    try {
      const article = await NewsArticle.findOne({
        where: { 
          id, 
          status: 'published' 
        }
      });

      if (!article) {
        throw new Error('新闻文章不存在或未发布');
      }

      await article.increment('viewCount');
      logger.debug('浏览量已更新', { articleId: id });
      return true;
    } catch (error) {
      logger.error('更新浏览量失败', { error: (error as Error).message });
      throw error;
    }
  }

  async searchNewsArticles(keyword: string, pagination: any = {}) {
    try {
      if (!keyword) {
        throw new Error('搜索关键词不能为空');
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

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
        limit,
        offset,
      });

      return {
        articles,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('搜索新闻文章失败', { error: (error as Error).message });
      throw error;
    }
  }
}