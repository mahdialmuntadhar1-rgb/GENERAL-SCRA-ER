import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Filter,
  Search,
  Phone,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useBusinesses } from '../hooks/useBusinessData';
import { supabase } from '../lib/supabase';

interface MadinatyProps {
  onViewBusiness: (id: string) => void;
}

// Fetch unique governorates from database
function useGovernorates() {
  const [governorates, setGovernorates] = useState([{ id: 'all', name: 'All Governorates' }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data, error } = await supabase
          .from('businesses_staging')
          .select('governorate')
          .not('governorate', 'is', null);
        
        if (error) throw error;
        
        const unique = [...new Set(data?.map(b => b.governorate).filter(Boolean))];
        const mapped = unique.map(g => ({ id: g.toLowerCase().replace(/\s+/g, '-'), name: g }));
        setGovernorates([{ id: 'all', name: 'All Governorates' }, ...mapped]);
      } catch (e) {
        console.error('Failed to load governorates:', e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  return { governorates, loading };
}

export function Madinaty({ onViewBusiness }: MadinatyProps) {
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 12;

  // Fetch filter options from database
  const { governorates, loading: govLoading } = useGovernorates();

  // Fetch real businesses with filters (category removed for launch)
  const { businesses, totalCount, loading, error } = useBusinesses({
    governorate: selectedGovernorate === 'all' ? undefined : selectedGovernorate,
    search: searchQuery || undefined,
    page: currentPage,
    pageSize,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGovernorate, searchQuery]);

  // Check if any filters are active
  const hasActiveFilters = selectedGovernorate !== 'all' || searchQuery;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Madinaty</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'Loading...' : `${totalCount.toLocaleString()} businesses found`}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800">Failed to load businesses</p>
            <p className="text-xs text-amber-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
        {/* Search & Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search businesses, categories, or cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-emerald-500 text-white text-xs rounded-full flex items-center justify-center">
                {[selectedGovernorate].filter(v => v !== 'all').length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Expandable Filters */}
        {(showFilters || hasActiveFilters) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 gap-3 pt-3 border-t border-slate-100"
          >
            {/* Governorate Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Governorate</label>
              {govLoading ? (
                <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <select
                  value={selectedGovernorate}
                  onChange={(e) => setSelectedGovernorate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {governorates.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedGovernorate('all');
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Active Filter Pills */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedGovernorate !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                {governorates.find(g => g.id === selectedGovernorate)?.name || selectedGovernorate}
                <button onClick={() => setSelectedGovernorate('all')} className="hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4" />
              <div className="h-3 bg-slate-200 rounded w-full mb-2" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && businesses.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No businesses found</h3>
          <p className="text-sm text-slate-500 mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your filters or search query'
              : 'No businesses in the database yet. Start collecting data to see results here.'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSelectedGovernorate('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Business Grid */}
      {!loading && !error && businesses.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((business, index) => (
              <BusinessCard 
                key={business.id} 
                business={business} 
                index={index}
                onClick={() => onViewBusiness(business.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BusinessCard({ business, index, onClick }: { 
  business: {
    id: string;
    name: string;
    category: string;
    governorate: string;
    city: string;
    phone?: string;
    status: string;
  };
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Card Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
              {business.name}
            </h3>
          </div>
          <StatusBadge status={business.status} />
        </div>
        
        <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{business.city}, {business.governorate}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
            {business.category}
          </span>
        </div>

        {/* Contact Info */}
        {business.phone && (
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5" />
              <span>{business.phone}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    'verified': { color: 'bg-emerald-100 text-emerald-700', label: 'Verified' },
    'pending_review': { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    'approved': { color: 'bg-blue-100 text-blue-700', label: 'Approved' },
    'rejected': { color: 'bg-rose-100 text-rose-700', label: 'Rejected' },
    'new': { color: 'bg-slate-100 text-slate-700', label: 'New' },
  };

  const { color, label } = config[status] || config['new'];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${color}`}>
      {label}
    </span>
  );
}
