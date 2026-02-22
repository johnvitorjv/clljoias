/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export const CATEGORY_LINES = [
  "Pratas 925",
  "Relógios",
  "Semi-joias",
  "Tornozeleiras",
  "Personalizados",
  "Personalizados Pet",
] as const;

export const MATERIALS = [
  "Prata 925",
  "Semijoias",
  "Aço Inox",
] as const;

export const ACCESSORY_TYPES = [
  "Anéis",
  "Brincos",
  "Colares",
  "Pulseiras",
  "Tornozeleiras",
  "Relógios",
  "Conjuntos",
  "Chokers",
  "Pingentes",
  "Outros",
] as const;

export type CategoryLine = typeof CATEGORY_LINES[number];
export type Material = typeof MATERIALS[number];
export type AccessoryType = typeof ACCESSORY_TYPES[number];

export const FREE_SHIPPING_THRESHOLD = 199.90;
export const WHATSAPP_NUMBER = "5571992273149";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
export const INSTAGRAM_HANDLE = "@cll.joias";

export interface CartItem {
  productId: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  image?: string;
  quantity: number;
  notes?: string;
}

export interface ShippingOption {
  method: string;
  label: string;
  price: number;
  days?: number;
  description?: string;
}

export const LOCAL_CITIES = ["Salvador", "Lauro de Freitas", "Simões Filho"];

export const ADMIN_COOKIE_NAME = "admin_session";

// ===== VALIDATION HELPERS =====
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(cleaned[10]);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  // Accept 10 or 11 digits (DDD + 8 or 9 digits)
  return cleaned.length >= 10 && cleaned.length <= 11;
}

export function formatCPF(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

export function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 11);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

export function formatCEP(value: string): string {
  const cleaned = value.replace(/\D/g, "").slice(0, 8);
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
}
