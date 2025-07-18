import request from 'supertest';
import app from '@/app';
import { User, Role, SecurityLog } from '@/models';
import { setupTestDatabase, clearTestData, cleanupTestDatabase } from './helpers/database';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock Redis for tests
jest.mock('@/config/redis', () => ({
  redisClient: {
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
  },
}));

describe('Authentication', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearTestData();
    
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
        status: 'active',
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

    it('should lock account after 5 failed login attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            username: 'testuser',
            password: 'wrongpassword',
          })
          .expect(401);
      }

      // 6th attempt should return account locked error
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_LOCKED');

      // Verify user is locked in database
      const user = await User.findOne({ where: { username: 'testuser' } });
      expect(user?.isAccountLocked()).toBe(true);
    });

    it('should log security events for login attempts', async () => {
      // Successful login
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPass123',
        })
        .expect(200);

      // Failed login
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);

      // Check security logs
      const logs = await SecurityLog.findAll({
        where: { username: 'testuser' },
        order: [['created_at', 'ASC']],
      });

      expect(logs).toHaveLength(2);
      expect(logs[0].event_type).toBe('login_success');
      expect(logs[1].event_type).toBe('login_failed');
    });
  });

  describe('POST /api/v1/auth/request-password-reset', () => {
    beforeEach(async () => {
      await User.create({
        username: 'testuser',
        password_hash: 'TestPass123',
        real_name: '测试用户',
        email: 'test@example.com',
        status: 'active',
      });
    });

    it('should generate password reset token for valid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({
          email: 'test@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('重置密码链接已发送');

      // Verify token was generated in database
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user?.password_reset_token).toBeDefined();
      expect(user?.password_reset_expires).toBeDefined();
    });

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/auth/request-password-reset')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('重置密码链接已发送');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    let resetToken: string;
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        username: 'testuser',
        password_hash: 'TestPass123',
        real_name: '测试用户',
        email: 'test@example.com',
        status: 'active',
      });

      resetToken = await user.generatePasswordResetToken();
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPass123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('密码重置成功');

      // Verify password was changed
      await user.reload();
      const isValidPassword = await user.validatePassword('NewPass123');
      expect(isValidPassword).toBe(true);

      // Verify reset token was cleared
      expect(user.password_reset_token).toBeNull();
      expect(user.password_reset_expires).toBeNull();
    });

    it('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPass123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_RESET_TOKEN');
    });

    it('should return error for expired token', async () => {
      // Manually expire the token
      user.password_reset_expires = new Date(Date.now() - 1000); // 1 second ago
      await user.save();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: resetToken,
          password: 'NewPass123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_RESET_TOKEN');
    });
  });

  describe('POST /api/v1/auth/wechat-login', () => {
    it('should create new user for first-time WeChat login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/wechat-login')
        .send({
          code: 'valid-wechat-code-123',
          userInfo: {
            nickName: '微信用户',
            avatarUrl: 'https://example.com/avatar.jpg',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.isNewUser).toBe(true);
      expect(response.body.data.user.real_name).toBe('微信用户');

      // Verify user was created in database
      const user = await User.findOne({
        where: { wechat_openid: `openid_valid-wechat-code-123_${response.body.data.user.id}` },
      });
      expect(user).toBeDefined();
    });

    it('should login existing WeChat user', async () => {
      // Create existing WeChat user
      const existingUser = await User.create({
        username: 'wx_existing',
        password_hash: 'random-hash',
        real_name: '现有微信用户',
        wechat_openid: 'existing-openid',
        status: 'active',
      });

      // Mock the WeChat API response to return existing openid
      const response = await request(app)
        .post('/api/v1/auth/wechat-login')
        .send({
          code: 'existing-user-code',
          userInfo: {
            nickName: '现有微信用户',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isNewUser).toBe(false);
      expect(response.body.data.user.id).toBe(existingUser.id);
    });

    it('should return error for invalid WeChat code', async () => {
      const response = await request(app)
        .post('/api/v1/auth/wechat-login')
        .send({
          code: 'invalid',
          userInfo: {
            nickName: '用户',
          },
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WECHAT_AUTH_FAILED');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let token: string;
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        username: 'testuser',
        password_hash: 'TestPass123',
        real_name: '测试用户',
        status: 'active',
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPass123',
        });

      token = loginResponse.body.data.token;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(token); // Should be a new token

      // Verify security log was created
      const log = await SecurityLog.findOne({
        where: { 
          user_id: user.id,
          event_type: 'token_refresh',
        },
      });
      expect(log).toBeDefined();
    });

    it('should return error for missing token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let token: string;
    let user: User;

    beforeEach(async () => {
      user = await User.create({
        username: 'testuser',
        password_hash: 'TestPass123',
        real_name: '测试用户',
        status: 'active',
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'TestPass123',
        });

      token = loginResponse.body.data.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('退出登录成功');

      // Verify security log was created
      const log = await SecurityLog.findOne({
        where: { 
          user_id: user.id,
          event_type: 'logout',
        },
      });
      expect(log).toBeDefined();
    });
  });
});