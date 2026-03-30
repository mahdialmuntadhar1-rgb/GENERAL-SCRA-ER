import React from 'react';
import { Search, List, Activity } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: 'run' | 'results';
  onPageChange: (page: 'run' | 'results') => void;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <nav className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Activity className="w-6 h-6 text-orange-600" />
            <span>Iraq City-First DataOps</span>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange('run')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentPage === 'run' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Run Discovery
            </button>
            <button
              onClick={() => onPageChange('results')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                currentPage === 'results' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <List className="w-4 h-4" />
              City-Center Records
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
