const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = 'Admin123';
  const storedHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8G';
  
  console.log('Testing password:', password);
  console.log('Stored hash:', storedHash);
  
  // Test with bcryptjs
  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Password valid with bcryptjs:', isValid);
  
  // Generate a new hash for comparison
  const newHash = await bcrypt.hash(password, 12);
  console.log('New hash generated:', newHash);
  
  // Test new hash
  const isNewValid = await bcrypt.compare(password, newHash);
  console.log('New hash valid:', isNewValid);
}

testPassword().catch(console.error);