export type DiscoverySource = 'gemini' | 'facebook' | 'instagram' | 'web_directory';

export type CoverageType = 'Central City' | 'Outside Central Coverage' | 'Uncertain';

export type BusinessStatus =
  | 'Pending Review'
  | 'Needs Cleaning'
  | 'Needs Verification'
  | 'Verified'
  | 'Rejected'
  | 'Export Ready'
  | 'Outside Central Coverage';

export interface BusinessRecord {
  id?: string;
  business_name: string;
  normalized_business_name: string;
  category: string;
  subcategory?: string;
  city: string;
  district?: string;
  city_center_zone?: string;
  coverage_type: CoverageType;
  governorate_raw?: string;
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
  source_name: string;
  source_url?: string;
  source_type: DiscoverySource | 'manual' | 'import_csv' | 'import_xlsx' | 'import_json';
  completeness_score: number;
  verification_score: number;
  publish_readiness_score: number;
  duplicate_risk_score: number;
  suburb_risk_score: number;
  status: BusinessStatus;
  verification_notes?: string;
  reviewed_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DiscoveryRequest {
  city: string;
  category: string;
  district?: string;
  sources: DiscoverySource[];
}

export interface DiscoveryResult {
  summary: string;
  insertedCount: number;
  skippedCount: number;
  rejectedCount: number;
  needsManualReviewCount: number;
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

export interface ImportSummary {
  sourceType: 'csv' | 'xlsx' | 'json';
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  manualReviewRows: number;
  duplicateRows: number;
  insertedRows: number;
  rejectionReasons: Record<string, number>;
}

export interface ExportQuery {
  city?: string;
  category?: string;
  status?: BusinessStatus;
  source_name?: string;
  source_type?: string;
  verifiedOnly?: boolean;
  exportReadyOnly?: boolean;
  includeRejected?: boolean;
  format: 'csv' | 'xlsx' | 'json';
}

export interface ImportFieldMapping {
  [targetField: string]: string;
}

export interface QCEvent {
  id?: string;
  business_id: string;
  changed_by: string;
  previous_status?: BusinessStatus;
  next_status: BusinessStatus;
  note?: string;
  created_at?: string;
}
