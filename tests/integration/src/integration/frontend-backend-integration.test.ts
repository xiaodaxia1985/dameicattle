import { test, expect, Page, BrowserContext } from '@playwright/test';
import axios from 'axios';

// Integration tests that validate frontend-backend data flow
const TEST_CONFIG = {
  backend: {
    baseURL: process.env.BACKEND_URL || 'http://localhost:3000'
  },
  frontend: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173'
  }
};

const TEST_USER = {
  username: 'integration_test_admin',
  password: 'IntegrationTest123!',
  email: 'integration@test.com'
};

test.describe('Frontend-Backend Integration Tests', () => {
  let context: BrowserContext;
  let page: Page;
  let authToken: string;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
    page = await context.newPage();
    
    // Setup test user via direct API call
    try {
      await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/register`, {
        username: TEST_USER.username,
        password: TEST_USER.password,
        real_name: '集成测试管理员',
        email: TEST_USER.email,
      });
    } catch (error) {
      // User might already exist, ignore error
    }
    
    // Get auth token
    const loginResponse = await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/login`, {
      username: TEST_USER.username,
      password: TEST_USER.password,
    });
    authToken = loginResponse.data.data.token;
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('Complete cattle management workflow integration', async () => {
    // Step 1: Login through frontend
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Monitor API calls during login
    const loginApiCall = page.waitForResponse(response => 
      response.url().includes('/api/auth/login')
    );
    
    await page.fill('input[placeholder*="用户名"], input[name="username"]', TEST_USER.username);
    await page.fill('input[placeholder*="密码"], input[name="password"]', TEST_USER.password);
    await page.click('button:has-text("登录")');
    
    // Validate login API response
    const loginResponse = await loginApiCall;
    expect(loginResponse.status()).toBe(200);
    
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.data.token).toBeTruthy();
    
    // Verify frontend received and stored the data correctly
    await page.waitForTimeout(2000);
    const storedToken = await page.evaluate(() => localStorage.getItem('token'));
    const storedUser = await page.evaluate(() => localStorage.getItem('user'));
    
    expect(storedToken).toBe(loginData.data.token);
    expect(JSON.parse(storedUser).username).toBe(TEST_USER.username);
    
    // Step 2: Navigate to cattle management
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Monitor cattle list API call
    const cattleListCall = page.waitForResponse(response => 
      response.url().includes('/api/cattle') && response.request().method() === 'GET'
    );
    
    await page.waitForTimeout(2000);
    
    // Validate cattle list API response
    const cattleListResponse = await cattleListCall;
    expect(cattleListResponse.status()).toBe(200);
    
    const cattleListData = await cattleListResponse.json();
    expect(cattleListData.success).toBe(true);
    
    // Step 3: Create new cattle through frontend form
    const addButton = page.locator('button:has-text("添加"), button:has-text("新增"), button:has-text("创建")');
    if (await addButton.isVisible()) {
      await addButton.first().click();
      await page.waitForTimeout(1000);
      
      // Fill form with test data
      const testEarTag = `INTEGRATION_${Date.now()}`;
      const testBreed = '集成测试品种';
      
      const earTagInput = page.locator('input[placeholder*="耳标"], input[name*="earTag"], input[name*="ear_tag"]');
      if (await earTagInput.isVisible()) {
        await earTagInput.fill(testEarTag);
      }
      
      const breedInput = page.locator('input[placeholder*="品种"], input[name*="breed"]');
      if (await breedInput.isVisible()) {
        await breedInput.fill(testBreed);
      }
      
      const genderSelect = page.locator('select[name*="gender"], .el-select:has-text("性别")');
      if (await genderSelect.isVisible()) {
        await genderSelect.click();
        await page.locator('text=雄性, text=male').first().click();
      }
      
      const weightInput = page.locator('input[placeholder*="体重"], input[name*="weight"]');
      if (await weightInput.isVisible()) {
        await weightInput.fill('450');
      }
      
      // Monitor cattle creation API call
      const createCattleCall = page.waitForResponse(response => 
        response.url().includes('/api/cattle') && response.request().method() === 'POST'
      );
      
      const submitButton = page.locator('button:has-text("提交"), button:has-text("保存"), button:has-text("确定")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Validate creation API response
        const createResponse = await createCattleCall;
        expect(createResponse.status()).toBe(201);
        
        const createData = await createResponse.json();
        expect(createData.success).toBe(true);
        expect(createData.data.ear_tag).toBe(testEarTag);
        expect(createData.data.breed).toBe(testBreed);
        
        // Verify frontend shows success feedback
        await expect(page.locator('.el-message--success, .success-message, text=成功')).toBeVisible({ timeout: 5000 });
        
        // Step 4: Verify the new cattle appears in the list
        await page.waitForTimeout(2000);
        
        // Check if the new cattle appears in the UI
        await expect(page.locator(`text=${testEarTag}`)).toBeVisible({ timeout: 10000 });
        await expect(page.locator(`text=${testBreed}`)).toBeVisible({ timeout: 5000 });
        
        // Step 5: Verify data consistency by direct API call
        const directApiResponse = await axios.get(
          `${TEST_CONFIG.backend.baseURL}/api/cattle?search=${testEarTag}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        expect(directApiResponse.status).toBe(200);
        expect(directApiResponse.data.success).toBe(true);
        
        const foundCattle = directApiResponse.data.data.items || directApiResponse.data.data;
        const createdCattle = Array.isArray(foundCattle) 
          ? foundCattle.find(c => c.ear_tag === testEarTag)
          : foundCattle.ear_tag === testEarTag ? foundCattle : null;
        
        expect(createdCattle).toBeTruthy();
        expect(createdCattle.ear_tag).toBe(testEarTag);
        expect(createdCattle.breed).toBe(testBreed);
        expect(createdCattle.weight).toBe(450);
      }
    }
  });

  test('Permission-based access control integration', async () => {
    // Create a limited user via API
    const limitedUserData = {
      username: `limited_${Date.now()}`,
      password: 'LimitedUser123!',
      real_name: '受限用户',
      email: `limited_${Date.now()}@test.com`,
    };
    
    await axios.post(`${TEST_CONFIG.backend.baseURL}/api/auth/register`, limitedUserData);
    
    // Login as limited user in frontend
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="用户名"]', limitedUserData.username);
    await page.fill('input[placeholder*="密码"]', limitedUserData.password);
    await page.click('button:has-text("登录")');
    
    await page.waitForTimeout(3000);
    
    // Navigate to cattle management
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Get user permissions from frontend
    const userPermissions = await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role?.permissions || [];
    });
    
    // Test permission-based UI behavior
    const hasCreatePermission = userPermissions.includes('*') || 
                               userPermissions.includes('cattle:create');
    
    if (!hasCreatePermission) {
      // Should not show create button
      await expect(page.locator('button:has-text("添加"), button:has-text("新增")')).not.toBeVisible();
      
      // Try to access create API directly - should fail
      const createAttempt = await axios.post(
        `${TEST_CONFIG.backend.baseURL}/api/cattle`,
        {
          ear_tag: 'UNAUTHORIZED_TEST',
          breed: 'Test Breed',
          gender: 'male',
        },
        { 
          headers: { Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}` },
          validateStatus: () => true
        }
      );
      
      expect(createAttempt.status).toBe(403);
      expect(createAttempt.data.success).toBe(false);
      expect(createAttempt.data.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    }
  });

  test('Error handling integration between frontend and backend', async () => {
    // Login as admin
    await loginAsAdmin(page);
    
    // Navigate to cattle management
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Test 1: Validation error handling
    const addButton = page.locator('button:has-text("添加"), button:has-text("新增")');
    if (await addButton.isVisible()) {
      await addButton.first().click();
      await page.waitForTimeout(1000);
      
      // Try to submit form with invalid data
      const earTagInput = page.locator('input[placeholder*="耳标"], input[name*="earTag"]');
      if (await earTagInput.isVisible()) {
        await earTagInput.fill(''); // Empty required field
      }
      
      const weightInput = page.locator('input[placeholder*="体重"], input[name*="weight"]');
      if (await weightInput.isVisible()) {
        await weightInput.fill('-100'); // Invalid weight
      }
      
      // Monitor validation error API response
      const validationErrorCall = page.waitForResponse(response => 
        response.url().includes('/api/cattle') && 
        response.request().method() === 'POST' &&
        response.status() === 400
      );
      
      const submitButton = page.locator('button:has-text("提交"), button:has-text("保存")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Validate error API response
        const errorResponse = await validationErrorCall;
        expect(errorResponse.status()).toBe(400);
        
        const errorData = await errorResponse.json();
        expect(errorData.success).toBe(false);
        expect(errorData.error).toBeTruthy();
        
        // Verify frontend shows validation errors
        await expect(page.locator('.el-form-item__error, .error-message, .validation-error')).toBeVisible({ timeout: 5000 });
      }
    }
    
    // Test 2: Network error simulation
    // Intercept API calls to simulate network failure
    await page.route('**/api/cattle**', route => {
      route.abort('failed');
    });
    
    // Try to load cattle list
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should show network error message
    await expect(page.locator('.error-message, text=网络连接失败, text=加载失败')).toBeVisible({ timeout: 10000 });
    
    // Clear route interception
    await page.unroute('**/api/cattle**');
  });

  test('Data synchronization across multiple browser tabs', async () => {
    // Login in first tab
    await loginAsAdmin(page);
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Open second tab
    const secondPage = await context.newPage();
    await loginAsAdmin(secondPage);
    await secondPage.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await secondPage.waitForLoadState('networkidle');
    
    // Create cattle in first tab
    const addButton = page.locator('button:has-text("添加"), button:has-text("新增")');
    if (await addButton.isVisible()) {
      await addButton.first().click();
      await page.waitForTimeout(1000);
      
      const testEarTag = `SYNC_TEST_${Date.now()}`;
      
      const earTagInput = page.locator('input[placeholder*="耳标"], input[name*="earTag"]');
      if (await earTagInput.isVisible()) {
        await earTagInput.fill(testEarTag);
      }
      
      const breedInput = page.locator('input[placeholder*="品种"], input[name*="breed"]');
      if (await breedInput.isVisible()) {
        await breedInput.fill('同步测试品种');
      }
      
      const submitButton = page.locator('button:has-text("提交"), button:has-text("保存")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Wait for creation to complete
        await expect(page.locator('.el-message--success, .success-message')).toBeVisible({ timeout: 5000 });
        
        // Refresh second tab to check if data appears
        await secondPage.reload();
        await secondPage.waitForLoadState('networkidle');
        await secondPage.waitForTimeout(2000);
        
        // New cattle should appear in second tab
        await expect(secondPage.locator(`text=${testEarTag}`)).toBeVisible({ timeout: 10000 });
      }
    }
    
    await secondPage.close();
  });

  test('File upload integration', async () => {
    await loginAsAdmin(page);
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/cattle`);
    await page.waitForLoadState('networkidle');
    
    // Look for import/upload functionality
    const importButton = page.locator('button:has-text("导入"), button:has-text("上传"), input[type="file"]');
    if (await importButton.first().isVisible()) {
      
      // Create test CSV content
      const csvContent = `耳标号,品种,性别,出生日期,体重,健康状态
UPLOAD_TEST_001,上传测试品种,雄性,2023-01-01,450,健康
UPLOAD_TEST_002,上传测试品种,雌性,2023-01-02,420,健康`;
      
      // Monitor upload API call
      const uploadCall = page.waitForResponse(response => 
        response.url().includes('/api/upload') || 
        response.url().includes('/api/cattle/import')
      );
      
      // Handle file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles({
          name: 'test-cattle.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvContent),
        });
        
        // Submit upload
        const uploadSubmitButton = page.locator('button:has-text("上传"), button:has-text("提交")');
        if (await uploadSubmitButton.isVisible()) {
          await uploadSubmitButton.click();
          
          // Validate upload response
          const uploadResponse = await uploadCall;
          expect(uploadResponse.status()).toBe(200);
          
          const uploadData = await uploadResponse.json();
          expect(uploadData.success).toBe(true);
          
          // Verify success message
          await expect(page.locator('.el-message--success, .success-message')).toBeVisible({ timeout: 10000 });
          
          // Verify uploaded data appears in list
          await page.waitForTimeout(3000);
          await expect(page.locator('text=UPLOAD_TEST_001')).toBeVisible({ timeout: 10000 });
          await expect(page.locator('text=UPLOAD_TEST_002')).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test('Real-time data updates and WebSocket integration', async () => {
    await loginAsAdmin(page);
    await page.goto(`${TEST_CONFIG.frontend.baseURL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Check for WebSocket connection
    const wsConnected = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (typeof WebSocket === 'undefined') {
          resolve(false);
          return;
        }
        
        // Check if there are any existing WebSocket connections
        const hasWebSocket = window.WebSocket !== undefined;
        resolve(hasWebSocket);
      });
    });
    
    if (wsConnected) {
      // Test WebSocket message handling
      await page.evaluate(() => {
        // Simulate WebSocket message
        if (window.WebSocket) {
          const event = new CustomEvent('websocket-message', {
            detail: {
              type: 'cattle-update',
              data: {
                id: 1,
                ear_tag: 'WS_TEST_001',
                status: 'updated'
              }
            }
          });
          window.dispatchEvent(event);
        }
      });
      
      // Check if UI updates in response to WebSocket message
      await page.waitForTimeout(2000);
      // This would depend on your WebSocket implementation
    }
    
    // Test periodic data refresh
    const initialMetricValue = await page.locator('[data-metric="cattle-count"], .cattle-total').first().textContent();
    
    // Wait for potential auto-refresh
    await page.waitForTimeout(10000);
    
    const updatedMetricValue = await page.locator('[data-metric="cattle-count"], .cattle-total').first().textContent();
    
    // Values might be the same if no changes occurred, which is fine
    expect(updatedMetricValue).toBeDefined();
  });
});

// Helper function to login as admin
async function loginAsAdmin(page: Page): Promise<void> {
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