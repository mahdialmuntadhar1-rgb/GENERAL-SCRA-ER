export type BusinessStatus = 
  | 'pending_review' 
  | 'needs_cleaning' 
  | 'needs_verification' 
  | 'verified' 
  | 'rejected' 
  | 'export_ready'
  | 'outside_central_coverage';

export type SourceType = 'api' | 'scraper' | 'file';

export type DiscoverySource = 'gemini' | 'osm';

export interface Source {
  id: DiscoverySource;
  name: string;
  type: SourceType;
  freeTier: boolean;
  bulkSupport: boolean;
  socialSupport: boolean;
  priority: number;
  enabled: boolean;
  description?: string;
}

export interface Business {
  id: string;
  name: string;
  local_name?: string | null;
  city: string;
  district?: string | null;
  city_center_zone?: string | null;
  category: string;
  subcategory?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status?: BusinessStatus | null;
  source?: string | null;
  source_url?: string | null;
  confidence_score?: number | null;
  created_at?: string;
  updated_at?: string;
  qc_notes?: string | null;
  completeness_score?: number | null;
  verification_score?: number | null;
  publish_readiness_score?: number | null;
  coverage_type?: string | null;
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

export interface DiscoveryResult {
  summary: string;
  insertedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface DiscoveryRequest {
  city: string;
  category: string;
  sources: DiscoverySource[];
}

export interface DiscoveryRunState {
  city: string;
  district: string;
  zone: string;
  category: string;
  sources: DiscoverySource[];
}
