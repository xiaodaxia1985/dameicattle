#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const PERFORMANCE_THRESHOLDS = {
  averageResponseTime: 1000, // 1 second
  maxResponseTime: 3000, // 3 seconds
  throughput: 10, // requests per second
  errorRate: 5, // 5% error rate
  memoryUsage: 100 * 1024 * 1024, // 100MB
  cpuUsage: 80, // 80% CPU usage
};

const REGRESSION_THRESHOLDS = {
  responseTimeIncrease: 20, // 20% increase
  throughputDecrease: 15, // 15% decrease
  errorRateIncrease: 2, // 2% increase
  memoryIncrease: 25, // 25% increase
};

async function checkPerformanceRegression() {
  console.log('🔍 Checking for performance regressions...');

  try {
    // Load current performance data
    const currentData = await loadPerformanceData('./test-results/performance-metrics.json');
    if (!currentData) {
      console.log('⚠️ No current performance data found');
      return;
    }

    // Load baseline performance data (from main branch or previous runs)
    const baselineData = await loadBaselineData();
    if (!baselineData) {
      console.log('ℹ️ No baseline data found, saving current data as baseline');
      await saveBaseline(currentData);
      return;
    }

    // Perform regression analysis
    const regressions = analyzeRegressions(currentData, baselineData);
    
    // Check against absolute thresholds
    const thresholdViolations = checkThresholds(currentData);

    // Generate report
    const report = generateRegressionReport(regressions, thresholdViolations, currentData, baselineData);
    
    // Save report
    await saveRegressionReport(report);

    // Determine if we should fail the build
    const shouldFail = regressions.length > 0 || thresholdViolations.length > 0;
    
    if (shouldFail) {
      console.error('❌ Performance regression detected!');
      console.error(report.summary);
      process.exit(1);
    } else {
      console.log('✅ No performance regressions detected');
      console.log(report.summary);
    }

  } catch (error) {
    console.error('❌ Failed to check performance regression:', error.message);
    process.exit(1);
  }
}

async function loadPerformanceData(filePath) {
  try {
    const data = await fs.readFile(path.resolve(__dirname, '..', filePath), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`⚠️ Could not load performance data from ${filePath}:`, error.message);
    return null;
  }
}

async function loadBaselineData() {
  // Try to load from multiple sources
  const sources = [
    './baseline/performance-baseline.json',
    './test-results/performance-baseline.json',
    '../../../.github/performance-baseline.json',
  ];

  for (const source of sources) {
    const data = await loadPerformanceData(source);
    if (data) {
      console.log(`📊 Loaded baseline data from ${source}`);
      return data;
    }
  }

  return null;
}

async function saveBaseline(data) {
  const baselineDir = path.resolve(__dirname, '../baseline');
  await fs.mkdir(baselineDir, { recursive: true });
  
  const baselineFile = path.join(baselineDir, 'performance-baseline.json');
  await fs.writeFile(baselineFile, JSON.stringify(data, null, 2));
  
  console.log(`💾 Saved baseline data to ${baselineFile}`);
}

function analyzeRegressions(current, baseline) {
  const regressions = [];

  // Check response time regression
  if (current.averageResponseTime && baseline.averageResponseTime) {
    const increase = ((current.averageResponseTime - baseline.averageResponseTime) / baseline.averageResponseTime) * 100;
    if (increase > REGRESSION_THRESHOLDS.responseTimeIncrease) {
      regressions.push({
        metric: 'Average Response Time',
        current: current.averageResponseTime,
        baseline: baseline.averageResponseTime,
        change: increase,
        threshold: REGRESSION_THRESHOLDS.responseTimeIncrease,
        severity: increase > 50 ? 'critical' : 'warning',
      });
    }
  }

  // Check throughput regression
  if (current.throughput && baseline.throughput) {
    const decrease = ((baseline.throughput - current.throughput) / baseline.throughput) * 100;
    if (decrease > REGRESSION_THRESHOLDS.throughputDecrease) {
      regressions.push({
        metric: 'Throughput',
        current: current.throughput,
        baseline: baseline.throughput,
        change: -decrease,
        threshold: REGRESSION_THRESHOLDS.throughputDecrease,
        severity: decrease > 30 ? 'critical' : 'warning',
      });
    }
  }

  // Check error rate regression
  if (current.errorRate !== undefined && baseline.errorRate !== undefined) {
    const increase = current.errorRate - baseline.errorRate;
    if (increase > REGRESSION_THRESHOLDS.errorRateIncrease) {
      regressions.push({
        metric: 'Error Rate',
        current: current.errorRate,
        baseline: baseline.errorRate,
        change: increase,
        threshold: REGRESSION_THRESHOLDS.errorRateIncrease,
        severity: increase > 5 ? 'critical' : 'warning',
      });
    }
  }

  // Check memory usage regression
  if (current.memoryUsage && baseline.memoryUsage) {
    const increase = ((current.memoryUsage - baseline.memoryUsage) / baseline.memoryUsage) * 100;
    if (increase > REGRESSION_THRESHOLDS.memoryIncrease) {
      regressions.push({
        metric: 'Memory Usage',
        current: formatBytes(current.memoryUsage),
        baseline: formatBytes(baseline.memoryUsage),
        change: increase,
        threshold: REGRESSION_THRESHOLDS.memoryIncrease,
        severity: increase > 50 ? 'critical' : 'warning',
      });
    }
  }

  return regressions;
}

function checkThresholds(current) {
  const violations = [];

  // Check response time threshold
  if (current.averageResponseTime > PERFORMANCE_THRESHOLDS.averageResponseTime) {
    violations.push({
      metric: 'Average Response Time',
      current: current.averageResponseTime,
      threshold: PERFORMANCE_THRESHOLDS.averageResponseTime,
      severity: current.averageResponseTime > PERFORMANCE_THRESHOLDS.maxResponseTime ? 'critical' : 'warning',
    });
  }

  // Check throughput threshold
  if (current.throughput < PERFORMANCE_THRESHOLDS.throughput) {
    violations.push({
      metric: 'Throughput',
      current: current.throughput,
      threshold: PERFORMANCE_THRESHOLDS.throughput,
      severity: current.throughput < PERFORMANCE_THRESHOLDS.throughput / 2 ? 'critical' : 'warning',
    });
  }

  // Check error rate threshold
  if (current.errorRate > PERFORMANCE_THRESHOLDS.errorRate) {
    violations.push({
      metric: 'Error Rate',
      current: current.errorRate,
      threshold: PERFORMANCE_THRESHOLDS.errorRate,
      severity: current.errorRate > PERFORMANCE_THRESHOLDS.errorRate * 2 ? 'critical' : 'warning',
    });
  }

  // Check memory usage threshold
  if (current.memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage) {
    violations.push({
      metric: 'Memory Usage',
      current: formatBytes(current.memoryUsage),
      threshold: formatBytes(PERFORMANCE_THRESHOLDS.memoryUsage),
      severity: current.memoryUsage > PERFORMANCE_THRESHOLDS.memoryUsage * 1.5 ? 'critical' : 'warning',
    });
  }

  return violations;
}

function generateRegressionReport(regressions, thresholdViolations, current, baseline) {
  const report = {
    timestamp: new Date().toISOString(),
    status: regressions.length === 0 && thresholdViolations.length === 0 ? 'passed' : 'failed',
    regressions,
    thresholdViolations,
    current,
    baseline,
    summary: '',
  };

  // Generate summary
  let summary = '## 📈 Performance Regression Report\\n\\n';
  
  if (report.status === 'passed') {
    summary += '✅ **Status: PASSED** - No performance regressions detected\\n\\n';
  } else {
    summary += '❌ **Status: FAILED** - Performance regressions detected\\n\\n';
  }

  // Add regression details
  if (regressions.length > 0) {
    summary += '### 📉 Performance Regressions\\n\\n';
    regressions.forEach(regression => {
      const icon = regression.severity === 'critical' ? '🚨' : '⚠️';
      summary += `${icon} **${regression.metric}**\\n`;
      summary += `- Current: ${regression.current}\\n`;
      summary += `- Baseline: ${regression.baseline}\\n`;
      summary += `- Change: ${regression.change > 0 ? '+' : ''}${regression.change.toFixed(2)}%\\n`;
      summary += `- Threshold: ${regression.threshold}%\\n\\n`;
    });
  }

  // Add threshold violations
  if (thresholdViolations.length > 0) {
    summary += '### 🚫 Threshold Violations\\n\\n';
    thresholdViolations.forEach(violation => {
      const icon = violation.severity === 'critical' ? '🚨' : '⚠️';
      summary += `${icon} **${violation.metric}**\\n`;
      summary += `- Current: ${violation.current}\\n`;
      summary += `- Threshold: ${violation.threshold}\\n\\n`;
    });
  }

  // Add current metrics
  summary += '### 📊 Current Performance Metrics\\n\\n';
  summary += `- **Average Response Time:** ${current.averageResponseTime || 'N/A'}ms\\n`;
  summary += `- **Max Response Time:** ${current.maxResponseTime || 'N/A'}ms\\n`;
  summary += `- **Throughput:** ${current.throughput || 'N/A'} req/s\\n`;
  summary += `- **Error Rate:** ${current.errorRate || 'N/A'}%\\n`;
  summary += `- **Memory Usage:** ${current.memoryUsage ? formatBytes(current.memoryUsage) : 'N/A'}\\n`;
  summary += `- **CPU Usage:** ${current.cpuUsage || 'N/A'}%\\n\\n`;

  // Add recommendations
  if (report.status === 'failed') {
    summary += '### 💡 Recommendations\\n\\n';
    
    if (regressions.some(r => r.metric === 'Average Response Time')) {
      summary += '- Review recent changes that might affect response time\\n';
      summary += '- Check database query performance\\n';
      summary += '- Verify caching mechanisms are working correctly\\n';
    }
    
    if (regressions.some(r => r.metric === 'Throughput')) {
      summary += '- Investigate bottlenecks in request processing\\n';
      summary += '- Review connection pooling configuration\\n';
      summary += '- Check for resource contention\\n';
    }
    
    if (regressions.some(r => r.metric === 'Memory Usage')) {
      summary += '- Look for memory leaks in recent changes\\n';
      summary += '- Review object lifecycle management\\n';
      summary += '- Check garbage collection performance\\n';
    }
    
    summary += '\\n';
  }

  summary += '---\\n*Generated by performance regression checker*';
  
  report.summary = summary;
  return report;
}

async function saveRegressionReport(report) {
  const reportDir = path.resolve(__dirname, '../test-results');
  await fs.mkdir(reportDir, { recursive: true });
  
  // Save JSON report
  const jsonFile = path.join(reportDir, 'performance-regression-report.json');
  await fs.writeFile(jsonFile, JSON.stringify(report, null, 2));
  
  // Save markdown summary
  const mdFile = path.join(reportDir, 'performance-regression-summary.md');
  await fs.writeFile(mdFile, report.summary);
  
  console.log(`📄 Regression report saved to ${jsonFile}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

if (require.main === module) {
  checkPerformanceRegression();
}

module.exports = { checkPerformanceRegression };