import { RouteRegistry } from '@/config/RouteRegistry';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('RouteRegistry', () => {
  let routeRegistry: RouteRegistry;
  const mockRoutesDir = '/mock/routes';

  beforeEach(() => {
    routeRegistry = new RouteRegistry(mockRoutesDir);
    jest.clearAllMocks();
  });

  describe('registerRoute', () => {
    it('should register a new route', () => {
      const route = {
        method: 'GET',
        path: '/api/test',
        handler: 'TestController.getTest',
        middleware: ['auth'],
        file: 'test.ts'
      };

      routeRegistry.registerRoute(route);
      const routes = routeRegistry.getRoutes();
      
      expect(routes.has('GET:/api/test')).toBe(true);
      expect(routes.get('GET:/api/test')).toEqual([route]);
    });

    it('should handle multiple routes with same method and path', () => {
      const route1 = {
        method: 'GET',
        path: '/api/test',
        handler: 'TestController.getTest',
        middleware: ['auth'],
        file: 'test1.ts'
      };

      const route2 = {
        method: 'GET',
        path: '/api/test',
        handler: 'TestController.getTest',
        middleware: ['auth'],
        file: 'test2.ts'
      };

      routeRegistry.registerRoute(route1);
      routeRegistry.registerRoute(route2);
      
      const routes = routeRegistry.getRoutes();
      expect(routes.get('GET:/api/test')).toHaveLength(2);
    });
  });

  describe('validateRoutes', () => {
    it('should detect route conflicts', () => {
      const route1 = {
        method: 'GET',
        path: '/api/test',
        handler: 'TestController.getTest',
        middleware: ['auth'],
        file: 'test1.ts'
      };

      const route2 = {
        method: 'GET',
        path: '/api/test',
        handler: 'TestController.getTest',
        middleware: ['auth'],
        file: 'test2.ts'
      };

      routeRegistry.registerRoute(route1);
      routeRegistry.registerRoute(route2);
      
      const validation = routeRegistry.validateRoutes();
      
      expect(validation.success).toBe(false);
      expect(validation.conflicts).toHaveLength(1);
      expect(validation.conflicts[0]).toEqual({
        method: 'GET',
        path: '/api/test',
        files: ['test1.ts', 'test2.ts']
      });
    });

    it('should warn about missing authentication on protected routes', () => {
      const route = {
        method: 'GET',
        path: '/api/v1/protected',
        handler: 'TestController.getTest',
        middleware: [],
        file: 'test.ts'
      };

      routeRegistry.registerRoute(route);
      
      const validation = routeRegistry.validateRoutes();
      
      expect(validation.warnings).toContain('Route GET /api/v1/protected may need authentication middleware');
    });

    it('should not warn about public routes', () => {
      const route = {
        method: 'GET',
        path: '/api/v1/public/test',
        handler: 'TestController.getTest',
        middleware: [],
        file: 'test.ts'
      };

      routeRegistry.registerRoute(route);
      
      const validation = routeRegistry.validateRoutes();
      
      expect(validation.warnings).toHaveLength(0);
    });
  });

  describe('scanRouteFiles', () => {
    it('should scan route files and extract routes', async () => {
      const mockFiles = ['test.ts', 'auth.ts', 'test.test.ts'];
      const mockContent = `
        import { Router } from 'express';
        const router = Router();
        
        router.get('/test', authMiddleware, TestController.getTest);
        router.post('/test', validate, TestController.createTest);
      `;

      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockFs.readFileSync.mockReturnValue(mockContent);

      await routeRegistry.scanRouteFiles();
      
      const routes = routeRegistry.getRoutes();
      expect(routes.has('GET:/test')).toBe(true);
      expect(routes.has('POST:/test')).toBe(true);
      expect(mockFs.readdirSync).toHaveBeenCalledWith(mockRoutesDir);
    });

    it('should handle file reading errors gracefully', async () => {
      const mockFiles = ['test.ts'];
      
      mockFs.readdirSync.mockReturnValue(mockFiles as any);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      await expect(routeRegistry.scanRouteFiles()).resolves.not.toThrow();
    });
  });

  describe('checkRouteHealth', () => {
    it('should check route health and identify issues', async () => {
      const routeWithoutHandler = {
        method: 'GET',
        path: '/api/v1/test',
        handler: 'unknown',
        middleware: ['auth'],
        file: 'test.ts'
      };

      const routeWithoutAuth = {
        method: 'GET',
        path: '/api/v1/protected',
        handler: 'TestController.getTest',
        middleware: [],
        file: 'test.ts'
      };

      routeRegistry.registerRoute(routeWithoutHandler);
      routeRegistry.registerRoute(routeWithoutAuth);
      
      const healthStatuses = await routeRegistry.checkRouteHealth();
      
      expect(healthStatuses).toHaveLength(2);
      expect(healthStatuses[0].status).toBe('warning');
      expect(healthStatuses[0].error).toBe('Handler not identified');
      expect(healthStatuses[1].status).toBe('warning');
      expect(healthStatuses[1].error).toBe('Missing authentication middleware');
    });
  });

  describe('generateApiDocs', () => {
    it('should generate OpenAPI documentation', () => {
      const route = {
        method: 'GET',
        path: '/api/test',
        handler: 'TestController.getTest',
        middleware: ['auth'],
        file: 'test.ts'
      };

      routeRegistry.registerRoute(route);
      
      const docs = routeRegistry.generateApiDocs();
      
      expect(docs.openapi).toBe('3.0.0');
      expect(docs.paths['/api/test']).toBeDefined();
      expect(docs.paths['/api/test'].get).toBeDefined();
      expect(docs.paths['/api/test'].get.security).toEqual([{ bearerAuth: [] }]);
    });
  });

  describe('getStatistics', () => {
    it('should return route statistics', () => {
      const route1 = {
        method: 'GET',
        path: '/api/test1',
        handler: 'TestController.getTest1',
        middleware: ['auth', 'validate'],
        file: 'test.ts'
      };

      const route2 = {
        method: 'POST',
        path: '/api/test2',
        handler: 'TestController.createTest2',
        middleware: ['auth'],
        file: 'test.ts'
      };

      routeRegistry.registerRoute(route1);
      routeRegistry.registerRoute(route2);
      
      const stats = routeRegistry.getStatistics();
      
      expect(stats.totalRoutes).toBe(2);
      expect(stats.routesByMethod.GET).toBe(1);
      expect(stats.routesByMethod.POST).toBe(1);
      expect(stats.routesByFile['test.ts']).toBe(2);
      expect(stats.middlewareUsage.auth).toBe(2);
      expect(stats.middlewareUsage.validate).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all registered routes', () => {
      const route = {
        method: 'GET',
        path: '/api/test',
        handler: 'TestController.getTest',
        middleware: ['auth'],
        file: 'test.ts'
      };

      routeRegistry.registerRoute(route);
      expect(routeRegistry.getRoutes().size).toBe(1);
      
      routeRegistry.clear();
      expect(routeRegistry.getRoutes().size).toBe(0);
    });
  });
});