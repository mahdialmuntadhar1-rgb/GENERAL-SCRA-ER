// Google Places API enrichment service
// Uses the Places API (New) to fetch phone, website, social media for businesses

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || "";

export const googlePlacesConfigured = !!import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

export interface PlaceEnrichment {
  phone?: string;
  website?: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  openingHours?: string[];
  googleMapsUri?: string;
  types?: string[];
  businessStatus?: string;
}

interface GooglePlace {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  currentOpeningHours?: { weekdayDescriptions?: string[] };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  businessStatus?: string;
  types?: string[];
}

// Find a place by name near given coordinates and return enrichment data
export async function enrichWithGooglePlaces(
  name: string,
  lat: number,
  lon: number,
  category?: string
): Promise<PlaceEnrichment | null> {
  if (!GOOGLE_API_KEY) return null;

  try {
    const searchQuery = `${name} ${category || ""}`.trim();

    const searchResponse = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.nationalPhoneNumber",
            "places.internationalPhoneNumber",
            "places.websiteUri",
            "places.googleMapsUri",
            "places.rating",
            "places.userRatingCount",
            "places.currentOpeningHours",
            "places.regularOpeningHours",
            "places.businessStatus",
            "places.types",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery: searchQuery,
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lon },
              radius: 5000,
            },
          },
          maxResultCount: 3,
          languageCode: "ar",
        }),
      }
    );

    if (!searchResponse.ok) {
      console.warn("Google Places search failed:", searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    const places: GooglePlace[] = searchData.places || [];

    if (places.length === 0) return null;

    const place = findBestMatch(places, name);
    if (!place) return null;

    const enrichment: PlaceEnrichment = {};

    if (place.internationalPhoneNumber) {
      enrichment.phone = place.internationalPhoneNumber;
    } else if (place.nationalPhoneNumber) {
      enrichment.phone = place.nationalPhoneNumber;
    }

    if (place.websiteUri) enrichment.website = place.websiteUri;
    if (place.formattedAddress) enrichment.address = place.formattedAddress;

    if (place.rating) {
      enrichment.rating = place.rating;
      enrichment.userRatingsTotal = place.userRatingCount;
    }

    const hours = place.regularOpeningHours || place.currentOpeningHours;
    if (hours?.weekdayDescriptions) {
      enrichment.openingHours = hours.weekdayDescriptions;
    }

    if (place.googleMapsUri) enrichment.googleMapsUri = place.googleMapsUri;
    if (place.types) enrichment.types = place.types;
    if (place.businessStatus) enrichment.businessStatus = place.businessStatus;

    return enrichment;
  } catch (error) {
    console.warn("Google Places enrichment error:", error);
    return null;
  }
}

// Batch enrich multiple businesses (with rate limiting)
export async function batchEnrich(
  businesses: Array<{ name: string; lat: number; lon: number; category?: string }>,
  onProgress?: (done: number, total: number) => void
): Promise<Map<number, PlaceEnrichment>> {
  const results = new Map<number, PlaceEnrichment>();

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    onProgress?.(i, businesses.length);

    const enrichment = await enrichWithGooglePlaces(
      biz.name,
      biz.lat,
      biz.lon,
      biz.category
    );

    if (enrichment) {
      results.set(i, enrichment);
    }

    if (i < businesses.length - 1) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  onProgress?.(businesses.length, businesses.length);
  return results;
}

function findBestMatch(places: GooglePlace[], targetName: string): GooglePlace | null {
  if (places.length === 0) return null;
  if (places.length === 1) return places[0];

  const target = targetName.toLowerCase().trim();
  let bestScore = -1;
  let bestPlace = places[0];

  for (const place of places) {
    const placeName = (place.displayName?.text || "").toLowerCase().trim();
    let score = 0;

    if (placeName === target) {
      score = 100;
    } else if (placeName.includes(target) || target.includes(placeName)) {
      score = 70;
    } else {
      const targetWords = target.split(/\s+/);
      const placeWords = placeName.split(/\s+/);
      const overlap = targetWords.filter((w) => placeWords.includes(w)).length;
      score = (overlap / Math.max(targetWords.length, 1)) * 50;
    }

    if (place.internationalPhoneNumber || place.nationalPhoneNumber) {
      score += 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPlace = place;
    }
  }

  return bestPlace;
}
