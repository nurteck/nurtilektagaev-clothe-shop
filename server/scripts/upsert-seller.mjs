import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const email = 'nurtilek@oshop.com';
const password = 'nurti123';

const hashed = await bcrypt.hash(password, 10);
const user = await prisma.user.upsert({
  where: { email },
  update: { role: 'ADMIN', password: hashed, name: 'Nurtilek' },
  create: {
    email,
    password: hashed,
    name: 'Nurtilek',
    role: 'ADMIN',
  },
});

console.log('Продавец готов:', user.email);
await prisma.$disconnect();
