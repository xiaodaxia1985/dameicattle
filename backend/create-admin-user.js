const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'cattle_management_dev',
    user: 'cattle_user',
    password: 'dianxin99'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // First, check what tables exist
    console.log('Checking database tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Available tables:', tables.rows.map(row => row.table_name));
    
    // Check if roles table exists
    const rolesTableExists = tables.rows.some(row => row.table_name === 'roles');
    
    if (!rolesTableExists) {
      console.log('Roles table does not exist. Creating it...');
      await client.query(`
        CREATE TABLE roles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL UNIQUE,
          description TEXT,
          permissions JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('Roles table created');
    }
    
    // Check if admin role exists
    const adminRole = await client.query(
      'SELECT id, name FROM roles WHERE name = $1',
      ['admin']
    );

    let adminRoleId;
    if (adminRole.rows.length === 0) {
      console.log('Creating admin role...');
      const roleResult = await client.query(`
        INSERT INTO roles (name, description, permissions, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, name
      `, ['admin', 'Administrator', JSON.stringify(['*'])]);
      
      adminRoleId = roleResult.rows[0].id;
      console.log('Admin role created:', roleResult.rows[0]);
    } else {
      adminRoleId = adminRole.rows[0].id;
      console.log('Admin role exists:', adminRole.rows[0]);
    }

    // Check if admin user exists
    const existingUser = await client.query(
      'SELECT id, username FROM users WHERE username = $1',
      ['admin']
    );

    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists:', existingUser.rows[0]);
      
      // Update password to ensure it's correct
      const password = 'Admin123';
      const hash = await bcrypt.hash(password, 12);
      
      await client.query(
        'UPDATE users SET password_hash = $1, role_id = $2 WHERE username = $3',
        [hash, adminRoleId, 'admin']
      );
      
      console.log('Admin password and role updated successfully');
    } else {
      console.log('Creating admin user...');
      
      // Create admin user
      const password = 'Admin123';
      const hash = await bcrypt.hash(password, 12);
      
      const result = await client.query(`
        INSERT INTO users (username, password_hash, real_name, status, role_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, username, real_name
      `, ['admin', hash, 'Administrator', 'active', adminRoleId]);
      
      console.log('Admin user created:', result.rows[0]);
    }

    // Verify login
    const user = await client.query(
      'SELECT username, password_hash FROM users WHERE username = $1',
      ['admin']
    );

    if (user.rows.length > 0) {
      const isValid = await bcrypt.compare('Admin123', user.rows[0].password_hash);
      console.log('Password verification test:', isValid ? 'PASSED' : 'FAILED');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

createAdminUser();