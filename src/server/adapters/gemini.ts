import { GoogleGenAI, Type } from '@google/genai';
import { BusinessRecord } from '../../types';
import { DiscoveryAdapter } from './base';

export class GeminiAdapter implements DiscoveryAdapter {
  id = 'gemini' as const;
  name = 'Gemini Research';

  async discover(city: string, category: string): Promise<Partial<BusinessRecord>[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found');
      return [];
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Find 5 to 10 real businesses in ${city}, Iraq for category ${category}.
Return CITY-CENTER districts only; avoid suburbs/outskirts/villages.
Include: business_name, district, address_text, phone_primary, website_url, facebook_url, instagram_url, google_maps_url, governorate_raw.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                business_name: { type: Type.STRING },
                district: { type: Type.STRING },
                address_text: { type: Type.STRING },
                phone_primary: { type: Type.STRING },
                website_url: { type: Type.STRING },
                facebook_url: { type: Type.STRING },
                instagram_url: { type: Type.STRING },
                google_maps_url: { type: Type.STRING },
                governorate_raw: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['business_name', 'district']
            }
          }
        }
      });

      const businesses: any[] = JSON.parse(response.text || '[]');

      return businesses.map((b) => ({
        ...b,
        category,
        city,
        source_name: 'Gemini Research',
        source_url: 'https://gemini.google.com',
        source_type: 'gemini'
      }));
    } catch (error) {
      console.error('Gemini discovery error:', error);
      return [];
    }
  }
}
