/** Номер WhatsApp продавца (только цифры, без +) */
export const WHATSAPP_PHONE = (
  import.meta.env.VITE_WHATSAPP_PHONE || '996553343210'
).replace(/\D/g, '');

function formatKgPhone(digits: string): string {
  const local = digits.startsWith('996') ? digits.slice(3) : digits;
  if (local.length !== 9) return `+${digits}`;
  return `+996 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 9)}`;
}

export const WHATSAPP_PHONE_DISPLAY = formatKgPhone(WHATSAPP_PHONE);

export function getWhatsAppUrl(text?: string): string {
  const base = `https://wa.me/${WHATSAPP_PHONE}`;
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
