export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  _count?: { products: number };
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
  order: number;
}

export interface ProductSize {
  id: string;
  size: string;
  stock: number;
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar?: string | null };
}

export type ProductAudience = 'MEN' | 'WOMEN' | 'KIDS' | 'UNISEX';

export const AUDIENCE_LABELS: Record<ProductAudience, string> = {
  MEN: 'Мужское',
  WOMEN: 'Женское',
  KIDS: 'Детское',
  UNISEX: 'Унисекс',
};

export const AUDIENCE_OPTIONS: { value: ProductAudience; label: string }[] = [
  { value: 'MEN', label: 'Мужское' },
  { value: 'WOMEN', label: 'Женское' },
  { value: 'KIDS', label: 'Детское' },
];

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  audience: ProductAudience;
  isNew: boolean;
  isPopular: boolean;
  isSale: boolean;
  isRecommended: boolean;
  category: Category;
  brand: Brand;
  images: ProductImage[];
  sizes: ProductSize[];
  colors: ProductColor[];
  reviews?: Review[];
  avgRating?: number;
  reviewCount?: number;
  favoriteId?: string;
}

export interface HomeNavCard {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  image?: string | null;
  link: string;
  badgeText?: string | null;
  badgeIcon?: string | null;
  promo?: string | null;
  order: number;
  isActive: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  image: string;
  link?: string | null;
  productId?: string | null;
  product?: { id: string; name: string; slug: string } | null;
  isActive: boolean;
  order: number;
}

export interface CartItem {
  id: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  product: Product;
}

export interface Order {
  id: string;
  status: 'NEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  address: string;
  phone: string;
  comment?: string | null;
  createdAt: string;
  orderItems: OrderItem[];
  user?: User;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  product: Product;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages?: number;
}

export const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  NEW: 'Новый',
  PROCESSING: 'В обработке',
  SHIPPED: 'Отправлен',
  DELIVERED: 'Завершён',
  CANCELLED: 'Отменён',
};
