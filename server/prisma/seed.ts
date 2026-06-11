import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ensureHomeNavCards } from '../src/utils/homeNav.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Очистка каталога — товары и категории создаёт только админ
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();

  const sellerPassword = await bcrypt.hash('nurti123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  await prisma.user.upsert({
    where: { email: 'nurtilek@oshop.com' },
    update: { role: 'ADMIN', password: sellerPassword, name: 'Nurtilek' },
    create: {
      email: 'nurtilek@oshop.com',
      password: sellerPassword,
      name: 'Nurtilek',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@oshop.com' },
    update: {},
    create: {
      email: 'user@oshop.com',
      password: userPassword,
      name: 'Айдар Усенов',
      role: 'CUSTOMER',
    },
  });

  // Один бренд по умолчанию для удобства при добавлении товаров
  await prisma.brand.create({
    data: { name: 'Oshop', slug: 'oshop' },
  });

  await ensureHomeNavCards();

  console.log('Seed completed!');
  console.log('Продавец: nurtilek@oshop.com / nurti123 → вход в футере или /admin/login');
  console.log('Покупатель: user@oshop.com / user123');
  console.log('Каталог пуст — админ добавляет категории и товары сам.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
