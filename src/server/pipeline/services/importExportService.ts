import { CanonicalBusinessRecord, ImportReport, ProviderConfig, UploadPayload } from '../../../types';

export function mapUploadRows(uploads: UploadPayload[] | undefined, city: string, category: string): CanonicalBusinessRecord[] {
  if (!uploads?.length) return [];

  return uploads.flatMap(upload => upload.rows.map((row, idx) => ({
    business_name: String(row.business_name || row.name || `Upload Business ${idx + 1}`),
    normalized_business_name: String(row.normalized_business_name || row.name || '').toLowerCase(),
    category: String(row.category || category),
    subcategory: String(row.subcategory || ''),
    city: String(row.city || city),
    district: String(row.district || row.zone || ''),
    city_center_zone: String(row.city_center_zone || row.zone || ''),
    coverage_type: 'unknown',
    address_text: String(row.address_text || row.address || ''),
    address_normalized: String(row.address_normalized || row.address || ''),
    google_maps_url: String(row.google_maps_url || ''),
    latitude: Number(row.latitude) || undefined,
    longitude: Number(row.longitude) || undefined,
    phone_primary: String(row.phone_primary || row.phone || ''),
    phone_secondary: String(row.phone_secondary || ''),
    whatsapp_number: String(row.whatsapp_number || ''),
    website_url: String(row.website_url || row.website || ''),
    facebook_url: String(row.facebook_url || ''),
    instagram_url: String(row.instagram_url || ''),
    tiktok_url: String(row.tiktok_url || ''),
    telegram_url: String(row.telegram_url || ''),
    email: String(row.email || ''),
    description: String(row.description || ''),
    opening_hours: String(row.opening_hours || ''),
    image_url: String(row.image_url || ''),
    logo_url: String(row.logo_url || ''),
    provider_id: `${upload.fileType}_upload`,
    source_name: `${upload.fileType.toUpperCase()} Upload`,
    source_url: upload.fileName,
    source_type: 'manual_upload',
    completeness_score: 0.6,
    verification_score: 0.4,
    publish_readiness_score: 0.4,
    duplicate_risk_score: 0.2,
    suburb_risk_score: 0,
    status: 'Pending Review',
    verification_notes: 'Imported from manual file source.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })));
}

export function generateImportExportReport(records: CanonicalBusinessRecord[], selectedProviders: ProviderConfig[]): ImportReport {
  const rejected_rows_report = records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => record.status === 'Rejected')
    .map(({ index, record }) => ({ index, reason: record.verification_notes || 'Rejected by quality rules' }));

  const duplicate_report = records.filter(r => r.duplicate_risk_score >= 0.8);
  const incomplete_report = records.filter(r => r.completeness_score < 0.5 || r.status === 'Needs Cleaning');
  const export_ready_report = records.filter(r => r.status === 'Export Ready' || r.status === 'Verified');

  const provider_performance_report = selectedProviders.map(provider => {
    const scoped = records.filter(r => r.provider_id === provider.provider_id);
    return {
      provider_id: provider.provider_id,
      records_processed: scoped.length,
      records_verified: scoped.filter(r => r.status === 'Verified' || r.status === 'Export Ready').length,
      avg_completeness_score: scoped.length ? scoped.reduce((sum, r) => sum + r.completeness_score, 0) / scoped.length : 0,
    };
  });

  return {
    import_summary: {
      total_rows: records.length,
      accepted_rows: records.length - rejected_rows_report.length,
      rejected_rows: rejected_rows_report.length,
    },
    rejected_rows_report,
    duplicate_report,
    incomplete_report,
    export_ready_report,
    provider_performance_report,
  };
}
