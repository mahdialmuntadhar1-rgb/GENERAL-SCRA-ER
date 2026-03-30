import { CityConfig, Source } from './types';

export const IRAQ_CITIES: CityConfig[] = [
  {
    name: 'Baghdad',
    districts: [
      { name: 'Karkh', central_zones: ['Mansour', 'Yarmouk', 'Harthiya', 'Salhiya'] },
      { name: 'Rusafa', central_zones: ['Karrada', 'Jadriya', 'Zayouna', 'Adhamiya'] },
      { name: 'Central', central_zones: ['Bab Al-Sharqi', 'Mutanabbi', 'Rashid St'] }
    ]
  },
  {
    name: 'Erbil',
    districts: [
      { name: 'Central Erbil', central_zones: ['Citadel Area', 'Bakhtiyari', 'Dream City', 'Empire World'] },
      { name: 'Ankawa', central_zones: ['Ankawa Central', '100m Road'] }
    ]
  },
  {
    name: 'Basra',
    districts: [
      { name: 'Ashar', central_zones: ['Ashar Central', 'Corniche'] },
      { name: 'Jazaer', central_zones: ['Jazaer St', 'Abul Khasib Central'] }
    ]
  },
  {
    name: 'Sulaymaniyah',
    districts: [
      { name: 'Central Suly', central_zones: ['Salim St', 'Saholaka', 'Bakhtiari'] }
    ]
  },
  {
    name: 'Mosul',
    districts: [
      { name: 'Left Bank', central_zones: ['Zuhour', 'Muthanna', 'Masarif'] },
      { name: 'Right Bank', central_zones: ['Old City', 'Dawasah'] }
    ]
  }
];

export const SOURCES: Source[] = [
  { id: 'geoapify', name: 'Geoapify', type: 'api', freeTier: true, bulkSupport: true, socialSupport: false, priority: 1, enabled: true },
  { id: 'foursquare', name: 'Foursquare', type: 'api', freeTier: true, bulkSupport: true, socialSupport: true, priority: 2, enabled: true },
  { id: 'here', name: 'HERE', type: 'api', freeTier: true, bulkSupport: true, socialSupport: false, priority: 3, enabled: true },
  { id: 'tomtom', name: 'TomTom', type: 'api', freeTier: true, bulkSupport: true, socialSupport: false, priority: 4, enabled: true },
  { id: 'opencage', name: 'OpenCage', type: 'api', freeTier: true, bulkSupport: true, socialSupport: false, priority: 5, enabled: false },
  { id: 'serpapi', name: 'SerpApi', type: 'scraper', freeTier: false, bulkSupport: true, socialSupport: true, priority: 1, enabled: true },
  { id: 'outscraper', name: 'Outscraper', type: 'scraper', freeTier: false, bulkSupport: true, socialSupport: true, priority: 2, enabled: true },
  { id: 'apify', name: 'Apify', type: 'scraper', freeTier: false, bulkSupport: true, socialSupport: true, priority: 3, enabled: true },
  { id: 'osm', name: 'OSM/Nominatim', type: 'api', freeTier: true, bulkSupport: false, socialSupport: false, priority: 6, enabled: true },
  { id: 'csv', name: 'CSV Upload', type: 'file', freeTier: true, bulkSupport: true, socialSupport: true, priority: 1, enabled: true },
  { id: 'xlsx', name: 'XLSX Upload', type: 'file', freeTier: true, bulkSupport: true, socialSupport: true, priority: 2, enabled: true },
  { id: 'json', name: 'JSON Upload', type: 'file', freeTier: true, bulkSupport: true, socialSupport: true, priority: 3, enabled: true },
];

export const CATEGORIES = [
  'Retail',
  'Food & Beverage',
  'Health & Medical',
  'Technology',
  'Education',
  'Finance',
  'Professional Services',
  'Manufacturing',
  'Logistics',
  'Hospitality',
  'Real Estate',
  'Automotive'
];
