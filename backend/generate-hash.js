// 生成密码哈希
const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('生成密码哈希...\n');
  
  const passwords = {
    'Admin123': await bcrypt.hash('Admin123', 12),
    'Manager123': await bcrypt.hash('Manager123', 12),
    'Vet123': await bcrypt.hash('Vet123', 12),
    'Feed123': await bcrypt.hash('Feed123', 12)
  };
  
  console.log('密码哈希结果:');
  Object.entries(passwords).forEach(([password, hash]) => {
    console.log(`${password}: ${hash}`);
  });
  
  // 验证哈希
  console.log('\n验证哈希:');
  for (const [password, hash] of Object.entries(passwords)) {
    const isValid = await bcrypt.compare(password, hash);
    console.log(`${password}: ${isValid ? '✅' : '❌'}`);
  }
}

generateHashes();