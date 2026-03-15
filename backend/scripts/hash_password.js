const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
}

// Generate hashes for test accounts
hashPassword('admin123');
hashPassword('panelist123');
