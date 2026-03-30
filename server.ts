import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { runDiscovery } from "./src/server/discovery";
import { supabase } from "./src/server/supabase";
import { PROVIDERS } from "./src/server/pipeline/config/providers";
import { CENTRAL_CITY_ALLOWLIST } from "./src/server/pipeline/config/centralZones";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get('/api/providers', (req, res) => {
    res.json({ providers: PROVIDERS });
  });

  app.get('/api/cities/central-zones', (req, res) => {
    res.json({ allowlist: CENTRAL_CITY_ALLOWLIST });
  });

  app.post("/api/run", async (req, res) => {
    try {
      const result = await runDiscovery(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/import', async (req, res) => {
    try {
      const result = await runDiscovery(req.body);
      res.json({
        message: 'Import processed through unified source pipeline.',
        importExportReport: result.importExportReport,
        records: result.records,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/export', async (req, res) => {
    try {
      const { format = 'json', records = [] } = req.body;
      res.json({
        format,
        exported_count: records.length,
        exported_at: new Date().toISOString(),
        data: records,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/businesses", async (req, res) => {
    try {
      const { city, category, source, page = 1, pageSize = 20 } = req.query;

      let query = supabase
        .from('businesses')
        .select('*', { count: 'exact' });

      if (city) query = query.eq('city', city);
      if (category) query = query.eq('category', category);
      if (source) query = query.eq('source', source);

      const from = (Number(page) - 1) * Number(pageSize);
      const to = from + Number(pageSize) - 1;

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

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

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
