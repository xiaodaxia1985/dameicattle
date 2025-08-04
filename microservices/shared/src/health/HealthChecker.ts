import axios from 'axios';
import { createLogger } from '../logger';

const logger = createLogger('health-checker');

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  timestamp: number;
  error?: string;
  details?: any;
}

export interface ServiceConfig {
  name: string;
  url: string;
  timeout?: number;
  retries?: number;
  interval?: number;
}

export class HealthChecker {
  private services: Map<string, ServiceConfig> = new Map();
  private results: Map<string, HealthCheckResult> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // 注册服务
  registerService(config: ServiceConfig): void {
    this.services.set(config.name, {
      timeout: 5000,
      retries: 3,
      interval: 30000,
      ...config
    });
    
    logger.info(`服务已注册: ${config.name} - ${config.url}`);
  }

  // 检查单个服务健康状态
  async checkService(serviceName: string): Promise<HealthCheckResult> {
    const config = this.services.get(serviceName);
    if (!config) {
      throw new Error(`未找到服务配置: ${serviceName}`);
    }

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      const response = await axios.get(`${config.url}/health`, {
        timeout: config.timeout,
        validateStatus: (status) => status < 500
      });

      const responseTime = Date.now() - startTime;

      if (response.status === 200 && response.data.status === 'healthy') {
        result = {
          service: serviceName,
          status: 'healthy',
          responseTime,
          timestamp: Date.now(),
          details: response.data
        };
      } else {
        result = {
          service: serviceName,
          status: 'unhealthy',
          responseTime,
          timestamp: Date.now(),
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: response.data
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      result = {
        service: serviceName,
        status: 'unhealthy',
        responseTime,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      };
    }

    this.results.set(serviceName, result);
    
    if (result.status === 'unhealthy') {
      logger.warn(`服务不健康: ${serviceName}`, { 
        error: result.error,
        responseTime: result.responseTime 
      });
    } else {
      logger.debug(`服务健康: ${serviceName}`, { 
        responseTime: result.responseTime 
      });
    }

    return result;
  }

  // 检查所有服务
  async checkAllServices(): Promise<HealthCheckResult[]> {
    const promises = Array.from(this.services.keys()).map(serviceName => 
      this.checkService(serviceName)
    );

    return Promise.all(promises);
  }

  // 获取服务健康状态
  getServiceHealth(serviceName: string): HealthCheckResult | undefined {
    return this.results.get(serviceName);
  }

  // 获取所有服务健康状态
  getAllServiceHealth(): HealthCheckResult[] {
    return Array.from(this.results.values());
  }

  // 获取健康的服务列表
  getHealthyServices(): string[] {
    return Array.from(this.results.entries())
      .filter(([_, result]) => result.status === 'healthy')
      .map(([serviceName, _]) => serviceName);
  }

  // 获取不健康的服务列表
  getUnhealthyServices(): string[] {
    return Array.from(this.results.entries())
      .filter(([_, result]) => result.status === 'unhealthy')
      .map(([serviceName, _]) => serviceName);
  }

  // 开始定期健康检查
  startPeriodicChecks(): void {
    for (const [serviceName, config] of this.services.entries()) {
      if (this.intervals.has(serviceName)) {
        continue; // 已经在运行
      }

      const interval = setInterval(async () => {
        try {
          await this.checkService(serviceName);
        } catch (error) {
          logger.error(`定期健康检查失败: ${serviceName}`, error);
        }
      }, config.interval);

      this.intervals.set(serviceName, interval);
      logger.info(`开始定期健康检查: ${serviceName} (间隔: ${config.interval}ms)`);
    }
  }

  // 停止定期健康检查
  stopPeriodicChecks(): void {
    for (const [serviceName, interval] of this.intervals.entries()) {
      clearInterval(interval);
      this.intervals.delete(serviceName);
      logger.info(`停止定期健康检查: ${serviceName}`);
    }
  }

  // 停止特定服务的健康检查
  stopServiceCheck(serviceName: string): void {
    const interval = this.intervals.get(serviceName);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(serviceName);
      logger.info(`停止健康检查: ${serviceName}`);
    }
  }

  // 获取系统整体健康状态
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    averageResponseTime: number;
    timestamp: number;
  } {
    const results = this.getAllServiceHealth();
    const totalServices = results.length;
    const healthyServices = results.filter(r => r.status === 'healthy').length;
    const unhealthyServices = results.filter(r => r.status === 'unhealthy').length;
    
    const averageResponseTime = results.length > 0 
      ? results.reduce((sum, r) => sum + r.responseTime, 0) / results.length 
      : 0;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyServices === 0) {
      status = 'healthy';
    } else if (healthyServices > unhealthyServices) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      totalServices,
      healthyServices,
      unhealthyServices,
      averageResponseTime,
      timestamp: Date.now()
    };
  }

  // 等待服务健康
  async waitForService(serviceName: string, timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await this.checkService(serviceName);
        if (result.status === 'healthy') {
          return true;
        }
      } catch (error) {
        logger.debug(`等待服务健康: ${serviceName}`, error);
      }
      
      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }

  // 等待所有服务健康
  async waitForAllServices(timeoutMs: number = 60000): Promise<boolean> {
    const serviceNames = Array.from(this.services.keys());
    const promises = serviceNames.map(name => this.waitForService(name, timeoutMs));
    
    try {
      const results = await Promise.all(promises);
      return results.every(result => result);
    } catch (error) {
      logger.error('等待所有服务健康失败:', error);
      return false;
    }
  }

  // 清理过期的健康检查结果
  cleanupOldResults(maxAgeMs: number = 5 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAgeMs;
    
    for (const [serviceName, result] of this.results.entries()) {
      if (result.timestamp < cutoffTime) {
        this.results.delete(serviceName);
        logger.debug(`清理过期健康检查结果: ${serviceName}`);
      }
    }
  }
}

// 默认的微服务配置
export const DEFAULT_MICROSERVICES: ServiceConfig[] = [
  { name: 'api-gateway', url: 'http://localhost:3000' },
  { name: 'auth-service', url: 'http://localhost:3001' },
  { name: 'base-service', url: 'http://localhost:3002' },
  { name: 'cattle-service', url: 'http://localhost:3003' },
  { name: 'health-service', url: 'http://localhost:3004' },
  { name: 'feeding-service', url: 'http://localhost:3005' },
  { name: 'equipment-service', url: 'http://localhost:3006' },
  { name: 'procurement-service', url: 'http://localhost:3007' },
  { name: 'sales-service', url: 'http://localhost:3008' },
  { name: 'material-service', url: 'http://localhost:3009' },
  { name: 'notification-service', url: 'http://localhost:3010' },
  { name: 'file-service', url: 'http://localhost:3011' },
  { name: 'monitoring-service', url: 'http://localhost:3012' }
];