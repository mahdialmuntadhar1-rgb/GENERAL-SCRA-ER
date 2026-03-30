import { Business } from '../../types';
import { DiscoveryAdapter } from './base';

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  class?: string;
  osm_type?: string;
  osm_id?: number;
  namedetails?: {
    [key: string]: string;
  };
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
  };
  extratags?: {
    website?: string;
    contact_website?: string;
    phone?: string;
    contact_phone?: string;
    facebook?: string;
    instagram?: string;
  };
}

export class WebDirectoryAdapter implements DiscoveryAdapter {
  id = 'osm' as const;
  name = 'OpenStreetMap/Nominatim';

  async discover(city: string, category: string): Promise<Partial<Business>[]> {
    const query = encodeURIComponent(`${category} in ${city}, Iraq`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}&countrycodes=iq&addressdetails=1&namedetails=1&extratags=1&limit=25`, {
        headers: {
          'User-Agent': 'SKYHIGH/1.0 (business discovery)',
          Accept: 'application/json'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Nominatim request failed: ${response.status}`);
      }

      const rows = (await response.json()) as NominatimResult[];
      if (!Array.isArray(rows) || rows.length === 0) {
        return [];
      }

      return rows
        .filter((row) => row.name || row.display_name)
        .map((row) => {
          const name = row.name || row.display_name.split(',')[0]?.trim();
          const sourceUrl = row.osm_type && row.osm_id
            ? `https://www.openstreetmap.org/${row.osm_type}/${row.osm_id}`
            : 'https://www.openstreetmap.org';

          return {
            name,
            local_name: row.namedetails?.['name:ar'] || null,
            category,
            city,
            district: row.address?.suburb || row.address?.neighbourhood || null,
            address: row.display_name,
            latitude: Number(row.lat),
            longitude: Number(row.lon),
            phone: row.extratags?.contact_phone || row.extratags?.phone || null,
            website: row.extratags?.contact_website || row.extratags?.website || null,
            facebook_url: row.extratags?.facebook || null,
            instagram_url: row.extratags?.instagram || null,
            source: 'osm',
            source_url: sourceUrl,
            confidence_score: 0.9,
            raw_data: row
          };
        })
        .filter((biz) => Boolean(biz.name));
    } finally {
      clearTimeout(timeout);
    }
  }
}
