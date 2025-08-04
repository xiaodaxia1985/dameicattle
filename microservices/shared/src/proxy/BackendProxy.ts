import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createLogger } from '../logger';
import { CacheService } from '../cache/CacheService';

const logger = createLogger('backend-proxy');

export interface ProxyConfig {
  backendUrl: string;
  timeout?: number;
  retries?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
}

export class BackendProxy {
  private client: AxiosInstance;
  private config: ProxyConfig;

  constructor(config: ProxyConfig) {
    this.config = {
      timeout: 10000,
      retries: 3,
      cacheEnabled: true,
      cacheTTL: 300, // 5分钟
      ...config
    };

    this.client = axios.create({
      baseURL: this.config.backendUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`代理请求: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('请求拦截器错误:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(`代理响应: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        const config = error.config;
        
        // 重试逻辑
        if (config && !config._retry && this.config.retries! > 0) {
          config._retry = true;
          config._retryCount = (config._retryCount || 0) + 1;
          
          if (config._retryCount <= this.config.retries!) {
            logger.warn(`请求失败，重试 ${config._retryCount}/${this.config.retries}: ${config.url}`);
            await this.delay(1000 * config._retryCount);
            return this.client(config);
          }
        }
        
        logger.error(`代理请求失败: ${config?.url}`, error.message);
        return Promise.reject(error);
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // GET请求（支持缓存）
  async get<T = any>(path: string, params?: any, options?: {
    cache?: boolean;
    cacheTTL?: number;
    headers?: any;
  }): Promise<T> {
    const cacheKey = this.generateCacheKey('GET', path, params);
    const useCache = options?.cache ?? this.config.cacheEnabled;
    
    // 尝试从缓存获取
    if (useCache) {
      const cached = await CacheService.get<T>(cacheKey);
      if (cached !== null) {
        logger.debug(`缓存命中: ${path}`);
        return cached;
      }
    }

    try {
      const response = await this.client.get(path, {
        params,
        headers: options?.headers
      });

      const result = response.data;

      // 缓存结果
      if (useCache && this.isSuccessResponse(result)) {
        await CacheService.set(cacheKey, result, {
          ttl: options?.cacheTTL ?? this.config.cacheTTL
        });
      }

      return result;
    } catch (error) {
      logger.error(`GET请求失败: ${path}`, error);
      throw this.transformError(error);
    }
  }

  // POST请求
  async post<T = any>(path: string, data?: any, options?: {
    headers?: any;
    invalidateCache?: string[];
  }): Promise<T> {
    try {
      const response = await this.client.post(path, data, {
        headers: options?.headers
      });

      const result = response.data;

      // 清除相关缓存
      if (options?.invalidateCache) {
        await this.invalidateCache(options.invalidateCache);
      }

      return result;
    } catch (error) {
      logger.error(`POST请求失败: ${path}`, error);
      throw this.transformError(error);
    }
  }

  // PUT请求
  async put<T = any>(path: string, data?: any, options?: {
    headers?: any;
    invalidateCache?: string[];
  }): Promise<T> {
    try {
      const response = await this.client.put(path, data, {
        headers: options?.headers
      });

      const result = response.data;

      // 清除相关缓存
      if (options?.invalidateCache) {
        await this.invalidateCache(options.invalidateCache);
      }

      return result;
    } catch (error) {
      logger.error(`PUT请求失败: ${path}`, error);
      throw this.transformError(error);
    }
  }

  // DELETE请求
  async delete<T = any>(path: string, options?: {
    headers?: any;
    invalidateCache?: string[];
  }): Promise<T> {
    try {
      const response = await this.client.delete(path, {
        headers: options?.headers
      });

      const result = response.data;

      // 清除相关缓存
      if (options?.invalidateCache) {
        await this.invalidateCache(options.invalidateCache);
      }

      return result;
    } catch (error) {
      logger.error(`DELETE请求失败: ${path}`, error);
      throw this.transformError(error);
    }
  }

  // 文件上传
  async upload<T = any>(path: string, formData: FormData, options?: {
    onProgress?: (progress: number) => void;
    headers?: any;
  }): Promise<T> {
    try {
      const response = await this.client.post(path, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...options?.headers
        },
        onUploadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress(progress);
          }
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`文件上传失败: ${path}`, error);
      throw this.transformError(error);
    }
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.data;
    } catch (error) {
      logger.error('后端健康检查失败:', error);
      throw new Error('Backend service unavailable');
    }
  }

  // 生成缓存键
  private generateCacheKey(method: string, path: string, params?: any): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `proxy:${method}:${path}:${Buffer.from(paramsStr).toString('base64')}`;
  }

  // 判断是否为成功响应
  private isSuccessResponse(response: any): boolean {
    return response && (response.success === true || response.status === 'success');
  }

  // 清除缓存
  private async invalidateCache(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      await CacheService.deletePattern(pattern);
      logger.debug(`清除缓存: ${pattern}`);
    }
  }

  // 转换错误
  private transformError(error: any): Error {
    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response;
      const message = data?.message || data?.error || `HTTP ${status}`;
      const transformedError = new Error(message);
      (transformedError as any).status = status;
      (transformedError as any).data = data;
      return transformedError;
    } else if (error.request) {
      // 网络错误
      return new Error('Network error: Unable to connect to backend service');
    } else {
      // 其他错误
      return error;
    }
  }

  // 设置认证token
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // 清除认证token
  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }
}