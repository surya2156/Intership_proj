const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/checkLogin.js <email> <password>');
  process.exit(1);
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      console.log('NO_USER');
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log(valid ? 'VALID' : 'INVALID');
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
