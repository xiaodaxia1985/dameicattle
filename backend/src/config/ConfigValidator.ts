import Joi from 'joi';
import { logger } from '@/utils/logger';

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  ssl: boolean;
  poolSize: number;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
}

export interface CORSConfig {
  origins: string[];
  credentials: boolean;
}

export interface UploadConfig {
  path: string;
  maxSize: number;
  allowedTypes: string[];
}

export interface SystemConfig {
  environment: 'development' | 'test' | 'production';
  port: number;
  frontendUrl: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  cors: CORSConfig;
  upload: UploadConfig;
  logLevel: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: SystemConfig;
}

export class ConfigValidator {
  private static instance: ConfigValidator;
  private validatedConfig: SystemConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigValidator {
    if (!ConfigValidator.instance) {
      ConfigValidator.instance = new ConfigValidator();
    }
    return ConfigValidator.instance;
  }

  /**
   * Validation schema for environment configuration
   */
  private getValidationSchema(): Joi.ObjectSchema {
    return Joi.object({
      NODE_ENV: Joi.string()
        .valid('development', 'test', 'production')
        .default('development'),
      
      PORT: Joi.number()
        .port()
        .optional(),
      
      FRONTEND_URL: Joi.string()
        .uri()
        .default('http://localhost:5173'),
      
      // Database configuration
      DB_HOST: Joi.string()
        .hostname()
        .default('localhost'),
      
      DB_PORT: Joi.number()
        .port()
        .default(5432),
      
      DB_NAME: Joi.string()
        .min(1)
        .required()
        .messages({
          'any.required': 'Database name (DB_NAME) is required',
          'string.empty': 'Database name (DB_NAME) cannot be empty'
        }),
      
      DB_USER: Joi.string()
        .min(1)
        .required()
        .messages({
          'any.required': 'Database user (DB_USER) is required',
          'string.empty': 'Database user (DB_USER) cannot be empty'
        }),
      
      DB_PASSWORD: Joi.string()
        .min(1)
        .required()
        .messages({
          'any.required': 'Database password (DB_PASSWORD) is required',
          'string.empty': 'Database password (DB_PASSWORD) cannot be empty'
        }),
      
      DB_SSL: Joi.boolean()
        .default(false),
      
      DB_POOL_SIZE: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(10),
      
      // Redis configuration
      REDIS_HOST: Joi.string()
        .hostname()
        .default('localhost'),
      
      REDIS_PORT: Joi.number()
        .port()
        .default(6379),
      
      REDIS_PASSWORD: Joi.string()
        .allow('')
        .optional(),
      
      REDIS_DB: Joi.number()
        .integer()
        .min(0)
        .max(15)
        .default(0),
      
      // JWT configuration
      JWT_SECRET: Joi.string()
        .min(32)
        .required()
        .messages({
          'any.required': 'JWT secret (JWT_SECRET) is required',
          'string.min': 'JWT secret (JWT_SECRET) must be at least 32 characters long for security'
        }),
      
      JWT_EXPIRES_IN: Joi.string()
        .pattern(/^(\d+[smhd]|\d+)$/)
        .default('24h')
        .messages({
          'string.pattern.base': 'JWT_EXPIRES_IN must be in format like "24h", "30m", "7d", etc.'
        }),
      
      // Upload configuration
      UPLOAD_PATH: Joi.string()
        .default('uploads'),
      
      MAX_FILE_SIZE: Joi.number()
        .integer()
        .min(1024) // 1KB minimum
        .max(100 * 1024 * 1024) // 100MB maximum
        .default(10 * 1024 * 1024), // 10MB default
      
      ALLOWED_FILE_TYPES: Joi.string()
        .default('jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx'),
      
      // Logging configuration
      LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug')
        .optional(),
      
      // Optional email configuration
      SMTP_HOST: Joi.string()
        .hostname()
        .optional(),
      
      SMTP_PORT: Joi.number()
        .port()
        .optional(),
      
      SMTP_USER: Joi.string()
        .optional(),
      
      SMTP_PASS: Joi.string()
        .optional(),
      
      SMTP_FROM: Joi.string()
        .email()
        .optional(),
      
      // Optional WeChat configuration
      WECHAT_APP_ID: Joi.string()
        .optional(),
      
      WECHAT_APP_SECRET: Joi.string()
        .optional()
    });
  }

  /**
   * Get environment-specific default values and apply them to validated values
   */
  private applyEnvironmentDefaults(validatedValues: any): any {
    const env = validatedValues.NODE_ENV;
    
    // Set defaults based on environment
    const defaults = {
      PORT: validatedValues.PORT,
      LOG_LEVEL: validatedValues.LOG_LEVEL
    };
    
    switch (env) {
      case 'development':
        defaults.LOG_LEVEL = validatedValues.LOG_LEVEL || 'debug';
        defaults.PORT = validatedValues.PORT || 3000;
        break;
      
      case 'test':
        defaults.LOG_LEVEL = validatedValues.LOG_LEVEL || 'error';
        defaults.PORT = validatedValues.PORT || 3001;
        break;
      
      case 'production':
        defaults.LOG_LEVEL = validatedValues.LOG_LEVEL || 'warn';
        defaults.PORT = validatedValues.PORT || 3000;
        break;
      
      default:
        defaults.LOG_LEVEL = validatedValues.LOG_LEVEL || 'info';
        defaults.PORT = validatedValues.PORT || 3000;
        break;
    }
    
    return {
      ...validatedValues,
      ...defaults
    };
  }

  /**
   * Get CORS origins based on environment
   */
  private getCORSOrigins(env: string, frontendUrl: string): string[] {
    switch (env) {
      case 'development':
        return [
          'http://localhost:5173',
          'http://localhost:8080',
          'http://localhost:3000',
          frontendUrl
        ];
      
      case 'test':
        return ['http://localhost:3001'];
      
      case 'production':
        return []; // Should be set explicitly in production
      
      default:
        return [frontendUrl];
    }
  }

  /**
   * Validate environment configuration
   */
  public validateEnvironment(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get validation schema
      const schema = this.getValidationSchema();
      
      // Validate environment variables
      const { error, value } = schema.validate(process.env, {
        allowUnknown: true,
        stripUnknown: false,
        abortEarly: false
      });

      if (error) {
        error.details.forEach(detail => {
          errors.push(detail.message);
        });
      }

      if (errors.length > 0) {
        return {
          isValid: false,
          errors,
          warnings
        };
      }

      // Build system configuration
      const config = this.buildSystemConfig(value);
      
      // Perform additional validation checks
      this.performAdditionalValidation(config, warnings, errors);

      // Cache validated configuration
      if (errors.length === 0) {
        this.validatedConfig = config;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        config: errors.length === 0 ? config : undefined
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown validation error';
      errors.push(`Configuration validation failed: ${errorMessage}`);
      
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Build system configuration from validated environment variables
   */
  private buildSystemConfig(envVars: any): SystemConfig {
    const environment = envVars.NODE_ENV as 'development' | 'test' | 'production';
    
    // Apply environment-specific defaults
    const finalValues = this.applyEnvironmentDefaults(envVars);
    
    return {
      environment,
      port: finalValues.PORT,
      frontendUrl: finalValues.FRONTEND_URL,
      database: {
        host: finalValues.DB_HOST,
        port: finalValues.DB_PORT,
        name: finalValues.DB_NAME,
        user: finalValues.DB_USER,
        password: finalValues.DB_PASSWORD,
        ssl: finalValues.DB_SSL,
        poolSize: finalValues.DB_POOL_SIZE
      },
      redis: {
        host: finalValues.REDIS_HOST,
        port: finalValues.REDIS_PORT,
        password: finalValues.REDIS_PASSWORD || undefined,
        db: finalValues.REDIS_DB
      },
      jwt: {
        secret: finalValues.JWT_SECRET,
        expiresIn: finalValues.JWT_EXPIRES_IN
      },
      cors: {
        origins: this.getCORSOrigins(environment, finalValues.FRONTEND_URL),
        credentials: true
      },
      upload: {
        path: finalValues.UPLOAD_PATH,
        maxSize: finalValues.MAX_FILE_SIZE,
        allowedTypes: finalValues.ALLOWED_FILE_TYPES.split(',').map((type: string) => type.trim())
      },
      logLevel: finalValues.LOG_LEVEL
    };
  }

  /**
   * Perform additional validation checks
   */
  private performAdditionalValidation(config: SystemConfig, warnings: string[], errors: string[]): void {
    // Production-specific validations
    if (config.environment === 'production') {
      if (config.jwt.secret.length < 64) {
        warnings.push('JWT secret should be at least 64 characters long in production');
      }

      if (config.cors.origins.length === 0) {
        errors.push('CORS origins must be explicitly configured in production');
      }

      if (config.logLevel === 'debug') {
        warnings.push('Debug logging is not recommended in production');
      }

      if (!config.database.ssl && config.database.host !== 'localhost') {
        warnings.push('SSL should be enabled for remote database connections in production');
      }
    }

    // Development-specific validations
    if (config.environment === 'development') {
      if (config.jwt.secret === 'your-super-secret-jwt-key-change-this-in-production') {
        warnings.push('Using default JWT secret in development. Consider changing it.');
      }
    }

    // General validations
    if (config.upload.maxSize > 50 * 1024 * 1024) { // 50MB
      warnings.push('Large file upload size may impact server performance');
    }

    // Check for common security issues
    if (config.database.password === 'password' || config.database.password === '123456') {
      warnings.push('Database password appears to be weak. Consider using a stronger password.');
    }
  }

  /**
   * Get validated configuration
   */
  public getConfig(): SystemConfig {
    if (!this.validatedConfig) {
      throw new Error('Configuration has not been validated yet. Call validateEnvironment() first.');
    }
    return this.validatedConfig;
  }

  /**
   * Get configuration value by key
   */
  public getConfigValue<K extends keyof SystemConfig>(key: K): SystemConfig[K] {
    const config = this.getConfig();
    return config[key];
  }

  /**
   * Check if configuration is valid
   */
  public isConfigValid(): boolean {
    return this.validatedConfig !== null;
  }

  /**
   * Reload configuration (useful for development)
   */
  public reloadConfig(): ValidationResult {
    this.validatedConfig = null;
    return this.validateEnvironment();
  }

  /**
   * Generate configuration report
   */
  public generateConfigReport(): string {
    if (!this.validatedConfig) {
      return 'Configuration not validated';
    }

    const config = this.validatedConfig;
    const report = [
      '=== System Configuration Report ===',
      `Environment: ${config.environment}`,
      `Port: ${config.port}`,
      `Frontend URL: ${config.frontendUrl}`,
      `Log Level: ${config.logLevel}`,
      '',
      '--- Database Configuration ---',
      `Host: ${config.database.host}:${config.database.port}`,
      `Database: ${config.database.name}`,
      `User: ${config.database.user}`,
      `SSL: ${config.database.ssl ? 'Enabled' : 'Disabled'}`,
      `Pool Size: ${config.database.poolSize}`,
      '',
      '--- Redis Configuration ---',
      `Host: ${config.redis.host}:${config.redis.port}`,
      `Database: ${config.redis.db}`,
      `Password: ${config.redis.password ? 'Set' : 'Not set'}`,
      '',
      '--- Upload Configuration ---',
      `Path: ${config.upload.path}`,
      `Max Size: ${(config.upload.maxSize / 1024 / 1024).toFixed(1)}MB`,
      `Allowed Types: ${config.upload.allowedTypes.join(', ')}`,
      '',
      '--- CORS Configuration ---',
      `Origins: ${config.cors.origins.join(', ')}`,
      `Credentials: ${config.cors.credentials ? 'Enabled' : 'Disabled'}`,
      '================================='
    ];

    return report.join('\n');
  }

  /**
   * Validate configuration on startup with detailed error reporting
   */
  public static validateOnStartup(): void {
    const validator = ConfigValidator.getInstance();
    const result = validator.validateEnvironment();

    if (!result.isValid) {
      logger.error('❌ Configuration validation failed!');
      logger.error('Errors:');
      result.errors.forEach(error => {
        logger.error(`  - ${error}`);
      });

      if (result.warnings.length > 0) {
        logger.warn('Warnings:');
        result.warnings.forEach(warning => {
          logger.warn(`  - ${warning}`);
        });
      }

      logger.error('Please fix the configuration errors before starting the application.');
      process.exit(1);
    }

    if (result.warnings.length > 0) {
      logger.warn('⚠️  Configuration warnings:');
      result.warnings.forEach(warning => {
        logger.warn(`  - ${warning}`);
      });
    }

    logger.info('✅ Configuration validation passed');
    
    // Log configuration report in debug mode
    if (result.config?.logLevel === 'debug') {
      logger.debug('Configuration Report:');
      logger.debug(validator.generateConfigReport());
    }
  }
}

// Export singleton instance
export const configValidator = ConfigValidator.getInstance();