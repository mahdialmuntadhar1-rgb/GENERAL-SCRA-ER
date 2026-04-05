import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ChevronRight,
  Building2,
  Save,
  Trash2,
  Download
} from 'lucide-react';
import { AdminCityConfig } from '../../types';
import { triggerDownload } from '../../lib/download';

const initialConfigs: AdminCityConfig[] = [
  {
    city: 'Baghdad',
    approved_central_districts: ['Mansour', 'Karrada', 'Adhamiya', 'Yarmouk', 'Zayouna'],
    approved_central_zones: ['Central Baghdad', 'Green Zone', 'Rusafa Central']
  },
  {
    city: 'Erbil',
    approved_central_districts: ['Ankawa', 'Dream City', 'Bakhtiari', 'Empire World'],
    approved_central_zones: ['Central Erbil', 'Citadel Area']
  },
  {
    city: 'Basra',
    approved_central_districts: ['Ashar', 'Jazaer', 'Abbasiya'],
    approved_central_zones: ['Central Basra', 'Corniche Area']
  }
];

export function CityConfigPage() {
  const [configs, setConfigs] = useState<AdminCityConfig[]>(initialConfigs);
  const [selectedCity, setSelectedCity] = useState<string>(initialConfigs[0].city);
  const [newDistrict, setNewDistrict] = useState('');
  const [newZone, setNewZone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');

  const currentConfig = configs.find(c => c.city === selectedCity)!;

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAddCity = () => {
    if (!newCityName) return;
    const newConfig: AdminCityConfig = {
      city: newCityName,
      approved_central_districts: [],
      approved_central_zones: []
    };
    setConfigs([...configs, newConfig]);
    setSelectedCity(newCityName);
    setNewCityName('');
    setShowAddCity(false);
  };

  const handleDeleteCity = () => {
    if (configs.length <= 1) return;
    const newConfigs = configs.filter(c => c.city !== selectedCity);
    setConfigs(newConfigs);
    setSelectedCity(newConfigs[0].city);
  };

  const addDistrict = () => {
    if (!newDistrict) return;
    setConfigs(prev => prev.map(c => 
      c.city === selectedCity 
        ? { ...c, approved_central_districts: [...c.approved_central_districts, newDistrict] }
        : c
    ));
    setNewDistrict('');
  };

  const removeDistrict = (district: string) => {
    setConfigs(prev => prev.map(c => 
      c.city === selectedCity 
        ? { ...c, approved_central_districts: c.approved_central_districts.filter(d => d !== district) }
        : c
    ));
  };

  const addZone = () => {
    if (!newZone) return;
    setConfigs(prev => prev.map(c => 
      c.city === selectedCity 
        ? { ...c, approved_central_zones: [...c.approved_central_zones, newZone] }
        : c
    ));
    setNewZone('');
  };

  const removeZone = (zone: string) => {
    setConfigs(prev => prev.map(c => 
      c.city === selectedCity 
        ? { ...c, approved_central_zones: c.approved_central_zones.filter(z => z !== zone) }
        : c
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">City Center Configuration</h2>
          <p className="text-zinc-500 text-sm">Define approved central districts and urban zones for each city.</p>
        </div>
        <div className="flex gap-2">
          {showSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4" /> Changes saved!
            </div>
          )}
          <button 
            onClick={() => {
              const content = JSON.stringify(configs, null, 2);
              triggerDownload(content, 'city_config.json', 'application/json');
            }}
            className="px-4 py-3 bg-white border border-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-50 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export Config
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save All Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* City List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Search cities..." 
                  className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>
            <div className="divide-y divide-zinc-100">
              {configs.map((config) => (
                <button
                  key={config.city}
                  onClick={() => setSelectedCity(config.city)}
                  className={`w-full flex items-center justify-between p-4 text-left transition-all ${
                    selectedCity === config.city 
                      ? 'bg-orange-50 text-orange-900 border-l-4 border-orange-600' 
                      : 'hover:bg-zinc-50 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className={`w-4 h-4 ${selectedCity === config.city ? 'text-orange-600' : 'text-zinc-400'}`} />
                    <span className="text-sm font-bold">{config.city}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${selectedCity === config.city ? 'text-orange-600' : 'text-zinc-200'}`} />
                </button>
              ))}
              {showAddCity ? (
                <div className="p-4 border-t border-zinc-100 bg-zinc-50 space-y-3">
                  <input 
                    type="text" 
                    value={newCityName}
                    onChange={(e) => setNewCityName(e.target.value)}
                    placeholder="City name..." 
                    className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddCity}
                      className="flex-1 bg-zinc-900 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-zinc-800 transition-all"
                    >
                      Add City
                    </button>
                    <button 
                      onClick={() => setShowAddCity(false)}
                      className="flex-1 bg-white border border-zinc-200 text-zinc-600 py-1.5 rounded-lg text-[10px] font-bold hover:bg-zinc-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAddCity(true)}
                  className="w-full p-4 text-left text-sm font-bold text-orange-600 hover:bg-orange-50 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add New City
                </button>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Changes to these lists will immediately affect the "Outside Central Zone" flagging logic for new imports.
            </p>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-10">
            <div className="flex items-center gap-4">
              <div className="bg-orange-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/20">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">{selectedCity} Central Policy</h3>
                <p className="text-zinc-500 text-sm">Define the boundaries for central urban coverage.</p>
              </div>
            </div>

            {/* Approved Districts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm uppercase tracking-widest text-zinc-400">Approved Central Districts</h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {currentConfig.approved_central_districts.length} Districts
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentConfig.approved_central_districts.map((district) => (
                  <div key={district} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-xl group hover:bg-zinc-200 transition-all">
                    <span className="text-sm font-medium text-zinc-700">{district}</span>
                    <button 
                      onClick={() => removeDistrict(district)}
                      className="p-0.5 hover:bg-red-100 rounded-md text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    placeholder="Add district..." 
                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-32"
                    onKeyDown={(e) => e.key === 'Enter' && addDistrict()}
                  />
                  <button 
                    onClick={addDistrict}
                    className="p-1.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Approved Zones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm uppercase tracking-widest text-zinc-400">Approved Central Zones</h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {currentConfig.approved_central_zones.length} Zones
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentConfig.approved_central_zones.map((zone) => (
                  <div key={zone} className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-xl group hover:bg-orange-100 transition-all">
                    <span className="text-sm font-medium text-orange-900">{zone}</span>
                    <button 
                      onClick={() => removeZone(zone)}
                      className="p-0.5 hover:bg-red-100 rounded-md text-orange-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    placeholder="Add zone..." 
                    className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-32"
                    onKeyDown={(e) => e.key === 'Enter' && addZone()}
                  />
                  <button 
                    onClick={addZone}
                    className="p-1.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Last updated: Just now by Admin
              </div>
              <button 
                onClick={handleDeleteCity}
                className="text-sm font-bold text-red-600 hover:text-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete City Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
