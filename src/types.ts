export type ProviderType = 'poi' | 'search' | 'scraping' | 'manual_upload' | 'geocoding';

export type DiscoverySource = 'gemini' | 'web_directory' | 'facebook' | 'instagram';

export type CoverageType = 'central_city' | 'outside_central' | 'unknown';

export type QCStatus =
  | 'Pending Review'
  | 'Needs Cleaning'
  | 'Needs Verification'
  | 'Verified'
  | 'Rejected'
  | 'Export Ready'
  | 'Outside Central Coverage';

export type SourcePriorityMode =
  | 'source-priority'
  | 'best-coverage'
  | 'cheapest-first'
  | 'free-tier-first';

export interface ProviderConfig {
  provider_id: string;
  provider_name: string;
  provider_type: ProviderType;
  is_enabled: boolean;
  priority: number;
  supports_phone: boolean;
  supports_social: boolean;
  supports_address: boolean;
  supports_coordinates: boolean;
  supports_hours: boolean;
  supports_images: boolean;
  supports_bulk: boolean;
  supports_free_tier: boolean;
  cost_notes: string;
  rate_limit_notes: string;
}

export interface SourceSelectorOptions {
  selectAllSources: boolean;
  selectedProviderIds: string[];
  sourcePriorityMode: SourcePriorityMode;
  freeTierOnly: boolean;
  mapPoiOnly: boolean;
  enrichmentOnly: boolean;
  fallbackSearchOnly: boolean;
  manualUploadsOnly: boolean;
  centralCityOnly: boolean;
  city: string;
  category: string;
  subcategory: string;
  district: string;
  maxResultsPerSource: number;
  duplicateTolerance: number;
  verificationStrictness: number;
  executionMode: 'sequence' | 'parallel';
  stopOnThreshold: number;
}

export interface SourceAttribution {
  providerId: string;
  sourceUrl?: string;
  timestamp: string;
  confidence: number;
}

export interface CanonicalBusinessRecord {
  id?: string;
  business_name: string;
  normalized_business_name?: string;
  category: string;
  subcategory?: string;
  city: string;
  district?: string;
  city_center_zone?: string;
  coverage_type: CoverageType;
  address_text?: string;
  address_normalized?: string;
  google_maps_url?: string;
  latitude?: number;
  longitude?: number;
  phone_primary?: string;
  phone_secondary?: string;
  whatsapp_number?: string;
  website_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  telegram_url?: string;
  email?: string;
  description?: string;
  opening_hours?: string;
  image_url?: string;
  logo_url?: string;
  provider_id: string;
  source_name: string;
  source_url?: string;
  source_type: ProviderType;
  completeness_score: number;
  verification_score: number;
  publish_readiness_score: number;
  duplicate_risk_score: number;
  suburb_risk_score: number;
  status: QCStatus;
  verification_notes?: string;
  evidence?: SourceAttribution[];
  field_confidence?: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

export interface UploadPayload {
  fileType: 'csv' | 'xlsx' | 'json';
  rows: Record<string, unknown>[];
  fileName?: string;
}

export interface DiscoveryRequest {
  options: SourceSelectorOptions;
  uploads?: UploadPayload[];
}

export interface ImportReport {
  import_summary: {
    total_rows: number;
    accepted_rows: number;
    rejected_rows: number;
  };
  rejected_rows_report: Array<{ index: number; reason: string }>;
  duplicate_report: CanonicalBusinessRecord[];
  incomplete_report: CanonicalBusinessRecord[];
  export_ready_report: CanonicalBusinessRecord[];
  provider_performance_report: Array<{
    provider_id: string;
    records_processed: number;
    records_verified: number;
    avg_completeness_score: number;
  }>;
}

export interface DiscoveryResult {
  summary: string;
  insertedCount: number;
  skippedCount: number;
  errors: string[];
  records: CanonicalBusinessRecord[];
  importExportReport: ImportReport;
}

// Legacy compatibility for current UI table rendering
export interface Business {
  id?: string;
  name: string;
  local_name?: string;
  category: string;
  city: string;
  governorate?: string;
  address?: string;
  phone?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  source: string;
  source_url?: string;
  confidence_score: number;
  created_at?: string;
}
