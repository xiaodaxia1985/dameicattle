import request from 'supertest';
import { Sequelize, DataTypes, Op } from 'sequelize';
import express from 'express';
import bcrypt from 'bcryptjs';
import { AuthController } from '@/controllers/AuthController';
import { validateRequest } from '@/middleware/validation';
import { loginSchema, registerSchema, passwordResetRequestSchema, passwordResetSchema, wechatLoginSchema } from '@/validators/auth';

// Mock Redis
jest.mock('@/config/redis', () => ({
  redisClient: {
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
  },
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Authentication API', () => {
  let app: express.Application;
  let sequelize: Sequelize;
  let User: any;
  let Role: any;
  let SecurityLog: any;

  beforeAll(async () => {
    // Setup test PostgreSQL database
    sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cattle_management_test',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      logging: false,
    });

    // Define models
    Role = sequelize.define('Role', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'roles', timestamps: false, underscored: true });

    User = sequelize.define('User', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      real_name: { type: DataTypes.STRING(100), allowNull: false },
      email: { type: DataTypes.STRING(100), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      role_id: { type: DataTypes.INTEGER, allowNull: true },
      base_id: { type: DataTypes.INTEGER, allowNull: true },
      status: { type: DataTypes.ENUM('active', 'inactive', 'locked'), allowNull: false, defaultValue: 'active' },
      failed_login_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      locked_until: { type: DataTypes.DATE, allowNull: true },
      last_login: { type: DataTypes.DATE, allowNull: true },
      password_reset_token: { type: DataTypes.STRING(255), allowNull: true },
      password_reset_expires: { type: DataTypes.DATE, allowNull: true },
      wechat_openid: { type: DataTypes.STRING(100), allowNull: true, unique: true },
      wechat_unionid: { type: DataTypes.STRING(100), allowNull: true, unique: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { 
      tableName: 'users', 
      timestamps: true, 
      underscored: true,
      hooks: {
        beforeCreate: async (user: any) => {
          if (user.password_hash) {
            user.password_hash = await bcrypt.hash(user.password_hash, 12);
          }
        },
        beforeUpdate: async (user: any) => {
          if (user.changed('password_hash')) {
            user.password_hash = await bcrypt.hash(user.password_hash, 12);
          }
        },
      },
    });

    SecurityLog = sequelize.define('SecurityLog', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER, allowNull: true },
      username: { type: DataTypes.STRING(50), allowNull: true },
      event_type: { type: DataTypes.ENUM('login_success', 'login_failed', 'logout', 'password_reset', 'account_locked', 'token_refresh'), allowNull: false },
      ip_address: { type: DataTypes.STRING(45), allowNull: false },
      user_agent: { type: DataTypes.TEXT, allowNull: true },
      details: { type: DataTypes.JSON, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, { tableName: 'security_logs', timestamps: false, underscored: true });

    // Add instance methods to User
    User.prototype.validatePassword = async function(password: string): Promise<boolean> {
      return bcrypt.compare(password, this.password_hash);
    };

    User.prototype.toJSON = function(): any {
      const values = { ...this.get() };
      delete values.password_hash;
      delete values.password_reset_token;
      return values;
    };

    User.prototype.isAccountLocked = function(): boolean {
      return this.locked_until ? new Date() < this.locked_until : false;
    };

    User.prototype.incrementFailedAttempts = async function(): Promise<void> {
      const maxAttempts = 5;
      const lockoutDuration = 30 * 60 * 1000; // 30 minutes

      this.failed_login_attempts += 1;

      if (this.failed_login_attempts >= maxAttempts) {
        this.locked_until = new Date(Date.now() + lockoutDuration);
        this.status = 'locked';
      }

      await this.save();
    };

    User.prototype.resetFailedAttempts = async function(): Promise<void> {
      this.failed_login_attempts = 0;
      this.locked_until = null;
      if (this.status === 'locked') {
        this.status = 'active';
      }
      this.last_login = new Date();
      await this.save();
    };

    User.prototype.generatePasswordResetToken = async function(): Promise<string> {
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      this.password_reset_token = hashedToken;
      this.password_reset_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await this.save();
      
      return token; // Return unhashed token for email
    };

    User.prototype.resetPassword = async function(token: string, newPassword: string): Promise<boolean> {
      const crypto = require('crypto');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      if (
        this.password_reset_token !== hashedToken ||
        !this.password_reset_expires ||
        new Date() > this.password_reset_expires
      ) {
        return false;
      }

      this.password_hash = await bcrypt.hash(newPassword, 12);
      this.password_reset_token = null;
      this.password_reset_expires = null;
      this.failed_login_attempts = 0;
      this.locked_until = null;
      if (this.status === 'locked') {
        this.status = 'active';
      }
      
      await this.save();
      return true;
    };

    // Add static methods
    User.findByResetToken = async function(token: string): Promise<any> {
      const crypto = require('crypto');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      return User.findOne({
        where: {
          password_reset_token: hashedToken,
          password_reset_expires: {
            [Op.gt]: new Date(),
          },
        },
      });
    };

    SecurityLog.logEvent = async function(data: any): Promise<any> {
      return SecurityLog.create(data);
    };

    // Define associations
    User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
    Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

    // Sync database
    await sequelize.sync({ force: true });

    // Mock the models in the controller
    jest.doMock('@/models', () => ({
      User,
      Role,
      SecurityLog,
    }));

    // Setup Express app
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      Object.defineProperty(req, 'ip', {
        value: '127.0.0.1',
        writable: true,
      });
      next();
    });

    const authController = new AuthController();
    
    // Setup routes
    app.post('/auth/login', validateRequest(loginSchema), authController.login.bind(authController));
    app.post('/auth/register', validateRequest(registerSchema), authController.register.bind(authController));
    app.post('/auth/request-password-reset', validateRequest(passwordResetRequestSchema), authController.requestPasswordReset.bind(authController));
    app.post('/auth/reset-password', validateRequest(passwordResetSchema), authController.resetPassword.bind(authController));
    app.post('/auth/wechat-login', validateRequest(wechatLoginSchema), authController.wechatLogin.bind(authController));
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear data before each test
    await SecurityLog.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    await Role.destroy({ where: {}, truncate: true });

    // Create test role
    await Role.create({
      name: 'admin',
      description: 'Administrator role',
      permissions: ['users:read', 'users:create', 'users:update', 'users:delete'],
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        password: 'TestPass123',
        real_name: '测试用户',
        email: 'test@example.com',
        phone: '13800138000',
      };

      const response = await request(app)
        .post('/auth/register')
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
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USERNAME_EXISTS');
    });

    it('should validate password requirements', async () => {
      const userData = {
        username: 'testuser',
        password: 'weak', // Weak password
        real_name: '测试用户',
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(422);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
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
        .post('/auth/login')
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
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: 'TestPass123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should lock account after 5 failed login attempts', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            username: 'testuser',
            password: 'wrongpassword',
          })
          .expect(401);
      }

      // 6th attempt should return account locked error
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(423);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_LOCKED');

      // Verify user is locked in database
      const user = await User.findOne({ where: { username: 'testuser' } });
      expect(user.isAccountLocked()).toBe(true);
    });
  });

  describe('POST /auth/request-password-reset', () => {
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
        .post('/auth/request-password-reset')
        .send({
          email: 'test@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('重置密码链接已发送');

      // Verify token was generated in database
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user.password_reset_token).toBeDefined();
      expect(user.password_reset_expires).toBeDefined();
    });

    it('should not reveal if email does not exist', async () => {
      const response = await request(app)
        .post('/auth/request-password-reset')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('重置密码链接已发送');
    });
  });

  describe('POST /auth/reset-password', () => {
    let resetToken: string;
    let user: any;

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
        .post('/auth/reset-password')
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
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPass123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_RESET_TOKEN');
    });
  });

  describe('POST /auth/wechat-login', () => {
    it('should create new user for first-time WeChat login', async () => {
      const response = await request(app)
        .post('/auth/wechat-login')
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
    });

    it('should return error for invalid WeChat code', async () => {
      const response = await request(app)
        .post('/auth/wechat-login')
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
});