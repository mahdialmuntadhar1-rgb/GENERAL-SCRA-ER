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
export const CATEGORIES: Record<string, Category> = {
  restaurant: {
    name: "Restaurant",
    nameAr: "مطعم",
    osmTags: [
      "amenity=restaurant",
      "amenity=fast_food",
      "cuisine=iraqi",
      "cuisine=kebab",
      "cuisine=mediterranean",
    ],
    subcategories: ["iraqi_cuisine", "fast_food", "seafood", "fine_dining"],
  },
  cafe: {
    name: "Cafe",
    nameAr: "مقهى",
    osmTags: ["amenity=cafe", "amenity=coffee_shop", "shop=bakery"],
    subcategories: ["coffee_shop", "tea_house", "bakery_cafe"],
  },
  hotel: {
    name: "Hotel",
    nameAr: "فندق",
    osmTags: ["tourism=hotel", "tourism=motel", "tourism=guest_house"],
    subcategories: ["luxury", "budget", "guest_house"],
  },
  shop: {
    name: "Shop/Retail",
    nameAr: "متجر",
    osmTags: [
      "shop=supermarket",
      "shop=convenience",
      "shop=clothes",
      "shop=electronics",
      "shop=mobile_phone",
    ],
    subcategories: ["supermarket", "electronics", "clothing"],
  },
  healthcare: {
    name: "Healthcare",
    nameAr: "صحة",
    osmTags: [
      "amenity=hospital",
      "amenity=clinic",
      "amenity=pharmacy",
      "amenity=doctors",
    ],
    subcategories: ["hospital", "clinic", "pharmacy"],
  },
  bank: {
    name: "Bank/Finance",
    nameAr: "بنك",
    osmTags: [
      "amenity=bank",
      "amenity=atm",
      "amenity=money_transfer",
    ],
    subcategories: ["bank", "atm", "exchange"],
  },
  gasStation: {
    name: "Gas Station",
    nameAr: "محطة وقود",
    osmTags: ["amenity=fuel", "shop=gas"],
    subcategories: ["fuel", "gas", "electric_charging"],
  },
  carRepair: {
    name: "Car Repair",
    nameAr: "تصليح سيارات",
    osmTags: ["shop=car_repair", "shop=car_parts", "amenity=car_wash"],
    subcategories: ["repair", "parts", "wash"],
  },
  government: {
    name: "Government Office",
    nameAr: "دائرة حكومية",
    osmTags: [
      "office=government",
      "amenity=post_office",
      "amenity=courthouse",
    ],
    subcategories: ["post_office", "courthouse", "municipality"],
  },
  education: {
    name: "Education",
    nameAr: "تعليم",
    osmTags: [
      "amenity=school",
      "amenity=university",
      "amenity=college",
    ],
    subcategories: ["school", "university", "college"],
  },
  entertainment: {
    name: "Entertainment",
    nameAr: "ترفيه",
    osmTags: [
      "amenity=cinema",
      "amenity=theatre",
      "leisure=sports_centre",
    ],
    subcategories: ["cinema", "theater", "sports"],
  },
  tourism: {
    name: "Tourism/Attraction",
    nameAr: "سياحة",
    osmTags: [
      "tourism=museum",
      "tourism=attraction",
      "historic=monument",
    ],
    subcategories: ["museum", "monument", "historic_site"],
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
