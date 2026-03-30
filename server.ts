import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { runDiscovery } from './src/server/discovery';
import { supabase } from './src/server/supabase';
import { runImport } from './src/server/pipeline/importPipeline';
import { exportBusinesses, exportDataQualityReports } from './src/server/services/exportService';
import { updateBusinessStatus } from './src/server/services/qcService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'city-first' });
  });

  app.post('/api/run', async (req, res) => {
    try {
      const result = await runDiscovery(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/import', async (req, res) => {
    try {
      const result = await runImport(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/qc/status', async (req, res) => {
    try {
      const result = await updateBusinessStatus(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/export', async (req, res) => {
    try {
      const payload = {
        city: req.query.city as string | undefined,
        category: req.query.category as string | undefined,
        status: req.query.status as any,
        source_name: req.query.source_name as string | undefined,
        source_type: req.query.source_type as string | undefined,
        verifiedOnly: req.query.verifiedOnly === 'true',
        exportReadyOnly: req.query.exportReadyOnly === 'true',
        includeRejected: req.query.includeRejected === 'true',
        format: (req.query.format as 'csv' | 'xlsx' | 'json') || 'json'
      };

      const exported = await exportBusinesses(payload);
      res.setHeader('Content-Type', exported.contentType);
      res.send(exported.body);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/export/reports', async (_req, res) => {
    try {
      const report = await exportDataQualityReports();
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/businesses', async (req, res) => {
    try {
      const {
        city,
        category,
        source_name,
        status,
        coverage_type,
        page = 1,
        pageSize = 20
      } = req.query;

      let query = supabase.from('businesses').select('*', { count: 'exact' });

      if (city) query = query.eq('city', city);
      if (category) query = query.eq('category', category);
      if (source_name) query = query.eq('source_name', source_name);
      if (status) query = query.eq('status', status);
      if (coverage_type) query = query.eq('coverage_type', coverage_type);

      const from = (Number(page) - 1) * Number(pageSize);
      const to = from + Number(pageSize) - 1;

      const { data, count, error } = await query.order('updated_at', { ascending: false }).range(from, to);

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
