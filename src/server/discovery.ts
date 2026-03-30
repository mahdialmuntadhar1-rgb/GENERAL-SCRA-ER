import { Business, DiscoveryRequest, DiscoveryResult } from '../types';
import { GeminiAdapter } from './adapters/gemini';
import { WebDirectoryAdapter } from './adapters/web';
import { supabase } from './supabase';

const adapters = [
  new GeminiAdapter(),
  new WebDirectoryAdapter()
];

export async function runDiscovery(req: DiscoveryRequest): Promise<DiscoveryResult> {
  const { city, category, sources } = req;
  const results: Partial<Business>[] = [];
  const errors: string[] = [];

  for (const sourceId of sources) {
    const adapter = adapters.find(a => a.id === sourceId);
    if (adapter) {
      try {
        const found = await adapter.discover(city, category);
        results.push(...found);
      } catch (err: any) {
        errors.push(`${sourceId}: ${err.message}`);
      }
    }
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (const biz of results) {
    // Simple deduplication check
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .or(`name.eq."${biz.name}",phone.eq."${biz.phone || ''}"`)
      .eq('city', biz.city)
      .maybeSingle();

    if (existing) {
      skippedCount++;
      continue;
    }

    const { error } = await supabase
      .from('businesses')
      .insert(biz);

    if (error) {
      errors.push(`Insert error for ${biz.name}: ${error.message}`);
    } else {
      insertedCount++;
    }
  }

  return {
    summary: `Discovery completed for ${category} in ${city}.`,
    insertedCount,
    skippedCount,
    errors
  };
}
