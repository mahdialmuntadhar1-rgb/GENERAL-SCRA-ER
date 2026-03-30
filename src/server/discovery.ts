import { Business, DiscoveryRequest, DiscoveryResult } from '../types';
import { GeminiAdapter } from './adapters/gemini';
import { WebDirectoryAdapter } from './adapters/web';
import { supabase } from './supabase';

const adapters = [new GeminiAdapter(), new WebDirectoryAdapter()];

const normalizePhone = (value?: string | null) => (value || '').replace(/\D/g, '');

async function isDuplicate(biz: Partial<Business>): Promise<boolean> {
  if (!biz.city || !biz.name) {
    return false;
  }

  const normalizedPhone = normalizePhone(biz.phone);

  if (normalizedPhone) {
    const { data: matches, error } = await supabase
      .from('businesses')
      .select('id, phone')
      .eq('city', biz.city)
      .not('phone', 'is', null)
      .limit(100);

    if (error) {
      throw error;
    }

    if (matches?.some((row) => normalizePhone(row.phone) === normalizedPhone)) {
      return true;
    }
  }

  const { data: sameName, error: nameError } = await supabase
    .from('businesses')
    .select('id')
    .eq('city', biz.city)
    .ilike('name', biz.name)
    .limit(1);

  if (nameError) {
    throw nameError;
  }

  return Boolean(sameName && sameName.length > 0);
}

export async function runDiscovery(req: DiscoveryRequest): Promise<DiscoveryResult> {
  const { city, category, sources } = req;
  const discoveredResults: Partial<Business>[] = [];
  const errors: string[] = [];

  for (const sourceId of sources) {
    const adapter = adapters.find((item) => item.id === sourceId);
    if (!adapter) {
      errors.push(`${sourceId}: source not implemented`);
      continue;
    }

    console.log(`[discovery] source started: ${sourceId}`);

    try {
      const found = await adapter.discover(city, category);
      console.log(`[discovery] source finished: ${sourceId} found=${found.length}`);
      discoveredResults.push(...found);
    } catch (err: any) {
      const message = `${sourceId}: ${err?.message || 'unknown adapter error'}`;
      console.error(`[discovery] source failed: ${message}`);
      errors.push(message);
    }
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (const biz of discoveredResults) {
    if (!biz.name || !biz.city || !biz.category || !biz.source) {
      skippedCount++;
      errors.push(`Skipped invalid business row from ${biz.source || 'unknown source'}`);
      continue;
    }

    try {
      const duplicate = await isDuplicate(biz);
      if (duplicate) {
        skippedCount++;
        continue;
      }

      const { error } = await supabase.from('businesses').insert({
        name: biz.name,
        local_name: biz.local_name || null,
        category: biz.category,
        city: biz.city,
        district: biz.district || null,
        city_center_zone: biz.city_center_zone || null,
        address: biz.address || null,
        phone: biz.phone || null,
        website: biz.website || null,
        facebook_url: biz.facebook_url || null,
        instagram_url: biz.instagram_url || null,
        source: biz.source,
        source_url: biz.source_url || null,
        confidence_score: biz.confidence_score ?? null,
        latitude: biz.latitude ?? null,
        longitude: biz.longitude ?? null,
        raw_data: biz.raw_data || null,
        status: 'pending_review'
      });

      if (error) {
        errors.push(`Insert error for ${biz.name}: ${error.message}`);
      } else {
        insertedCount++;
      }
    } catch (err: any) {
      errors.push(`Process error for ${biz.name}: ${err?.message || 'unknown error'}`);
    }
  }

  console.log(`[discovery] completed city=${city} category=${category} inserted=${insertedCount} skipped=${skippedCount} errors=${errors.length}`);

  return {
    summary: `Discovery completed for ${category} in ${city}.`,
    insertedCount,
    skippedCount,
    errors
  };
}
