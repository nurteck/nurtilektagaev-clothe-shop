import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { authLoginLimiter, authRegisterLimiter } from '../middleware/rateLimit.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', authRegisterLimiter, async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(400).json({ message: 'Email уже используется' });

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, password: hashed, name: data.name },
      select: { id: true, email: true, name: true, avatar: true, role: true },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({ user, token });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    res.status(500).json({ message: 'Ошибка регистрации' });
  }
});

async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  return user;
}

router.post('/login', authLoginLimiter, async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await authenticateUser(data.email, data.password);
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль' });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    res.status(500).json({ message: 'Ошибка входа' });
  }
});

router.post('/seller-login', authLoginLimiter, async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await authenticateUser(data.email, data.password);
    if (!user) return res.status(401).json({ message: 'Неверный email или пароль' });

    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        message: 'Это вход только для продавца. Покупателям регистрация не нужна.',
      });
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
    res.status(500).json({ message: 'Ошибка входа' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
  res.json(user);
});

router.put('/profile', authenticate, async (req: AuthRequest, res) => {
  const { name, avatar } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(name && { name }),
      ...(avatar !== undefined && { avatar }),
    },
    select: { id: true, email: true, name: true, avatar: true, role: true },
  });
  res.json(user);
});

export default router;
