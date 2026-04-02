import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder";

export const supabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
  },
});

export type Business = {
  id: string;
  name: string;
  name_en?: string;
  phone?: string;
  website?: string;
  email?: string;
  address?: string;
  city: string;
  governorate: string;
  country: string;
  latitude?: number;
  longitude?: number;
  category: string;
  subcategory?: string;
  type?: string;
  facebook?: string;
  instagram?: string;
  fsq_id?: string;
  external_id?: string;
  source: string;
  data_quality: "real" | "partial" | "osm" | "rejected" | "unknown";
  verified: boolean;
  created_at: string;
  updated_at: string;
  scraped_at: string;
  search_tags?: string[];
  raw_data?: Record<string, unknown>;
  _status?: "validated" | "needs_review";
  // Pipeline v2 fields
  normalized_name?: string;
  normalized_phone?: string;
  normalized_website?: string;
  normalized_address?: string;
  normalized_facebook?: string;
  normalized_instagram?: string;
  whatsapp?: string;
  maps_url?: string;
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

// CRUD operations
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
    .from("iraqi_businesses")
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
    .from("iraqi_businesses")
    .select("*")
    .eq("id", id)
    .single();

  return { data, error };
}

export async function createBusiness(business: Partial<Business>) {
  const { data, error } = await supabase
    .from("iraqi_businesses")
    .insert(business)
    .select()
    .single();

  return { data, error };
}

export async function updateBusiness(id: string, updates: Partial<Business>) {
  const { data, error } = await supabase
    .from("iraqi_businesses")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteBusiness(id: string) {
  const { error } = await supabase.from("iraqi_businesses").delete().eq("id", id);
  return { error };
}

export async function upsertBusinesses(businesses: Partial<Business>[]) {
  // Strip internal fields that don't exist in DB
  const cleaned = businesses.map(({ _status, id, ...rest }) => ({
    ...rest,
    // Generate fsq_id from external_id if missing, for dedup
    fsq_id: rest.fsq_id || rest.external_id || `osm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }));

  const { data, error } = await supabase
    .from("iraqi_businesses")
    .upsert(cleaned, { onConflict: "fsq_id" })
    .select();

  if (error) {
    console.error("Supabase upsert error:", error);
  } else {
    console.log(`Successfully pushed ${data?.length} records to Supabase`);
  }

  return { data, error };
}

export async function getStats(): Promise<BusinessStats | null> {
  const { data, error } = await supabase
    .from("iraqi_businesses_stats")
    .select("*")
    .single();

  if (error) {
    console.error("Error fetching stats:", error);
    return null;
  }

  return data as BusinessStats;
}

export async function getUniqueCities() {
  const { data, error } = await supabase
    .from("iraqi_businesses")
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
    .from("iraqi_businesses")
    .select("category", { count: "exact", head: false });

  if (error) return [];

  const unique = new Set<string>();
  data?.forEach((item) => unique.add(item.category));
  return Array.from(unique).sort();
}
