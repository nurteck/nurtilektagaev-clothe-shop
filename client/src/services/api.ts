import { getWhatsAppUrl } from '../config/contact';
import { compressImageFile } from '../utils/imageCompress';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('oshop_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Ошибка запроса' }));
    throw new Error(error.message || 'Ошибка запроса');
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  upload: async (file: File): Promise<{ url: string }> => {
    const token = getToken();
    let compressed: Blob;
    try {
      compressed = await compressImageFile(file);
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Не удалось обработать фото');
    }

    const formData = new FormData();
    formData.append('image', compressed, 'photo.jpg');

    const res = await fetch(`${API_URL}/admin/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Ошибка загрузки' }));
      throw new Error(error.message || 'Ошибка загрузки');
    }
    return res.json();
  },
};

/** URL для img src: /api/media, /uploads, data: и внешние ссылки */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (url.startsWith('/api/')) return url;
  return url.startsWith('/') ? url : `/${url}`;
}

export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat('ru-KG', { maximumFractionDigits: 0 }).format(price)} сом`;
}

export { getWhatsAppUrl };

export interface WhatsAppOrderDetails {
  name: string;
  slug?: string;
  color?: string;
  size?: string;
  quantity?: number;
  price?: number;
}

export function buildWhatsAppOrderMessage(details: WhatsAppOrderDetails): string {
  const lines = ['Здравствуйте!', '', 'Хочу заказать:'];
  lines.push(`Товар: ${details.name}`);
  if (details.color) lines.push(`Цвет: ${details.color}`);
  if (details.size) lines.push(`Размер: ${details.size}`);
  if (details.quantity) lines.push(`Количество: ${details.quantity} шт.`);
  if (details.price) lines.push(`Сумма: ${formatPrice(details.price)}`);
  if (details.slug && typeof window !== 'undefined') {
    lines.push('', `Ссылка: ${window.location.origin}/product/${details.slug}`);
  }
  lines.push('', 'Можно оформить заказ?');
  return lines.join('\n');
}

export function getWhatsAppOrderLink(details: WhatsAppOrderDetails): string {
  return getWhatsAppUrl(buildWhatsAppOrderMessage(details));
}

export function getWhatsAppLink(productName: string): string {
  return getWhatsAppUrl(`Здравствуйте! Хочу заказать: ${productName}`);
}
