import { BusinessRecord } from '../../types';

const PLACEHOLDERS = new Set(['n/a', 'na', 'unknown', 'test', '-', 'none', 'null', 'blank']);

export function isJunkValue(value?: string | null): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || PLACEHOLDERS.has(normalized);
}

export function cleanupText(value?: string): string {
  if (!value) return '';
  return value
    .replace(/[\u200C\u200D]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[“”]/g, '"')
    .trim();
}

export function normalizeBusinessName(value?: string): string {
  const text = cleanupText(value).toLowerCase();
  return text
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCity(value?: string): string {
  const city = cleanupText(value);
  const map: Record<string, string> = {
    baghdad: 'Baghdad',
    بغداد: 'Baghdad',
    erbil: 'Erbil',
    أربيل: 'Erbil',
    arbil: 'Erbil',
    basra: 'Basra',
    البصرة: 'Basra',
    mosul: 'Mosul',
    الموصل: 'Mosul',
    sulaymaniyah: 'Sulaymaniyah',
    السليمانية: 'Sulaymaniyah',
    najaf: 'Najaf',
    النجف: 'Najaf',
    karbala: 'Karbala',
    كربلاء: 'Karbala'
  };
  return map[city.toLowerCase()] || city;
}

export function normalizeCategory(value?: string): string {
  const category = cleanupText(value);
  const map: Record<string, string> = {
    restaurant: 'Restaurant',
    restaurants: 'Restaurant',
    cafe: 'Cafe',
    coffee: 'Cafe',
    pharmacy: 'Pharmacy',
    hotel: 'Hotel',
    supermarket: 'Supermarket',
    gym: 'Gym'
  };
  return map[category.toLowerCase()] || category;
}

export function normalizeAddress(value?: string): string {
  return cleanupText(value)
    .replace(/,/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizePhone(value?: string): string | undefined {
  if (isJunkValue(value)) return undefined;
  const digits = (value || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+964')) return digits;
  if (digits.startsWith('00964')) return `+964${digits.slice(5)}`;
  if (digits.startsWith('964')) return `+${digits}`;
  if (digits.startsWith('0')) return `+964${digits.slice(1)}`;
  if (/^7\d{9}$/.test(digits)) return `+964${digits}`;
  return digits.length >= 8 ? digits : undefined;
}

export function cleanUrl(value?: string): string | undefined {
  if (isJunkValue(value)) return undefined;
  let candidate = cleanupText(value);
  if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    return url.toString();
  } catch {
    return undefined;
  }
}

export function normalizeRecord(raw: Partial<BusinessRecord>): Partial<BusinessRecord> {
  const city = normalizeCity(raw.city);
  const category = normalizeCategory(raw.category);
  const businessName = cleanupText(raw.business_name);

  return {
    ...raw,
    business_name: businessName,
    normalized_business_name: normalizeBusinessName(businessName),
    city,
    category,
    district: cleanupText(raw.district),
    address_text: cleanupText(raw.address_text),
    address_normalized: normalizeAddress(raw.address_text || raw.address_normalized),
    phone_primary: normalizePhone(raw.phone_primary),
    phone_secondary: normalizePhone(raw.phone_secondary),
    whatsapp_number: normalizePhone(raw.whatsapp_number),
    website_url: cleanUrl(raw.website_url),
    facebook_url: cleanUrl(raw.facebook_url),
    instagram_url: cleanUrl(raw.instagram_url),
    tiktok_url: cleanUrl(raw.tiktok_url),
    telegram_url: cleanUrl(raw.telegram_url),
    google_maps_url: cleanUrl(raw.google_maps_url),
    email: isJunkValue(raw.email) ? undefined : cleanupText(raw.email)
  };
}
