/**
 * Legacy request module - maintained for backward compatibility
 * New code should use the unified API client from ./apiClient
 */

import { api } from './apiClient'

// Backward-compatible request function
function request(options) {
  const { url, method = 'GET', data, header, ...config } = options
  
  // Convert to new API client format
  const requestConfig = {
    headers: header,
    ...config
  }

  // Use the appropriate method from the new API client
  switch (method.toUpperCase()) {
    case 'GET':
      return api.get(url, data, requestConfig).then(response => response.data || response)
    case 'POST':
      return api.post(url, data, requestConfig).then(response => response.data || response)
    case 'PUT':
      return api.put(url, data, requestConfig).then(response => response.data || response)
    case 'DELETE':
      return api.delete(url, data, requestConfig).then(response => response.data || response)
    default:
      return api.get(url, data, requestConfig).then(response => response.data || response)
  }
}

export default request