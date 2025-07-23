import request from './request'
import type { ApiResponse } from './request'

export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
}

export const uploadApi = {
  // Upload image
  uploadImage: (formData: FormData): Promise<ApiResponse<UploadResponse>> => {
    return request.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Upload file
  uploadFile: (formData: FormData): Promise<ApiResponse<UploadResponse>> => {
    return request.post('/upload/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Upload avatar
  uploadAvatar: (formData: FormData): Promise<ApiResponse<UploadResponse>> => {
    return request.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Delete file
  deleteFile: (url: string): Promise<ApiResponse<void>> => {
    return request.delete('/upload/file', { data: { url } })
  }
}