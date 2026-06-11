import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { optionalAuth, type AuthRequest } from '../middleware/auth.js';
import { getAvailableStock } from '../utils/stock.js';

const router = Router();

function formatProduct(product: Record<string, unknown>) {
  const reviews = (product.reviews as { rating: number }[]) || [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return {
    ...product,
    price: Number(product.price),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount: reviews.length,
  };
}

router.get('/by-ids', async (req, res) => {
  const ids = String(req.query.ids || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (!ids.length) return res.json([]);

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { order: 'asc' } },
      variants: true,
      colors: true,
      reviews: { select: { rating: true } },
    },
  });

  res.json(products.map(formatProduct));
});

router.get('/stock/:productId', async (req, res) => {
  const productId = String(req.params.productId);
  const size = req.query.size ? String(req.query.size) : undefined;
  const color = req.query.color ? String(req.query.color) : undefined;
  const available = await getAvailableStock(productId, size, color);
  res.json({ available });
});

router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  const {
    search,
    category,
    categoryId,
    brand,
    size,
    color,
    minPrice,
    maxPrice,
    sort = 'popular',
    page = '1',
    limit = '12',
    isNew,
    isSale,
    isPopular,
    isRecommended,
    audience,
    onlyOrdered,
  } = req.query;

  const where: Prisma.ProductWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { description: { contains: String(search), mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = String(categoryId);
  else if (category) where.category = { slug: String(category) };
  if (brand) where.brand = { slug: String(brand) };
  if (size) where.variants = { some: { size: String(size) } };
  if (color) where.colors = { some: { name: { contains: String(color), mode: 'insensitive' } } };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(String(minPrice));
    if (maxPrice) where.price.lte = parseFloat(String(maxPrice));
  }
  if (isNew === 'true') where.isNew = true;
  if (isSale === 'true') {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { OR: [{ isSale: true }, { oldPrice: { not: null } }] },
    ];
  }
  if (onlyOrdered === 'true') {
    where.orderItems = {
      some: { order: { status: { not: 'CANCELLED' } } },
    };
  }
  if (isPopular === 'true') where.isPopular = true;
  if (isRecommended === 'true') where.isRecommended = true;
  if (audience) {
    const value = String(audience).toUpperCase();
    if (['MEN', 'WOMEN', 'KIDS', 'UNISEX'].includes(value)) {
      where.audience = value as 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX';
    }
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = {
    createdAt: 'desc',
  };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'popular') {
    orderBy = [{ orderItems: { _count: 'desc' } }, { isPopular: 'desc' }, { createdAt: 'desc' }];
  }
  if (sort === 'new') orderBy = { createdAt: 'desc' };

  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        category: true,
        brand: true,
        images: { orderBy: { order: 'asc' } },
        variants: true,
        colors: true,
        reviews: { select: { rating: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: products.map(formatProduct),
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

router.get('/:slug', optionalAuth, async (req, res) => {
  const slug = String(req.params.slug);
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      brand: true,
      images: { orderBy: { order: 'asc' } },
      variants: true,
      colors: true,
      reviews: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product) return res.status(404).json({ message: 'Товар не найден' });
  res.json(formatProduct(product));
});

export default router;
