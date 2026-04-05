import { Business } from "../../types";
import { DiscoveryAdapter } from "./base";

export class WebDirectoryAdapter implements DiscoveryAdapter {
  id = 'web_directory' as const;
  name = 'Web Directory (DuckDuckGo)';

  async discover(city: string, category: string): Promise<Partial<Business>[]> {
    const q = encodeURIComponent(`${category} in ${city} Iraq`);
    const resp = await fetch(
      `https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1`,
      { headers: { 'User-Agent': 'skyhigh-discovery/1.0' } }
    );
    if (!resp.ok) throw new Error(`DuckDuckGo request failed: ${resp.status}`);

    const body = await resp.json() as {
      RelatedTopics?: Array<{
        Text?: string;
        FirstURL?: string;
        Topics?: Array<{ Text?: string; FirstURL?: string }>;
      }>;
    };

    const categoryLower = category.toLowerCase();
    const cityLower = city.toLowerCase();

    const flat = (body.RelatedTopics ?? []).flatMap(r => r.Topics ? r.Topics : [r]);

    return flat
      .filter(r => {
        if (!r.Text) return false;
        const t = r.Text.toLowerCase();
        if (t === categoryLower || t === cityLower) return false;
        if (r.FirstURL?.includes('duckduckgo.com/c/')) return false;
        return t.includes(cityLower) || t.includes(categoryLower);
      })
      .slice(0, 10)
      .map(r => ({
        name: r.Text!.split(' - ')[0].trim(),
        category,
        city,
        source: 'web_directory' as const,
        source_url: r.FirstURL,
        confidence_score: 0.40
      }));
  }
}
