// Frontend API Service - Calls backend API endpoints
// This hides API keys from the browser

import type { Business } from '@/lib/supabase';

const API_BASE = '/api';

// Helper for API calls
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ===== SCRAPER API =====

export interface ScraperStartRequest {
  governorates: string[];
  categories: string[];
  radius: number;
  jobId: string;
}

export interface ScraperStartResponse {
  message: string;
  jobId: string;
  status: string;
  checkStatusUrl: string;
}

export interface ScraperStatusResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: string;
  result?: {
    totalScraped: number;
    governorates: number;
    categories: number;
    errors: number;
  };
  error?: string;
  startedAt: string;
}

export const scraperApi = {
  start: (params: ScraperStartRequest) =>
    apiCall<ScraperStartResponse>('/scraper/start', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getStatus: (jobId: string) =>
    apiCall<ScraperStatusResponse>(`/scraper/status?jobId=${jobId}`),

  getServers: () =>
    apiCall<{ servers: Array<{ url: string; name: string; available: boolean }> }>(
      '/scraper/servers'
    ),
};

// ===== PIPELINE API =====

export interface PipelineStartRequest {
  businesses: Business[];
  source: string;
  jobId: string;
}

export interface PipelineStartResponse {
  message: string;
  jobId: string;
  status: string;
  checkStatusUrl: string;
}

export interface PipelineStatusResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: string;
  result?: {
    totalInput: number;
    imported: number;
    staged: number;
    inserted: number;
    updated: number;
    skipped: number;
  };
  error?: string;
  startedAt: string;
}

export interface NormalizeRequest {
  batchId: string;
}

export interface NormalizeResponse {
  batchId: string;
  normalized: number;
  staged: number;
}

export interface MatchRequest {
  batchId: string;
}

export interface MatchResponse {
  batchId: string;
  staged: number;
  existing: number;
  results: {
    new: number;
    update: number;
    duplicate: number;
    review: number;
    reject: number;
  };
}

export const pipelineApi = {
  run: (params: PipelineStartRequest) =>
    apiCall<PipelineStartResponse>('/pipeline/run', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  getStatus: (jobId: string) =>
    apiCall<PipelineStatusResponse>(`/pipeline/status?jobId=${jobId}`),

  normalize: (params: NormalizeRequest) =>
    apiCall<NormalizeResponse>('/pipeline/normalize', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  match: (params: MatchRequest) =>
    apiCall<MatchResponse>('/pipeline/match', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

// ===== STATS API =====

export interface StatsResponse {
  total_count: number;
  real_count: number;
  partial_count: number;
  osm_count: number;
  rejected_count: number;
  verified_count: number;
  cities_covered: number;
  governorates_covered: number;
  timestamp: string;
}

export interface QualityStatsResponse {
  breakdown: Array<{ data_quality: string; count: number }>;
  timestamp: string;
}

export interface CategoryStatsResponse {
  categories: Array<{ category: string; count: number }>;
  timestamp: string;
}

export const statsApi = {
  getStats: () => apiCall<StatsResponse>('/stats'),
  getQuality: () => apiCall<QualityStatsResponse>('/stats/quality'),
  getCategories: () => apiCall<CategoryStatsResponse>('/stats/categories'),
};

// ===== HEALTH API =====

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: Record<string, { status: 'ok' | 'error'; message?: string }>;
}

export const healthApi = {
  check: () => apiCall<HealthResponse>('/health'),
};

// ===== AUTH API =====

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
  } | null;
  message: string;
}

export const authApi = {
  login: (params: LoginRequest) =>
    apiCall<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  register: (params: RegisterRequest) =>
    apiCall<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  logout: () =>
    apiCall<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getSession: (token: string) =>
    apiCall<{ user: any }>('/auth/session', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

// Export all APIs
export const api = {
  scraper: scraperApi,
  pipeline: pipelineApi,
  stats: statsApi,
  health: healthApi,
  auth: authApi,
};

export default api;
