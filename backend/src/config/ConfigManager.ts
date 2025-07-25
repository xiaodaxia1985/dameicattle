import { ConfigValidator, SystemConfig } from './ConfigValidator';
import { logger } from '@/utils/logger';

export class ConfigManager {
  private static instance: ConfigManager;
  private validator: ConfigValidator;
  private config: SystemConfig | null = null;

  private constructor() {
    this.validator = ConfigValidator.getInstance();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize configuration with validation
   */
  public async initialize(): Promise<void> {
    logger.info('Initializing configuration...');
    
    const result = this.validator.validateEnvironment();
    
    if (!result.isValid) {
      const errorMessage = 'Configuration validation failed:\n' + 
        result.errors.map(error => `  - ${error}`).join('\n');
      throw new Error(errorMessage);
    }

    if (result.warnings.length > 0) {
      logger.warn('Configuration warnings:');
      result.warnings.forEach(warning => {
        logger.warn(`  - ${warning}`);
      });
    }

    this.config = result.config!;
    logger.info('Configuration initialized successfully');
  }

  /**
   * Get the validated configuration
   */
  public getConfig(): SystemConfig {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call initialize() first.');
    }
    return this.config;
  }

  /**
   * Get a specific configuration value
   */
  public get<K extends keyof SystemConfig>(key: K): SystemConfig[K] {
    return this.getConfig()[key];
  }

  /**
   * Get database configuration
   */
  public getDatabaseConfig() {
    return this.getConfig().database;
  }

  /**
   * Get Redis configuration
   */
  public getRedisConfig() {
    return this.getConfig().redis;
  }

  /**
   * Get JWT configuration
   */
  public getJWTConfig() {
    return this.getConfig().jwt;
  }

  /**
   * Get CORS configuration
   */
  public getCORSConfig() {
    return this.getConfig().cors;
  }

  /**
   * Get upload configuration
   */
  public getUploadConfig() {
    return this.getConfig().upload;
  }

  /**
   * Check if running in development mode
   */
  public isDevelopment(): boolean {
    return this.getConfig().environment === 'development';
  }

  /**
   * Check if running in test mode
   */
  public isTest(): boolean {
    return this.getConfig().environment === 'test';
  }

  /**
   * Check if running in production mode
   */
  public isProduction(): boolean {
    return this.getConfig().environment === 'production';
  }

  /**
   * Reload configuration (useful for development)
   */
  public async reload(): Promise<void> {
    logger.info('Reloading configuration...');
    this.config = null;
    await this.initialize();
  }

  /**
   * Validate configuration without initializing
   */
  public validate() {
    return this.validator.validateEnvironment();
  }

  /**
   * Generate configuration report
   */
  public generateReport(): string {
    return this.validator.generateConfigReport();
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();