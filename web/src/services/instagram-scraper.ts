// Instagram business finder - extract handles from location tags
// FREE: Uses Instagram's public web interface (no API key needed)

export interface InstagramBusiness {
  handle: string;
  url: string;
  followersEstimate?: number;
}

export async function findInstagramBusiness(
  businessName: string,
  city: string
): Promise<InstagramBusiness | null> {
  try {
    // Instagram hashtag pages are public, try to fetch
    const searchQuery = `${businessName} ${city}`;
    const instagramSearchUrl = `https://www.instagram.com/web/search/topsearch/?query=${encodeURIComponent(
      searchQuery
    )}`;

    const response = await fetch(instagramSearchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { users?: Array<{ user: { username: string } }> };
    const users = data?.users || [];

    if (users.length === 0) return null;

    // Take first result (most relevant)
    const topResult = users[0];
    const handle = topResult?.user?.username;

    if (handle) {
      return {
        handle,
        url: `https://instagram.com/${handle}`,
      };
    }

    return null;
  } catch (error) {
    console.warn(`Instagram search failed for ${businessName}:`, error);
    return null;
  }
}

export async function batchFindInstagram(
  businesses: Array<{ name: string; city?: string }>,
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, InstagramBusiness>> {
  const results = new Map<string, InstagramBusiness>();

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    onProgress?.(i, businesses.length);

    const ig = await findInstagramBusiness(biz.name, biz.city || "");
    if (ig) {
      results.set(biz.name, ig);
    }

    // Rate limit
    await new Promise((r) => setTimeout(r, 500));
  }

  onProgress?.(businesses.length, businesses.length);
  return results;
}
