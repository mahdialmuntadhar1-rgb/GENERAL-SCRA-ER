import { useState } from "react";
import { useReviewStore } from "@/stores";
import { upsertBusinesses } from "@/lib/supabase";
import { toast } from "sonner";
import type { Business } from "@/lib/supabase";
import { CheckCircle2, AlertCircle, Trash2, Upload, Zap } from "lucide-react";
import { runLocalPipeline, type PipelineResult } from "@/services/pipeline";
import type { RawBusinessInput } from "@/services/normalize";

export function Review() {
  const {
    stagedBusinesses,
    selectedIds,
    toggleSelection,
    selectAll,
    selectAllValidated,
    deselectAll,
    removeSelected,
    clearStaged,
  } = useReviewStore();

  const [activeTab, setActiveTab] = useState<"all" | "validated" | "needs_review">("all");
  const [isPushing, setIsPushing] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState<string>("");
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);

  const filteredBusinesses = stagedBusinesses.filter((b) => {
    if (activeTab === "all") return true;
    return b._status === activeTab;
  });

  const validatedCount = stagedBusinesses.filter((b) => b._status === "validated").length;
  const needsReviewCount = stagedBusinesses.filter((b) => b._status === "needs_review").length;

  // --- SMART PIPELINE PUSH ---
  const handleSmartPush = async () => {
    if (selectedIds.length === 0) {
      toast.error("No businesses selected");
      return;
    }

    setIsPushing(true);
    setPipelineResult(null);
    setPipelineProgress("Preparing...");

    const toPush = stagedBusinesses.filter((b) => {
      const bid = String(b.id || b.external_id || b.name || "");
      return selectedIds.includes(bid);
    });

    if (toPush.length === 0) {
      toast.error("Selection mismatch — clear cache in Settings and re-scrape");
      setIsPushing(false);
      setPipelineProgress("");
      return;
    }

    // Convert to RawBusinessInput format
    const rawInputs: RawBusinessInput[] = toPush.map((b) => ({
      business_name: b.name,
      business_name_en: b.nameAr || b.name, // Use Arabic name if available
      phone: b.phone,
      email: (b as any).email,
      website: b.website,
      address: b.address,
      city: b.city,
      governorate: b.governorate,
      category: b.category,
      subcategory: b.subcategory,
      latitude: b.lat || (b as any).latitude,  // Handle both lat and latitude
      longitude: b.lng || (b as any).longitude, // Handle both lng and longitude
      facebook: (b as any).facebook,
      instagram: (b as any).instagram,
      source: (b as any)._source || "osm",
      source_confidence: 50,
      raw_data: b.raw_data as Record<string, unknown> | undefined,
    }));

    try {
      const result = await runLocalPipeline(rawInputs, (step, done, total) => {
        setPipelineProgress(`${step}: ${done}/${total}`);
      });

      setPipelineResult(result);

      if (result.errors.length > 0) {
        console.error("Pipeline errors:", result.errors);
        toast.error(`Pipeline completed with ${result.errors.length} error(s)`);
      } else {
        toast.success(
          `Pipeline done: ${result.inserted} new, ${result.updated} updated, ${result.skipped} skipped, ${result.matchResults.duplicate || 0} duplicates blocked`
        );
        removeSelected();
      }
    } catch (error) {
      console.error("Pipeline failed:", error);
      toast.error(`Pipeline failed: ${error}`);
    } finally {
      setIsPushing(false);
      setPipelineProgress("");
    }
  };

  // --- LEGACY DIRECT PUSH (fallback) ---
  const handleDirectPush = async () => {
    if (selectedIds.length === 0) {
      toast.error("No businesses selected");
      return;
    }

    setIsPushing(true);

    // Filter selected to only include validated businesses with phone
    const toPush = stagedBusinesses.filter((b) => {
      const bid = String(b.id || b.external_id || b.name || "");
      const isSelected = selectedIds.includes(bid);
      const isValidated = b._status === "validated";
      const hasPhone = b.phone && b.phone.trim() !== "";
      return isSelected && isValidated && hasPhone;
    });

    // Count what was filtered out
    const selectedBusinesses = stagedBusinesses.filter((b) => {
      const bid = String(b.id || b.external_id || b.name || "");
      return selectedIds.includes(bid);
    });
    const notValidated = selectedBusinesses.filter((b) => b._status !== "validated").length;
    const noPhone = selectedBusinesses.filter((b) => !b.phone || b.phone.trim() === "").length;

    if (toPush.length === 0) {
      toast.error(
        `No valid businesses to push. ${notValidated} not validated, ${noPhone} missing phone.`
      );
      setIsPushing(false);
      return;
    }

    try {
      const { data, error } = await upsertBusinesses(toPush);
      if (error) throw error;
      const pushedCount = data?.length || 0;
      const skippedCount = selectedIds.length - pushedCount;
      toast.success(
        `Direct push complete: ${pushedCount} pushed (${skippedCount} skipped: ${notValidated} not validated, ${noPhone} no phone)`
      );
      removeSelected();
    } catch (error) {
      console.error("Push failed:", error);
      toast.error(`Failed: ${error}`);
    } finally {
      setIsPushing(false);
    }
  };

  const handleRemoveSelected = () => {
    removeSelected();
    toast.success("Selected businesses removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review & Approve</h1>
          <p className="text-muted-foreground">
            Review staged businesses before pushing to Supabase
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} selected
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({stagedBusinesses.length})
        </button>
        <button
          onClick={() => setActiveTab("validated")}
          className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
            activeTab === "validated"
              ? "border-green-600 text-green-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          Validated ({validatedCount})
        </button>
        <button
          onClick={() => setActiveTab("needs_review")}
          className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
            activeTab === "needs_review"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertCircle className="h-4 w-4" />
          Needs Review ({needsReviewCount})
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-sm bg-secondary rounded hover:bg-secondary/80"
          >
            Select All
          </button>
          <button
            onClick={selectAllValidated}
            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            <CheckCircle2 className="h-4 w-4 inline mr-1" />
            Select Validated Only
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 text-sm bg-secondary rounded hover:bg-secondary/80"
          >
            Deselect All
          </button>
          <button
            onClick={handleRemoveSelected}
            disabled={selectedIds.length === 0}
            className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 inline mr-1" />
            Remove Selected
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearStaged}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear All
          </button>
          <button
            onClick={handleDirectPush}
            disabled={selectedIds.length === 0 || isPushing}
            className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Direct Push
          </button>
          <button
            onClick={handleSmartPush}
            disabled={selectedIds.length === 0 || isPushing}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {isPushing ? "Running Pipeline..." : `Smart Push ${selectedIds.length}`}
          </button>
        </div>
      </div>

      {/* Pipeline Progress */}
      {pipelineProgress && (
        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{pipelineProgress}</span>
          </div>
        </div>
      )}

      {/* Pipeline Result Summary */}
      {pipelineResult && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-sm">Pipeline Result — Batch {pipelineResult.batchId}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="p-2 rounded bg-green-50 dark:bg-green-950/20">
              <div className="text-green-700 dark:text-green-400 font-bold text-lg">{pipelineResult.inserted}</div>
              <div className="text-green-600 dark:text-green-500 text-xs">New Inserted</div>
            </div>
            <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20">
              <div className="text-blue-700 dark:text-blue-400 font-bold text-lg">{pipelineResult.updated}</div>
              <div className="text-blue-600 dark:text-blue-500 text-xs">Updated (merged)</div>
            </div>
            <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20">
              <div className="text-amber-700 dark:text-amber-400 font-bold text-lg">{pipelineResult.matchResults.duplicate || 0}</div>
              <div className="text-amber-600 dark:text-amber-500 text-xs">Duplicates Blocked</div>
            </div>
            <div className="p-2 rounded bg-gray-50 dark:bg-gray-800">
              <div className="text-gray-700 dark:text-gray-300 font-bold text-lg">{pipelineResult.skipped}</div>
              <div className="text-gray-500 text-xs">Skipped</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {pipelineResult.rejected} rejected · {pipelineResult.reviewPending} flagged for review · {(pipelineResult.durationMs / 1000).toFixed(1)}s
            {pipelineResult.errors.length > 0 && (
              <span className="text-red-600"> · {pipelineResult.errors.length} error(s)</span>
            )}
          </div>
        </div>
      )}

      {/* Business List */}
      <div className="space-y-2">
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No businesses to review</p>
            <p className="text-sm">Go to the Scraper tab to collect data</p>
          </div>
        ) : (
          filteredBusinesses.map((business) => (
            <BusinessCard
              key={business.external_id || business.id}
              business={business}
              isSelected={selectedIds.includes(String(business.id || business.external_id || business.name || ""))}
              onToggle={() => toggleSelection(String(business.id || business.external_id || business.name || ""))}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BusinessCard({
  business,
  isSelected,
  onToggle,
}: {
  business: Partial<Business>;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const status = business._status || "needs_review";
  const statusColors = {
    validated: "bg-green-100 text-green-800 border-green-300",
    needs_review: "bg-amber-100 text-amber-800 border-amber-300",
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isSelected ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "bg-card"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-1 rounded border-gray-300"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg truncate">{business.name}</h3>
            <span
              className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[status as keyof typeof statusColors]}`}
            >
              {status === "validated" ? "Validated" : "Needs Review"}
            </span>
            <span className="px-2 py-0.5 text-xs rounded bg-secondary text-secondary-foreground">
              {business.category}
            </span>
            {!business.phone && (
              <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 border border-red-300">
                No Phone — Will be skipped
              </span>
            )}
            {business._status !== "validated" && (
              <span className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 border border-amber-300">
                Not Validated — Will be skipped
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>{business.city}</span>
            <span>{business.governorate}</span>
            {business.phone && <span>{business.phone}</span>}
          </div>

          {expanded && (
            <div className="mt-3 pt-3 border-t space-y-2 text-sm">
              {business.address && (
                <div>
                  <span className="font-medium">Address:</span> {business.address}
                </div>
              )}
              {business.website && (
                <div>
                  <span className="font-medium">Website:</span>{" "}
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {business.website}
                  </a>
                </div>
              )}
              {business.email && (
                <div>
                  <span className="font-medium">Email:</span> {business.email}
                </div>
              )}
              {(business.facebook || business.instagram) && (
                <div>
                  <span className="font-medium">Social:</span>{" "}
                  {business.facebook && <span>Facebook </span>}
                  {business.instagram && <span>Instagram </span>}
                </div>
              )}
              {business.latitude && business.longitude && (
                <div>
                  <span className="font-medium">Coordinates:</span>{" "}
                  {business.latitude.toFixed(6)}, {business.longitude.toFixed(6)}
                </div>
              )}
              {business.data_quality && (
                <div>
                  <span className="font-medium">Quality:</span> {business.data_quality}
                </div>
              )}
              {business.raw_data && (
                <div className="mt-2">
                  <span className="font-medium">Raw OSM Data:</span>
                  <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(business.raw_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>
      </div>
    </div>
  );
}
