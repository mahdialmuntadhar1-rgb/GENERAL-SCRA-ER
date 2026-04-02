// ============================================================
// Normalization Engine for Iraqi Business Data
// Handles: phone, name, address, website, social, dedupe keys
// ============================================================

// --- PHONE NORMALIZATION ---
// Iraqi numbers must be 11 digits: +964 7XX XXXX XXX

const IRAQI_MOBILE_PREFIXES = ['750', '751', '770', '771', '772', '773', '780', '781', '782', '783', '784', '785', '786', '790', '791', '793', '794', '795', '796'];
const IRAQI_LANDLINE_PREFIXES = ['30', '31', '32', '33', '34', '36', '37', '40', '42', '43', '50', '53', '60', '62', '66'];

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Strip everything except digits and leading +
  let digits = raw.replace(/[^\d+]/g, '');
  
  // Remove leading +
  if (digits.startsWith('+')) digits = digits.slice(1);
  
  // Remove leading 00
  if (digits.startsWith('00')) digits = digits.slice(2);
  
  // Handle 964 prefix
  if (digits.startsWith('964')) digits = digits.slice(3);
  
  // Handle leading 0 (local format)
  if (digits.startsWith('0')) digits = digits.slice(1);
  
  // Mobile: should now be 10 digits starting with 7XX
  if (digits.length === 10 && digits.startsWith('7')) {
    const prefix = digits.slice(0, 3);
    if (IRAQI_MOBILE_PREFIXES.includes(prefix)) {
      return `+964${digits}`;
    }
  }
  
  // Landline: various lengths, prefix with area code
  if (digits.length >= 7 && digits.length <= 10) {
    for (const lp of IRAQI_LANDLINE_PREFIXES) {
      if (digits.startsWith(lp)) {
        return `+964${digits}`;
      }
    }
  }
  
  // If it looks like a full international number already
  if (digits.length === 13 && digits.startsWith('964')) {
    return `+${digits}`;
  }
  
  // Return cleaned version if it has enough digits (might be valid)
  if (digits.length >= 10) {
    return `+964${digits.slice(-10)}`;
  }
  
  return null;
}

// --- NAME NORMALIZATION ---
// Remove diacritics, normalize Arabic/Kurdish variations, lowercase

const ARABIC_NORMALIZATIONS: [RegExp, string][] = [
  [/[إأآا]/g, 'ا'],
  [/[ة]/g, 'ه'],
  [/[ي]/g, 'ى'],
  [/[ؤ]/g, 'و'],
  [/[ئ]/g, 'ى'],
  [/[\u064B-\u065F\u0670]/g, ''],  // Remove Arabic diacritics (tashkeel)
  [/[\u0640]/g, ''],                // Remove tatweel
];

const JUNK_WORDS = ['unknown', 'n/a', 'na', 'none', '-', '.', '...', 'null', 'undefined', 'test'];

export function normalizeName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  
  let name = raw.trim();
  
  // Check if junk
  if (JUNK_WORDS.includes(name.toLowerCase())) return null;
  if (name.length < 2) return null;
  
  // Normalize Arabic characters
  for (const [pattern, replacement] of ARABIC_NORMALIZATIONS) {
    name = name.replace(pattern, replacement);
  }
  
  // Lowercase, collapse whitespace
  name = name.toLowerCase().replace(/\s+/g, ' ').trim();
  
  return name;
}

// --- WEBSITE NORMALIZATION ---

export function normalizeWebsite(raw: string | null | undefined): string | null {
  if (!raw) return null;
  
  let url = raw.trim().toLowerCase();
  
  // Check junk
  if (JUNK_WORDS.includes(url)) return null;
  if (url.length < 5) return null;
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Remove trailing slash
  url = url.replace(/\/+$/, '');
  
  // Remove www.
  url = url.replace(/^(https?:\/\/)www\./, '$1');
  
  // Remove tracking params
  try {
    const parsed = new URL(url);
    // Keep only the origin + pathname
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
  } catch {
    return url;
  }
}

// --- SOCIAL MEDIA NORMALIZATION ---

export function normalizeInstagram(raw: string | null | undefined): string | null {
  if (!raw) return null;
  
  let handle = raw.trim().toLowerCase();
  
  // Extract from URL
  const igMatch = handle.match(/instagram\.com\/([a-z0-9._]+)/i);
  if (igMatch) handle = igMatch[1];
  
  // Remove @ prefix
  handle = handle.replace(/^@/, '');
  
  // Remove trailing /
  handle = handle.replace(/\/+$/, '');
  
  // Validate: alphanumeric, dots, underscores, 1-30 chars
  if (/^[a-z0-9._]{1,30}$/.test(handle) && !JUNK_WORDS.includes(handle)) {
    return handle;
  }
  
  return null;
}

export function normalizeFacebook(raw: string | null | undefined): string | null {
  if (!raw) return null;
  
  let handle = raw.trim().toLowerCase();
  
  // Extract from URL
  const fbMatch = handle.match(/facebook\.com\/(?:pages\/)?([a-z0-9._-]+)/i);
  if (fbMatch) handle = fbMatch[1];
  
  // Remove trailing /
  handle = handle.replace(/\/+$/, '');
  
  // Remove profile.php?id= style
  const idMatch = handle.match(/profile\.php\?id=(\d+)/);
  if (idMatch) return `fb_id:${idMatch[1]}`;
  
  if (handle.length > 1 && !JUNK_WORDS.includes(handle)) {
    return handle;
  }
  
  return null;
}

// --- ADDRESS NORMALIZATION ---

export function normalizeAddress(raw: string | null | undefined): string | null {
  if (!raw) return null;
  
  let addr = raw.trim();
  
  if (JUNK_WORDS.includes(addr.toLowerCase())) return null;
  if (addr.length < 3) return null;
  
  // Normalize Arabic
  for (const [pattern, replacement] of ARABIC_NORMALIZATIONS) {
    addr = addr.replace(pattern, replacement);
  }
  
  // Collapse whitespace, commas
  addr = addr.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim();
  
  return addr.toLowerCase();
}

// --- COMPLETENESS SCORING ---
// 0-100 based on field presence and quality

export interface CompletenessInput {
  name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  governorate?: string | null;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  facebook?: string | null;
  instagram?: string | null;
  maps_url?: string | null;
}

export function calculateCompleteness(biz: CompletenessInput): number {
  let score = 0;
  
  // Name: 10 points
  if (biz.name && biz.name.length > 2) score += 10;
  
  // Phone: 20 points (most valuable for Iraqi businesses)
  if (biz.phone && biz.phone.length > 8) score += 20;
  
  // WhatsApp: 10 points
  if (biz.whatsapp && biz.whatsapp.length > 8) score += 10;
  
  // Address: 15 points
  if (biz.address && biz.address.length > 5) score += 15;
  
  // City: 5 points
  if (biz.city && biz.city.length > 1) score += 5;
  
  // Governorate: 5 points
  if (biz.governorate && biz.governorate.length > 1) score += 5;
  
  // Category: 5 points
  if (biz.category && biz.category.length > 1) score += 5;
  
  // Coordinates: 10 points
  if (biz.latitude && biz.longitude) score += 10;
  
  // Website: 5 points
  if (biz.website && biz.website.length > 5) score += 5;
  
  // Email: 5 points
  if (biz.email && biz.email.includes('@')) score += 5;
  
  // Social media: 5 points each (max 10)
  let socialScore = 0;
  if (biz.facebook) socialScore += 5;
  if (biz.instagram) socialScore += 5;
  score += Math.min(socialScore, 10);
  
  return Math.min(score, 100);
}

// --- DEDUPE KEY GENERATION ---
// Priority: phone > website > social > name+city+category

export function generateDedupeKey(biz: {
  normalized_phone?: string | null;
  normalized_website?: string | null;
  normalized_instagram?: string | null;
  normalized_facebook?: string | null;
  normalized_name?: string | null;
  city?: string | null;
  category?: string | null;
}): string {
  // Priority 1: Phone (strongest identifier)
  if (biz.normalized_phone) {
    return `phone:${biz.normalized_phone}`;
  }
  
  // Priority 2: Website
  if (biz.normalized_website) {
    return `web:${biz.normalized_website}`;
  }
  
  // Priority 3: Instagram
  if (biz.normalized_instagram) {
    return `ig:${biz.normalized_instagram}`;
  }
  
  // Priority 4: Facebook
  if (biz.normalized_facebook) {
    return `fb:${biz.normalized_facebook}`;
  }
  
  // Priority 5: Name + City + Category composite
  const parts = [
    biz.normalized_name || '',
    (biz.city || '').toLowerCase().trim(),
    (biz.category || '').toLowerCase().trim(),
  ].filter(Boolean);
  
  if (parts.length >= 2) {
    return `name:${parts.join('|')}`;
  }
  
  // Fallback: random (will never match)
  return `unknown:${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// --- FULL NORMALIZATION PIPELINE ---
// Takes raw business data, returns cleaned + normalized version

export interface RawBusinessInput {
  business_name?: string | null;
  business_name_en?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  governorate?: string | null;
  category?: string | null;
  subcategory?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  facebook?: string | null;
  instagram?: string | null;
  maps_url?: string | null;
  source?: string;
  source_confidence?: number;
  raw_data?: Record<string, unknown>;
}

export interface NormalizedBusiness {
  business_name: string;
  business_name_en: string | null;
  normalized_name: string | null;
  phone: string | null;
  normalized_phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  normalized_website: string | null;
  address: string | null;
  normalized_address: string | null;
  city: string | null;
  governorate: string | null;
  country: string;
  category: string | null;
  subcategory: string | null;
  latitude: number | null;
  longitude: number | null;
  facebook: string | null;
  normalized_facebook: string | null;
  instagram: string | null;
  normalized_instagram: string | null;
  maps_url: string | null;
  dedupe_key: string;
  completeness_score: number;
  source: string;
  source_confidence: number;
  raw_data: Record<string, unknown> | null;
}

export function normalizeBusiness(raw: RawBusinessInput): NormalizedBusiness | null {
  const name = raw.business_name?.trim();
  if (!name || name.length < 2) return null;
  
  const normalizedPhone = normalizePhone(raw.phone);
  const normalizedWhatsapp = normalizePhone(raw.whatsapp);
  const normalizedWebsite = normalizeWebsite(raw.website);
  const normalizedFb = normalizeFacebook(raw.facebook);
  const normalizedIg = normalizeInstagram(raw.instagram);
  const normalizedName = normalizeName(name);
  const normalizedAddr = normalizeAddress(raw.address);
  
  const completeness = calculateCompleteness({
    name,
    phone: normalizedPhone,
    whatsapp: normalizedWhatsapp,
    email: raw.email,
    website: normalizedWebsite,
    address: raw.address,
    city: raw.city,
    governorate: raw.governorate,
    category: raw.category,
    latitude: raw.latitude,
    longitude: raw.longitude,
    facebook: normalizedFb,
    instagram: normalizedIg,
    maps_url: raw.maps_url,
  });
  
  const dedupeKey = generateDedupeKey({
    normalized_phone: normalizedPhone,
    normalized_website: normalizedWebsite,
    normalized_instagram: normalizedIg,
    normalized_facebook: normalizedFb,
    normalized_name: normalizedName,
    city: raw.city,
    category: raw.category,
  });
  
  return {
    business_name: name,
    business_name_en: raw.business_name_en?.trim() || null,
    normalized_name: normalizedName,
    phone: normalizedPhone || raw.phone?.trim() || null,
    normalized_phone: normalizedPhone,
    whatsapp: normalizedWhatsapp || raw.whatsapp?.trim() || null,
    email: raw.email?.trim()?.toLowerCase() || null,
    website: raw.website?.trim() || null,
    normalized_website: normalizedWebsite,
    address: raw.address?.trim() || null,
    normalized_address: normalizedAddr,
    city: raw.city?.trim() || null,
    governorate: raw.governorate?.trim() || null,
    country: 'Iraq',
    category: raw.category?.trim() || null,
    subcategory: raw.subcategory?.trim() || null,
    latitude: raw.latitude || null,
    longitude: raw.longitude || null,
    facebook: raw.facebook?.trim() || null,
    normalized_facebook: normalizedFb,
    instagram: raw.instagram?.trim() || null,
    normalized_instagram: normalizedIg,
    maps_url: raw.maps_url?.trim() || null,
    dedupe_key: dedupeKey,
    completeness_score: completeness,
    source: raw.source || 'osm',
    source_confidence: raw.source_confidence || 50,
    raw_data: raw.raw_data || null,
  };
}
