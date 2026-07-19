import { motion } from "framer-motion";
import { Plus, Zap, Copy, Edit, Trash2, Search, Filter } from "lucide-react";
import { useState } from "react";

const quickReplies = [
  { shortcut: "/greet", text: "Hi {name}! Thanks for reaching out. How can I help you today?", category: "Greeting", uses: 3420 },
  { shortcut: "/thanks", text: "Thank you for your patience! Is there anything else I can help you with?", category: "Closing", uses: 2180 },
  { shortcut: "/hours", text: "Our support hours are Mon–Fri, 9 AM to 6 PM IST. We'll respond as soon as possible.", category: "Info", uses: 1560 },
  { shortcut: "/track", text: "You can track your order at https://track.example.com using order ID {order_id}.", category: "Support", uses: 4200 },
  { shortcut: "/refund", text: "I understand your concern. I've initiated the refund process. You'll receive it within 5–7 business days.", category: "Support", uses: 890 },
  { shortcut: "/pricing", text: "Here's our pricing:\n• Basic: ₹499/mo\n• Pro: ₹1,499/mo\n• Enterprise: Custom", category: "Sales", uses: 2340 },
  { shortcut: "/demo", text: "I'd love to show you a demo! You can book a slot here: https://cal.com/demo", category: "Sales", uses: 780 },
];

const categoryColors: Record<string, string> = {
  Greeting: "bg-primary/10 text-primary",
  Closing: "bg-cyan/10 text-cyan",
  Info: "bg-indigo/10 text-indigo",
  Support: "bg-amber/10 text-amber",
  Sales: "bg-rose/10 text-rose",
};

export default function QuickReplies() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const categories = ["all", ...Array.from(new Set(quickReplies.map(q => q.category)))];
  const filtered = categoryFilter === "all" ? quickReplies : quickReplies.filter(q => q.category === categoryFilter);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quick Replies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Save time with reusable message shortcuts</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Reply
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by shortcut or content..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-2 rounded-lg glass-card p-3">
          <span className="text-xs font-medium text-muted-foreground mr-2">Category:</span>
          {categories.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{c === "all" ? "All" : c}</button>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((q, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl glass-card stat-card-glow p-5 hover-lift">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Zap className="h-4 w-4 text-primary" /></div>
                <code className="rounded-md bg-secondary px-2 py-1 text-xs font-mono font-semibold text-primary">{q.shortcut}</code>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${categoryColors[q.category]}`}>{q.category}</span>
            </div>
            <p className="mt-4 whitespace-pre-line rounded-lg bg-secondary/50 p-3 text-sm text-foreground">{q.text}</p>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">Used <span className="font-semibold tabular-nums text-foreground">{q.uses.toLocaleString()}</span> times</span>
              <div className="flex items-center gap-1">
                <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" title="Copy"><Copy className="h-3.5 w-3.5" /></button>
                <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}