import React, { useMemo, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SourceSelector } from './components/SourceSelector';
import { JobSetup } from './components/JobSetup';
import {
  Bell,
  Search,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Dashboard } from './components/admin/Dashboard';
import { ReviewQueue } from './components/admin/ReviewQueue';
import { CityConfigPage } from './components/admin/CityConfig';
import { ImportModule } from './components/admin/ImportModule';
import { ExportModule } from './components/admin/ExportModule';
import { IRAQ_CITIES } from './constants';
import { DiscoveryRunState } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataRefreshToken, setDataRefreshToken] = useState(0);

  const initialRunState: DiscoveryRunState = useMemo(() => ({
    city: IRAQ_CITIES[0].name,
    district: IRAQ_CITIES[0].districts[0].name,
    zone: IRAQ_CITIES[0].districts[0].central_zones[0],
    category: 'Restaurant',
    sources: ['osm']
  }), []);

  const [runState, setRunState] = useState<DiscoveryRunState>(initialRunState);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Dashboard refreshToken={dataRefreshToken} />
          </motion.div>
        );
      case 'collection':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 h-full flex flex-col"
          >
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-zinc-900">Data Collection</h2>
                <p className="text-zinc-500 text-sm font-medium">Multi-source API and scraper management.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
              <SourceSelector
                selectedSources={runState.sources}
                onChange={(sources) => setRunState((prev) => ({ ...prev, sources }))}
              />
              <JobSetup
                runState={runState}
                onRunStateChange={setRunState}
                onRunSuccess={() => setDataRefreshToken((token) => token + 1)}
              />
            </div>
          </motion.div>
        );
      case 'review':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <ReviewQueue refreshToken={dataRefreshToken} />
          </motion.div>
        );
      case 'upload':
        return (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <ImportModule />
          </motion.div>
        );
      case 'export':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <ExportModule />
          </motion.div>
        );
      case 'zones':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <CityConfigPage />
          </motion.div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mb-6">
              <BarChart3 className="w-10 h-10 text-zinc-300" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Module Under Construction</h3>
            <p className="text-zinc-500 text-sm max-w-xs">The {activeTab} module is currently being optimized for Iraq city-center data structures.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-orange-100 selection:text-orange-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-600 transition-colors" />
              <input
                type="text"
                placeholder="Search records, jobs, or sources..."
                className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-8">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live Sync</span>
            </div>

            <button className="p-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border-2 border-white" />
            </button>

            <div className="h-10 w-[1px] bg-zinc-200 mx-2" />

            <button className="flex items-center gap-3 pl-1 pr-4 py-1 bg-white border border-zinc-200 rounded-2xl hover:bg-zinc-50 transition-all shadow-sm">
              <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold text-xs">SB</div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-zinc-900 leading-none mb-1">Safari Bo Safari</p>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Super Admin</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>

        <footer className="px-8 py-4 bg-white border-t border-zinc-200 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-zinc-300">Environment:</span>
              <span className="text-emerald-600">Production</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-300">Version:</span>
              <span className="text-zinc-600">v2.4.0-central</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-zinc-900 transition-colors">API Docs</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">Support</a>
            <a href="#" className="hover:text-zinc-900 transition-colors">System Logs</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
