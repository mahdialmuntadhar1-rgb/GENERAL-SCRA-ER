import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Search,
  ArrowRight,
  Loader2,
  FileCheck,
  XCircle,
  Copy,
  AlertTriangle
} from 'lucide-react';

export function ExportModule() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert('Export started! Your file will be ready in a few moments.');
    }, 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Export Module</h2>
          <p className="text-zinc-500 text-sm">Generate and download verified business data for production use.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>8,920 Verified Records Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm space-y-8">
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
                Export Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">City</label>
                  <select className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    <option>All Cities</option>
                    <option>Baghdad</option>
                    <option>Erbil</option>
                    <option>Basra</option>
                    <option>Sulaymaniyah</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Category</label>
                  <select className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    <option>All Categories</option>
                    <option>Restaurant</option>
                    <option>Hotel</option>
                    <option>Cafe</option>
                    <option>Tech Company</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</label>
                  <select className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                    <option>Verified Only</option>
                    <option>Export Ready Only</option>
                    <option>All Records</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date Range</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <select className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20">
                      <option>Last 30 Days</option>
                      <option>Last 90 Days</option>
                      <option>Custom Range</option>
                      <option>All Time</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Download className="w-4 h-4 text-zinc-400" />
                Export Format
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'csv', label: 'CSV', icon: FileText, desc: 'Best for spreadsheets' },
                  { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet, desc: 'Formatted data' },
                  { id: 'json', label: 'JSON', icon: FileJson, desc: 'Best for developers' },
                ].map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setExportFormat(format.id as any)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      exportFormat === format.id 
                        ? 'border-orange-500 bg-orange-50/50 ring-1 ring-orange-500' 
                        : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200'
                    }`}
                  >
                    <format.icon className={`w-6 h-6 mb-3 ${exportFormat === format.id ? 'text-orange-600' : 'text-zinc-400'}`} />
                    <p className="font-bold text-sm">{format.label}</p>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">{format.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 flex items-center justify-between">
              <div className="text-sm text-zinc-500">
                Estimated file size: <span className="font-bold text-zinc-900">4.2 MB</span>
              </div>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg flex items-center gap-3 disabled:bg-zinc-400"
              >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isExporting ? 'Generating File...' : 'Generate & Download'}
              </button>
            </div>
          </div>
        </div>

        {/* Reports & Audit */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-zinc-400" />
              Specialized Reports
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Rejected Records Report', icon: XCircle, color: 'text-red-600' },
                { label: 'Duplicate Suspects List', icon: Copy, color: 'text-amber-600' },
                { label: 'Incomplete Records Audit', icon: AlertTriangle, color: 'text-orange-600' },
                { label: 'Outside Central Coverage', icon: AlertCircle, color: 'text-rose-600' },
              ].map((report, i) => (
                <button key={i} className="w-full flex items-center justify-between p-4 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-all group">
                  <div className="flex items-center gap-3">
                    <report.icon className={`w-4 h-4 ${report.color}`} />
                    <span className="text-sm font-bold text-zinc-700">{report.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold mb-2">Export History</h3>
              <p className="text-xs text-zinc-400 mb-6">Track all data extractions for compliance and audit.</p>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between text-xs border-b border-zinc-800 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold">Verified_Businesses_Baghdad.xlsx</p>
                      <p className="text-zinc-500">24 Mar 2024 • 4,500 records</p>
                    </div>
                    <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-orange-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <Download className="w-32 h-32 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
