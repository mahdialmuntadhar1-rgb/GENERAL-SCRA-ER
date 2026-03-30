import { CENTRAL_CITY_ALLOWLIST } from '../config/centralZones';
import { CanonicalBusinessRecord } from '../../../types';

export function normalizeBusinessName(name?: string): string {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('964')) return `+${digits}`;
  if (digits.startsWith('0')) return `+964${digits.slice(1)}`;
  return digits.length >= 8 ? `+964${digits}` : undefined;
}

export function normalizeAddress(address?: string): string | undefined {
  if (!address) return undefined;
  return address.replace(/\s+/g, ' ').trim();
}

export function normalizeLabel(v?: string): string | undefined {
  return v ? v.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : undefined;
}

export function isValidUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function isValidSocial(url?: string): boolean {
  if (!isValidUrl(url)) return false;
  return /facebook|instagram|tiktok|telegram/i.test(url || '');
}

export function hasJunkValues(record: CanonicalBusinessRecord): boolean {
  const fields = [record.business_name, record.address_text, record.phone_primary, record.website_url]
    .filter(Boolean)
    .map(v => `${v}`.toLowerCase());
  return fields.some(v => ['n/a', 'unknown', 'test', 'null', '-'].includes(v));
}

export function centralCoverage(record: CanonicalBusinessRecord): CanonicalBusinessRecord {
  const allowed = CENTRAL_CITY_ALLOWLIST[record.city] || [];
  const district = record.district || record.city_center_zone || '';
  const isCentral = allowed.some(zone => zone.toLowerCase() === district.toLowerCase());
  const suburbRiskScore = isCentral ? 0.1 : 0.85;

  return {
    ...record,
    coverage_type: isCentral ? 'central_city' : 'outside_central',
    suburb_risk_score: suburbRiskScore,
    status: isCentral ? record.status : 'Outside Central Coverage',
    verification_notes: isCentral
      ? record.verification_notes
      : `${record.verification_notes || ''} Outside central coverage allowlist.`.trim(),
  };
}

export function completenessScore(record: CanonicalBusinessRecord): number {
  const checks = [
    !!record.business_name,
    !!(record.phone_primary || record.facebook_url || record.instagram_url || record.telegram_url || record.tiktok_url),
    !!(record.address_text || (record.latitude && record.longitude)),
    !!record.city,
    !!record.district,
    !!record.category,
  ];
  return checks.filter(Boolean).length / checks.length;
}
