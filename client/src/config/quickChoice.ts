export interface QuickChoiceCard {
  id: string;
  title: string;
  subtitle: string;
  link: string;
  /** Файл из папки img/ в корне проекта, например nav-novinki.jpg */
  image?: string;
  badgeText?: string;
  badgeIcon?: string;
  promo?: string;
}

/** Положите фото в clothe-shop-cursor/img/ с этими именами */
export const QUICK_CHOICE_CARDS: QuickChoiceCard[] = [
  {
    id: 'new',
    title: 'Новинки',
    subtitle: 'Новые поступления',
    link: '/feed?isNew=true',
    image: '/img/nav-novinki.png',
    badgeText: 'СВЕЖИЕ ОБРАЗЫ',
    badgeIcon: '❄',
  },
  {
    id: 'sale',
    title: 'Акции',
    subtitle: 'Скидки до 25%',
    link: '/feed?isSale=true',
    image: '/img/nav-akcii.png',
    promo: '-25%',
  },
  {
    id: 'popular',
    title: 'Хиты',
    subtitle: 'Популярные товары',
    link: '/feed?sort=popular&onlyOrdered=true',
    image: '/img/nav-hity.png',
    badgeText: 'Выбор покупателей',
    badgeIcon: '👑',
  },
  {
    id: 'catalog',
    title: 'Каталог',
    subtitle: 'Вся коллекция',
    link: '/catalog',
    image: '/img/nav-katalog.png',
  },
];
