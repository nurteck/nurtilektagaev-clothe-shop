import { Router } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
  res.json(banners);
});

export default router;
