import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Business } from "@/lib/supabase";

interface ScraperState {
  isRunning: boolean;
  logs: string[];
  progress: {
    currentGovernorate: string;
    processed: number;
    total: number;
  };
  results: {
    validated: Business[];
    needsReview: Business[];
    errors: string[];
  };
  stopSignal: boolean;
  
  // Actions
  startScraping: () => void;
  stopScraping: () => void;
  addLog: (message: string) => void;
  updateProgress: (progress: Partial<ScraperState["progress"]>) => void;
  addResult: (type: "validated" | "needsReview", business: Business) => void;
  addError: (error: string) => void;
  clearResults: () => void;
  reset: () => void;
}

export const useScraperStore = create<ScraperState>()(
  persist(
    (set) => ({
      isRunning: false,
      logs: [],
      progress: {
        currentGovernorate: "",
        processed: 0,
        total: 18,
      },
      results: {
        validated: [],
        needsReview: [],
        errors: [],
      },
      stopSignal: false,

      startScraping: () =>
        set({
          isRunning: true,
          stopSignal: false,
          logs: ["[INFO] Scraper started..."],
          results: { validated: [], needsReview: [], errors: [] },
        }),

      stopScraping: () =>
        set((state) => ({
          isRunning: false,
          stopSignal: true,
          logs: [...state.logs, "[INFO] Scraper stopped by user"],
        })),

      addLog: (message) =>
        set((state) => ({
          logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${message}`],
        })),

      updateProgress: (progress) =>
        set((state) => ({
          progress: { ...state.progress, ...progress },
        })),

      addResult: (type, business) =>
        set((state) => ({
          results: {
            ...state.results,
            [type]: [...state.results[type], business],
          },
        })),

      addError: (error) =>
        set((state) => ({
          results: {
            ...state.results,
            errors: [...state.results.errors, error],
          },
        })),

      clearResults: () =>
        set({
          results: { validated: [], needsReview: [], errors: [] },
        }),

      reset: () =>
        set({
          isRunning: false,
          logs: [],
          progress: {
            currentGovernorate: "",
            processed: 0,
            total: 18,
          },
          results: {
            validated: [],
            needsReview: [],
            errors: [],
          },
          stopSignal: false,
        }),
    }),
    {
      name: "scraper-storage",
      partialize: (state) => ({
        results: state.results,
      }),
    }
  )
);

interface ReviewState {
  stagedBusinesses: Business[];
  selectedIds: string[];
  
  // Actions
  stageBusinesses: (businesses: Business[]) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  selectAllValidated: () => void;
  deselectAll: () => void;
  removeSelected: () => void;
  clearStaged: () => void;
  approveSelected: () => void;
  rejectSelected: () => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      stagedBusinesses: [],
      selectedIds: [] as string[],

      stageBusinesses: (businesses) =>
        set((state) => ({
          stagedBusinesses: [
            ...state.stagedBusinesses,
            ...businesses.filter(
              (b) => !state.stagedBusinesses.some(
                (sb) => (b.external_id && sb.external_id === b.external_id) ||
                        (b.fsq_id && sb.fsq_id === b.fsq_id) ||
                        (sb.name === b.name && sb.governorate === b.governorate)
              )
            ),
          ],
        })),

      toggleSelection: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((x) => x !== id)
            : [...state.selectedIds, id],
        })),

      selectAll: () =>
        set((state) => ({
          selectedIds: state.stagedBusinesses.map((b) => String(b.id || b.external_id || b.name)),
        })),

      selectAllValidated: () =>
        set((state) => ({
          selectedIds: state.stagedBusinesses
            .filter((b) => b._status === "validated")
            .map((b) => String(b.id || b.external_id || b.name)),
        })),

      deselectAll: () =>
        set({ selectedIds: [] }),

      removeSelected: () =>
        set((state) => ({
          stagedBusinesses: state.stagedBusinesses.filter(
            (b) => !state.selectedIds.includes(String(b.id || b.external_id || b.name))
          ),
          selectedIds: [],
        })),

      clearStaged: () =>
        set({
          stagedBusinesses: [],
          selectedIds: [],
        }),

      approveSelected: () => {
        const { stagedBusinesses, selectedIds } = get();
        set({
          stagedBusinesses: stagedBusinesses.map((b) =>
            selectedIds.includes(String(b.id || b.external_id || b.name)) ? { ...b, _status: "validated" } : b
          ),
        });
      },

      rejectSelected: () => {
        const { stagedBusinesses, selectedIds } = get();
        set({
          stagedBusinesses: stagedBusinesses.map((b) =>
            selectedIds.includes(String(b.id || b.external_id || b.name)) ? { ...b, _status: "needs_review" } : b
          ),
        });
      },
    }),
    {
      name: "review-storage",
    }
  )
);

interface SettingsState {
  apiKeys: {
    anthropic?: string;
    supabaseUrl?: string;
    supabaseKey?: string;
  };
  scrapingConfig: {
    radius: number;
    rateLimit: number;
    batchSize: number;
  };
  
  // Actions
  setApiKey: (key: keyof SettingsState["apiKeys"], value: string) => void;
  updateScrapingConfig: (config: Partial<SettingsState["scrapingConfig"]>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKeys: {},
      scrapingConfig: {
        radius: 10000,
        rateLimit: 1000,
        batchSize: 50,
      },

      setApiKey: (key, value) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [key]: value },
        })),

      updateScrapingConfig: (config) =>
        set((state) => ({
          scrapingConfig: { ...state.scrapingConfig, ...config },
        })),
    }),
    {
      name: "settings-storage",
    }
  )
);
