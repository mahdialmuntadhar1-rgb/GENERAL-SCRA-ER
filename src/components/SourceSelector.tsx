import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  Square,
  Zap,
  Users,
  Layers,
  Search,
  AlertCircle
} from 'lucide-react';
import { SOURCES } from '../constants';
import { DiscoverySource } from '../types';

interface SourceSelectorProps {
  selectedSources: DiscoverySource[];
  onChange: (sources: DiscoverySource[]) => void;
}

export function SourceSelector({ selectedSources, onChange }: SourceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const enabledSourceIds = useMemo(
    () => SOURCES.filter((s) => s.enabled).map((s) => s.id),
    []
  );

  const toggleAll = () => {
    if (selectedSources.length === enabledSourceIds.length) {
      onChange([]);
      return;
    }

    onChange(enabledSourceIds);
  };

  const toggleSource = (id: DiscoverySource) => {
    onChange(
      selectedSources.includes(id)
        ? selectedSources.filter((i) => i !== id)
        : [...selectedSources, id]
    );
  };

  const filteredSources = SOURCES.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Data Sources</h2>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Select APIs & Scrapers for collection</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all w-48"
            />
          </div>
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-sm"
          >
            {selectedSources.length === enabledSourceIds.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            {selectedSources.length === enabledSourceIds.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 sticky top-0 z-10 border-b border-zinc-200">
            <tr>
              <th className="px-6 py-4 w-12"></th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Source Name</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Capabilities</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Priority</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredSources.map((source) => (
              <tr
                key={source.id}
                className={`group hover:bg-zinc-50 transition-colors cursor-pointer ${!source.enabled && 'opacity-50'}`}
                onClick={() => source.enabled && toggleSource(source.id)}
              >
                <td className="px-6 py-4">
                  <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                    selectedSources.includes(source.id)
                      ? 'bg-orange-600 border-orange-600 shadow-sm'
                      : 'border-zinc-300 group-hover:border-zinc-400'
                  }`}>
                    {selectedSources.includes(source.id) && <CheckSquare className="w-4 h-4 text-white" />}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-bold text-zinc-400 text-xs uppercase">
                      {source.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{source.name}</p>
                      {source.description && <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{source.description}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    source.type === 'api' ? 'bg-blue-50 text-blue-600' :
                    source.type === 'scraper' ? 'bg-purple-50 text-purple-600' :
                    'bg-zinc-100 text-zinc-600'
                  }`}>
                    {source.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {source.bulkSupport && (
                      <div className="p-1.5 bg-zinc-100 rounded-lg text-zinc-500" title="Bulk Support">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {source.socialSupport && (
                      <div className="p-1.5 bg-zinc-100 rounded-lg text-zinc-500" title="Social/Contact Support">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="p-1.5 bg-zinc-100 rounded-lg text-zinc-500" title="High Precision POI">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-600">
                    {source.priority}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      {source.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center gap-3">
        <AlertCircle className="w-4 h-4 text-orange-500" />
        <p className="text-xs text-zinc-500 font-medium">
          <span className="font-bold text-zinc-900">{selectedSources.length} sources selected.</span> Only implemented sources can be used for live collection.
        </p>
      </div>
    </div>
  );
}
