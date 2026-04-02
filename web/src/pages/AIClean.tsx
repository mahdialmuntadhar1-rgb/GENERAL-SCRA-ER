import { useState } from "react";
import { useReviewStore } from "@/stores";
import { toast } from "sonner";
import { Sparkles, Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  normalizePhone,
  normalizeName,
  normalizeWebsite,
  normalizeInstagram,
  normalizeFacebook,
  normalizeAddress,
  calculateCompleteness,
  generateDedupeKey,
} from "@/services/normalize";
import type { Business } from "@/lib/supabase";

type CleaningStatus = "idle" | "running" | "done";

interface CleaningResult {
  total: number;
  phoneFixed: number;
  duplicatesFound: number;
  namesNormalized: number;
  completenessImproved: number;
}

export function AIClean() {
  const { stagedBusinesses } = useReviewStore();
  const [status, setStatus] = useState<CleaningStatus>("idle");
  const [result, setResult] = useState<CleaningResult | null>(null);
  const [progress, setProgress] = useState("");

  const handleRunCleaning = async () => {
    if (stagedBusinesses.length === 0) {
      toast.error("No businesses in the review queue to clean");
      return;
    }

    setStatus("running");
    setProgress("Starting normalization...");

    // Real cleaning: normalize all fields
    let phoneFixed = 0;
    let namesNormalized = 0;
    let completenessImproved = 0;
    const seenDedupeKeys = new Map<string, number>(); // dedupe_key → first index
    const duplicateIndices = new Set<number>();

    const cleaned: Business[] = [];

    for (let i = 0; i < stagedBusinesses.length; i++) {
      const b = { ...stagedBusinesses[i] };

      if (i % 50 === 0) {
        setProgress(`Cleaning ${i + 1}/${stagedBusinesses.length}...`);
        // Yield to UI
        await new Promise((r) => setTimeout(r, 0));
      }

      // Normalize phone
      const normPhone = normalizePhone(b.phone);
      if (normPhone && normPhone !== b.phone) {
        phoneFixed++;
      }
      if (normPhone) {
        b.phone = normPhone;
        b.normalized_phone = normPhone;
      }

      // Normalize name
      const normName = normalizeName(b.name);
      if (normName && normName !== b.name?.toLowerCase()) {
        namesNormalized++;
      }
      b.normalized_name = normName || undefined;

      // Normalize website
      b.normalized_website = normalizeWebsite(b.website) || undefined;

      // Normalize social
      b.normalized_instagram = normalizeInstagram(b.instagram) || undefined;
      b.normalized_facebook = normalizeFacebook(b.facebook) || undefined;

      // Normalize address
      b.normalized_address = normalizeAddress(b.address) || undefined;

      // Calculate completeness
      const oldScore = b.completeness_score || 0;
      const newScore = calculateCompleteness({
        name: b.name,
        phone: b.phone,
        email: b.email,
        website: b.website,
        address: b.address,
        city: b.city,
        governorate: b.governorate,
        category: b.category,
        latitude: b.latitude,
        longitude: b.longitude,
        facebook: b.facebook,
        instagram: b.instagram,
      });
      b.completeness_score = newScore;
      if (newScore > oldScore) completenessImproved++;

      // Generate dedupe key
      const dedupeKey = generateDedupeKey({
        normalized_phone: b.normalized_phone || null,
        normalized_website: b.normalized_website || null,
        normalized_instagram: b.normalized_instagram || null,
        normalized_facebook: b.normalized_facebook || null,
        normalized_name: b.normalized_name || null,
        city: b.city,
        category: b.category,
      });
      b.dedupe_key = dedupeKey;

      // Check for duplicates
      if (seenDedupeKeys.has(dedupeKey) && !dedupeKey.startsWith("unknown:")) {
        duplicateIndices.add(i);
      } else {
        seenDedupeKeys.set(dedupeKey, i);
      }

      // Update quality status based on score
      b.data_quality = newScore >= 50 ? "real" : newScore >= 20 ? "partial" : "osm";
      b._status = newScore >= 40 ? "validated" : "needs_review";

      cleaned.push(b);
    }

    // Remove duplicates (keep first occurrence)
    const deduped = cleaned.filter((_, i) => !duplicateIndices.has(i));

    // Update the store with cleaned data
    useReviewStore.setState({
      stagedBusinesses: deduped,
      selectedIds: [],
    });

    setResult({
      total: stagedBusinesses.length,
      phoneFixed,
      duplicatesFound: duplicateIndices.size,
      namesNormalized,
      completenessImproved,
    });
    setStatus("done");
    setProgress("");
    toast.success(`Cleaned ${deduped.length} businesses (${duplicateIndices.size} duplicates removed)`);
  };

  const CLEANING_STEPS = [
    {
      icon: Zap,
      title: "Phone Normalization",
      desc: "Converts all Iraqi numbers to +964 format, validates 750/770/780 mobile prefixes",
    },
    {
      icon: AlertTriangle,
      title: "Duplicate Detection",
      desc: "Generates dedupe keys from phone/website/social/name+city — removes exact duplicates",
    },
    {
      icon: Sparkles,
      title: "Name & Address Cleaning",
      desc: "Normalizes Arabic diacritics, removes tashkeel, standardizes whitespace and junk values",
    },
    {
      icon: CheckCircle2,
      title: "Completeness Scoring",
      desc: "Scores each business 0-100 based on phone, address, website, social, coordinates. Re-classifies validated vs needs_review",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Cleaning Steps */}
      <section>
        <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4">
          AI Cleaning Pipeline
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CLEANING_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-xl border-2 bg-card p-5"
                style={{ borderColor: "hsl(36 30% 82%)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: "hsl(36 55% 88%)" }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: "hsl(36 55% 38%)" }}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{step.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Run Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRunCleaning}
          disabled={status === "running" || stagedBusinesses.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "hsl(36 60% 42%)" }}
        >
          <Sparkles className="h-4 w-4" />
          {status === "running" ? "Cleaning..." : "Run AI Cleaning"}
        </button>
        <span className="text-sm text-muted-foreground">
          {progress || `${stagedBusinesses.length} businesses in queue`}
        </span>
      </div>

      {/* Results */}
      {result && (
        <section>
          <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4">
            Results
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ResultCard
              label="Phones Fixed"
              value={result.phoneFixed}
              total={result.total}
            />
            <ResultCard
              label="Duplicates Removed"
              value={result.duplicatesFound}
              total={result.total}
            />
            <ResultCard
              label="Names Normalized"
              value={result.namesNormalized}
              total={result.total}
            />
            <ResultCard
              label="Scores Improved"
              value={result.completenessImproved}
              total={result.total}
            />
          </div>
        </section>
      )}

      {/* Flow Note */}
      <div
        className="rounded-xl border-2 px-5 py-4"
        style={{
          borderColor: "hsl(36 40% 78%)",
          background: "hsl(40 40% 95%)",
        }}
      >
        <p className="text-sm">
          <span
            className="font-bold"
            style={{ color: "hsl(36 50% 35%)" }}
          >
            Next step:{" "}
          </span>
          After cleaning, go to <strong>Review Queue</strong> to review the results,
          then <strong>Smart Push</strong> to Supabase, and <strong>Import/Export</strong> to download CSV.
        </p>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div
      className="rounded-xl border-2 bg-card px-4 py-3"
      style={{ borderColor: "hsl(36 30% 82%)" }}
    >
      <div className="text-2xl font-bold" style={{ color: "hsl(36 55% 38%)" }}>
        {value}
      </div>
      <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, hsl(36 60% 50%), hsl(30 55% 42%))",
          }}
        />
      </div>
    </div>
  );
}
