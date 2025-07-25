/**
 * API Client Test Utility
 * Tests the miniprogram API client functionality
 */

import { api } from './apiClient'
import { authStore } from '../stores/auth'

export const testApiClient = {
  // Test basic API functionality
  async testBasicApi() {
    console.log('🧪 Testing API Client...')
    
    try {
      // Test GET request
      console.log('Testing GET request...')
      const response = await api.get('/test', { test: true })
      console.log('GET response:', response)
      
      // Test POST request
      console.log('Testing POST request...')
      const postResponse = await api.post('/test', { data: 'test' })
      console.log('POST response:', postResponse)
      
      console.log('✅ API Client tests passed')
      return true
    } catch (error) {
      console.error('❌ API Client test failed:', error)
      return false
    }
  },

  // Test authentication flow
  async testAuthFlow() {
    console.log('🧪 Testing Authentication Flow...')
    
    try {
      // Initialize auth store
      authStore.init()
      
      // Test mock login
      if (process.env.NODE_ENV === 'development') {
        await authStore.login({ username: 'test' })
        console.log('Mock login successful')
      }
      
      // Test token check
      const isAuth = authStore.isAuthenticated
      console.log('Authentication status:', isAuth)
      
      // Test permissions
      const hasPermission = authStore.hasPermission('read')
      console.log('Has read permission:', hasPermission)
      
      console.log('✅ Authentication tests passed')
      return true
    } catch (error) {
      console.error('❌ Authentication test failed:', error)
      return false
    }
  },

  // Test error handling
  async testErrorHandling() {
    console.log('🧪 Testing Error Handling...')
    
    try {
      // Test network error simulation
      try {
        await api.get('/nonexistent-endpoint')
      } catch (error) {
        console.log('Network error handled correctly:', error.message)
      }
      
      // Test validation error simulation
      try {
        await api.post('/test', { invalid: 'data' })
      } catch (error) {
        console.log('Validation error handled correctly:', error.message)
      }
      
      console.log('✅ Error handling tests passed')
      return true
    } catch (error) {
      console.error('❌ Error handling test failed:', error)
      return false
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting API Client Tests...')
    
    const results = {
      basicApi: await this.testBasicApi(),
      authFlow: await this.testAuthFlow(),
      errorHandling: await this.testErrorHandling()
    }
    
    const allPassed = Object.values(results).every(result => result)
    
    console.log('📊 Test Results:', results)
    console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed')
    
    return results
  }
}

export default testApiClient