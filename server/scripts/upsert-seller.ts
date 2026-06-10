import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('nurti123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'nurtilek@oshop.com' },
    update: { role: 'ADMIN', password, name: 'Nurtilek' },
    create: {
      email: 'nurtilek@oshop.com',
      password,
      name: 'Nurtilek',
      role: 'ADMIN',
    },
  });
  console.log('Продавец готов:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
