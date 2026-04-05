import React, { useState, useEffect } from 'react';
import { Filter, Globe, Phone, MapPin, ExternalLink, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Business } from '../types';

const CITIES = ['All', 'Baghdad', 'Erbil', 'Basra', 'Mosul', 'Sulaymaniyah', 'Najaf', 'Karbala'];
const CATEGORIES = ['All', 'Restaurant', 'Hotel', 'Cafe', 'Pharmacy', 'Supermarket', 'Tech Company', 'Gym'];

export function ResultsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('All');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (city !== 'All') params.append('city', city);
      if (category !== 'All') params.append('category', category);

      const response = await fetch(`/api/businesses?${params}`);
      if (!response.ok) throw new Error('Failed to fetch businesses');
      
      const data = await response.json();
      setBusinesses(data.data);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [city, category, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Discovered Businesses</h1>
        <div className="flex items-center gap-2 bg-white border border-zinc-200 p-1 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 px-3 text-zinc-400">
            <Filter className="w-4 h-4" />
          </div>
          <select 
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            className="bg-transparent text-sm font-medium py-2 pr-4 focus:outline-none"
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="w-px h-4 bg-zinc-200" />
          <select 
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="bg-transparent text-sm font-medium py-2 pr-4 focus:outline-none"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Loading businesses...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center text-red-900">
          <p className="font-bold mb-2">Error loading data</p>
          <p className="text-sm opacity-70">{error}</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="bg-white border border-zinc-200 p-20 rounded-2xl text-center text-zinc-400">
          <p className="text-lg font-medium mb-2">No businesses found</p>
          <p className="text-sm">Try running a discovery run first or changing your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {businesses.map((biz) => (
              <div key={biz.id} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold">{biz.name}</h3>
                      {biz.local_name && (
                        <span className="text-sm font-medium text-zinc-400 font-arabic" dir="rtl">
                          {biz.local_name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                      <span className="bg-zinc-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">{biz.category}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {biz.city}</span>
                      {biz.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {biz.phone}</span>}
                    </div>
                    {biz.address && <p className="text-sm text-zinc-400 mt-2">{biz.address}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {biz.website && (
                      <a href={biz.website} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    {biz.source_url && (
                      <a href={biz.source_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1 text-xs font-medium">
                        <span className="uppercase tracking-tighter">{biz.source}</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-zinc-500">
              Showing <span className="font-bold text-zinc-900">{(page-1)*pageSize + 1}</span> to <span className="font-bold text-zinc-900">{Math.min(page*pageSize, total)}</span> of <span className="font-bold text-zinc-900">{total}</span>
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                disabled={page * pageSize >= total}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
