import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { runDiscovery } from './src/server/discovery';
import { supabase } from './src/server/supabase';
import { SOURCES } from './src/constants';
import { DiscoverySource } from './src/types';

const runSchema = z.object({
  city: z.string().min(1),
  category: z.string().min(1),
  sources: z.array(z.enum(['gemini', 'osm'])).min(1)
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/run', async (req, res) => {
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request payload',
        details: parsed.error.issues.map((issue) => issue.message).join(', ')
      });
    }

    const invalidSource = parsed.data.sources.find(
      (sourceId) => !SOURCES.some((source) => source.enabled && source.id === sourceId)
    );

    if (invalidSource) {
      return res.status(400).json({ error: `Source ${invalidSource} is not available` });
    }

    try {
      console.log(
        `[api/run] city=${parsed.data.city} category=${parsed.data.category} sources=${parsed.data.sources.join(',')}`
      );
      const result = await runDiscovery(parsed.data);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/businesses', async (req, res) => {
    try {
      const { city, category, source, search, page = 1, pageSize = 20 } = req.query;

      let query = supabase.from('businesses').select('*', { count: 'exact' });

      if (city) query = query.eq('city', city);
      if (category) query = query.eq('category', category);
      if (source) query = query.eq('source', source);

      if (search && typeof search === 'string') {
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,category.ilike.%${search}%`);
      }

      const from = (Number(page) - 1) * Number(pageSize);
      const to = from + Number(pageSize) - 1;

      const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

      if (error) throw error;

      res.json({
        data,
        total: count,
        page: Number(page),
        pageSize: Number(pageSize)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/dashboard-summary', async (_req, res) => {
    try {
      const { count: totalBusinesses, error: totalError } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      const { data: allRows, error: allRowsError } = await supabase
        .from('businesses')
        .select('id, city, source, created_at, name, category, status')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (allRowsError) throw allRowsError;

      const byCity: Record<string, number> = {};
      const bySource: Record<string, number> = {};
      const byStatus: Record<string, number> = {};

      for (const row of allRows || []) {
        byCity[row.city || 'Unknown'] = (byCity[row.city || 'Unknown'] || 0) + 1;
        bySource[row.source || 'Unknown'] = (bySource[row.source || 'Unknown'] || 0) + 1;
        byStatus[row.status || 'pending_review'] = (byStatus[row.status || 'pending_review'] || 0) + 1;
      }

      res.json({
        totalBusinesses: totalBusinesses || 0,
        byCity,
        bySource,
        byStatus,
        recent: (allRows || []).slice(0, 10)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/sources', (_req, res) => {
    const availableSources = SOURCES.filter((source) => source.enabled).map((source) => source.id as DiscoverySource);
    res.json({ sources: availableSources });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
