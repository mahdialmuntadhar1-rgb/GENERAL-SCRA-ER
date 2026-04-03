// Auth API - Authentication endpoints
// Uses Supabase Auth

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Use ANON key for auth operations, NOT service role key
const supabaseUrl = process.env.SCRAPER_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SCRAPER_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';  // Use anon key for auth

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function handleAuthRequest(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // POST /api/auth/login - Login with email/password
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return res.status(200).json({
        user: data.user,
        session: data.session
      });
      
    } catch (error) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // POST /api/auth/register - Register new user
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      return res.status(201).json({
        user: data.user,
        message: 'Check your email to confirm registration'
      });
      
    } catch (error) {
      return res.status(400).json({
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // POST /api/auth/logout - Logout
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    try {
      // Create a client with the user's token to sign them out
      const token = authHeader.replace('Bearer ', '');
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      
      const { error } = await userClient.auth.signOut();
      
      if (error) throw error;
      
      return res.status(200).json({ message: 'Logged out' });
      
    } catch (error) {
      return res.status(500).json({
        error: 'Logout failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // GET /api/auth/session - Get current session
  if (pathname === '/api/auth/session' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    try {
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      
      if (error) throw error;
      
      return res.status(200).json({ user });
      
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  return res.status(404).json({ error: 'Auth endpoint not found' });
}

// Middleware helper to verify auth on protected routes
export async function verifyAuth(req: VercelRequest): Promise<{ user: any | null; error: string | null }> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return { user: null, error: 'No authorization header' };
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    // Use service role only for verifying sessions on protected routes
    const serviceKey = process.env.SCRAPER_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const adminClient = createClient(supabaseUrl, serviceKey);
    
    const { data: { user }, error } = await adminClient.auth.getUser(token);
    
    if (error) throw error;
    
    return { user, error: null };
    
  } catch (error) {
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Invalid token' 
    };
  }
}
