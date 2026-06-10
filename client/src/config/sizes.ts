import type { Category, Product } from '../types';

export type SizePreset = 'clothing' | 'shoes';

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43'] as const;

export function isShoeCategory(category?: Category | null): boolean {
  if (!category) return false;
  const text = `${category.name} ${category.slug}`.toLowerCase();
  return /обув|shoe|footwear|кросс|ботин|сапог|тапк|кед|сандал|туфл|слипон|мокасин/.test(text);
}

export function isShoeProduct(product: Product): boolean {
  return isShoeCategory(product.category);
}

export function getSizePreset(category?: Category | null): SizePreset {
  return isShoeCategory(category) ? 'shoes' : 'clothing';
}

export function defaultSizeRows(preset: SizePreset = 'clothing'): { size: string; stock: string }[] {
  const list = preset === 'shoes' ? SHOE_SIZES : CLOTHING_SIZES;
  return list.map((size) => ({ size, stock: '0' }));
}

export function mergeSizeRows(
  existing: { size: string; stock: string }[],
  preset: SizePreset
): { size: string; stock: string }[] {
  if (preset === 'shoes') {
    const stockMap = new Map(existing.map((r) => [r.size, r.stock]));
    return SHOE_SIZES.map((size) => ({
      size,
      stock: stockMap.get(size) ?? '0',
    }));
  }
  if (existing.length > 0) {
    return existing.filter((r) => r.size.trim());
  }
  return defaultSizeRows('clothing');
}

export interface DisplaySize {
  size: string;
  stock: number;
  id: string;
}

export function displayShoeSizes(
  productSizes: { id: string; size: string; stock: number }[]
): DisplaySize[] {
  const map = new Map(productSizes.map((s) => [s.size, s]));
  return SHOE_SIZES.map((size) => {
    const found = map.get(size);
    return {
      size,
      stock: found?.stock ?? 0,
      id: found?.id ?? size,
    };
  });
}

export function firstAvailableSize(
  product: Product
): string {
  if (isShoeProduct(product)) {
    const displayed = displayShoeSizes(product.sizes);
    const available = displayed.find((s) => s.stock > 0);
    return available?.size ?? SHOE_SIZES[0];
  }
  const available = product.sizes.find((s) => s.stock > 0);
  return available?.size ?? product.sizes[0]?.size ?? '';
}

export function getProductSizesForDisplay(product: Product): DisplaySize[] {
  if (isShoeProduct(product)) {
    return displayShoeSizes(product.sizes);
  }
  return product.sizes.map((s) => ({
    size: s.size,
    stock: s.stock,
    id: s.id,
  }));
}

export function getStockForSize(product: Product, size: string): number {
  if (!size) return product.stock;
  if (isShoeProduct(product)) {
    return displayShoeSizes(product.sizes).find((s) => s.size === size)?.stock ?? 0;
  }
  return product.sizes.find((s) => s.size === size)?.stock ?? product.stock;
}
