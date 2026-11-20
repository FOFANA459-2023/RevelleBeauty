/**
 * The business's public contact details — one place to change them.
 * (Order alerts and the WhatsApp link in emails come from the server's
 * STORE_ORDER_EMAIL / STORE_WHATSAPP settings; keep them in step.)
 */
export const BUSINESS = {
  email: 'officialrevellebeauty@gmail.com',
  whatsappDisplay: '+1 (605) 215-9617',
  /** Digits only, international form, for wa.me links. */
  whatsappDigits: '16052159617',
} as const;

export const whatsappLink = (text?: string): string =>
  `https://wa.me/${BUSINESS.whatsappDigits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
