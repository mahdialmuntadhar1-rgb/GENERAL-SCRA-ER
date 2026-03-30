import React, { useState } from 'react';
import { Play, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DiscoverySource, DiscoveryResult } from '../types';

const CITIES = ['Baghdad', 'Erbil', 'Basra', 'Mosul', 'Sulaymaniyah', 'Najaf', 'Karbala'];
const CATEGORIES = ['Restaurant', 'Hotel', 'Cafe', 'Pharmacy', 'Supermarket', 'Tech Company', 'Gym'];
const SOURCES: { id: DiscoverySource; name: string }[] = [
  { id: 'gemini', name: 'Gemini Research' },
  { id: 'web_directory', name: 'Web Directory' },
  { id: 'facebook', name: 'Facebook (Coming Soon)' },
  { id: 'instagram', name: 'Instagram (Coming Soon)' }
];

export function RunPage() {
  const [city, setCity] = useState(CITIES[0]);
  const [district, setDistrict] = useState('City Center');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedSources, setSelectedSources] = useState<DiscoverySource[]>(['gemini']);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleSource = (id: DiscoverySource) => {
    if (id === 'facebook' || id === 'instagram') return;
    setSelectedSources((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleRun = async () => {
    if (selectedSources.length === 0) {
      setError('Please select at least one source.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, category, district, sources: selectedSources })
      });

      if (!response.ok) throw new Error('Failed to run discovery');

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">New City-Center Discovery Run</h1>
        <p className="text-sm text-zinc-500 mb-6">Only central-city businesses should be discoverable.</p>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Central Zone / District</label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Sources</label>
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map((source) => (
                <button
                  key={source.id}
                  onClick={() => toggleSource(source.id)}
                  disabled={source.id === 'facebook' || source.id === 'instagram'}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm ${
                    selectedSources.includes(source.id)
                      ? 'bg-orange-50 border-orange-200 text-orange-900 ring-1 ring-orange-200'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300'
                  } ${(source.id === 'facebook' || source.id === 'instagram') ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  <span>{source.name}</span>
                  {selectedSources.includes(source.id) && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            {loading ? 'Running Discovery...' : 'Run Discovery'}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-900">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 p-6 bg-zinc-900 text-white rounded-2xl">
            <div className="flex items-center gap-2 mb-4 text-orange-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold">Run Summary</h3>
            </div>
            <p className="text-sm text-zinc-400 mb-4">{result.summary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric label="Inserted" value={result.insertedCount} tone="text-green-400" />
              <Metric label="Skipped" value={result.skippedCount} tone="text-zinc-300" />
              <Metric label="Rejected" value={result.rejectedCount} tone="text-red-400" />
              <Metric label="Manual Review" value={result.needsManualReviewCount} tone="text-amber-300" />
            </div>
            {result.errors.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <div className="text-xs text-zinc-500 uppercase font-bold mb-2">Errors</div>
                <ul className="text-xs text-red-400 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-zinc-800 p-3 rounded-lg">
      <div className="text-xs text-zinc-500 uppercase font-bold mb-1">{label}</div>
      <div className={`text-2xl font-mono ${tone}`}>{value}</div>
    </div>
  );
}
