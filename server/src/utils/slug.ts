export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createSlugWithSuffix(text: string): string {
  const base = createSlug(text);
  const safe = base || 'item';
  return `${safe}-${Date.now().toString(36)}`;
}
