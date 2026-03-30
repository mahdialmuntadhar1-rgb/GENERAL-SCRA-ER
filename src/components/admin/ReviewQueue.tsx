import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Filter,
  ExternalLink,
  MapPin,
  Phone,
  Globe,
  CheckSquare,
  Square,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Business } from '../../types';

interface ReviewQueueProps {
  refreshToken?: number;
}

export function ReviewQueue({ refreshToken = 0 }: ReviewQueueProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterCity, setFilterCity] = useState('All Cities');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (filterCity !== 'All Cities') params.set('city', filterCity);
      if (search.trim()) params.set('search', search.trim());

      const response = await fetch(`/api/businesses?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch businesses');

      setBusinesses(data.data || []);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [filterCity, refreshToken]);

  const cityOptions = useMemo(() => ['All Cities', ...new Set(businesses.map((biz) => biz.city).filter(Boolean))], [businesses]);

  const toggleSelectAll = () => {
    if (selectedIds.length === businesses.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(businesses.map((biz) => biz.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Review Queue</h2>
          <p className="text-zinc-500 text-sm">Live Supabase records pending QA and publication decisions.</p>
        </div>
        <button className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
          Bulk Actions ({selectedIds.length})
        </button>
      </div>

      <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchBusinesses()}
            placeholder="Search by name, phone, or category..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <button onClick={fetchBusinesses} className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold">Search</button>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
          >
            {cityOptions.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-20 text-center text-zinc-500">
          <Loader2 className="w-8 h-8 mx-auto animate-spin mb-4" />
          Loading records...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                      {selectedIds.length === businesses.length && businesses.length > 0 ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Business</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Location</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Contacts</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {businesses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-zinc-500">No records found for the selected filters.</td>
                  </tr>
                ) : (
                  businesses.map((biz) => (
                    <tr key={biz.id} className={`hover:bg-zinc-50 transition-colors ${selectedIds.includes(biz.id) ? 'bg-orange-50/40' : ''}`}>
                      <td className="px-6 py-4">
                        <button onClick={() => toggleSelect(biz.id)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                          {selectedIds.includes(biz.id) ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{biz.name}</span>
                            {biz.source_url && <ExternalLink className="w-3 h-3 text-zinc-400" />}
                          </div>
                          <div className="text-xs text-zinc-500">{biz.category || 'Uncategorized'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-zinc-700 space-y-1">
                          <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-400" />{biz.city}</div>
                          {biz.address && <div className="text-xs text-zinc-500">{biz.address}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          {biz.phone && <div className="flex items-center gap-1 text-zinc-600"><Phone className="w-3.5 h-3.5" /> {biz.phone}</div>}
                          {biz.website && <a href={biz.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-orange-700 hover:underline"><Globe className="w-3.5 h-3.5" /> Website</a>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 bg-zinc-100 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                          {biz.source || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
