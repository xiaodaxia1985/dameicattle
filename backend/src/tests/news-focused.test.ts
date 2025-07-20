import { sequelize } from '../config/database';
import { NewsCategory, NewsArticle, NewsComment } from '../models';

// Simple focused test for news models only
describe('News Models - Focused Tests', () => {
  beforeAll(async () => {
    // Ensure database connection
    await sequelize.authenticate();
    
    // Sync only news models
    await NewsCategory.sync({ force: true });
    await NewsArticle.sync({ force: true });
    await NewsComment.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await NewsComment.destroy({ where: {}, force: true });
    await NewsArticle.destroy({ where: {}, force: true });
    await NewsCategory.destroy({ where: {}, force: true });
  });

  describe('NewsCategory Model', () => {
    test('should create a news category successfully', async () => {
      const categoryData = {
        name: '测试分类',
        code: 'TEST_CATEGORY',
        description: '这是一个测试分类',
        sortOrder: 1,
      };

      const category = await NewsCategory.create(categoryData);

      expect(category.id).toBeDefined();
      expect(category.name).toBe(categoryData.name);
      expect(category.code).toBe(categoryData.code);
      expect(category.description).toBe(categoryData.description);
      expect(category.sortOrder).toBe(categoryData.sortOrder);
      expect(category.isActive).toBe(true);
      expect(category.createdAt).toBeDefined();
      expect(category.updatedAt).toBeDefined();
    });

    test('should enforce unique code constraint', async () => {
      const categoryData = {
        name: '测试分类1',
        code: 'DUPLICATE_CODE',
      };

      await NewsCategory.create(categoryData);

      await expect(
        NewsCategory.create({
          name: '测试分类2',
          code: 'DUPLICATE_CODE',
        })
      ).rejects.toThrow();
    });

    test('should validate required fields', async () => {
      await expect(NewsCategory.create({})).rejects.toThrow();
    });
  });

  describe('NewsArticle Model', () => {
    let testCategory: NewsCategory;

    beforeEach(async () => {
      testCategory = await NewsCategory.create({
        name: '测试分类',
        code: 'TEST_CATEGORY',
      });
    });

    test('should create a news article successfully', async () => {
      const articleData = {
        title: '测试文章标题',
        subtitle: '测试文章副标题',
        categoryId: testCategory.id,
        content: '<p>这是测试文章内容</p>',
        summary: '这是文章摘要',
        coverImage: 'https://example.com/image.jpg',
        tags: '测试,新闻,文章',
        authorName: '测试作者',
        status: 'draft' as const,
      };

      const article = await NewsArticle.create(articleData);

      expect(article.id).toBeDefined();
      expect(article.title).toBe(articleData.title);
      expect(article.subtitle).toBe(articleData.subtitle);
      expect(article.categoryId).toBe(articleData.categoryId);
      expect(article.content).toBe(articleData.content);
      expect(article.summary).toBe(articleData.summary);
      expect(article.coverImage).toBe(articleData.coverImage);
      expect(article.tags).toBe(articleData.tags);
      expect(article.authorName).toBe(articleData.authorName);
      expect(article.status).toBe(articleData.status);
      expect(article.isFeatured).toBe(false);
      expect(article.isTop).toBe(false);
      expect(article.viewCount).toBe(0);
      expect(article.likeCount).toBe(0);
      expect(article.commentCount).toBe(0);
      expect(article.createdAt).toBeDefined();
      expect(article.updatedAt).toBeDefined();
    });

    test('should validate required fields', async () => {
      await expect(NewsArticle.create({})).rejects.toThrow();
    });

    test('should set publish time when status is published', async () => {
      const article = await NewsArticle.create({
        title: '测试标题',
        categoryId: testCategory.id,
        content: '测试内容',
        status: 'published',
        publishTime: new Date(),
      });

      expect(article.publishTime).toBeDefined();
    });
  });

  describe('NewsComment Model', () => {
    let testCategory: NewsCategory;
    let testArticle: NewsArticle;

    beforeEach(async () => {
      testCategory = await NewsCategory.create({
        name: '测试分类',
        code: 'TEST_CATEGORY',
      });

      testArticle = await NewsArticle.create({
        title: '测试文章',
        categoryId: testCategory.id,
        content: '测试内容',
      });
    });

    test('should create a news comment successfully', async () => {
      const commentData = {
        articleId: testArticle.id,
        userName: '测试用户',
        userEmail: 'test@example.com',
        content: '这是一条测试评论',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test Browser',
      };

      const comment = await NewsComment.create(commentData);

      expect(comment.id).toBeDefined();
      expect(comment.articleId).toBe(commentData.articleId);
      expect(comment.userName).toBe(commentData.userName);
      expect(comment.userEmail).toBe(commentData.userEmail);
      expect(comment.content).toBe(commentData.content);
      expect(comment.ipAddress).toBe(commentData.ipAddress);
      expect(comment.userAgent).toBe(commentData.userAgent);
      expect(comment.status).toBe('pending');
      expect(comment.isAdminReply).toBe(false);
      expect(comment.createdAt).toBeDefined();
      expect(comment.updatedAt).toBeDefined();
    });

    test('should create a reply comment', async () => {
      const parentComment = await NewsComment.create({
        articleId: testArticle.id,
        userName: '用户1',
        content: '父评论',
      });

      const replyComment = await NewsComment.create({
        articleId: testArticle.id,
        parentId: parentComment.id,
        userName: '用户2',
        content: '回复评论',
      });

      expect(replyComment.parentId).toBe(parentComment.id);
    });

    test('should validate required fields', async () => {
      await expect(NewsComment.create({})).rejects.toThrow();
    });
  });

  describe('Model Associations', () => {
    let testCategory: NewsCategory;
    let testArticle: NewsArticle;

    beforeEach(async () => {
      testCategory = await NewsCategory.create({
        name: '测试分类',
        code: 'TEST_CATEGORY',
      });

      testArticle = await NewsArticle.create({
        title: '测试文章',
        categoryId: testCategory.id,
        content: '测试内容',
      });
    });

    test('should find articles by category', async () => {
      const articles = await NewsArticle.findAll({
        where: { categoryId: testCategory.id },
      });

      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe('测试文章');
    });

    test('should find comments by article', async () => {
      await NewsComment.create({
        articleId: testArticle.id,
        userName: '测试用户',
        content: '测试评论',
      });

      const comments = await NewsComment.findAll({
        where: { articleId: testArticle.id },
      });

      expect(comments).toHaveLength(1);
      expect(comments[0].content).toBe('测试评论');
    });
  });
});