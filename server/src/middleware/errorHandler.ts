import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const message = env.isProd
    ? 'Внутренняя ошибка сервера'
    : (err.message || 'Внутренняя ошибка сервера');
  res.status(500).json({ message });
}
