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
      
      // Fetch all businesses for aggregation (in production, use a materialized view or RPC)
      const { data: allBusinesses, error: fetchError } = await supabase
        .from('businesses')
        .select('data_quality, isVerified, city, governorate');
      
      if (fetchError) throw fetchError;
      
      // Calculate aggregates manually
      const qualityCounts: Record<string, number> = {};
      let verifiedCount = 0;
      const uniqueCities = new Set<string>();
      const uniqueGovernorates = new Set<string>();
      
      allBusinesses?.forEach((row: any) => {
        // Quality counts
        const quality = row.data_quality || 'unknown';
        qualityCounts[quality] = (qualityCounts[quality] || 0) + 1;
        
        // Verified count
        if (row.isVerified) verifiedCount++;
        
        // Cities and governorates
        if (row.city) uniqueCities.add(row.city);
        if (row.governorate) uniqueGovernorates.add(row.governorate);
      });
      
      return res.status(200).json({
        total_count: totalCount || 0,
        real_count: qualityCounts['real'] || 0,
        partial_count: qualityCounts['partial'] || 0,
        osm_count: qualityCounts['osm'] || 0,
        rejected_count: qualityCounts['rejected'] || 0,
        verified_count: verifiedCount,
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
      const { data: allBusinesses, error } = await supabase
        .from('businesses')
        .select('data_quality');
      
      if (error) throw error;
      
      const qualityCounts: Record<string, number> = {};
      allBusinesses?.forEach((row: any) => {
        const quality = row.data_quality || 'unknown';
        qualityCounts[quality] = (qualityCounts[quality] || 0) + 1;
      });
      
      const breakdown = Object.entries(qualityCounts).map(([data_quality, count]) => ({
        data_quality,
        count
      }));
      
      return res.status(200).json({
        breakdown,
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
      const { data: allBusinesses, error } = await supabase
        .from('businesses')
        .select('category');
      
      if (error) throw error;
      
      const categoryCounts: Record<string, number> = {};
      allBusinesses?.forEach((row: any) => {
        const category = row.category || 'uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
      
      const categories = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count
      }));
      
      return res.status(200).json({
        categories,
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
