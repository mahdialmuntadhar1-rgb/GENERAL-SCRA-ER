export type BusinessStatus = 
  | 'pending_review' 
  | 'needs_cleaning' 
  | 'needs_verification' 
  | 'verified' 
  | 'rejected' 
  | 'export_ready'
  | 'outside_central_coverage'
  | 'claimed_verified'
  | 'registry_verified'
  | 'high_confidence_match';

export type SourceType = 'api' | 'scraper' | 'file';

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  freeTier: boolean;
  bulkSupport: boolean;
  socialSupport: boolean;
  priority: number;
  enabled: boolean;
}

export interface Business {
  id: string;
  name: string;
  local_name?: string;
  city: string;
  district: string;
  city_center_zone: string;
  category: string;
  subcategory?: string;
  phone?: string;
  email?: string;
  website?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  address: string;
  latitude: number;
  longitude: number;
  sources: string[]; // Source IDs
  completeness_score: number; // 0-100
  verification_score: number; // 0-100
  duplicate_risk: number; // 0-100
  suburb_risk: number; // 0-100
  status: BusinessStatus;
  created_at: string;
  updated_at: string;
  qc_notes?: string;
  publish_readiness_score?: number;
  source?: string;
  source_url?: string;
  confidence_score?: number;
  coverage_type?: string;
  raw_data?: any;
}

export interface CityConfig {
  name: string;
  districts: {
    name: string;
    central_zones: string[];
  }[];
}

export interface AdminCityConfig {
  city: string;
  approved_central_districts: string[];
  approved_central_zones: string[];
}

export type DiscoverySource = 
  | 'osm' 
  | 'overture' 
  | 'foursquare' 
  | 'web_directory' 
  | 'gemini' 
  | 'iraqi_registry' 
  | 'krd_registry' 
  | 'facebook' 
  | 'instagram' 
  | 'telegram' 
  | 'custom_file';

export interface DiscoverySourceConfig {
  id: DiscoverySource;
  label: string;
  description: string;
  hint?: string;
  tags: string[];
  icon: string;
  defaultChecked?: boolean;
}

export interface DiscoveryResult {
  summary: string;
  insertedCount: number;
  skippedCount: number;
  errors: string[];
  sourceStats?: {
    [sourceId: string]: {
      found: number;
      inserted: number;
      skipped: number;
      status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
      skipReason?: string;
      error?: string;
    }
  };
}

export interface DiscoveryRequest {
  city: string;
  category: string;
  sources: DiscoverySource[];
}
