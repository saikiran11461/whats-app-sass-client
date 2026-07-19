import { motion } from "framer-motion";
import { Plus, Bot, MessageSquare, GitBranch, Zap, Play, Pause, Edit, Trash2, Copy, Search, Filter, ArrowRight } from "lucide-react";
import { useState } from "react";

const flows = [
  { name: "Welcome Onboarding Bot", trigger: "First message", nodes: 12, status: "active", conversations: 3400, completion: 78 },
  { name: "Order Tracking Flow", trigger: "Keyword: track", nodes: 8, status: "active", conversations: 2100, completion: 92 },
  { name: "Product Recommendation", trigger: "Keyword: recommend", nodes: 15, status: "active", conversations: 890, completion: 65 },
  { name: "Support Ticket Bot", trigger: "Keyword: help", nodes: 20, status: "draft", conversations: 0, completion: 0 },
  { name: "Feedback Collector", trigger: "After purchase", nodes: 6, status: "paused", conversations: 450, completion: 88 },
];

export default function ChatbotBuilder() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = statusFilter === "all" ? flows : flows.filter(f => f.status === statusFilter);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chatbot Builder</h1>
          <p className="mt-1 text-sm text-muted-foreground">Design conversational flows without code</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Create Flow
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search flows..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-2 rounded-lg glass-card p-3">
          <span className="text-xs font-medium text-muted-foreground mr-2">Status:</span>
          {["all", "active", "paused", "draft"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </motion.div>
      )}

      {/* Flow preview canvas */}
      <div className="rounded-xl glass-card stat-card-glow p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Preview: Welcome Onboarding Bot</h2>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Active</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FlowNode icon={Zap} label="Trigger" sublabel="First message" color="amber" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <FlowNode icon={MessageSquare} label="Greeting" sublabel="Send welcome" color="primary" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <FlowNode icon={GitBranch} label="Menu" sublabel="Show options" color="indigo" />
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <FlowNode icon={Bot} label="AI Reply" sublabel="Answer query" color="cyan" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-xl glass-card stat-card-glow p-5 hover-lift">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Bot className="h-5 w-5 text-primary" /></div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{f.name}</h3>
                  <p className="text-xs text-muted-foreground">Trigger: {f.trigger}</p>
                </div>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${f.status === "active" ? "bg-primary/10 text-primary" : f.status === "paused" ? "bg-amber/10 text-amber" : "bg-secondary text-muted-foreground"}`}>{f.status}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Nodes</span>
                <p className="text-sm font-semibold tabular-nums text-foreground">{f.nodes}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Chats</span>
                <p className="text-sm font-semibold tabular-nums text-foreground">{f.conversations.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Completion</span>
                <p className="text-sm font-semibold tabular-nums text-foreground">{f.completion}%</p>
              </div>
            </div>
            {f.conversations > 0 && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary" style={{ width: `${f.completion}%` }} />
              </div>
            )}
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"><Edit className="h-3 w-3" /> Edit</button>
              <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
                {f.status === "active" ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3" /> Enable</>}
              </button>
              <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"><Copy className="h-3 w-3" /> Clone</button>
              <button className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function FlowNode({ icon: Icon, label, sublabel, color }: { icon: any; label: string; sublabel: string; color: string }) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    amber: "bg-amber/10 text-amber border-amber/20",
    indigo: "bg-indigo/10 text-indigo border-indigo/20",
    cyan: "bg-cyan/10 text-cyan border-cyan/20",
  };
  return (
    <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${colorMap[color]}`}>
      <Icon className="h-4 w-4" />
      <div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[10px] opacity-70">{sublabel}</p>
      </div>
    </div>
  );
}