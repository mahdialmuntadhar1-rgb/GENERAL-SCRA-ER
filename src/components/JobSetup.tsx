import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronDown,
  Layers,
  Settings2,
  Play,
  Square,
  Globe,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Facebook,
  Instagram,
  Send,
  CheckSquare,
  Check,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { IRAQ_CITIES, CATEGORIES, DISCOVERY_SOURCES } from '../constants';
import { DiscoverySource } from '../types';

const iconMap: Record<string, any> = {
  MapPin,
  Layers,
  ShieldCheck,
  Globe,
  Sparkles,
  FileCheck,
  Facebook,
  Instagram,
  Send
};

export function JobSetup() {
  const [selectedCity, setSelectedCity] = useState(IRAQ_CITIES[0]);
  const [selectedDistrict, setSelectedDistrict] = useState(IRAQ_CITIES[0].districts[0]);
  const [selectedZone, setSelectedZone] = useState(IRAQ_CITIES[0].districts[0].central_zones[0]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [keyword, setKeyword] = useState('');
  const [selectedSources, setSelectedSources] = useState<DiscoverySource[]>(
    DISCOVERY_SOURCES.filter(s => s.defaultChecked).map(s => s.id)
  );

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastResult, setLastResult] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [toggles, setToggles] = useState({
    freeTierOnly: false,
    useFallback: true,
    enrichmentMode: true,
    mapPoiOnly: false,
    centralCityOnly: true,
    rejectSuburbs: true
  });

  const handleToggleSource = (sourceId: DiscoverySource) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId) 
        : [...prev, sourceId]
    );
  };

  const handleSelectAllSources = () => {
    if (selectedSources.length === DISCOVERY_SOURCES.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(DISCOVERY_SOURCES.map(s => s.id));
    }
  };

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleJob = () => {
    if (isRunning) {
      stopJob();
    } else {
      startJob();
    }
  };

  const startJob = async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one data source.');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setLastResult(null);

    // Mock progress while waiting for API
    intervalRef.current = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 2 : prev));
    }, 200);

    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: selectedCity.name,
          category: selectedCategory,
          sources: selectedSources
        })
      });

      if (!response.ok) throw new Error('Failed to run discovery job');
      
      const result = await response.json();
      setLastResult(result);
      setProgress(100);
      setTimeout(() => stopJob(), 1000);
    } catch (error: any) {
      console.error('Job execution error:', error);
      alert(`Error: ${error.message}`);
      stopJob();
    }
  };

  const stopJob = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Job Setup</h2>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            {isRunning ? 'Collection in progress...' : 'Configure collection parameters'}
          </p>
        </div>
        <div className="text-[11px] text-zinc-500 font-semibold">
          Select data sources below, then start the job.
        </div>
      </div>

      {isRunning && (
        <div className="px-6 py-2 bg-orange-50 border-b border-orange-100">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Progress</span>
            <span className="text-[10px] font-black text-orange-700">{progress}%</span>
          </div>
          <div className="h-1 bg-orange-200 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-orange-600"
            />
          </div>
        </div>
      )}

      {!isRunning && lastResult && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 space-y-3"
        >
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Job Completed</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Inserted</p>
              <p className="text-lg font-black text-emerald-900">{lastResult.insertedCount}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">Skipped</p>
              <p className="text-lg font-black text-emerald-900">{lastResult.skippedCount}</p>
            </div>
            {lastResult.sourceStats && Object.entries(lastResult.sourceStats).map(([source, stats]: [string, any]) => (
              <div key={source} className="space-y-0.5">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">{source}</p>
                <p className="text-xs font-bold text-emerald-800">+{stats.inserted} / {stats.found}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Geo Targeting */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <MapPin className="w-4 h-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Geo Targeting</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">City</label>
              <div className="relative">
                <select 
                  value={selectedCity.name}
                  onChange={(e) => {
                    const city = IRAQ_CITIES.find(c => c.name === e.target.value)!;
                    setSelectedCity(city);
                    setSelectedDistrict(city.districts[0]);
                    setSelectedZone(city.districts[0].central_zones[0]);
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none"
                >
                  {IRAQ_CITIES.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">District</label>
              <div className="relative">
                <select 
                  value={selectedDistrict.name}
                  onChange={(e) => {
                    const district = selectedCity.districts.find(d => d.name === e.target.value)!;
                    setSelectedDistrict(district);
                    setSelectedZone(district.central_zones[0]);
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none"
                >
                  {selectedCity.districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">Central Zone</label>
              <div className="relative">
                <select 
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none"
                >
                  {selectedDistrict.central_zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Category & Keywords */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Filter className="w-4 h-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Category & Keywords</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">Main Category</label>
              <div className="relative">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 appearance-none"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 ml-1">Keyword Search</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. 'Coffee Shop', 'Pharmacy'..." 
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Collection Parameters */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Settings2 className="w-4 h-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Collection Parameters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500">Max Results</label>
                <span className="text-xs font-black text-orange-600">500</span>
              </div>
              <input type="range" min="10" max="5000" defaultValue="500" className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-orange-600" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-500">Duplicate Tolerance</label>
                <span className="text-xs font-black text-orange-600">85%</span>
              </div>
              <input type="range" min="50" max="100" defaultValue="85" className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-orange-600" />
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <Globe className="w-4 h-4" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">Data Sources</h3>
            </div>
            <button
              onClick={handleSelectAllSources}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-colors"
            >
              <Check className="w-3 h-3" />
              {selectedSources.length === DISCOVERY_SOURCES.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {DISCOVERY_SOURCES.map((source) => {
              const Icon = iconMap[source.icon] || Globe;
              const isSelected = selectedSources.includes(source.id);
              
              return (
                <div 
                  key={source.id}
                  onClick={() => handleToggleSource(source.id)}
                  className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-orange-50/50 border-orange-200 ring-1 ring-orange-200' 
                      : 'bg-white border-zinc-100 hover:border-zinc-200'
                  }`}
                >
                  <div className={`mt-1 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-orange-600 border-orange-600' : 'bg-zinc-50 border-zinc-200 group-hover:border-zinc-300'
                  }`}>
                    {isSelected && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-zinc-400'}`} />
                        <span className={`text-sm font-bold ${isSelected ? 'text-zinc-900' : 'text-zinc-600'}`}>
                          {source.label}
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {source.tags.map(tag => (
                          <span 
                            key={tag} 
                            className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md ${
                              tag === 'Paid' ? 'bg-red-100 text-red-700' :
                              tag === 'Free' ? 'bg-emerald-100 text-emerald-700' :
                              tag === 'Open Source' ? 'bg-emerald-50 text-emerald-700' :
                              tag === 'Verification' ? 'bg-blue-100 text-blue-700' :
                              'bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {tag === 'Paid' && <DollarSign className="w-2.5 h-2.5" />}
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {source.description}
                    </p>
                    {source.hint && (
                      <p className="text-[10px] text-orange-600/70 font-medium italic">
                        {source.hint}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Smart Toggles */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Zap className="w-4 h-4" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Smart Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: 'freeTierOnly', label: 'Free Tier Only', icon: Zap },
              { id: 'useFallback', label: 'Use Fallback Sources', icon: Layers },
              { id: 'enrichmentMode', label: 'Enrichment Mode', icon: ShieldCheck },
              { id: 'mapPoiOnly', label: 'Map/POI Only', icon: MapPin },
              { id: 'centralCityOnly', label: 'Central City Only', icon: ShieldCheck },
              { id: 'rejectSuburbs', label: 'Reject Suburbs Automatically', icon: AlertTriangle },
            ].map((toggle) => (
              <button 
                key={toggle.id}
                onClick={() => handleToggle(toggle.id as any)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  toggles[toggle.id as keyof typeof toggles] 
                    ? 'bg-orange-50 border-orange-200 text-orange-900' 
                    : 'bg-white border-zinc-100 text-zinc-500 hover:border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <toggle.icon className={`w-4 h-4 ${toggles[toggle.id as keyof typeof toggles] ? 'text-orange-600' : 'text-zinc-400'}`} />
                  <span className="text-xs font-bold">{toggle.label}</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${
                  toggles[toggle.id as keyof typeof toggles] ? 'bg-orange-600' : 'bg-zinc-200'
                }`}>
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                    toggles[toggle.id as keyof typeof toggles] ? 'left-4.5' : 'left-0.5'
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-zinc-100 bg-zinc-50">
        <button
          onClick={toggleJob}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${
            isRunning
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 shadow-red-600/5'
              : 'bg-orange-600 text-white hover:bg-orange-500 shadow-orange-600/20'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-4 h-4 fill-red-600" />
              Stop Collection
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              Start Collection
            </>
          )}
        </button>
      </div>
    </div>
  );
}
