#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

async function main() {
  console.log('🧹 Tearing down integration test environment...');

  try {
    // 1. Stop application processes
    await stopApplicationProcesses();

    // 2. Stop Docker containers
    await stopDockerContainers();

    // 3. Clean up test files
    await cleanupTestFiles();

    console.log('✅ Integration test environment teardown complete!');
  } catch (error) {
    console.error('❌ Error during teardown:', error.message);
    process.exit(1);
  }
}

async function stopApplicationProcesses() {
  console.log('🛑 Stopping application processes...');

  try {
    const processFile = path.resolve(__dirname, '../.test-processes');
    const processData = await fs.readFile(processFile, 'utf8');
    const processes = JSON.parse(processData);

    if (processes.backend) {
      console.log('  Stopping backend process...');
      try {
        process.kill(processes.backend, 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));
        process.kill(processes.backend, 'SIGKILL');
      } catch (error) {
        // Process might already be dead
      }
    }

    if (processes.frontend) {
      console.log('  Stopping frontend process...');
      try {
        process.kill(processes.frontend, 'SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));
        process.kill(processes.frontend, 'SIGKILL');
      } catch (error) {
        // Process might already be dead
      }
    }

    await fs.unlink(processFile);
    console.log('  ✅ Application processes stopped');
  } catch (error) {
    console.log('  ⚠️ No running processes found or already stopped');
  }
}

async function stopDockerContainers() {
  console.log('🐳 Stopping Docker containers...');

  const containers = [
    'cattle-test-postgres',
    'cattle-test-redis',
  ];

  for (const container of containers) {
    try {
      console.log(`  Stopping ${container}...`);
      await execAsync(`docker stop ${container}`);
      await execAsync(`docker rm ${container}`);
      console.log(`  ✅ ${container} stopped and removed`);
    } catch (error) {
      console.log(`  ⚠️ ${container} not found or already stopped`);
    }
  }

  // Clean up any orphaned containers
  try {
    const { stdout } = await execAsync('docker ps -a --filter "name=cattle-test" --format "{{.Names}}"');
    const orphanedContainers = stdout.trim().split('\\n').filter(name => name);
    
    for (const container of orphanedContainers) {
      if (container) {
        console.log(`  Cleaning up orphaned container: ${container}`);
        await execAsync(`docker stop ${container} || true`);
        await execAsync(`docker rm ${container} || true`);
      }
    }
  } catch (error) {
    // Ignore errors when cleaning up orphaned containers
  }
}

async function cleanupTestFiles() {
  console.log('📁 Cleaning up test files...');

  const filesToClean = [
    '../.env.test',
    '../.test-processes',
    '../../backend/.env.test',
    '../../frontend/.env.test',
    '../test-results',
    '../coverage',
    '../playwright-report',
  ];

  for (const file of filesToClean) {
    try {
      const filePath = path.resolve(__dirname, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
        console.log(`  ✅ Removed directory: ${file}`);
      } else {
        await fs.unlink(filePath);
        console.log(`  ✅ Removed file: ${file}`);
      }
    } catch (error) {
      // File doesn't exist or already cleaned up
    }
  }

  // Clean up backend test artifacts
  try {
    const backendDir = path.resolve(__dirname, '../../backend');
    const backendTestFiles = [
      'coverage',
      'test-results',
      '.nyc_output',
    ];

    for (const file of backendTestFiles) {
      try {
        await fs.rmdir(path.join(backendDir, file), { recursive: true });
        console.log(`  ✅ Removed backend test artifact: ${file}`);
      } catch (error) {
        // File doesn't exist
      }
    }
  } catch (error) {
    // Ignore errors
  }

  // Clean up frontend test artifacts
  try {
    const frontendDir = path.resolve(__dirname, '../../frontend');
    const frontendTestFiles = [
      'coverage',
      'test-results',
      'dist',
    ];

    for (const file of frontendTestFiles) {
      try {
        await fs.rmdir(path.join(frontendDir, file), { recursive: true });
        console.log(`  ✅ Removed frontend test artifact: ${file}`);
      } catch (error) {
        // File doesn't exist
      }
    }
  } catch (error) {
    // Ignore errors
  }

  console.log('  ✅ Test files cleaned up');
}

// Force cleanup on various exit signals
process.on('SIGINT', main);
process.on('SIGTERM', main);
process.on('exit', main);

if (require.main === module) {
  main();
}

module.exports = { main };