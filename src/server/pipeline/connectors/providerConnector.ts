import { CanonicalBusinessRecord, ProviderConfig, SourceSelectorOptions } from '../../../types';
import { ProviderConnector, SearchInput } from './baseConnector';
import {
  centralCoverage,
  completenessScore,
  hasJunkValues,
  isValidSocial,
  isValidUrl,
  normalizeAddress,
  normalizeBusinessName,
  normalizeLabel,
  normalizePhone,
} from '../utils/normalizers';

export class GenericProviderConnector implements ProviderConnector {
  constructor(public config: ProviderConfig) {}

  async searchBusinesses(input: SearchInput): Promise<Partial<CanonicalBusinessRecord>[]> {
    const count = Math.max(1, Math.min(input.maxResults, 5));
    return Array.from({ length: count }, (_, index) => ({
      business_name: `${input.category} ${this.config.provider_name} ${index + 1}`,
      category: input.category,
      subcategory: input.subcategory,
      city: input.city,
      district: input.district,
      city_center_zone: input.district,
      address_text: `${input.district || 'City Center'}, ${input.city}`,
      latitude: 33.3152 + index * 0.001,
      longitude: 44.3661 + index * 0.001,
      phone_primary: `0770${index}000000`,
      provider_id: this.config.provider_id,
      source_name: this.config.provider_name,
      source_type: this.config.provider_type,
      source_url: `https://example.com/${this.config.provider_id}`,
      status: 'Pending Review',
      coverage_type: 'unknown'
    }));
  }

  mapToCanonicalSchema(record: Partial<CanonicalBusinessRecord>): CanonicalBusinessRecord {
    const now = new Date().toISOString();
    const normalizedName = normalizeBusinessName(record.business_name);
    const mapped: CanonicalBusinessRecord = {
      business_name: record.business_name || 'Unknown Business',
      normalized_business_name: normalizedName,
      category: normalizeLabel(record.category) || 'Uncategorized',
      subcategory: normalizeLabel(record.subcategory),
      city: normalizeLabel(record.city) || 'Unknown City',
      district: normalizeLabel(record.district),
      city_center_zone: normalizeLabel(record.city_center_zone),
      coverage_type: record.coverage_type || 'unknown',
      address_text: normalizeAddress(record.address_text),
      address_normalized: normalizeAddress(record.address_text),
      google_maps_url: record.google_maps_url,
      latitude: record.latitude,
      longitude: record.longitude,
      phone_primary: normalizePhone(record.phone_primary),
      phone_secondary: normalizePhone(record.phone_secondary),
      whatsapp_number: normalizePhone(record.whatsapp_number),
      website_url: record.website_url,
      facebook_url: record.facebook_url,
      instagram_url: record.instagram_url,
      tiktok_url: record.tiktok_url,
      telegram_url: record.telegram_url,
      email: record.email,
      description: record.description,
      opening_hours: record.opening_hours,
      image_url: record.image_url,
      logo_url: record.logo_url,
      provider_id: this.config.provider_id,
      source_name: this.config.provider_name,
      source_url: record.source_url,
      source_type: this.config.provider_type,
      completeness_score: 0,
      verification_score: 0,
      publish_readiness_score: 0,
      duplicate_risk_score: 0,
      suburb_risk_score: 0,
      status: record.status || 'Pending Review',
      verification_notes: record.verification_notes,
      evidence: [{ providerId: this.config.provider_id, sourceUrl: record.source_url, timestamp: now, confidence: 0.5 }],
      field_confidence: {},
      created_at: now,
      updated_at: now,
    };

    mapped.completeness_score = completenessScore(mapped);
    return mapped;
  }

  async enrichBusiness(record: CanonicalBusinessRecord): Promise<CanonicalBusinessRecord> {
    const websiteOk = isValidUrl(record.website_url);
    const socials = [record.facebook_url, record.instagram_url, record.tiktok_url, record.telegram_url].filter(isValidSocial).length;
    const verificationBoost = (websiteOk ? 0.15 : 0) + socials * 0.1 + (record.phone_primary ? 0.15 : 0);

    return {
      ...record,
      verification_score: Math.min(1, record.completeness_score * 0.7 + verificationBoost),
      publish_readiness_score: Math.min(1, record.completeness_score * 0.6 + verificationBoost),
      field_confidence: {
        business_name: 0.8,
        address_text: record.address_text ? 0.75 : 0.2,
        phone_primary: record.phone_primary ? 0.85 : 0.2,
        website_url: websiteOk ? 0.8 : 0.3,
      },
    };
  }

  async validateRecord(record: CanonicalBusinessRecord, options: SourceSelectorOptions): Promise<CanonicalBusinessRecord> {
    let next = centralCoverage(record);

    if (hasJunkValues(next)) {
      next = { ...next, status: 'Rejected', verification_notes: `${next.verification_notes || ''} Placeholder/junk values detected.`.trim() };
    }

    if (options.centralCityOnly && next.coverage_type !== 'central_city') {
      next = { ...next, status: 'Outside Central Coverage' };
    }

    if (next.completeness_score < 0.5) {
      next = { ...next, status: 'Needs Cleaning' };
    } else if (next.verification_score < options.verificationStrictness / 100) {
      next = { ...next, status: 'Needs Verification' };
    } else if (next.status !== 'Outside Central Coverage' && next.status !== 'Rejected') {
      next = { ...next, status: 'Verified' };
    }

    return next;
  }
}
