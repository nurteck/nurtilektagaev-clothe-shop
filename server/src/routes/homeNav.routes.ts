import { Router } from 'express';
import { prisma } from '../config/db.js';
import { ensureHomeNavCards } from '../utils/homeNav.js';

const router = Router();

router.get('/', async (_req, res) => {
  await ensureHomeNavCards();
  const cards = await prisma.homeNavCard.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
  res.json(cards);
});

export default router;
