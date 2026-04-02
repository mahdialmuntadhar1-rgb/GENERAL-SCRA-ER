import { useScraperStore } from "@/stores";
import { ScrollText, Trash2 } from "lucide-react";

export function SystemLogs() {
  const { logs, reset } = useScraperStore();

  const handleClear = () => {
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
          System Logs
        </h3>
        <button
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border text-muted-foreground hover:bg-secondary"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>

      {/* Log Output */}
      <div
        className="rounded-xl border-2 overflow-hidden"
        style={{ borderColor: "hsl(36 30% 82%)" }}
      >
        <div className="bg-[#1a1a1a] text-green-400 font-mono text-xs p-4 min-h-[500px] max-h-[70vh] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-60 text-gray-500">
              <div className="text-center">
                <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No logs yet. Start scraping to see activity here.</p>
              </div>
            </div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="py-0.5 leading-relaxed">
                <span className="text-gray-500 select-none mr-3">
                  {String(i + 1).padStart(3, "0")}
                </span>
                <span
                  className={
                    log.includes("[ERROR]") || log.includes("Error")
                      ? "text-red-400"
                      : log.includes("[WARN]")
                      ? "text-yellow-400"
                      : log.includes("complete") || log.includes("success")
                      ? "text-emerald-400"
                      : "text-green-400"
                  }
                >
                  {log}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div
        className="rounded-xl border-2 px-5 py-4"
        style={{ borderColor: "hsl(36 40% 78%)", background: "hsl(40 40% 95%)" }}
      >
        <p className="text-sm">
          <span className="font-bold" style={{ color: "hsl(36 50% 35%)" }}>
            Logs:{" "}
          </span>
          All scraping activity, API calls, validation results, and errors are logged here.
          Logs persist across page navigations but are cleared on reset.
        </p>
      </div>
    </div>
  );
}
