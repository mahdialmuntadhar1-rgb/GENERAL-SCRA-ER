import React, { useEffect, useMemo, useState } from 'react';
import { Users, Database, Building2, RadioTower, Loader2, AlertTriangle } from 'lucide-react';

interface DashboardSummary {
  totalBusinesses: number;
  byCity: Record<string, number>;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  recent: Array<{
    id: string;
    name: string;
    city: string;
    category: string;
    source: string;
    created_at: string;
  }>;
}

interface DashboardProps {
  refreshToken?: number;
}

export function Dashboard({ refreshToken = 0 }: DashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/dashboard-summary');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load dashboard summary');
        }
        setSummary(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [refreshToken]);

  const cityData = useMemo(
    () => Object.entries(summary?.byCity || {}).map(([name, count]) => ({ name, count })),
    [summary]
  );

  const sourceData = useMemo(
    () => Object.entries(summary?.bySource || {}).map(([name, count]) => ({ name, count })),
    [summary]
  );

  if (loading) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl p-20 text-center text-zinc-500">
        <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-900 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Operations Overview</h2>
        <p className="text-zinc-500 text-sm">Live Supabase metrics for collected businesses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2"><Database className="w-5 h-5 text-blue-600" /> <span className="text-sm font-semibold">Total Businesses</span></div>
          <p className="text-2xl font-bold">{summary?.totalBusinesses || 0}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2"><Building2 className="w-5 h-5 text-emerald-600" /> <span className="text-sm font-semibold">Cities Covered</span></div>
          <p className="text-2xl font-bold">{Object.keys(summary?.byCity || {}).length}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2"><RadioTower className="w-5 h-5 text-orange-600" /> <span className="text-sm font-semibold">Active Sources</span></div>
          <p className="text-2xl font-bold">{Object.keys(summary?.bySource || {}).length}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2"><Users className="w-5 h-5 text-zinc-700" /> <span className="text-sm font-semibold">Pending Review</span></div>
          <p className="text-2xl font-bold">{summary?.byStatus?.pending_review || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold mb-4">Businesses by City</h3>
          <div className="space-y-3">
            {cityData.length === 0 ? (
              <p className="text-sm text-zinc-500">No city data yet.</p>
            ) : (
              cityData.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{ width: `${Math.max(3, Math.min(100, (item.count / Math.max(summary?.totalBusinesses || 1, 1)) * 100))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold mb-4">Businesses by Source</h3>
          <div className="space-y-3">
            {sourceData.length === 0 ? (
              <p className="text-sm text-zinc-500">No source data yet.</p>
            ) : (
              sourceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm border border-zinc-100 rounded-xl px-3 py-2">
                  <span className="font-medium uppercase tracking-wide">{item.name}</span>
                  <span className="font-bold">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <h3 className="font-bold">Recent Records</h3>
        </div>
        <div className="divide-y divide-zinc-100">
          {(summary?.recent || []).length === 0 ? (
            <p className="p-6 text-sm text-zinc-500">No records found.</p>
          ) : (
            summary?.recent.map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{record.name}</p>
                  <p className="text-xs text-zinc-500">{record.city} • {record.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-zinc-500 font-semibold">{record.source || 'unknown'}</p>
                  <p className="text-xs text-zinc-400">{new Date(record.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
