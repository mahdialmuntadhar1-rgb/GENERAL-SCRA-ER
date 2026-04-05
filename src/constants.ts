import { CityConfig, Source, DiscoverySourceConfig } from './types';

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

export const DISCOVERY_SOURCES: DiscoverySourceConfig[] = [
  {
    id: 'osm',
    label: 'OpenStreetMap / Overpass',
    description: 'Free business discovery, map-based search, and local place coverage.',
    hint: 'Best free open-source source for Iraq discovery.',
    tags: ['Free', 'Open Source', 'Discovery'],
    icon: 'MapPin',
    defaultChecked: true
  },
  {
    id: 'overture',
    label: 'Overture Maps',
    description: 'Large-scale base dataset, place discovery, and confidence-based matching.',
    hint: 'Best for large-scale base place dataset.',
    tags: ['Open Data', 'Large-scale', 'Discovery'],
    icon: 'Layers',
    defaultChecked: true
  },
  {
    id: 'foursquare',
    label: 'Foursquare',
    description: 'Search, business matching, phone enrichment, and claimed verification.',
    hint: 'Recommended for phone / website / social enrichment and claimed verification. Uses paid credits.',
    tags: ['Paid', 'Enrichment', 'Verification'],
    icon: 'ShieldCheck',
    defaultChecked: false
  },
  {
    id: 'web_directory',
    label: 'Web Directories',
    description: 'Targeted scraping of public business listing websites.',
    tags: ['Custom Scraping', 'Discovery'],
    icon: 'Globe',
    defaultChecked: false
  },
  {
    id: 'gemini',
    label: 'Gemini AI Search',
    description: 'Extracting or inferring business details from public web content.',
    tags: ['AI-assisted', 'Enrichment'],
    icon: 'Sparkles',
    defaultChecked: false
  },
  {
    id: 'iraqi_registry',
    label: 'Iraqi Official Registry',
    description: 'Official government data for business verification.',
    tags: ['Official', 'Verification'],
    icon: 'FileCheck',
    defaultChecked: false
  },
  {
    id: 'krd_registry',
    label: 'Kurdistan Region Registry',
    description: 'Official KRG data for business verification.',
    tags: ['Official', 'Verification'],
    icon: 'FileCheck',
    defaultChecked: false
  },
  {
    id: 'facebook',
    label: 'Facebook Pages',
    description: 'Public business pages and contact info.',
    tags: ['Social', 'Discovery'],
    icon: 'Facebook',
    defaultChecked: false
  },
  {
    id: 'instagram',
    label: 'Instagram Profiles',
    description: 'Public business profiles and visual content.',
    tags: ['Social', 'Discovery'],
    icon: 'Instagram',
    defaultChecked: false
  },
  {
    id: 'telegram',
    label: 'Telegram Channels',
    description: 'Public business channels and local updates.',
    tags: ['Social', 'Discovery'],
    icon: 'Send',
    defaultChecked: false
  }
];

export const CATEGORIES = [
  { id: 'restaurants_dining', name: 'Restaurants & Dining', icon: 'UtensilsCrossed', types: 4 },
  { id: 'cafes_coffee', name: 'Cafes & Coffee', icon: 'Coffee', types: 3 },
  { id: 'hotels_stays', name: 'Hotels & Stays', icon: 'Building2', types: 3 },
  { id: 'shopping_retail', name: 'Shopping & Retail', icon: 'ShoppingBag', types: 3 },
  { id: 'banks_finance', name: 'Banks & Finance', icon: 'Landmark', types: 3 },
  { id: 'education', name: 'Education', icon: 'GraduationCap', types: 3 },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film', types: 3 },
  { id: 'tourism_travel', name: 'Tourism & Travel', icon: 'Plane', types: 3 },
  { id: 'doctors_physicians', name: 'Doctors & Physicians', icon: 'Stethoscope', types: 6 },
  { id: 'lawyers_legal', name: 'Lawyers & Legal', icon: 'Scale', types: 3 },
  { id: 'hospitals_clinics', name: 'Hospitals & Clinics', icon: 'Hospital', types: 4 },
  { id: 'medical_clinics', name: 'Medical Clinics', icon: 'HeartPulse', types: 5 },
  { id: 'real_estate', name: 'Real Estate', icon: 'Home', types: 4 },
  { id: 'events_venues', name: 'Events & Venues', icon: 'PartyPopper', types: 4, hot: true },
  { id: 'others_general', name: 'Others & General', icon: 'MoreHorizontal', types: 4 },
  { id: 'pharmacy_drugs', name: 'Pharmacy & Drugs', icon: 'Pill', types: 3 },
  { id: 'gym_fitness', name: 'Gym & Fitness', icon: 'Dumbbell', types: 4 },
  { id: 'beauty_salons', name: 'Beauty & Salons', icon: 'Sparkles', types: 4 },
  { id: 'supermarkets', name: 'Supermarkets', icon: 'Store', types: 4 },
  { id: 'furniture_home', name: 'Furniture & Home', icon: 'Sofa', types: 4 }
];
