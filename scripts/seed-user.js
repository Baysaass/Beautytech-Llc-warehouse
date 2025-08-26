// scripts/seed-user.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const passwordHash = await bcrypt.hash('mypassword', 10);

  const user = await prisma.user.create({
    data: {
      email: 'baysaa@example.com',
      password: passwordHash,
      name: 'Baysaa',
    },
  });

  console.log('User created:', user);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
