import { Router, Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';

export interface RouteDefinition {
  method: string;
  path: string;
  handler: string;
  middleware: string[];
  file: string;
  line?: number;
}

export interface RouteConflict {
  method: string;
  path: string;
  files: string[];
}

export interface RouteValidationResult {
  success: boolean;
  totalRoutes: number;
  conflicts: RouteConflict[];
  errors: string[];
  warnings: string[];
}

export interface RouteHealthStatus {
  path: string;
  method: string;
  status: 'healthy' | 'error' | 'warning';
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

export class RouteRegistry {
  private routes: Map<string, RouteDefinition[]> = new Map();
  private routeHealth: Map<string, RouteHealthStatus> = new Map();
  private routesDirectory: string;

  constructor(routesDirectory: string = path.join(__dirname, '../routes')) {
    this.routesDirectory = routesDirectory;
  }

  /**
   * Register a route definition
   */
  registerRoute(route: RouteDefinition): void {
    const key = `${route.method.toUpperCase()}:${route.path}`;
    
    if (!this.routes.has(key)) {
      this.routes.set(key, []);
    }
    
    this.routes.get(key)!.push(route);
    
    logger.debug(`Route registered: ${key} from ${route.file}`);
  }

  /**
   * Get all registered routes
   */
  getRoutes(): Map<string, RouteDefinition[]> {
    return this.routes;
  }

  /**
   * Get route map for API documentation
   */
  getRouteMap(): Record<string, RouteDefinition[]> {
    const routeMap: Record<string, RouteDefinition[]> = {};
    
    for (const [key, routes] of this.routes.entries()) {
      routeMap[key] = routes;
    }
    
    return routeMap;
  }

  /**
   * Validate all registered routes for conflicts and issues
   */
  validateRoutes(): RouteValidationResult {
    const result: RouteValidationResult = {
      success: true,
      totalRoutes: 0,
      conflicts: [],
      errors: [],
      warnings: []
    };

    // Count total routes
    for (const routes of this.routes.values()) {
      result.totalRoutes += routes.length;
    }

    // Check for conflicts (same method + path in different files)
    for (const [key, routes] of this.routes.entries()) {
      if (routes.length > 1) {
        const [method, path] = key.split(':');
        const files = routes.map(r => r.file);
        const uniqueFiles = [...new Set(files)];
        
        if (uniqueFiles.length > 1) {
          result.conflicts.push({
            method,
            path,
            files: uniqueFiles
          });
          result.success = false;
        }
      }
    }

    // Check for potential issues
    for (const [key, routes] of this.routes.entries()) {
      const [method, path] = key.split(':');
      
      // Check for missing authentication on protected routes
      for (const route of routes) {
        if (path.startsWith('/api/v1/') && 
            !path.includes('/public') && 
            !path.includes('/auth') && 
            !path.includes('/health') &&
            !route.middleware.some(m => m.includes('auth'))) {
          result.warnings.push(`Route ${method} ${path} may need authentication middleware`);
        }
      }
    }

    return result;
  }

  /**
   * Scan route files and extract route definitions
   */
  async scanRouteFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.routesDirectory);
      const routeFiles = files.filter(file => 
        (file.endsWith('.ts') || file.endsWith('.js')) && 
        !file.endsWith('.test.ts') && 
        !file.endsWith('.test.js')
      );

      for (const file of routeFiles) {
        await this.scanRouteFile(path.join(this.routesDirectory, file));
      }

      logger.info(`Scanned ${routeFiles.length} route files`);
    } catch (error) {
      logger.error('Error scanning route files:', error);
      throw error;
    }
  }

  /**
   * Scan a single route file for route definitions
   */
  private async scanRouteFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const fileName = path.basename(filePath);

      // Simple regex patterns to match route definitions
      const routePatterns = [
        /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
        /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const pattern of routePatterns) {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            const method = match[1].toUpperCase();
            const routePath = match[2];
            
            // Extract middleware from the line
            const middleware = this.extractMiddleware(line);
            
            this.registerRoute({
              method,
              path: routePath,
              handler: this.extractHandler(line) || 'unknown',
              middleware,
              file: fileName,
              line: i + 1
            });
          }
        }
      }
    } catch (error) {
      logger.error(`Error scanning route file ${filePath}:`, error);
    }
  }

  /**
   * Extract middleware from a route definition line
   */
  private extractMiddleware(line: string): string[] {
    const middleware: string[] = [];
    
    // Common middleware patterns
    const middlewarePatterns = [
      /auth(?:enticate)?(?:Middleware)?/g,
      /requirePermission/g,
      /authorize/g,
      /permission/g,
      /validate/g,
      /dataPermission/g,
      /operationLog/g
    ];

    for (const pattern of middlewarePatterns) {
      if (pattern.test(line)) {
        const matches = line.match(pattern);
        if (matches) {
          middleware.push(...matches);
        }
      }
    }

    return middleware;
  }

  /**
   * Extract handler function name from a route definition line
   */
  private extractHandler(line: string): string | null {
    // Look for Controller.method pattern
    const controllerMatch = line.match(/(\w+Controller)\.(\w+)/);
    if (controllerMatch) {
      return `${controllerMatch[1]}.${controllerMatch[2]}`;
    }

    // Look for function names
    const functionMatch = line.match(/,\s*(\w+)\s*\)/);
    if (functionMatch) {
      return functionMatch[1];
    }

    return null;
  }

  /**
   * Check health of registered routes
   */
  async checkRouteHealth(): Promise<RouteHealthStatus[]> {
    const healthStatuses: RouteHealthStatus[] = [];

    for (const [key, routes] of this.routes.entries()) {
      const [method, path] = key.split(':');
      
      for (const route of routes) {
        const status: RouteHealthStatus = {
          path,
          method,
          status: 'healthy',
          lastChecked: new Date()
        };

        try {
          // Basic validation checks
          if (!route.handler || route.handler === 'unknown') {
            status.status = 'warning';
            status.error = 'Handler not identified';
          }

          // Check if route needs authentication but doesn't have it
          if (path.startsWith('/api/v1/') && 
              !path.includes('/public') && 
              !path.includes('/auth') && 
              !path.includes('/health') &&
              !route.middleware.some(m => m.includes('auth'))) {
            status.status = 'warning';
            status.error = 'Missing authentication middleware';
          }

        } catch (error) {
          status.status = 'error';
          status.error = error instanceof Error ? error.message : 'Unknown error';
        }

        this.routeHealth.set(key, status);
        healthStatuses.push(status);
      }
    }

    return healthStatuses;
  }

  /**
   * Generate API documentation from registered routes
   */
  generateApiDocs(): any {
    const docs = {
      openapi: '3.0.0',
      info: {
        title: 'Cattle Management System API',
        version: '1.0.0',
        description: 'Auto-generated API documentation from route registry'
      },
      paths: {} as any
    };

    for (const [key, routes] of this.routes.entries()) {
      const [method, path] = key.split(':');
      
      if (!docs.paths[path]) {
        docs.paths[path] = {};
      }

      for (const route of routes) {
        docs.paths[path][method.toLowerCase()] = {
          summary: `${method} ${path}`,
          description: `Handler: ${route.handler}`,
          tags: [route.file.replace('.ts', '').replace('.js', '')],
          responses: {
            '200': {
              description: 'Success'
            },
            '400': {
              description: 'Bad Request'
            },
            '401': {
              description: 'Unauthorized'
            },
            '403': {
              description: 'Forbidden'
            },
            '500': {
              description: 'Internal Server Error'
            }
          }
        };

        // Add security if authentication middleware is present
        if (route.middleware.some(m => m.includes('auth'))) {
          docs.paths[path][method.toLowerCase()].security = [
            { bearerAuth: [] }
          ];
        }
      }
    }

    return docs;
  }

  /**
   * Get route statistics
   */
  getStatistics(): any {
    const stats = {
      totalRoutes: 0,
      routesByMethod: {} as Record<string, number>,
      routesByFile: {} as Record<string, number>,
      middlewareUsage: {} as Record<string, number>,
      healthStatus: {
        healthy: 0,
        warning: 0,
        error: 0
      }
    };

    for (const [key, routes] of this.routes.entries()) {
      const [method] = key.split(':');
      
      stats.totalRoutes += routes.length;
      stats.routesByMethod[method] = (stats.routesByMethod[method] || 0) + routes.length;

      for (const route of routes) {
        stats.routesByFile[route.file] = (stats.routesByFile[route.file] || 0) + 1;
        
        for (const middleware of route.middleware) {
          stats.middlewareUsage[middleware] = (stats.middlewareUsage[middleware] || 0) + 1;
        }
      }
    }

    // Count health statuses
    for (const status of this.routeHealth.values()) {
      stats.healthStatus[status.status]++;
    }

    return stats;
  }

  /**
   * Clear all registered routes
   */
  clear(): void {
    this.routes.clear();
    this.routeHealth.clear();
  }
}

// Singleton instance
export const routeRegistry = new RouteRegistry();