import { BusinessRecord, BusinessStatus } from '../../types';

function hasValue(value?: string | number): boolean {
  return value !== undefined && value !== null && `${value}`.trim().length > 0;
}

export function computeCompleteness(record: Partial<BusinessRecord>): number {
  const fields = [
    record.business_name,
    record.category,
    record.city,
    record.district,
    record.address_normalized,
    record.phone_primary,
    record.google_maps_url,
    record.source_name,
    record.source_url
  ];
  const present = fields.filter((item) => hasValue(item)).length;
  return Math.round((present / fields.length) * 100);
}

export function computeVerification(record: Partial<BusinessRecord>): number {
  let score = 0;
  if (hasValue(record.phone_primary)) score += 30;
  if (hasValue(record.whatsapp_number)) score += 10;
  if (hasValue(record.google_maps_url)) score += 25;
  if (hasValue(record.address_normalized)) score += 15;
  if (hasValue(record.website_url) || hasValue(record.facebook_url) || hasValue(record.instagram_url)) score += 20;
  return Math.min(score, 100);
}

export function computeDuplicateRisk(record: Partial<BusinessRecord>, existing: Partial<BusinessRecord>[]): number {
  const name = (record.normalized_business_name || '').toLowerCase();
  if (!name) return 100;

  let maxRisk = 0;
  for (const item of existing) {
    const samePhone = Boolean(record.phone_primary && item.phone_primary && record.phone_primary === item.phone_primary);
    const existingName = (item.normalized_business_name || '').toLowerCase();
    const nameOverlap = existingName && (existingName.includes(name) || name.includes(existingName));
    const sameAddress = Boolean(
      record.address_normalized &&
      item.address_normalized &&
      record.address_normalized === item.address_normalized
    );

    if (samePhone && nameOverlap) maxRisk = Math.max(maxRisk, 98);
    else if (nameOverlap && sameAddress) maxRisk = Math.max(maxRisk, 90);
    else if (nameOverlap) maxRisk = Math.max(maxRisk, 70);
  }

  return maxRisk;
}

export function computePublishReadiness(
  completeness: number,
  verification: number,
  duplicateRisk: number,
  suburbRisk: number,
  coverageType: BusinessRecord['coverage_type']
): number {
  const coverageBoost = coverageType === 'Central City' ? 15 : coverageType === 'Uncertain' ? -10 : -40;
  const raw = completeness * 0.4 + verification * 0.35 + (100 - duplicateRisk) * 0.15 + (100 - suburbRisk) * 0.1 + coverageBoost;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function inferStatus(record: Partial<BusinessRecord>): BusinessStatus {
  if (record.coverage_type === 'Outside Central Coverage') return 'Outside Central Coverage';
  if ((record.duplicate_risk_score || 0) >= 90) return 'Rejected';
  if ((record.completeness_score || 0) < 50) return 'Needs Cleaning';
  if ((record.verification_score || 0) < 45) return 'Needs Verification';
  if (record.coverage_type === 'Uncertain') return 'Pending Review';
  if ((record.publish_readiness_score || 0) >= 80) return 'Export Ready';
  return 'Verified';
}
