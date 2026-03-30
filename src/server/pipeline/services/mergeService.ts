import { CanonicalBusinessRecord } from '../../../types';
import { normalizeBusinessName, normalizePhone } from '../utils/normalizers';

function mergeField(primary?: string | number, secondary?: string | number) {
  if (primary && `${primary}`.trim() !== '') return primary;
  return secondary;
}

export function duplicateKey(record: CanonicalBusinessRecord): string {
  const name = normalizeBusinessName(record.business_name);
  const phone = normalizePhone(record.phone_primary) || 'no-phone';
  const district = (record.district || '').toLowerCase();
  return `${name}|${phone}|${record.city.toLowerCase()}|${district}`;
}

export function mergeRecords(records: CanonicalBusinessRecord[]): CanonicalBusinessRecord[] {
  const mergedMap = new Map<string, CanonicalBusinessRecord>();

  for (const record of records) {
    const key = duplicateKey(record);
    const existing = mergedMap.get(key);

    if (!existing) {
      mergedMap.set(key, { ...record, duplicate_risk_score: 0.1 });
      continue;
    }

    const evidence = [...(existing.evidence || []), ...(record.evidence || [])];
    const merged: CanonicalBusinessRecord = {
      ...existing,
      address_text: mergeField(existing.address_text, record.address_text) as string | undefined,
      phone_primary: mergeField(existing.phone_primary, record.phone_primary) as string | undefined,
      website_url: mergeField(existing.website_url, record.website_url) as string | undefined,
      facebook_url: mergeField(existing.facebook_url, record.facebook_url) as string | undefined,
      instagram_url: mergeField(existing.instagram_url, record.instagram_url) as string | undefined,
      tiktok_url: mergeField(existing.tiktok_url, record.tiktok_url) as string | undefined,
      telegram_url: mergeField(existing.telegram_url, record.telegram_url) as string | undefined,
      source_url: mergeField(existing.source_url, record.source_url) as string | undefined,
      verification_score: Math.min(1, Math.max(existing.verification_score, record.verification_score) + 0.08),
      publish_readiness_score: Math.min(1, Math.max(existing.publish_readiness_score, record.publish_readiness_score) + 0.1),
      duplicate_risk_score: 0.95,
      evidence,
      field_confidence: {
        ...(existing.field_confidence || {}),
        ...(record.field_confidence || {}),
        phone_primary: (existing.phone_primary && record.phone_primary) ? 0.95 : (existing.field_confidence?.phone_primary || 0.7),
        address_text: (existing.address_text && record.address_text) ? 0.92 : (existing.field_confidence?.address_text || 0.65),
      },
      updated_at: new Date().toISOString(),
    };

    mergedMap.set(key, merged);
  }

  return Array.from(mergedMap.values());
}
