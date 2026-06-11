import { prisma } from '../config/db.js';

export async function getProductImageUrl(productId: string): Promise<string | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      colors: { where: { imageUrl: { not: null } }, take: 1 },
    },
  });

  if (!product) return null;
  return product.images[0]?.url ?? product.colors[0]?.imageUrl ?? null;
}
