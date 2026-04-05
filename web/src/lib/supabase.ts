import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SCRAPER_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  "https://placeholder.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SCRAPER_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "placeholder";

export const supabaseConfigured = !!(
  import.meta.env.VITE_SCRAPER_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
  },
});

// HUMUS Business schema - matches exactly what the HUMUS app reads
export type Business = {
  id?: string | number;     // int8, auto-generated
  name: string;            // REQUIRED
  nameAr?: string;         // Arabic name
  nameKu?: string;         // Kurdish name
  category: string;        // REQUIRED — must be one of the 9 HUMUS category IDs
  subcategory?: string;
  phone?: string;          // REQUIRED for pushing
  whatsapp?: string;
  website?: string;
  address?: string;
  city?: string;
  governorate?: string;    // Must match HUMUS governorate values
  lat?: number;            // NOTE: column is `lat` NOT `latitude`
  lng?: number;            // NOTE: column is `lng` NOT `longitude`
  rating?: number;         // 0-5
  reviewCount?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  imageUrl?: string;
  coverImage?: string;
  description?: string;
  descriptionAr?: string;
  descriptionKu?: string;
  openHours?: string;
  priceRange?: 1 | 2 | 3 | 4;
  tags?: string[];         // text array
  status?: string;
  distance?: number;

  // Internal pipeline fields (for scraper use, not pushed to DB)
  _status?: "validated" | "needs_review";
  _source?: string;        // e.g., "osm", "google_places", "ai_enriched"

  // Legacy/internal fields (backward compatibility - NOT pushed to HUMUS)
  country?: string;        // Country (internal use, always Iraq)
  name_en?: string;        // English name (legacy)
  email?: string;          // Email (internal use)
  facebook?: string;       // Facebook (internal use)
  instagram?: string;      // Instagram (internal use)
  latitude?: number;       // Old coordinate name (use lat)
  longitude?: number;      // Old coordinate name (use lng)
  external_id?: string;    // OSM external ID for deduplication
  fsq_id?: string;         // Foursquare ID
  data_quality?: string;   // Data quality metric (real|partial|osm|rejected)
  verified?: boolean;      // Old verification flag (use isVerified)
  raw_data?: Record<string, unknown>; // Raw OSM/API data
  source?: string;         // Data source (osm|google_places|etc)

  // UI fields
  image?: string;          // Primary image URL for UI display
  images?: string[];       // Array of image URLs
  createdAt?: string;
  updatedAt?: string;
  normalized_name?: string;
  normalized_phone?: string;
  normalized_website?: string;
  normalized_address?: string;
  normalized_facebook?: string;
  normalized_instagram?: string;
  dedupe_key?: string;
  completeness_score?: number;
  source_confidence?: number;
  last_seen_at?: string;
  is_active?: boolean;
  needs_review?: boolean;
};

export type BusinessStats = {
  total_count: number;
  real_count: number;
  partial_count: number;
  osm_count: number;
  rejected_count: number;
  verified_count: number;
  cities_covered: number;
  governorates_covered: number;
};

// ============================================
// CATEGORY MAPPING: OSM keys → HUMUS IDs
// ============================================
const CATEGORY_MAP: Record<string, string> = {
  restaurant: "food_drink",
  cafe: "food_drink",
  hotel: "hotels_stays",
  shop: "shopping",
  healthcare: "health_wellness",
  bank: "business_services",
  gasStation: "transport_mobility",
  carRepair: "transport_mobility",
  government: "public_essential",
  education: "public_essential",
  entertainment: "events_entertainment",
  tourism: "culture_heritage",
};

export function mapCategoryToHumus(osmKey: string): string {
  return CATEGORY_MAP[osmKey] || "public_essential"; // fallback
}

// GOVERNORATE NAME MAPPING: Scraper → HUMUS
const GOVERNORATE_MAP: Record<string, string> = {
  Duhok: "Dohuk",
  Anbar: "Al Anbar",
  DhiQar: "Dhi Qar",
  Qadisiyyah: "Al-Qādisiyyah",
  Muthanna: "Al Muthanna",
  Salahaddin: "Salah al-Din",
};

export function mapGovernorateToHumus(scrapedName: string): string {
  return GOVERNORATE_MAP[scrapedName] || scrapedName;
}

// ============================================
// CRUD operations
// ============================================
export async function getBusinesses(
  options: {
    limit?: number;
    offset?: number;
    category?: string;
    city?: string;
    governorate?: string;
    dataQuality?: string;
    search?: string;
  } = {}
) {
  const { limit = 50, offset = 0, category, city, governorate, dataQuality, search } = options;

  let query = supabase
    .from("businesses")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (city) query = query.eq("city", city);
  if (governorate) query = query.eq("governorate", governorate);
  if (dataQuality) query = query.eq("data_quality", dataQuality);
  if (search) {
    query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);
  }

  return await query;
}

export async function getBusinessById(id: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  return { data, error };
}

export async function createBusiness(business: Partial<Business>) {
  const { data, error } = await supabase
    .from("businesses")
    .insert(business)
    .select()
    .single();

  return { data, error };
}

export async function updateBusiness(id: string, updates: Partial<Business>) {
  const { data, error } = await supabase
    .from("businesses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteBusiness(id: string) {
  const { error } = await supabase.from("businesses").delete().eq("id", id);
  return { error };
}

export async function upsertBusinesses(businesses: Partial<Business>[]) {
  // Filter out businesses WITHOUT phone (REQUIRED for HUMUS)
  const withPhone = businesses.filter((b) => b.phone && b.phone.trim() !== "");

  if (withPhone.length === 0) {
    console.warn("No businesses with phone numbers to push");
    return { data: [], error: null };
  }

  // Clean data: remove internal fields, ensure HUMUS schema
  const cleaned = withPhone.map(({ _status, _source, id, ...rest }) => {
    // Normalize column names: latitude → lat, longitude → lng
    const { latitude, longitude, ...fields } = rest as any;

    return {
      ...fields,
      lat: fields.lat ?? latitude,
      lng: fields.lng ?? longitude,
      // Map OSM category to HUMUS category ID if needed
      category: fields.category ? mapCategoryToHumus(fields.category) : "public_essential",
      // Map governorate name to HUMUS format
      governorate: fields.governorate ? mapGovernorateToHumus(fields.governorate) : undefined,
    };
  });

  const { data, error } = await supabase
    .from("businesses")
    .upsert(cleaned, { onConflict: "phone" })
    .select();

  if (error) {
    console.error("Supabase upsert error:", error);
  } else {
    console.log(`Successfully pushed ${data?.length} records (filtered from ${businesses.length})`);
  }

  return { data, error, pushed: data?.length || 0, skipped: businesses.length - withPhone.length };
}

// --- NEW: Phone-based deduplication with normalized phone ---
export async function upsertBusinessesByPhone(businesses: Partial<Business>[]) {
  // Import normalizePhone from services
  const { normalizePhone } = await import("@/services/normalize");

  // Filter and normalize phones
  const withPhone = businesses
    .map((b) => ({
      ...b,
      normalized_phone: b.phone ? normalizePhone(b.phone) : null,
    }))
    .filter((b) => b.normalized_phone !== null);

  if (withPhone.length === 0) {
    console.warn("No businesses with valid phone numbers to push");
    return { data: [], error: null, pushed: 0, skipped: businesses.length };
  }

  // Clean data for HUMUS schema
  const cleaned = withPhone.map(({ _status, _source, id, normalized_phone, ...rest }) => {
    const { latitude, longitude, ...fields } = rest as any;

    return {
      ...fields,
      lat: fields.lat ?? latitude,
      lng: fields.lng ?? longitude,
      phone: normalized_phone, // Use normalized phone
      category: fields.category ? mapCategoryToHumus(fields.category) : "public_essential",
      governorate: fields.governorate ? mapGovernorateToHumus(fields.governorate) : undefined,
    };
  });

  // Upsert by normalized phone - requires UNIQUE constraint on phone column
  const { data, error } = await supabase
    .from("businesses")
    .upsert(cleaned, { onConflict: "phone" })
    .select();

  if (error) {
    console.error("Supabase upsert by phone error:", error);
  } else {
    console.log(
      `Successfully pushed ${data?.length} records by normalized phone (filtered from ${businesses.length})`
    );
  }

  return {
    data,
    error,
    pushed: data?.length || 0,
    skipped: businesses.length - withPhone.length,
  };
}

import { statsApi } from '@/services/api';

// Use real stats API instead of placeholder
export async function getStats(): Promise<BusinessStats | null> {
  try {
    const stats = await statsApi.getStats();
    return {
      total_count: stats.total_count,
      real_count: stats.real_count,
      partial_count: stats.partial_count,
      osm_count: stats.osm_count,
      rejected_count: stats.rejected_count,
      verified_count: stats.verified_count,
      cities_covered: stats.cities_covered,
      governorates_covered: stats.governorates_covered,
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return {
      total_count: 0,
      real_count: 0,
      partial_count: 0,
      osm_count: 0,
      rejected_count: 0,
      verified_count: 0,
      cities_covered: 0,
      governorates_covered: 0,
    };
  }
}

export async function getUniqueCities() {
  const { data, error } = await supabase
    .from("businesses")
    .select("city, governorate", { count: "exact", head: false })
    .order("city");

  if (error) return [];

  const unique = new Map<string, { city: string; governorate: string }>();
  data?.forEach((item) => {
    unique.set(item.city, { city: item.city, governorate: item.governorate });
  });

  return Array.from(unique.values());
}

export async function getUniqueCategories() {
  const { data, error } = await supabase
    .from("businesses")
    .select("category", { count: "exact", head: false });

  if (error) return [];

  const unique = new Set<string>();
  data?.forEach((item) => unique.add(item.category));
  return Array.from(unique).sort();
}
