import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import brandsRoutes from './routes/brands.routes.js';
import bannersRoutes from './routes/banners.routes.js';
import cartRoutes from './routes/cart.routes.js';
import favoritesRoutes from './routes/favorites.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import adminRoutes from './routes/admin.routes.js';
import mediaRoutes from './routes/media.routes.js';
import { ensureUploadsDir, uploadsDir } from './utils/uploads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
ensureUploadsDir();
const app = express();

if (env.isProd) {
  app.set('trust proxy', 1);
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'Oshop API' });
});

app.use('/api/media', mediaRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin', adminRoutes);

if (env.isProd) {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/|\/uploads\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Oshop API running on http://localhost:${env.port}`);
});
