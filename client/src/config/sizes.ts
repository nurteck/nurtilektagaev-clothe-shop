import type { Category, Product } from '../types';
import { getSizesForColor, getVariantStock } from './variants';

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

export function getProductSizesForDisplay(
  product: Product,
  selectedColor = ''
): DisplaySize[] {
  const preset = getSizePreset(product.category);
  return getSizesForColor(product, selectedColor, preset);
}

export function firstAvailableSize(product: Product, selectedColor = ''): string {
  const displayed = getProductSizesForDisplay(product, selectedColor);
  const available = displayed.find((s) => s.stock > 0);
  return available?.size ?? displayed[0]?.size ?? '';
}

export function getStockForSize(
  product: Product,
  size: string,
  selectedColor = ''
): number {
  if (!size) return product.stock;
  const colorKey = product.colors.length > 0 ? selectedColor : '';
  return getVariantStock(product.variants, size, colorKey);
}

export function getMaxStock(product: Product, size: string, selectedColor = ''): number {
  return getStockForSize(product, size, selectedColor);
}
