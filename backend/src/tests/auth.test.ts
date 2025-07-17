import request from 'supertest';
import app from '@/app';
import { User, Role } from '@/models';

describe('Authentication', () => {
  beforeEach(async () => {
    // Create a test role
    await Role.create({
      name: 'admin',
      description: 'Administrator role',
      permissions: ['users:read', 'users:create', 'users:update', 'users:delete'],
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123',
        real_name: '测试用户',
        email: 'test@example.com',
        phone: '13800138000',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should return error for duplicate username', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123',
        real_name: '测试用户',
      };

      // Create first user
      await User.create({
        username: userData.username,
        password_hash: userData.password,
        real_name: userData.real_name,
      });

      // Try to create duplicate
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USERNAME_EXISTS');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await User.create({
        username: 'testuser',
        password_hash: 'TestPass123',
        real_name: '测试用户',
        status: 'active',
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPass123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});