import { motion } from "framer-motion";
import { Download, FileText, Calendar, BarChart3, Search, Filter } from "lucide-react";
import { useState } from "react";

const reports = [
  { name: "Monthly Message Report", type: "Messages", period: "March 2024", size: "2.4 MB", format: "CSV" },
  { name: "Campaign Performance", type: "Campaigns", period: "March 2024", size: "1.8 MB", format: "PDF" },
  { name: "Contact Analytics", type: "Contacts", period: "Q1 2024", size: "3.2 MB", format: "XLSX" },
  { name: "Delivery Rate Analysis", type: "Analytics", period: "March 2024", size: "1.1 MB", format: "PDF" },
  { name: "Template Usage Report", type: "Templates", period: "March 2024", size: "0.8 MB", format: "CSV" },
];

const quickStats = [
  { label: "Total Messages", value: "48,291", period: "This Month" },
  { label: "Avg Delivery Rate", value: "97.8%", period: "This Month" },
  { label: "Active Campaigns", value: "12", period: "Running" },
  { label: "New Contacts", value: "1,247", period: "This Month" },
];

export default function ExportReports() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = reports.filter(r => {
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchFormat = formatFilter === "all" || r.format === formatFilter;
    const matchSearch = searchQuery === "" || r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchFormat && matchSearch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Export Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate and download analytical reports</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <BarChart3 className="h-4 w-4" /> Generate New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-xl glass-card stat-card-glow p-5 hover-lift">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.period}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search reports..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-4 rounded-lg glass-card p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Type:</span>
            {["all", "Messages", "Campaigns", "Contacts", "Analytics", "Templates"].map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {t === "all" ? "All" : t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Format:</span>
            {["all", "CSV", "PDF", "XLSX"].map(f => (
              <button key={f} onClick={() => setFormatFilter(f)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${formatFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="rounded-xl glass-card stat-card-glow overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map((r, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-secondary/20">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">{r.name}</h3>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{r.period}</span>
                    <span>{r.size}</span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium">{r.format}</span>
                  </div>
                </div>
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Download className="h-4 w-4" /> Download
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
