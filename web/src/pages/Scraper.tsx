import { useState, useCallback, useEffect, useRef } from "react";
import { useScraperStore, useReviewStore, type ScraperTask } from "@/stores";
import { IRAQ_GOVERNORATES, CATEGORIES, type CategoryKey } from "@/config/iraq";
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
  Check, AlertTriangle, Trash2, List,
  CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  dining_cuisine: <Utensils className="h-6 w-6" />,
  cafe_coffee: <Coffee className="h-6 w-6" />,
  shopping_retail: <ShoppingBag className="h-6 w-6" />,
  entertainment_events: <Film className="h-6 w-6" />,
  accommodation_stays: <Hotel className="h-6 w-6" />,
  culture_heritage: <Plane className="h-6 w-6" />,
  business_services: <Building2 className="h-6 w-6" />,
  health_wellness: <HeartPulse className="h-6 w-6" />,
  doctors: <Stethoscope className="h-6 w-6" />,
  hospitals: <Hospital className="h-6 w-6" />,
  clinics: <HeartPulse className="h-6 w-6" />,
  transport_mobility: <MapPin className="h-6 w-6" />,
  public_essential: <Building2 className="h-6 w-6" />,
  lawyers: <Scale className="h-6 w-6" />,
  education: <GraduationCap className="h-6 w-6" />,
};

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  dining_cuisine: "DINING & CUISINE",
  cafe_coffee: "CAFE & COFFEE",
  shopping_retail: "SHOPPING & RETAIL",
  entertainment_events: "ENTERTAINMENT & EVENTS",
  accommodation_stays: "ACCOMMODATION & STAYS",
  culture_heritage: "CULTURE & HERITAGE",
  business_services: "BUSINESS & SERVICES",
  health_wellness: "HEALTH & WELLNESS",
  doctors: "DOCTORS",
  hospitals: "HOSPITALS",
  clinics: "CLINICS",
  transport_mobility: "TRANSPORT & MOBILITY",
  public_essential: "PUBLIC & ESSENTIAL",
  lawyers: "LAWYERS",
  education: "EDUCATION",
};

export function Scraper() {
  const {
    isRunning,
    logs,
    progress,
    results,
    queue,
    currentTask,
    taskHistory,
    startScraping,
    stopScraping,
    addLog,
    updateProgress,
    addResult,
    clearResults,
    reset,
    initializeQueue,
    updateTaskStatus,
    completeTask,
    failTask,
    getQueueStats,
    getNextPendingTask,
  } = useScraperStore();

  const { stageBusinesses } = useReviewStore();

  const [selectedGovernorates, setSelectedGovernorates] = useState<string[]>(["Baghdad", "Basra", "Erbil"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["dining_cuisine", "cafe_coffee", "shopping_retail"]);
  const [radius, setRadius] = useState(10000);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [dataCounts, setDataCounts] = useState<Record<string, number> | null>(null);

  const isProcessingRef = useRef(false);

  const generateJobId = () => `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const buildTaskQueue = useCallback((): Array<{ governorate: string; categoryKey: string; categoryName: string }> => {
    const tasks: Array<{ governorate: string; categoryKey: string; categoryName: string }> = [];
    for (const govName of selectedGovernorates) {
      for (const catKey of selectedCategories) {
        const category = CATEGORIES[catKey as CategoryKey];
        if (category) {
          tasks.push({ governorate: govName, categoryKey: catKey, categoryName: category.name });
        }
      }
    }
    return tasks;
  }, [selectedGovernorates, selectedCategories]);

  const processTask = async (task: ScraperTask): Promise<boolean> => {
    addLog(`[START] ${task.governorate} → ${task.categoryName}`);
    updateTaskStatus(task.id, 'running');

    try {
      const gov = IRAQ_GOVERNORATES[task.governorate];
      if (!gov) throw new Error(`Governorate not found: ${task.governorate}`);

      const category = CATEGORIES[task.categoryKey as CategoryKey];
      if (!category) throw new Error(`Category not found: ${task.categoryKey}`);

      updateProgress({ currentGovernorate: task.governorate, currentCategory: task.categoryName });

      const businesses = await scrapeOverpass(gov.lat, gov.lon, category.osmTags, radius, task.governorate, task.categoryKey, task.categoryName);

      let enrichedBusinesses: Partial<Business>[] = [];
      if (businesses.length > 0) {
        addLog(`  ${task.governorate} - ${task.categoryName}: Found ${businesses.length} businesses, enriching...`);
        enrichedBusinesses = await enrichOsmBusinesses(businesses, addLog);
      }

      let validatedCount = 0;
      let needsReviewCount = 0;

      for (const business of enrichedBusinesses) {
        const classified = classifyBusiness(business);
        if (classified._status === "validated") {
          addResult("validated", classified as Business);
          validatedCount++;
        } else {
          addResult("needsReview", classified as Business);
          needsReviewCount++;
        }
      }

      const phoneValid = enrichedBusinesses.filter((b) => (b as any)._phoneValid).length;
      const hasIg = enrichedBusinesses.filter((b) => (b as any)._instagram).length;
      const hasFb = enrichedBusinesses.filter((b) => (b as any)._facebook).length;

      addLog(`  [DONE] ${task.governorate} → ${task.categoryName}: ${enrichedBusinesses.length} total | ✓${phoneValid} phones | 📸${hasIg} IG | f${hasFb} FB`);

      completeTask(task.id, { found: enrichedBusinesses.length, validated: validatedCount, needsReview: needsReviewCount });
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addLog(`  [ERROR] ${task.governorate} → ${task.categoryName}: ${errorMsg}`);
      failTask(task.id, errorMsg);
      return false;
    }
  };

  const processQueue = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    while (!useScraperStore.getState().stopSignal) {
      const nextTask = getNextPendingTask();
      
      if (!nextTask) {
        const stats = getQueueStats();
        if (stats.completed + stats.failed >= stats.total) {
          addLog("[QUEUE] All tasks completed!");
          toast.success(`Scraping complete! ${stats.completed} succeeded, ${stats.failed} failed`);
          break;
        }
        await delay(1000);
        continue;
      }

      const stats = getQueueStats();
      updateProgress({
        currentTaskNumber: stats.completed + stats.running + 1,
        totalTasks: stats.total,
        processedGovernorates: selectedGovernorates.filter(g => taskHistory.some(t => t.governorate === g && t.status === 'completed')).length,
        totalGovernorates: selectedGovernorates.length,
      });

      await processTask(nextTask);
      await delay(3000);
    }

    isProcessingRef.current = false;
    stopScraping();
  };

  const runScraper = useCallback(async () => {
    const tasks = buildTaskQueue();
    if (tasks.length === 0) {
      toast.error("Please select at least one governorate and one category");
      return;
    }

    const jobId = generateJobId();
    startScraping();
    clearResults();
    initializeQueue(jobId, tasks);

    addLog(`[QUEUE] Starting ${tasks.length} tasks sequentially...`);
    addLog(`  Governorates: ${selectedGovernorates.join(", ")}`);
    addLog(`  Categories: ${selectedCategories.length} selected`);

    await processQueue();
  }, [selectedGovernorates, selectedCategories, radius, buildTaskQueue]);

  const handleStart = () => { if (!isRunning) runScraper(); };
  const handleStop = () => stopScraping();
  const handleStageAll = () => {
    stageBusinesses([...results.validated, ...results.needsReview]);
    toast.success(`${results.validated.length + results.needsReview.length} businesses staged for review`);
  };

  const fetchDataCounts = async () => {
    try {
      const response = await fetch('/api/scraper/counts');
      if (response.ok) {
        const data = await response.json();
        setDataCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to fetch counts:', err);
    }
  };

  const handleResetData = async () => {
    if (!resetCode.trim()) {
      toast.error("Please enter the confirmation code");
      return;
    }

    try {
      const response = await fetch('/api/scraper/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationCode: resetCode }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Data reset successfully!");
        setShowResetModal(false);
        setResetCode("");
        reset();
        fetchDataCounts();
      } else {
        toast.error(result.error || "Reset failed");
      }
    } catch (err) {
      toast.error("Failed to reset data");
    }
  };

  const queueStats = getQueueStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scraper</h1>
          <p className="text-muted-foreground">Scrape Iraqi business data with sequential queue</p>
        </div>
        <button onClick={() => { setShowResetModal(true); fetchDataCounts(); }} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
          <Trash2 className="h-4 w-4" />
          Reset Data
        </button>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full m-4">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h2 className="text-xl font-bold">Reset All Scraper Data</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">This will permanently delete staging, import raw, review queue, and job data.</p>
            {dataCounts && (
              <div className="bg-slate-100 dark:bg-slate-800 rounded p-3 mb-4 text-sm">
                <p className="font-medium mb-2">Current counts:</p>
                {Object.entries(dataCounts).map(([table, count]) => (
                  <div key={table} className="flex justify-between"><span className="text-muted-foreground">{table}:</span><span className="font-mono">{count.toLocaleString()}</span></div>
                ))}
              </div>
            )}
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200"><strong>To confirm:</strong> Enter code format: RESET_YYYY-MM-DD-HH24-MI</p>
            </div>
            <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="RESET_2026-04-03-18-30" className="w-full px-3 py-2 border rounded-lg mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowResetModal(false)} className="px-4 py-2 text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleResetData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete All Data</button>
            </div>
          </div>
        </div>
      )}

      {queue && (
        <div className="grid grid-cols-5 gap-4 text-center">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3"><div className="text-2xl font-bold text-blue-600">{queueStats.total}</div><div className="text-xs text-blue-600/70">Total Tasks</div></div>
          <div className="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3"><div className="text-2xl font-bold text-yellow-600">{queueStats.pending}</div><div className="text-xs text-yellow-600/70">Pending</div></div>
          <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3"><div className="text-2xl font-bold text-purple-600">{queueStats.running}</div><div className="text-xs text-purple-600/70">Running</div></div>
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3"><div className="text-2xl font-bold text-green-600">{queueStats.completed}</div><div className="text-xs text-green-600/70">Completed</div></div>
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3"><div className="text-2xl font-bold text-red-600">{queueStats.failed}</div><div className="text-xs text-red-600/70">Failed</div></div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3"><MapPin className="h-4 w-4 text-muted-foreground" /><h3 className="font-semibold">Governorates ({selectedGovernorates.length})</h3></div>
          <div className="h-[200px] overflow-y-auto space-y-2">
            {Object.keys(IRAQ_GOVERNORATES).map((gov) => (
              <label key={gov} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedGovernorates.includes(gov)} disabled={isRunning} onChange={(e) => { if (e.target.checked) { setSelectedGovernorates([...selectedGovernorates, gov]); } else { setSelectedGovernorates(selectedGovernorates.filter((g) => g !== gov)); } }} className="rounded border-gray-300" />
                <span className="text-sm">{gov}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border-0 bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:col-span-2">
          <div className="flex items-center gap-2 mb-5"><Tags className="h-5 w-5 text-amber-400" /><h3 className="font-bold text-white text-lg">Categories ({selectedCategories.length} selected)</h3></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Object.entries(CATEGORIES).map(([key, cat]) => {
              const isSelected = selectedCategories.includes(key);
              const displayName = CATEGORY_DISPLAY_NAMES[key] || cat.name.toUpperCase();
              return (
                <button key={key} disabled={isRunning} onClick={() => { if (isSelected) { setSelectedCategories(selectedCategories.filter((c) => c !== key)); } else { setSelectedCategories([...selectedCategories, key]); } }} className={`group relative rounded-2xl p-5 text-center transition-all duration-300 overflow-hidden ${isRunning ? 'opacity-50 cursor-not-allowed' : ''} ${isSelected ? "bg-gradient-to-br from-amber-500/30 to-amber-600/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20" : "bg-slate-800/80 border border-slate-700 hover:border-amber-500/50 hover:bg-slate-750"}`}>
                  {isSelected && (<div className="absolute top-2 right-2 bg-amber-400 text-slate-900 rounded-full p-1"><Check className="h-3 w-3" /></div>)}
                  <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all ${isSelected ? "bg-amber-500 text-slate-900" : "bg-slate-700/50 text-amber-400 group-hover:bg-slate-700 group-hover:text-amber-300"}`}>{CATEGORY_ICONS[key] || <Tags className="h-6 w-6" />}</div>
                  <h4 className={`text-[11px] font-bold leading-tight tracking-wide uppercase ${isSelected ? "text-white" : "text-slate-300 group-hover:text-white"}`}>{displayName}</h4>
                  <p className={`text-[10px] mt-2 font-medium ${isSelected ? "text-amber-300" : "text-slate-500 group-hover:text-slate-400"}`}>{cat.subcategories?.length || 0} TYPES</p>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all ${isSelected ? "bg-amber-500" : "bg-slate-700 group-hover:bg-amber-500/30"}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3"><Settings className="h-4 w-4 text-muted-foreground" /><h3 className="font-semibold">Settings</h3></div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Radius (meters)</label>
              <input type="range" min="1000" max="50000" step="1000" value={radius} disabled={isRunning} onChange={(e) => setRadius(Number(e.target.value))} className="w-full" />
              <span className="text-sm text-muted-foreground">{radius}m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {!isRunning ? (
          <button onClick={handleStart} disabled={selectedGovernorates.length === 0 || selectedCategories.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <Play className="h-4 w-4" />
            Start ({selectedGovernorates.length * selectedCategories.length} tasks)
          </button>
        ) : (
          <button onClick={handleStop} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Square className="h-4 w-4" />Stop</button>
        )}
        <button onClick={clearResults} disabled={isRunning} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50"><RotateCw className="h-4 w-4" />Clear Results</button>
        {results.validated.length > 0 || results.needsReview.length > 0 ? (
          <button onClick={handleStageAll} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Stage All ({results.validated.length + results.needsReview.length})</button>
        ) : null}
      </div>

      {isRunning && currentTask && (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-primary" /><span className="font-medium">Scraping: {currentTask.governorate} → {currentTask.categoryName}</span></div>
            <span className="text-sm text-muted-foreground">Task {progress.currentTaskNumber} / {progress.totalTasks}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(progress.currentTaskNumber / progress.totalTasks) * 100}%` }} /></div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4"><h4 className="font-semibold text-green-900 dark:text-green-100">Validated</h4><p className="text-2xl font-bold text-green-700 dark:text-green-300">{results.validated.length}</p></div>
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950 p-4"><h4 className="font-semibold text-amber-900 dark:text-amber-100">Needs Review</h4><p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{results.needsReview.length}</p></div>
        <div className="rounded-lg border bg-red-50 dark:bg-red-950 p-4"><h4 className="font-semibold text-red-900 dark:text-red-100">Errors</h4><p className="text-2xl font-bold text-red-700 dark:text-red-300">{results.errors.length}</p></div>
        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950 p-4"><h4 className="font-semibold text-blue-900 dark:text-blue-100">Total Found</h4><p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{results.validated.length + results.needsReview.length}</p></div>
      </div>

      {taskHistory.length > 0 && (
        <div className="rounded-lg border bg-card">
          <button onClick={() => setShowTaskHistory(!showTaskHistory)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
            <div className="flex items-center gap-2"><List className="h-4 w-4" /><span className="font-semibold">Task History ({taskHistory.length})</span></div>
            {showTaskHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showTaskHistory && (
            <div className="border-t max-h-[300px] overflow-y-auto">
              {taskHistory.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 border-b last:border-0 text-sm">
                  {task.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <div className="flex-1"><span className="font-medium">{task.governorate}</span><span className="text-muted-foreground"> → </span><span className="font-medium">{task.categoryName}</span></div>
                  <div className="text-muted-foreground">{task.businessesFound} found{task.status === 'failed' && <span className="text-red-500 ml-2">(error)</span>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-black text-green-400 font-mono text-sm p-4 h-[300px] overflow-y-auto">
        {logs.length === 0 ? <p className="text-muted-foreground">Logs will appear here...</p> : logs.map((log, i) => <div key={i} className="py-0.5">{log}</div>)}
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

async function enrichOsmBusinesses(osmBusinesses: Partial<Business>[], _addLog: (msg: string) => void): Promise<Partial<Business>[]> {
  const enriched: Partial<Business>[] = [];
  for (const business of osmBusinesses) {
    const validation = validateIraqiPhone(business.phone);
    (business as any)._phoneValid = validation.isValid;
    if (validation.isValid) business.phone = validation.formatted;
    enriched.push(business);
  }
  const igCandidates = enriched.filter((b) => b.name && b.phone);
  if (igCandidates.length > 0) {
    const igResults = await batchFindInstagram(igCandidates.map((b) => ({ name: b.name || "", city: b.city || "" })));
    for (const business of enriched) {
      const key = business.name;
      if (key && igResults.has(key)) (business as any)._instagram = igResults.get(key)?.handle;
    }
  }
  const fbCandidates = enriched.filter((b) => b.name && b.phone);
  if (fbCandidates.length > 0) {
    const fbResults = await batchFindFacebook(fbCandidates.map((b) => ({ name: b.name || "", city: b.city || "" })));
    for (const business of enriched) {
      const key = business.name;
      if (key && fbResults.has(key)) (business as any)._facebook = fbResults.get(key)?.url;
    }
  }
  return enriched;
}

async function scrapeOverpass(lat: number, lon: number, tags: string[], radius: number, governorate: string, categoryKey: string, categoryName: string): Promise<Partial<Business>[]> {
  const query = buildOverpassQuery(lat, lon, tags, radius);
  const maxRetries = 2;
  for (const server of ALL_OVERPASS_SERVERS) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(server, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `data=${encodeURIComponent(query)}` });
        if (response.status === 429) { await delay((attempt + 1) * 5000); continue; }
        if (!response.ok) break;
        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();
        if (!contentType.includes("json") && !text.trim().startsWith("{")) break;
        const data = JSON.parse(text);
        return (data.elements || [])
          .filter((el: Record<string, unknown>) => (el.tags as Record<string, string>)?.name)
          .map((el: Record<string, unknown>) => parseOsmElement(el, governorate, categoryKey, categoryName));
      } catch { if (attempt < maxRetries) await delay(2000); continue; }
    }
  }
  throw new Error("All Overpass servers failed");
}

function buildOverpassQuery(lat: number, lon: number, tags: string[], radius: number): string {
  const tagQueries = tags.flatMap((tag) => {
    if (tag.includes("=")) {
      const [key, value] = tag.split("=");
      return [`node["${key}"="${value}"](around:${radius},${lat},${lon});`, `way["${key}"="${value}"](around:${radius},${lat},${lon});`, `relation["${key}"="${value}"](around:${radius},${lat},${lon});`];
    }
    return [];
  });
  return `[out:json][timeout:60];(${tagQueries.join("\n      ")});out body center qt;`;
}

function parseOsmElement(el: Record<string, unknown>, governorate: string, categoryKey: string, _categoryName: string): Partial<Business> {
  const tags = (el.tags as Record<string, string>) || {};
  const center = (el.center as Record<string, number>) || {};
  const lat = (el.lat as number) || center.lat;
  const lon = (el.lon as number) || center.lon;
  const phoneSources = [tags.phone, tags["contact:phone"], tags["phone:mobile"], tags["contact:mobile"], tags["phone:main"], tags["communication:phone"], tags["operator:phone"]].filter(Boolean);
  const allPhones: string[] = [];
  for (const src of phoneSources) if (src) src.split(/[;,]/).forEach((p: string) => { const t = p.trim(); if (t) allPhones.push(t); });
  let normalizedPhone: string | undefined;
  for (const raw of allPhones) { const r = normalizePhone(raw, "", governorate); if (r && r.length >= 13) { normalizedPhone = r; break; } }
  const website = tags.website || tags["contact:website"] || tags.url || tags["brand:website"] || undefined;
  const email = tags.email || tags["contact:email"] || tags["operator:email"] || undefined;
  const facebook = tags["contact:facebook"] || tags.facebook || tags["brand:facebook"] || undefined;
  const instagram = tags["contact:instagram"] || tags.instagram || tags["brand:instagram"] || undefined;
  const addrParts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:suburb"] || tags["addr:neighbourhood"], tags["addr:district"]].filter(Boolean);
  const fullAddr = tags["addr:full"] || (addrParts.length > 0 ? addrParts.join(", ") : undefined);
  const city = tags["addr:city"] || tags["addr:district"] || tags["is_in:city"] || governorate;
  const name = tags.name?.trim() || tags["name:ar"]?.trim() || "";
  const nameEn = tags["name:en"]?.trim() || undefined;
  const nameKu = tags["name:ku"]?.trim() || undefined;
  const raw_data: Record<string, unknown> = { ...tags, _extra: { all_phones: allPhones, twitter: tags["contact:twitter"] || tags.twitter || undefined, whatsapp: tags["contact:whatsapp"] || tags.whatsapp || undefined, telegram: tags["contact:telegram"] || tags.telegram || undefined, youtube: tags["contact:youtube"] || tags.youtube || undefined, tiktok: tags["contact:tiktok"] || tags.tiktok || undefined, opening_hours: tags.opening_hours || undefined, operator: tags.operator || tags.brand || undefined, description: tags.description || tags["description:en"] || tags["description:ar"] || undefined, cuisine: tags.cuisine || undefined, stars: tags.stars || undefined, postcode: tags["addr:postcode"] || undefined, name_ku: nameKu } };
  return { id: `osm_${el.type}_${el.id}`, name, name_en: nameEn, nameAr: name, nameKu, phone: normalizedPhone, website, email, address: fullAddr, city, governorate: mapGovernorateToHumus(governorate), lat, lng: lon, category: mapCategoryToHumus(categoryKey), subcategory: categoryKey, facebook, instagram, whatsapp: (raw_data._extra as Record<string, unknown>)?.whatsapp as string | undefined, description: tags.description || tags["description:en"] || tags["description:ar"] || undefined, _status: undefined, _source: "osm", raw_data };
}

function classifyBusiness(business: Partial<Business>): Partial<Business> & { _status: string } {
  let score = 0;
  const raw = (business.raw_data as Record<string, unknown>) || {};
  const extra = (raw._extra as Record<string, unknown>) || {};
  const checks = { hasName: business.name && business.name.length > 2, hasPhone: business.phone && business.phone.length >= 13, hasWebsite: business.website && business.website.length > 5, hasAddress: business.address && business.address.length > 5, hasCoords: business.lat && business.lng, hasSocial: business.whatsapp || extra.whatsapp, hasEmail: (business as any).email, hasWhatsapp: business.whatsapp || !!extra.whatsapp, hasHours: !!extra.opening_hours };
  if (checks.hasName) score += 2;
  if (checks.hasPhone) score += 3;
  if (checks.hasWebsite) score += 2;
  if (checks.hasSocial) score += 1;
  if (checks.hasEmail) score += 1;
  if (checks.hasAddress) score += 1;
  if (checks.hasCoords) score += 1;
  if (checks.hasWhatsapp) score += 1;
  if (checks.hasHours) score += 1;
  const _status = checks.hasPhone && score >= 5 ? "validated" : "needs_review";
  const data_quality = checks.hasPhone && score >= 6 ? "real" : score >= 3 ? "partial" : "osm";
  return { ...business, _status, data_quality };
}

function delay(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }
