import { CanonicalBusinessRecord, DiscoveryRequest, ProviderConfig } from '../../../types';
import { PROVIDERS, FREE_TIER_PRIORITY } from '../config/providers';
import { GenericProviderConnector } from '../connectors/providerConnector';
import { mergeRecords } from './mergeService';

function sortProviders(providers: ProviderConfig[], mode: string): ProviderConfig[] {
  if (mode === 'free-tier-first') {
    return [...providers].sort((a, b) => {
      const ai = FREE_TIER_PRIORITY.indexOf(a.provider_id);
      const bi = FREE_TIER_PRIORITY.indexOf(b.provider_id);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }
  if (mode === 'cheapest-first') {
    return [...providers].sort((a, b) => Number(b.supports_free_tier) - Number(a.supports_free_tier) || a.priority - b.priority);
  }
  if (mode === 'best-coverage') {
    return [...providers].sort((a, b) => {
      const as = Number(a.supports_phone) + Number(a.supports_social) + Number(a.supports_address) + Number(a.supports_coordinates);
      const bs = Number(b.supports_phone) + Number(b.supports_social) + Number(b.supports_address) + Number(b.supports_coordinates);
      return bs - as;
    });
  }

  return [...providers].sort((a, b) => a.priority - b.priority);
}

function filterProviders(req: DiscoveryRequest): ProviderConfig[] {
  const { options } = req;
  return PROVIDERS.filter(p => {
    if (!p.is_enabled) return false;
    if (!options.selectAllSources && !options.selectedProviderIds.includes(p.provider_id)) return false;
    if (options.freeTierOnly && !p.supports_free_tier) return false;
    if (options.mapPoiOnly && p.provider_type !== 'poi') return false;
    if (options.enrichmentOnly && p.provider_type !== 'scraping') return false;
    if (options.fallbackSearchOnly && p.provider_type !== 'search') return false;
    if (options.manualUploadsOnly && p.provider_type !== 'manual_upload') return false;
    return true;
  });
}

async function executeWithConnector(connector: GenericProviderConnector, req: DiscoveryRequest): Promise<CanonicalBusinessRecord[]> {
  const raw = await connector.searchBusinesses({
    city: req.options.city,
    category: req.options.category,
    subcategory: req.options.subcategory,
    district: req.options.district,
    maxResults: req.options.maxResultsPerSource,
  });

  const results: CanonicalBusinessRecord[] = [];
  for (const row of raw) {
    const canonical = connector.mapToCanonicalSchema(row);
    const enriched = await connector.enrichBusiness(canonical);
    const validated = await connector.validateRecord(enriched, req.options);
    results.push(validated);
  }

  return results;
}

export async function runSourceExecution(req: DiscoveryRequest): Promise<{ records: CanonicalBusinessRecord[]; errors: string[]; selectedProviders: ProviderConfig[] }> {
  const selectedProviders = sortProviders(filterProviders(req), req.options.sourcePriorityMode);
  const errors: string[] = [];

  const shouldStop = (records: CanonicalBusinessRecord[]) => req.options.stopOnThreshold > 0 && records.length >= req.options.stopOnThreshold;

  let allRecords: CanonicalBusinessRecord[] = [];

  if (req.options.executionMode === 'parallel') {
    const responses = await Promise.all(selectedProviders.map(async (provider) => {
      try {
        return await executeWithConnector(new GenericProviderConnector(provider), req);
      } catch (error: any) {
        errors.push(`${provider.provider_id}: ${error.message}`);
        return [];
      }
    }));
    allRecords = responses.flat();
  } else {
    for (const provider of selectedProviders) {
      try {
        const records = await executeWithConnector(new GenericProviderConnector(provider), req);
        allRecords.push(...records);

        const weakData = records.every(r => r.completeness_score < 0.5);
        if (weakData && !req.options.fallbackSearchOnly) {
          const fallback = selectedProviders.filter(p => p.provider_type === 'search');
          for (const searchProvider of fallback) {
            const fallbackRecords = await executeWithConnector(new GenericProviderConnector(searchProvider), req);
            allRecords.push(...fallbackRecords);
          }
        }

        if (shouldStop(allRecords)) break;
      } catch (error: any) {
        errors.push(`${provider.provider_id}: ${error.message}`);
      }
    }
  }

  return { records: mergeRecords(allRecords), errors, selectedProviders };
}
