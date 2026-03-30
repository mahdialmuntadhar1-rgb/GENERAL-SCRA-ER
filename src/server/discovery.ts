import { BusinessRecord, DiscoveryRequest, DiscoveryResult } from '../types';
import { GeminiAdapter } from './adapters/gemini';
import { WebDirectoryAdapter } from './adapters/web';
import { supabase } from './supabase';
import { evaluateCoverage } from './utils/cityCenter';
import { normalizeRecord } from './utils/normalize';
import {
  computeCompleteness,
  computeDuplicateRisk,
  computePublishReadiness,
  computeVerification,
  inferStatus
} from './utils/scoring';

const adapters = [new GeminiAdapter(), new WebDirectoryAdapter()];

async function fetchExisting(city: string): Promise<Partial<BusinessRecord>[]> {
  const { data } = await supabase
    .from('businesses')
    .select('normalized_business_name,phone_primary,address_normalized')
    .eq('city', city)
    .limit(3000);
  return (data || []) as Partial<BusinessRecord>[];
}

export async function runDiscovery(req: DiscoveryRequest): Promise<DiscoveryResult> {
  const { city, category, sources } = req;
  const results: Partial<BusinessRecord>[] = [];
  const errors: string[] = [];

  for (const sourceId of sources) {
    const adapter = adapters.find((item) => item.id === sourceId);
    if (!adapter) continue;

    try {
      const found = await adapter.discover(city, category);
      results.push(...found);
    } catch (err: any) {
      errors.push(`${sourceId}: ${err.message}`);
    }
  }

  let insertedCount = 0;
  let skippedCount = 0;
  let rejectedCount = 0;
  let needsManualReviewCount = 0;

  for (const raw of results) {
    const normalized = normalizeRecord(raw);
    if (!normalized.business_name || !normalized.city || !normalized.category) {
      skippedCount++;
      continue;
    }

    const existing = await fetchExisting(normalized.city);
    const coverage = evaluateCoverage(normalized.city, normalized.district);

    const completeness = computeCompleteness(normalized);
    const verification = computeVerification(normalized);
    const duplicateRisk = computeDuplicateRisk(normalized, existing);
    const publishReadiness = computePublishReadiness(
      completeness,
      verification,
      duplicateRisk,
      coverage.suburbRiskScore,
      coverage.coverageType
    );

    const record: Partial<BusinessRecord> = {
      ...normalized,
      city_center_zone: coverage.cityCenterZone,
      coverage_type: coverage.coverageType,
      suburb_risk_score: coverage.suburbRiskScore,
      completeness_score: completeness,
      verification_score: verification,
      duplicate_risk_score: duplicateRisk,
      publish_readiness_score: publishReadiness,
      status: inferStatus({
        ...normalized,
        coverage_type: coverage.coverageType,
        suburb_risk_score: coverage.suburbRiskScore,
        completeness_score: completeness,
        verification_score: verification,
        duplicate_risk_score: duplicateRisk,
        publish_readiness_score: publishReadiness
      }),
      verification_notes: coverage.reason,
      source_type: raw.source_type || 'manual'
    };

    if (record.status === 'Pending Review') needsManualReviewCount++;

    if (record.coverage_type === 'Outside Central Coverage' || record.status === 'Rejected') {
      rejectedCount++;
      continue;
    }

    const { error } = await supabase.from('businesses').insert(record);
    if (error) {
      errors.push(`Insert error for ${record.business_name}: ${error.message}`);
      skippedCount++;
      continue;
    }

    insertedCount++;
  }

  const importExportReport = generateImportExportReport(records, selectedProviders);

  return {
    summary: `City-first discovery completed for ${category} in ${city}.`,
    insertedCount,
    skippedCount,
    rejectedCount,
    needsManualReviewCount,
    errors
  };
}
