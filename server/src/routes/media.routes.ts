import { Router } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

router.get('/:id', async (req, res) => {
  const asset = await prisma.imageAsset.findUnique({
    where: { id: String(req.params.id) },
  });

  if (!asset) {
    res.status(404).json({ message: 'Изображение не найдено' });
    return;
  }

  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.type(asset.mimeType).send(Buffer.from(asset.data));
});

export default router;
