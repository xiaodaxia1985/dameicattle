import request from 'supertest';
import express from 'express';
import routeHealthRoutes from '@/routes/route-health';
import { routeRegistry } from '@/config/RouteRegistry';
import { generateToken } from '@/middleware/auth';

// Mock the route registry
jest.mock('@/config/RouteRegistry');
const mockRouteRegistry = routeRegistry as jest.Mocked<typeof routeRegistry>;

// Mock auth middleware
jest.mock('@/middleware/auth', () => ({
  requirePermission: (permission: string) => (req: any, res: any, next: any) => {
    // Mock user with system:read permission
    req.user = {
      id: 1,
      role: {
        permissions: ['system:read', 'system:write']
      }
    };
    next();
  },
  generateToken: jest.fn()
}));

describe('Route Health Endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/system', routeHealthRoutes);
    jest.clearAllMocks();
  });

  describe('GET /routes', () => {
    it('should return all registered routes', async () => {
      const mockRoutes = {
        'GET:/api/test': [{
          method: 'GET',
          path: '/api/test',
          handler: 'TestController.getTest',
          middleware: ['auth'],
          file: 'test.ts'
        }]
      };

      mockRouteRegistry.getRouteMap.mockReturnValue(mockRoutes);

      const response = await request(app)
        .get('/api/v1/system/routes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.routes).toEqual(mockRoutes);
      expect(response.body.data.total).toBe(1);
    });

    it('should handle errors when getting routes', async () => {
      mockRouteRegistry.getRouteMap.mockImplementation(() => {
        throw new Error('Registry error');
      });

      const response = await request(app)
        .get('/api/v1/system/routes')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to get routes');
    });
  });

  describe('GET /routes/validate', () => {
    it('should return route validation results', async () => {
      const mockValidation = {
        success: true,
        totalRoutes: 10,
        conflicts: [],
        errors: [],
        warnings: []
      };

      mockRouteRegistry.validateRoutes.mockReturnValue(mockValidation);

      const response = await request(app)
        .get('/api/v1/system/routes/validate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockValidation);
    });

    it('should return validation failures', async () => {
      const mockValidation = {
        success: false,
        totalRoutes: 10,
        conflicts: [{
          method: 'GET',
          path: '/api/test',
          files: ['test1.ts', 'test2.ts']
        }],
        errors: ['Some error'],
        warnings: ['Some warning']
      };

      mockRouteRegistry.validateRoutes.mockReturnValue(mockValidation);

      const response = await request(app)
        .get('/api/v1/system/routes/validate')
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.data.conflicts).toHaveLength(1);
    });
  });

  describe('GET /routes/health', () => {
    it('should return route health status', async () => {
      const mockHealthStatuses = [
        {
          path: '/api/test',
          method: 'GET',
          status: 'healthy' as const,
          lastChecked: new Date()
        },
        {
          path: '/api/error',
          method: 'POST',
          status: 'error' as const,
          lastChecked: new Date(),
          error: 'Handler not found'
        }
      ];

      mockRouteRegistry.checkRouteHealth.mockResolvedValue(mockHealthStatuses);

      const response = await request(app)
        .get('/api/v1/system/routes/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary.total).toBe(2);
      expect(response.body.data.summary.healthy).toBe(1);
      expect(response.body.data.summary.error).toBe(1);
      expect(response.body.data.routes).toHaveLength(2);
    });
  });

  describe('GET /routes/statistics', () => {
    it('should return route statistics', async () => {
      const mockStats = {
        totalRoutes: 25,
        routesByMethod: {
          GET: 15,
          POST: 8,
          PUT: 2
        },
        routesByFile: {
          'auth.ts': 5,
          'users.ts': 10,
          'test.ts': 10
        },
        middlewareUsage: {
          auth: 20,
          validate: 15,
          permission: 10
        },
        healthStatus: {
          healthy: 20,
          warning: 3,
          error: 2
        }
      };

      mockRouteRegistry.getStatistics.mockReturnValue(mockStats);

      const response = await request(app)
        .get('/api/v1/system/routes/statistics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
    });
  });

  describe('GET /routes/docs', () => {
    it('should generate API documentation', async () => {
      const mockDocs = {
        openapi: '3.0.0',
        info: {
          title: 'Cattle Management System API',
          version: '1.0.0'
        },
        paths: {
          '/api/test': {
            get: {
              summary: 'GET /api/test',
              responses: {
                '200': { description: 'Success' }
              }
            }
          }
        }
      };

      mockRouteRegistry.generateApiDocs.mockReturnValue(mockDocs);

      const response = await request(app)
        .get('/api/v1/system/routes/docs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.openapi).toBe('3.0.0');
      expect(response.body.data.paths['/api/test']).toBeDefined();
    });
  });

  describe('POST /routes/rescan', () => {
    it('should rescan route files', async () => {
      const mockValidation = {
        success: true,
        totalRoutes: 15,
        conflicts: [],
        errors: [],
        warnings: []
      };

      mockRouteRegistry.clear.mockImplementation(() => {});
      mockRouteRegistry.scanRouteFiles.mockResolvedValue();
      mockRouteRegistry.validateRoutes.mockReturnValue(mockValidation);

      const response = await request(app)
        .post('/api/v1/system/routes/rescan')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Routes rescanned successfully');
      expect(response.body.data.validation).toEqual(mockValidation);
      
      expect(mockRouteRegistry.clear).toHaveBeenCalled();
      expect(mockRouteRegistry.scanRouteFiles).toHaveBeenCalled();
      expect(mockRouteRegistry.validateRoutes).toHaveBeenCalled();
    });

    it('should handle rescan errors', async () => {
      mockRouteRegistry.clear.mockImplementation(() => {});
      mockRouteRegistry.scanRouteFiles.mockRejectedValue(new Error('Scan error'));

      const response = await request(app)
        .post('/api/v1/system/routes/rescan')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to rescan routes');
    });
  });
});