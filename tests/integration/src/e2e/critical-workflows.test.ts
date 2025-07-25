import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_USER = {
  username: 'e2e_test_user',
  email: 'e2e@test.com',
  password: 'TestPassword123!',
};

const TEST_CATTLE = {
  earTag: `E2E_${Date.now()}`,
  breed: 'E2E Test Breed',
  gender: 'male',
  birthDate: '2023-01-15',
  weight: '480',
  healthStatus: 'healthy',
};

test.describe('Critical User Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('Complete cattle management workflow', async ({ page }) => {
    // 1. Login
    await loginUser(page, TEST_USER.username, TEST_USER.password);
    
    // 2. Navigate to cattle management
    await page.click('[data-testid="nav-cattle"]');
    await page.waitForURL('**/cattle');
    
    // 3. Create new cattle
    await page.click('[data-testid="add-cattle-btn"]');
    await page.waitForSelector('[data-testid="cattle-form"]');
    
    // Fill cattle form
    await page.fill('[data-testid="cattle-ear-tag"]', TEST_CATTLE.earTag);
    await page.fill('[data-testid="cattle-breed"]', TEST_CATTLE.breed);
    await page.selectOption('[data-testid="cattle-gender"]', TEST_CATTLE.gender);
    await page.fill('[data-testid="cattle-birth-date"]', TEST_CATTLE.birthDate);
    await page.fill('[data-testid="cattle-weight"]', TEST_CATTLE.weight);
    await page.selectOption('[data-testid="cattle-health-status"]', TEST_CATTLE.healthStatus);
    
    // Submit form
    await page.click('[data-testid="submit-cattle-btn"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('创建成功');
    
    // 4. Verify cattle appears in list
    await page.waitForSelector(`[data-testid="cattle-row-${TEST_CATTLE.earTag}"]`);
    const cattleRow = page.locator(`[data-testid="cattle-row-${TEST_CATTLE.earTag}"]`);
    await expect(cattleRow).toBeVisible();
    await expect(cattleRow).toContainText(TEST_CATTLE.earTag);
    await expect(cattleRow).toContainText(TEST_CATTLE.breed);
    
    // 5. Edit cattle
    await cattleRow.locator('[data-testid="edit-cattle-btn"]').click();
    await page.waitForSelector('[data-testid="cattle-form"]');
    
    // Update weight
    const newWeight = '490';
    await page.fill('[data-testid="cattle-weight"]', newWeight);
    await page.click('[data-testid="submit-cattle-btn"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // 6. Verify update
    await page.waitForSelector(`[data-testid="cattle-row-${TEST_CATTLE.earTag}"]`);
    const updatedRow = page.locator(`[data-testid="cattle-row-${TEST_CATTLE.earTag}"]`);
    await expect(updatedRow).toContainText(newWeight);
    
    // 7. View cattle details
    await updatedRow.locator('[data-testid="view-cattle-btn"]').click();
    await page.waitForSelector('[data-testid="cattle-details"]');
    
    const detailsPage = page.locator('[data-testid="cattle-details"]');
    await expect(detailsPage).toContainText(TEST_CATTLE.earTag);
    await expect(detailsPage).toContainText(TEST_CATTLE.breed);
    await expect(detailsPage).toContainText(newWeight);
    
    // 8. Delete cattle
    await page.click('[data-testid="delete-cattle-btn"]');
    await page.click('[data-testid="confirm-delete-btn"]');
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // 9. Verify cattle is removed from list
    await page.goto('/cattle');
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`[data-testid="cattle-row-${TEST_CATTLE.earTag}"]`)).not.toBeVisible();
  });

  test('Authentication and authorization workflow', async ({ page }) => {
    // 1. Test login with invalid credentials
    await page.fill('[data-testid="username-input"]', 'invalid_user');
    await page.fill('[data-testid="password-input"]', 'invalid_password');
    await page.click('[data-testid="login-btn"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('用户名或密码错误');
    
    // 2. Test successful login
    await loginUser(page, TEST_USER.username, TEST_USER.password);
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // 3. Test protected route access
    await page.goto('/cattle');
    await page.waitForLoadState('networkidle');
    
    // Should be able to access cattle page
    await expect(page.locator('[data-testid="cattle-list"]')).toBeVisible();
    
    // 4. Test logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-btn"]');
    
    // Should redirect to login page
    await page.waitForURL('**/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    
    // 5. Test accessing protected route after logout
    await page.goto('/cattle');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  test('Data pagination and filtering workflow', async ({ page }) => {
    await loginUser(page, TEST_USER.username, TEST_USER.password);
    
    // Navigate to cattle list
    await page.goto('/cattle');
    await page.waitForLoadState('networkidle');
    
    // 1. Test pagination
    const paginationInfo = page.locator('[data-testid="pagination-info"]');
    await expect(paginationInfo).toBeVisible();
    
    // Check if there are multiple pages
    const nextPageBtn = page.locator('[data-testid="next-page-btn"]');
    if (await nextPageBtn.isEnabled()) {
      await nextPageBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Verify page changed
      await expect(paginationInfo).toContainText('第 2 页');
      
      // Go back to first page
      await page.click('[data-testid="prev-page-btn"]');
      await page.waitForLoadState('networkidle');
      await expect(paginationInfo).toContainText('第 1 页');
    }
    
    // 2. Test filtering
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Test');
    await page.click('[data-testid="search-btn"]');
    await page.waitForLoadState('networkidle');
    
    // Verify filtered results
    const cattleRows = page.locator('[data-testid^="cattle-row-"]');
    const rowCount = await cattleRows.count();
    
    if (rowCount > 0) {
      // Check that all visible rows contain the search term
      for (let i = 0; i < rowCount; i++) {
        const row = cattleRows.nth(i);
        await expect(row).toContainText('Test', { ignoreCase: true });
      }
    }
    
    // 3. Clear filter
    await searchInput.clear();
    await page.click('[data-testid="search-btn"]');
    await page.waitForLoadState('networkidle');
    
    // Should show all results again
    const allRows = page.locator('[data-testid^="cattle-row-"]');
    const allRowCount = await allRows.count();
    expect(allRowCount).toBeGreaterThanOrEqual(rowCount);
  });

  test('File upload workflow', async ({ page }) => {
    await loginUser(page, TEST_USER.username, TEST_USER.password);
    
    // Navigate to cattle management
    await page.goto('/cattle');
    await page.waitForLoadState('networkidle');
    
    // 1. Open import dialog
    await page.click('[data-testid="import-cattle-btn"]');
    await page.waitForSelector('[data-testid="import-dialog"]');
    
    // 2. Test file upload
    const fileInput = page.locator('[data-testid="file-input"]');
    
    // Create a test CSV file content
    const csvContent = `耳标号,品种,性别,出生日期,体重,健康状态
TEST_UPLOAD_001,测试品种,雄性,2023-01-01,450,健康
TEST_UPLOAD_002,测试品种,雌性,2023-01-02,420,健康`;
    
    // Create a temporary file
    const buffer = Buffer.from(csvContent);
    await fileInput.setInputFiles({
      name: 'test-cattle.csv',
      mimeType: 'text/csv',
      buffer: buffer,
    });
    
    // 3. Submit upload
    await page.click('[data-testid="upload-btn"]');
    
    // Wait for upload to complete
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
    
    // 4. Verify uploaded data
    await page.click('[data-testid="close-dialog-btn"]');
    await page.waitForLoadState('networkidle');
    
    // Check if uploaded cattle appear in the list
    await expect(page.locator('[data-testid="cattle-row-TEST_UPLOAD_001"]')).toBeVisible();
    await expect(page.locator('[data-testid="cattle-row-TEST_UPLOAD_002"]')).toBeVisible();
  });

  test('Error handling and recovery workflow', async ({ page }) => {
    await loginUser(page, TEST_USER.username, TEST_USER.password);
    
    // 1. Test network error handling
    // Simulate network failure
    await page.route('**/api/cattle', route => route.abort());
    
    await page.goto('/cattle');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('网络错误');
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
    
    // 2. Test error recovery
    // Remove network simulation
    await page.unroute('**/api/cattle');
    
    // Click retry
    await page.click('[data-testid="retry-btn"]');
    await page.waitForLoadState('networkidle');
    
    // Should load successfully
    await expect(page.locator('[data-testid="cattle-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible();
    
    // 3. Test form validation errors
    await page.click('[data-testid="add-cattle-btn"]');
    await page.waitForSelector('[data-testid="cattle-form"]');
    
    // Submit empty form
    await page.click('[data-testid="submit-cattle-btn"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('耳标号不能为空');
    
    // 4. Test server error handling
    // Simulate server error
    await page.route('**/api/cattle', route => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: '服务器内部错误',
        errors: ['Database connection failed'],
      }),
    }));
    
    // Fill valid form data
    await page.fill('[data-testid="cattle-ear-tag"]', 'ERROR_TEST_001');
    await page.fill('[data-testid="cattle-breed"]', 'Error Test');
    await page.selectOption('[data-testid="cattle-gender"]', 'male');
    await page.fill('[data-testid="cattle-birth-date"]', '2023-01-01');
    await page.fill('[data-testid="cattle-weight"]', '400');
    
    await page.click('[data-testid="submit-cattle-btn"]');
    
    // Should show server error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('服务器内部错误');
    
    // Remove server error simulation
    await page.unroute('**/api/cattle');
  });

  test('Responsive design and mobile compatibility', async ({ page }) => {
    await loginUser(page, TEST_USER.username, TEST_USER.password);
    
    // 1. Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/cattle');
    await page.waitForLoadState('networkidle');
    
    // Desktop navigation should be visible
    await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav"]')).not.toBeVisible();
    
    // 2. Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Wait for responsive changes
    
    // Should adapt to tablet layout
    await expect(page.locator('[data-testid="cattle-list"]')).toBeVisible();
    
    // 3. Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Mobile navigation should be visible
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-btn"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test mobile cattle list
    await page.click('[data-testid="mobile-nav-cattle"]');
    await page.waitForURL('**/cattle');
    
    // Should show mobile-optimized cattle list
    await expect(page.locator('[data-testid="mobile-cattle-list"]')).toBeVisible();
    
    // 4. Test mobile form interaction
    await page.click('[data-testid="mobile-add-btn"]');
    await page.waitForSelector('[data-testid="mobile-cattle-form"]');
    
    // Form should be mobile-optimized
    await expect(page.locator('[data-testid="mobile-cattle-form"]')).toBeVisible();
    
    // Test form fields are accessible on mobile
    const earTagInput = page.locator('[data-testid="cattle-ear-tag"]');
    await expect(earTagInput).toBeVisible();
    await earTagInput.fill('MOBILE_TEST_001');
    
    // Close form
    await page.click('[data-testid="close-form-btn"]');
  });
});

// Helper function to login user
async function loginUser(page: Page, username: string, password: string) {
  // Check if already logged in
  const userMenu = page.locator('[data-testid="user-menu"]');
  if (await userMenu.isVisible()) {
    return; // Already logged in
  }
  
  // Navigate to login if not already there
  if (!page.url().includes('/login')) {
    await page.goto('/login');
  }
  
  await page.waitForSelector('[data-testid="login-form"]');
  
  // Fill login form
  await page.fill('[data-testid="username-input"]', username);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-btn"]');
  
  // Wait for successful login
  await page.waitForURL('**/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
}