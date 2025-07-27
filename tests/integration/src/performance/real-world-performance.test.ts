import { test, expect, Page } from '@playwright/test';
import axios from 'axios';

// Performance tests that catch real-world bottlenecks
const TEST_CONFIG = {
  backend: {
    baseURL: process.env.BACKEND_URL || 'http://localhost:3000'
  },
  frontend: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173'
  }
};

const TEST_USER = {
  username: 'perf_test_admin',
  password: 'PerfTest123!',
  email: 'perf@test.com'
};

test.describe('Real-World Performance Tests', () => {
  let authToken: string;

  test.beforeAll(async () => {
    // Setup test user
    try {
      await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/register`, {
        username: TEST_USER.username,
        password: TEST_USER.password,
        real_name: '性能测试管理员',
        email: TEST_USER.email,
      });
    } catch (error) {
      // User might already exist
    }
    
    const loginResponse = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password,
    });
    authToken = loginResponse.data.data.token;
  });

  test('Page load performance with real data', async ({ page }) => {
    // Create test data first
    const testCattlePromises = [];
    for (let i = 0; i < 50; i++) {
      testCattlePromises.push(
        axios.post(
          `${TEST_CONFIG.backend.baseURL}/api/cattle`,
          {
            ear_tag: `PERF_${i.toString().padStart(3, '0')}`,
            breed: `性能测试品种${i}`,
            gender: i % 2 === 0 ? 'male' : 'female',
            birth_date: '2023-01-01',
            weight: 400 + (i * 5),
            health_status: 'healthy',
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
      );
    }
    
    await Promise.all(testCattlePromises);
    
    // Test login performance
    const loginStartTime = Date.now();
    
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="用户名"]', TEST_USER.username);
    await page.fill('input[placeholder*="密码"]', TEST_USER.password);
    
    const loginApiCall = page.waitForResponse(response => 
      response.url().includes('/api/auth/login')
    );
    
    await page.click('button:has-text("登录")');
    
    const loginResponse = await loginApiCall;
    const loginEndTime = Date.now();
    const loginDuration = loginEndTime - loginStartTime;
    
    expect(loginResponse.status()).toBe(200);
    expect(loginDuration).toBeLessThan(5000); // Login should complete within 5 seconds
    
    // Test cattle list load performance
    const listLoadStartTime = Date.now();
    
    const cattleListCall = page.waitForResponse(response => 
      response.url().includes('/api/cattle') && response.request().method() === 'GET'
    );
    
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    const cattleListResponse = await cattleListCall;
    const listLoadEndTime = Date.now();
    const listLoadDuration = listLoadEndTime - listLoadStartTime;
    
    expect(cattleListResponse.status()).toBe(200);
    expect(listLoadDuration).toBeLessThan(3000); // List should load within 3 seconds
    
    // Verify data is actually displayed
    await expect(page.locator('text=PERF_001, text=PERF_002, text=PERF_003')).toBeVisible({ timeout: 5000 });
    
    // Test pagination performance
    const paginationStartTime = Date.now();
    
    const nextPageButton = page.locator('button:has-text("下一页"), .el-pagination__next');
    if (await nextPageButton.isVisible() && await nextPageButton.isEnabled()) {
      const nextPageCall = page.waitForResponse(response => 
        response.url().includes('/api/cattle') && response.url().includes('page=2')
      );
      
      await nextPageButton.click();
      
      const nextPageResponse = await nextPageCall;
      const paginationEndTime = Date.now();
      const paginationDuration = paginationEndTime - paginationStartTime;
      
      expect(nextPageResponse.status()).toBe(200);
      expect(paginationDuration).toBeLessThan(2000); // Pagination should be fast
    }
  });

  test('Form submission performance under load', async ({ page }) => {
    await loginUser(page);
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Test multiple form submissions
    const submissionTimes: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const addButton = page.locator('button:has-text("添加"), button:has-text("新增")');
      if (await addButton.isVisible()) {
        await addButton.first().click();
        await page.waitForTimeout(500);
        
        const submissionStartTime = Date.now();
        
        // Fill form
        const earTagInput = page.locator('input[placeholder*="耳标"], input[name*="earTag"]');
        if (await earTagInput.isVisible()) {
          await earTagInput.fill(`LOAD_TEST_${i}_${Date.now()}`);
        }
        
        const breedInput = page.locator('input[placeholder*="品种"], input[name*="breed"]');
        if (await breedInput.isVisible()) {
          await breedInput.fill(`负载测试品种${i}`);
        }
        
        const genderSelect = page.locator('select[name*="gender"], .el-select:has-text("性别")');
        if (await genderSelect.isVisible()) {
          await genderSelect.click();
          await page.locator('text=雄性, text=male').first().click();
        }
        
        // Submit form
        const createCall = page.waitForResponse(response => 
          response.url().includes('/api/cattle') && response.request().method() === 'POST'
        );
        
        const submitButton = page.locator('button:has-text("提交"), button:has-text("保存")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          const createResponse = await createCall;
          const submissionEndTime = Date.now();
          const submissionDuration = submissionEndTime - submissionStartTime;
          
          expect(createResponse.status()).toBe(201);
          submissionTimes.push(submissionDuration);
          
          // Wait for success message
          await expect(page.locator('.el-message--success, .success-message')).toBeVisible({ timeout: 3000 });
          
          // Close form/modal if needed
          const closeButton = page.locator('button:has-text("取消"), button:has-text("关闭"), .el-dialog__close');
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      }
    }
    
    // Analyze submission performance
    const averageSubmissionTime = submissionTimes.reduce((a, b) => a + b, 0) / submissionTimes.length;
    const maxSubmissionTime = Math.max(...submissionTimes);
    
    expect(averageSubmissionTime).toBeLessThan(3000); // Average should be under 3 seconds
    expect(maxSubmissionTime).toBeLessThan(5000); // Max should be under 5 seconds
    
    console.log(`Form submission performance:
      Average: ${averageSubmissionTime.toFixed(2)}ms
      Max: ${maxSubmissionTime}ms
      All times: ${submissionTimes.join(', ')}ms`);
  });

  test('Search and filter performance', async ({ page }) => {
    await loginUser(page);
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Test search performance
    const searchInput = page.locator('input[placeholder*="搜索"], input[placeholder*="查找"]');
    if (await searchInput.isVisible()) {
      const searchStartTime = Date.now();
      
      const searchCall = page.waitForResponse(response => 
        response.url().includes('/api/cattle') && response.url().includes('search=PERF')
      );
      
      await searchInput.fill('PERF');
      await page.waitForTimeout(500); // Debounce delay
      
      const searchResponse = await searchCall;
      const searchEndTime = Date.now();
      const searchDuration = searchEndTime - searchStartTime;
      
      expect(searchResponse.status()).toBe(200);
      expect(searchDuration).toBeLessThan(2000); // Search should be fast
      
      // Verify search results are displayed
      await expect(page.locator('text=PERF_001, text=PERF_002')).toBeVisible({ timeout: 3000 });
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
    
    // Test filter performance
    const filterSelect = page.locator('select[name*="gender"], .el-select:has-text("性别筛选")');
    if (await filterSelect.isVisible()) {
      const filterStartTime = Date.now();
      
      const filterCall = page.waitForResponse(response => 
        response.url().includes('/api/cattle') && response.url().includes('gender=male')
      );
      
      await filterSelect.click();
      await page.locator('text=雄性, text=male').first().click();
      
      const filterResponse = await filterCall;
      const filterEndTime = Date.now();
      const filterDuration = filterEndTime - filterStartTime;
      
      expect(filterResponse.status()).toBe(200);
      expect(filterDuration).toBeLessThan(2000); // Filter should be fast
    }
  });

  test('Memory usage and performance monitoring', async ({ page }) => {
    await loginUser(page);
    
    // Monitor memory usage during navigation
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });
    
    // Navigate through multiple pages
    const pages = ['/dashboard', '/cattle', '/health', '/feeding'];
    
    for (const pagePath of pages) {
      await page.goto(`${TEST_CONFIG.frontend.baseURL}${pagePath}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check for memory leaks
      const currentMemory = await page.evaluate(() => {
        return (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        } : null;
      });
      
      if (initialMemory && currentMemory) {
        const memoryIncrease = currentMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;
        
        // Memory shouldn't increase by more than 50% during normal navigation
        expect(memoryIncreasePercent).toBeLessThan(50);
        
        console.log(`Memory usage on ${pagePath}:
          Initial: ${(initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB
          Current: ${(currentMemory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB
          Increase: ${memoryIncreasePercent.toFixed(2)}%`);
      }
    }
    
    // Test performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // DOM should load quickly
    expect(performanceMetrics.loadComplete).toBeLessThan(3000); // Page should load completely quickly
    
    console.log('Performance metrics:', performanceMetrics);
  });

  test('API response time under concurrent load', async ({ page }) => {
    await loginUser(page);
    
    // Test concurrent API calls
    const concurrentRequests = 10;
    const apiCalls: Promise<any>[] = [];
    
    const startTime = Date.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      apiCalls.push(
        axios.get(
          `${TEST_CONFIG.backend.baseURL}/api/cattle?page=${i + 1}&limit=10`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        )
      );
    }
    
    const responses = await Promise.all(apiCalls);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    // Concurrent requests should complete within reasonable time
    expect(totalDuration).toBeLessThan(10000); // 10 seconds for 10 concurrent requests
    
    const averageResponseTime = totalDuration / concurrentRequests;
    expect(averageResponseTime).toBeLessThan(2000); // Average response time should be reasonable
    
    console.log(`Concurrent API performance:
      Total duration: ${totalDuration}ms
      Average response time: ${averageResponseTime.toFixed(2)}ms
      Requests: ${concurrentRequests}`);
  });

  test('Large dataset handling performance', async ({ page }) => {
    // Create a large dataset
    const largeDatasetSize = 100;
    const batchSize = 20;
    
    for (let batch = 0; batch < largeDatasetSize / batchSize; batch++) {
      const batchPromises = [];
      
      for (let i = 0; i < batchSize; i++) {
        const index = batch * batchSize + i;
        batchPromises.push(
          axios.post(
            `${TEST_CONFIG.backend.baseURL}/api/cattle`,
            {
              ear_tag: `LARGE_${index.toString().padStart(4, '0')}`,
              breed: `大数据测试品种${index}`,
              gender: index % 2 === 0 ? 'male' : 'female',
              birth_date: '2023-01-01',
              weight: 400 + (index * 2),
              health_status: 'healthy',
            },
            { headers: { Authorization: `Bearer ${authToken}` } }
          )
        );
      }
      
      await Promise.all(batchPromises);
    }
    
    await loginUser(page);
    
    // Test loading large dataset
    const loadStartTime = Date.now();
    
    const largeDataCall = page.waitForResponse(response => 
      response.url().includes('/api/cattle') && response.request().method() === 'GET'
    );
    
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    const largeDataResponse = await largeDataCall;
    const loadEndTime = Date.now();
    const loadDuration = loadEndTime - loadStartTime;
    
    expect(largeDataResponse.status()).toBe(200);
    expect(loadDuration).toBeLessThan(5000); // Should handle large dataset within 5 seconds
    
    // Test scrolling performance with large dataset
    const scrollStartTime = Date.now();
    
    // Scroll to bottom of list
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    await page.waitForTimeout(1000);
    
    const scrollEndTime = Date.now();
    const scrollDuration = scrollEndTime - scrollStartTime;
    
    expect(scrollDuration).toBeLessThan(2000); // Scrolling should be smooth
    
    // Test pagination with large dataset
    const paginationStartTime = Date.now();
    
    const lastPageButton = page.locator('.el-pagination__total, text=共');
    if (await lastPageButton.isVisible()) {
      const totalText = await lastPageButton.textContent();
      const totalCount = parseInt(totalText?.match(/\d+/)?.[0] || '0');
      
      expect(totalCount).toBeGreaterThanOrEqual(largeDatasetSize);
    }
    
    const paginationEndTime = Date.now();
    const paginationDuration = paginationEndTime - paginationStartTime;
    
    expect(paginationDuration).toBeLessThan(1000); // Pagination info should load quickly
    
    console.log(`Large dataset performance:
      Dataset size: ${largeDatasetSize}
      Load duration: ${loadDuration}ms
      Scroll duration: ${scrollDuration}ms
      Pagination duration: ${paginationDuration}ms`);
  });
});

// Helper function for login
async function loginUser(page: Page): Promise<void> {
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    const token = await page.evaluate(() => localStorage.getItem('token'));
    if (token) {
      return; // Already logged in
    }
  }
  
  if (!currentUrl.includes('/login')) {
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/login`);
    await page.waitForLoadState('networkidle');
  }
  
  await page.fill('input[placeholder*="用户名"]', TEST_USER.username);
  await page.fill('input[placeholder*="密码"]', TEST_USER.password);
  await page.click('button:has-text("登录")');
  
  await page.waitForTimeout(3000);
  
  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (!token) {
    throw new Error('Login failed - no token found');
  }
}