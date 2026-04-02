import { useScraperStore, useReviewStore } from "@/stores";
import { Link } from "react-router-dom";
import { Zap, Sparkles, CheckCircle2, Upload, Download } from "lucide-react";

export function Dashboard() {
  const { results } = useScraperStore();
  const { stagedBusinesses } = useReviewStore();

  const scraped = results.validated.length + results.needsReview.length;
  const staged = stagedBusinesses.length;
  const validated = stagedBusinesses.filter((b) => b._status === "validated").length;
  const needsReview = stagedBusinesses.filter((b) => b._status === "needs_review").length;
  const withPhone = stagedBusinesses.filter((b) => b.phone && b.phone.length > 8).length;
  const withWebsite = stagedBusinesses.filter((b) => b.website && b.website.length > 5).length;

  const FLOW_STEPS = [
    {
      num: 1,
      label: "Scrape",
      desc: "Pick governorates & categories, click Start Scraping",
      link: "/scraper",
      icon: Zap,
      count: scraped,
      countLabel: "scraped",
      color: "hsl(36 60% 42%)",
    },
    {
      num: 2,
      label: "Stage & Clean",
      desc: "Stage results, then run AI Clean to normalize phones & remove duplicates",
      link: "/ai-clean",
      icon: Sparkles,
      count: staged,
      countLabel: "staged",
      color: "hsl(36 55% 50%)",
    },
    {
      num: 3,
      label: "Review",
      desc: "Review cleaned data — validated vs needs_review",
      link: "/review",
      icon: CheckCircle2,
      count: validated,
      countLabel: "validated",
      color: "hsl(140 50% 40%)",
    },
    {
      num: 4,
      label: "Push to Supabase",
      desc: "Select All → Smart Push (dedup + merge)",
      link: "/review",
      icon: Upload,
      count: 0,
      countLabel: "",
      color: "hsl(210 60% 50%)",
    },
    {
      num: 5,
      label: "Export",
      desc: "Download CSV/JSON with Arabic support",
      link: "/import-export",
      icon: Download,
      count: 0,
      countLabel: "",
      color: "hsl(30 55% 42%)",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={scraped} label="SCRAPED" color="text-foreground" />
        <StatCard value={staged} label="STAGED" color="text-amber-700" />
        <StatCard value={validated} label="VALIDATED" color="text-green-700" />
        <StatCard value={needsReview} label="NEEDS REVIEW" color="text-red-600" />
      </div>

      {/* Data Quality */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard value={withPhone} label="WITH PHONE" color="text-blue-700" />
        <StatCard value={withWebsite} label="WITH WEBSITE" color="text-purple-700" />
        <StatCard value={staged - withPhone} label="NO PHONE" color="text-muted-foreground" />
        <StatCard
          value={staged > 0 ? Math.round((withPhone / staged) * 100) : 0}
          label="% WITH PHONE"
          color="text-green-600"
          suffix="%"
        />
      </div>

      {/* Pipeline Flow */}
      <section>
        <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4">
          How to Use — Step by Step
        </h3>
        <div className="space-y-3">
          {FLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.num}
                to={step.link}
                className="flex items-center gap-4 rounded-xl border-2 bg-card px-5 py-4 hover:bg-secondary/50 transition-colors"
                style={{ borderColor: "hsl(36 30% 82%)" }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-lg shrink-0"
                  style={{ background: step.color }}
                >
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: step.color }} />
                    <span className="font-semibold">{step.label}</span>
                    {step.count > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {step.count} {step.countLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
                <span className="text-muted-foreground text-lg">→</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  value,
  label,
  color,
  suffix,
}: {
  value: number;
  label: string;
  color: string;
  suffix?: string;
}) {
  return (
    <div
      className="rounded-xl border-2 bg-card px-5 py-4"
      style={{ borderColor: "hsl(36 30% 82%)" }}
    >
      <div className={`text-3xl font-bold ${color}`}>
        {value.toLocaleString()}
        {suffix || ""}
      </div>
      <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mt-1">
        {label}
      </div>
    </div>
  );
}
