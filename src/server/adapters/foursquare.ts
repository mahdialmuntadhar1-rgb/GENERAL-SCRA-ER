import { Business } from "../../types";
import { DiscoveryAdapter } from "./base";

export class FoursquareAdapter implements DiscoveryAdapter {
  id = 'foursquare' as const;
  name = 'Foursquare Places';

  async discover(city: string, category: string): Promise<Partial<Business>[]> {
    const apiKey = process.env.FOURSQUARE_API_KEY;
    if (!apiKey) {
      console.warn('[FoursquareAdapter] FOURSQUARE_API_KEY not set — skipping.');
      return [];
    }

    const url = new URL('https://api.foursquare.com/v3/places/search');
    url.searchParams.set('query', category);
    url.searchParams.set('near', `${city}, Iraq`);
    url.searchParams.set('limit', '15');
    url.searchParams.set('fields', 'fsq_id,name,location,tel,website,geocodes,confidence');

    const resp = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
        Accept: 'application/json',
      },
    });
    if (!resp.ok) throw new Error(`Foursquare API error: ${resp.status} ${resp.statusText}`);

    const data = await resp.json() as { results: any[] };

    return (data.results ?? []).map((place: any) => ({
      name:             place.name,
      category,
      city,
      address:          place.location?.formatted_address || place.location?.address || undefined,
      phone:            place.tel || undefined,
      website:          place.website || undefined,
      source:           'foursquare' as const,
      source_url:       place.fsq_id ? `https://foursquare.com/v/${place.fsq_id}` : undefined,
      confidence_score: 0.85,
      latitude:         place.geocodes?.main?.latitude,
      longitude:        place.geocodes?.main?.longitude,
      coverage_type:    'enrichment' as const,
    }));
  }
}
