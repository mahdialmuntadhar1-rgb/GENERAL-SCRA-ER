import React, { useEffect, useMemo, useState } from 'react';
import { Play, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DiscoveryResult, ProviderConfig, SourceSelectorOptions } from '../types';

const CITIES = ['Baghdad', 'Erbil', 'Basra', 'Mosul', 'Sulaymaniyah', 'Najaf', 'Karbala'];
const CATEGORIES = ['Restaurant', 'Hotel', 'Cafe', 'Pharmacy', 'Supermarket', 'Tech Company', 'Gym'];
const SUBCATEGORIES = ['Family', 'Fast Casual', 'Luxury', 'Medical', 'Retail'];

const defaultOptions: SourceSelectorOptions = {
  selectAllSources: true,
  selectedProviderIds: [],
  sourcePriorityMode: 'free-tier-first',
  freeTierOnly: false,
  mapPoiOnly: false,
  enrichmentOnly: false,
  fallbackSearchOnly: false,
  manualUploadsOnly: false,
  centralCityOnly: true,
  city: CITIES[0],
  category: CATEGORIES[0],
  subcategory: SUBCATEGORIES[0],
  district: 'Karrada',
  maxResultsPerSource: 5,
  duplicateTolerance: 70,
  verificationStrictness: 65,
  executionMode: 'sequence',
  stopOnThreshold: 30,
};

export function RunPage() {
  const [options, setOptions] = useState<SourceSelectorOptions>(defaultOptions);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [centralZones, setCentralZones] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [providerRes, zoneRes] = await Promise.all([
        fetch('/api/providers'),
        fetch('/api/cities/central-zones'),
      ]);
      const providerData = await providerRes.json();
      const zoneData = await zoneRes.json();
      setProviders(providerData.providers || []);
      setCentralZones(zoneData.allowlist || {});
      setOptions(prev => ({ ...prev, selectedProviderIds: (providerData.providers || []).map((p: ProviderConfig) => p.provider_id) }));
    };
    load().catch(console.error);
  }, []);

  const districtOptions = useMemo(() => centralZones[options.city] || [], [centralZones, options.city]);

  useEffect(() => {
    if (districtOptions.length) setOptions(prev => ({ ...prev, district: districtOptions[0] }));
  }, [districtOptions.length]);

  const toggleSource = (id: string) => {
    setOptions(prev => {
      const selected = prev.selectedProviderIds.includes(id)
        ? prev.selectedProviderIds.filter(p => p !== id)
        : [...prev.selectedProviderIds, id];
      return { ...prev, selectedProviderIds: selected, selectAllSources: selected.length === providers.length };
    });
  };

  const toggleAll = () => {
    setOptions(prev => ({
      ...prev,
      selectAllSources: !prev.selectAllSources,
      selectedProviderIds: !prev.selectAllSources ? providers.map(p => p.provider_id) : [],
    }));
  };

  const handleRun = async () => {
    if (options.selectedProviderIds.length === 0) {
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
        body: JSON.stringify({ options, uploads: [] }),
      });

      if (!response.ok) throw new Error('Failed to run discovery');
      setResult(await response.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key: keyof SourceSelectorOptions) => setOptions(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Source Selector Discovery Run</h1>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select value={options.city} onChange={(e) => setOptions(prev => ({ ...prev, city: e.target.value }))} className="input">{CITIES.map(c => <option key={c}>{c}</option>)}</select>
            <select value={options.category} onChange={(e) => setOptions(prev => ({ ...prev, category: e.target.value }))} className="input">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            <select value={options.subcategory} onChange={(e) => setOptions(prev => ({ ...prev, subcategory: e.target.value }))} className="input">{SUBCATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            <select value={options.district} onChange={(e) => setOptions(prev => ({ ...prev, district: e.target.value }))} className="input">{districtOptions.map(d => <option key={d}>{d}</option>)}</select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={options.selectAllSources} onChange={toggleAll} /> Select all sources</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={options.freeTierOnly} onChange={() => toggle('freeTierOnly')} /> Free-tier only</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={options.mapPoiOnly} onChange={() => toggle('mapPoiOnly')} /> Map/POI only</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={options.enrichmentOnly} onChange={() => toggle('enrichmentOnly')} /> Enrichment only</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={options.fallbackSearchOnly} onChange={() => toggle('fallbackSearchOnly')} /> Fallback search only</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={options.manualUploadsOnly} onChange={() => toggle('manualUploadsOnly')} /> Manual uploads only</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={options.centralCityOnly} onChange={() => toggle('centralCityOnly')} /> Central-city only</label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select value={options.sourcePriorityMode} onChange={(e) => setOptions(prev => ({ ...prev, sourcePriorityMode: e.target.value as any }))} className="input">
              <option value="source-priority">Source priority</option>
              <option value="best-coverage">Best coverage</option>
              <option value="cheapest-first">Cheapest first</option>
              <option value="free-tier-first">Free-tier first</option>
            </select>
            <select value={options.executionMode} onChange={(e) => setOptions(prev => ({ ...prev, executionMode: e.target.value as any }))} className="input"><option value="sequence">Sequence</option><option value="parallel">Parallel</option></select>
            <input type="number" className="input" value={options.maxResultsPerSource} onChange={e => setOptions(prev => ({ ...prev, maxResultsPerSource: Number(e.target.value) }))} placeholder="Max/source" />
            <input type="number" className="input" value={options.stopOnThreshold} onChange={e => setOptions(prev => ({ ...prev, stopOnThreshold: Number(e.target.value) }))} placeholder="Stop threshold" />
            <input type="number" className="input" value={options.duplicateTolerance} onChange={e => setOptions(prev => ({ ...prev, duplicateTolerance: Number(e.target.value) }))} placeholder="Duplicate tolerance" />
            <input type="number" className="input" value={options.verificationStrictness} onChange={e => setOptions(prev => ({ ...prev, verificationStrictness: Number(e.target.value) }))} placeholder="Verification strictness" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Providers</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {providers.map((provider) => (
                <button key={provider.provider_id} onClick={() => toggleSource(provider.provider_id)} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm ${options.selectedProviderIds.includes(provider.provider_id) ? 'bg-orange-50 border-orange-200' : 'bg-white border-zinc-200'}`}>
                  <span>{provider.provider_name}</span>
                  {options.selectedProviderIds.includes(provider.provider_id) && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleRun} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-zinc-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />} {loading ? 'Running Discovery...' : 'Run Discovery'}
          </button>
        </div>

        {error && <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-900"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><p className="text-sm">{error}</p></div>}

        {result && (
          <div className="mt-6 p-6 bg-zinc-900 text-white rounded-2xl">
            <div className="flex items-center gap-2 mb-4 text-orange-400"><CheckCircle2 className="w-5 h-5" /><h3 className="font-bold">Run Summary</h3></div>
            <p className="text-sm text-zinc-400 mb-4">{result.summary}</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-800 p-3 rounded-lg"><div className="text-xs text-zinc-500 uppercase font-bold mb-1">Inserted</div><div className="text-2xl font-mono text-green-400">{result.insertedCount}</div></div>
              <div className="bg-zinc-800 p-3 rounded-lg"><div className="text-xs text-zinc-500 uppercase font-bold mb-1">Skipped</div><div className="text-2xl font-mono text-zinc-300">{result.skippedCount}</div></div>
              <div className="bg-zinc-800 p-3 rounded-lg"><div className="text-xs text-zinc-500 uppercase font-bold mb-1">Export Ready</div><div className="text-2xl font-mono text-orange-300">{result.importExportReport.export_ready_report.length}</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
