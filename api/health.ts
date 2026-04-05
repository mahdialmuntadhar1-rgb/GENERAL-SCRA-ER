import { createClient } from '@supabase/supabase-js';

// Simple health check endpoint
export default async function handler(req: any, res: any) {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabase: supabaseUrl && supabaseKey ? "configured" : "missing_env_vars",
    path: req.url
  });
}
