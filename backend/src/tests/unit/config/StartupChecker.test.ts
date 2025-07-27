import { StartupChecker } from '@/config/StartupChecker';
import { configManager } from '@/config/ConfigManager';
import { sequelize } from '@/config/database';
import { redisManager } from '@/config/redis';
import fs from 'fs';

// Mock dependencies
jest.mock('@/config/ConfigManager');
jest.mock('@/config/database');
jest.mock('@/config/redis');
jest.mock('fs');

describe('StartupChecker', () => {
  let startupChecker: StartupChecker;
  let originalEnv: NodeJS.ProcessEnv;

  const mockConfigManager = configManager as jest.Mocked<typeof configManager>;
  const mockSequelize = sequelize as jest.Mocked<typeof sequelize>;
  const mockRedisManager = redisManager as jest.Mocked<typeof redisManager>;
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set up test environment
    process.env.NODE_ENV = 'test';
    
    startupChecker = StartupChecker.getInstance();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockConfigManager.initialize.mockResolvedValue();
    mockConfigManager.getConfig.mockReturnValue({
      environment: 'test',
      port: 3001,
      frontendUrl: 'http://localhost:3001',
      database: {
        host: 'localhost',
        port: 5432,
        name: 'test_db',
        user: 'test_user',
        password: 'test_password',
        ssl: false,
        poolSize: 10
      },
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0
      },
      jwt: {
        secret: 'test-secret',
        expiresIn: '24h'
      },
      cors: {
        origins: ['http://localhost:3001'],
        credentials: true
      },
      upload: {
        path: 'uploads',
        maxSize: 10 * 1024 * 1024,
        allowedTypes: ['jpg', 'png']
      },
      logLevel: 'error'
    });
    
    mockSequelize.authenticate.mockResolvedValue();
    mockSequelize.query.mockResolvedValue([
      [{ version: 'PostgreSQL 13.0 on x86_64-pc-linux-gnu' }]
    ] as any);
    
    mockRedisManager.healthCheck.mockResolvedValue({
      status: 'healthy',
      message: 'Redis connection is healthy',
      timestamp: new Date(),
      responseTime: 10,
      connectionCount: 1,
      memoryUsage: 1024
    });
    
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue();
    mockFs.unlinkSync.mockReturnValue();
    mockFs.accessSync.mockReturnValue();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = StartupChecker.getInstance();
      const instance2 = StartupChecker.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('performStartupChecks', () => {
    it('should pass all checks with valid configuration', async () => {
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(true);
      expect(result.checks.configuration).toBe(true);
      expect(result.checks.database).toBe(true);
      expect(result.checks.redis).toBe(true);
      expect(result.checks.fileSystem).toBe(true);
      expect(result.checks.environment).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when configuration validation fails', async () => {
      mockConfigManager.initialize.mockRejectedValue(new Error('Config validation failed'));
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(false);
      expect(result.checks.configuration).toBe(false);
      expect(result.errors).toContain('Configuration validation failed: Config validation failed');
    });

    it('should fail when database connection fails', async () => {
      mockSequelize.authenticate.mockRejectedValue(new Error('Database connection failed'));
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(false);
      expect(result.checks.database).toBe(false);
      expect(result.errors).toContain('Database connectivity failed: Database connection failed');
    });

    it('should continue when Redis connection fails (optional)', async () => {
      mockRedisManager.healthCheck.mockRejectedValue(new Error('Redis connection failed'));
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(true); // Should still succeed
      expect(result.checks.redis).toBe(false);
      expect(result.warnings).toContain('Redis connectivity failed (optional): Redis connection failed');
    });

    it('should fail when file system check fails', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(false);
      expect(result.checks.fileSystem).toBe(false);
      expect(result.errors.some(error => error.includes('File system check failed'))).toBe(true);
    });
  });

  describe('environment checks', () => {
    it('should fail with unsupported Node.js version', async () => {
      // Mock Node.js version
      Object.defineProperty(process, 'version', {
        value: 'v14.0.0',
        configurable: true
      });
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Node.js version v14.0.0 is not supported. Minimum required: 16.x');
    });

    it('should create missing directories', async () => {
      mockFs.existsSync.mockReturnValue(false);
      
      await startupChecker.performStartupChecks();
      
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('uploads', { recursive: true });
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('logs', { recursive: true });
    });

    it('should fail when directory creation fails', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Failed to create required directory'))).toBe(true);
    });
  });

  describe('production environment checks', () => {
    beforeEach(() => {
      mockConfigManager.getConfig.mockReturnValue({
        environment: 'production',
        port: 3000,
        frontendUrl: 'https://example.com',
        database: {
          host: 'localhost',
          port: 5432,
          name: 'prod_db',
          user: 'prod_user',
          password: 'prod_password',
          ssl: false,
          poolSize: 10
        },
        redis: {
          host: 'localhost',
          port: 6379,
          db: 0
        },
        jwt: {
          secret: 'short-secret', // Less than 32 chars
          expiresIn: '24h'
        },
        cors: {
          origins: [], // Empty origins
          credentials: true
        },
        upload: {
          path: 'uploads',
          maxSize: 10 * 1024 * 1024,
          allowedTypes: ['jpg', 'png']
        },
        logLevel: 'info'
      });
    });

    it('should fail when CORS origins are not configured in production', async () => {
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('CORS origins must be configured in production');
    });

    it('should fail when JWT secret is too short in production', async () => {
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('JWT secret is too short for production environment');
    });
  });

  describe('database connectivity checks', () => {
    it('should log database version information', async () => {
      await startupChecker.performStartupChecks();
      
      expect(mockSequelize.authenticate).toHaveBeenCalled();
      expect(mockSequelize.query).toHaveBeenCalledWith('SELECT version() as version');
    });

    it('should handle database query errors gracefully', async () => {
      mockSequelize.query.mockRejectedValue(new Error('Query failed'));
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(false);
      expect(result.checks.database).toBe(false);
    });
  });

  describe('Redis connectivity checks', () => {
    it('should check Redis health status', async () => {
      await startupChecker.performStartupChecks();
      
      expect(mockRedisManager.healthCheck).toHaveBeenCalled();
    });

    it('should handle degraded Redis status', async () => {
      mockRedisManager.healthCheck.mockResolvedValue({
        status: 'degraded',
        message: 'Redis connection degraded',
        timestamp: new Date(),
        responseTime: 100,
        connectionCount: 0,
        memoryUsage: 0
      });
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(true); // Should still succeed
      expect(result.checks.redis).toBe(false);
      expect(result.warnings).toContain('Redis connectivity degraded: Redis connection degraded');
    });

    it('should handle unhealthy Redis status', async () => {
      mockRedisManager.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        message: 'Redis connection failed',
        timestamp: new Date(),
        responseTime: 1000,
        connectionCount: 0,
        memoryUsage: 0
      });
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.success).toBe(true); // Should still succeed
      expect(result.checks.redis).toBe(false);
      expect(result.warnings).toContain('Redis connectivity failed (optional): Redis connection failed');
    });
  });

  describe('file system checks', () => {
    it('should test write permissions for upload directory', async () => {
      await startupChecker.performStartupChecks();
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads/.write-test'),
        'test'
      );
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads/.write-test')
      );
    });

    it('should test write permissions for logs directory', async () => {
      await startupChecker.performStartupChecks();
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('logs/.write-test'),
        'test'
      );
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('logs/.write-test')
      );
    });

    it('should warn when logs directory is not writable', async () => {
      mockFs.writeFileSync.mockImplementation((path) => {
        if (path.toString().includes('logs')) {
          throw new Error('Permission denied');
        }
      });
      
      const result = await startupChecker.performStartupChecks();
      
      expect(result.warnings.some(warning => 
        warning.includes('Logs directory is not writable')
      )).toBe(true);
    });
  });

  describe('performHealthCheck', () => {
    it('should return healthy status when all checks pass', async () => {
      const result = await startupChecker.performHealthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.checks.database).toBe(true);
      expect(result.checks.redis).toBe(true);
      expect(result.checks.fileSystem).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('should return degraded status when Redis fails', async () => {
      mockRedisManager.healthCheck.mockResolvedValue({
        status: 'degraded',
        message: 'Redis down',
        timestamp: new Date(),
        responseTime: 500,
        connectionCount: 0,
        memoryUsage: 0
      });
      
      const result = await startupChecker.performHealthCheck();
      
      expect(result.status).toBe('degraded');
      expect(result.checks.database).toBe(true);
      expect(result.checks.redis).toBe(false);
      expect(result.checks.fileSystem).toBe(true);
    });

    it('should return unhealthy status when database fails', async () => {
      mockSequelize.query.mockRejectedValue(new Error('Database down'));
      
      const result = await startupChecker.performHealthCheck();
      
      expect(result.status).toBe('unhealthy');
      expect(result.checks.database).toBe(false);
    });

    it('should return unhealthy status when file system fails', async () => {
      mockFs.accessSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = await startupChecker.performHealthCheck();
      
      expect(result.status).toBe('unhealthy');
      expect(result.checks.fileSystem).toBe(false);
    });

    it('should handle Redis health check errors', async () => {
      mockRedisManager.healthCheck.mockRejectedValue(new Error('Redis health check failed'));
      
      const result = await startupChecker.performHealthCheck();
      
      expect(result.checks.redis).toBe(false);
    });
  });
});