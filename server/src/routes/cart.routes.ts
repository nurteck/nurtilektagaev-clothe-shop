import { Router } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { getAvailableStock } from '../utils/stock.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    include: {
      product: {
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          brand: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = items.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: Number(item.product.price),
      oldPrice: item.product.oldPrice ? Number(item.product.oldPrice) : null,
    },
  }));

  const total = formatted.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  res.json({ items: formatted, total });
});

router.post('/', async (req: AuthRequest, res) => {
  const { productId, quantity = 1, size, color } = req.body;
  const available = await getAvailableStock(productId, size, color);

  const existing = await prisma.cartItem.findFirst({
    where: { userId: req.user!.userId, productId, size: size || null, color: color || null },
  });

  const newQty = (existing?.quantity || 0) + quantity;
  if (newQty > available) {
    return res.status(400).json({
      message: `Недостаточно на складе. Доступно: ${available} шт.`,
      available,
    });
  }

  let item;
  if (existing) {
    item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
      include: { product: { include: { images: { take: 1 } } } },
    });
  } else {
    item = await prisma.cartItem.create({
      data: { userId: req.user!.userId, productId, quantity, size, color },
      include: { product: { include: { images: { take: 1 } } } },
    });
  }

  res.status(201).json(item);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const { quantity } = req.body;
  const item = await prisma.cartItem.findFirst({
    where: { id: String(req.params.id), userId: req.user!.userId },
  });
  if (!item) return res.status(404).json({ message: 'Элемент не найден' });

  const available = await getAvailableStock(item.productId, item.size, item.color);
  if (quantity > available) {
    return res.status(400).json({
      message: `Недостаточно на складе. Доступно: ${available} шт.`,
      available,
    });
  }

  const updated = await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity },
    include: { product: { include: { images: { take: 1 } } } },
  });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res) => {
  const item = await prisma.cartItem.findFirst({
    where: { id: String(req.params.id), userId: req.user!.userId },
  });
  if (!item) return res.status(404).json({ message: 'Элемент не найден' });

  await prisma.cartItem.delete({ where: { id: item.id } });
  res.json({ message: 'Удалено' });
});

router.delete('/', async (req: AuthRequest, res) => {
  await prisma.cartItem.deleteMany({ where: { userId: req.user!.userId } });
  res.json({ message: 'Корзина очищена' });
});

export default router;
