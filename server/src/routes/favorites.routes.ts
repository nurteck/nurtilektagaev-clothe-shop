import { Router } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.userId },
    include: {
      product: {
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          brand: true,
          category: true,
          reviews: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const products = favorites.map((f) => ({
    ...f.product,
    price: Number(f.product.price),
    oldPrice: f.product.oldPrice ? Number(f.product.oldPrice) : null,
    favoriteId: f.id,
  }));

  res.json(products);
});

router.post('/:productId', async (req: AuthRequest, res) => {
  const productId = String(req.params.productId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ message: 'Товар не найден' });

  const favorite = await prisma.favorite.upsert({
    where: { userId_productId: { userId: req.user!.userId, productId } },
    create: { userId: req.user!.userId, productId },
    update: {},
  });

  res.status(201).json(favorite);
});

router.delete('/:productId', async (req: AuthRequest, res) => {
  await prisma.favorite.deleteMany({
    where: { userId: req.user!.userId, productId: String(req.params.productId) },
  });
  res.json({ message: 'Удалено из избранного' });
});

router.get('/check/:productId', async (req: AuthRequest, res) => {
  const favorite = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: req.user!.userId, productId: String(req.params.productId) } },
  });
  res.json({ isFavorite: !!favorite });
});

export default router;
