#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all integration tests with proper setup and validation
 */

const { spawn } = require('child_process');
const path = require('path');

class ComprehensiveTestRunner {
  constructor() {
    this.testResults = [];
  }

  async run() {
    console.log('🚀 Running Comprehensive Integration Tests\n');
    
    try {
      await this.setupEnvironment();
      await this.runTestSuites();
      this.showResults();
    } catch (error) {
      console.error('❌ Test run failed:', error.message);
      process.exit(1);
    }
  }

  async setupEnvironment() {
    console.log('⚙️ Setting up test environment...\n');
    
    // Step 1: Ensure admin user exists with proper permissions
    console.log('1. Creating admin user with proper permissions...');
    await this.runScript('cd ../../../backend && node create-admin-user.js');
    
    // Step 2: Fix any permission issues
    console.log('2. Fixing permission issues...');
    await this.runScript('node scripts/fix-permissions.js');
    
    // Step 3: Validate environment
    console.log('3. Validating test environment...');
    await this.runScript('node scripts/validate-test-environment.js');
    
    console.log('✅ Environment setup complete\n');
  }

  async runTestSuites() {
    console.log('🧪 Running test suites...\n');
    
    const testSuites = [
      {
        name: 'API Data Contract Validation',
        command: 'npx playwright test src/contract/api-data-validation.test.ts --reporter=line'
      },
      {
        name: 'Frontend-Backend Integration',
        command: 'npx playwright test src/integration/frontend-backend-integration.test.ts --reporter=line'
      },
      {
        name: 'Real-World E2E Scenarios',
        command: 'npx playwright test src/e2e/real-world-scenarios.test.ts --reporter=line'
      },
      {
        name: 'Critical Workflows',
        command: 'npx playwright test src/e2e/critical-workflows.test.ts --reporter=line'
      },
      {
        name: 'Performance Tests',
        command: 'npx playwright test src/performance/real-world-performance.test.ts --reporter=line'
      }
    ];

    for (const suite of testSuites) {
      console.log(`\n📋 Running: ${suite.name}`);
      console.log('─'.repeat(50));
      
      try {
        await this.runScript(suite.command);
        this.testResults.push({ name: suite.name, status: 'PASSED' });
        console.log(`✅ ${suite.name}: PASSED`);
      } catch (error) {
        this.testResults.push({ name: suite.name, status: 'FAILED', error: error.message });
        console.log(`❌ ${suite.name}: FAILED`);
        console.log(`   Error: ${error.message}`);
      }
    }
  }

  async runScript(command) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      
      const process = spawn(cmd, args, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit',
        shell: true
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  showResults() {
    console.log('\n📊 Test Results Summary');
    console.log('═'.repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`Total Test Suites: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Test Suites:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.name}`);
          if (result.error) {
            console.log(`      Error: ${result.error}`);
          }
        });
      
      console.log('\n💡 Troubleshooting Tips:');
      console.log('• Ensure backend and frontend are running');
      console.log('• Check admin user has proper permissions');
      console.log('• Verify database contains test data');
      console.log('• Run diagnostic: node scripts/diagnose-backend-connection.js');
    } else {
      console.log('\n🎉 All tests passed! Your integration is working correctly.');
    }
    
    console.log('\n📄 For detailed test reports, check:');
    console.log('• Playwright HTML report: npx playwright show-report');
    console.log('• Test artifacts in test-results/ directory');
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;