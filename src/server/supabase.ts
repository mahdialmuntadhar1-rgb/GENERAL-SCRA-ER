import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

// Only create the client if we have real credentials, otherwise it might throw or behave unexpectedly
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Log a warning if credentials are missing
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase credentials missing. Database operations will fail or use placeholders.");
}
