import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import passport from 'passport';

// Load environment variables first
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

// Configuration validation and management
import { configManager } from '@/config/ConfigManager';
import { startupChecker } from '@/config/StartupChecker';

// Types are automatically loaded by TypeScript compiler
import { logger } from '@/utils/logger';
import { errorHandler, setupGlobalErrorHandlers } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { responseWrapper } from '@/middleware/responseWrapper';
import { authMiddleware } from '@/middleware/auth';
import { performanceMonitoring } from '@/middleware/performanceMonitoring';
import { 
  requestLoggingMiddleware, 
  errorLoggingMiddleware, 
  slowQueryLoggingMiddleware,
  securityLoggingMiddleware 
} from '@/middleware/requestLogging';
import { sequelize } from '@/config/database';
import { redisManager } from '@/config/redis';
import { routeRegistry } from '@/config/RouteRegistry';

// Error recovery system imports
import { 
  initializeRecoveryContext, 
  requestRecovery, 
  errorRecoveryHandler 
} from '@/middleware/errorRecoveryMiddleware';

// Import routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import roleRoutes from '@/routes/roles';
import permissionRoutes from '@/routes/permissions';
import operationLogRoutes from '@/routes/operationLogs';
import baseRoutes from '@/routes/bases';
import barnRoutes from '@/routes/barns';
import cattleRoutes from '@/routes/cattle';
import healthRoutes from '@/routes/health';
import redisHealthRoutes from '@/routes/redis-health';
import feedingRoutes from '@/routes/feeding';
import materialRoutes from '@/routes/materials';
import equipmentRoutes from '@/routes/equipment';
import supplierRoutes from '@/routes/suppliers';
import purchaseOrderRoutes from '@/routes/purchaseOrders';
import purchaseRoutes from '@/routes/purchase';
import customerRoutes from '@/routes/customers';
import salesOrderRoutes from '@/routes/salesOrders';
import newsRoutes from '@/routes/news';
import portalRoutes from '@/routes/portal';
import publicRoutes from '@/routes/public';
import helpRoutes from '@/routes/help';
import uploadRoutes from '@/routes/upload';
import dashboardRoutes from '@/routes/dashboard';
import dataIntegrationRoutes from '@/routes/dataIntegration';
import performanceRoutes from '@/routes/performance';
import monitoringRoutes from '@/routes/monitoring';
import securityRoutes from '@/routes/security';
import routeHealthRoutes from '@/routes/route-health';
import errorRecoveryRoutes from '@/routes/error-recovery';
import { serveUploads } from '@/middleware/staticFileServer';

const app = express();

// Initialize configuration validation
let config: any;

// Setup middleware function (called after configuration validation)
const setupMiddleware = (app: express.Application, config: any) => {
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
const setupRoutes = (app: express.Application) => {
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
  app.use('/api/v1/health-records', authMiddleware, healthRoutes);
  app.use('/api/v1/health', redisHealthRoutes);
  app.use('/api/v1/feeding', authMiddleware, feedingRoutes);
  app.use('/api/v1/materials', authMiddleware, materialRoutes);
  app.use('/api/v1/equipment', authMiddleware, equipmentRoutes);
  app.use('/api/v1/suppliers', authMiddleware, supplierRoutes);
  app.use('/api/v1/purchase-orders', authMiddleware, purchaseOrderRoutes);
  app.use('/api/v1/purchase', authMiddleware, purchaseRoutes);
  app.use('/api/v1/customers', authMiddleware, customerRoutes);
  app.use('/api/v1/sales-orders', authMiddleware, salesOrderRoutes);
  app.use('/api/v1/news', newsRoutes);
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
    setupMiddleware(app, config);

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
    setupRoutes(app);

    // 6. Sync database models (in development)
    if (config.environment === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
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
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
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
});

process.on('SIGINT', async () => {
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
});

// Start the server
if (require.main === module) {
  startServer().catch(error => {
    logger.error('Server startup failed:', error);
    process.exit(1);
  });
}

export default app;