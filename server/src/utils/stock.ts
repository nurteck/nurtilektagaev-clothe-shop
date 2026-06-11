import type { Prisma } from '@prisma/client';

import { prisma } from '../config/db.js';

type DbClient = Prisma.TransactionClient | typeof prisma;

function normalizeSize(size?: string | null): string | undefined {
  const value = size?.trim();
  return value || undefined;
}

function normalizeColor(color?: string | null): string {
  return color?.trim() || '';
}

async function hasVariants(productId: string, db: DbClient): Promise<boolean> {
  const count = await db.productVariant.count({ where: { productId } });
  return count > 0;
}

async function productHasColors(productId: string, db: DbClient): Promise<boolean> {
  const count = await db.productColor.count({ where: { productId } });
  return count > 0;
}

async function recalculateProductStock(productId: string, db: DbClient): Promise<void> {
  const variants = await db.productVariant.findMany({ where: { productId } });
  if (variants.length === 0) return;
  const total = variants.reduce((sum, v) => sum + v.stock, 0);
  await db.product.update({ where: { id: productId }, data: { stock: total } });
}

export async function getAvailableStock(
  productId: string,
  size?: string | null,
  color?: string | null,
  db: DbClient = prisma
): Promise<number> {
  const sizeKey = normalizeSize(size);
  const colorKey = normalizeColor(color);

  if (await hasVariants(productId, db)) {
    if (!sizeKey) return 0;
    if ((await productHasColors(productId, db)) && !colorKey) return 0;

    const variant = await db.productVariant.findFirst({
      where: { productId, size: sizeKey, color: colorKey },
    });
    return variant?.stock ?? 0;
  }

  const product = await db.product.findUnique({ where: { id: productId } });
  return product?.stock ?? 0;
}

export async function decrementStock(
  db: DbClient,
  productId: string,
  size: string | null | undefined,
  color: string | null | undefined,
  quantity: number
): Promise<void> {
  if (quantity < 1) throw new Error('Некорректное количество');

  const sizeKey = normalizeSize(size);
  const colorKey = normalizeColor(color);

  if (await hasVariants(productId, db)) {
    if (!sizeKey) throw new Error('Укажите размер товара');
    if ((await productHasColors(productId, db)) && !colorKey) {
      throw new Error('Укажите цвет товара');
    }

    const variant = await db.productVariant.findFirst({
      where: { productId, size: sizeKey, color: colorKey },
    });

    if (!variant || variant.stock < quantity) {
      throw new Error('Недостаточно на складе');
    }

    await db.productVariant.update({
      where: { id: variant.id },
      data: { stock: variant.stock - quantity },
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
  color: string | null | undefined,
  quantity: number
): Promise<void> {
  if (quantity < 1) return;

  const sizeKey = normalizeSize(size);
  const colorKey = normalizeColor(color);

  if (await hasVariants(productId, db)) {
    if (!sizeKey) return;

    const variant = await db.productVariant.findFirst({
      where: { productId, size: sizeKey, color: colorKey },
    });

    if (variant) {
      await db.productVariant.update({
        where: { id: variant.id },
        data: { stock: variant.stock + quantity },
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
