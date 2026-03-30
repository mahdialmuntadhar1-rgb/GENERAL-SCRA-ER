import { GoogleGenAI, Type } from "@google/genai";
import { Business } from "../../types";
import { DiscoveryAdapter } from "./base";

export class GeminiAdapter implements DiscoveryAdapter {
  id = 'gemini' as const;
  name = 'Gemini Research';

  async discover(city: string, category: string): Promise<Partial<Business>[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found");
      return [];
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Research and list 5-10 real, existing businesses in the category "${category}" located in "${city}", Iraq. 
    Provide detailed information including their name, local name (in Arabic), address, and phone number if available.
    Focus on accuracy and verifiable businesses.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                local_name: { type: Type.STRING },
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
                website: { type: Type.STRING },
                facebook_url: { type: Type.STRING },
                instagram_url: { type: Type.STRING },
                governorate: { type: Type.STRING },
                confidence_score: { type: Type.NUMBER }
              },
              required: ["name"]
            }
          }
        }
      });

      const businesses: any[] = JSON.parse(response.text || "[]");
      
      return businesses.map(b => ({
        ...b,
        category,
        city,
        source: 'gemini',
        source_url: 'https://gemini.google.com',
        confidence_score: b.confidence_score || 0.8
      }));
    } catch (error) {
      console.error("Gemini discovery error:", error);
      return [];
    }
  }
}
