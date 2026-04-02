import { useState, useRef } from "react";
import { useReviewStore } from "@/stores";
import { getBusinesses, type Business } from "@/lib/supabase";
import { toast } from "sonner";
import { Download, FileSpreadsheet, FileJson } from "lucide-react";

export function ImportExport() {
  const { stageBusinesses } = useReviewStore();
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      toast.error("CSV file is empty or invalid");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const businesses: Partial<Business>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      if (row.name) {
        businesses.push({
          name: row.name,
          name_en: row.name_en || row.name_english,
          phone: row.phone || row.telephone,
          website: row.website || row.url,
          email: row.email,
          address: row.address,
          city: row.city || "Unknown",
          governorate: row.governorate || row.gov || "Unknown",
          country: "Iraq",
          category: row.category || "uncategorized",
          source: "csv_import",
          data_quality: "partial",
          verified: false,
          _status: "needs_review",
        });
      }
    }

    if (businesses.length > 0) {
      stageBusinesses(businesses as Business[]);
      toast.success(`Imported ${businesses.length} businesses to review queue`);
    } else {
      toast.error("No valid businesses found in CSV");
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const records = Array.isArray(data) ? data : data.businesses || data.results || [data];

      const businesses: Partial<Business>[] = records
        .filter((r: Record<string, unknown>) => r.name)
        .map((r: Record<string, unknown>) => ({
          ...r,
          country: "Iraq",
          source: r.source || "json_import",
          data_quality: r.data_quality || "partial",
          verified: false,
          _status: "needs_review",
        }));

      if (businesses.length > 0) {
        stageBusinesses(businesses as Business[]);
        toast.success(`Imported ${businesses.length} businesses to review queue`);
      }
    } catch {
      toast.error("Invalid JSON file");
    }
  };

  const CSV_HEADERS = [
    "name", "name_en", "phone", "website", "email", "address",
    "city", "governorate", "category", "subcategory", "latitude",
    "longitude", "facebook", "instagram", "data_quality", "verified", "source",
  ];

  const downloadFile = (content: string, filename: string, type: string) => {
    // For CSV: Add UTF-8 BOM + proper encoding for Arabic/Kurdish text
    // The BOM (\uFEFF) tells Excel this is UTF-8 encoded
    const isCSV = type.includes("csv");
    const bom = isCSV ? "\uFEFF" : "";
    
    // Use explicit UTF-8 charset for proper Arabic/Kurdish support
    const mimeType = isCSV ? "text/csv;charset=utf-8" : `${type};charset=utf-8`;
    
    const blob = new Blob([bom + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    
    // Force download attributes for better encoding handling
    a.setAttribute("download", filename);
    a.style.display = "none";
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Escape CSV values properly - handles Arabic/Kurdish text and special characters
  const escapeCSV = (value: string): string => {
    const str = String(value ?? "");
    // If value contains comma, quote, newline, or Arabic/Kurdish characters, wrap in quotes
    const needsQuotes = str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r") || /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(str);
    
    if (!needsQuotes) return str;
    
    // Escape quotes by doubling them: " becomes ""
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  // Export from LOCAL staged review queue
  const handleExportLocalCSV = () => {
    const { stagedBusinesses } = useReviewStore.getState();
    if (stagedBusinesses.length === 0) {
      toast.error("No businesses in review queue to export");
      return;
    }
    const csvLines = [
      CSV_HEADERS.join(","),
      ...(stagedBusinesses as unknown as Record<string, unknown>[]).map((b: Record<string, unknown>) =>
        CSV_HEADERS.map((h) => escapeCSV(String(b[h] ?? ""))).join(",")
      ),
    ];
    downloadFile(csvLines.join("\n"), `iraq_businesses_local_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
    toast.success(`Exported ${stagedBusinesses.length} businesses from review queue`);
  };

  const handleExportLocalJSON = () => {
    const { stagedBusinesses } = useReviewStore.getState();
    if (stagedBusinesses.length === 0) {
      toast.error("No businesses in review queue to export");
      return;
    }
    downloadFile(JSON.stringify(stagedBusinesses, null, 2), `iraq_businesses_local_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
    toast.success(`Exported ${stagedBusinesses.length} businesses from review queue`);
  };

  // Export from SUPABASE
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await getBusinesses({ limit: 10000 });
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("No businesses in Supabase to export — try exporting from local queue instead");
        return;
      }

      const csvLines = [
        CSV_HEADERS.join(","),
        ...data.map((b: Record<string, unknown>) =>
          CSV_HEADERS.map((h) => escapeCSV(String(b[h] ?? ""))).join(",")
        ),
      ];

      downloadFile(csvLines.join("\n"), `iraq_businesses_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
      toast.success(`Exported ${data.length} businesses from Supabase`);
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const { data, error } = await getBusinesses({ limit: 10000 });
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("No businesses in Supabase to export — try exporting from local queue instead");
        return;
      }

      downloadFile(JSON.stringify(data, null, 2), `iraq_businesses_${new Date().toISOString().slice(0, 10)}.json`, "application/json");
      toast.success(`Exported ${data.length} businesses from Supabase`);
    } catch {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Import */}
      <section>
        <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4">
          Import Data
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="rounded-xl border-2 bg-card p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
            style={{ borderColor: "hsl(36 30% 82%)" }}
            onClick={() => {
              const inp = document.createElement("input");
              inp.type = "file";
              inp.accept = ".csv";
              inp.onchange = (e) => handleImportCSV(e as unknown as React.ChangeEvent<HTMLInputElement>);
              inp.click();
            }}
          >
            <FileSpreadsheet className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(36 55% 42%)" }} />
            <h4 className="font-semibold">Import CSV</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a CSV file with business data. Must have a &quot;name&quot; column.
            </p>
          </div>

          <div
            className="rounded-xl border-2 bg-card p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
            style={{ borderColor: "hsl(36 30% 82%)" }}
            onClick={() => {
              const inp = document.createElement("input");
              inp.type = "file";
              inp.accept = ".json";
              inp.onchange = (e) => handleImportJSON(e as unknown as React.ChangeEvent<HTMLInputElement>);
              inp.click();
            }}
          >
            <FileJson className="h-10 w-10 mx-auto mb-3" style={{ color: "hsl(36 55% 42%)" }} />
            <h4 className="font-semibold">Import JSON</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a JSON file (array of businesses or {`{ businesses: [...] }`})
            </p>
          </div>
        </div>
      </section>

      {/* Export from Local Queue */}
      <section>
        <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4">
          Export from Review Queue (Local)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportLocalCSV}
            className="rounded-xl border-2 bg-card p-6 text-left hover:bg-secondary/50 transition-colors"
            style={{ borderColor: "hsl(36 50% 65%)" }}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8" style={{ color: "hsl(36 55% 42%)" }} />
              <div>
                <h4 className="font-semibold">Export Local CSV</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download scraped businesses from review queue as CSV
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleExportLocalJSON}
            className="rounded-xl border-2 bg-card p-6 text-left hover:bg-secondary/50 transition-colors"
            style={{ borderColor: "hsl(36 50% 65%)" }}
          >
            <div className="flex items-center gap-3">
              <FileJson className="h-8 w-8" style={{ color: "hsl(36 55% 42%)" }} />
              <div>
                <h4 className="font-semibold">Export Local JSON</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download scraped businesses from review queue as JSON
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Export from Supabase */}
      <section>
        <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4">
          Export from Supabase (Database)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="rounded-xl border-2 bg-card p-6 text-left hover:bg-secondary/50 transition-colors disabled:opacity-50"
            style={{ borderColor: "hsl(36 30% 82%)" }}
          >
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8" style={{ color: "hsl(140 50% 40%)" }} />
              <div>
                <h4 className="font-semibold">Export DB CSV</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download all businesses from Supabase as CSV
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="rounded-xl border-2 bg-card p-6 text-left hover:bg-secondary/50 transition-colors disabled:opacity-50"
            style={{ borderColor: "hsl(36 30% 82%)" }}
          >
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8" style={{ color: "hsl(210 60% 45%)" }} />
              <div>
                <h4 className="font-semibold">Export DB JSON</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Download all businesses from Supabase as JSON
                </p>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Pipeline Info */}
      <div
        className="rounded-xl border-2 px-5 py-4"
        style={{ borderColor: "hsl(36 40% 78%)", background: "hsl(40 40% 95%)" }}
      >
        <p className="text-sm">
          <span className="font-bold" style={{ color: "hsl(36 50% 35%)" }}>Tip: </span>
          Imported data goes to the Review Queue. Use AI Clean to normalize phone numbers and
          detect duplicates before approving.
        </p>
      </div>
    </div>
  );
}
