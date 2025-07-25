# Safe Navigation and Data Parsing Guide

This guide explains how to use the safe navigation utilities and data validation patterns implemented in the frontend application to prevent runtime errors and ensure robust data handling.

## Overview

The safe navigation system provides:
- Safe property access with default values
- Data structure validation and transformation
- Consistent pagination handling
- Type-safe API response interfaces
- Error-resistant data parsing

## Core Utilities

### 1. Safe Property Access (`@/utils/safeAccess`)

#### `safeGet(obj, path, defaultValue)`
Safely access nested object properties with optional chaining.

```typescript
import { safeGet } from '@/utils/safeAccess'

// Instead of: user.profile.name (can throw if user or profile is null)
const userName = safeGet(user, 'profile.name', 'Anonymous')

// Array path syntax
const userAge = safeGet(user, ['profile', 'age'], 0)

// Safe access to API response data
const cattleList = safeGet(response, 'data.cattle', [])
```

#### `ensureArray(value, defaultValue)`
Ensure a value is an array, with fallback to default.

```typescript
import { ensureArray } from '@/utils/safeAccess'

// Ensure API response data is always an array
const items = ensureArray(response.data, [])

// Safe iteration
ensureArray(cattleList).forEach(cattle => {
  console.log(safeGet(cattle, 'ear_tag', 'Unknown'))
})
```

#### `ensureNumber(value, defaultValue)`
Safely convert values to numbers with fallback.

```typescript
import { ensureNumber } from '@/utils/safeAccess'

// Safe number conversion
const total = ensureNumber(response.pagination.total, 0)
const page = ensureNumber(params.page, 1)
```

#### `ensureString(value, defaultValue)`
Safely convert values to strings with fallback.

```typescript
import { ensureString } from '@/utils/safeAccess'

// Safe string conversion
const name = ensureString(cattle.name, 'Unnamed')
const status = ensureString(cattle.health_status, 'unknown')
```

### 2. Data Validation (`@/utils/dataValidation`)

#### `validateApiResponse(response)`
Validate and normalize API response structure.

```typescript
import { validateApiResponse } from '@/utils/dataValidation'

// Validate API response
const safeResponse = validateApiResponse(rawResponse)
if (safeResponse.success) {
  // Safe to use safeResponse.data
  console.log(safeResponse.data)
} else {
  // Handle errors
  console.error(safeResponse.errors)
}
```

#### `validatePaginatedResponse(response)`
Validate and normalize paginated API responses.

```typescript
import { validatePaginatedResponse } from '@/utils/dataValidation'

// Validate paginated response
const paginatedResponse = validatePaginatedResponse(rawResponse)
const items = paginatedResponse.data // Always an array
const pagination = paginatedResponse.pagination // Always has required fields
```

#### `normalizeListResponse(response)`
Handle both paginated and non-paginated list responses.

```typescript
import { normalizeListResponse } from '@/utils/dataValidation'

// Works with both paginated and simple array responses
const listResponse = normalizeListResponse(rawResponse)
const items = listResponse.data // Always an array
const pagination = listResponse.pagination // Always present
```

### 3. Pagination Helpers (`@/utils/paginationHelpers`)

#### `createSafePagination(data)`
Create safe pagination info from raw data.

```typescript
import { createSafePagination } from '@/utils/paginationHelpers'

// Create safe pagination from API response
const pagination = createSafePagination(response.pagination)
// pagination.page is always >= 1
// pagination.limit is always >= 1 and <= maxLimit
// pagination.totalPages is always >= 1
```

#### `createPaginationState(initialParams)`
Create a pagination state manager for components.

```typescript
import { createPaginationState } from '@/utils/paginationHelpers'

// In a Vue component
const paginationState = createPaginationState({ page: 1, limit: 20 })

// Update pagination
paginationState.updatePagination({ total: 100 })

// Change page
paginationState.changePage(2)

// Get current state
const currentState = paginationState.getState()
```

## Usage Patterns

### 1. In Vue Components

#### Template Usage
```vue
<template>
  <div>
    <!-- Safe property access in templates -->
    <h1>{{ safeGet(cattle, 'ear_tag', 'Unknown') }}</h1>
    
    <!-- Safe array iteration -->
    <div v-for="item in ensureArray(cattleList)" :key="safeGet(item, 'id', 'unknown')">
      <span>{{ safeGet(item, 'breed', '-') }}</span>
      <span>{{ safeGet(item, 'base.name', '-') }}</span>
    </div>
    
    <!-- Safe pagination -->
    <el-pagination
      :current-page="ensureNumber(pagination.page, 1)"
      :page-size="ensureNumber(pagination.limit, 20)"
      :total="ensureNumber(pagination.total, 0)"
    />
  </div>
</template>

<script setup lang="ts">
import { safeGet, ensureArray, ensureNumber } from '@/utils/safeAccess'
</script>
```

#### Script Usage
```typescript
import { safeGet, ensureArray, ensureNumber } from '@/utils/safeAccess'
import { validatePaginatedResponse } from '@/utils/dataValidation'

// In component methods
const loadData = async () => {
  try {
    const response = await api.getCattleList(params)
    const validatedResponse = validatePaginatedResponse(response)
    
    // Safe data assignment
    cattleList.value = ensureArray(validatedResponse.data)
    total.value = ensureNumber(validatedResponse.pagination.total, 0)
    
  } catch (error) {
    // Handle error
    cattleList.value = []
    total.value = 0
  }
}
```

### 2. In Pinia Stores

```typescript
import { defineStore } from 'pinia'
import { safeGet, ensureArray, ensureNumber } from '@/utils/safeAccess'
import { validatePaginatedResponse } from '@/utils/dataValidation'

export const useCattleStore = defineStore('cattle', () => {
  const cattleList = ref<Cattle[]>([])
  const total = ref(0)
  
  // Safe computed properties
  const healthyCount = computed(() => 
    ensureArray(cattleList.value).filter(cattle => 
      safeGet(cattle, 'health_status') === 'healthy'
    ).length
  )
  
  const fetchCattleList = async (params: any) => {
    try {
      const response = await cattleApi.getList(params)
      const validatedResponse = validatePaginatedResponse(response)
      
      // Safe data assignment
      cattleList.value = ensureArray(validatedResponse.data)
      total.value = ensureNumber(validatedResponse.pagination.total, 0)
      
    } catch (error) {
      // Safe error handling
      cattleList.value = []
      total.value = 0
      throw error
    }
  }
  
  return {
    cattleList,
    total,
    healthyCount,
    fetchCattleList
  }
})
```

### 3. In API Modules

```typescript
import { validateApiResponse, validatePaginatedResponse } from '@/utils/dataValidation'
import { safeGet, ensureArray } from '@/utils/safeAccess'

export const cattleApi = {
  // Safe list endpoint
  async getList(params: CattleListParams): Promise<CattleListResponse> {
    try {
      const response = await request.get('/cattle', { params })
      const validatedResponse = validatePaginatedResponse(response.data)
      
      return {
        data: ensureArray(validatedResponse.data),
        pagination: validatedResponse.pagination
      }
    } catch (error) {
      // Return safe default instead of throwing
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    }
  },
  
  // Safe single item endpoint
  async getById(id: number): Promise<Cattle> {
    const response = await request.get(`/cattle/${id}`)
    const validatedResponse = validateApiResponse(response.data)
    
    if (!validatedResponse.success || !validatedResponse.data) {
      throw new Error('Invalid cattle data received')
    }
    
    return validatedResponse.data
  }
}
```

## Best Practices

### 1. Always Use Safe Access for Nested Properties
```typescript
// ❌ Unsafe - can throw if any property is null/undefined
const name = user.profile.name

// ✅ Safe - returns default value if any property is missing
const name = safeGet(user, 'profile.name', 'Anonymous')
```

### 2. Validate API Responses
```typescript
// ❌ Unsafe - assumes response structure
const items = response.data.items

// ✅ Safe - validates and normalizes response
const validatedResponse = validatePaginatedResponse(response)
const items = validatedResponse.data
```

### 3. Ensure Array Types
```typescript
// ❌ Unsafe - might not be an array
items.forEach(item => console.log(item))

// ✅ Safe - ensures array type
ensureArray(items).forEach(item => console.log(item))
```

### 4. Handle Pagination Safely
```typescript
// ❌ Unsafe - pagination might be missing or invalid
const page = response.pagination.page
const total = response.pagination.total

// ✅ Safe - creates safe pagination info
const pagination = createSafePagination(response.pagination)
const page = pagination.page // Always >= 1
const total = pagination.total // Always >= 0
```

### 5. Use Type-Safe Defaults
```typescript
// ❌ Unsafe - might be undefined or wrong type
const count = data.count || 0
const name = data.name || ''

// ✅ Safe - ensures correct type
const count = ensureNumber(data.count, 0)
const name = ensureString(data.name, '')
```

## Error Prevention Checklist

- [ ] Use `safeGet()` for all nested property access
- [ ] Use `ensureArray()` before array operations
- [ ] Use `ensureNumber()` for numeric values
- [ ] Use `ensureString()` for string values
- [ ] Validate API responses with validation utilities
- [ ] Use safe pagination helpers for pagination data
- [ ] Provide meaningful default values
- [ ] Handle edge cases (null, undefined, empty arrays)
- [ ] Test with malformed data
- [ ] Use TypeScript for additional type safety

## Migration Guide

### From Unsafe Patterns
```typescript
// Before: Unsafe property access
const name = cattle.base.name
const items = response.data.items
const total = response.pagination.total

// After: Safe property access
const name = safeGet(cattle, 'base.name', '-')
const items = ensureArray(safeGet(response, 'data.items', []))
const total = ensureNumber(safeGet(response, 'pagination.total', 0))
```

### From Optional Chaining
```typescript
// Before: Optional chaining (still can be undefined)
const name = cattle?.base?.name || 'Unknown'

// After: Safe access with guaranteed type
const name = safeGet(cattle, 'base.name', 'Unknown')
```

This safe navigation system ensures that your application remains stable even when dealing with unexpected data structures or API changes.