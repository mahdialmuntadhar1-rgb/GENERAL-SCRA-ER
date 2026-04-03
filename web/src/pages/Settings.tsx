import { useState } from "react";
import { useSettingsStore } from "@/stores";
import { supabase } from "@/lib/supabase";
import { IRAQ_GOVERNORATES } from "@/config/iraq";
import { toast } from "sonner";
import { Key, Database, MapPin, TestTube } from "lucide-react";

export function Settings() {
  const { apiKeys, scrapingConfig, setApiKey, updateScrapingConfig } = useSettingsStore();
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const handleTestSupabase = async () => {
    setTestStatus("testing");
    try {
      const { error } = await supabase.from("iraqi_businesses").select("id", { count: "exact", head: true });
      if (error) throw error;
      setTestStatus("success");
      toast.success("Supabase connection successful!");
    } catch (error) {
      setTestStatus("error");
      toast.error("Supabase connection failed");
    }
  };

  const handleSeedGovernorates = () => {
    const govs = Object.entries(IRAQ_GOVERNORATES).map(([name, data]) => ({
      name,
      name_ar: data.ar,
      country: "Iraq",
    }));
    
    // In a real app, you'd insert these into a governorates table
    console.log("Governorates to seed:", govs);
    toast.success(`Loaded ${govs.length} governorates`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your scraper and API keys</p>
      </div>

      {/* API Keys */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">API Keys</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Supabase URL</label>
            <input
              type="text"
              value={apiKeys.supabaseUrl || ""}
              onChange={(e) => setApiKey("supabaseUrl", e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Supabase Anon Key</label>
            <input
              type="password"
              value={apiKeys.supabaseKey || ""}
              onChange={(e) => setApiKey("supabaseKey", e.target.value)}
              placeholder="your-anon-key"
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Anthropic API Key (for AI cleaning)</label>
            <input
              type="password"
              value={apiKeys.anthropic || ""}
              onChange={(e) => setApiKey("anthropic", e.target.value)}
              placeholder="sk-ant-..."
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
            />
          </div>
        </div>
      </div>

      {/* Scraping Config */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Scraping Configuration</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Search Radius (meters)</label>
            <input
              type="number"
              value={scrapingConfig.radius}
              onChange={(e) => updateScrapingConfig({ radius: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: 10,000m (10km)
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Rate Limit (ms between requests)</label>
            <input
              type="number"
              value={scrapingConfig.rateLimit}
              onChange={(e) => updateScrapingConfig({ rateLimit: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Default: 1000ms (1 second)
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">Batch Size</label>
            <input
              type="number"
              value={scrapingConfig.batchSize}
              onChange={(e) => updateScrapingConfig({ batchSize: Number(e.target.value) })}
              className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Records per batch when pushing to Supabase
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TestTube className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Actions</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleTestSupabase}
            disabled={testStatus === "testing"}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <TestTube className="h-4 w-4" />
            {testStatus === "testing" ? "Testing..." : "Test Supabase Connection"}
          </button>
          <button
            onClick={handleSeedGovernorates}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            <MapPin className="h-4 w-4" />
            Load Governorates
          </button>
        </div>
        {testStatus === "success" && (
          <p className="mt-3 text-sm text-green-600">✓ Connection successful</p>
        )}
        {testStatus === "error" && (
          <p className="mt-3 text-sm text-red-600">✗ Connection failed</p>
        )}
      </div>

      {/* Clear Cache */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Clear App Cache</h2>
        <p className="text-sm text-muted-foreground mb-4">
          If you experience bugs or stale data, clear the local cache and reload. This removes all staged/scraped data from your browser.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("review-storage");
            localStorage.removeItem("scraper-storage");
            localStorage.removeItem("settings-storage");
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Clear Cache & Reload
        </button>
      </div>

      {/* About */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-2">About</h2>
        <p className="text-sm text-muted-foreground">
          Unified Iraq Business Directory Scraper v1.0
        </p>
        <p className="text-sm text-muted-foreground">
          GENERAL-SCRA-ER is the only active scraper dashboard/frontend repository
        </p>
      </div>
    </div>
  );
}
