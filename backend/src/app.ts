import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import passport from 'passport';

// Load environment variables first
import path from 'path';
import fs from 'fs';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

// Try multiple possible locations for the .env file (prioritize backend directory)
const possiblePaths = [
  path.resolve(process.cwd(), 'backend', envFile), // ./backend/.env.development (highest priority)
  path.resolve(__dirname, '..', '..', envFile),  // backend/.env.development
  path.resolve(process.cwd(), envFile), // ./.env.development (lowest priority)
];

let envLoaded = false;
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    console.log(`Trying to load environment from: ${envPath}`);
    const result = dotenv.config({ path: envPath });
    if (result.parsed && result.parsed.DB_NAME) {
      envLoaded = true;
      console.log(`Environment variables loaded successfully from: ${envPath}`);
      console.log(`DB_NAME: ${process.env.DB_NAME ? 'Set' : 'Not set'}`);
      console.log(`DB_USER: ${process.env.DB_USER ? 'Set' : 'Not set'}`);
      console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
      break;
    } else {
      console.log(`Environment file found but missing required DB_NAME variable: ${envPath}`);
    }
  }
}

if (!envLoaded) {
  console.warn('Warning: No environment file found, using system environment variables');
  // Fallback to default dotenv behavior
  dotenv.config();
}

// Debug: Print all environment variables after loading
console.log('=== Environment Variables Debug ===');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_USER: ${process.env.DB_USER}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? 'Set' : 'Not set'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`);
console.log('===================================');

// NOTE: All imports that depend on environment variables are deferred until after dotenv configuration

const app = express();

// Initialize configuration validation
let config: any;

// Setup middleware function (called after configuration validation)
const setupMiddleware = (app: express.Application, config: any, middleware: any) => {
  const {
    requestLoggingMiddleware,
    securityLoggingMiddleware,
    slowQueryLoggingMiddleware,
    responseWrapper,
    performanceMonitoring,
    initializeRecoveryContext,
    requestRecovery
  } = middleware;

  // Security and CORS middleware (must be first)
  app.use(helmet());
  app.use(cors({
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  }));

  // Basic middleware
  app.use(compression());

  // Custom middleware to handle text/plain content type as JSON
  app.use((req, res, next) => {
    const contentType = req.get('Content-Type');
    if (contentType && contentType.includes('text/plain')) {
      // Override content type to application/json so express.json() can parse it
      req.headers['content-type'] = 'application/json';
    }
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Passport middleware
  app.use(passport.initialize());

  // Request logging middleware (must be early to capture all requests)
  app.use(requestLoggingMiddleware);

  // Security logging middleware
  app.use(securityLoggingMiddleware);

  // Error recovery context initialization (must be early)
  app.use(initializeRecoveryContext);

  // Performance monitoring middleware
  app.use(performanceMonitoring);

  // Slow query logging middleware (5 second threshold)
  app.use(slowQueryLoggingMiddleware(5000));

  // Response wrapper middleware (must be before routes)
  app.use(responseWrapper);

  // Request recovery middleware (after response wrapper)
  app.use(requestRecovery);
};

// Setup routes function
const setupRoutes = (app: express.Application, routes: any, middleware: any, startupChecker: any) => {
  const {
    authRoutes, userRoutes, roleRoutes, permissionRoutes, operationLogRoutes,
    baseRoutes, barnRoutes, cattleRoutes, healthRoutes, redisHealthRoutes,
    feedingRoutes, materialRoutes, equipmentRoutes, supplierRoutes,
    purchaseOrderRoutes, purchaseRoutes, customerRoutes, salesOrderRoutes,
    newsRoutes, patrolRoutes, portalRoutes, publicRoutes, helpRoutes, uploadRoutes,
    dashboardRoutes, dataIntegrationRoutes, performanceRoutes, monitoringRoutes,
    securityRoutes, routeHealthRoutes, errorRecoveryRoutes, serveUploads
  } = routes;

  const {
    authMiddleware, notFoundHandler, errorLoggingMiddleware,
    errorRecoveryHandler, errorHandler
  } = middleware;

  // Health check endpoints
  app.get('/health', async (req, res) => {
    try {
      const healthCheck = await startupChecker.performHealthCheck();
      res.success({
        status: healthCheck.status,
        timestamp: healthCheck.timestamp,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        checks: healthCheck.checks
      }, 'System health check completed');
    } catch (error) {
      res.error('Health check failed', 500, 'HEALTH_CHECK_FAILED');
    }
  });

  // API health check
  app.get('/api/v1/health', async (req, res) => {
    try {
      const healthCheck = await startupChecker.performHealthCheck();
      res.success({
        status: healthCheck.status,
        timestamp: healthCheck.timestamp,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        checks: healthCheck.checks
      }, 'API health check completed');
    } catch (error) {
      res.error('Health check failed', 500, 'HEALTH_CHECK_FAILED');
    }
  });

  // Static file serving for uploads (before API routes)
  app.use('/uploads', serveUploads);

  // Public routes (no authentication required)
  app.use('/api/v1/public', publicRoutes);

  // API routes (authentication required)
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', authMiddleware, userRoutes);
  app.use('/api/v1/roles', authMiddleware, roleRoutes);
  app.use('/api/v1/permissions', authMiddleware, permissionRoutes);
  app.use('/api/v1/operation-logs', authMiddleware, operationLogRoutes);
  app.use('/api/v1/bases', authMiddleware, baseRoutes);
  app.use('/api/v1/barns', authMiddleware, barnRoutes);
  app.use('/api/v1/cattle', authMiddleware, cattleRoutes);
  app.use('/api/v1/health', authMiddleware, healthRoutes);
  app.use('/api/v1/redis-health', redisHealthRoutes);
  app.use('/api/v1/feeding', authMiddleware, feedingRoutes);
  app.use('/api/v1/materials', authMiddleware, materialRoutes);
  app.use('/api/v1/equipment', authMiddleware, equipmentRoutes);
  app.use('/api/v1/suppliers', authMiddleware, supplierRoutes);
  app.use('/api/v1/purchase-orders', authMiddleware, purchaseOrderRoutes);
  app.use('/api/v1/purchase', authMiddleware, purchaseRoutes);
  app.use('/api/v1/customers', authMiddleware, customerRoutes);
  app.use('/api/v1/sales-orders', authMiddleware, salesOrderRoutes);
  app.use('/api/v1/news', newsRoutes);
  app.use('/api/v1/patrol', authMiddleware, patrolRoutes);
  app.use('/api/v1/portal', authMiddleware, portalRoutes);
  app.use('/api/v1/help', helpRoutes);
  app.use('/api/v1/upload', authMiddleware, uploadRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/data-integration', authMiddleware, dataIntegrationRoutes);
  app.use('/api/v1/performance', authMiddleware, performanceRoutes);
  app.use('/api/v1/monitoring', authMiddleware, monitoringRoutes);
  app.use('/api/v1/security', authMiddleware, securityRoutes);
  app.use('/api/v1/system', authMiddleware, routeHealthRoutes);
  app.use('/api/v1/error-recovery', errorRecoveryRoutes);

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorLoggingMiddleware);
  app.use(errorRecoveryHandler);
  app.use(errorHandler);
};

// Database connection and server startup
const startServer = async () => {
  try {
    // Import all modules that depend on environment variables AFTER dotenv configuration
    const { configManager } = await import('@/config/ConfigManager');
    const { startupChecker } = await import('@/config/StartupChecker');
    const { logger } = await import('@/utils/logger');
    const { errorHandler, setupGlobalErrorHandlers } = await import('@/middleware/errorHandler');
    const { notFoundHandler } = await import('@/middleware/notFoundHandler');
    const { responseWrapper } = await import('@/middleware/responseWrapper');
    const { authMiddleware } = await import('@/middleware/auth');
    const { performanceMonitoring } = await import('@/middleware/performanceMonitoring');
    const {
      requestLoggingMiddleware,
      errorLoggingMiddleware,
      slowQueryLoggingMiddleware,
      securityLoggingMiddleware
    } = await import('@/middleware/requestLogging');
    const { sequelize } = await import('@/config/database');
    const { redisManager } = await import('@/config/redis');
    const { routeRegistry } = await import('@/config/RouteRegistry');
    const {
      initializeRecoveryContext,
      requestRecovery,
      errorRecoveryHandler
    } = await import('@/middleware/errorRecoveryMiddleware');

    // Import all routes
    const authRoutes = (await import('@/routes/auth')).default;
    const userRoutes = (await import('@/routes/users')).default;
    const roleRoutes = (await import('@/routes/roles')).default;
    const permissionRoutes = (await import('@/routes/permissions')).default;
    const operationLogRoutes = (await import('@/routes/operationLogs')).default;
    const baseRoutes = (await import('@/routes/bases')).default;
    const barnRoutes = (await import('@/routes/barns')).default;
    const cattleRoutes = (await import('@/routes/cattle')).default;
    const healthRoutes = (await import('@/routes/health')).default;
    const redisHealthRoutes = (await import('@/routes/redis-health')).default;
    const feedingRoutes = (await import('@/routes/feeding')).default;
    const materialRoutes = (await import('@/routes/materials')).default;
    const equipmentRoutes = (await import('@/routes/equipment')).default;
    const supplierRoutes = (await import('@/routes/suppliers')).default;
    const purchaseOrderRoutes = (await import('@/routes/purchaseOrders')).default;
    const purchaseRoutes = (await import('@/routes/purchase')).default;
    const customerRoutes = (await import('@/routes/customers')).default;
    const salesOrderRoutes = (await import('@/routes/salesOrders')).default;
    const newsRoutes = (await import('@/routes/news')).default;
    const patrolRoutes = (await import('@/routes/patrol')).default;
    const portalRoutes = (await import('@/routes/portal')).default;
    const publicRoutes = (await import('@/routes/public')).default;
    const helpRoutes = (await import('@/routes/help')).default;
    const uploadRoutes = (await import('@/routes/upload')).default;
    const dashboardRoutes = (await import('@/routes/dashboard')).default;
    const dataIntegrationRoutes = (await import('@/routes/dataIntegration')).default;
    const performanceRoutes = (await import('@/routes/performance')).default;
    const monitoringRoutes = (await import('@/routes/monitoring')).default;
    const securityRoutes = (await import('@/routes/security')).default;
    const routeHealthRoutes = (await import('@/routes/route-health')).default;
    const errorRecoveryRoutes = (await import('@/routes/error-recovery')).default;
    const { serveUploads } = await import('@/middleware/staticFileServer');

    logger.info('🚀 Starting application...');

    // 0. Setup global error handlers
    setupGlobalErrorHandlers();

    // 1. Perform comprehensive startup checks
    const startupResult = await startupChecker.performStartupChecks();

    if (!startupResult.success) {
      logger.error('💥 Startup checks failed. Exiting...');
      process.exit(1);
    }

    // 2. Get validated configuration
    config = configManager.getConfig();
    const PORT = config.port;

    // 3. Setup middleware with validated configuration
    const middleware = {
      requestLoggingMiddleware,
      securityLoggingMiddleware,
      slowQueryLoggingMiddleware,
      responseWrapper,
      performanceMonitoring,
      initializeRecoveryContext,
      requestRecovery
    };
    setupMiddleware(app, config, middleware);

    // 4. Initialize route registry
    logger.info('Initializing route registry...');
    await routeRegistry.scanRouteFiles();
    const routeValidation = routeRegistry.validateRoutes();

    if (!routeValidation.success) {
      logger.warn('Route validation issues found:', {
        conflicts: routeValidation.conflicts,
        errors: routeValidation.errors,
        warnings: routeValidation.warnings
      });
    } else {
      logger.info(`Route registry initialized successfully with ${routeValidation.totalRoutes} routes`);
    }

    // 5. Setup routes
    const routes = {
      authRoutes, userRoutes, roleRoutes, permissionRoutes, operationLogRoutes,
      baseRoutes, barnRoutes, cattleRoutes, healthRoutes, redisHealthRoutes,
      feedingRoutes, materialRoutes, equipmentRoutes, supplierRoutes,
      purchaseOrderRoutes, purchaseRoutes, customerRoutes, salesOrderRoutes,
      newsRoutes, patrolRoutes, portalRoutes, publicRoutes, helpRoutes, uploadRoutes,
      dashboardRoutes, dataIntegrationRoutes, performanceRoutes, monitoringRoutes,
      securityRoutes, routeHealthRoutes, errorRecoveryRoutes, serveUploads
    };

    const routeMiddleware = {
      authMiddleware, notFoundHandler, errorLoggingMiddleware,
      errorRecoveryHandler, errorHandler
    };

    setupRoutes(app, routes, routeMiddleware, startupChecker);

    // 6. Sync database models (in development)
    if (config.environment === 'development') {
      try {
        // First try basic sync without altering existing tables
        await sequelize.sync({ force: false, alter: false });
        logger.info('Database models synchronized (basic sync)');
      } catch (error) {
        logger.warn('Database basic sync failed, trying to create missing tables:', error);
        try {
          // If basic sync fails, try creating individual tables
          const models = Object.values(sequelize.models);
          for (const model of models) {
            try {
              await model.sync({ force: false, alter: false });
              logger.debug(`Table ${model.tableName} synchronized`);
            } catch (tableError) {
              logger.warn(`Failed to sync table ${model.tableName}:`, tableError);
            }
          }
          logger.info('Database models synchronized (individual table sync)');
        } catch (fallbackError) {
          logger.error('All database sync methods failed:', fallbackError);
          // Continue without database sync - the app can still run with existing tables
          logger.warn('Continuing without database sync - using existing database schema');
        }
      }
    }

    // 5. Initialize monitoring services
    if (config.environment !== 'test') {
      const { SystemMonitoringService } = await import('@/services/SystemMonitoringService');
      const { LogAnalysisService } = await import('@/services/LogAnalysisService');
      const { SecurityService } = await import('@/services/SecurityService');

      SystemMonitoringService.initializeDefaultRules();
      LogAnalysisService.initialize();
      SecurityService.initialize();
      logger.info('Monitoring and security services initialized successfully');
    }

    // 6. Initialize error recovery services
    if (config.environment !== 'test') {
      const { errorRecoveryService } = await import('@/services/ErrorRecoveryService');
      const { serviceDegradationManager } = await import('@/services/ServiceDegradationManager');
      const { selfHealingService } = await import('@/services/SelfHealingService');

      // Start monitoring for automatic recovery
      errorRecoveryService.startMonitoring(30000); // Check every 30 seconds
      serviceDegradationManager.startMonitoring(30000);
      selfHealingService.startMonitoring(60000); // Check every minute

      logger.info('Error recovery services initialized and monitoring started');
    }

    // 6. Start scheduled tasks
    if (config.environment !== 'test') {
      const { ScheduledTaskService } = await import('@/services/ScheduledTaskService');
      await ScheduledTaskService.startAllTasks();
      logger.info('Scheduled tasks started successfully');
    }

    // 7. Start server
    app.listen(PORT, () => {
      logger.info(`🎉 Server is running on port ${PORT}`);
      logger.info(`Environment: ${config.environment}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);

      if (config.logLevel === 'debug') {
        logger.debug('Configuration Report:');
        logger.debug(configManager.generateReport());
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    const { logger } = await import('@/utils/logger');
    const { sequelize } = await import('@/config/database');
    const { redisManager } = await import('@/config/redis');

    logger.info('SIGTERM received, shutting down gracefully');

    // Stop scheduled tasks
    if (process.env.NODE_ENV !== 'test') {
      const { ScheduledTaskService } = await import('@/services/ScheduledTaskService');
      ScheduledTaskService.stopAllTasks();
    }

    // Stop error recovery services
    if (process.env.NODE_ENV !== 'test') {
      const { errorRecoveryService } = await import('@/services/ErrorRecoveryService');
      const { serviceDegradationManager } = await import('@/services/ServiceDegradationManager');
      const { selfHealingService } = await import('@/services/SelfHealingService');

      errorRecoveryService.shutdown();
      serviceDegradationManager.shutdown();
      selfHealingService.shutdown();
      logger.info('Error recovery services shutdown complete');
    }

    await sequelize.close();
    await redisManager.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  try {
    const { logger } = await import('@/utils/logger');
    const { sequelize } = await import('@/config/database');
    const { redisManager } = await import('@/config/redis');

    logger.info('SIGINT received, shutting down gracefully');

    // Stop scheduled tasks
    if (process.env.NODE_ENV !== 'test') {
      const { ScheduledTaskService } = await import('@/services/ScheduledTaskService');
      ScheduledTaskService.stopAllTasks();
    }

    // Stop error recovery services
    if (process.env.NODE_ENV !== 'test') {
      const { errorRecoveryService } = await import('@/services/ErrorRecoveryService');
      const { serviceDegradationManager } = await import('@/services/ServiceDegradationManager');
      const { selfHealingService } = await import('@/services/SelfHealingService');

      errorRecoveryService.shutdown();
      serviceDegradationManager.shutdown();
      selfHealingService.shutdown();
      logger.info('Error recovery services shutdown complete');
    }

    await sequelize.close();
    await redisManager.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
});

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    console.error('Server startup failed:', error);
    process.exit(1);
  });
}

// Initialize routes for testing
let routesInitialized = false;

export const initializeAppForTesting = async () => {
  if (routesInitialized) return app;

  try {
    // Import all modules that depend on environment variables
    const { configManager } = await import('@/config/ConfigManager');
    const { startupChecker } = await import('@/config/StartupChecker');

    // Initialize configuration
    await configManager.initialize();
    const { errorHandler } = await import('@/middleware/errorHandler');
    const { notFoundHandler } = await import('@/middleware/notFoundHandler');
    const { responseWrapper } = await import('@/middleware/responseWrapper');
    const { authMiddleware } = await import('@/middleware/auth');
    const {
      requestLoggingMiddleware,
      errorLoggingMiddleware,
      slowQueryLoggingMiddleware,
      securityLoggingMiddleware
    } = await import('@/middleware/requestLogging');
    const { performanceMonitoring } = await import('@/middleware/performanceMonitoring');
    const {
      initializeRecoveryContext,
      requestRecovery,
      errorRecoveryHandler
    } = await import('@/middleware/errorRecoveryMiddleware');

    // Import all route modules individually
    const authRoutes = (await import('@/routes/auth')).default;
    const userRoutes = (await import('@/routes/users')).default;
    const roleRoutes = (await import('@/routes/roles')).default;
    const permissionRoutes = (await import('@/routes/permissions')).default;
    const operationLogRoutes = (await import('@/routes/operationLogs')).default;
    const baseRoutes = (await import('@/routes/bases')).default;
    const barnRoutes = (await import('@/routes/barns')).default;
    const cattleRoutes = (await import('@/routes/cattle')).default;
    const healthRoutes = (await import('@/routes/health')).default;
    const redisHealthRoutes = (await import('@/routes/redis-health')).default;
    const feedingRoutes = (await import('@/routes/feeding')).default;
    const materialRoutes = (await import('@/routes/materials')).default;
    const equipmentRoutes = (await import('@/routes/equipment')).default;
    const supplierRoutes = (await import('@/routes/suppliers')).default;
    const purchaseOrderRoutes = (await import('@/routes/purchaseOrders')).default;
    const purchaseRoutes = (await import('@/routes/purchase')).default;
    const customerRoutes = (await import('@/routes/customers')).default;
    const salesOrderRoutes = (await import('@/routes/salesOrders')).default;
    const newsRoutes = (await import('@/routes/news')).default;
    const patrolRoutes = (await import('@/routes/patrol')).default;
    const portalRoutes = (await import('@/routes/portal')).default;
    const publicRoutes = (await import('@/routes/public')).default;
    const helpRoutes = (await import('@/routes/help')).default;
    const uploadRoutes = (await import('@/routes/upload')).default;
    const dashboardRoutes = (await import('@/routes/dashboard')).default;
    const dataIntegrationRoutes = (await import('@/routes/dataIntegration')).default;
    const performanceRoutes = (await import('@/routes/performance')).default;
    const monitoringRoutes = (await import('@/routes/monitoring')).default;
    const securityRoutes = (await import('@/routes/security')).default;
    const routeHealthRoutes = (await import('@/routes/route-health')).default;
    const errorRecoveryRoutes = (await import('@/routes/error-recovery')).default;
    const { serveUploads } = await import('@/middleware/staticFileServer');

    // Get validated configuration
    config = configManager.getConfig();

    // Setup middleware
    const middlewareConfig = {
      requestLoggingMiddleware,
      securityLoggingMiddleware,
      slowQueryLoggingMiddleware,
      responseWrapper,
      performanceMonitoring,
      initializeRecoveryContext,
      requestRecovery
    };
    setupMiddleware(app, config, middlewareConfig);

    // Setup routes
    const routes = {
      authRoutes, userRoutes, roleRoutes, permissionRoutes, operationLogRoutes,
      baseRoutes, barnRoutes, cattleRoutes, healthRoutes, redisHealthRoutes,
      feedingRoutes, materialRoutes, equipmentRoutes, supplierRoutes,
      purchaseOrderRoutes, purchaseRoutes, customerRoutes, salesOrderRoutes,
      newsRoutes, patrolRoutes, portalRoutes, publicRoutes, helpRoutes, uploadRoutes,
      dashboardRoutes, dataIntegrationRoutes, performanceRoutes, monitoringRoutes,
      securityRoutes, routeHealthRoutes, errorRecoveryRoutes, serveUploads
    };

    const routeMiddleware = {
      authMiddleware,
      notFoundHandler,
      errorLoggingMiddleware,
      errorRecoveryHandler,
      errorHandler
    };

    setupRoutes(app, routes, routeMiddleware, startupChecker);
    routesInitialized = true;

    return app;
  } catch (error) {
    console.error('Failed to initialize app for testing:', error);
    throw error;
  }
};

// Auto-initialize for testing if NODE_ENV is test
if (process.env.NODE_ENV === 'test') {
  initializeAppForTesting().catch(console.error);
}

export default app;