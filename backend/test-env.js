const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.development' });

console.log('Environment variables loaded:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'NOT SET');
console.log('PORT:', process.env.PORT);

// Test configuration validation
try {
  const { configValidator } = require('./dist/config/ConfigValidator');
  const result = configValidator.validateEnvironment();
  
  console.log('\nConfiguration validation result:');
  console.log('Valid:', result.isValid);
  if (!result.isValid) {
    console.log('Errors:', result.errors);
  }
  if (result.warnings.length > 0) {
    console.log('Warnings:', result.warnings);
  }
} catch (error) {
  console.error('Error testing configuration:', error.message);
}