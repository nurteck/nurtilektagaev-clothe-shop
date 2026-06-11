import type { Product, ProductVariant } from '../types';
import {
  CLOTHING_SIZES,
  SHOE_SIZES,
  type SizePreset,
  defaultSizeRows,
  mergeSizeRows,
} from './sizes';

export interface ColorGroup {
  name: string;
  hex: string;
  imageUrl: string;
  sizes: { size: string; stock: string }[];
}

export interface VariantInput {
  size: string;
  color: string;
  stock: string;
}

export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Белый', hex: '#FFFFFF' },
  { name: 'Чёрный', hex: '#111111' },
  { name: 'Серый', hex: '#9CA3AF' },
  { name: 'Синий', hex: '#2563EB' },
  { name: 'Красный', hex: '#DC2626' },
];

export function defaultSizesForPreset(preset: SizePreset): { size: string; stock: string }[] {
  return defaultSizeRows(preset);
}

export function newColorGroup(preset: SizePreset, presetColor?: { name: string; hex: string }): ColorGroup {
  return {
    name: presetColor?.name ?? '',
    hex: presetColor?.hex ?? '#FFFFFF',
    imageUrl: '',
    sizes: defaultSizesForPreset(preset),
  };
}

export function colorGroupsFromProduct(product: Product, preset: SizePreset): ColorGroup[] {
  if (product.colors.length === 0) return [];

  const sizeList =
    preset === 'shoes'
      ? [...SHOE_SIZES]
      : [...new Set(product.variants.map((v) => v.size))].filter(Boolean);

  const sizes = sizeList.length ? sizeList : CLOTHING_SIZES;

  return product.colors.map((c) => ({
    name: c.name,
    hex: c.hex,
    imageUrl: c.imageUrl || '',
    sizes: sizes.map((size) => {
      const found = product.variants.find((v) => v.size === size && v.color === c.name);
      return { size, stock: String(found?.stock ?? 0) };
    }),
  }));
}

export function noColorSizesFromProduct(product: Product, preset: SizePreset): { size: string; stock: string }[] {
  const existing = product.variants
    .filter((v) => !v.color)
    .map((v) => ({ size: v.size, stock: String(v.stock) }));

  if (existing.length) return mergeSizeRows(existing, preset);
  if (product.variants.length) {
    return product.variants.map((v) => ({ size: v.size, stock: String(v.stock) }));
  }
  return defaultSizesForPreset(preset);
}

export function buildPayloadFromColorGroups(
  colorGroups: ColorGroup[],
  noColorSizes: { size: string; stock: string }[]
): {
  colors: { name: string; hex: string; imageUrl?: string }[];
  variants: { size: string; color?: string; stock: number }[];
} {
  if (colorGroups.length === 0) {
    const variants = noColorSizes
      .filter((s) => s.size.trim())
      .map((s) => ({
        size: s.size.trim(),
        stock: parseInt(s.stock || '0', 10),
      }))
      .filter((v) => v.stock > 0);

    return { colors: [], variants };
  }

  const colors = colorGroups
    .filter((g) => g.name.trim())
    .map((g) => ({
      name: g.name.trim(),
      hex: g.hex.trim(),
      imageUrl: g.imageUrl.trim() || undefined,
    }));

  const colorNames = new Set(colors.map((c) => c.name));
  const variants = colorGroups
    .filter((g) => g.name.trim() && colorNames.has(g.name.trim()))
    .flatMap((g) =>
      g.sizes
        .filter((s) => s.size.trim())
        .map((s) => ({
          size: s.size.trim(),
          color: g.name.trim(),
          stock: parseInt(s.stock || '0', 10),
        }))
        .filter((v) => v.stock > 0)
    );

  return { colors, variants };
}

export function getVariantStock(
  variants: ProductVariant[],
  size: string,
  color?: string
): number {
  const colorKey = color?.trim() || '';
  const found = variants.find((v) => v.size === size && v.color === colorKey);
  return found?.stock ?? 0;
}

export function getSizesForColor(
  product: Product,
  selectedColor: string,
  preset: SizePreset
): { size: string; stock: number; id: string }[] {
  const sizes =
    preset === 'shoes'
      ? [...SHOE_SIZES]
      : [...new Set(product.variants.map((v) => v.size))].filter(Boolean);

  const list = sizes.length ? sizes : product.variants.map((v) => v.size);
  const colorKey = product.colors.length > 0 ? selectedColor : '';

  return list.map((size) => {
    const stock = getVariantStock(product.variants, size, colorKey);
    const variant = product.variants.find(
      (v) => v.size === size && v.color === colorKey
    );
    return { size, stock, id: variant?.id ?? `${size}-${colorKey}` };
  });
}

export function firstAvailableSize(product: Product, selectedColor: string, preset: SizePreset): string {
  const displayed = getSizesForColor(product, selectedColor, preset);
  const available = displayed.find((s) => s.stock > 0);
  return available?.size ?? displayed[0]?.size ?? '';
}

export function getColorPreviewUrl(
  product: Product,
  color: { name: string; hex: string; imageUrl?: string | null }
): string {
  if (color.imageUrl) return color.imageUrl;
  return product.images[0]?.url || '';
}

export function getProductDisplayImage(
  product: Product | null | undefined,
  selectedColor = ''
): string {
  if (!product) return '';
  const colors = product.colors ?? [];
  const images = product.images ?? [];
  if (selectedColor) {
    const color = colors.find((c) => c.name === selectedColor);
    if (color?.imageUrl) return color.imageUrl;
  }
  const firstColorImg = colors.find((c) => c.imageUrl)?.imageUrl;
  return images[0]?.url || firstColorImg || '';
}

export function getProductGalleryUrls(product: Product, selectedColor = ''): string[] {
  const colorImg = selectedColor
    ? product.colors.find((c) => c.name === selectedColor)?.imageUrl
    : null;
  const main = product.images.map((i) => i.url);
  if (colorImg) {
    const rest = main.filter((u) => u !== colorImg);
    return [colorImg, ...rest];
  }
  return main;
}

export { defaultSizeRows, mergeSizeRows };
