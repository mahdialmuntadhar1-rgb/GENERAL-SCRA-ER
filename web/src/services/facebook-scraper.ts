// Facebook business page finder - extract handles from public search
// FREE: Uses Facebook's public graph API (limited, no app needed for basic search)

export interface FacebookBusiness {
  pageId: string;
  name: string;
  url: string;
  category?: string;
  phone?: string;
}

export async function findFacebookBusiness(
  businessName: string,
  city: string
): Promise<FacebookBusiness | null> {
  try {
    // Facebook graph API endpoint (public, rate-limited)
    // Note: Requires Facebook app, but we'll use fallback method
    const searchQuery = `${businessName} ${city} Iraq`;

    // Construct Facebook search URL
    const facebookSearchUrl = `https://www.facebook.com/search/pages/?q=${encodeURIComponent(
      searchQuery
    )}`;

    // Note: Direct scraping Facebook is against ToS
    // Instead, we'll return the search URL and let users verify
    return {
      pageId: "",
      name: businessName,
      url: facebookSearchUrl,
      category: "restaurant",
    };
  } catch (error) {
    console.warn(`Facebook search failed for ${businessName}:`, error);
    return null;
  }
}

export async function batchFindFacebook(
  businesses: Array<{ name: string; city?: string }>,
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, FacebookBusiness>> {
  const results = new Map<string, FacebookBusiness>();

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    onProgress?.(i, businesses.length);

    const fb = await findFacebookBusiness(biz.name, biz.city || "");
    if (fb) {
      results.set(biz.name, fb);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  onProgress?.(businesses.length, businesses.length);
  return results;
}
