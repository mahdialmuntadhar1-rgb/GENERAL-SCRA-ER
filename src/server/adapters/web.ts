import { Business } from "../../types";
import { DiscoveryAdapter } from "./base";

export class WebDirectoryAdapter implements DiscoveryAdapter {
  id = 'web_directory' as const;
  name = 'Web Directory (Mock)';

  async discover(city: string, category: string): Promise<Partial<Business>[]> {
    // In a real app, this would use a library like puppeteer or cheerio
    // For v1, we simulate discovery of a few items to show the structure works
    console.log(`Mocking web directory discovery for ${category} in ${city}`);
    
    return [
      {
        name: `${category} Center ${city}`,
        local_name: `مركز ${category} في ${city}`,
        category,
        city,
        address: `Main St, ${city}`,
        phone: "+964 000 000 000",
        source: 'web_directory',
        source_url: 'https://example-iraq-directory.com',
        confidence_score: 0.6
      }
    ];
  }
}
