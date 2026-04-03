import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Business } from "@/lib/supabase";

// Task represents a single governorate+category combination
export interface ScraperTask {
  id: string;
  governorate: string;
  categoryKey: string;
  categoryName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  retryCount: number;
  maxRetries: number;
  businessesFound: number;
  businessesValidated: number;
  businessesNeedsReview: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

// Queue tracks all tasks for a scraping session
export interface ScraperQueue {
  jobId: string;
  tasks: ScraperTask[];
  currentTaskIndex: number;
  isProcessing: boolean;
  isPaused: boolean;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalBusinessesFound: number;
}

interface ScraperState {
  isRunning: boolean;
  logs: string[];
  progress: {
    currentGovernorate: string;
    currentCategory: string;
    processedGovernorates: number;
    totalGovernorates: number;
    processedCategories: number;
    totalCategories: number;
    currentTaskNumber: number;
    totalTasks: number;
  };
  results: {
    validated: Business[];
    needsReview: Business[];
    errors: string[];
  };
  stopSignal: boolean;
  
  // New queue-based state
  queue: ScraperQueue | null;
  currentTask: ScraperTask | null;
  taskHistory: ScraperTask[];
  
  // Actions
  startScraping: () => void;
  stopScraping: () => void;
  pauseScraping: () => void;
  resumeScraping: () => void;
  addLog: (message: string) => void;
  updateProgress: (progress: Partial<ScraperState["progress"]>) => void;
  addResult: (type: "validated" | "needsReview", business: Business) => void;
  addError: (error: string) => void;
  clearResults: () => void;
  reset: () => void;
  
  // New queue actions
  initializeQueue: (jobId: string, tasks: Array<{ governorate: string; categoryKey: string; categoryName: string }>) => void;
  setCurrentTask: (task: ScraperTask | null) => void;
  updateTaskStatus: (taskId: string, status: ScraperTask['status'], updates?: Partial<ScraperTask>) => void;
  completeTask: (taskId: string, results: { found: number; validated: number; needsReview: number }) => void;
  failTask: (taskId: string, error: string) => void;
  addToHistory: (task: ScraperTask) => void;
  getQueueStats: () => { pending: number; running: number; completed: number; failed: number; total: number };
  getNextPendingTask: () => ScraperTask | null;
}

export const useScraperStore = create<ScraperState>()(
  persist(
    (set, get) => ({
      isRunning: false,
      logs: [],
      progress: {
        currentGovernorate: "",
        currentCategory: "",
        processedGovernorates: 0,
        totalGovernorates: 0,
        processedCategories: 0,
        totalCategories: 0,
        currentTaskNumber: 0,
        totalTasks: 0,
      },
      results: {
        validated: [],
        needsReview: [],
        errors: [],
      },
      stopSignal: false,
      queue: null,
      currentTask: null,
      taskHistory: [],

      startScraping: () =>
        set({
          isRunning: true,
          stopSignal: false,
          logs: ["[INFO] Scraper started with sequential queue..."],
          results: { validated: [], needsReview: [], errors: [] },
        }),

      stopScraping: () =>
        set((state) => ({
          isRunning: false,
          stopSignal: true,
          logs: [...state.logs, "[INFO] Scraper stopped by user"],
          queue: state.queue ? { ...state.queue, isProcessing: false } : null,
        })),

      pauseScraping: () =>
        set((state) => ({
          isRunning: false,
          logs: [...state.logs, "[INFO] Scraper paused"],
          queue: state.queue ? { ...state.queue, isPaused: true, isProcessing: false } : null,
        })),

      resumeScraping: () =>
        set((state) => ({
          isRunning: true,
          stopSignal: false,
          logs: [...state.logs, "[INFO] Scraper resumed"],
          queue: state.queue ? { ...state.queue, isPaused: false, isProcessing: true } : null,
        })),

      addLog: (message) =>
        set((state) => ({
          logs: [...state.logs.slice(-500), `[${new Date().toLocaleTimeString()}] ${message}`], // Keep last 500 logs
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
            errors: [...state.results.errors.slice(-100), error], // Keep last 100 errors
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
            currentCategory: "",
            processedGovernorates: 0,
            totalGovernorates: 0,
            processedCategories: 0,
            totalCategories: 0,
            currentTaskNumber: 0,
            totalTasks: 0,
          },
          results: {
            validated: [],
            needsReview: [],
            errors: [],
          },
          stopSignal: false,
          queue: null,
          currentTask: null,
          taskHistory: [],
        }),

      // Queue management
      initializeQueue: (jobId, taskConfigs) => {
        const tasks: ScraperTask[] = taskConfigs.map((config, index) => ({
          id: `${jobId}-${index}`,
          governorate: config.governorate,
          categoryKey: config.categoryKey,
          categoryName: config.categoryName,
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
          businessesFound: 0,
          businessesValidated: 0,
          businessesNeedsReview: 0,
        }));

        set({
          queue: {
            jobId,
            tasks,
            currentTaskIndex: 0,
            isProcessing: false,
            isPaused: false,
            totalTasks: tasks.length,
            completedTasks: 0,
            failedTasks: 0,
            totalBusinessesFound: 0,
          },
        });
      },

      setCurrentTask: (task) =>
        set({ currentTask: task }),

      updateTaskStatus: (taskId, status, updates = {}) =>
        set((state) => {
          if (!state.queue) return state;
          
          const updatedTasks = state.queue.tasks.map((t) =>
            t.id === taskId ? { ...t, status, ...updates } : t
          );

          return {
            queue: { ...state.queue, tasks: updatedTasks },
            currentTask: state.currentTask?.id === taskId 
              ? { ...state.currentTask, status, ...updates } 
              : state.currentTask,
          };
        }),

      completeTask: (taskId, results) =>
        set((state) => {
          if (!state.queue) return state;

          const updatedTasks = state.queue.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: 'completed' as const,
                  businessesFound: results.found,
                  businessesValidated: results.validated,
                  businessesNeedsReview: results.needsReview,
                  completedAt: new Date().toISOString(),
                }
              : t
          );

          const completedCount = updatedTasks.filter((t) => t.status === 'completed').length;
          const totalFound = updatedTasks.reduce((sum, t) => sum + t.businessesFound, 0);

          // Add to history
          const completedTask = updatedTasks.find((t) => t.id === taskId);
          if (completedTask) {
            get().addToHistory(completedTask);
          }

          return {
            queue: {
              ...state.queue,
              tasks: updatedTasks,
              completedTasks: completedCount,
              totalBusinessesFound: totalFound,
              currentTaskIndex: state.queue.currentTaskIndex + 1,
            },
            currentTask: null,
          };
        }),

      failTask: (taskId, error) =>
        set((state) => {
          if (!state.queue) return state;

          const task = state.queue.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const shouldRetry = task.retryCount < task.maxRetries;
          const newStatus = shouldRetry ? 'retrying' : 'failed';
          const newRetryCount = task.retryCount + 1;

          const updatedTasks = state.queue.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: newStatus,
                  errorMessage: error,
                  retryCount: newRetryCount,
                }
              : t
          );

          const failedCount = updatedTasks.filter(
            (t) => t.status === 'failed' || (t.status === 'retrying' && t.retryCount >= t.maxRetries)
          ).length;

          // Add to history if permanently failed
          if (!shouldRetry) {
            const failedTask = updatedTasks.find((t) => t.id === taskId);
            if (failedTask) {
              get().addToHistory(failedTask);
            }
          }

          return {
            queue: {
              ...state.queue,
              tasks: updatedTasks,
              failedTasks: failedCount,
              currentTaskIndex: shouldRetry ? state.queue.currentTaskIndex : state.queue.currentTaskIndex + 1,
            },
            currentTask: shouldRetry ? state.currentTask : null,
            logs: [...state.logs, `[ERROR] Task ${taskId} failed: ${error}${shouldRetry ? ' (will retry)' : ''}`],
          };
        }),

      addToHistory: (task) =>
        set((state) => ({
          taskHistory: [...state.taskHistory.slice(-99), task], // Keep last 100
        })),

      getQueueStats: () => {
        const { queue } = get();
        if (!queue) return { pending: 0, running: 0, completed: 0, failed: 0, total: 0 };

        return {
          pending: queue.tasks.filter((t) => t.status === 'pending').length,
          running: queue.tasks.filter((t) => t.status === 'running').length,
          completed: queue.tasks.filter((t) => t.status === 'completed').length,
          failed: queue.tasks.filter((t) => t.status === 'failed').length,
          total: queue.tasks.length,
        };
      },

      getNextPendingTask: () => {
        const { queue } = get();
        if (!queue) return null;

        // First check for retrying tasks
        const retryingTask = queue.tasks.find((t) => t.status === 'retrying');
        if (retryingTask) return retryingTask;

        // Then check for pending tasks
        return queue.tasks.find((t) => t.status === 'pending') || null;
      },
    }),
    {
      name: "scraper-storage",
      partialize: (state) => ({
        results: state.results,
        taskHistory: state.taskHistory,
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
          selectedIds: state.stagedBusinesses
            .filter((b) => b._status === "validated")
            .map((b) => String(b.id || b.external_id || b.name)),
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
    sequentialDelay: number; // New: delay between tasks in ms
    maxRetries: number; // New: default retry count
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
        sequentialDelay: 3000, // 3 seconds between tasks
        maxRetries: 3,
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
