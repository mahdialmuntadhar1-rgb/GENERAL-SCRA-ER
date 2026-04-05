// Stats API - Real-time statistics aggregation

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SCRAPER_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SCRAPER_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function handleStatsRequest(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // GET /api/stats - Get comprehensive stats
  if (pathname === '/api/stats' && req.method === 'GET') {
    try {
      // Total count
      const { count: totalCount, error: countError } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw countError;
      
      // Count by data_quality
      const { data: qualityData, error: qualityError } = await supabase
        .from('businesses')
        .select('data_quality, count')
        .group('data_quality');
      
      if (qualityError) throw qualityError;
      
      // Verified count
      const { count: verifiedCount, error: verifiedError } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .eq('isVerified', true);
      
      if (verifiedError) throw verifiedError;
      
      // Cities covered
      const { data: citiesData, error: citiesError } = await supabase
        .from('businesses')
        .select('city, governorate', { count: 'exact' });
      
      if (citiesError) throw citiesError;
      
      const uniqueCities = new Set(citiesData?.map(r => r.city).filter(Boolean));
      const uniqueGovernorates = new Set(citiesData?.map(r => r.governorate).filter(Boolean));
      
      // Calculate quality breakdown
      const qualityCounts: Record<string, number> = {};
      qualityData?.forEach(row => {
        qualityCounts[row.data_quality || 'unknown'] = parseInt(row.count);
      });
      
      return res.status(200).json({
        total_count: totalCount || 0,
        real_count: qualityCounts['real'] || 0,
        partial_count: qualityCounts['partial'] || 0,
        osm_count: qualityCounts['osm'] || 0,
        rejected_count: qualityCounts['rejected'] || 0,
        verified_count: verifiedCount || 0,
        cities_covered: uniqueCities.size,
        governorates_covered: uniqueGovernorates.size,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Stats error:', error);
      return res.status(500).json({
        error: 'Failed to fetch stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // GET /api/stats/quality - Quality breakdown
  if (pathname === '/api/stats/quality' && req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('data_quality, count')
        .group('data_quality');
      
      if (error) throw error;
      
      return res.status(200).json({
        breakdown: data || [],
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch quality stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // GET /api/stats/categories - Category distribution
  if (pathname === '/api/stats/categories' && req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('category, count')
        .group('category');
      
      if (error) throw error;
      
      return res.status(200).json({
        categories: data || [],
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch category stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return res.status(404).json({ error: 'Stats endpoint not found' });
}
