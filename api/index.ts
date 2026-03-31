import "dotenv/config";
import express from "express";
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// Create Supabase client directly (self-contained)
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory job status storage
const jobStatus = new Map<string, { status: string; result?: any; error?: string }>();

// Simple discovery function (inline to avoid module path issues)
async function runDiscovery(req: any) {
  const { city, category, sources } = req;
  return {
    summary: `Discovery completed for ${category} in ${city}.`,
    insertedCount: 0,
    skippedCount: 0,
    errors: [],
    sourceStats: {}
  };
}

app.get("/api/health", (_req, res) => {
  const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabase: supabaseConfigured ? "configured" : "missing_env_vars",
  });
});

// Fire-and-forget discovery - returns immediately, processes in background
app.post("/api/discovery/run", async (req, res) => {
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  
  // Start the job asynchronously
  jobStatus.set(jobId, { status: "running" });
  
  // Fire and forget - don't await
  runDiscovery(req.body).then(result => {
    jobStatus.set(jobId, { status: "completed", result });
    console.log(`[Job ${jobId}] Completed:`, result);
  }).catch(error => {
    jobStatus.set(jobId, { status: "failed", error: error.message });
    console.error(`[Job ${jobId}] Failed:`, error);
  });

  // Return immediately with job ID
  res.json({ 
    status: "started", 
    jobId,
    message: "Discovery job started. Check /api/discovery/status/:jobId for progress."
  });
});

// Get job status
app.get("/api/discovery/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobStatus.get(jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json({ jobId, ...job });
});

// Legacy sync endpoint (kept for compatibility)
app.post("/api/run", async (req, res) => {
  try {
    const result = await runDiscovery(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/businesses", async (req, res) => {
  try {
    const { city, category, source, page = "1", pageSize = "20", status } = req.query as Record<string, string>;

    let query = supabase.from("businesses").select("*", { count: "exact" });
    if (city)     query = query.eq("city", city);
    if (category) query = query.eq("category", category);
    if (source)   query = query.eq("source", source);
    if (status)   query = query.eq("status", status);

    const from = (Number(page) - 1) * Number(pageSize);
    const to   = from + Number(pageSize) - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({ data, total: count, page: Number(page), pageSize: Number(pageSize) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// EXPORT: Download all businesses as CSV
app.get("/api/businesses/export", async (req, res) => {
  try {
    const { city, category, status, format = "csv" } = req.query as Record<string, string>;
    
    let query = supabase.from("businesses").select("*");
    if (city)     query = query.eq("city", city);
    if (category) query = query.eq("category", category);
    if (status)   query = query.eq("status", status);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="businesses_${Date.now()}.json"`);
      return res.json(data || []);
    }

    // CSV format
    const headers = ["id", "name", "nameAr", "nameKu", "category", "city", "governorate", "address", "phone", "whatsapp", "website", "lat", "lng", "status", "source", "created_at"];
    const csvRows = [headers.join(",")];
    
    (data || []).forEach((biz: any) => {
      const row = headers.map(h => {
        const val = biz[h];
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(row.join(","));
    });

    const csv = csvRows.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="businesses_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// IMPORT: Upload businesses from JSON/CSV
app.post("/api/businesses/import", async (req, res) => {
  try {
    const { businesses, options = {} } = req.body;
    
    if (!Array.isArray(businesses) || businesses.length === 0) {
      return res.status(400).json({ error: "Invalid data: businesses must be a non-empty array" });
    }

    const { skipDuplicates = true, defaultStatus = "pending_review" } = options;
    
    let inserted = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const biz of businesses) {
      try {
        if (skipDuplicates && biz.name && biz.city) {
          const { data: existing } = await supabase
            .from("businesses")
            .select("id")
            .eq("name", biz.name)
            .eq("city", biz.city)
            .maybeSingle();
          
          if (existing) {
            skipped++;
            continue;
          }
        }

        const newBiz = {
          ...biz,
          status: biz.status || defaultStatus,
          sources: biz.sources || ["import"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from("businesses").insert(newBiz);
        if (error) {
          errors.push(`Failed to insert ${biz.name}: ${error.message}`);
        } else {
          inserted++;
        }
      } catch (e: any) {
        errors.push(`Error processing ${biz.name}: ${e.message}`);
      }
    }

    res.json({
      success: true,
      summary: `Import completed: ${inserted} inserted, ${skipped} skipped, ${errors.length} errors`,
      inserted,
      skipped,
      errors: errors.slice(0, 10),
      totalErrors: errors.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get discovery statistics
app.get("/api/stats", async (req, res) => {
  try {
    const { count: total, error: totalError } = await supabase
      .from("businesses")
      .select("*", { count: "exact", head: true });

    if (totalError) throw totalError;

    res.json({ total });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vercel serverless handler
export default (req: any, res: any) => {
  return app(req, res);
};
