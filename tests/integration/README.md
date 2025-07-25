# Multi-Component Integration Testing Suite

This comprehensive testing suite provides integration testing for the cattle management system's three main components: backend API, frontend web application, and WeChat miniprogram.

## 🎯 Overview

The integration testing suite covers:

- **Multi-component integration testing** - Tests interaction between all three components
- **End-to-end testing** - Critical user workflows using Playwright
- **API contract testing** - Ensures consistent data contracts between frontend and backend
- **Performance and load testing** - System performance under various conditions
- **Automated testing pipeline** - CI/CD integration with error reporting and recovery

## 📁 Structure

```
tests/integration/
├── src/
│   ├── integration/          # Multi-component integration tests
│   ├── e2e/                 # End-to-end tests using Playwright
│   ├── contract/            # API contract tests
│   ├── performance/         # Performance and load tests
│   └── setup.ts            # Global test setup and utilities
├── scripts/
│   ├── setup-test-environment.js    # Environment setup script
│   ├── teardown-test-environment.js # Environment cleanup script
│   └── run-test-pipeline.js         # Automated test pipeline
├── package.json            # Test dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── playwright.config.ts   # Playwright configuration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker (for database and Redis services)
- All three components (backend, frontend, miniprogram) set up

### Installation

```bash
# Install integration test dependencies
cd tests/integration
npm install

# Install dependencies for all components
npm run install-deps
```

### Running Tests

```bash
# Run all tests
npm run test:all

# Run specific test types
npm run test              # Integration tests only
npm run test:e2e         # End-to-end tests only
npm run test:contract    # Contract tests only
npm run test:performance # Performance tests only

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Automated Pipeline

```bash
# Run the complete automated pipeline
npm run pipeline

# Setup test environment manually
npm run setup

# Teardown test environment
npm run teardown
```

## 🧪 Test Types

### 1. Multi-Component Integration Tests

Located in `src/integration/`, these tests verify:

- **Backend-Frontend Integration**: Complete CRUD workflows
- **Authentication Flow**: Login, token refresh, logout across components
- **File Upload Workflow**: File handling and storage
- **Data Consistency**: Consistent data structures and formats
- **Error Handling**: Consistent error responses
- **Concurrent Operations**: System behavior under concurrent load

Example:
```typescript
test('should handle complete cattle management workflow', async () => {
  // Create cattle via backend API
  const createResponse = await axios.post('/api/cattle', cattleData, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  // Verify data consistency
  expect(createResponse.data.success).toBe(true);
  expect(createResponse.data.data).toHaveProperty('id');
  
  // Test update workflow
  const updateResponse = await axios.put(`/api/cattle/${cattleId}`, updateData);
  expect(updateResponse.data.data.weight).toBe(updatedWeight);
});
```

### 2. End-to-End Tests

Located in `src/e2e/`, using Playwright for browser automation:

- **Critical User Workflows**: Complete user journeys
- **Authentication and Authorization**: Login/logout flows
- **Data Management**: CRUD operations through UI
- **File Upload**: File handling through web interface
- **Error Handling**: User-facing error scenarios
- **Responsive Design**: Mobile and desktop compatibility

Example:
```typescript
test('Complete cattle management workflow', async ({ page }) => {
  await loginUser(page, testUser.username, testUser.password);
  
  await page.click('[data-testid="add-cattle-btn"]');
  await page.fill('[data-testid="cattle-ear-tag"]', 'TEST_001');
  await page.click('[data-testid="submit-cattle-btn"]');
  
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### 3. API Contract Tests

Located in `src/contract/`, ensuring API consistency:

- **Request/Response Schemas**: Validate data structures
- **Error Response Formats**: Consistent error handling
- **Authentication Contracts**: Token and auth flow validation
- **Pagination Contracts**: Consistent pagination structure
- **File Upload Contracts**: File handling API validation

Example:
```typescript
test('GET /api/cattle should return valid paginated contract', async () => {
  const response = await axios.get('/api/cattle?page=1&limit=10');
  
  validateApiResponse(response.data);
  validateSchema(response.data.data, PAGINATED_RESPONSE_SCHEMA);
  
  response.data.data.items.forEach(cattle => {
    validateSchema(cattle, CATTLE_SCHEMA);
  });
});
```

### 4. Performance Tests

Located in `src/performance/`, testing system performance:

- **Response Time Testing**: API endpoint performance
- **Concurrent Request Handling**: Load testing
- **Database Performance**: Query optimization validation
- **Memory Usage**: Memory leak detection
- **Error Response Performance**: Fast error handling

Example:
```typescript
test('should handle concurrent requests efficiently', async () => {
  const requests = Array(20).fill().map(() => 
    axios.get('/api/cattle', { headers: { Authorization: `Bearer ${token}` } })
  );
  
  const startTime = Date.now();
  const responses = await Promise.all(requests);
  const totalTime = Date.now() - startTime;
  
  expect(totalTime).toBeLessThan(10000); // 10 seconds max
  responses.forEach(response => expect(response.status).toBe(200));
});
```

## 🔧 Configuration

### Test Environment Configuration

The test suite automatically sets up isolated test environments:

- **Database**: PostgreSQL test database on port 5433
- **Redis**: Redis test instance on port 6380
- **Backend**: Test server on port 3001
- **Frontend**: Test server on port 5174

### Environment Variables

Key environment variables for testing:

```bash
# Test Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=cattle_management_test
DB_USER=postgres
DB_PASSWORD=postgres

# Test Redis
REDIS_HOST=localhost
REDIS_PORT=6380

# Test JWT
JWT_SECRET=test-jwt-secret-key

# Test Timeouts
TEST_TIMEOUT=60000
TEST_RETRIES=3
```

### Playwright Configuration

Browser testing configuration in `playwright.config.ts`:

- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome
- **Parallel Execution**: Disabled for stability
- **Screenshots**: On failure only
- **Video**: Retained on failure
- **Trace**: On first retry

## 🚀 CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/integration-tests.yml` provides:

- **Parallel Test Execution**: Different test types run in parallel
- **Service Dependencies**: Automatic PostgreSQL and Redis setup
- **Artifact Collection**: Test results, coverage, screenshots
- **PR Comments**: Automatic test result reporting
- **Scheduled Runs**: Daily test execution

### Pipeline Features

The automated pipeline (`scripts/run-test-pipeline.js`) includes:

- **Environment Setup**: Automatic service startup
- **Error Recovery**: Retry logic with recovery actions
- **Comprehensive Reporting**: JSON, HTML, and JUnit reports
- **Artifact Collection**: Screenshots, videos, logs
- **Cleanup**: Automatic environment teardown

## 📊 Reporting

### Test Reports

Generated reports include:

- **Pipeline Report**: Overall test execution summary
- **Coverage Report**: Code coverage metrics
- **Performance Report**: Response time and load metrics
- **E2E Report**: Browser test results with screenshots

### Report Formats

- **JSON**: Machine-readable results for CI/CD
- **HTML**: Human-readable dashboard
- **JUnit XML**: Integration with test reporting tools

## 🛠️ Development

### Adding New Tests

1. **Integration Tests**: Add to `src/integration/`
2. **E2E Tests**: Add to `src/e2e/`
3. **Contract Tests**: Add to `src/contract/`
4. **Performance Tests**: Add to `src/performance/`

### Test Utilities

Common utilities in `src/setup.ts`:

```typescript
// Create test user
const testUser = await createTestUser({
  username: 'test_user',
  email: 'test@example.com',
  role: 'admin'
});

// Login and get token
const loginResponse = await loginTestUser({
  username: testUser.data.username,
  password: 'TestPassword123!'
});

// Create test data
const testCattle = await createTestCattle(token, {
  earTag: 'TEST_001',
  breed: 'Test Breed'
});

// Retry with exponential backoff
const result = await retry(operation, 3, 1000);
```

### Debugging Tests

```bash
# Run tests with debug output
DEBUG=* npm test

# Run specific test file
npm test -- --testPathPattern=multi-component

# Run E2E tests in headed mode
npm run test:e2e:headed

# Generate coverage report
npm run test:coverage
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3001, 5174, 5433, 6380 are available
2. **Docker Issues**: Restart Docker service if containers fail to start
3. **Database Connection**: Check PostgreSQL service status
4. **Browser Issues**: Reinstall Playwright browsers: `npx playwright install`

### Logs and Debugging

- **Test Logs**: `test-results/logs/`
- **Screenshots**: `test-results/screenshots/`
- **Videos**: `test-results/videos/`
- **Coverage**: `coverage/`

### Recovery Actions

The pipeline includes automatic recovery for:

- **Environment Setup Failures**: Container restart and port cleanup
- **Integration Test Failures**: Service restart and health checks
- **E2E Test Failures**: Browser cache cleanup and reinstallation

## 📈 Performance Benchmarks

### Expected Performance Metrics

- **API Response Time**: < 1000ms average
- **Concurrent Requests**: 20 requests in < 10 seconds
- **Database Queries**: < 2000ms for complex queries
- **E2E Test Execution**: < 30 seconds per test
- **Memory Usage**: < 100MB increase during test runs

### Performance Monitoring

The test suite monitors:

- **Response Times**: API endpoint performance
- **Memory Usage**: Memory leak detection
- **Database Performance**: Query execution times
- **Concurrent Load**: System behavior under load
- **Error Rates**: Error response performance

## 🤝 Contributing

### Adding New Test Cases

1. Follow existing test patterns and structure
2. Use descriptive test names and comments
3. Include proper error handling and cleanup
4. Add performance assertions where appropriate
5. Update documentation for new test types

### Best Practices

- **Isolation**: Each test should be independent
- **Cleanup**: Always clean up test data
- **Assertions**: Use meaningful assertions with clear error messages
- **Performance**: Include performance expectations
- **Documentation**: Document complex test scenarios

## 📝 License

This testing suite is part of the cattle management system and follows the same license terms.