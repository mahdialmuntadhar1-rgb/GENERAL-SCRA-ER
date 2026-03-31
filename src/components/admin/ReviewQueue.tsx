import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Edit3, 
  ExternalLink, 
  MapPin, 
  Phone, 
  Globe,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
  Download
} from 'lucide-react';
import { Business, BusinessStatus } from '../../types';
import { triggerDownload, jsonToCsv } from '../../lib/download';

const mockBusinesses: Partial<Business>[] = [
  {
    id: '1',
    name: 'Al-Mansour Grand Hotel',
    local_name: 'فندق المنصور غراند',
    city: 'Baghdad',
    district: 'Mansour',
    city_center_zone: 'Central Baghdad',
    category: 'Hotel',
    phone: '+964 770 123 4567',
    status: 'pending_review',
    completeness_score: 85,
    verification_score: 92,
    publish_readiness_score: 88,
    coverage_type: 'central_only',
    source: 'gemini'
  },
  {
    id: '2',
    name: 'Erbil Tech Hub',
    local_name: 'مركز أربيل التقني',
    city: 'Erbil',
    district: 'Ankawa',
    city_center_zone: 'Central Erbil',
    category: 'Tech Company',
    phone: '+964 750 987 6543',
    status: 'needs_cleaning',
    completeness_score: 45,
    verification_score: 60,
    publish_readiness_score: 50,
    coverage_type: 'central_only',
    source: 'web_directory'
  },
  {
    id: '3',
    name: 'Basra Fish Market',
    local_name: 'سوق السمك في البصرة',
    city: 'Basra',
    district: 'Ashar',
    city_center_zone: 'Central Basra',
    category: 'Supermarket',
    phone: '+964 780 555 4444',
    status: 'outside_central_coverage',
    completeness_score: 70,
    verification_score: 40,
    publish_readiness_score: 30,
    coverage_type: 'suburb',
    source: 'manual_upload'
  },
  {
    id: '4',
    name: 'Suly Cafe',
    local_name: 'سولي كافيه',
    city: 'Sulaymaniyah',
    district: 'Salim St',
    city_center_zone: 'Central Sulaymaniyah',
    category: 'Cafe',
    phone: '+964 771 222 3333',
    status: 'verified',
    completeness_score: 95,
    verification_score: 98,
    publish_readiness_score: 96,
    coverage_type: 'central_only',
    source: 'gemini'
  }
];

const statusConfig: Record<BusinessStatus, { label: string, color: string, icon: any }> = {
  pending_review: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  needs_cleaning: { label: 'Needs Cleaning', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
  needs_verification: { label: 'Needs Verification', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Eye },
  verified: { label: 'Verified', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  export_ready: { label: 'Export Ready', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CheckSquare },
  outside_central_coverage: { label: 'Outside Central', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: MapPin },
  claimed_verified: { label: 'Claimed', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: ShieldCheck },
  registry_verified: { label: 'Registry', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Award },
  high_confidence_match: { label: 'High Confidence', color: 'bg-lime-100 text-lime-700 border-lime-200', icon: Sparkles },
};

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function ReviewQueue() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterCity, setFilterCity] = useState('All');
  const [viewingRecord, setViewingRecord] = useState<Partial<Business> | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const handleBulkAction = (action: string) => {
    setShowSuccess(`Bulk ${action} applied to ${selectedIds.length} records!`);
    setSelectedIds([]);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const handleRecordAction = (id: string, action: string) => {
    setShowSuccess(`Record ${id} ${action}ed successfully!`);
    setViewingRecord(null);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === mockBusinesses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mockBusinesses.map(b => b.id!));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="relative min-h-[calc(100vh-12rem)]">
      <div className={`space-y-6 transition-all duration-300 ${viewingRecord ? 'pr-[400px]' : ''}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Review Queue</h2>
            <p className="text-zinc-500 text-sm">Verify and clean business records for the central directory.</p>
          </div>
          <div className="flex items-center gap-2">
            {showSuccess && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4" /> {showSuccess}
              </div>
            )}
            <button 
              onClick={() => {
                triggerDownload(jsonToCsv(mockBusinesses), 'full_review_queue.csv', 'text/csv');
              }}
              className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download All
            </button>
            <div className="flex bg-white border border-zinc-200 p-1 rounded-xl shadow-sm">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={() => handleBulkAction('process')}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              Bulk Actions ({selectedIds.length})
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-zinc-200 p-4 rounded-2xl shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by name, phone, or district..." 
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            <select 
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none"
            >
              <option>All Cities</option>
              <option>Baghdad</option>
              <option>Erbil</option>
              <option>Basra</option>
              <option>Sulaymaniyah</option>
            </select>
            <select className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none">
              <option>All Statuses</option>
              <option>Pending Review</option>
              <option>Needs Cleaning</option>
              <option>Verified</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                      {selectedIds.length === mockBusinesses.length ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Business Details</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Location</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">QC Scores</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {mockBusinesses.map((biz) => (
                  <tr 
                    key={biz.id} 
                    onClick={() => setViewingRecord(biz)}
                    className={`cursor-pointer hover:bg-zinc-50 transition-colors ${selectedIds.includes(biz.id!) ? 'bg-orange-50/30' : ''} ${viewingRecord?.id === biz.id ? 'bg-zinc-50 ring-1 ring-inset ring-zinc-200' : ''}`}
                  >
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(biz.id!)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                        {selectedIds.includes(biz.id!) ? <CheckSquare className="w-5 h-5 text-orange-600" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{biz.name}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-400" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="bg-zinc-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">{biz.category}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {biz.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                          {biz.city}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {biz.district} • <span className="text-orange-600 font-medium">{biz.city_center_zone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className={`text-xs font-bold ${getScoreColor(biz.completeness_score!)}`}>{biz.completeness_score}%</p>
                          <p className="text-[8px] text-zinc-400 uppercase font-bold">Comp.</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-bold ${getScoreColor(biz.verification_score!)}`}>{biz.verification_score}%</p>
                          <p className="text-[8px] text-zinc-400 uppercase font-bold">Verif.</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-bold ${getScoreColor(biz.publish_readiness_score!)}`}>{biz.publish_readiness_score}%</p>
                          <p className="text-[8px] text-zinc-400 uppercase font-bold">Ready</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusConfig[biz.status!].color}`}>
                        {React.createElement(statusConfig[biz.status!].icon, { className: "w-3 h-3" })}
                        {statusConfig[biz.status!].label}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-900 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Detail Side Panel */}
      {viewingRecord && (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-white border-l border-zinc-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
            <div>
              <h3 className="font-bold text-lg">Record Details</h3>
              <p className="text-xs text-zinc-500">ID: {viewingRecord.id}</p>
            </div>
            <button 
              onClick={() => setViewingRecord(null)}
              className="p-2 hover:bg-zinc-200 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Business Information</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500">Name (English)</label>
                  <input type="text" defaultValue={viewingRecord.name} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500">Name (Arabic)</label>
                  <input type="text" dir="rtl" defaultValue={viewingRecord.local_name} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium font-arabic" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">Category</label>
                    <input type="text" defaultValue={viewingRecord.category} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">Phone</label>
                    <input type="text" defaultValue={viewingRecord.phone} className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Location & Coverage</h4>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-bold text-orange-900">{viewingRecord.city}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-orange-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {viewingRecord.coverage_type === 'central_only' ? 'Central' : 'Suburb'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-orange-400 uppercase">District</p>
                    <p className="text-sm font-bold text-orange-900">{viewingRecord.district}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-orange-400 uppercase">Zone</p>
                    <p className="text-sm font-bold text-orange-900">{viewingRecord.city_center_zone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Quality Control Notes</h4>
              <div className="space-y-3">
                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Phone number format looks valid but has not been verified via call.
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Map link matches the provided address perfectly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-zinc-100 bg-zinc-50 grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleRecordAction(viewingRecord.id!, 'reject')}
              className="px-4 py-3 bg-white border border-zinc-200 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all"
            >
              Reject Record
            </button>
            <button 
              onClick={() => handleRecordAction(viewingRecord.id!, 'approv')}
              className="px-4 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg"
            >
              Verify & Approve
            </button>
          </div>
        </div>
      )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
          <p className="text-xs text-zinc-500 font-medium">
            Showing <span className="text-zinc-900 font-bold">1-4</span> of <span className="text-zinc-900 font-bold">1,205</span> records
          </p>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Bulk Actions Bar (Floating) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-8 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 pr-8 border-r border-zinc-800">
            <div className="bg-orange-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
              {selectedIds.length}
            </div>
            <p className="text-sm font-bold">Selected Records</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const selectedData = mockBusinesses.filter(b => selectedIds.includes(b.id!));
                const csv = jsonToCsv(selectedData);
                triggerDownload(csv, 'selected_records.csv', 'text/csv');
              }}
              className="flex items-center gap-2 text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button 
              onClick={() => handleBulkAction('approve')}
              className="flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button 
              onClick={() => handleBulkAction('reject')}
              className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              className="flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
          <button 
            onClick={() => setSelectedIds([])}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      )}
    </div>
  );
}
