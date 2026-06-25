import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Enter admin password to hash: ', async (password) => {
  const hash = await bcrypt.hash(password.trim(), 10);
  console.log('\nAdd this to your .env file:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  rl.close();
});
