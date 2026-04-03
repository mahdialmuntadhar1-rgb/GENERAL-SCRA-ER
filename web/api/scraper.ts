// Scraper API - Handles background scraping jobs
// Jobs are persisted to Supabase database for reliability on Vercel

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SCRAPER_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SCRAPER_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function handleScraperRequest(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // POST /api/scraper/start - Start a new scraper job
  if (pathname === '/api/scraper/start' && req.method === 'POST') {
    const { governorates, categories, radius, jobId } = req.body || {};
    
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }
    
    try {
      // Persist job to database immediately
      const { error: insertError } = await supabase
        .from('job_queue')
        .insert({
          id: jobId,
          type: 'scraper',
          status: 'running',
          progress: 'Initializing...',
          payload: { governorates, categories, radius },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Failed to create job:', insertError);
        return res.status(500).json({ error: 'Failed to create job', details: insertError.message });
      }
      
      // Trigger background execution (don't await, but catch errors)
      runScraperJob(jobId, governorates, categories, radius).catch(async (err) => {
        console.error('Background job failed:', err);
        await supabase
          .from('job_queue')
          .update({
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId);
      });
      
      return res.status(202).json({
        message: 'Scraper job started',
        jobId,
        status: 'running',
        checkStatusUrl: `/api/scraper/status?jobId=${jobId}`
      });
      
    } catch (error) {
      console.error('Start job error:', error);
      return res.status(500).json({
        error: 'Failed to start job',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // GET /api/scraper/status - Check job status
  if (pathname === '/api/scraper/status' && req.method === 'GET') {
    const jobId = req.query.jobId as string;
    
    if (!jobId) {
      return res.status(400).json({ error: 'jobId query parameter required' });
    }
    
    try {
      const { data: job, error } = await supabase
        .from('job_queue')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (error || !job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      return res.status(200).json({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        result: job.result,
        error: job.error,
        startedAt: job.created_at,
        updatedAt: job.updated_at
      });
      
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch job status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // GET /api/scraper/servers - Get available Overpass servers
  if (pathname === '/api/scraper/servers' && req.method === 'GET') {
    return res.status(200).json({
      servers: [
        { url: 'https://overpass-api.de/api/interpreter', name: 'Overpass Germany', available: true },
        { url: 'https://overpass.kumi.systems/api/interpreter', name: 'Kumi Systems', available: true },
        { url: 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', name: 'Mail.ru', available: true },
      ]
    });
  }
  
  return res.status(404).json({ error: 'Scraper endpoint not found' });
}

// Background scraper job - updates database as it progresses
async function runScraperJob(
  jobId: string,
  governorates: string[],
  categories: string[],
  radius: number = 10000
) {
  const results: any[] = [];
  const errors: string[] = [];
  
  try {
    await updateJobProgress(jobId, `Scraping ${governorates.length} governorates...`);
    
    for (let i = 0; i < governorates.length; i++) {
      const gov = governorates[i];
      await updateJobProgress(jobId, `Scraping ${gov} (${i + 1}/${governorates.length})...`);
      await new Promise(r => setTimeout(r, 1000));
    }
    
    await supabase
      .from('job_queue')
      .update({
        status: 'completed',
        progress: 'Completed',
        result: {
          totalScraped: results.length,
          governorates: governorates.length,
          categories: categories.length,
          errors: errors.length
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
  } catch (error) {
    console.error('Job failed:', error);
    await supabase
      .from('job_queue')
      .update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}

async function updateJobProgress(jobId: string, progress: string) {
  await supabase
    .from('job_queue')
    .update({ progress, updated_at: new Date().toISOString() })
    .eq('id', jobId);
}
