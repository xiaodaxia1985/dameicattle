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
      'SELECT id, name, permissions FROM roles WHERE name = $1',
      ['admin']
    );

    let adminRoleId;
    if (adminRole.rows.length === 0) {
      console.log('Creating admin role...');
      const adminPermissions = [
        '*', // Global admin permission
        'bases:read', 'bases:create', 'bases:update', 'bases:delete',
        'cattle:read', 'cattle:create', 'cattle:update', 'cattle:delete',
        'users:read', 'users:create', 'users:update', 'users:delete',
        'roles:read', 'roles:create', 'roles:update', 'roles:delete',
        'barns:read', 'barns:create', 'barns:update', 'barns:delete',
        'health-records:read', 'health-records:create', 'health-records:update', 'health-records:delete',
        'feeding:read', 'feeding:create', 'feeding:update', 'feeding:delete',
        'materials:read', 'materials:create', 'materials:update', 'materials:delete',
        'equipment:read', 'equipment:create', 'equipment:update', 'equipment:delete',
        'suppliers:read', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
        'purchase-orders:read', 'purchase-orders:create', 'purchase-orders:update', 'purchase-orders:delete',
        'customers:read', 'customers:create', 'customers:update', 'customers:delete',
        'sales-orders:read', 'sales-orders:create', 'sales-orders:update', 'sales-orders:delete',
        'dashboard:read', 'reports:read', 'system:admin'
      ];
      
      const roleResult = await client.query(`
        INSERT INTO roles (name, description, permissions, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, name
      `, ['admin', 'Administrator with full system access', JSON.stringify(adminPermissions)]);
      
      adminRoleId = roleResult.rows[0].id;
      console.log('Admin role created:', roleResult.rows[0]);
    } else {
      adminRoleId = adminRole.rows[0].id;
      console.log('Admin role exists:', adminRole.rows[0]);
      
      // Check if admin role has proper permissions
      const currentPermissions = adminRole.rows[0].permissions;
      if (!currentPermissions || !currentPermissions.includes('*') || !currentPermissions.includes('bases:read')) {
        console.log('Updating admin role permissions...');
        const adminPermissions = [
          '*', // Global admin permission
          'bases:read', 'bases:create', 'bases:update', 'bases:delete',
          'cattle:read', 'cattle:create', 'cattle:update', 'cattle:delete',
          'users:read', 'users:create', 'users:update', 'users:delete',
          'roles:read', 'roles:create', 'roles:update', 'roles:delete',
          'barns:read', 'barns:create', 'barns:update', 'barns:delete',
          'health-records:read', 'health-records:create', 'health-records:update', 'health-records:delete',
          'feeding:read', 'feeding:create', 'feeding:update', 'feeding:delete',
          'materials:read', 'materials:create', 'materials:update', 'materials:delete',
          'equipment:read', 'equipment:create', 'equipment:update', 'equipment:delete',
          'suppliers:read', 'suppliers:create', 'suppliers:update', 'suppliers:delete',
          'purchase-orders:read', 'purchase-orders:create', 'purchase-orders:update', 'purchase-orders:delete',
          'customers:read', 'customers:create', 'customers:update', 'customers:delete',
          'sales-orders:read', 'sales-orders:create', 'sales-orders:update', 'sales-orders:delete',
          'dashboard:read', 'reports:read', 'system:admin'
        ];
        
        await client.query(
          'UPDATE roles SET permissions = $1, description = $2 WHERE id = $3',
          [JSON.stringify(adminPermissions), 'Administrator with full system access', adminRoleId]
        );
        console.log('Admin role permissions updated');
      }
    }

    // Check if admin user exists
    const existingUser = await client.query(
      'SELECT id, username, role_id FROM users WHERE username = $1',
      ['admin']
    );

    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists:', existingUser.rows[0]);
      
      // Update password and ensure correct role assignment
      const password = 'Admin123';
      const hash = await bcrypt.hash(password, 12);
      
      await client.query(
        'UPDATE users SET password_hash = $1, role_id = $2, status = $3, updated_at = NOW() WHERE username = $4',
        [hash, adminRoleId, 'active', 'admin']
      );
      
      console.log('Admin password, role, and status updated successfully');
      console.log(`Admin user assigned to role ID: ${adminRoleId}`);
    } else {
      console.log('Creating admin user...');
      
      // Create admin user
      const password = 'Admin123';
      const hash = await bcrypt.hash(password, 12);
      
      const result = await client.query(`
        INSERT INTO users (username, password_hash, real_name, email, status, role_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, username, real_name, role_id
      `, ['admin', hash, 'Administrator', 'admin@system.local', 'active', adminRoleId]);
      
      console.log('Admin user created:', result.rows[0]);
      console.log(`Admin user assigned to role ID: ${adminRoleId}`);
    }

    // Verify the admin user has the correct role and permissions
    const adminUserCheck = await client.query(`
      SELECT u.id, u.username, u.status, r.name as role_name, r.permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1
    `, ['admin']);

    if (adminUserCheck.rows.length > 0) {
      const adminInfo = adminUserCheck.rows[0];
      console.log('\n✅ Admin user verification:');
      console.log(`   Username: ${adminInfo.username}`);
      console.log(`   Status: ${adminInfo.status}`);
      console.log(`   Role: ${adminInfo.role_name}`);
      console.log(`   Permissions: ${adminInfo.permissions ? adminInfo.permissions.slice(0, 3).join(', ') + '...' : 'None'}`);
      
      if (adminInfo.permissions && adminInfo.permissions.includes('*')) {
        console.log('✅ Admin has wildcard (*) permission - full access granted');
      } else if (adminInfo.permissions && adminInfo.permissions.includes('bases:read')) {
        console.log('✅ Admin has specific base permissions');
      } else {
        console.log('⚠️ Admin permissions may be insufficient');
      }
    } else {
      console.log('❌ Could not verify admin user setup');
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