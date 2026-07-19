import { motion } from "framer-motion";
import { Plug, CheckCircle, Search, Filter } from "lucide-react";
import { useState } from "react";

const integrations = [
  { name: "Shopify", desc: "Sync orders, send abandoned cart reminders", category: "E-commerce", connected: true, logo: "🛍️" },
  { name: "HubSpot", desc: "Two-way contact & conversation sync", category: "CRM", connected: true, logo: "🎯" },
  { name: "Zapier", desc: "Connect with 5000+ apps via workflows", category: "Automation", connected: true, logo: "⚡" },
  { name: "Salesforce", desc: "Enterprise CRM integration", category: "CRM", connected: false, logo: "☁️" },
  { name: "Google Sheets", desc: "Export contacts and logs to sheets", category: "Productivity", connected: true, logo: "📊" },
  { name: "Stripe", desc: "Send payment links via WhatsApp", category: "Payments", connected: false, logo: "💳" },
  { name: "Mailchimp", desc: "Sync email marketing contacts", category: "Marketing", connected: false, logo: "📧" },
  { name: "WooCommerce", desc: "WordPress e-commerce integration", category: "E-commerce", connected: false, logo: "🛒" },
  { name: "Razorpay", desc: "Accept payments in messages", category: "Payments", connected: true, logo: "💰" },
  { name: "Calendly", desc: "Book appointments via chat", category: "Productivity", connected: false, logo: "📅" },
  { name: "Slack", desc: "Get chat notifications in Slack", category: "Productivity", connected: false, logo: "💬" },
  { name: "Google Analytics", desc: "Track message conversions", category: "Analytics", connected: false, logo: "📈" },
];

export default function Integrations() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [connectedFilter, setConnectedFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const categories = ["all", ...Array.from(new Set(integrations.map(i => i.category)))];
  const filtered = integrations.filter(i =>
    (categoryFilter === "all" || i.category === categoryFilter) &&
    (connectedFilter === "all" || (connectedFilter === "connected" ? i.connected : !i.connected))
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Connect your favorite tools and automate workflows</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
          <Plug className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary">{integrations.filter(i => i.connected).length} Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search integrations..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-4 rounded-lg glass-card p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Category:</span>
            {categories.map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{c === "all" ? "All" : c}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {[{ k: "all", l: "All" }, { k: "connected", l: "Connected" }, { k: "available", l: "Available" }].map(o => (
              <button key={o.k} onClick={() => setConnectedFilter(o.k)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${connectedFilter === o.k ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{o.l}</button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((it, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl glass-card stat-card-glow p-5 hover-lift">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-2xl">{it.logo}</div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{it.name}</h3>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{it.category}</span>
                </div>
              </div>
              {it.connected && <CheckCircle className="h-4 w-4 text-primary" />}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{it.desc}</p>
            <button className={`mt-4 w-full rounded-lg py-2 text-xs font-semibold transition-colors ${it.connected ? "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground" : "bg-primary text-primary-foreground hover:opacity-90"}`}>
              {it.connected ? "Configure" : "Connect"}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}