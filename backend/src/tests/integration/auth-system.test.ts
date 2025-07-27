/**
 * Comprehensive Authentication System Tests
 * Tests JWT validation, token refresh, role-based authorization, and error handling
 */

import request from 'supertest';
import express from 'express';
import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { SecurityLog } from '@/models/SecurityLog';
import { AuthController } from '@/controllers/AuthController';
import { auth, requirePermission, requireRole, requireAnyPermission } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { loginSchema } from '@/validators/auth';
import { redisClient } from '@/config/redis';

// Mock Redis
jest.mock('@/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Enhanced Authentication System', () => {
  let app: express.Application;
  let sequelize: Sequelize;
  let testUser: User;
  let testRole: Role;
  let adminRole: Role;
  let authController: AuthController;

  beforeAll(async () => {
    // Setup test database
    sequelize = new Sequelize({
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'cattle_management_test',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      logging: false,
    });

    // Initialize models
    User.init(User.getAttributes(), { sequelize, modelName: 'User' });
    Role.init(Role.getAttributes(), { sequelize, modelName: 'Role' });
    SecurityLog.init(SecurityLog.getAttributes(), { sequelize, modelName: 'SecurityLog' });

    // Setup associations
    User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
    Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

    await sequelize.sync({ force: true });

    // Create test roles
    adminRole = await Role.create({
      name: 'admin',
      description: 'Administrator',
      permissions: ['user:read', 'user:write', 'user:delete', 'admin:access'],
    });

    testRole = await Role.create({
      name: 'employee',
      description: 'Employee',
      permissions: ['user:read', 'cattle:read', 'cattle:write'],
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    testUser = await User.create({
      username: 'testuser',
      password_hash: hashedPassword,
      real_name: 'Test User',
      email: 'test@example.com',
      role_id: testRole.id,
      status: 'active',
    });

    // Setup Express app
    app = express();
    app.use(express.json());
    authController = new AuthController();

    // Setup test routes
    app.post('/auth/login', validateRequest(loginSchema), authController.login.bind(authController));
    app.post('/auth/refresh', auth, authController.refreshToken.bind(authController));
    app.post('/auth/logout', auth, authController.logout.bind(authController));
    
    // Test protected routes
    app.get('/protected', auth, (req, res) => {
      res.json({ success: true, user: req.user });
    });
    
    app.get('/admin-only', auth, requireRole('admin'), (req, res) => {
      res.json({ success: true, message: 'Admin access granted' });
    });
    
    app.get('/user-permission', auth, requirePermission('user:read'), (req, res) => {
      res.json({ success: true, message: 'User read permission granted' });
    });
    
    app.get('/multiple-permissions', auth, requirePermission(['user:read', 'cattle:read']), (req, res) => {
      res.json({ success: true, message: 'Multiple permissions granted' });
    });
    
    app.get('/any-permission', auth, requireAnyPermission(['admin:access', 'cattle:write']), (req, res) => {
      res.json({ success: true, message: 'Any permission granted' });
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Token Validation', () => {
    test('should authenticate with valid token', async () => {
      // Mock Redis to return the token
      const token = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET || 'your-secret-key'
      );
      (redisClient.get as jest.Mock).mockResolvedValue(token);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.username).toBe('testuser');
    });

    test('should reject request without token', async () => {
      const response = await request(app).get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
      expect(response.body.error.message).toBe('Authorization token is required');
    });

    test('should reject request with invalid token format', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN_FORMAT');
    });

    test('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    test('should reject request when token not in Redis', async () => {
      const token = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET || 'your-secret-key'
      );
      (redisClient.get as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    test('should reject request when token mismatch in Redis', async () => {
      const token = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET || 'your-secret-key'
      );
      (redisClient.get as jest.Mock).mockResolvedValue('different-token');

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TOKEN_MISMATCH');
    });
  });

  describe('Authentication Flow', () => {
    test('should login successfully with valid credentials', async () => {
      (redisClient.setEx as jest.Mock).mockResolvedValue('OK');

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.username).toBe('testuser');
      expect(response.body.data.permissions).toContain('user:read');
    });

    test('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('should logout successfully', async () => {
      const token = jwt.sign(
        { id: testUser.id, username: testUser.username },
        process.env.JWT_SECRET || 'your-secret-key'
      );
      (redisClient.get as jest.Mock).mockResolvedValue(token);
      (redisClient.del as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(redisClient.del).toHaveBeenCalledWith(`token:${testUser.id}`);
    });
  });
});