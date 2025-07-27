import { ConfigValidator } from '@/config/ConfigValidator';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.JWT_SECRET;
    
    validator = ConfigValidator.getInstance();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should fail validation when required fields are missing', () => {
      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Database name (DB_NAME) is required');
      expect(result.errors).toContain('Database user (DB_USER) is required');
      expect(result.errors).toContain('Database password (DB_PASSWORD) is required');
      expect(result.errors).toContain('JWT secret (JWT_SECRET) is required');
    });

    it('should pass validation with minimum required configuration', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.config).toBeDefined();
    });

    it('should apply default values correctly', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.config?.environment).toBe('development');
      expect(result.config?.port).toBe(3000);
      expect(result.config?.database.host).toBe('localhost');
      expect(result.config?.database.port).toBe(5432);
      expect(result.config?.redis.host).toBe('localhost');
      expect(result.config?.redis.port).toBe(6379);
    });

    it('should validate JWT secret length', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'short';

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('JWT secret (JWT_SECRET) must be at least 32 characters long for security');
    });

    it('should validate port numbers', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';
      process.env.PORT = '99999'; // Invalid port
      process.env.DB_PORT = '70000'; // Invalid port

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('PORT'))).toBe(true);
      expect(result.errors.some(error => error.includes('DB_PORT'))).toBe(true);
    });

    it('should validate environment values', () => {
      process.env.NODE_ENV = 'invalid_env';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('NODE_ENV'))).toBe(true);
    });

    it('should validate JWT expiration format', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';
      process.env.JWT_EXPIRES_IN = 'invalid_format';

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('JWT_EXPIRES_IN must be in format like "24h", "30m", "7d", etc.');
    });

    it('should validate file size limits', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';
      process.env.MAX_FILE_SIZE = '500'; // Too small

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('MAX_FILE_SIZE'))).toBe(true);
    });

    it('should handle Redis database number validation', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';
      process.env.REDIS_DB = '20'; // Invalid Redis DB number (max 15)

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('REDIS_DB'))).toBe(true);
    });
  });

  describe('production environment validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.DB_NAME = 'prod_db';
      process.env.DB_USER = 'prod_user';
      process.env.DB_PASSWORD = 'prod_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-production-use-minimum-64-chars';
    });

    it('should require CORS origins in production', () => {
      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CORS origins must be explicitly configured in production');
    });

    it('should warn about short JWT secret in production', () => {
      process.env.JWT_SECRET = 'short'; // Very short JWT secret
      process.env.FRONTEND_URL = 'https://example.com';

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false); // Should fail because JWT secret is too short
      expect(result.errors).toContain('JWT secret (JWT_SECRET) must be at least 32 characters long for security');
    });

    it('should warn about debug logging in production', () => {
      process.env.LOG_LEVEL = 'debug';
      process.env.FRONTEND_URL = 'https://example.com';

      const result = validator.validateEnvironment();
      
      expect(result.warnings).toContain('Debug logging is not recommended in production');
    });

    it('should warn about SSL for remote database connections', () => {
      process.env.DB_HOST = 'remote-db.example.com';
      process.env.DB_SSL = 'false';
      process.env.FRONTEND_URL = 'https://example.com';

      const result = validator.validateEnvironment();
      
      expect(result.warnings).toContain('SSL should be enabled for remote database connections in production');
    });
  });

  describe('development environment validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.DB_NAME = 'dev_db';
      process.env.DB_USER = 'dev_user';
      process.env.DB_PASSWORD = 'dev_password';
    });

    it('should warn about default JWT secret', () => {
      process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

      const result = validator.validateEnvironment();
      
      expect(result.warnings).toContain('Using default JWT secret in development. Consider changing it.');
    });

    it('should apply development-specific defaults', () => {
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.config?.logLevel).toBe('error'); // Test environment uses error level
      expect(result.config?.cors.origins).toContain('http://localhost:5173');
      expect(result.config?.cors.origins).toContain('http://localhost:8080');
    });
  });

  describe('test environment validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';
    });

    it('should apply test-specific defaults', () => {
      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(true);
      expect(result.config?.port).toBe(3001);
      expect(result.config?.logLevel).toBe('error');
      expect(result.config?.cors.origins).toEqual(['http://localhost:3001']);
    });
  });

  describe('configuration management', () => {
    beforeEach(() => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';
    });

    it('should cache validated configuration', () => {
      const result1 = validator.validateEnvironment();
      const result2 = validator.validateEnvironment();
      
      expect(result1.config).toEqual(result2.config);
    });

    it('should reload configuration', () => {
      validator.validateEnvironment();
      
      // Change environment
      process.env.PORT = '4000';
      
      const reloadResult = validator.reloadConfig();
      
      expect(reloadResult.config?.port).toBe(4000);
    });

    it('should get configuration values', () => {
      validator.validateEnvironment();
      
      const config = validator.getConfig();
      expect(config.database.name).toBe('test_db');
      expect(config.database.user).toBe('test_user');
    });

    it('should throw error when getting config before validation', () => {
      const freshValidator = new (ConfigValidator as any)();
      
      expect(() => freshValidator.getConfig()).toThrow('Configuration has not been validated yet');
    });

    it('should generate configuration report', () => {
      validator.validateEnvironment();
      
      const report = validator.generateConfigReport();
      
      expect(report).toContain('System Configuration Report');
      expect(report).toContain('Environment: development');
      expect(report).toContain('Database: test_db');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed environment variables gracefully', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';
      process.env.PORT = 'not-a-number';

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('PORT'))).toBe(true);
    });

    it('should handle empty string values', () => {
      process.env.DB_NAME = '';
      process.env.DB_USER = '';
      process.env.DB_PASSWORD = '';
      process.env.JWT_SECRET = '';

      const result = validator.validateEnvironment();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Database name (DB_NAME) cannot be empty');
      expect(result.errors).toContain('Database user (DB_USER) cannot be empty');
      expect(result.errors).toContain('Database password (DB_PASSWORD) cannot be empty');
    });

    it('should warn about weak passwords', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'password'; // Weak password
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';

      const result = validator.validateEnvironment();
      
      expect(result.warnings).toContain('Database password appears to be weak. Consider using a stronger password.');
    });

    it('should warn about large file upload sizes', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';
      process.env.MAX_FILE_SIZE = String(60 * 1024 * 1024); // 60MB

      const result = validator.validateEnvironment();
      
      expect(result.warnings).toContain('Large file upload size may impact server performance');
    });
  });

  describe('static methods', () => {
    it('should validate on startup and exit on failure', () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      // Clear required environment variables to force failure
      delete process.env.DB_NAME;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.JWT_SECRET;

      expect(() => {
        ConfigValidator.validateOnStartup();
      }).toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });

    it('should validate on startup and continue on success', () => {
      process.env.DB_NAME = 'test_db';
      process.env.DB_USER = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.JWT_SECRET = 'this-is-a-very-long-jwt-secret-key-for-testing-purposes';

      expect(() => {
        ConfigValidator.validateOnStartup();
      }).not.toThrow();
    });
  });
});