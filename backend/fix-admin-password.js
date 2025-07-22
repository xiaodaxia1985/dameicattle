const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function fixAdminPassword() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'cattle_management',
    user: 'postgres',
    password: 'dianxin99'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Generate correct hash for Admin123
    const password = 'Admin123';
    const hash = await bcrypt.hash(password, 12);
    console.log('Generated hash:', hash);

    // Update admin user password
    const result = await client.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2',
      [hash, 'admin']
    );

    console.log('Updated rows:', result.rowCount);

    // Verify the update
    const user = await client.query(
      'SELECT username, password_hash FROM users WHERE username = $1',
      ['admin']
    );

    if (user.rows.length > 0) {
      console.log('Admin user found:', user.rows[0].username);
      
      // Test password verification
      const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
      console.log('Password verification:', isValid);
    } else {
      console.log('Admin user not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

fixAdminPassword();