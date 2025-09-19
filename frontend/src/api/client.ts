import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { getBaseURL } from '@/config/apiConfig'
import type { ApiResponse } from './microservices'

// 创建axios实例
const createAxiosInstance = (): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: getBaseURL(), // 使用getBaseURL函数获取基础URL
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 请求拦截器 - 添加认证token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器 - 统一处理错误
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<any>>) => {
      // 如果需要统一处理成功响应，可以在这里添加逻辑
      return response
    },
    (error: AxiosError<ApiResponse<any>>) => {
      // 统一错误处理
      if (error.response) {
        const { status, statusText, data } = error.response
        console.error(`API请求错误 [${status}]: ${statusText}`, data)
        
        switch (status) {
          case 401:
            // 未授权，清除token并跳转到登录页
            localStorage.removeItem('token')
            // 添加判断，避免在API调用过程中重复跳转
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            break
          case 404:
            // 路由不存在，显示友好的404提示
            console.error('请求的资源不存在，请检查URL是否正确')
            break
          case 500:
            // 服务器错误
            console.error('服务器内部错误，请稍后重试')
            break
          default:
            // 其他错误
            break
        }
        
        // 包装错误响应，使其具有一致的格式
        return Promise.reject({
          ...error,
          code: status,
          message: data?.message || statusText || '请求失败'
        })
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('网络错误：无法连接到服务器')
        return Promise.reject({
          ...error,
          code: 0,
          message: '网络错误：无法连接到服务器'
        })
      } else {
        // 请求配置出错
        console.error('请求配置错误:', error.message)
        return Promise.reject({
          ...error,
          code: -1,
          message: error.message || '请求配置错误'
        })
      }
    }
  )

  return axiosInstance
}

// 创建API客户端
const apiClient = createAxiosInstance()

// 封装常用请求方法
// GET请求
export const get = async <T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, { params, ...config })
    return response.data
  } catch (error) {
    throw error
  }
}

// POST请求
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config)
    return response.data
  } catch (error) {
    throw error
  }
}

// PUT请求
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config)
    return response.data
  } catch (error) {
    throw error
  }
}

// DELETE请求
export const remove = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, config)
    return response.data
  } catch (error) {
    throw error
  }
}

// PATCH请求
export const patch = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config)
    return response.data
  } catch (error) {
    throw error
  }
}

// 文件上传
export const upload = async <T = any>(
  url: string,
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
    return response.data
  } catch (error) {
    throw error
  }
}

// 文件下载
export const download = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob'
    })
    
    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || 'download'
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    throw error
  }
}

// 在所有方法定义之后，再创建并导出api对象
export { apiClient }
export const api = {
  get,
  post,
  put,
  remove,
  patch,
  upload,
  download
}

// 导出axios实例，用于需要自定义配置的场景
export default apiClient