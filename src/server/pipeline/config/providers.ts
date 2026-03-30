import { ProviderConfig } from '../../../types';

export const PROVIDERS: ProviderConfig[] = [
  {
    provider_id: 'geoapify', provider_name: 'Geoapify', provider_type: 'poi', is_enabled: true, priority: 1,
    supports_phone: true, supports_social: false, supports_address: true, supports_coordinates: true,
    supports_hours: true, supports_images: false, supports_bulk: true, supports_free_tier: true,
    cost_notes: 'Free tier available, paid for higher limits.', rate_limit_notes: 'Rate-limited on free plan.'
  },
  {
    provider_id: 'foursquare', provider_name: 'Foursquare Places', provider_type: 'poi', is_enabled: true, priority: 6,
    supports_phone: true, supports_social: false, supports_address: true, supports_coordinates: true,
    supports_hours: true, supports_images: true, supports_bulk: true, supports_free_tier: true,
    cost_notes: 'Test/free tier depends on account.', rate_limit_notes: 'Quota-based.'
  },
  {
    provider_id: 'here', provider_name: 'HERE Discover', provider_type: 'poi', is_enabled: true, priority: 7,
    supports_phone: true, supports_social: false, supports_address: true, supports_coordinates: true,
    supports_hours: false, supports_images: false, supports_bulk: true, supports_free_tier: false,
    cost_notes: 'Freemium with monthly credits.', rate_limit_notes: 'Per-app and per-second rate limits.'
  },
  {
    provider_id: 'tomtom', provider_name: 'TomTom POI', provider_type: 'poi', is_enabled: true, priority: 8,
    supports_phone: true, supports_social: false, supports_address: true, supports_coordinates: true,
    supports_hours: false, supports_images: false, supports_bulk: true, supports_free_tier: false,
    cost_notes: 'Paid tiers with trial.', rate_limit_notes: 'API key quota constraints.'
  },
  {
    provider_id: 'nominatim', provider_name: 'OSM/Nominatim', provider_type: 'poi', is_enabled: false, priority: 9,
    supports_phone: false, supports_social: false, supports_address: true, supports_coordinates: true,
    supports_hours: false, supports_images: false, supports_bulk: false, supports_free_tier: true,
    cost_notes: 'Free but policy-restricted.', rate_limit_notes: 'Low-volume only; not for heavy bulk.'
  },
  {
    provider_id: 'serpapi', provider_name: 'SerpApi', provider_type: 'search', is_enabled: true, priority: 3,
    supports_phone: true, supports_social: true, supports_address: true, supports_coordinates: false,
    supports_hours: false, supports_images: false, supports_bulk: true, supports_free_tier: true,
    cost_notes: 'Paid usage with limited trial credits.', rate_limit_notes: 'Credit-based.'
  },
  {
    provider_id: 'outscraper', provider_name: 'Outscraper', provider_type: 'scraping', is_enabled: true, priority: 4,
    supports_phone: true, supports_social: true, supports_address: true, supports_coordinates: true,
    supports_hours: true, supports_images: true, supports_bulk: true, supports_free_tier: true,
    cost_notes: 'Free quota then paid.', rate_limit_notes: 'Quota and job queue limits.'
  },
  {
    provider_id: 'apify', provider_name: 'Apify', provider_type: 'scraping', is_enabled: true, priority: 5,
    supports_phone: true, supports_social: true, supports_address: true, supports_coordinates: true,
    supports_hours: true, supports_images: true, supports_bulk: true, supports_free_tier: true,
    cost_notes: 'Free usage units available.', rate_limit_notes: 'Actor execution quotas.'
  },
  {
    provider_id: 'csv_upload', provider_name: 'CSV Upload', provider_type: 'manual_upload', is_enabled: true, priority: 10,
    supports_phone: true, supports_social: true, supports_address: true, supports_coordinates: true,
    supports_hours: true, supports_images: true, supports_bulk: true, supports_free_tier: true,
    cost_notes: 'No external API cost.', rate_limit_notes: 'Limited by upload size.'
  },
  {
    provider_id: 'xlsx_upload', provider_name: 'XLSX Upload', provider_type: 'manual_upload', is_enabled: true, priority: 11,
    supports_phone: true, supports_social: true, supports_address: true, supports_coordinates: true,
    supports_hours: true, supports_images: true, supports_bulk: true, supports_free_tier: true,
    cost_notes: 'No external API cost.', rate_limit_notes: 'Limited by upload size.'
  },
  {
    provider_id: 'json_upload', provider_name: 'JSON Upload', provider_type: 'manual_upload', is_enabled: true, priority: 12,
    supports_phone: true, supports_social: true, supports_address: true, supports_coordinates: true,
    supports_hours: true, supports_images: true, supports_bulk: true, supports_free_tier: true,
    cost_notes: 'No external API cost.', rate_limit_notes: 'Limited by upload size.'
  }
];

export const FREE_TIER_PRIORITY = [
  'geoapify', 'opencage', 'serpapi', 'outscraper', 'apify', 'foursquare', 'here', 'tomtom', 'nominatim'
];
