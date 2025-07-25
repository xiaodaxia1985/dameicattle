#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

const CONFIG = {
  services: [
    {
      name: 'PostgreSQL',
      command: 'docker run -d --name cattle-test-postgres -e POSTGRES_DB=cattle_management_test -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5433:5432 postgres:13',
      healthCheck: 'docker exec cattle-test-postgres pg_isready -U postgres',
      port: 5433,
    },
    {
      name: 'Redis',
      command: 'docker run -d --name cattle-test-redis -p 6380:6379 redis:7-alpine',
      healthCheck: 'docker exec cattle-test-redis redis-cli ping',
      port: 6380,
    },
  ],
  backend: {
    dir: '../../backend',
    port: 3001,
    env: {
      NODE_ENV: 'test',
      PORT: '3001',
      DB_HOST: 'localhost',
      DB_PORT: '5433',
      DB_NAME: 'cattle_management_test',
      DB_USER: 'postgres',
      DB_PASSWORD: 'postgres',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6380',
      JWT_SECRET: 'test-jwt-secret-key-for-integration-tests',
      CORS_ORIGINS: 'http://localhost:5174',
    },
  },
  frontend: {
    dir: '../../frontend',
    port: 5174,
    env: {
      NODE_ENV: 'test',
      VITE_API_BASE_URL: 'http://localhost:3001',
    },
  },
};

async function main() {
  console.log('🚀 Setting up integration test environment...');

  try {
    // 1. Setup Docker services
    await setupDockerServices();

    // 2. Setup backend test environment
    await setupBackend();

    // 3. Setup frontend test environment
    await setupFrontend();

    // 4. Create test environment file
    await createTestEnvFile();

    // 5. Wait for all services to be ready
    await waitForServices();

    console.log('✅ Integration test environment setup complete!');
    console.log(`
📋 Test Environment Summary:
  - PostgreSQL: localhost:5433
  - Redis: localhost:6380
  - Backend API: http://localhost:3001
  - Frontend: http://localhost:5174
  
🧪 Run tests with:
  npm test                 # Integration tests
  npm run test:e2e         # End-to-end tests
  npm run test:contract    # Contract tests
  npm run test:performance # Performance tests
  npm run test:all         # All tests
`);

  } catch (error) {
    console.error('❌ Failed to setup test environment:', error.message);
    process.exit(1);
  }
}

async function setupDockerServices() {
  console.log('🐳 Setting up Docker services...');

  for (const service of CONFIG.services) {
    try {
      // Stop and remove existing container if it exists
      await execAsync(`docker stop ${service.name.toLowerCase().replace(' ', '-')}-test || true`);
      await execAsync(`docker rm ${service.name.toLowerCase().replace(' ', '-')}-test || true`);

      // Start new container
      console.log(`  Starting ${service.name}...`);
      await execAsync(service.command);

      // Wait for service to be ready
      console.log(`  Waiting for ${service.name} to be ready...`);
      await waitForDockerService(service);

      console.log(`  ✅ ${service.name} is ready`);
    } catch (error) {
      throw new Error(`Failed to setup ${service.name}: ${error.message}`);
    }
  }
}

async function waitForDockerService(service, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await execAsync(service.healthCheck);
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(`${service.name} failed to start after ${maxRetries} attempts`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function setupBackend() {
  console.log('🔧 Setting up backend test environment...');

  const backendDir = path.resolve(__dirname, CONFIG.backend.dir);

  // Create test environment file
  const envContent = Object.entries(CONFIG.backend.env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\\n');

  await fs.writeFile(path.join(backendDir, '.env.test'), envContent);

  // Install dependencies if needed
  try {
    await execAsync('npm ci', { cwd: backendDir });
  } catch (error) {
    console.log('  Installing backend dependencies...');
    await execAsync('npm install', { cwd: backendDir });
  }

  // Run database migrations
  console.log('  Running database migrations...');
  await execAsync('npm run migrate', { 
    cwd: backendDir,
    env: { ...process.env, ...CONFIG.backend.env }
  });

  console.log('  ✅ Backend test environment ready');
}

async function setupFrontend() {
  console.log('🎨 Setting up frontend test environment...');

  const frontendDir = path.resolve(__dirname, CONFIG.frontend.dir);

  // Create test environment file
  const envContent = Object.entries(CONFIG.frontend.env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\\n');

  await fs.writeFile(path.join(frontendDir, '.env.test'), envContent);

  // Install dependencies if needed
  try {
    await execAsync('npm ci', { cwd: frontendDir });
  } catch (error) {
    console.log('  Installing frontend dependencies...');
    await execAsync('npm install', { cwd: frontendDir });
  }

  console.log('  ✅ Frontend test environment ready');
}

async function createTestEnvFile() {
  const testEnvContent = `# Integration Test Environment Configuration
# Generated automatically by setup-test-environment.js

# Backend Configuration
BACKEND_URL=http://localhost:${CONFIG.backend.port}
BACKEND_PORT=${CONFIG.backend.port}

# Frontend Configuration
FRONTEND_URL=http://localhost:${CONFIG.frontend.port}
FRONTEND_PORT=${CONFIG.frontend.port}

# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=cattle_management_test
DB_USER=postgres
DB_PASSWORD=postgres

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6380

# Test Configuration
TEST_TIMEOUT=60000
TEST_RETRIES=3
TEST_PARALLEL=false

# JWT Configuration
JWT_SECRET=test-jwt-secret-key-for-integration-tests

# CORS Configuration
CORS_ORIGINS=http://localhost:${CONFIG.frontend.port}
`;

  await fs.writeFile(path.resolve(__dirname, '../.env.test'), testEnvContent);
  console.log('  ✅ Test environment file created');
}

async function waitForServices() {
  console.log('⏳ Waiting for all services to be ready...');

  const services = [
    {
      name: 'Backend API',
      url: `http://localhost:${CONFIG.backend.port}/api/health`,
      timeout: 60000,
    },
    {
      name: 'Frontend',
      url: `http://localhost:${CONFIG.frontend.port}`,
      timeout: 60000,
    },
  ];

  // Start backend and frontend services
  console.log('  Starting backend server...');
  const backendProcess = exec('npm run dev', {
    cwd: path.resolve(__dirname, CONFIG.backend.dir),
    env: { ...process.env, ...CONFIG.backend.env },
  });

  console.log('  Starting frontend server...');
  const frontendProcess = exec('npm run dev', {
    cwd: path.resolve(__dirname, CONFIG.frontend.dir),
    env: { ...process.env, ...CONFIG.frontend.env },
  });

  // Wait for services to be ready
  for (const service of services) {
    console.log(`  Waiting for ${service.name}...`);
    await waitForHttpService(service.url, service.name, service.timeout);
    console.log(`  ✅ ${service.name} is ready`);
  }

  // Store process IDs for cleanup
  await fs.writeFile(
    path.resolve(__dirname, '../.test-processes'),
    JSON.stringify({
      backend: backendProcess.pid,
      frontend: frontendProcess.pid,
    })
  );
}

async function waitForHttpService(url, serviceName, timeout = 60000) {
  const axios = require('axios');
  const startTime = Date.now();
  const maxRetries = Math.floor(timeout / 2000);

  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(url, { timeout: 5000 });
      return;
    } catch (error) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`${serviceName} failed to start within ${timeout}ms`);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\\n🧹 Cleaning up test environment...');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\\n🧹 Cleaning up test environment...');
  await cleanup();
  process.exit(0);
});

async function cleanup() {
  try {
    // Stop Docker containers
    for (const service of CONFIG.services) {
      const containerName = service.name.toLowerCase().replace(' ', '-') + '-test';
      await execAsync(`docker stop ${containerName} || true`);
      await execAsync(`docker rm ${containerName} || true`);
    }

    // Kill backend and frontend processes
    try {
      const processFile = path.resolve(__dirname, '../.test-processes');
      const processes = JSON.parse(await fs.readFile(processFile, 'utf8'));
      
      if (processes.backend) {
        process.kill(processes.backend, 'SIGTERM');
      }
      if (processes.frontend) {
        process.kill(processes.frontend, 'SIGTERM');
      }

      await fs.unlink(processFile);
    } catch (error) {
      // Ignore errors during cleanup
    }

    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('⚠️ Error during cleanup:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, cleanup };