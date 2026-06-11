import { prisma } from '../config/db.js';

export const DEFAULT_HOME_NAV = [
  {
    slug: 'new',
    title: 'Новинки',
    subtitle: 'Новые поступления',
    link: '/feed?isNew=true',
    badgeText: 'СВЕЖИЕ ОБРАЗЫ',
    badgeIcon: '❄',
    order: 0,
  },
  {
    slug: 'sale',
    title: 'Акции',
    subtitle: 'Скидки до 25%',
    link: '/feed?isSale=true',
    promo: '-25%',
    order: 1,
  },
  {
    slug: 'popular',
    title: 'Хиты',
    subtitle: 'Популярные товары',
    link: '/feed?sort=popular&onlyOrdered=true',
    badgeText: 'Выбор покупателей',
    badgeIcon: '👑',
    order: 2,
  },
  {
    slug: 'catalog',
    title: 'Каталог',
    subtitle: 'Вся коллекция',
    link: '/catalog',
    order: 3,
  },
] as const;

export async function ensureHomeNavCards() {
  for (const item of DEFAULT_HOME_NAV) {
    await prisma.homeNavCard.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle,
        link: item.link,
        badgeText: 'badgeText' in item ? item.badgeText : null,
        badgeIcon: 'badgeIcon' in item ? item.badgeIcon : null,
        promo: 'promo' in item ? item.promo : null,
        order: item.order,
      },
    });
  }
}
