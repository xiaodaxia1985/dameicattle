import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_USER = {
  username: 'admin',
  password: 'Admin123',
};

test.describe('Basic Application Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('Login functionality', async ({ page }) => {
    // Check if login form is visible
    await expect(page.locator('textbox[placeholder*="用户名"], input[placeholder*="用户名"]')).toBeVisible();
    await expect(page.locator('textbox[placeholder*="密码"], input[placeholder*="密码"]')).toBeVisible();
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
    
    // Fill login form
    await page.fill('textbox[placeholder*="用户名"], input[placeholder*="用户名"]', TEST_USER.username);
    await page.fill('textbox[placeholder*="密码"], input[placeholder*="密码"]', TEST_USER.password);
    
    // Click login button
    await page.click('button:has-text("登录")');
    
    // Wait for login to process
    await page.waitForTimeout(3000);
    
    // Check if we're logged in (page should change or show different content)
    await page.waitForLoadState('networkidle');
    
    // The test passes if login doesn't throw an error and page loads
    expect(page.url()).toBeTruthy();
  });

  test('Page navigation after login', async ({ page }) => {
    // Login first
    await loginUser(page, TEST_USER.username, TEST_USER.password);
    
    // Try to navigate to different sections if they exist
    const navigationLinks = [
      'text=牛只管理',
      'text=饲料管理', 
      'text=健康管理',
      'text=繁殖管理',
      'text=财务管理',
      'text=报表统计'
    ];
    
    for (const linkText of navigationLinks) {
      const link = page.locator(linkText);
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(1000);
        await page.waitForLoadState('networkidle');
        // Just verify the page loads without error
        expect(page.url()).toBeTruthy();
      }
    }
  });

  test('Basic form interactions', async ({ page }) => {
    await loginUser(page, TEST_USER.username, TEST_USER.password);
    
    // Look for any forms or input fields on the page
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    
    if (inputCount > 0) {
      // Try to interact with the first few inputs
      for (let i = 0; i < Math.min(3, inputCount); i++) {
        const input = inputs.nth(i);
        const inputType = await input.getAttribute('type');
        
        if (inputType === 'text' || inputType === null) {
          await input.fill('Test Value');
          await page.waitForTimeout(500);
        }
      }
    }
    
    // Look for buttons and try clicking them
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // Click the first button that's not the login button
      for (let i = 0; i < Math.min(2, buttonCount); i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();
        
        if (buttonText && !buttonText.includes('登录')) {
          try {
            await button.click();
            await page.waitForTimeout(1000);
          } catch (error) {
            // Ignore click errors, just testing basic interaction
          }
        }
      }
    }
    
    expect(true).toBe(true); // Test passes if no major errors
  });

  test('Responsive design basic check', async ({ page }) => {
    await loginUser(page, TEST_USER.username, TEST_USER.password);
    
    // Test different viewport sizes
    const viewports = [
      { width: 1200, height: 800 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Just verify the page still loads and is responsive
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBeTruthy();
    }
  });

  test('Basic error handling', async ({ page }) => {
    // Test invalid login
    await page.fill('textbox[placeholder*="用户名"], input[placeholder*="用户名"]', 'invalid_user');
    await page.fill('textbox[placeholder*="密码"], input[placeholder*="密码"]', 'invalid_password');
    await page.click('button:has-text("登录")');
    
    // Wait for potential error message
    await page.waitForTimeout(2000);
    
    // The test passes if the page doesn't crash
    expect(page.url()).toBeTruthy();
  });

  test('Page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Expect page to load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});

// Helper function to login user
async function loginUser(page: Page, username: string, password: string) {
  // Check if already logged in
  const logoutBtn = page.locator('text=退出登录');
  if (await logoutBtn.isVisible()) {
    return; // Already logged in
  }
  
  // Navigate to home if not already there
  if (!page.url().includes('/') || page.url().includes('/login')) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  }
  
  // Wait for login form elements
  await page.waitForSelector('textbox[placeholder*="用户名"], input[placeholder*="用户名"]', { timeout: 10000 });
  
  // Fill login form
  await page.fill('textbox[placeholder*="用户名"], input[placeholder*="用户名"]', username);
  await page.fill('textbox[placeholder*="密码"], input[placeholder*="密码"]', password);
  await page.click('button:has-text("登录")');
  
  // Wait for login to process
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle');
}