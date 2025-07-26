import { logger } from '@/utils/logger';
import { configManager } from './ConfigManager';
import { sequelize, initializeDatabase } from './database';
import { redisManager, initializeRedisManager } from './redis';
import fs from 'fs';
import path from 'path';

export interface StartupCheckResult {
  success: boolean;
  checks: {
    configuration: boolean;
    database: boolean;
    redis: boolean;
    fileSystem: boolean;
    environment: boolean;
  };
  errors: string[];
  warnings: string[];
}

export class StartupChecker {
  private static instance: StartupChecker;

  private constructor() {}

  public static getInstance(): StartupChecker {
    if (!StartupChecker.instance) {
      StartupChecker.instance = new StartupChecker();
    }
    return StartupChecker.instance;
  }

  /**
   * Perform comprehensive startup checks
   */
  public async performStartupChecks(): Promise<StartupCheckResult> {
    const result: StartupCheckResult = {
      success: false,
      checks: {
        configuration: false,
        database: false,
        redis: false,
        fileSystem: false,
        environment: false
      },
      errors: [],
      warnings: []
    };

    logger.info('🚀 Starting application startup checks...');

    // 1. Configuration validation
    await this.checkConfiguration(result);

    // 2. Environment validation
    await this.checkEnvironment(result);

    // 3. Database connectivity
    await this.checkDatabase(result);

    // 4. Redis connectivity (optional)
    await this.checkRedis(result);

    // 5. File system permissions
    await this.checkFileSystem(result);

    // Determine overall success
    result.success = result.checks.configuration && 
                    result.checks.database && 
                    result.checks.fileSystem && 
                    result.checks.environment;

    // Log results
    this.logStartupResults(result);

    return result;
  }

  /**
   * Check configuration validation
   */
  private async checkConfiguration(result: StartupCheckResult): Promise<void> {
    try {
      logger.info('📋 Checking configuration...');
      
      await configManager.initialize();
      result.checks.configuration = true;
      
      logger.info('✅ Configuration validation passed');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error';
      result.errors.push(`Configuration validation failed: ${errorMessage}`);
      logger.error('❌ Configuration validation failed:', error);
    }
  }

  /**
   * Check environment-specific requirements
   */
  private async checkEnvironment(result: StartupCheckResult): Promise<void> {
    try {
      logger.info('🌍 Checking environment requirements...');
      
      const config = configManager.getConfig();
      
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion < 16) {
        result.errors.push(`Node.js version ${nodeVersion} is not supported. Minimum required: 16.x`);
        return;
      }

      // Check environment-specific requirements
      if (config.environment === 'production') {
        // Production-specific checks
        if (config.jwt.secret.length < 32) {
          result.errors.push('JWT secret is too short for production environment');
        }
        
        if (config.cors.origins.length === 0) {
          result.errors.push('CORS origins must be configured in production');
        }
      }

      // Check required directories exist
      const requiredDirs = [
        config.upload.path,
        'logs'
      ];

      for (const dir of requiredDirs) {
        if (!fs.existsSync(dir)) {
          try {
            fs.mkdirSync(dir, { recursive: true });
            logger.info(`📁 Created directory: ${dir}`);
          } catch (error) {
            result.errors.push(`Failed to create required directory: ${dir}`);
            return;
          }
        }
      }

      result.checks.environment = true;
      logger.info('✅ Environment requirements check passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown environment error';
      result.errors.push(`Environment check failed: ${errorMessage}`);
      logger.error('❌ Environment check failed:', error);
    }
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(result: StartupCheckResult): Promise<void> {
    try {
      logger.info('🗄️  Checking database connectivity...');
      
      // Initialize database manager now that config is ready
      if (process.env.NODE_ENV !== 'test') {
        await initializeDatabase();
      }
      
      // Test database connection
      await sequelize.authenticate();
      
      // Check if database is accessible
      const [results] = await sequelize.query('SELECT version() as version');
      const dbVersion = (results as any)[0]?.version;
      
      if (dbVersion) {
        logger.info(`📊 Connected to PostgreSQL: ${dbVersion.split(' ')[0]} ${dbVersion.split(' ')[1]}`);
      }

      result.checks.database = true;
      logger.info('✅ Database connectivity check passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      result.errors.push(`Database connectivity failed: ${errorMessage}`);
      logger.error('❌ Database connectivity check failed:', error);
    }
  }

  /**
   * Check Redis connectivity (optional)
   */
  private async checkRedis(result: StartupCheckResult): Promise<void> {
    try {
      logger.info('🔴 Checking Redis connectivity...');
      
      // Initialize Redis manager now that config is ready
      if (process.env.NODE_ENV !== 'test') {
        await initializeRedisManager();
      }
      
      // Perform health check
      const healthStatus = await redisManager.healthCheck();
      
      if (healthStatus.status === 'healthy') {
        logger.info(`🔴 Redis connection healthy: ${healthStatus.message}`);
        result.checks.redis = true;
        logger.info('✅ Redis connectivity check passed');
      } else if (healthStatus.status === 'degraded') {
        logger.warn(`🔴 Redis degraded: ${healthStatus.message}`);
        result.warnings.push(`Redis connectivity degraded: ${healthStatus.message}`);
        result.checks.redis = false;
      } else {
        throw new Error(healthStatus.message);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Redis error';
      result.warnings.push(`Redis connectivity failed (optional): ${errorMessage}`);
      logger.warn('⚠️  Redis connectivity check failed (continuing without cache):', error);
      
      // Redis failure is not critical, so we don't fail startup
      result.checks.redis = false;
    }
  }

  /**
   * Check file system permissions
   */
  private async checkFileSystem(result: StartupCheckResult): Promise<void> {
    try {
      logger.info('📁 Checking file system permissions...');
      
      const config = configManager.getConfig();
      
      // Check upload directory permissions
      const uploadPath = path.resolve(config.upload.path);
      
      // Test write permissions
      const testFile = path.join(uploadPath, '.write-test');
      
      try {
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        logger.info(`📝 Upload directory writable: ${uploadPath}`);
      } catch (error) {
        result.errors.push(`Upload directory is not writable: ${uploadPath}`);
        return;
      }

      // Check logs directory permissions
      const logsPath = path.resolve('logs');
      
      try {
        if (!fs.existsSync(logsPath)) {
          fs.mkdirSync(logsPath, { recursive: true });
        }
        
        const testLogFile = path.join(logsPath, '.write-test');
        fs.writeFileSync(testLogFile, 'test');
        fs.unlinkSync(testLogFile);
        logger.info(`📝 Logs directory writable: ${logsPath}`);
      } catch (error) {
        result.warnings.push(`Logs directory is not writable: ${logsPath}`);
      }

      result.checks.fileSystem = true;
      logger.info('✅ File system permissions check passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown file system error';
      result.errors.push(`File system check failed: ${errorMessage}`);
      logger.error('❌ File system check failed:', error);
    }
  }

  /**
   * Log startup check results
   */
  private logStartupResults(result: StartupCheckResult): void {
    logger.info('');
    logger.info('=== Startup Check Results ===');
    
    // Log individual check results
    Object.entries(result.checks).forEach(([check, passed]) => {
      const status = passed ? '✅' : '❌';
      const checkName = check.charAt(0).toUpperCase() + check.slice(1);
      logger.info(`${status} ${checkName}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    // Log errors
    if (result.errors.length > 0) {
      logger.error('');
      logger.error('❌ Startup Errors:');
      result.errors.forEach(error => {
        logger.error(`  - ${error}`);
      });
    }

    // Log warnings
    if (result.warnings.length > 0) {
      logger.warn('');
      logger.warn('⚠️  Startup Warnings:');
      result.warnings.forEach(warning => {
        logger.warn(`  - ${warning}`);
      });
    }

    logger.info('');
    if (result.success) {
      logger.info('🎉 All critical startup checks passed! Application is ready to start.');
    } else {
      logger.error('💥 Critical startup checks failed! Please fix the errors before starting the application.');
    }
    logger.info('==============================');
  }

  /**
   * Perform quick health check (for runtime monitoring)
   */
  public async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    timestamp: string;
  }> {
    const checks: Record<string, boolean> = {};
    
    try {
      // Quick database check
      await sequelize.query('SELECT 1');
      checks.database = true;
    } catch {
      checks.database = false;
    }

    try {
      // Quick Redis check using RedisManager
      const healthStatus = await redisManager.healthCheck();
      checks.redis = healthStatus.status === 'healthy';
    } catch {
      checks.redis = false;
    }

    // File system check
    try {
      const config = configManager.getConfig();
      fs.accessSync(config.upload.path, fs.constants.W_OK);
      checks.fileSystem = true;
    } catch {
      checks.fileSystem = false;
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    
    if (checks.database && checks.fileSystem) {
      status = checks.redis ? 'healthy' : 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      checks,
      timestamp: new Date().toISOString()
    };
  }
}

export const startupChecker = StartupChecker.getInstance();