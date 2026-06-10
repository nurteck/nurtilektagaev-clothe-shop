import { Router } from 'express';

import { prisma } from '../config/db.js';

import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  guestOrderCreateLimiter,
  guestOrderLookupLimiter,
} from '../middleware/rateLimit.js';
import { decrementStock, getAvailableStock, normalizePhone } from '../utils/stock.js';

const MAX_ORDERS_PER_PHONE_PER_HOUR = 3;



const router = Router();



function formatOrder(order: {

  id: string;

  status: string;

  total: { toString(): string } | number;

  address: string;

  phone: string;

  comment: string | null;

  createdAt: Date;

  orderItems: Array<{

    id: string;

    quantity: number;

    price: { toString(): string } | number;

    size: string | null;

    color: string | null;

    product: Record<string, unknown>;

  }>;

}) {

  return {

    ...order,

    total: Number(order.total),

    orderItems: order.orderItems.map((item) => ({

      ...item,

      price: Number(item.price),

      product: {

        ...item.product,

        price: Number((item.product as { price: { toString(): string } }).price),

      },

    })),

  };

}



const orderInclude = {

  orderItems: {

    include: {

      product: { include: { images: { take: 1 } } },

    },

  },

} as const;



type OrderItemInput = {

  productId: string;

  quantity: number;

  size?: string;

  color?: string;

};



async function createOrderWithStock(

  data: {

    userId: string | null;

    address: string;

    phone: string;

    comment: string | null;

    items: OrderItemInput[];

  }

) {

  return prisma.$transaction(async (tx) => {

    const orderItemsData: Array<{

      productId: string;

      quantity: number;

      price: number;

      size?: string;

      color?: string;

    }> = [];

    let total = 0;



    for (const item of data.items) {

      if (!item.productId || item.quantity < 1) {

        throw new Error('Некорректные данные товара');

      }

      const size = item.size?.trim() || undefined;

      const product = await tx.product.findUnique({

        where: { id: item.productId },

        include: { sizes: true },

      });

      if (!product) throw new Error('Товар не найден');

      if (product.sizes.length > 0 && !size) {

        throw new Error(`«${product.name}»: выберите размер`);

      }

      const available = await getAvailableStock(item.productId, size, tx);

      if (item.quantity > available) {

        throw new Error(`«${product.name}»: доступно только ${available} шт.`);

      }



      const price = Number(product.price);

      total += price * item.quantity;

      orderItemsData.push({

        productId: item.productId,

        quantity: item.quantity,

        price,

        size,

        color: item.color,

      });

    }



    const order = await tx.order.create({

      data: {

        userId: data.userId,

        total,

        address: data.address,

        phone: data.phone,

        comment: data.comment,

        orderItems: { create: orderItemsData },

      },

      include: orderInclude,

    });



    for (const item of orderItemsData) {

      await decrementStock(tx, item.productId, item.size ?? undefined, item.quantity);

    }



    return order;

  });

}



router.post('/guest', guestOrderCreateLimiter, async (req, res) => {

  try {

    const { address, phone, comment, items } = req.body as {

      address?: string;

      phone?: string;

      comment?: string;

      items?: OrderItemInput[];

    };



    if (!address?.trim()) {

      return res.status(400).json({ message: 'Укажите адрес доставки' });

    }



    const normalizedPhone = phone ? normalizePhone(phone) : null;

    if (!normalizedPhone) {

      return res.status(400).json({ message: 'Укажите корректный телефон: +996 XXX XXX XXX' });

    }



    if (!items?.length) {

      return res.status(400).json({ message: 'Корзина пуста' });

    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentByPhone = await prisma.order.count({
      where: { phone: normalizedPhone, createdAt: { gte: hourAgo } },
    });
    if (recentByPhone >= MAX_ORDERS_PER_PHONE_PER_HOUR) {
      return res.status(429).json({
        message: 'С этого номера уже оформлено несколько заказов за час. Подождите или свяжитесь с нами.',
      });
    }

    const order = await createOrderWithStock({

      userId: null,

      address: address.trim(),

      phone: normalizedPhone,

      comment: comment || null,

      items,

    });



    res.status(201).json(formatOrder(order));

  } catch (err) {

    const message = err instanceof Error ? err.message : 'Ошибка оформления заказа';

    res.status(400).json({ message });

  }

});



router.get('/guest', guestOrderLookupLimiter, async (req, res) => {

  const ids = String(req.query.ids || '')

    .split(',')

    .map((id) => id.trim())

    .filter(Boolean);

  const phoneRaw = String(req.query.phone || '').trim();

  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;



  if (!phone) {

    return res.json([]);

  }



  const where: { phone: string; id?: { in: string[] } } = { phone };

  if (ids.length) where.id = { in: ids };



  const orders = await prisma.order.findMany({

    where,

    include: orderInclude,

    orderBy: { createdAt: 'desc' },

  });



  res.json(orders.map(formatOrder));

});



router.use(authenticate);



router.get('/', async (req: AuthRequest, res) => {

  const orders = await prisma.order.findMany({

    where: { userId: req.user!.userId },

    include: orderInclude,

    orderBy: { createdAt: 'desc' },

  });



  res.json(orders.map(formatOrder));

});



router.get('/:id', async (req: AuthRequest, res) => {

  const id = String(req.params.id);

  const order = await prisma.order.findFirst({

    where: { id, userId: req.user!.userId },

    include: {

      orderItems: {

        include: {

          product: { include: { images: { take: 1 }, brand: true } },

        },

      },

    },

  });



  if (!order) return res.status(404).json({ message: 'Заказ не найден' });

  res.json(formatOrder(order));

});



router.post('/', async (req: AuthRequest, res) => {

  try {

    const { address, phone, comment } = req.body;

    if (!address || !String(address).trim()) {

      return res.status(400).json({ message: 'Укажите адрес доставки' });

    }



    const cartItems = await prisma.cartItem.findMany({

      where: { userId: req.user!.userId },

      include: { product: true },

    });



    if (cartItems.length === 0) {

      return res.status(400).json({ message: 'Корзина пуста' });

    }



    const normalizedPhone = phone ? normalizePhone(phone) : null;

    if (!normalizedPhone) {

      return res.status(400).json({ message: 'Укажите корректный телефон' });

    }



    const order = await createOrderWithStock({

      userId: req.user!.userId,

      address: address.trim(),

      phone: normalizedPhone,

      comment: comment || null,

      items: cartItems.map((item) => ({

        productId: item.productId,

        quantity: item.quantity,

        size: item.size || undefined,

        color: item.color || undefined,

      })),

    });



    await prisma.cartItem.deleteMany({ where: { userId: req.user!.userId } });

    res.status(201).json(formatOrder(order));

  } catch (err) {

    const message = err instanceof Error ? err.message : 'Ошибка оформления заказа';

    res.status(400).json({ message });

  }

});



export default router;

