import { fileServiceApi } from './microservices'
import type { ApiResponse } from './request'

export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
}

export const uploadApi = {
  // Upload image
  async uploadImage(formData: FormData): Promise<ApiResponse<UploadResponse>> {
    return await fileServiceApi.uploadFile(formData.get('file') as File, 'image')
  },

  // Upload file
  async uploadFile(formData: FormData): Promise<ApiResponse<UploadResponse>> {
    return await fileServiceApi.uploadFile(formData.get('file') as File, 'file')
  },

  // Upload avatar
  async uploadAvatar(formData: FormData): Promise<ApiResponse<UploadResponse>> {
    return await fileServiceApi.uploadFile(formData.get('file') as File, 'avatar')
  },

  // Delete file
  async deleteFile(url: string): Promise<ApiResponse<void>> {
    // 从URL中提取文件ID
    const fileId = url.split('/').pop()?.split('.')[0]
    if (fileId) {
      return await fileServiceApi.deleteFile(parseInt(fileId))
    }
    throw new Error('Invalid file URL')
  }
}