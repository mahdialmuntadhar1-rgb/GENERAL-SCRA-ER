import React from 'react';
import { 
  BarChart3, 
  Upload, 
  CheckCircle, 
  Download, 
  Settings, 
  Building2,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';

export type PageType = 'dashboard' | 'import' | 'review' | 'export' | 'settings';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'import', label: 'Import Data', icon: Upload },
    { id: 'review', label: 'Review Queue', icon: CheckCircle },
    { id: 'export', label: 'Export Module', icon: Download },
    { id: 'settings', label: 'City Config', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-white transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-zinc-800">
            <div className="bg-orange-600 p-1.5 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Iraq Business</h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Admin Ops</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  currentPage === item.id 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-orange-500' : ''}`} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <div className="bg-zinc-800/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xs">
                SB
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">Safari Bo Safari</p>
                <p className="text-[10px] text-zinc-500 truncate">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 hover:bg-zinc-100 rounded-lg"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-100">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>City Center Coverage: Active</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
