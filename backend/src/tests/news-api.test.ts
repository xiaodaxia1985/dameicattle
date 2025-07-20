import request from 'supertest';
import app from '../app';
import { NewsCategory, NewsArticle, NewsComment, User, Role } from '../models';
import { generateToken } from '../utils/auth';

describe('News API Tests', () => {
  let authToken: string;
  let testUser: User;
  let testCategory: NewsCategory;
  let testArticle: NewsArticle;

  beforeAll(async () => {
    // Create test role
    const role = await Role.create({
      name: '测试角色',
      permissions: ['news:read', 'news:create', 'news:update', 'news:delete'],
    });

    // Create test user
    testUser = await User.create({
      username: 'newstest',
      passwordHash: 'hashedpassword',
      realName: '新闻测试用户',
      email: 'newstest@example.com',
      roleId: role.id,
    });

    authToken = generateToken(testUser);
  });

  beforeEach(async () => {
    // Create test category
    testCategory = await NewsCategory.create({
      name: '测试分类',
      code: 'TEST_CATEGORY',
      description: '测试分类描述',
    });

    // Create test article
    testArticle = await NewsArticle.create({
      title: '测试文章',
      categoryId: testCategory.id,
      content: '测试文章内容',
      authorId: testUser.id,
      authorName: testUser.realName,
      status: 'published',
      publishTime: new Date(),
    });
  });

  describe('News Categories API', () => {
    describe('GET /api/v1/news/categories', () => {
      test('should get all news categories', async () => {
        const response = await request(app)
          .get('/api/v1/news/categories')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        const category = response.body.data.find((c: any) => c.id === testCategory.id);
        expect(category).toBeDefined();
        expect(category.name).toBe(testCategory.name);
        expect(category.code).toBe(testCategory.code);
      });

      test('should filter categories by active status', async () => {
        await NewsCategory.create({
          name: '非活跃分类',
          code: 'INACTIVE_CATEGORY',
          isActive: false,
        });

        const response = await request(app)
          .get('/api/v1/news/categories?isActive=true')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.every((c: any) => c.isActive === true)).toBe(true);
      });
    });

    describe('POST /api/v1/news/categories', () => {
      test('should create a new news category', async () => {
        const categoryData = {
          name: '新分类',
          code: 'NEW_CATEGORY',
          description: '新分类描述',
          sortOrder: 10,
        };

        const response = await request(app)
          .post('/api/v1/news/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send(categoryData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(categoryData.name);
        expect(response.body.data.code).toBe(categoryData.code);
        expect(response.body.data.description).toBe(categoryData.description);
        expect(response.body.data.sortOrder).toBe(categoryData.sortOrder);
      });

      test('should reject duplicate category code', async () => {
        const categoryData = {
          name: '重复分类',
          code: testCategory.code,
        };

        const response = await request(app)
          .post('/api/v1/news/categories')
          .set('Authorization', `Bearer ${authToken}`)
          .send(categoryData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('已存在');
      });

      test('should require authentication', async () => {
        const categoryData = {
          name: '新分类',
          code: 'NEW_CATEGORY',
        };

        await request(app)
          .post('/api/v1/news/categories')
          .send(categoryData)
          .expect(401);
      });
    });

    describe('PUT /api/v1/news/categories/:id', () => {
      test('should update a news category', async () => {
        const updateData = {
          name: '更新后的分类名',
          description: '更新后的描述',
          sortOrder: 5,
        };

        const response = await request(app)
          .put(`/api/v1/news/categories/${testCategory.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.name).toBe(updateData.name);
        expect(response.body.data.description).toBe(updateData.description);
        expect(response.body.data.sortOrder).toBe(updateData.sortOrder);
      });

      test('should return 404 for non-existent category', async () => {
        const response = await request(app)
          .put('/api/v1/news/categories/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: '更新名称' })
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('DELETE /api/v1/news/categories/:id', () => {
      test('should delete a news category', async () => {
        const emptyCategory = await NewsCategory.create({
          name: '空分类',
          code: 'EMPTY_CATEGORY',
        });

        const response = await request(app)
          .delete(`/api/v1/news/categories/${emptyCategory.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        const deletedCategory = await NewsCategory.findByPk(emptyCategory.id);
        expect(deletedCategory).toBeNull();
      });

      test('should not delete category with articles', async () => {
        const response = await request(app)
          .delete(`/api/v1/news/categories/${testCategory.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('还有文章');
      });
    });
  });

  describe('News Articles API', () => {
    describe('GET /api/v1/news/articles', () => {
      test('should get all news articles', async () => {
        const response = await request(app)
          .get('/api/v1/news/articles')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.total).toBeGreaterThan(0);
      });

      test('should filter articles by category', async () => {
        const response = await request(app)
          .get(`/api/v1/news/articles?categoryId=${testCategory.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.every((a: any) => a.categoryId === testCategory.id)).toBe(true);
      });

      test('should filter articles by status', async () => {
        const response = await request(app)
          .get('/api/v1/news/articles?status=published')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.every((a: any) => a.status === 'published')).toBe(true);
      });

      test('should search articles by keyword', async () => {
        const response = await request(app)
          .get('/api/v1/news/articles?keyword=测试')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      test('should support pagination', async () => {
        const response = await request(app)
          .get('/api/v1/news/articles?page=1&limit=5')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(5);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });
    });

    describe('GET /api/v1/news/articles/:id', () => {
      test('should get article by id', async () => {
        const response = await request(app)
          .get(`/api/v1/news/articles/${testArticle.id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(testArticle.id);
        expect(response.body.data.title).toBe(testArticle.title);
        expect(response.body.data.category).toBeDefined();
        expect(response.body.data.author).toBeDefined();
      });

      test('should return 404 for non-existent article', async () => {
        const response = await request(app)
          .get('/api/v1/news/articles/99999')
          .expect(404);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/v1/news/articles', () => {
      test('should create a new news article', async () => {
        const articleData = {
          title: '新文章标题',
          subtitle: '新文章副标题',
          categoryId: testCategory.id,
          content: '<p>新文章内容</p>',
          summary: '新文章摘要',
          tags: '新闻,测试',
          status: 'draft',
        };

        const response = await request(app)
          .post('/api/v1/news/articles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(articleData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(articleData.title);
        expect(response.body.data.categoryId).toBe(articleData.categoryId);
        expect(response.body.data.authorId).toBe(testUser.id);
        expect(response.body.data.status).toBe(articleData.status);
      });

      test('should require valid category', async () => {
        const articleData = {
          title: '新文章标题',
          categoryId: 99999,
          content: '新文章内容',
        };

        const response = await request(app)
          .post('/api/v1/news/articles')
          .set('Authorization', `Bearer ${authToken}`)
          .send(articleData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('不存在');
      });

      test('should require authentication', async () => {
        const articleData = {
          title: '新文章标题',
          categoryId: testCategory.id,
          content: '新文章内容',
        };

        await request(app)
          .post('/api/v1/news/articles')
          .send(articleData)
          .expect(401);
      });
    });

    describe('PUT /api/v1/news/articles/:id', () => {
      test('should update a news article', async () => {
        const updateData = {
          title: '更新后的标题',
          content: '<p>更新后的内容</p>',
          status: 'published',
        };

        const response = await request(app)
          .put(`/api/v1/news/articles/${testArticle.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(updateData.title);
        expect(response.body.data.content).toBe(updateData.content);
        expect(response.body.data.status).toBe(updateData.status);
      });
    });

    describe('POST /api/v1/news/articles/:id/publish', () => {
      test('should publish a news article', async () => {
        const draftArticle = await NewsArticle.create({
          title: '草稿文章',
          categoryId: testCategory.id,
          content: '草稿内容',
          status: 'draft',
        });

        const response = await request(app)
          .post(`/api/v1/news/articles/${draftArticle.id}/publish`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('published');
        expect(response.body.data.publishTime).toBeDefined();
      });
    });

    describe('POST /api/v1/news/articles/:id/like', () => {
      test('should like a news article', async () => {
        const response = await request(app)
          .post(`/api/v1/news/articles/${testArticle.id}/like`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('点赞成功');
      });
    });

    describe('DELETE /api/v1/news/articles/:id', () => {
      test('should delete a news article', async () => {
        const articleToDelete = await NewsArticle.create({
          title: '待删除文章',
          categoryId: testCategory.id,
          content: '待删除内容',
        });

        const response = await request(app)
          .delete(`/api/v1/news/articles/${articleToDelete.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        const deletedArticle = await NewsArticle.findByPk(articleToDelete.id);
        expect(deletedArticle).toBeNull();
      });
    });
  });

  describe('News Comments API', () => {
    describe('GET /api/v1/news/articles/:articleId/comments', () => {
      test('should get comments for an article', async () => {
        await NewsComment.create({
          articleId: testArticle.id,
          userName: '测试用户',
          content: '测试评论',
          status: 'approved',
        });

        const response = await request(app)
          .get(`/api/v1/news/articles/${testArticle.id}/comments`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.pagination).toBeDefined();
      });

      test('should filter comments by status', async () => {
        await NewsComment.create({
          articleId: testArticle.id,
          userName: '测试用户',
          content: '待审核评论',
          status: 'pending',
        });

        const response = await request(app)
          .get(`/api/v1/news/articles/${testArticle.id}/comments?status=pending`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.every((c: any) => c.status === 'pending')).toBe(true);
      });
    });

    describe('POST /api/v1/news/articles/:articleId/comments', () => {
      test('should create a new comment', async () => {
        const commentData = {
          userName: '测试用户',
          userEmail: 'test@example.com',
          content: '这是一条测试评论',
        };

        const response = await request(app)
          .post(`/api/v1/news/articles/${testArticle.id}/comments`)
          .send(commentData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.userName).toBe(commentData.userName);
        expect(response.body.data.content).toBe(commentData.content);
        expect(response.body.data.status).toBe('pending');
      });

      test('should create a reply comment', async () => {
        const parentComment = await NewsComment.create({
          articleId: testArticle.id,
          userName: '父评论用户',
          content: '父评论内容',
        });

        const replyData = {
          userName: '回复用户',
          content: '回复内容',
          parentId: parentComment.id,
        };

        const response = await request(app)
          .post(`/api/v1/news/articles/${testArticle.id}/comments`)
          .send(replyData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.parentId).toBe(parentComment.id);
      });

      test('should validate required fields', async () => {
        const response = await request(app)
          .post(`/api/v1/news/articles/${testArticle.id}/comments`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('PUT /api/v1/news/comments/:id/status', () => {
      test('should update comment status', async () => {
        const comment = await NewsComment.create({
          articleId: testArticle.id,
          userName: '测试用户',
          content: '测试评论',
          status: 'pending',
        });

        const response = await request(app)
          .put(`/api/v1/news/comments/${comment.id}/status`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status: 'approved' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('approved');
      });
    });

    describe('DELETE /api/v1/news/comments/:id', () => {
      test('should delete a comment', async () => {
        const comment = await NewsComment.create({
          articleId: testArticle.id,
          userName: '测试用户',
          content: '待删除评论',
        });

        const response = await request(app)
          .delete(`/api/v1/news/comments/${comment.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);

        const deletedComment = await NewsComment.findByPk(comment.id);
        expect(deletedComment).toBeNull();
      });
    });
  });

  describe('News Search API', () => {
    describe('GET /api/v1/news/articles/search', () => {
      test('should search articles by keyword', async () => {
        const response = await request(app)
          .get('/api/v1/news/articles/search?keyword=测试')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.pagination).toBeDefined();
      });

      test('should require keyword parameter', async () => {
        const response = await request(app)
          .get('/api/v1/news/articles/search')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('关键词');
      });

      test('should only return published articles', async () => {
        await NewsArticle.create({
          title: '草稿测试文章',
          categoryId: testCategory.id,
          content: '草稿测试内容',
          status: 'draft',
        });

        const response = await request(app)
          .get('/api/v1/news/articles/search?keyword=测试')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.every((a: any) => a.status === 'published')).toBe(true);
      });
    });
  });
});