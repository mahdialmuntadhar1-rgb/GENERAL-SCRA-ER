import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Hook for dashboard stats (real Supabase data)
export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeCities: 0,
    categoriesCount: 0,
    verifiedCount: 0,
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get total count
        const { count: totalCount, error: totalError } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true });

        if (totalError) throw totalError;

        // Get distinct cities count
        const { data: citiesData, error: citiesError } = await supabase
          .from('businesses')
          .select('city')
          .not('city', 'is', null);

        if (citiesError) throw citiesError;

        const uniqueCities = new Set(citiesData?.map(b => b.city)).size;

        // Get distinct categories count
        const { data: catData, error: catError } = await supabase
          .from('businesses')
          .select('user_category')
          .not('user_category', 'is', null);

        if (catError) throw catError;

        const uniqueCats = new Set(catData?.map(b => b.user_category)).size;

        // Get verified count (status = 'verified' or quality_score > 80)
        const { count: verifiedCount, error: verifiedError } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true })
          .or('status.eq.verified,quality_score.gt.80');

        if (verifiedError) throw verifiedError;

        setStats({
          totalBusinesses: totalCount || 0,
          activeCities: uniqueCities,
          categoriesCount: uniqueCats,
          verifiedCount: verifiedCount || 0,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to load stats',
        }));
      }
    }

    fetchStats();
  }, []);

  return stats;
}

// Hook for top cities by business count
export function useTopCities(limit = 6) {
  const [cities, setCities] = useState([] as Array<{
    id: string;
    name: string;
    businessCount: number;
    topCategory: string;
  }>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCities() {
      try {
        // Get business counts by governorate
        const { data, error } = await supabase
          .from('businesses_staging')
          .select('governorate, user_category')
          .not('governorate', 'is', null);

        if (error) throw error;

        // Aggregate counts
        const cityStats: Record<string, { count: number; categories: Record<string, number> }> = {};
        
        data?.forEach(b => {
          const gov = b.governorate || 'Unknown';
          if (!cityStats[gov]) {
            cityStats[gov] = { count: 0, categories: {} };
          }
          cityStats[gov].count++;
          
          const cat = b.user_category || 'Uncategorized';
          cityStats[gov].categories[cat] = (cityStats[gov].categories[cat] || 0) + 1;
        });

        // Convert to array and find top category for each
        const cityArray = Object.entries(cityStats)
          .map(([name, stats]) => {
            const topCategory = Object.entries(stats.categories)
              .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Mixed';
            
            return {
              id: name.toLowerCase().replace(/\s+/g, '-'),
              name,
              businessCount: stats.count,
              topCategory,
            };
          })
          .sort((a, b) => b.businessCount - a.businessCount)
          .slice(0, limit);

        setCities(cityArray);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load cities');
        setLoading(false);
      }
    }

    fetchCities();
  }, [limit]);

  return { cities, loading, error };
}

// Hook for top categories
export function useTopCategories(limit = 8) {
  const [categories, setCategories] = useState([] as Array<{
    id: string;
    name: string;
    count: number;
  }>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from('businesses_staging')
          .select('user_category')
          .not('user_category', 'is', null);

        if (error) throw error;

        // Count occurrences
        const catCounts: Record<string, number> = {};
        data?.forEach(b => {
          const cat = b.user_category || 'Uncategorized';
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        });

        // Convert to array
        const catArray = Object.entries(catCounts)
          .map(([name, count]) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);

        setCategories(catArray);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load categories');
        setLoading(false);
      }
    }

    fetchCategories();
  }, [limit]);

  return { categories, loading, error };
}

// Hook for recent activity (newest businesses)
export function useRecentActivity(limit = 5) {
  const [activity, setActivity] = useState([] as Array<{
    id: string;
    name: string;
    category: string;
    city: string;
    governorate: string;
    status: string;
    createdAt: string;
  }>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('id, name, user_category, city, governorate, status, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        const formatted = data?.map(b => ({
          id: String(b.id),
          name: b.name || 'Unnamed',
          category: b.user_category || 'Uncategorized',
          city: b.city || 'Unknown',
          governorate: b.governorate || 'Unknown',
          status: b.status || 'pending_review',
          createdAt: b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Unknown',
        })) || [];

        setActivity(formatted);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load activity');
        setLoading(false);
      }
    }

    fetchActivity();
  }, [limit]);

  return { activity, loading, error };
}

// Hook for businesses with filters (used in Madinaty)
export function useBusinesses(filters?: {
  governorate?: string;
  city?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const [businesses, setBusinesses] = useState([] as Array<{
    id: string;
    name: string;
    category: string;
    governorate: string;
    city: string;
    phone?: string;
    status: string;
  }>);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true);
        
        let query = supabase
          .from('businesses_staging')
          .select('id, name, user_category, governorate, city, phone, status', { count: 'exact' });

        // Apply governorate filter only (categories removed for launch)
        if (filters?.governorate && filters.governorate !== 'all') {
          query = query.eq('governorate', filters.governorate);
        }
        if (filters?.city && filters.city !== 'all') {
          query = query.eq('city', filters.city);
        }
        // Note: Search temporarily disabled until text search is set up on staging table
        // if (filters?.search) {
        //   query = query.or(`name.ilike.%${filters.search}%,user_category.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
        // }

        // Pagination
        const page = filters?.page || 1;
        const pageSize = filters?.pageSize || 20;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, count, error } = await query;

        if (error) throw error;

        const formatted = data?.map(b => ({
          id: String(b.id),
          name: b.name || 'Unnamed',
          category: b.user_category || 'Uncategorized',
          governorate: b.governorate || 'Unknown',
          city: b.city || 'Unknown',
          phone: b.phone,
          status: b.status || 'pending_review',
        })) || [];

        setBusinesses(formatted);
        setTotalCount(count || 0);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load businesses');
        setLoading(false);
      }
    }

    fetchBusinesses();
  }, [filters?.governorate, filters?.city, filters?.search, filters?.page, filters?.pageSize]);

  return { businesses, totalCount, loading, error };
}

// Hook for single business details
export function useBusiness(id: string | null) {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchBusiness() {
      try {
        // Try businesses_staging first (more fields), fall back to businesses
        let { data, error } = await supabase
          .from('businesses_staging')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          // Fall back to main businesses table
          const result = await supabase
            .from('businesses')
            .select('*')
            .eq('id', id)
            .single();
          
          data = result.data;
          error = result.error;
        }

        if (error) throw error;

        // Calculate quality score if not present
        let quality = data.quality_score || 0;
        if (!quality && data) {
          let score = 0;
          let fields = 0;
          if (data.name) { score += 20; fields++; }
          if (data.phone) { score += 20; fields++; }
          if (data.city && data.governorate) { score += 20; fields++; }
          if (data.user_category || data.category) { score += 20; fields++; }
          if (data.website || data.facebook || data.instagram) { score += 20; fields++; }
          quality = fields > 0 ? score : 0;
        }

        setBusiness({
          ...data,
          calculatedQuality: quality,
        });
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load business');
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [id]);

  return { business, loading, error };
}
