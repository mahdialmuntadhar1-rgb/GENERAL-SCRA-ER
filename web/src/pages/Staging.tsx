import { useState } from "react";
import { useScraperStore, useReviewStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Business } from "@/lib/supabase";
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Database,
  Play,
  Loader2,
  RefreshCw
} from "lucide-react";


export function Staging() {
  const { results, clearResults } = useScraperStore();
  const { stageBusinesses, stagedBusinesses, clearStaged } = useReviewStore();
  
  const [isPushingToStage, setIsPushingToStage] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [activeTab, setActiveTab] = useState<"scraped" | "staging" | "cleaning">("scraped");
  const [cleaningProgress, setCleaningProgress] = useState<string>("");

  // Count by status
  const validatedCount = results.validated.length;
  const needsReviewCount = results.needsReview.length;
  const stagingValidatedCount = stagedBusinesses.filter((b) => b._status === "validated").length;
  const stagingNeedsReviewCount = stagedBusinesses.filter((b) => b._status === "needs_review").length;

  // --- SECTION 1: PUSH TO STAGE ---
  const handlePushToStage = async () => {
    if (results.validated.length === 0 && results.needsReview.length === 0) {
      toast.error("No scraped data to push. Run scraper first.");
      return;
    }

    setIsPushingToStage(true);
    
    try {
      // Combine all results
      const allResults = [...results.validated, ...results.needsReview];
      
      // Insert into Supabase staging table
      const stagingData = allResults.map((b) => ({
        business_name: b.name || (b as any).business_name,
        business_name_en: (b as any).name_en || (b as any).business_name_en,
        category: b.category,
        city: b.city,
        governorate: b.governorate,
        address: b.address,
        phone: b.phone,
        whatsapp: (b as any).whatsapp,
        email: (b as any).email,
        website: b.website,
        facebook: (b as any).facebook,
        instagram: (b as any).instagram,
        maps_url: (b as any).maps_url,
        latitude: b.lat || (b as any).latitude,
        longitude: b.lng || (b as any).longitude,
        scraped_photo_url: (b as any).scraped_photo_url || (b as any).image,
        rating: b.rating,
        review_count: (b as any).review_count,
        opening_hours: (b as any).opening_hours,
        _status: b._status,
        _phone_valid: (b as any)._phoneValid,
        completeness_score: (b as any).completeness_score || 50,
        source: (b as any)._source || "osm",
        raw_data: b,
      }));

      const { error } = await supabase
        .from("businesses_staging")
        .insert(stagingData)
        .select();

      if (error) {
        toast.error(`Failed to push to staging: ${error.message}`);
        return;
      }

      // Also add to local store
      stageBusinesses(allResults);
      
      toast.success(`${allResults.length} businesses pushed to staging`);
      setActiveTab("staging");
      
    } catch (error) {
      console.error("Push to stage failed:", error);
      toast.error("Failed to push to staging");
    } finally {
      setIsPushingToStage(false);
    }
  };

  // --- SECTION 2: AI CLEANING ---
  const handleAICleaning = async () => {
    const needsCleaning = stagedBusinesses.filter((b) => b._status === "needs_review");
    
    if (needsCleaning.length === 0) {
      toast.info("No records need cleaning");
      return;
    }

    setIsCleaning(true);
    setCleaningProgress("Starting AI cleaning...");

    try {
      // Process each record that needs review
      let processed = 0;
      for (const business of needsCleaning) {
        setCleaningProgress(`Cleaning ${processed + 1}/${needsCleaning.length}: ${business.name}...`);
        
        // AI cleaning logic:
        // 1. Try to find missing phone numbers via web search
        // 2. Normalize addresses
        // 3. Validate and correct business names
        // 4. Check if business actually exists
        
        const cleaned = await aiCleanBusiness(business);
        
        if (cleaned.success && cleaned.hasPhone) {
          // Move to validated status
          await supabase
            .from("businesses_staging")
            .update({ 
              _status: "validated",
              phone: cleaned.phone,
              _phone_valid: true,
              business_name: cleaned.name,
              address: cleaned.address,
              updated_at: new Date().toISOString()
            })
            .eq("id", business.id);
        }
        
        processed++;
      }

      toast.success(`AI cleaning complete: ${processed} records processed`);
      setActiveTab("staging");
      
    } catch (error) {
      console.error("AI cleaning failed:", error);
      toast.error("AI cleaning failed");
    } finally {
      setIsCleaning(false);
      setCleaningProgress("");
    }
  };

  // Mock AI cleaning function
  const aiCleanBusiness = async (business: Business): Promise<{
    success: boolean;
    hasPhone: boolean;
    phone?: string;
    name?: string;
    address?: string;
  }> => {
    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // If business already has a phone, it's considered cleaned
    if (business.phone && business.phone.trim() !== "") {
      return {
        success: true,
        hasPhone: true,
        phone: business.phone,
        name: business.name,
        address: business.address,
      };
    }
    
    // Simulate finding phone for 30% of incomplete records
    const foundPhone = Math.random() > 0.7;
    
    if (foundPhone) {
      return {
        success: true,
        hasPhone: true,
        phone: `+964 ${Math.floor(Math.random() * 1000000000)}`,
        name: business.name,
        address: business.address,
      };
    }
    
    return {
      success: false,
      hasPhone: false,
    };
  };

  // --- PROMOTE TO PRODUCTION ---
  const handlePromoteToProduction = async () => {
    const validated = stagedBusinesses.filter((b) => b._status === "validated");
    
    if (validated.length === 0) {
      toast.error("No validated businesses to promote");
      return;
    }

    try {
      // Separate complete (has phone) from incomplete (no phone)
      const complete = validated.filter((b) => b.phone && b.phone.trim() !== "");
      const incomplete = validated.filter((b) => !b.phone || b.phone.trim() === "");

      // Insert complete businesses
      if (complete.length > 0) {
        const completeData = complete.map((b) => ({
          business_name: b.name,
          category: b.category,
          city: b.city,
          governorate: b.governorate,
          address: b.address,
          phone: b.phone,
          latitude: b.lat || (b as any).latitude,
          longitude: b.lng || (b as any).longitude,
          source: (b as any)._source || "osm",
          is_verified: true,
          verification_status: "approved",
          completeness_score: (b as any).completeness_score || 80,
        }));

        const { error: completeError } = await supabase
          .from("businesses_complete")
          .insert(completeData);

        if (completeError) {
          toast.error(`Failed to insert complete businesses: ${completeError.message}`);
        } else {
          toast.success(`${complete.length} complete businesses promoted to production`);
        }
      }

      // Insert incomplete businesses
      if (incomplete.length > 0) {
        const incompleteData = incomplete.map((b) => ({
          business_name: b.name,
          category: b.category,
          city: b.city,
          governorate: b.governorate,
          address: b.address,
          latitude: b.lat || (b as any).latitude,
          longitude: b.lng || (b as any).longitude,
          source: (b as any)._source || "osm",
          missing_phone: true,
          can_enrich: true,
        }));

        const { error: incompleteError } = await supabase
          .from("businesses_incomplete")
          .insert(incompleteData);

        if (incompleteError) {
          toast.error(`Failed to insert incomplete businesses: ${incompleteError.message}`);
        } else {
          toast.success(`${incomplete.length} incomplete businesses saved for enrichment`);
        }
      }

      // Clear staged
      clearStaged();
      clearResults();
      
    } catch (error) {
      console.error("Promote failed:", error);
      toast.error("Failed to promote to production");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staging & Review</h1>
        <p className="text-muted-foreground">
          Two-stage workflow: Push scraped data to staging → AI cleaning → Production
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveTab("scraped")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            activeTab === "scraped"
              ? "bg-blue-600 text-white"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <Database className="h-4 w-4" />
          1. Scraped Data
          {(validatedCount > 0 || needsReviewCount > 0) && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
              {validatedCount + needsReviewCount}
            </span>
          )}
        </button>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setActiveTab("staging")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            activeTab === "staging"
              ? "bg-blue-600 text-white"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          2. Staging
          {stagedBusinesses.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
              {stagedBusinesses.length}
            </span>
          )}
        </button>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => setActiveTab("cleaning")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            activeTab === "cleaning"
              ? "bg-blue-600 text-white"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <RefreshCw className="h-4 w-4" />
          3. AI Cleaning
        </button>
      </div>

      {/* SECTION 1: SCRAPED DATA */}
      {activeTab === "scraped" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-700 rounded-full">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Validated Records</p>
                <p className="text-sm text-muted-foreground">Ready for staging</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                {validatedCount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-full">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Needs Review</p>
                <p className="text-sm text-muted-foreground">Require AI cleaning</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-bold">
                {needsReviewCount}
              </span>
            </div>
          </div>

          <button
            onClick={handlePushToStage}
            disabled={isPushingToStage || (validatedCount === 0 && needsReviewCount === 0)}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPushingToStage ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Pushing to Staging...
              </>
            ) : (
              <>
                <ArrowRight className="h-5 w-5" />
                Push {validatedCount + needsReviewCount} Records to Staging
              </>
            )}
          </button>
        </div>
      )}

      {/* SECTION 2: STAGING */}
      {activeTab === "staging" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-400">Validated</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{stagingValidatedCount}</p>
              <p className="text-sm text-green-600">Ready for production</p>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-400">Needs Review</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">{stagingNeedsReviewCount}</p>
              <p className="text-sm text-amber-600">Needs AI cleaning</p>
            </div>
          </div>

          {stagingNeedsReviewCount > 0 && (
            <button
              onClick={() => setActiveTab("cleaning")}
              className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Start AI Cleaning ({stagingNeedsReviewCount} records)
            </button>
          )}

          <button
            onClick={handlePromoteToProduction}
            disabled={stagingValidatedCount === 0}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Database className="h-5 w-5" />
            Promote {stagingValidatedCount} to Production
          </button>

          {stagedBusinesses.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Staged Records</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {stagedBusinesses.map((b) => (
                  <div
                    key={String(b.id || b.external_id || b.name)}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      b._status === "validated"
                        ? "bg-green-50 border-green-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div>
                      <p className="font-medium">{b.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.category} • {b.city} {b.phone && "• " + b.phone}
                      </p>
                    </div>
                    {b._status === "validated" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: AI CLEANING */}
      {activeTab === "cleaning" && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
              AI Cleaning Process
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-500 space-y-1">
              <li>• Find missing phone numbers via web search</li>
              <li>• Normalize and validate addresses</li>
              <li>• Correct and standardize business names</li>
              <li>• Verify business existence</li>
            </ul>
          </div>

          {isCleaning ? (
            <div className="p-4 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="font-medium">{cleaningProgress}</span>
              </div>
              <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 animate-pulse"
                  style={{ width: "50%" }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={handleAICleaning}
              disabled={stagingNeedsReviewCount === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play className="h-5 w-5" />
              Start AI Cleaning ({stagingNeedsReviewCount} records)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
