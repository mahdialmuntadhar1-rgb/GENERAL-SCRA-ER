// Vercel Serverless API Entry Point
// Routes all /api/* requests to appropriate handlers

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleScraperRequest } from './scraper';
import { handlePipelineRequest } from './pipeline';
import { handleStatsRequest } from './stats';
import { handleHealthRequest } from './health';
import { handleAuthRequest } from './auth';

// CORS headers for all API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);
  
  try {
    // Route to appropriate handler
    if (pathname.startsWith('/api/scraper')) {
      return await handleScraperRequest(req, res);
    }
    
    if (pathname.startsWith('/api/pipeline')) {
      return await handlePipelineRequest(req, res);
    }
    
    if (pathname.startsWith('/api/stats')) {
      return await handleStatsRequest(req, res);
    }
    
    if (pathname.startsWith('/api/health')) {
      return await handleHealthRequest(req, res);
    }
    
    if (pathname.startsWith('/api/auth')) {
      return await handleAuthRequest(req, res);
    }
    
    // Default: 404
    return res.status(404).json({ 
      error: 'Not found',
      availableEndpoints: [
        '/api/scraper',
        '/api/pipeline',
        '/api/stats',
        '/api/health',
        '/api/auth'
      ]
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
