import { Business } from "../../types";
import { DiscoveryAdapter } from "./base";

const CATEGORY_TO_AMENITY: Record<string, string> = {
  restaurants: 'restaurant',
  restaurant: 'restaurant',
  cafes: 'cafe',
  cafe: 'cafe',
  bakeries: 'bakery',
  bakery: 'bakery',
  hotels: 'hotel',
  hotel: 'hotel',
  gyms: 'gym',
  gym: 'fitness_centre',
  pharmacies: 'pharmacy',
  pharmacy: 'pharmacy',
  supermarkets: 'supermarket',
  supermarket: 'supermarket',
  hospitals: 'hospital',
  hospital: 'hospital',
  banks: 'bank',
  bank: 'bank',
  schools: 'school',
  school: 'school',
};

export class OSMAdapter implements DiscoveryAdapter {
  id = 'osm' as const;
  name = 'OpenStreetMap (Overpass)';

  async discover(city: string, category: string): Promise<Partial<Business>[]> {
    const headers = { 'User-Agent': 'skyhigh-discovery/1.0' };

    // Step 1: Geocode city via Nominatim
    const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', Iraq')}&format=json&limit=1`;
    const geoResp = await fetch(geoUrl, { headers });
    if (!geoResp.ok) throw new Error(`Nominatim error: ${geoResp.status}`);
    const geoData = await geoResp.json() as Array<{ lat: string; lon: string }>;
    if (!geoData.length) return [];

    const { lat, lon } = geoData[0];
    const amenity = CATEGORY_TO_AMENITY[category.toLowerCase()] ?? category.toLowerCase();

    // Step 2: Query Overpass with 15 km radius
    const query = `[out:json][timeout:20];node["amenity"="${amenity}"](around:15000,${lat},${lon});out 20;`;
    const overpassResp = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      { headers }
    );
    if (!overpassResp.ok) throw new Error(`Overpass error: ${overpassResp.status}`);
    const overpassData = await overpassResp.json() as { elements: any[] };

    return (overpassData.elements ?? []).map((el: any) => ({
      name:           el.tags?.name || el.tags?.['name:en'] || undefined,
      local_name:     el.tags?.['name:ar'] || undefined,
      category,
      city,
      address:        el.tags?.['addr:street']
                        ? `${el.tags?.['addr:housenumber'] ?? ''} ${el.tags?.['addr:street']}`.trim()
                        : undefined,
      phone:          el.tags?.phone || el.tags?.['contact:phone'] || undefined,
      website:        el.tags?.website || el.tags?.['contact:website'] || undefined,
      source:         'osm' as const,
      source_url:     `https://www.openstreetmap.org/node/${el.id}`,
      confidence_score: 0.70,
      latitude:       el.lat,
      longitude:      el.lon,
    })).filter(b => !!b.name);
  }
}
