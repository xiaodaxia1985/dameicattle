#!/usr/bin/env node

// Simple development starter that ensures environment is loaded
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '.env.development');
console.log('Loading environment from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env.development:', result.error);
  process.exit(1);
}

// Verify critical environment variables are loaded
const requiredVars = ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}

console.log('Environment variables loaded successfully:');
console.log('- DB_NAME:', process.env.DB_NAME);
console.log('- DB_USER:', process.env.DB_USER);
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

// Now start the application with ts-node
const { spawn } = require('child_process');

const child = spawn('npx', ['ts-node', '-r', 'tsconfig-paths/register', 'src/app.ts'], {
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  process.exit(code);
});