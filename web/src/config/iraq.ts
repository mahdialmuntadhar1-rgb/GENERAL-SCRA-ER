// All 18 Iraqi Governorates with center coordinates
export const IRAQ_GOVERNORATES: Record<string, Governorate> = {
  Baghdad: {
    lat: 33.3152,
    lon: 44.3661,
    ar: "بغداد",
    majorCities: [
      { name: "Baghdad", lat: 33.3152, lon: 44.3661 },
      { name: "Sadr City", lat: 33.3869, lon: 44.4561 },
      { name: "Kadhimiya", lat: 33.3792, lon: 44.3525 },
      { name: "Adhamiyah", lat: 33.3525, lon: 44.3792 },
    ],
  },
  Basra: {
    lat: 30.5081,
    lon: 47.7804,
    ar: "البصرة",
    majorCities: [
      { name: "Basra", lat: 30.5081, lon: 47.7804 },
      { name: "Zubair", lat: 30.3928, lon: 47.7050 },
    ],
  },
  Nineveh: {
    lat: 36.3350,
    lon: 43.1333,
    ar: "نينوى",
    majorCities: [
      { name: "Mosul", lat: 36.3350, lon: 43.1333 },
      { name: "Tel Afar", lat: 36.3750, lon: 42.4500 },
    ],
  },
  Erbil: {
    lat: 36.1911,
    lon: 44.0092,
    ar: "أربيل",
    majorCities: [
      { name: "Erbil", lat: 36.1911, lon: 44.0092 },
      { name: "Shaqlawa", lat: 36.4042, lon: 44.3086 },
    ],
  },
  Sulaymaniyah: {
    lat: 35.5553,
    lon: 45.4343,
    ar: "السليمانية",
    majorCities: [
      { name: "Sulaymaniyah", lat: 35.5553, lon: 45.4343 },
      { name: "Halabja", lat: 35.1778, lon: 45.9861 },
    ],
  },
  Duhok: {
    lat: 36.8635,
    lon: 42.9356,
    ar: "دهوك",
    majorCities: [
      { name: "Duhok", lat: 36.8635, lon: 42.9356 },
      { name: "Amedi", lat: 37.0917, lon: 43.4878 },
    ],
  },
  Kirkuk: {
    lat: 35.4686,
    lon: 44.3938,
    ar: "كركوك",
    majorCities: [
      { name: "Kirkuk", lat: 35.4686, lon: 44.3938 },
    ],
  },
  Diyala: {
    lat: 33.7750,
    lon: 44.9600,
    ar: "ديالى",
    majorCities: [
      { name: "Baqubah", lat: 33.7444, lon: 44.6436 },
    ],
  },
  Anbar: {
    lat: 33.4333,
    lon: 43.2500,
    ar: "الأنبار",
    majorCities: [
      { name: "Ramadi", lat: 33.4206, lon: 43.3031 },
      { name: "Fallujah", lat: 33.3531, lon: 43.7828 },
    ],
  },
  Maysan: {
    lat: 31.8369,
    lon: 47.2786,
    ar: "ميسان",
    majorCities: [
      { name: "Amarah", lat: 31.8369, lon: 47.2786 },
    ],
  },
  Muthanna: {
    lat: 31.3170,
    lon: 45.3000,
    ar: "المثنى",
    majorCities: [
      { name: "Samawah", lat: 31.3170, lon: 45.3000 },
    ],
  },
  Qadisiyyah: {
    lat: 31.9667,
    lon: 45.0167,
    ar: "القادسية",
    majorCities: [
      { name: "Diwaniyah", lat: 31.9886, lon: 44.9244 },
    ],
  },
  Babil: {
    lat: 32.4640,
    lon: 44.4240,
    ar: "بابل",
    majorCities: [
      { name: "Hillah", lat: 32.4833, lon: 44.4333 },
    ],
  },
  Wasit: {
    lat: 32.5000,
    lon: 45.8333,
    ar: "واسط",
    majorCities: [
      { name: "Kut", lat: 32.5097, lon: 45.8192 },
    ],
  },
  Salahaddin: {
    lat: 34.6167,
    lon: 43.9333,
    ar: "صلاح الدين",
    majorCities: [
      { name: "Tikrit", lat: 34.6167, lon: 43.6833 },
      { name: "Samarra", lat: 34.1959, lon: 43.8856 },
    ],
  },
  Najaf: {
    lat: 32.0280,
    lon: 44.3860,
    ar: "النجف",
    majorCities: [
      { name: "Najaf", lat: 32.0280, lon: 44.3860 },
    ],
  },
  Karbala: {
    lat: 32.6167,
    lon: 44.0333,
    ar: "كربلاء",
    majorCities: [
      { name: "Karbala", lat: 32.6167, lon: 44.0333 },
    ],
  },
  DhiQar: {
    lat: 31.0500,
    lon: 46.2667,
    ar: "ذي قار",
    majorCities: [
      { name: "Nasiriyah", lat: 31.0436, lon: 46.2575 },
    ],
  },
};

export interface Governorate {
  lat: number;
  lon: number;
  ar: string;
  majorCities: City[];
}

export interface City {
  name: string;
  lat: number;
  lon: number;
}

// Business Categories with OSM tags
export type CategoryKey =
  | "dining_cuisine"
  | "cafe_coffee"
  | "shopping_retail"
  | "entertainment_events"
  | "accommodation_stays"
  | "culture_heritage"
  | "business_services"
  | "health_wellness"
  | "doctors"
  | "hospitals"
  | "clinics"
  | "transport_mobility"
  | "public_essential"
  | "lawyers"
  | "education";

export const CATEGORIES: Record<CategoryKey, Category> = {
  dining_cuisine: {
    name: "Dining & Cuisine",
    nameAr: "المطاعم والمأكولات",
    osmTags: [
      "amenity=restaurant",
      "amenity=fast_food",
      "amenity=food_court",
      "amenity=bbq",
      "cuisine=iraqi",
      "cuisine=kebab",
      "cuisine=mediterranean",
    ],
    subcategories: ["fine_dining", "casual", "fast_food", "traditional", "international"],
  },
  cafe_coffee: {
    name: "Cafe & Coffee",
    nameAr: "المقاهي والقهوة",
    osmTags: [
      "amenity=cafe",
      "amenity=coffee_shop",
      "amenity=tea_house",
      "shop=coffee",
      "shop=bakery",
    ],
    subcategories: ["coffee", "tea", "dessert", "breakfast", "workspace"],
  },
  shopping_retail: {
    name: "Shopping & Retail",
    nameAr: "التسوق والتجزئة",
    osmTags: [
      "shop=clothes",
      "shop=electronics",
      "shop=shoes",
      "shop=bags",
      "shop=jewelry",
      "shop=mall",
      "shop=department_store",
      "amenity=marketplace",
    ],
    subcategories: ["fashion", "electronics", "home", "gifts", "specialty"],
  },
  entertainment_events: {
    name: "Entertainment & Events",
    nameAr: "الترفيه والفعاليات",
    osmTags: [
      "amenity=cinema",
      "amenity=theatre",
      "amenity=nightclub",
      "amenity=events_venue",
      "amenity=community_centre",
      "amenity=conference_centre",
      "amenity=exhibition_center",
    ],
    subcategories: ["cinema", "theatre", "events", "nightlife", "gaming"],
  },
  accommodation_stays: {
    name: "Accommodation & Stays",
    nameAr: "الإقامة والفنادق",
    osmTags: [
      "tourism=hotel",
      "tourism=hostel",
      "tourism=guest_house",
      "tourism=motel",
      "tourism=apartment",
    ],
    subcategories: ["hotel", "hostel", "apartment", "resort", "budget"],
  },
  culture_heritage: {
    name: "Culture & Heritage",
    nameAr: "الثقافة والتراث",
    osmTags: [
      "historic=*",
      "tourism=museum",
      "tourism=gallery",
      "amenity=library",
      "amenity=place_of_worship",
      "historic=monument",
    ],
    subcategories: ["museum", "gallery", "library", "historic", "religious"],
  },
  business_services: {
    name: "Business & Services",
    nameAr: "الأعمال والخدمات",
    osmTags: [
      "office=*",
      "amenity=bank",
      "amenity=atm",
      "amenity=post_office",
      "amenity=courier",
      "shop=copyshop",
    ],
    subcategories: ["banking", "office", "logistics", "printing", "consulting"],
  },
  health_wellness: {
    name: "Health & Wellness",
    nameAr: "الصحة والعافية",
    osmTags: [
      "amenity=pharmacy",
      "shop=pharmacy",
      "healthcare=pharmacy",
      "leisure=fitness_centre",
      "leisure=sports_centre",
      "amenity=gym",
      "shop=beauty",
      "shop=hairdresser",
      "shop=cosmetics",
      "amenity=spa",
    ],
    subcategories: ["pharmacy", "fitness", "wellness", "beauty", "spa"],
  },
  doctors: {
    name: "Doctors",
    nameAr: "الأطباء",
    osmTags: [
      "amenity=doctors",
      "healthcare=doctor",
      "healthcare=clinic",
      "healthcare=general_practice",
      "healthcare=specialist",
    ],
    subcategories: ["general", "specialist", "dentist", "pediatric", "dermatology"],
  },
  hospitals: {
    name: "Hospitals",
    nameAr: "المستشفيات",
    osmTags: [
      "amenity=hospital",
      "healthcare=hospital",
      "building=hospital",
      "emergency=yes",
    ],
    subcategories: ["general", "specialized", "emergency", "private", "public"],
  },
  clinics: {
    name: "Clinics",
    nameAr: "العيادات",
    osmTags: [
      "amenity=clinic",
      "healthcare=clinic",
      "healthcare=center",
      "healthcare=laboratory",
      "healthcare=diagnostic",
    ],
    subcategories: ["medical", "dental", "eye_care", "diagnostic", "therapy"],
  },
  transport_mobility: {
    name: "Transport & Mobility",
    nameAr: "النقل والتنقل",
    osmTags: [
      "amenity=fuel",
      "shop=car",
      "shop=car_repair",
      "amenity=car_rental",
      "amenity=taxi",
      "amenity=bus_station",
      "amenity=charging_station",
      "aeroway=aerodrome",
    ],
    subcategories: ["fuel", "rental", "repair", "parking", "ev_charging"],
  },
  public_essential: {
    name: "Public & Essential",
    nameAr: "الخدمات العامة والأساسية",
    osmTags: [
      "amenity=police",
      "amenity=fire_station",
      "amenity=hospital",
      "amenity=clinic",
      "amenity=pharmacy",
      "amenity=post_office",
      "office=government",
      "amenity=public_building",
    ],
    subcategories: ["safety", "healthcare", "government", "utilities", "emergency"],
  },
  lawyers: {
    name: "Lawyers",
    nameAr: "المحامون",
    osmTags: [
      "office=lawyer",
      "office=legal",
      "amenity=courthouse",
      "office=notary",
    ],
    subcategories: ["legal", "notary", "consultation", "corporate", "personal"],
  },
  education: {
    name: "Education",
    nameAr: "التعليم",
    osmTags: [
      "amenity=school",
      "amenity=university",
      "amenity=college",
      "amenity=kindergarten",
      "amenity=language_school",
      "amenity=driving_school",
    ],
    subcategories: ["school", "university", "training", "language", "kindergarten"],
  },
};

export interface Category {
  name: string;
  nameAr: string;
  osmTags: string[];
  subcategories: string[];
}

export const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export const RATE_LIMIT_DELAY = 1000; // ms between requests
export const DEFAULT_SEARCH_RADIUS = 10000; // 10km
export const BATCH_SIZE = 50;
