export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  let normalized = digits;
  if (normalized.startsWith('996')) normalized = normalized.slice(3);
  if (normalized.length !== 9) return null;
  return `+996${normalized}`;
}

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('996')) local = local.slice(3);
  local = local.slice(0, 9);
  if (!local.length) return '+996 ';
  const parts = [local.slice(0, 3), local.slice(3, 6), local.slice(6, 9)].filter(Boolean);
  return `+996 ${parts.join(' ')}`.trim();
}
