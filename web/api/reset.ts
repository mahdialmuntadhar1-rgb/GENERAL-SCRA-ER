// Scraper Reset API - Safe data deletion with confirmation

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function handleResetRequest(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);

  // GET /api/scraper/reset-code - Get current confirmation code
  if (pathname === '/api/scraper/reset-code' && req.method === 'GET') {
    try {
      const { data, error } = await supabase.rpc('get_reset_confirmation_code');
      
      if (error) {
        return res.status(500).json({ error: 'Failed to get confirmation code', details: error.message });
      }
      
      return res.status(200).json({
        confirmationCode: data,
        warning: 'This code changes every minute. Use it immediately.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to get confirmation code',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // GET /api/scraper/counts - Get current record counts
  if (pathname === '/api/scraper/counts' && req.method === 'GET') {
    try {
      const { data, error } = await supabase.rpc('get_scraper_table_counts');
      
      if (error) {
        return res.status(500).json({ error: 'Failed to get counts', details: error.message });
      }
      
      const counts: Record<string, number> = {};
      if (data) {
        for (const row of data) {
          counts[row.table_name] = row.record_count;
        }
      }
      
      return res.status(200).json({
        counts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to get counts',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // POST /api/scraper/reset - Execute reset with confirmation
  if (pathname === '/api/scraper/reset' && req.method === 'POST') {
    const { confirmationCode, reason, includeProduction } = req.body || {};
    
    if (!confirmationCode) {
      return res.status(400).json({ 
        error: 'Confirmation code required',
        help: 'First call GET /api/scraper/reset-code to get the current code'
      });
    }
    
    try {
      const resetReason = includeProduction 
        ? `${reason || 'User requested'} - include production`
        : (reason || 'User requested reset');
      
      const { data, error } = await supabase.rpc('reset_scraper_data', {
        confirmation_code: confirmationCode,
        reason: resetReason
      });
      
      if (error) {
        return res.status(500).json({ error: 'Reset failed', details: error.message });
      }
      
      if (!data.success) {
        return res.status(400).json(data);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Scraper data has been reset',
        details: data,
        warning: 'You must refresh the page to see empty tables'
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Reset failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return res.status(404).json({ error: 'Reset endpoint not found' });
}
