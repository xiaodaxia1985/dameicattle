# Unified API Client

A comprehensive API client that supports both web and miniprogram environments with automatic retry logic, error handling, and user feedback mechanisms.

## Features

- **Cross-platform support**: Works in both web browsers and WeChat miniprogram
- **Automatic retry**: Configurable retry logic with exponential backoff
- **Error handling**: Comprehensive error categorization and user feedback
- **Request/Response interceptors**: Extensible middleware system
- **Environment configuration**: Different settings for development, production, and test
- **TypeScript support**: Full type safety and IntelliSense
- **Authentication**: Automatic token management
- **Performance monitoring**: Request timing and slow request detection

## Quick Start

### Basic Usage

```typescript
import { api } from '@/api/client'

// GET request
const users = await api.get('/users', { page: 1, limit: 10 })

// POST request
const newUser = await api.post('/users', { name: 'John', email: 'john@example.com' })

// PUT request
const updatedUser = await api.put('/users/1', { name: 'Jane' })

// DELETE request
await api.delete('/users/1')
```

### Advanced Usage

```typescript
import { apiClient } from '@/api/client'

// Custom configuration
const response = await apiClient.request({
  url: '/data',
  method: 'GET',
  timeout: 30000,
  skipRetry: true,
  headers: { 'X-Custom': 'value' }
})

// File upload
const formData = new FormData()
formData.append('file', file)
const result = await api.upload('/upload', formData)

// File download
await api.download('/export/data', 'data.csv')
```

## Configuration

### Environment Configuration

The API client automatically configures itself based on the environment:

```typescript
// Development
{
  baseURL: '/api/v1',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableLogging: true
}

// Production
{
  baseURL: '/api/v1',
  timeout: 15000,
  retryAttempts: 2,
  retryDelay: 2000,
  enableLogging: false
}
```

### Custom Configuration

```typescript
import { UnifiedApiClient } from '@/utils/apiClient'

const customClient = new UnifiedApiClient({
  baseURL: 'https://api.example.com',
  timeout: 20000,
  retryAttempts: 5,
  retryDelay: 2000,
  enableLogging: true
})
```

## Error Handling

### Automatic Error Handling

The API client automatically handles common error scenarios:

- **Network errors**: Shows network error notifications
- **Authentication errors**: Redirects to login or shows auth dialogs
- **Validation errors**: Displays field-level validation messages
- **Server errors**: Shows appropriate error messages to users

### Custom Error Handling

```typescript
import { handleApiError, handleValidationError } from '@/utils/errorHandler'

try {
  const response = await api.post('/users', userData)
} catch (error) {
  if (error.status === 422) {
    handleValidationError(error.response.data.errors)
  } else {
    handleApiError(error, { component: 'UserForm', action: 'create' })
  }
}
```

### Error Categories

- `NETWORK`: Network connectivity issues
- `TIMEOUT`: Request timeout errors
- `AUTH`: Authentication and authorization errors
- `VALIDATION`: Data validation errors
- `SERVER`: Server-side errors (5xx)
- `CLIENT`: Client-side errors (4xx)
- `UNKNOWN`: Unclassified errors

## Interceptors

### Request Interceptors

```typescript
import { apiClient } from '@/api/client'

// Add custom headers
apiClient.addRequestInterceptor((config) => {
  config.headers = {
    ...config.headers,
    'X-Custom-Header': 'value'
  }
  return config
})
```

### Response Interceptors

```typescript
apiClient.addResponseInterceptor({
  onFulfilled: (response) => {
    // Process successful responses
    return response
  },
  onRejected: (error) => {
    // Handle errors
    if (error.status === 401) {
      // Custom auth handling
    }
    throw error
  }
})
```

## Built-in Interceptors

The API client comes with several built-in interceptors:

- **Authentication**: Automatically adds JWT tokens to requests
- **Logging**: Logs requests and responses in development
- **Error Handling**: Processes errors and shows user feedback
- **Performance**: Monitors request timing and logs slow requests

## Retry Logic

### Automatic Retry

The client automatically retries failed requests based on:

- **Retryable errors**: Network errors, timeouts, 5xx errors, 429 (rate limit)
- **Exponential backoff**: Increasing delay between retries
- **Maximum attempts**: Configurable retry limit

### Custom Retry Configuration

```typescript
// Disable retry for specific request
await api.get('/data', {}, { skipRetry: true })

// Custom retry configuration
const client = new UnifiedApiClient({
  retryAttempts: 5,
  retryDelay: 2000
})
```

## Cross-Platform Support

### Web Environment

Uses the Fetch API with AbortController for timeout handling:

```typescript
// Automatically detected in web browsers
const response = await api.get('/data')
```

### Miniprogram Environment

Uses uni.request for WeChat miniprogram compatibility:

```typescript
// Automatically detected in miniprogram
const response = await api.get('/data')
```

## TypeScript Support

### Type-safe API calls

```typescript
interface User {
  id: number
  name: string
  email: string
}

// Typed response
const user: ApiResponse<User> = await api.get<User>('/users/1')

// Typed request data
const newUser: ApiResponse<User> = await api.post<User>('/users', {
  name: 'John',
  email: 'john@example.com'
})
```

### Custom Error Types

```typescript
import type { ApiError } from '@/utils/apiClient'

try {
  await api.get('/data')
} catch (error: ApiError) {
  console.log(error.code, error.status, error.message)
}
```

## Performance Monitoring

### Request Timing

The client automatically tracks request performance:

```typescript
// Logs slow requests (>3 seconds) in development
// [API Performance] Slow request detected: /slow-endpoint took 5234ms
```

### Performance Headers

Adds timing headers to requests for server-side monitoring:

```typescript
// X-Request-Time: 1640995200000
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { UnifiedApiClient } from '@/utils/apiClient'

describe('API Client', () => {
  it('should make successful requests', async () => {
    // Test implementation
  })
})
```

### Mocking

```typescript
// Mock for testing
vi.mock('@/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))
```

## Migration Guide

### From Axios

```typescript
// Old (Axios)
import axios from 'axios'
const response = await axios.get('/users')
const users = response.data

// New (Unified API Client)
import { api } from '@/api/client'
const response = await api.get('/users')
const users = response.data
```

### From Legacy Request Module

```typescript
// Old
import request from '@/api/request'
const response = await request.get('/users')

// New
import { api } from '@/api/client'
const response = await api.get('/users')
```

## Best Practices

1. **Use the convenience API**: Import `api` from `@/api/client` for most use cases
2. **Handle errors appropriately**: Use the built-in error handlers or implement custom logic
3. **Type your responses**: Use TypeScript generics for type safety
4. **Configure timeouts**: Set appropriate timeouts for different types of requests
5. **Use interceptors wisely**: Add interceptors for cross-cutting concerns
6. **Test your API calls**: Write unit tests for API service classes

## Troubleshooting

### Common Issues

1. **CORS errors**: Check your backend CORS configuration
2. **Authentication failures**: Verify token storage and refresh logic
3. **Network timeouts**: Adjust timeout settings for slow networks
4. **Retry loops**: Check retry configuration for infinite loops

### Debug Mode

Enable debug logging in development:

```typescript
const client = new UnifiedApiClient({
  enableLogging: true
})
```

### Error Reporting

The client can be configured to report errors to external services:

```typescript
const errorHandler = new ErrorHandler({
  reportErrors: true
})
```

## API Reference

See the TypeScript definitions in the source files for complete API documentation:

- `UnifiedApiClient`: Main API client class
- `ErrorHandler`: Error handling utilities
- `ApiResponse<T>`: Standard response interface
- `ApiError`: Error interface
- `RequestConfig`: Request configuration interface