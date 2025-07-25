#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function generateTestReport(artifactsDir) {
  console.log('📊 Generating comprehensive test report...');

  try {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
      },
      testTypes: {},
      coverage: null,
      performance: null,
      artifacts: [],
    };

    // Process each test type
    const testTypes = ['integration', 'contract', 'performance', 'e2e'];
    
    for (const testType of testTypes) {
      const testResults = await processTestType(artifactsDir, testType);
      if (testResults) {
        report.testTypes[testType] = testResults;
        report.summary.total += testResults.total;
        report.summary.passed += testResults.passed;
        report.summary.failed += testResults.failed;
        report.summary.skipped += testResults.skipped;
      }
    }

    // Process coverage data
    report.coverage = await processCoverageData(artifactsDir);

    // Process performance data
    report.performance = await processPerformanceData(artifactsDir);

    // Collect artifacts
    report.artifacts = await collectArtifacts(artifactsDir);

    // Generate reports
    await generateHtmlReport(report);
    await generateJsonReport(report);
    await generatePrComment(report);

    console.log('✅ Test report generation completed');
    return report;

  } catch (error) {
    console.error('❌ Failed to generate test report:', error.message);
    throw error;
  }
}

async function processTestType(artifactsDir, testType) {
  try {
    const testDir = path.join(artifactsDir, `${testType}-test-results`);
    const resultsFile = path.join(testDir, 'results.json');

    if (!(await fileExists(resultsFile))) {
      console.log(`⚠️ No results found for ${testType} tests`);
      return null;
    }

    const resultsData = await fs.readFile(resultsFile, 'utf8');
    const results = JSON.parse(resultsData);

    return {
      total: results.numTotalTests || 0,
      passed: results.numPassedTests || 0,
      failed: results.numFailedTests || 0,
      skipped: results.numPendingTests || 0,
      duration: results.testResults?.reduce((sum, test) => sum + (test.perfStats?.runtime || 0), 0) || 0,
      testResults: results.testResults || [],
    };
  } catch (error) {
    console.warn(`⚠️ Failed to process ${testType} results:`, error.message);
    return null;
  }
}

async function processCoverageData(artifactsDir) {
  try {
    const coverageFile = path.join(artifactsDir, 'integration-test-results', 'coverage', 'coverage-summary.json');
    
    if (!(await fileExists(coverageFile))) {
      return null;
    }

    const coverageData = await fs.readFile(coverageFile, 'utf8');
    return JSON.parse(coverageData);
  } catch (error) {
    console.warn('⚠️ Failed to process coverage data:', error.message);
    return null;
  }
}

async function processPerformanceData(artifactsDir) {
  try {
    const performanceFile = path.join(artifactsDir, 'performance-test-results', 'performance-metrics.json');
    
    if (!(await fileExists(performanceFile))) {
      return null;
    }

    const performanceData = await fs.readFile(performanceFile, 'utf8');
    return JSON.parse(performanceData);
  } catch (error) {
    console.warn('⚠️ Failed to process performance data:', error.message);
    return null;
  }
}

async function collectArtifacts(artifactsDir) {
  const artifacts = [];
  
  try {
    const entries = await fs.readdir(artifactsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(artifactsDir, entry.name);
        const files = await fs.readdir(dirPath, { recursive: true });
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          try {
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
              artifacts.push({
                name: file,
                type: entry.name,
                size: stats.size,
                path: filePath,
              });
            }
          } catch (error) {
            // Skip files that can't be accessed
          }
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to collect artifacts:', error.message);
  }

  return artifacts;
}

async function generateHtmlReport(report) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .metric {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .total { color: #007bff; }
        .section {
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .test-type {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .test-type h3 {
            margin-top: 0;
            color: #495057;
        }
        .test-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
        }
        .test-stat {
            padding: 10px 15px;
            background: white;
            border-radius: 4px;
            font-weight: bold;
        }
        .coverage-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }
        .coverage-item {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .coverage-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 10px;
        }
        .coverage-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            transition: width 0.3s ease;
        }
        .artifacts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .artifact-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .artifact-type {
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .artifact-size {
            color: #666;
            font-size: 0.9em;
        }
        .performance-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .performance-item {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        .performance-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #667eea;
        }
        .performance-label {
            color: #666;
            margin-top: 5px;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-success {
            background: #d4edda;
            color: #155724;
        }
        .status-failure {
            background: #f8d7da;
            color: #721c24;
        }
        .status-warning {
            background: #fff3cd;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Comprehensive Test Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
            <div class="status-badge ${getOverallStatus(report)}">
                ${getOverallStatusText(report)}
            </div>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value total">${report.summary.total}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${report.summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${report.summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value skipped">${report.summary.skipped}</div>
                <div class="metric-label">Skipped</div>
            </div>
        </div>

        <div class="section">
            <h2>📋 Test Results by Type</h2>
            ${Object.entries(report.testTypes).map(([type, results]) => `
                <div class="test-type">
                    <h3>${type.charAt(0).toUpperCase() + type.slice(1)} Tests</h3>
                    <div class="test-stats">
                        <div class="test-stat passed">✅ ${results.passed} Passed</div>
                        <div class="test-stat failed">❌ ${results.failed} Failed</div>
                        <div class="test-stat skipped">⏭️ ${results.skipped} Skipped</div>
                        <div class="test-stat">⏱️ ${Math.round(results.duration / 1000)}s</div>
                    </div>
                </div>
            `).join('')}
        </div>

        ${report.coverage ? `
        <div class="section">
            <h2>📊 Code Coverage</h2>
            <div class="coverage-section">
                ${Object.entries(report.coverage.total || {}).map(([type, data]) => `
                    <div class="coverage-item">
                        <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                        <div>${data.pct}% (${data.covered}/${data.total})</div>
                        <div class="coverage-bar">
                            <div class="coverage-fill" style="width: ${data.pct}%"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${report.performance ? `
        <div class="section">
            <h2>⚡ Performance Metrics</h2>
            <div class="performance-metrics">
                <div class="performance-item">
                    <div class="performance-value">${report.performance.averageResponseTime || 'N/A'}ms</div>
                    <div class="performance-label">Average Response Time</div>
                </div>
                <div class="performance-item">
                    <div class="performance-value">${report.performance.throughput || 'N/A'}</div>
                    <div class="performance-label">Requests/Second</div>
                </div>
                <div class="performance-item">
                    <div class="performance-value">${report.performance.errorRate || 'N/A'}%</div>
                    <div class="performance-label">Error Rate</div>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="section">
            <h2>📁 Test Artifacts</h2>
            <div class="artifacts-grid">
                ${report.artifacts.map(artifact => `
                    <div class="artifact-item">
                        <div class="artifact-type">${artifact.type}</div>
                        <div>${artifact.name}</div>
                        <div class="artifact-size">${formatFileSize(artifact.size)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;

  await fs.writeFile(
    path.resolve(__dirname, '../test-results/comprehensive-report.html'),
    html
  );
}

async function generateJsonReport(report) {
  await fs.writeFile(
    path.resolve(__dirname, '../test-results/comprehensive-report.json'),
    JSON.stringify(report, null, 2)
  );
}

async function generatePrComment(report) {
  const successRate = report.summary.total > 0 
    ? Math.round((report.summary.passed / report.summary.total) * 100)
    : 0;

  const status = report.summary.failed === 0 ? '✅' : '❌';
  const statusText = report.summary.failed === 0 ? 'PASSED' : 'FAILED';

  const comment = `## ${status} Test Results - ${statusText}

### 📊 Summary
- **Total Tests:** ${report.summary.total}
- **Passed:** ${report.summary.passed} ✅
- **Failed:** ${report.summary.failed} ❌
- **Skipped:** ${report.summary.skipped} ⏭️
- **Success Rate:** ${successRate}%

### 📋 Test Types
${Object.entries(report.testTypes).map(([type, results]) => `
**${type.charAt(0).toUpperCase() + type.slice(1)} Tests**
- Passed: ${results.passed}
- Failed: ${results.failed}
- Duration: ${Math.round(results.duration / 1000)}s
`).join('')}

${report.coverage ? `
### 📊 Code Coverage
- **Lines:** ${report.coverage.total?.lines?.pct || 'N/A'}%
- **Functions:** ${report.coverage.total?.functions?.pct || 'N/A'}%
- **Branches:** ${report.coverage.total?.branches?.pct || 'N/A'}%
- **Statements:** ${report.coverage.total?.statements?.pct || 'N/A'}%
` : ''}

${report.performance ? `
### ⚡ Performance
- **Average Response Time:** ${report.performance.averageResponseTime || 'N/A'}ms
- **Throughput:** ${report.performance.throughput || 'N/A'} req/s
- **Error Rate:** ${report.performance.errorRate || 'N/A'}%
` : ''}

---
*Generated by automated testing pipeline*`;

  await fs.writeFile(
    path.resolve(__dirname, '../test-results/pr-comment.md'),
    comment
  );
}

function getOverallStatus(report) {
  if (report.summary.failed > 0) return 'status-failure';
  if (report.summary.skipped > 0) return 'status-warning';
  return 'status-success';
}

function getOverallStatusText(report) {
  if (report.summary.failed > 0) return 'FAILED';
  if (report.summary.skipped > 0) return 'PARTIAL';
  return 'PASSED';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const artifactsDir = process.argv[2] || './test-artifacts';
  
  // Ensure output directory exists
  await fs.mkdir(path.resolve(__dirname, '../test-results'), { recursive: true });
  
  await generateTestReport(artifactsDir);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Failed to generate test report:', error);
    process.exit(1);
  });
}

module.exports = { generateTestReport };