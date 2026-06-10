import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const reviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

router.get('/product/:productId', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.productId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(reviews);
});

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = reviewSchema.parse(req.body);
    const review = await prisma.review.upsert({
      where: {
        userId_productId: { userId: req.user!.userId, productId: data.productId },
      },
      create: {
        userId: req.user!.userId,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment,
      },
      update: { rating: data.rating, comment: data.comment },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    res.status(201).json(review);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    res.status(500).json({ message: 'Ошибка создания отзыва' });
  }
});

export default router;
