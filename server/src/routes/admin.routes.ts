import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { authenticate, requireAdmin, type AuthRequest } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { createSlug } from '../utils/slug.js';

async function uniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  let base = createSlug(name);
  if (!base) base = 'category';
  let slug = base;
  let counter = 0;
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}
import { decrementStock, getDefaultBrandId, restoreStock } from '../utils/stock.js';

const ORDER_STATUSES = ['NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

const router = Router();

router.use(authenticate, requireAdmin);

// Dashboard
router.get('/dashboard', async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [productsCount, ordersCount, usersCount, deliveredOrders, pendingOrders, popularProducts] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.findMany({
      where: { status: 'DELIVERED' },
      select: { total: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.order.count({ where: { status: { in: ['NEW', 'PROCESSING'] } } }),
    prisma.product.findMany({
      where: { isPopular: true },
      take: 5,
      include: { images: { take: 1 }, category: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const last30Days = deliveredOrders.filter(
    (o) => o.updatedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const revenueLast30 = last30Days.reduce((sum, o) => sum + Number(o.total), 0);
  const todayOrders = deliveredOrders.filter((o) => o.updatedAt >= today);
  const revenueToday = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

  res.json({
    productsCount,
    ordersCount,
    usersCount,
    totalRevenue,
    revenueLast30,
    revenueToday,
    pendingOrders,
    popularProducts: popularProducts.map((p) => ({
      ...p,
      price: Number(p.price),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    })),
  });
});

// Products CRUD
router.get('/products', async (req, res) => {
  const { page = '1', limit = '20', search, categoryId } = req.query;
  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);

  const where: Prisma.ProductWhereInput = {};
  if (search) where.name = { contains: String(search), mode: 'insensitive' };
  if (categoryId) where.categoryId = String(categoryId);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        category: true,
        brand: true,
        images: { orderBy: { order: 'asc' } },
        sizes: true,
        colors: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products: products.map((p) => ({
      ...p,
      price: Number(p.price),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.max(1, Math.ceil(total / limitNum)),
    },
  });
});

router.post('/products', async (req, res) => {
  const {
    name, description, price, oldPrice, stock, categoryId, audience,
    isNew, isPopular, sizes, colors, images,
  } = req.body;

  const validAudience = ['MEN', 'WOMEN', 'KIDS', 'UNISEX'].includes(audience)
    ? audience
    : 'UNISEX';

  const slug = createSlug(name) + '-' + Date.now().toString(36);
  const brandId = await getDefaultBrandId();
  const hasDiscount = oldPrice && Number(oldPrice) > Number(price);

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      oldPrice: oldPrice || null,
      stock: stock || 0,
      categoryId,
      brandId,
      isNew: isNew ?? true,
      isPopular: isPopular || false,
      isSale: hasDiscount || false,
      isRecommended: false,
      audience: validAudience,
      images: images?.length
        ? { create: images.map((url: string, i: number) => ({ url, order: i })) }
        : undefined,
      sizes: sizes?.length
        ? { create: sizes.map((s: { size: string; stock?: number }) => ({ size: s.size, stock: s.stock || 0 })) }
        : undefined,
      colors: colors?.length
        ? { create: colors.map((c: { name: string; hex: string }) => ({ name: c.name, hex: c.hex })) }
        : undefined,
    },
    include: { category: true, brand: true, images: true, sizes: true, colors: true },
  });

  res.status(201).json({ ...product, price: Number(product.price) });
});

router.put('/products/:id', async (req, res) => {
  const {
    name, description, price, oldPrice, stock, categoryId, audience,
    isNew, isPopular, sizes, colors, images,
  } = req.body;

  const hasDiscount = oldPrice && Number(oldPrice) > Number(price);

  await prisma.$transaction(async (tx) => {
    if (sizes?.length) {
      await tx.productSize.deleteMany({ where: { productId: req.params.id } });
    }
    if (colors?.length) {
      await tx.productColor.deleteMany({ where: { productId: req.params.id } });
    }
    if (images?.length) {
      await tx.productImage.deleteMany({ where: { productId: req.params.id } });
    }

    await tx.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(oldPrice !== undefined && { oldPrice }),
        ...(stock !== undefined && { stock }),
        ...(categoryId && { categoryId }),
        ...(isNew !== undefined && { isNew }),
        ...(isPopular !== undefined && { isPopular }),
        ...(audience && ['MEN', 'WOMEN', 'KIDS', 'UNISEX'].includes(audience) && { audience }),
        ...(oldPrice !== undefined && { isSale: hasDiscount || false }),
        ...(images?.length && {
          images: { create: images.map((url: string, i: number) => ({ url, order: i })) },
        }),
        ...(sizes?.length && {
          sizes: { create: sizes.map((s: { size: string; stock?: number }) => ({ size: s.size, stock: s.stock || 0 })) },
        }),
        ...(colors?.length && {
          colors: { create: colors.map((c: { name: string; hex: string }) => ({ name: c.name, hex: c.hex })) },
        }),
      },
    });
  });

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, brand: true, images: true, sizes: true, colors: true },
  });

  res.json({ ...product, price: Number(product!.price) });
});

router.delete('/products/:id', async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Товар удалён' });
});

// Categories CRUD
router.get('/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  res.json(categories);
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description, image } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Введите название категории' });
    const slug = await uniqueCategorySlug(name);
    const category = await prisma.category.create({
      data: { name: name.trim(), slug, description, image: image || null },
    });
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Не удалось создать категорию' });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const id = String(req.params.id);
    const { name, description, image } = req.body;
    const slug = name ? await uniqueCategorySlug(name, id) : undefined;
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim(), slug }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image: image || null }),
      },
    });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Не удалось обновить категорию' });
  }
});

router.delete('/categories/:id', async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ message: 'Категория удалена' });
});

// Brands CRUD
router.get('/brands', async (_req, res) => {
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } });
  res.json(brands);
});

router.post('/brands', async (req, res) => {
  const { name, logo } = req.body;
  const brand = await prisma.brand.create({
    data: { name, slug: createSlug(name), logo },
  });
  res.status(201).json(brand);
});

router.put('/brands/:id', async (req, res) => {
  const { name, logo } = req.body;
  const brand = await prisma.brand.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name, slug: createSlug(name) }),
      ...(logo !== undefined && { logo }),
    },
  });
  res.json(brand);
});

router.delete('/brands/:id', async (req, res) => {
  await prisma.brand.delete({ where: { id: req.params.id } });
  res.json({ message: 'Бренд удален' });
});

async function bannerFromProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
  });
  if (!product) throw new Error('Товар не найден');

  const image = product.images[0]?.url;
  if (!image) throw new Error('У товара нет фото — добавьте изображение');

  const price = Number(product.price);
  const oldPrice = product.oldPrice ? Number(product.oldPrice) : null;
  const subtitle = oldPrice
    ? `${price.toLocaleString('ru-RU')} сом вместо ${oldPrice.toLocaleString('ru-RU')}`
    : `${price.toLocaleString('ru-RU')} сом`;

  return {
    title: product.name,
    subtitle,
    image,
    link: `/product/${product.slug}`,
    productId: product.id,
  };
}

// Banners CRUD
router.get('/banners', async (_req, res) => {
  const banners = await prisma.banner.findMany({
    orderBy: { order: 'asc' },
    include: { product: { select: { id: true, name: true, slug: true } } },
  });
  res.json(banners);
});

router.post('/banners', async (req, res) => {
  try {
    const { productId, title, subtitle, image, link, isActive, order } = req.body;

    let data = { title, subtitle, image, link, productId: productId || null, isActive: isActive ?? true, order: order ?? 0 };

    if (productId) {
      const fromProduct = await bannerFromProduct(String(productId));
      data = { ...data, ...fromProduct, isActive: isActive ?? true, order: order ?? 0 };
    }

    if (!data.title || !data.image) {
      res.status(400).json({ message: 'Выберите товар из каталога' });
      return;
    }

    const banner = await prisma.banner.create({ data });
    res.status(201).json(banner);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Ошибка' });
  }
});

router.put('/banners/:id', async (req, res) => {
  try {
    const { productId, title, subtitle, image, link, isActive, order } = req.body;

    let updateData: Record<string, unknown> = { title, subtitle, image, link, isActive, order };

    if (productId) {
      const fromProduct = await bannerFromProduct(String(productId));
      updateData = { ...updateData, ...fromProduct };
    }

    const banner = await prisma.banner.update({
      where: { id: String(req.params.id) },
      data: updateData,
    });
    res.json(banner);
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Ошибка' });
  }
});

router.delete('/banners/:id', async (req, res) => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  res.json({ message: 'Баннер удален' });
});

// Orders management
router.get('/orders', async (req, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status as Prisma.EnumOrderStatusFilter;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        user: { select: { id: true, name: true, email: true } },
        orderItems: { include: { product: { include: { images: { take: 1 } } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    orders: orders.map((o) => ({
      ...o,
      total: Number(o.total),
      orderItems: o.orderItems.map((i) => ({ ...i, price: Number(i.price) })),
    })),
    pagination: { page: pageNum, limit: limitNum, total },
  });
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const id = String(req.params.id);

    if (!ORDER_STATUSES.includes(status)) {
      res.status(400).json({ message: 'Некорректный статус заказа' });
      return;
    }

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id },
        include: { orderItems: true },
      });
      if (!existing) throw new Error('Заказ не найден');

      if (existing.status === status) {
        return existing;
      }

      const wasCancelled = existing.status === 'CANCELLED';
      const willCancel = status === 'CANCELLED';

      if (!wasCancelled && willCancel) {
        for (const item of existing.orderItems) {
          await restoreStock(tx, item.productId, item.size, item.quantity);
        }
      } else if (wasCancelled && !willCancel) {
        for (const item of existing.orderItems) {
          await decrementStock(tx, item.productId, item.size, item.quantity);
        }
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: {
          user: { select: { id: true, name: true, email: true } },
          orderItems: { include: { product: true } },
        },
      });
    });

    res.json({ ...order, total: Number(order.total) });
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Ошибка' });
  }
});

// Users
router.get('/users', async (req, res) => {
  const { page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      select: {
        id: true, email: true, name: true, avatar: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ]);

  res.json({ users, pagination: { page: pageNum, limit: limitNum, total } });
});

router.get('/users/:id/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.params.id },
    include: { orderItems: { include: { product: { include: { images: { take: 1 } } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders.map((o) => ({ ...o, total: Number(o.total) })));
});

// Upload
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
