// Health Check API - System status monitoring

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function handleHealthRequest(req: VercelRequest, res: VercelResponse) {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Check Supabase connection
  try {
    const start = Date.now();
    const { error } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .limit(1);
    
    const latency = Date.now() - start;
    
    if (error) {
      checks.supabase = { status: 'error', message: error.message };
      overallStatus = 'unhealthy';
    } else {
      checks.supabase = { status: 'ok', message: `Latency: ${latency}ms` };
    }
  } catch (error) {
    checks.supabase = { 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Connection failed' 
    };
    overallStatus = 'unhealthy';
  }
  
  // Check environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    checks.environment = { 
      status: 'error', 
      message: `Missing: ${missingVars.join(', ')}` 
    };
    overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
  } else {
    checks.environment = { status: 'ok' };
  }
  
  // Optional API keys
  const optionalVars = [
    'ANTHROPIC_API_KEY',
    'GOOGLE_PLACES_API_KEY'
  ];
  
  const optionalConfigured = optionalVars.filter(v => process.env[v]);
  checks.apis = { 
    status: 'ok', 
    message: `${optionalConfigured.length}/${optionalVars.length} optional APIs configured` 
  };
  
  // Response
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
  
  return res.status(statusCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    checks
  });
}
