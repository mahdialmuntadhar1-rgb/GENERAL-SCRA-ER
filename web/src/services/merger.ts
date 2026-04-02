// Merge data from multiple sources with priority: Google Places > OSM
// Never overwrites good data with empty — only upgrades

import type { Business } from "@/lib/supabase";
import type { PlaceEnrichment } from "./google-places";

export type MergeSource = "osm" | "google_places" | "merged";

export interface MergeResult {
  business: Partial<Business>;
  source: MergeSource;
  enrichedFields: string[]; // Which fields were filled/upgraded
}

/**
 * Merge OSM business with Google Places enrichment
 * Priority: Google data wins, but never overwrites existing good data
 */
export function mergeWithGoogleEnrichment(
  osmBusiness: Partial<Business>,
  googleEnrichment: PlaceEnrichment | null
): MergeResult {
  const enrichedFields: string[] = [];

  if (!googleEnrichment) {
    // No Google data — keep OSM as-is
    return {
      business: osmBusiness,
      source: "osm",
      enrichedFields: [],
    };
  }

  const merged = { ...osmBusiness };
  let upgraded = false;

  // Phone: Google > OSM (Google more reliable)
  if (googleEnrichment.phone && !merged.phone) {
    merged.phone = googleEnrichment.phone;
    enrichedFields.push("phone");
    upgraded = true;
  } else if (googleEnrichment.phone && merged.phone) {
    // Both exist — keep OSM unless it's clearly malformed
    // (For now, trust OSM normalization)
  }

  // Website: Google > OSM
  if (googleEnrichment.website && !merged.website) {
    merged.website = googleEnrichment.website;
    enrichedFields.push("website");
    upgraded = true;
  }

  // Address: Google > OSM (more detailed)
  if (googleEnrichment.address && !merged.address) {
    merged.address = googleEnrichment.address;
    enrichedFields.push("address");
    upgraded = true;
  }

  // Rating: Google > OSM (Google has more reviews)
  if (googleEnrichment.rating && !merged.rating) {
    merged.rating = googleEnrichment.rating;
    enrichedFields.push("rating");
    upgraded = true;
  } else if (googleEnrichment.rating && merged.rating) {
    // Prefer Google if it has more ratings
    const googleWeight = googleEnrichment.userRatingsTotal || 0;
    const osmWeight = (merged as any).reviewCount || 0;
    if (googleWeight > osmWeight) {
      merged.rating = googleEnrichment.rating;
      merged.reviewCount = googleEnrichment.userRatingsTotal;
      enrichedFields.push("rating");
      upgraded = true;
    }
  }

  // Opening hours: Google > OSM
  if (googleEnrichment.openingHours && !merged.openHours) {
    merged.openHours = googleEnrichment.openingHours.join(" | ");
    enrichedFields.push("openHours");
    upgraded = true;
  }

  // Google Maps URL
  if (googleEnrichment.googleMapsUri) {
    (merged as any).maps_url = googleEnrichment.googleMapsUri;
    enrichedFields.push("maps_url");
  }

  // Determine source
  const source: MergeSource = upgraded ? "merged" : "osm";

  return {
    business: merged,
    source,
    enrichedFields,
  };
}

/**
 * Check if a business is likely to have Google Places match
 * (has name, coordinates, within Iraq bounds)
 */
export function isEnrichmentCandidate(business: Partial<Business>): boolean {
  return !!(
    business.name &&
    business.name.length > 2 &&
    business.lat &&
    business.lng &&
    // Within Iraq's rough bounds
    business.lat > 29 &&
    business.lat < 37.5 &&
    business.lng > 38 &&
    business.lng < 49
  );
}
