import { Business, DiscoveryRequest, DiscoveryResult } from '../types';
import { GeminiAdapter } from './adapters/gemini';
import { WebDirectoryAdapter } from './adapters/web';
import { OSMAdapter } from './adapters/osm';
import { OvertureAdapter } from './adapters/overture';
import { FoursquareAdapter } from './adapters/foursquare';
import { supabase } from './supabase';

const adapters = [
  new GeminiAdapter(),
  new WebDirectoryAdapter(),
  new OSMAdapter(),
  new OvertureAdapter(),
  new FoursquareAdapter()
];

// Simple normalization helpers
function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Remove all non-digits except +
  return phone.replace(/[^\d+]/g, '');
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.toLowerCase().trim().replace(/\/$/, '');
}

export async function runDiscovery(req: DiscoveryRequest): Promise<DiscoveryResult> {
  const { city, category, sources } = req;
  const results: Partial<Business>[] = [];
  const errors: string[] = [];
  const sourceStats: DiscoveryResult['sourceStats'] = {};

  // 1. Run selected adapters
  for (const sourceId of sources) {
    const adapter = adapters.find(a => a.id === sourceId);
    if (adapter) {
      sourceStats[sourceId] = { found: 0, inserted: 0, skipped: 0 };
      try {
        const found = await adapter.discover(city, category);
        sourceStats[sourceId].found = found.length;
        results.push(...found);
      } catch (err: any) {
        errors.push(`${sourceId}: ${err.message}`);
        sourceStats[sourceId].error = err.message;
      }
    }
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  // 2. Process results (Cleaning & Deduplication)
  for (const biz of results) {
    const sourceId = biz.source || 'unknown';
    if (!sourceStats[sourceId]) {
      sourceStats[sourceId] = { found: 0, inserted: 0, skipped: 0 };
    }

    // Normalize data
    const normalizedPhone = normalizePhone(biz.phone);
    const normalizedWebsite = normalizeUrl(biz.website);
    
      // Simple deduplication check: name + city OR phone + city
      try {
        // Use a safer approach for the OR query to avoid syntax errors with quotes
        const nameQuery = biz.name ? `name.eq.${biz.name}` : '';
        const phoneQuery = normalizedPhone ? `phone.eq.${normalizedPhone}` : '';
        const orQuery = [nameQuery, phoneQuery].filter(Boolean).join(',');

        const { data: existing, error: checkError } = await supabase
          .from('businesses')
          .select('id, sources, raw_data, confidence_score')
          .eq('city', biz.city)
          .or(orQuery || 'name.eq.NON_EXISTENT')
          .maybeSingle();

        if (checkError) throw checkError;

      if (existing) {
        // Merge logic: Update existing record with new source info
        const updatedSources = Array.from(new Set([...(existing.sources || []), sourceId]));
        
        await supabase
          .from('businesses')
          .update({
            sources: updatedSources,
            // Update confidence if new source is higher
            confidence_score: Math.max(existing.confidence_score || 0, biz.confidence_score || 0),
            // Merge raw data
            raw_data: { ...(existing.raw_data || {}), [sourceId]: biz.raw_data || biz }
          })
          .eq('id', existing.id);

        totalSkipped++;
        sourceStats[sourceId].skipped++;
        continue;
      }
    } catch (e) {
      // If DB fails, just proceed to insert (or mock insert)
      console.error("Deduplication check failed, proceeding with insert", e);
    }

    // 3. Insert new record
    const newBiz = {
      ...biz,
      phone: normalizedPhone,
      website: normalizedWebsite,
      sources: [sourceId],
      status: biz.status || 'pending_review',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw_data: { [sourceId]: biz.raw_data || biz }
    };

    try {
      const { error } = await supabase
        .from('businesses')
        .insert(newBiz);

      if (error) {
        errors.push(`Insert error for ${biz.name}: ${error.message}`);
      } else {
        totalInserted++;
        sourceStats[sourceId].inserted++;
      }
    } catch (e: any) {
      errors.push(`Database connection failed: ${e.message}`);
    }
  }

  return {
    summary: `Discovery completed for ${category} in ${city}.`,
    insertedCount: totalInserted,
    skippedCount: totalSkipped,
    errors,
    sourceStats
  };
}
