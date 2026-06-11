import type { Prisma } from '@prisma/client';

type DbClient = Prisma.TransactionClient;

export interface VariantInput {
  size: string;
  color?: string;
  stock: number;
}

export interface ColorInput {
  name: string;
  hex: string;
  imageUrl?: string | null;
}

export async function replaceProductVariants(
  tx: DbClient,
  productId: string,
  colors: ColorInput[] | undefined,
  variants: VariantInput[] | undefined
): Promise<number> {
  await tx.productVariant.deleteMany({ where: { productId } });
  await tx.productColor.deleteMany({ where: { productId } });

  if (colors?.length) {
    for (const c of colors) {
      await tx.productColor.create({
        data: {
          productId,
          name: c.name.trim(),
          hex: c.hex.trim(),
          imageUrl: c.imageUrl?.trim() || null,
        },
      });
    }
  }

  const colorNames = new Set((colors || []).map((c) => c.name.trim()));
  const rows = (variants || [])
    .filter((v) => v.size.trim() && v.stock > 0)
    .map((v) => ({
      productId,
      size: v.size.trim(),
      color: v.color?.trim() && colorNames.has(v.color.trim()) ? v.color.trim() : '',
      stock: v.stock,
    }));

  if (rows.length) {
    await tx.productVariant.createMany({ data: rows });
  }

  return rows.reduce((sum, r) => sum + r.stock, 0);
}
