import { BusinessRecord } from '../../types';
import { DiscoveryAdapter } from './base';

export class WebDirectoryAdapter implements DiscoveryAdapter {
  id = 'web_directory' as const;
  name = 'Web Directory (Mock)';

  async discover(city: string, category: string): Promise<Partial<BusinessRecord>[]> {
    console.log(`Mocking city-center web directory discovery for ${category} in ${city}`);

    return [
      {
        business_name: `${category} Center ${city}`,
        normalized_business_name: `${category} center ${city}`.toLowerCase(),
        category,
        city,
        district: 'City Center',
        address_text: `Central District, ${city}`,
        phone_primary: '+964 770 000 0000',
        source_name: 'Mock Iraq Directory',
        source_url: 'https://example-iraq-directory.com',
        source_type: 'web_directory'
      }
    ];
  }
}
