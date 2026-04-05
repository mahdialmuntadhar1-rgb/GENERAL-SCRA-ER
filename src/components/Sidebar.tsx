import React from 'react';
import { 
  LayoutDashboard, 
  Database, 
  ClipboardCheck, 
  FileUp, 
  Download, 
  Settings, 
  ShieldCheck,
  BarChart3,
  Map,
  Users
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'collection', label: 'Data Collection', icon: Database },
    { id: 'review', label: 'Review Queue', icon: ClipboardCheck },
    { id: 'upload', label: 'File Import', icon: FileUp },
    { id: 'export', label: 'Export Center', icon: Download },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'zones', label: 'City Zones', icon: Map },
    { id: 'users', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-zinc-950 text-zinc-400 flex flex-col border-r border-zinc-800 sticky top-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm tracking-tight uppercase">Iraq Central</h1>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-800' 
                : 'hover:bg-zinc-900/50 hover:text-zinc-200'
            }`}
          >
            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-orange-500' : 'text-zinc-500'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">System Status</p>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-300 font-medium">All APIs Operational</span>
          </div>
          <div className="space-y-2">
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-orange-600 w-3/4" />
            </div>
            <p className="text-[10px] text-zinc-500">Daily Quota: 75% Used</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
