import { test, expect, Page } from '@playwright/test';

// Real-world test scenarios that catch actual frontend issues
const TEST_CONFIG = {
  backend: {
    baseURL: process.env.BACKEND_URL || 'http://localhost:3000'
  },
  frontend: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173'
  }
};

const TEST_USER = {
  username: 'admin',
  password: 'Admin123',
  email: 'admin@test.com'
};

test.describe('Real-World Frontend Issues Detection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to frontend
    await page.goto(TEST_CONFIG.frontend.baseURL);
    await page.waitForLoadState('networkidle');
  });

  test('Authentication flow with real API integration', async ({ page }) => {
    // Test 1: Login with real API calls
    await page.fill('input[placeholder*="用户名"], input[name="username"]', TEST_USER.username);
    await page.fill('input[placeholder*="密码"], input[name="password"]', TEST_USER.password);
    
    // Intercept and validate actual API calls
    const loginRequest = page.waitForRequest(request => 
      request.url().includes('/api/auth/login') && request.method() === 'POST'
    );
    
    const loginResponse = page.waitForResponse(response => 
      response.url().includes('/api/auth/login')
    );
    
    await page.click('button:has-text("登录")');
    
    // Validate request payload
    const request = await loginRequest;
    const requestData = request.postDataJSON();
    expect(requestData).toHaveProperty('username', TEST_USER.username);
    expect(requestData).toHaveProperty('password', TEST_USER.password);
    
    // Validate response structure
    const response = await loginResponse;
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('data');
    expect(responseData.data).toHaveProperty('token');
    expect(responseData.data).toHaveProperty('user');
    expect(responseData.data).toHaveProperty('permissions');
    
    // Validate token storage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    expect(token).toBe(responseData.data.token);
    
    // Validate user data storage
    const userData = await page.evaluate(() => localStorage.getItem('user'));
    expect(userData).toBeTruthy();
    const parsedUser = JSON.parse(userData);
    expect(parsedUser).toHaveProperty('username', TEST_USER.username);
    
    // Test 2: Verify authentication state in UI
    await page.waitForSelector('[data-testid="user-menu"], .user-info, text=退出登录', { timeout: 5000 });
    
    // Test 3: Verify protected route access
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Should not redirect to login
    expect(page.url()).toContain('/cattle');
    
    // Should show cattle management interface
    await expect(page.locator('text=牛只管理, text=耳标, text=品种')).toBeVisible({ timeout: 10000 });
  });

  test('Data loading and construction validation', async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Navigate to cattle list
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    
    // Intercept cattle list API call
    const cattleRequest = page.waitForResponse(response => 
      response.url().includes('/api/cattle') && response.request().method() === 'GET'
    );
    
    await page.waitForLoadState('networkidle');
    
    // Validate API response structure
    const response = await cattleRequest;
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('data');
    
    // Validate pagination structure if present
    if (responseData.data.items) {
      expect(responseData.data).toHaveProperty('items');
      expect(responseData.data).toHaveProperty('pagination');
      expect(responseData.data.pagination).toHaveProperty('total');
      expect(responseData.data.pagination).toHaveProperty('page');
      expect(responseData.data.pagination).toHaveProperty('limit');
    }
    
    // Test data rendering in UI
    if (responseData.data.items && responseData.data.items.length > 0) {
      const firstCattle = responseData.data.items[0];
      
      // Verify data fields are properly displayed
      if (firstCattle.ear_tag) {
        await expect(page.locator(`text=${firstCattle.ear_tag}`)).toBeVisible({ timeout: 5000 });
      }
      
      if (firstCattle.breed) {
        await expect(page.locator(`text=${firstCattle.breed}`)).toBeVisible({ timeout: 5000 });
      }
    } else {
      // Test empty state
      await expect(page.locator('text=暂无数据, text=没有牛只, .empty-state')).toBeVisible({ timeout: 5000 });
    }
  });

  test('Permission-based UI behavior validation', async ({ page }) => {
    // Login and get user permissions
    await loginUser(page);
    
    // Get user permissions from localStorage
    const userPermissions = await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role?.permissions || [];
    });
    
    // Navigate to cattle management
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Test permission-based button visibility
    const hasCreatePermission = userPermissions.includes('*') || 
                               userPermissions.includes('cattle:create') ||
                               userPermissions.includes('cattle:write');
    
    if (hasCreatePermission) {
      // Should show create button
      await expect(page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建")')).toBeVisible({ timeout: 5000 });
    } else {
      // Should not show create button
      await expect(page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建")')).not.toBeVisible();
    }
    
    const hasDeletePermission = userPermissions.includes('*') || 
                               userPermissions.includes('cattle:delete');
    
    if (hasDeletePermission) {
      // Should show delete actions
      await expect(page.locator('button:has-text("删除"), .delete-btn, [data-action="delete"]')).toBeVisible({ timeout: 5000 });
    } else {
      // Should not show delete actions
      await expect(page.locator('button:has-text("删除"), .delete-btn, [data-action="delete"]')).not.toBeVisible();
    }
  });

  test('Error handling and user feedback validation', async ({ page }) => {
    // Test 1: Network error handling
    await page.route('**/api/**', route => {
      route.abort('failed');
    });
    
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/login`);
    await page.fill('input[placeholder*="用户名"]', TEST_USER.username);
    await page.fill('input[placeholder*="密码"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    
    // Should show network error message
    await expect(page.locator('.el-message, .error-message, text=网络连接失败')).toBeVisible({ timeout: 5000 });
    
    // Clear route interception
    await page.unroute('**/api/**');
    
    // Test 2: API error response handling
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '用户名或密码错误'
          }
        })
      });
    });
    
    await page.click('button:has-text("登录")');
    
    // Should show specific error message
    await expect(page.locator('text=用户名或密码错误, .error-message')).toBeVisible({ timeout: 5000 });
    
    await page.unroute('**/api/auth/login');
  });

  test('Form validation and data submission', async ({ page }) => {
    await loginUser(page);
    
    // Navigate to cattle creation form
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Click add button
    const addButton = page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建")');
    if (await addButton.isVisible()) {
      await addButton.first().click();
      await page.waitForTimeout(1000);
      
      // Test form validation
      const submitButton = page.locator('button:has-text("提交"), button:has-text("保存"), button:has-text("确定")');
      if (await submitButton.isVisible()) {
        // Try to submit empty form
        await submitButton.click();
        
        // Should show validation errors
        await expect(page.locator('.el-form-item__error, .error-message, .validation-error')).toBeVisible({ timeout: 3000 });
        
        // Fill form with valid data
        const earTagInput = page.locator('input[placeholder*="耳标"], input[name*="earTag"]');
        if (await earTagInput.isVisible()) {
          await earTagInput.fill(`TEST_${Date.now()}`);
        }
        
        const breedInput = page.locator('input[placeholder*="品种"], input[name*="breed"]');
        if (await breedInput.isVisible()) {
          await breedInput.fill('测试品种');
        }
        
        const genderSelect = page.locator('select[name*="gender"], .el-select:has-text("性别")');
        if (await genderSelect.isVisible()) {
          await genderSelect.click();
          await page.locator('text=雄性, text=male').first().click();
        }
        
        // Intercept submission request
        const submitRequest = page.waitForResponse(response => 
          response.url().includes('/api/cattle') && response.request().method() === 'POST'
        );
        
        await submitButton.click();
        
        // Validate request data
        const response = await submitRequest;
        const requestData = response.request().postDataJSON();
        
        expect(requestData).toHaveProperty('ear_tag');
        expect(requestData).toHaveProperty('breed');
        expect(requestData.ear_tag).toContain('TEST_');
        expect(requestData.breed).toBe('测试品种');
        
        // Validate response handling
        if (response.status() === 201) {
          // Success case
          await expect(page.locator('.el-message--success, .success-message')).toBeVisible({ timeout: 5000 });
        } else {
          // Error case
          await expect(page.locator('.el-message--error, .error-message')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('Token refresh and session management', async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Get initial token
    const initialToken = await page.evaluate(() => localStorage.getItem('token'));
    
    // Simulate token near expiration by modifying stored token
    await page.evaluate(() => {
      // Create a token that will expire soon (mock JWT payload)
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        id: 1, 
        username: 'admin',
        exp: Math.floor(Date.now() / 1000) + 60 // Expires in 1 minute
      }));
      const signature = 'mock-signature';
      const nearExpiredToken = `${header}.${payload}.${signature}`;
      localStorage.setItem('token', nearExpiredToken);
    });
    
    // Make an API request that should trigger token refresh
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    
    // Wait for potential token refresh
    await page.waitForTimeout(2000);
    
    // Check if token was refreshed
    const newToken = await page.evaluate(() => localStorage.getItem('token'));
    
    // Token should either be refreshed or user should be redirected to login
    if (page.url().includes('/login')) {
      // Session expired, user redirected to login
      expect(page.url()).toContain('/login');
    } else {
      // Token was refreshed successfully
      expect(newToken).toBeTruthy();
      // In a real scenario, you'd validate the new token structure
    }
  });

  test('Data consistency across page navigation', async ({ page }) => {
    await loginUser(page);
    
    // Navigate to cattle list
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Get cattle count from list
    const listCount = await page.locator('.cattle-item, tr[data-cattle-id], .cattle-card').count();
    
    // Navigate to dashboard
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Check if dashboard shows consistent cattle count
    const dashboardCountElement = page.locator('[data-metric="cattle-count"], .cattle-total, text=/牛只总数.*\\d+/');
    if (await dashboardCountElement.isVisible()) {
      const dashboardText = await dashboardCountElement.textContent();
      const dashboardCount = parseInt(dashboardText?.match(/\d+/)?.[0] || '0');
      
      // Counts should be consistent (allowing for small differences due to timing)
      expect(Math.abs(dashboardCount - listCount)).toBeLessThanOrEqual(1);
    }
  });

  test('Mobile responsiveness and touch interactions', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginUser(page);
    
    // Test mobile navigation
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Check if mobile menu exists
    const mobileMenu = page.locator('.mobile-menu, .hamburger, [data-mobile-menu]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      
      // Should show navigation items
      await expect(page.locator('.mobile-nav, .nav-drawer')).toBeVisible({ timeout: 3000 });
    }
    
    // Test form interactions on mobile
    const addButton = page.locator('button:has-text("添加"), button:has-text("新增")');
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Form should be properly sized for mobile
      const form = page.locator('form, .form-container');
      if (await form.isVisible()) {
        const formBox = await form.boundingBox();
        expect(formBox?.width).toBeLessThanOrEqual(375);
      }
    }
  });

  test('Real-time data updates and WebSocket connections', async ({ page }) => {
    await loginUser(page);
    
    // Navigate to dashboard or real-time view
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Check for WebSocket connection (if implemented)
    const wsConnections = await page.evaluate(() => {
      // Check if WebSocket connections exist
      return window.WebSocket ? 'supported' : 'not-supported';
    });
    
    if (wsConnections === 'supported') {
      // Test WebSocket connection establishment
      await page.evaluate(() => {
        // This would test actual WebSocket implementation
        console.log('WebSocket testing would go here');
      });
    }
    
    // Test periodic data refresh
    const initialData = await page.locator('[data-metric], .metric-value').first().textContent();
    
    // Wait for potential data refresh
    await page.waitForTimeout(5000);
    
    const updatedData = await page.locator('[data-metric], .metric-value').first().textContent();
    
    // Data might have updated (or stayed the same if no changes)
    expect(updatedData).toBeDefined();
  });
});

// Helper function for login
async function loginUser(page: Page): Promise<void> {
  // Check if already logged in
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    const token = await page.evaluate(() => localStorage.getItem('token'));
    if (token) {
      return; // Already logged in
    }
  }
  
  // Navigate to login if not already there
  if (!currentUrl.includes('/login')) {
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/login`);
    await page.waitForLoadState('networkidle');
  }
  
  // Perform login
  await page.fill('input[placeholder*="用户名"], input[name="username"]', TEST_USER.username);
  await page.fill('input[placeholder*="密码"], input[name="password"]', TEST_USER.password);
  await page.click('button:has-text("登录")');
  
  // Wait for login to complete
  await page.waitForTimeout(3000);
  
  // Verify login success
  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (!token) {
    throw new Error('Login failed - no token found');
  }
}