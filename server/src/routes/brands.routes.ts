import { Router } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  res.json(brands);
});

export default router;
