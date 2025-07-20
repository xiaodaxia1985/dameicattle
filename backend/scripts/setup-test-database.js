const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'dianxin99',
  database: 'postgres' // Connect to default database first
};

const testDbName = process.env.DB_NAME || 'cattle_management_test';

async function setupTestDatabase() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if test database exists
    const dbCheckResult = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [testDbName]
    );

    if (dbCheckResult.rows.length === 0) {
      // Create test database
      await client.query(`CREATE DATABASE "${testDbName}"`);
      console.log(`✅ Created test database: ${testDbName}`);
    } else {
      console.log(`✅ Test database already exists: ${testDbName}`);
    }

    await client.end();

    // Connect to the test database and run migrations
    const testClient = new Client({
      ...config,
      database: testDbName
    });

    await testClient.connect();
    console.log(`✅ Connected to test database: ${testDbName}`);

    // Run migration files
    const migrationsDir = path.join(__dirname, '../src/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      try {
        const migrationPath = path.join(migrationsDir, file);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
          await testClient.query(statement);
        }
        
        console.log(`✅ Executed migration: ${file}`);
      } catch (error) {
        console.warn(`⚠️  Warning in migration ${file}:`, error.message);
        // Continue with other migrations
      }
    }

    await testClient.end();
    console.log('✅ Test database setup completed successfully');

  } catch (error) {
    console.error('❌ Error setting up test database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase };