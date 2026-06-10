import { Router } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  res.json(categories);
});

router.get('/:slug', async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { products: true } } },
  });
  if (!category) return res.status(404).json({ message: 'Категория не найдена' });
  res.json(category);
});

export default router;
