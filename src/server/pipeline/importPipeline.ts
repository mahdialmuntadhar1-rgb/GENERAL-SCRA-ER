import { BusinessRecord, ImportFieldMapping, ImportSummary } from '../../types';
import { supabase } from '../supabase';
import { evaluateCoverage } from '../utils/cityCenter';
import { isJunkValue, normalizeRecord } from '../utils/normalize';
import {
  computeCompleteness,
  computeDuplicateRisk,
  computePublishReadiness,
  computeVerification,
  inferStatus
} from '../utils/scoring';

export interface ImportRequestPayload {
  sourceType: 'csv' | 'xlsx' | 'json';
  payload: string;
  mapping?: ImportFieldMapping;
  reviewer?: string;
}

function parseCsv(payload: string): Record<string, any>[] {
  const lines = payload.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    return headers.reduce<Record<string, any>>((acc, header, index) => {
      acc[header] = values[index]?.trim() || '';
      return acc;
    }, {});
  });
}

function parseXlsx(payload: string): Record<string, any>[] {
  // Dependency-free fallback parser: expects base64-encoded UTF-8 CSV/TSV content.
  // For native binary XLSX, client should pre-convert to JSON/CSV before upload.
  const decoded = Buffer.from(payload, 'base64').toString('utf-8');
  if (decoded.includes('\t')) {
    const lines = decoded.split(/\r?\n/).filter(Boolean);
    if (lines.length === 0) return [];
    const headers = lines[0].split('\t').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split('\t');
      return headers.reduce<Record<string, any>>((acc, header, index) => {
        acc[header] = values[index]?.trim() || '';
        return acc;
      }, {});
    });
  }
  return parseCsv(decoded);
}

function parseJson(payload: string): Record<string, any>[] {
  const parsed = JSON.parse(payload);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.rows)) return parsed.rows;
  return [];
}

function mapRow(row: Record<string, any>, mapping: ImportFieldMapping = {}): Partial<BusinessRecord> {
  const get = (key: string) => row[mapping[key] || key];
  return {
    business_name: get('business_name') || get('name'),
    category: get('category'),
    subcategory: get('subcategory'),
    city: get('city'),
    district: get('district') || get('area'),
    governorate_raw: get('governorate_raw') || get('governorate'),
    address_text: get('address_text') || get('address'),
    google_maps_url: get('google_maps_url'),
    latitude: Number(get('latitude')) || undefined,
    longitude: Number(get('longitude')) || undefined,
    phone_primary: get('phone_primary') || get('phone'),
    phone_secondary: get('phone_secondary'),
    whatsapp_number: get('whatsapp_number'),
    website_url: get('website_url') || get('website'),
    facebook_url: get('facebook_url'),
    instagram_url: get('instagram_url'),
    tiktok_url: get('tiktok_url'),
    telegram_url: get('telegram_url'),
    email: get('email'),
    description: get('description'),
    opening_hours: get('opening_hours'),
    image_url: get('image_url'),
    logo_url: get('logo_url'),
    source_name: get('source_name') || 'Imported Dataset',
    source_url: get('source_url'),
    source_type: 'import_json'
  };
}

async function fetchCityBusinesses(city: string): Promise<Partial<BusinessRecord>[]> {
  const { data } = await supabase
    .from('businesses')
    .select('id,normalized_business_name,phone_primary,address_normalized,city')
    .eq('city', city)
    .limit(3000);

  return (data || []) as Partial<BusinessRecord>[];
}

export async function runImport(payload: ImportRequestPayload): Promise<ImportSummary> {
  const rows =
    payload.sourceType === 'csv'
      ? parseCsv(payload.payload)
      : payload.sourceType === 'xlsx'
        ? parseXlsx(payload.payload)
        : parseJson(payload.payload);

  const summary: ImportSummary = {
    sourceType: payload.sourceType,
    totalRows: rows.length,
    validRows: 0,
    rejectedRows: 0,
    manualReviewRows: 0,
    duplicateRows: 0,
    insertedRows: 0,
    rejectionReasons: {}
  };

  const incrementReason = (reason: string) => {
    summary.rejectionReasons[reason] = (summary.rejectionReasons[reason] || 0) + 1;
  };

  for (const row of rows) {
    const mapped = mapRow(row, payload.mapping);
    const normalized = normalizeRecord(mapped);

    if (isJunkValue(normalized.business_name) || isJunkValue(normalized.city) || isJunkValue(normalized.category)) {
      summary.rejectedRows++;
      incrementReason('Missing core fields');
      continue;
    }

    const cityCoverage = evaluateCoverage(normalized.city, normalized.district);
    const existing = await fetchCityBusinesses(normalized.city || '');

    const completeness = computeCompleteness(normalized);
    const verification = computeVerification(normalized);
    const duplicateRisk = computeDuplicateRisk(normalized, existing);
    const publishReadiness = computePublishReadiness(
      completeness,
      verification,
      duplicateRisk,
      cityCoverage.suburbRiskScore,
      cityCoverage.coverageType
    );

    const record: Partial<BusinessRecord> = {
      ...normalized,
      city_center_zone: cityCoverage.cityCenterZone,
      coverage_type: cityCoverage.coverageType,
      suburb_risk_score: cityCoverage.suburbRiskScore,
      completeness_score: completeness,
      verification_score: verification,
      duplicate_risk_score: duplicateRisk,
      publish_readiness_score: publishReadiness,
      status: inferStatus({
        ...normalized,
        coverage_type: cityCoverage.coverageType,
        completeness_score: completeness,
        verification_score: verification,
        duplicate_risk_score: duplicateRisk,
        publish_readiness_score: publishReadiness
      }),
      reviewed_by: payload.reviewer,
      verification_notes: cityCoverage.reason,
      source_type:
        payload.sourceType === 'csv' ? 'import_csv' : payload.sourceType === 'xlsx' ? 'import_xlsx' : 'import_json'
    };

    if (record.coverage_type === 'Outside Central Coverage') {
      summary.rejectedRows++;
      incrementReason('Outside central coverage');
      continue;
    }

    if (record.status === 'Pending Review') {
      summary.manualReviewRows++;
    }

    if ((record.duplicate_risk_score || 0) >= 90) {
      summary.duplicateRows++;
      summary.rejectedRows++;
      incrementReason('High duplicate risk');
      continue;
    }

    summary.validRows++;

    const { error } = await supabase.from('businesses').insert(record);
    if (error) {
      summary.rejectedRows++;
      summary.validRows--;
      incrementReason(`Insert error: ${error.message}`);
      continue;
    }

    summary.insertedRows++;
  }

  return summary;
}
