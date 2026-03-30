import { Business, BusinessStatus, DiscoveryRequest, DiscoveryResult, DiscoverySource } from '../types';
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

const adapterBySource = new Map<DiscoverySource, (typeof adapters)[number]>(
  adapters.map((adapter) => [adapter.id as DiscoverySource, adapter])
);

const sourceConfig: Record<DiscoverySource, {
  role: 'discovery' | 'enrichment' | 'verification' | 'fallback';
  priority: number;
  requiredEnv?: string;
}> = {
  osm: { role: 'discovery', priority: 1 },
  overture: { role: 'discovery', priority: 1 },
  foursquare: { role: 'enrichment', priority: 2, requiredEnv: 'FOURSQUARE_API_KEY' },
  web_directory: { role: 'discovery', priority: 2 },
  gemini: { role: 'fallback', priority: 4, requiredEnv: 'GEMINI_API_KEY' },
  iraqi_registry: { role: 'verification', priority: 1 },
  krd_registry: { role: 'verification', priority: 1 },
  facebook: { role: 'fallback', priority: 4 },
  instagram: { role: 'fallback', priority: 4 },
  telegram: { role: 'fallback', priority: 4 },
  custom_file: { role: 'enrichment', priority: 3 }
};

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return undefined;
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('964')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+964${cleaned.slice(1)}`;
  return cleaned;
}

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.toLowerCase().trim().replace(/\/$/, '');
}

function normalizeAddress(address?: string): string | undefined {
  if (!address) return undefined;
  return address.replace(/\s+/g, ' ').trim();
}

function normalizeSocial(social?: Business['social_media']): Business['social_media'] | undefined {
  if (!social) return undefined;
  return {
    facebook: normalizeUrl(social.facebook),
    instagram: normalizeUrl(social.instagram),
    whatsapp: normalizePhone(social.whatsapp)
  };
}

function computeVerificationStatus(sourceId: DiscoverySource, confidenceScore: number): BusinessStatus {
  const role = sourceConfig[sourceId]?.role;

  if (role === 'verification') return 'registry_verified';
  if (sourceId === 'foursquare') return 'claimed_verified';
  if (confidenceScore >= 0.88) return 'high_confidence_match';
  return 'pending_review';
}

function dedupeSignature(record: Partial<Business>): string {
  const normalizedName = (record.name || '').toLowerCase().trim();
  const normalizedCity = (record.city || '').toLowerCase().trim();
  const normalizedPhone = normalizePhone(record.phone) || 'no_phone';
  const approxLat = typeof record.latitude === 'number' ? record.latitude.toFixed(3) : 'na';
  const approxLng = typeof record.longitude === 'number' ? record.longitude.toFixed(3) : 'na';
  return `${normalizedName}|${normalizedCity}|${normalizedPhone}|${approxLat}|${approxLng}`;
}

export async function runDiscovery(req: DiscoveryRequest): Promise<DiscoveryResult> {
  const { city, category } = req;
  const requestedSources = Array.from(new Set(req.sources || []));
  const selectedSources = requestedSources
    .filter((sourceId): sourceId is DiscoverySource => Object.keys(sourceConfig).includes(sourceId))
    .sort((a, b) => sourceConfig[a].priority - sourceConfig[b].priority);

  const results: Partial<Business>[] = [];
  const errors: string[] = [];
  const sourceStats: DiscoveryResult['sourceStats'] = {};

  for (const sourceId of selectedSources) {
    sourceStats[sourceId] = {
      found: 0,
      inserted: 0,
      skipped: 0,
      status: 'pending'
    };

    const adapter = adapterBySource.get(sourceId);
    const requiredEnv = sourceConfig[sourceId].requiredEnv;

    if (requiredEnv && !process.env[requiredEnv]) {
      sourceStats[sourceId].status = 'skipped';
      sourceStats[sourceId].skipReason = `Missing ${requiredEnv}`;
      continue;
    }

    if (!adapter) {
      sourceStats[sourceId].status = 'skipped';
      sourceStats[sourceId].skipReason = 'Adapter not implemented yet';
      continue;
    }

    sourceStats[sourceId].status = 'running';

    try {
      const found = await adapter.discover(city, category);
      sourceStats[sourceId].found = found.length;
      sourceStats[sourceId].status = 'completed';
      results.push(...found.map((item) => ({ ...item, source: sourceId })));
    } catch (err: any) {
      const message = err?.message || 'Unknown discovery error';
      errors.push(`${sourceId}: ${message}`);
      sourceStats[sourceId].status = 'failed';
      sourceStats[sourceId].error = message;
    }
  }

  let totalInserted = 0;
  let totalSkipped = 0;

  const seenInBatch = new Set<string>();

  for (const biz of results) {
    const sourceId = (biz.source || 'unknown') as DiscoverySource;
    if (!sourceStats[sourceId]) {
      sourceStats[sourceId] = { found: 0, inserted: 0, skipped: 0, status: 'completed' };
    }

    const normalizedPhone = normalizePhone(biz.phone);
    const normalizedWebsite = normalizeUrl(biz.website);
    const normalizedAddress = normalizeAddress(biz.address);
    const normalizedSocial = normalizeSocial(biz.social_media);
    const confidence = biz.confidence_score || 0;
    const dedupeKey = dedupeSignature({ ...biz, phone: normalizedPhone });

    if (seenInBatch.has(dedupeKey)) {
      totalSkipped++;
      sourceStats[sourceId].skipped++;
      continue;
    }
    seenInBatch.add(dedupeKey);

    const { data: existing } = await supabase
      .from('businesses')
      .select('id, name, city, phone, latitude, longitude, sources, raw_data, confidence_score')
      .eq('city', biz.city)
      .or(`name.eq."${biz.name}",phone.eq."${normalizedPhone || 'NONE'}"`)
      .maybeSingle();

    if (existing) {
      const updatedSources = Array.from(new Set([...(existing.sources || []), sourceId]));

      await supabase
        .from('businesses')
        .update({
          sources: updatedSources,
          confidence_score: Math.max(existing.confidence_score || 0, confidence),
          phone: normalizedPhone || existing.phone,
          website: normalizedWebsite,
          address: normalizedAddress,
          social_media: normalizedSocial,
          status: computeVerificationStatus(sourceId, confidence),
          raw_data: {
            ...(existing.raw_data || {}),
            [sourceId]: biz.raw_data || biz,
            _fieldAttribution: {
              phone: normalizedPhone ? sourceId : (existing.raw_data?._fieldAttribution?.phone || undefined),
              website: normalizedWebsite ? sourceId : (existing.raw_data?._fieldAttribution?.website || undefined),
              address: normalizedAddress ? sourceId : (existing.raw_data?._fieldAttribution?.address || undefined)
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      totalSkipped++;
      sourceStats[sourceId].skipped++;
      continue;
    }

    const newBiz = {
      ...biz,
      phone: normalizedPhone,
      website: normalizedWebsite,
      address: normalizedAddress,
      social_media: normalizedSocial,
      sources: [sourceId],
      status: computeVerificationStatus(sourceId, confidence),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw_data: {
        [sourceId]: biz.raw_data || biz,
        _dedupeKey: dedupeKey,
        _sourceRole: sourceConfig[sourceId]?.role,
        _fieldAttribution: {
          phone: normalizedPhone ? sourceId : undefined,
          website: normalizedWebsite ? sourceId : undefined,
          address: normalizedAddress ? sourceId : undefined
        }
      }
    };

    const { error } = await supabase
      .from('businesses')
      .insert(newBiz);

    if (error) {
      errors.push(`Insert error for ${biz.name}: ${error.message}`);
    } else {
      totalInserted++;
      sourceStats[sourceId].inserted++;
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
