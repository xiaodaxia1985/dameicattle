#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const PIPELINE_CONFIG = {
  stages: [
    {
      name: 'Environment Setup',
      command: 'node scripts/setup-test-environment.js',
      timeout: 300000, // 5 minutes
      critical: true,
    },
    {
      name: 'Integration Tests',
      command: 'npm run test:coverage',
      timeout: 600000, // 10 minutes
      critical: true,
      retries: 2,
    },
    {
      name: 'Contract Tests',
      command: 'npm run test:contract',
      timeout: 300000, // 5 minutes
      critical: true,
      retries: 1,
    },
    {
      name: 'Performance Tests',
      command: 'npm run test:performance',
      timeout: 600000, // 10 minutes
      critical: false,
      retries: 1,
    },
    {
      name: 'End-to-End Tests',
      command: 'npm run test:e2e',
      timeout: 900000, // 15 minutes
      critical: true,
      retries: 2,
    },
  ],
  reporting: {
    outputDir: './test-results',
    formats: ['json', 'html', 'junit'],
  },
  recovery: {
    maxRetries: 3,
    retryDelay: 5000,
    cleanupOnFailure: true,
  },
};

class TestPipeline {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      stages: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
      },
      coverage: null,
      artifacts: [],
    };
  }

  async run() {
    console.log('🚀 Starting automated test pipeline...');
    console.log(`📅 Started at: ${this.results.startTime.toISOString()}`);

    try {
      // Create output directory
      await this.createOutputDirectory();

      // Run each stage
      for (const stage of PIPELINE_CONFIG.stages) {
        await this.runStage(stage);
      }

      // Generate final report
      await this.generateFinalReport();

      console.log('✅ Test pipeline completed successfully!');
      return this.results;

    } catch (error) {
      console.error('❌ Test pipeline failed:', error.message);
      
      if (PIPELINE_CONFIG.recovery.cleanupOnFailure) {
        await this.cleanup();
      }

      await this.generateFailureReport(error);
      throw error;
    } finally {
      this.results.endTime = new Date();
      await this.cleanup();
    }
  }

  async createOutputDirectory() {
    const outputDir = path.resolve(__dirname, '..', PIPELINE_CONFIG.reporting.outputDir);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Create subdirectories
    const subdirs = ['coverage', 'screenshots', 'videos', 'logs'];
    for (const subdir of subdirs) {
      await fs.mkdir(path.join(outputDir, subdir), { recursive: true });
    }
  }

  async runStage(stage) {
    console.log(`\\n🔄 Running stage: ${stage.name}`);
    
    const stageResult = {
      name: stage.name,
      startTime: new Date(),
      endTime: null,
      status: 'running',
      attempts: 0,
      maxAttempts: (stage.retries || 0) + 1,
      output: '',
      error: null,
      artifacts: [],
    };

    this.results.stages.push(stageResult);

    let lastError = null;
    
    for (let attempt = 1; attempt <= stageResult.maxAttempts; attempt++) {
      stageResult.attempts = attempt;
      
      if (attempt > 1) {
        console.log(`  🔄 Retry attempt ${attempt}/${stageResult.maxAttempts}`);
        await this.delay(PIPELINE_CONFIG.recovery.retryDelay);
      }

      try {
        const result = await this.executeStageCommand(stage, stageResult);
        
        stageResult.status = 'passed';
        stageResult.output = result.output;
        stageResult.endTime = new Date();
        
        console.log(`  ✅ ${stage.name} completed successfully`);
        this.results.summary.passed++;
        return;

      } catch (error) {
        lastError = error;
        stageResult.error = error.message;
        
        console.log(`  ❌ ${stage.name} failed (attempt ${attempt}/${stageResult.maxAttempts})`);
        console.log(`     Error: ${error.message}`);

        if (attempt < stageResult.maxAttempts) {
          // Try recovery actions before retry
          await this.attemptRecovery(stage, error);
        }
      }
    }

    // All attempts failed
    stageResult.status = 'failed';
    stageResult.endTime = new Date();
    this.results.summary.failed++;

    if (stage.critical) {
      throw new Error(`Critical stage '${stage.name}' failed after ${stageResult.maxAttempts} attempts: ${lastError.message}`);
    } else {
      console.log(`  ⚠️ Non-critical stage '${stage.name}' failed, continuing pipeline`);
      this.results.summary.skipped++;
    }
  }

  async executeStageCommand(stage, stageResult) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let output = '';
      let errorOutput = '';

      const child = spawn('npm', ['run', stage.command.split(' ').slice(1).join(' ')], {
        cwd: path.resolve(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      // Capture output
      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        output += chunk;
        process.stdout.write(chunk);
      });

      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        errorOutput += chunk;
        process.stderr.write(chunk);
      });

      // Handle timeout
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Stage '${stage.name}' timed out after ${stage.timeout}ms`));
      }, stage.timeout);

      child.on('close', (code) => {
        clearTimeout(timeout);
        
        const duration = Date.now() - startTime;
        console.log(`    Duration: ${duration}ms`);

        if (code === 0) {
          resolve({ output, duration });
        } else {
          reject(new Error(`Command failed with exit code ${code}\\n${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async attemptRecovery(stage, error) {
    console.log(`  🔧 Attempting recovery for ${stage.name}...`);

    try {
      // Stage-specific recovery actions
      switch (stage.name) {
        case 'Environment Setup':
          await this.recoverEnvironmentSetup();
          break;
        case 'Integration Tests':
          await this.recoverIntegrationTests();
          break;
        case 'End-to-End Tests':
          await this.recoverE2ETests();
          break;
        default:
          await this.genericRecovery();
      }

      console.log(`  ✅ Recovery completed for ${stage.name}`);
    } catch (recoveryError) {
      console.log(`  ⚠️ Recovery failed for ${stage.name}: ${recoveryError.message}`);
    }
  }

  async recoverEnvironmentSetup() {
    // Clean up any existing containers and processes
    await execAsync('node scripts/teardown-test-environment.js').catch(() => {});
    await this.delay(5000);
    
    // Kill any processes using test ports
    const ports = [3001, 5174, 5433, 6380];
    for (const port of ports) {
      try {
        await execAsync(`lsof -ti:${port} | xargs kill -9`).catch(() => {});
      } catch (error) {
        // Ignore errors
      }
    }
  }

  async recoverIntegrationTests() {
    // Restart backend and frontend services
    try {
      await execAsync('curl -f http://localhost:3001/api/health', { timeout: 5000 });
    } catch (error) {
      console.log('    Restarting backend service...');
      // Backend restart logic would go here
    }

    try {
      await execAsync('curl -f http://localhost:5174', { timeout: 5000 });
    } catch (error) {
      console.log('    Restarting frontend service...');
      // Frontend restart logic would go here
    }
  }

  async recoverE2ETests() {
    // Clear browser cache and restart browsers
    const browserDirs = [
      path.join(process.env.HOME || process.env.USERPROFILE, '.cache/ms-playwright'),
      './test-results',
    ];

    for (const dir of browserDirs) {
      try {
        await fs.rmdir(dir, { recursive: true });
      } catch (error) {
        // Ignore errors
      }
    }

    // Reinstall browsers
    try {
      await execAsync('npx playwright install');
    } catch (error) {
      console.log('    Failed to reinstall browsers:', error.message);
    }
  }

  async genericRecovery() {
    // Generic recovery actions
    await this.delay(2000);
    
    // Clear temporary files
    const tempDirs = ['./temp', './tmp', './.tmp'];
    for (const dir of tempDirs) {
      try {
        await fs.rmdir(path.resolve(__dirname, '..', dir), { recursive: true });
      } catch (error) {
        // Ignore errors
      }
    }
  }

  async generateFinalReport() {
    console.log('\\n📊 Generating test reports...');

    const report = {
      pipeline: {
        startTime: this.results.startTime,
        endTime: this.results.endTime,
        duration: this.results.endTime - this.results.startTime,
        status: this.results.summary.failed === 0 ? 'passed' : 'failed',
      },
      summary: this.results.summary,
      stages: this.results.stages,
      coverage: await this.collectCoverageData(),
      artifacts: await this.collectArtifacts(),
    };

    // Generate JSON report
    const jsonReport = JSON.stringify(report, null, 2);
    await fs.writeFile(
      path.resolve(__dirname, '..', PIPELINE_CONFIG.reporting.outputDir, 'pipeline-report.json'),
      jsonReport
    );

    // Generate HTML report
    const htmlReport = this.generateHtmlReport(report);
    await fs.writeFile(
      path.resolve(__dirname, '..', PIPELINE_CONFIG.reporting.outputDir, 'pipeline-report.html'),
      htmlReport
    );

    // Generate JUnit XML report
    const junitReport = this.generateJunitReport(report);
    await fs.writeFile(
      path.resolve(__dirname, '..', PIPELINE_CONFIG.reporting.outputDir, 'pipeline-report.xml'),
      junitReport
    );

    console.log('✅ Test reports generated');
  }

  async generateFailureReport(error) {
    const failureReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      stages: this.results.stages,
      summary: this.results.summary,
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    await fs.writeFile(
      path.resolve(__dirname, '..', PIPELINE_CONFIG.reporting.outputDir, 'failure-report.json'),
      JSON.stringify(failureReport, null, 2)
    );
  }

  async collectCoverageData() {
    try {
      const coverageFile = path.resolve(__dirname, '..', 'coverage', 'coverage-summary.json');
      const coverageData = await fs.readFile(coverageFile, 'utf8');
      return JSON.parse(coverageData);
    } catch (error) {
      return null;
    }
  }

  async collectArtifacts() {
    const artifacts = [];
    const artifactDirs = [
      'test-results',
      'coverage',
      'playwright-report',
    ];

    for (const dir of artifactDirs) {
      try {
        const dirPath = path.resolve(__dirname, '..', dir);
        const files = await fs.readdir(dirPath, { recursive: true });
        
        for (const file of files) {
          artifacts.push({
            type: dir,
            name: file,
            path: path.join(dir, file),
            size: (await fs.stat(path.join(dirPath, file))).size,
          });
        }
      } catch (error) {
        // Directory doesn't exist
      }
    }

    return artifacts;
  }

  generateHtmlReport(report) {
    const statusColor = report.pipeline.status === 'passed' ? '#28a745' : '#dc3545';
    const duration = Math.round(report.pipeline.duration / 1000);

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Pipeline Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .stage { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { border-left: 5px solid #28a745; }
        .failed { border-left: 5px solid #dc3545; }
        .skipped { border-left: 5px solid #ffc107; }
        .coverage { margin: 20px 0; }
        .coverage-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; }
        .coverage-fill { background: #28a745; height: 100%; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Pipeline Report</h1>
        <p>Status: ${report.pipeline.status.toUpperCase()} | Duration: ${duration}s</p>
        <p>Completed: ${report.pipeline.endTime}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>${report.summary.total}</h3>
            <p>Total Stages</p>
        </div>
        <div class="metric">
            <h3>${report.summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric">
            <h3>${report.summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${report.summary.skipped}</h3>
            <p>Skipped</p>
        </div>
    </div>

    <h2>Stages</h2>
    ${report.stages.map(stage => `
        <div class="stage ${stage.status}">
            <h3>${stage.name}</h3>
            <p>Status: ${stage.status} | Attempts: ${stage.attempts}/${stage.maxAttempts}</p>
            <p>Duration: ${stage.endTime ? Math.round((new Date(stage.endTime) - new Date(stage.startTime)) / 1000) : 'N/A'}s</p>
            ${stage.error ? `<p style="color: #dc3545;">Error: ${stage.error}</p>` : ''}
        </div>
    `).join('')}

    ${report.coverage ? `
        <div class="coverage">
            <h2>Code Coverage</h2>
            <p>Lines: ${report.coverage.total.lines.pct}%</p>
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${report.coverage.total.lines.pct}%"></div>
            </div>
        </div>
    ` : ''}

    <h2>Artifacts</h2>
    <ul>
        ${report.artifacts.map(artifact => `
            <li>${artifact.name} (${artifact.type}) - ${Math.round(artifact.size / 1024)}KB</li>
        `).join('')}
    </ul>
</body>
</html>`;
  }

  generateJunitReport(report) {
    const testsuites = report.stages.map(stage => {
      const duration = stage.endTime ? 
        (new Date(stage.endTime) - new Date(stage.startTime)) / 1000 : 0;

      return `
        <testsuite name="${stage.name}" tests="1" failures="${stage.status === 'failed' ? 1 : 0}" time="${duration}">
            <testcase name="${stage.name}" time="${duration}">
                ${stage.status === 'failed' ? `<failure message="${stage.error}">${stage.error}</failure>` : ''}
            </testcase>
        </testsuite>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
    ${testsuites}
</testsuites>`;
  }

  async cleanup() {
    try {
      await execAsync('node scripts/teardown-test-environment.js');
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

async function main() {
  const pipeline = new TestPipeline();
  
  try {
    const results = await pipeline.run();
    
    console.log(`\\n📊 Pipeline Summary:
      Total Stages: ${results.summary.total}
      Passed: ${results.summary.passed}
      Failed: ${results.summary.failed}
      Skipped: ${results.summary.skipped}
      Duration: ${Math.round((results.endTime - results.startTime) / 1000)}s
    `);

    if (results.summary.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\\n❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { TestPipeline };