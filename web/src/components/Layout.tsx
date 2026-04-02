import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  Compass,
  Zap,
  CheckCircle2,
  Sparkles,
  ArrowUpDown,
  ScrollText,
  CircleDot,
  Settings,
  Download,
} from 'lucide-react'
import { useReviewStore, useScraperStore } from '@/stores'
import { toast } from 'sonner'

const navItems = [
  { path: '/', label: 'Overview', icon: CircleDot, indicator: 'overview' },
  { path: '/scraper', label: 'Scraper', icon: Zap, indicator: 'scraper' },
  { path: '/review', label: 'Review Queue', icon: CheckCircle2, indicator: 'review' },
  { path: '/ai-clean', label: 'AI Clean', icon: Sparkles, indicator: 'ai' },
  { path: '/import-export', label: 'Import / Export', icon: ArrowUpDown, indicator: 'io' },
  { path: '/logs', label: 'System Logs', icon: ScrollText, indicator: 'logs' },
  { path: '/settings', label: 'Settings', icon: Settings, indicator: 'settings' },
]

const CSV_HEADERS = [
  "name", "name_en", "phone", "website", "email", "address",
  "city", "governorate", "category", "subcategory", "latitude",
  "longitude", "facebook", "instagram", "data_quality", "verified", "source",
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { stagedBusinesses } = useReviewStore()
  const { results } = useScraperStore()
  const stagedCount = stagedBusinesses.length
  const scrapedCount = results.validated.length + results.needsReview.length

  const handleQuickExport = () => {
    if (stagedCount === 0) {
      toast.error("No businesses to export — scrape and stage first")
      return
    }
    const csvLines = [
      CSV_HEADERS.join(","),
      ...stagedBusinesses.map((b: Record<string, unknown>) =>
        CSV_HEADERS.map((h) => {
          const val = String((b as Record<string, unknown>)[h] ?? "")
          return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
        }).join(",")
      ),
    ]
    const bom = "\uFEFF"
    const blob = new Blob([bom + csvLines.join("\n")], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `iraq_businesses_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${stagedCount} businesses as CSV`)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-60 flex flex-col"
        style={{ background: 'hsl(30 15% 18%)' }}
      >
        {/* Brand */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-2.5">
            <Compass className="h-6 w-6" style={{ color: 'hsl(36 60% 55%)' }} />
            <div>
              <h1 className="font-bold text-base tracking-wide" style={{ color: 'hsl(36 60% 65%)' }}>
                IRAQ COMPASS
              </h1>
              <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: 'hsl(30 10% 55%)' }}>
                Business Scraper
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                  isActive
                    ? "text-white"
                    : "hover:bg-white/5"
                )}
                style={isActive ? { background: 'hsl(36 60% 42%)', color: '#fff' } : { color: 'hsl(30 10% 65%)' }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t" style={{ borderColor: 'hsl(30 10% 25%)' }}>
          <p className="text-[11px]" style={{ color: 'hsl(30 10% 45%)' }}>
            v1.0 · 18 Governorates
          </p>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-foreground">
              {navItems.find(n => n.path === location.pathname)?.label || 'Overview'}
            </h2>
            <span className="text-xs font-medium text-muted-foreground px-2.5 py-1 rounded-full bg-secondary">
              {scrapedCount > 0 ? `${scrapedCount} scraped` : '0 scraped'} · {stagedCount} staged
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/scraper"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors"
              style={{ borderColor: 'hsl(36 50% 55%)', color: 'hsl(36 50% 35%)' }}
            >
              <Zap className="h-3.5 w-3.5" /> Start Scraping
            </Link>
            <button
              onClick={handleQuickExport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border text-muted-foreground hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
