import type { Prisma } from '@prisma/client';

import { prisma } from '../config/db.js';

type DbClient = Prisma.TransactionClient | typeof prisma;

function normalizeSize(size?: string | null): string | undefined {
  const value = size?.trim();
  return value || undefined;
}

async function hasSizeVariants(productId: string, db: DbClient): Promise<boolean> {
  const count = await db.productSize.count({ where: { productId } });
  return count > 0;
}

async function recalculateProductStock(productId: string, db: DbClient): Promise<void> {
  const sizes = await db.productSize.findMany({ where: { productId } });
  if (sizes.length === 0) return;
  const total = sizes.reduce((sum, s) => sum + s.stock, 0);
  await db.product.update({ where: { id: productId }, data: { stock: total } });
}

export async function getAvailableStock(
  productId: string,
  size?: string | null,
  db: DbClient = prisma
): Promise<number> {
  const sizeKey = normalizeSize(size);

  if (await hasSizeVariants(productId, db)) {
    if (!sizeKey) return 0;
    const productSize = await db.productSize.findFirst({
      where: { productId, size: sizeKey },
    });
    return productSize?.stock ?? 0;
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  return product?.stock ?? 0;
}

export async function decrementStock(
  db: DbClient,
  productId: string,
  size: string | null | undefined,
  quantity: number
): Promise<void> {
  if (quantity < 1) throw new Error('Некорректное количество');

  const sizeKey = normalizeSize(size);

  if (await hasSizeVariants(productId, db)) {
    if (!sizeKey) throw new Error('Укажите размер товара');

    const productSize = await db.productSize.findFirst({
      where: { productId, size: sizeKey },
    });

    if (!productSize || productSize.stock < quantity) {
      throw new Error('Недостаточно на складе');
    }

    await db.productSize.update({
      where: { id: productSize.id },
      data: { stock: productSize.stock - quantity },
    });

    await recalculateProductStock(productId, db);
    return;
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || product.stock < quantity) {
    throw new Error('Недостаточно на складе');
  }

  await db.product.update({
    where: { id: productId },
    data: { stock: product.stock - quantity },
  });
}

export async function restoreStock(
  db: DbClient,
  productId: string,
  size: string | null | undefined,
  quantity: number
): Promise<void> {
  if (quantity < 1) return;

  const sizeKey = normalizeSize(size);

  if (await hasSizeVariants(productId, db)) {
    if (!sizeKey) return;

    const productSize = await db.productSize.findFirst({
      where: { productId, size: sizeKey },
    });

    if (productSize) {
      await db.productSize.update({
        where: { id: productSize.id },
        data: { stock: productSize.stock + quantity },
      });
      await recalculateProductStock(productId, db);
    }
    return;
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  if (product) {
    await db.product.update({
      where: { id: productId },
      data: { stock: product.stock + quantity },
    });
  }
}

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  let normalized = digits;
  if (normalized.startsWith('996')) normalized = normalized.slice(3);
  if (normalized.length !== 9) return null;
  return `+996${normalized}`;
}

export async function getDefaultBrandId(): Promise<string> {
  let brand = await prisma.brand.findFirst({ where: { slug: 'oshop' } });
  if (!brand) {
    brand = await prisma.brand.create({ data: { name: 'Oshop', slug: 'oshop' } });
  }
  return brand.id;
}
