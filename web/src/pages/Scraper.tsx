import { useState, useCallback } from "react";
import { useScraperStore, useReviewStore } from "@/stores";
import { IRAQ_GOVERNORATES, CATEGORIES } from "@/config/iraq";
import { normalizePhone } from "@/services/validation";
import { mapCategoryToHumus, mapGovernorateToHumus } from "@/lib/supabase";
import { validateIraqiPhone } from "@/services/phone-validator";
import { batchFindInstagram } from "@/services/instagram-scraper";
import { batchFindFacebook } from "@/services/facebook-scraper";
import { toast } from "sonner";
import type { Business } from "@/lib/supabase";
import {
  Play, Square, RotateCw, MapPin, Settings, Tags,
  Utensils, Coffee, Hotel, ShoppingBag, HeartPulse,
  Building2, GraduationCap,
  Film, Plane, Stethoscope, Scale, Hospital,
  Home, PartyPopper, MoreHorizontal, Check,
  Pill, Dumbbell, Sparkles, Store, Sofa,
} from "lucide-react";

// Category icon mapping for card display
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  restaurant: <Utensils className="h-6 w-6" />,
  cafe: <Coffee className="h-6 w-6" />,
  hotel: <Hotel className="h-6 w-6" />,
  shop: <ShoppingBag className="h-6 w-6" />,
  bank: <Building2 className="h-6 w-6" />,
  education: <GraduationCap className="h-6 w-6" />,
  entertainment: <Film className="h-6 w-6" />,
  tourism: <Plane className="h-6 w-6" />,
  doctors: <Stethoscope className="h-6 w-6" />,
  lawyers: <Scale className="h-6 w-6" />,
  hospitals: <Hospital className="h-6 w-6" />,
  clinics: <HeartPulse className="h-6 w-6" />,
  realestate: <Home className="h-6 w-6" />,
  events: <PartyPopper className="h-6 w-6" />,
  others: <MoreHorizontal className="h-6 w-6" />,
  pharmacy: <Pill className="h-6 w-6" />,
  gym: <Dumbbell className="h-6 w-6" />,
  beauty: <Sparkles className="h-6 w-6" />,
  supermarket: <Store className="h-6 w-6" />,
  furniture: <Sofa className="h-6 w-6" />,
};

// Category display names for cards
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  restaurant: "RESTAURANTS & DINING",
  cafe: "CAFES & COFFEE",
  shop: "SHOPPING & RETAIL",
  hotel: "HOTELS & STAYS",
  bank: "BANKS & FINANCE",
  education: "EDUCATION",
  entertainment: "ENTERTAINMENT",
  tourism: "TOURISM & TRAVEL",
  doctors: "DOCTORS & PHYSICIANS",
  lawyers: "LAWYERS & LEGAL",
  hospitals: "HOSPITALS & CLINICS",
  clinics: "MEDICAL CLINICS",
  realestate: "REAL ESTATE",
  events: "EVENTS & VENUES",
  others: "OTHERS & GENERAL",
  pharmacy: "PHARMACY & DRUGS",
  gym: "GYM & FITNESS",
  beauty: "BEAUTY & SALONS",
  supermarket: "SUPERMARKETS",
  furniture: "FURNITURE & HOME",
};

export function Scraper() {
  const {
    isRunning,
    logs,
    progress,
    results,
    startScraping,
    stopScraping,
    addLog,
    updateProgress,
    addResult,
    addError,
    clearResults,
  } = useScraperStore();

  const { stageBusinesses } = useReviewStore();

  const [selectedGovernorates, setSelectedGovernorates] = useState<string[]>([
    "Baghdad",
    "Basra",
    "Erbil",
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "restaurant",
    "cafe",
    "shop",
  ]);
  const [radius, setRadius] = useState(10000);

  const runScraper = useCallback(async () => {
    startScraping();
    addLog("Starting scraper...");

    const totalGovernorates = selectedGovernorates.length;
    let processedGovernorates = 0;

    for (const govName of selectedGovernorates) {
      if (!useScraperStore.getState().isRunning) {
        addLog("Scraper stopped by user");
        break;
      }

      const gov = IRAQ_GOVERNORATES[govName];
      if (!gov) continue;

      updateProgress({
        currentGovernorate: govName,
        processed: processedGovernorates,
        total: totalGovernorates,
      });

      addLog(`Scraping ${govName}...`);

      // Scrape each category
      for (const catKey of selectedCategories) {
        const category = CATEGORIES[catKey];
        if (!category) continue;

        try {
          const businesses = await scrapeOverpass(
            gov.lat,
            gov.lon,
            category.osmTags,
            radius,
            govName,
            catKey,
            category.name
          );

          // Enrich: validate phones + find Instagram/Facebook
          if (businesses.length > 0) {
            addLog(
              `${govName} - ${category.name}: Validating phones & finding social...`
            );
          }
          const enrichedBusinesses = await enrichOsmBusinesses(businesses, addLog);

          for (const business of enrichedBusinesses) {
            const classified = classifyBusiness(business);
            if (classified._status === "validated") {
              addResult("validated", classified as Business);
            } else {
              addResult("needsReview", classified as Business);
            }
          }

          const phoneValid = enrichedBusinesses.filter((b) => (b as any)._phoneValid).length;
          const hasIg = enrichedBusinesses.filter((b) => (b as any)._instagram).length;
          const hasFb = enrichedBusinesses.filter((b) => (b as any)._facebook).length;
          addLog(
            `${govName} - ${category.name}: ${enrichedBusinesses.length} total | ✓${phoneValid} phones | 📸${hasIg} IG | f${hasFb} FB`
          );
        } catch (error) {
          addError(`Error scraping ${govName} - ${category.name}: ${error}`);
        }

        // Rate limit between requests
        await delay(3000);
      }

      processedGovernorates++;
    }

    updateProgress({ processed: processedGovernorates });
    addLog("Scraping complete!");
    toast.success(`Scraped ${results.validated.length + results.needsReview.length} businesses`);
  }, [selectedGovernorates, selectedCategories, radius]);

  const handleStart = () => {
    clearResults();
    runScraper();
  };

  const handleStop = () => {
    stopScraping();
  };

  const handleStageAll = () => {
    stageBusinesses([...results.validated, ...results.needsReview]);
    toast.success(`${results.validated.length + results.needsReview.length} businesses staged for review`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scraper</h1>
        <p className="text-muted-foreground">
          Scrape Iraqi business data from OpenStreetMap
        </p>
      </div>

      {/* Controls */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Governorate Selection */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Governorates</h3>
          </div>
          <div className="h-[200px] overflow-y-auto space-y-2">
            {Object.keys(IRAQ_GOVERNORATES).map((gov) => (
              <label key={gov} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedGovernorates.includes(gov)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedGovernorates([...selectedGovernorates, gov]);
                    } else {
                      setSelectedGovernorates(
                        selectedGovernorates.filter((g) => g !== gov)
                      );
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{gov}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Categories - Card Grid */}
        <div className="rounded-xl border-0 bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <Tags className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-white text-lg">Categories ({selectedCategories.length} selected)</h3>
          </div>

          {/* Card Grid - 15 categories like HUMU PLUS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const isSelected = selectedCategories.includes(key);
              const displayName = CATEGORY_DISPLAY_NAMES[key] || cat.name.toUpperCase();
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedCategories(selectedCategories.filter((c) => c !== key));
                    } else {
                      setSelectedCategories([...selectedCategories, key]);
                    }
                  }}
                  className={`
                    group relative rounded-2xl p-5 text-center transition-all duration-300 overflow-hidden
                    ${isSelected
                      ? "bg-gradient-to-br from-amber-500/30 to-amber-600/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20"
                      : "bg-slate-800/80 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-750"
                    }
                  `}
                >
                  {/* HOT Badge for popular categories */}
                  {(key === "restaurant" || key === "cafe" || key === "events") && !isSelected && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      HOT
                    </div>
                  )}

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-amber-400 text-slate-900 rounded-full p-1">
                      <Check className="h-3 w-3" />
                    </div>
                  )}

                  {/* Icon Container */}
                  <div className={`
                    mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all
                    ${isSelected 
                      ? "bg-amber-500 text-slate-900" 
                      : "bg-slate-700/50 text-amber-400 group-hover:bg-slate-700 group-hover:text-amber-300"
                    }
                  `}>
                    {CATEGORY_ICONS[key] || <Tags className="h-6 w-6" />}
                  </div>

                  {/* Title */}
                  <h4 className={`
                    text-[11px] font-bold leading-tight tracking-wide uppercase
                    ${isSelected ? "text-white" : "text-slate-300 group-hover:text-white"}
                  `}>
                    {displayName}
                  </h4>

                  {/* Types count */}
                  <p className={`
                    text-[10px] mt-2 font-medium
                    ${isSelected ? "text-amber-300" : "text-slate-500 group-hover:text-slate-400"}
                  `}>
                    {cat.subcategories?.length || 0} TYPES
                  </p>

                  {/* Bottom accent line */}
                  <div className={`
                    absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all
                    ${isSelected ? "bg-amber-500" : "bg-slate-700 group-hover:bg-amber-500/30"}
                  `} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Radius (meters)</label>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-muted-foreground">{radius}m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleStart}
          disabled={isRunning || selectedGovernorates.length === 0 || selectedCategories.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="h-4 w-4" />
          Start Scraping
        </button>
        <button
          onClick={handleStop}
          disabled={!isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square className="h-4 w-4" />
          Stop
        </button>
        <button
          onClick={clearResults}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50"
        >
          <RotateCw className="h-4 w-4" />
          Clear Results
        </button>
        {results.validated.length > 0 || results.needsReview.length > 0 ? (
          <button
            onClick={handleStageAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Stage All ({results.validated.length + results.needsReview.length})
          </button>
        ) : null}
      </div>

      {/* Progress */}
      {isRunning && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Scraping: {progress.currentGovernorate}</span>
            <span className="text-sm text-muted-foreground">
              {progress.processed} / {progress.total} governorates
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(progress.processed / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4">
          <h4 className="font-semibold text-green-900 dark:text-green-100">Validated</h4>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {results.validated.length}
          </p>
        </div>
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950 p-4">
          <h4 className="font-semibold text-amber-900 dark:text-amber-100">Needs Review</h4>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {results.needsReview.length}
          </p>
        </div>
        <div className="rounded-lg border bg-red-50 dark:bg-red-950 p-4">
          <h4 className="font-semibold text-red-900 dark:text-red-100">Errors</h4>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {results.errors.length}
          </p>
        </div>
      </div>

      {/* Log Output */}
      <div className="rounded-lg border bg-black text-green-400 font-mono text-sm p-4 h-[300px] overflow-y-auto">
        {logs.length === 0 ? (
          <p className="text-muted-foreground">Logs will appear here...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="py-0.5">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const ALL_OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

// Enrich OSM businesses: validate phones + find Instagram/Facebook
async function enrichOsmBusinesses(
  osmBusinesses: Partial<Business>[],
  _addLog: (msg: string) => void
): Promise<Partial<Business>[]> {
  const enriched: Partial<Business>[] = [];
  let validPhoneCount = 0;

  // Phase 1: Validate all phones
  for (const business of osmBusinesses) {
    const validation = validateIraqiPhone(business.phone);
    (business as any)._phoneValid = validation.isValid;
    if (validation.isValid) {
      business.phone = validation.formatted; // Use normalized phone
      validPhoneCount++;
    }
    enriched.push(business);
  }

  // Phase 2: Find Instagram (parallel batch)
  const igCandidates = enriched.filter((b) => b.name && b.phone);
  if (igCandidates.length > 0) {
    const igResults = await batchFindInstagram(
      igCandidates.map((b) => ({ name: b.name || "", city: b.city || "" }))
    );
    for (const business of enriched) {
      const key = business.name;
      if (key && igResults.has(key)) {
        const ig = igResults.get(key);
        (business as any)._instagram = ig?.handle;
      }
    }
  }

  // Phase 3: Find Facebook (parallel batch)
  const fbCandidates = enriched.filter((b) => b.name && b.phone);
  if (fbCandidates.length > 0) {
    const fbResults = await batchFindFacebook(
      fbCandidates.map((b) => ({ name: b.name || "", city: b.city || "" }))
    );
    for (const business of enriched) {
      const key = business.name;
      if (key && fbResults.has(key)) {
        const fb = fbResults.get(key);
        (business as any)._facebook = fb?.url;
      }
    }
  }

  return enriched;
}

// Overpass API scraper with retry + rate-limit handling
async function scrapeOverpass(
  lat: number,
  lon: number,
  tags: string[],
  radius: number,
  governorate: string,
  categoryKey: string,
  categoryName: string
): Promise<Partial<Business>[]> {
  const query = buildOverpassQuery(lat, lon, tags, radius);
  const maxRetries = 2;

  for (const server of ALL_OVERPASS_SERVERS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(server, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `data=${encodeURIComponent(query)}`,
        });

        // Rate limited — wait and retry this server
        if (response.status === 429) {
          const wait = (attempt + 1) * 5000;
          console.warn(`Rate limited by ${server}, waiting ${wait}ms...`);
          await delay(wait);
          continue;
        }

        if (!response.ok) break; // try next server

        // Verify response is JSON, not XML error page
        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();

        if (!contentType.includes("json") && !text.trim().startsWith("{")) {
          console.warn(`${server} returned non-JSON response, trying next`);
          break;
        }

        const data = JSON.parse(text);
        const elements = data.elements || [];

        return elements
          .filter((el: Record<string, unknown>) => (el.tags as Record<string, string>)?.name)
          .map((el: Record<string, unknown>) => parseOsmElement(el, governorate, categoryKey, categoryName));
      } catch (error) {
        console.warn(`Overpass server ${server} attempt ${attempt + 1} failed:`, error);
        if (attempt < maxRetries) await delay(2000);
        continue;
      }
    }
  }

  throw new Error("All Overpass servers failed — try again in a minute");
}

function buildOverpassQuery(lat: number, lon: number, tags: string[], radius: number): string {
  const tagQueries = tags.flatMap((tag) => {
    if (tag.includes("=")) {
      const [key, value] = tag.split("=");
      return [
        `node["${key}"="${value}"](around:${radius},${lat},${lon});`,
        `way["${key}"="${value}"](around:${radius},${lat},${lon});`,
        `relation["${key}"="${value}"](around:${radius},${lat},${lon});`,
      ];
    }
    return [];
  });

  return `
    [out:json][timeout:60];
    (
      ${tagQueries.join("\n      ")}
    );
    out body center qt;
  `;
}

function parseOsmElement(
  el: Record<string, unknown>,
  governorate: string,
  categoryKey: string,
  _categoryName: string // Display name (unused - using categoryKey for mapping)
): Partial<Business> {
  const tags = (el.tags as Record<string, string>) || {};
  const center = (el.center as Record<string, number>) || {};

  const lat = (el.lat as number) || center.lat;
  const lon = (el.lon as number) || center.lon;

  // --- PHONE: Try every possible source ---
  const phoneSources = [
    tags.phone,
    tags["contact:phone"],
    tags["phone:mobile"],
    tags["contact:mobile"],
    tags["phone:main"],
    tags["communication:phone"],
    tags["operator:phone"],
  ].filter(Boolean);

  // Some entries have multiple phones separated by ; or ,
  const allPhones: string[] = [];
  for (const src of phoneSources) {
    if (src) {
      src.split(/[;,]/).forEach((p: string) => {
        const trimmed = p.trim();
        if (trimmed) allPhones.push(trimmed);
      });
    }
  }

  // Normalize each and pick the first valid one
  let normalizedPhone: string | undefined;
  for (const raw of allPhones) {
    const result = normalizePhone(raw, "", governorate);
    if (result && result.length >= 13) {
      normalizedPhone = result;
      break;
    }
  }

  // --- WEBSITE: Multiple sources ---
  const website = tags.website || tags["contact:website"] || tags.url || tags["brand:website"] || undefined;

  // --- EMAIL ---
  const email = tags.email || tags["contact:email"] || tags["operator:email"] || undefined;

  // --- SOCIAL MEDIA: Every possible tag ---
  const facebook = tags["contact:facebook"] || tags.facebook || tags["brand:facebook"] || undefined;
  const instagram = tags["contact:instagram"] || tags.instagram || tags["brand:instagram"] || undefined;

  // Extra social stored in raw_data
  const twitter = tags["contact:twitter"] || tags.twitter || undefined;
  const whatsapp = tags["contact:whatsapp"] || tags.whatsapp || undefined;
  const telegram = tags["contact:telegram"] || tags.telegram || undefined;
  const youtube = tags["contact:youtube"] || tags.youtube || undefined;
  const tiktok = tags["contact:tiktok"] || tags.tiktok || undefined;

  // --- ADDRESS: Build the fullest possible address ---
  const addrParts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"] || tags["addr:neighbourhood"],
    tags["addr:district"],
  ].filter(Boolean);
  const fullAddr = tags["addr:full"] || (addrParts.length > 0 ? addrParts.join(", ") : undefined);

  // --- CITY ---
  const city = tags["addr:city"] || tags["addr:district"] || tags["is_in:city"] || governorate;

  // --- NAME: Arabic, English, Kurdish ---
  const name = tags.name?.trim() || tags["name:ar"]?.trim() || "";
  const nameEn = tags["name:en"]?.trim() || undefined;
  const nameKu = tags["name:ku"]?.trim() || undefined;

  // --- EXTRA METADATA ---
  const openingHours = tags.opening_hours || undefined;
  const operator = tags.operator || tags.brand || undefined;
  const description = tags.description || tags["description:en"] || tags["description:ar"] || undefined;
  const cuisine = tags.cuisine || undefined;
  const stars = tags.stars || undefined;
  const postcode = tags["addr:postcode"] || undefined;

  // Store ALL extra data we found
  const raw_data: Record<string, unknown> = {
    ...tags,
    _extra: {
      all_phones: allPhones,
      twitter,
      whatsapp,
      telegram,
      youtube,
      tiktok,
      opening_hours: openingHours,
      operator,
      description,
      cuisine,
      stars,
      postcode,
      name_ku: nameKu,
    },
  };

  const externalId = `osm_${el.type}_${el.id}`;

  return {
    id: externalId, // client-side ID for selection — Supabase will generate real UUID on insert
    name,
    name_en: nameEn,       // Store English name for compatibility
    nameAr: name, // Use the original name as Arabic fallback
    nameKu: nameKu,
    phone: normalizedPhone,
    website,
    email,                 // Store email for internal use
    address: fullAddr,
    city,
    governorate: mapGovernorateToHumus(governorate), // Map to HUMUS format
    lat,
    lng: lon,
    category: mapCategoryToHumus(categoryKey), // Map OSM category to HUMUS ID
    subcategory: categoryKey,
    facebook,              // Store for internal matching
    instagram,             // Store for internal matching
    whatsapp: (raw_data._extra as Record<string, unknown>)?.whatsapp as string | undefined,
    description,

    // Internal fields for pipeline (not pushed to DB)
    _status: undefined, // Will be set by classifyBusiness
    _source: "osm",

    // For the raw_data, store everything else
    raw_data,
  };
}

function classifyBusiness(business: Partial<Business>): Partial<Business> & { _status: string } {
  let score = 0;
  const raw = (business.raw_data as Record<string, unknown>) || {};
  const extra = (raw._extra as Record<string, unknown>) || {};

  const checks = {
    hasName: business.name && business.name.length > 2,
    hasPhone: business.phone && business.phone.length >= 13,  // +964XXXXXXXXXX = 14 chars
    hasWebsite: business.website && business.website.length > 5,
    hasAddress: business.address && business.address.length > 5,
    hasCoords: business.lat && business.lng, // Use lat/lng not latitude/longitude
    hasSocial: business.whatsapp || extra.whatsapp, // Check for WhatsApp or other social
    hasEmail: (business as any).email,
    hasWhatsapp: business.whatsapp || !!extra.whatsapp,
    hasHours: !!extra.opening_hours,
  };

  // Phone is the deal-breaker — worth 3 points
  if (checks.hasName) score += 2;
  if (checks.hasPhone) score += 3;
  if (checks.hasWebsite) score += 2;
  if (checks.hasSocial) score += 1;
  if (checks.hasEmail) score += 1;
  if (checks.hasAddress) score += 1;
  if (checks.hasCoords) score += 1;
  if (checks.hasWhatsapp) score += 1;
  if (checks.hasHours) score += 1;

  // Determine status: phone is king
  const _status = checks.hasPhone && score >= 5 ? "validated" :
                  score >= 3 ? "needs_review" : "needs_review";
  const data_quality = checks.hasPhone && score >= 6 ? "real" :
                       score >= 3 ? "partial" : "osm";

  return {
    ...business,
    _status,
    data_quality,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
