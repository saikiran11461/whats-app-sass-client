import { motion } from "framer-motion";
import { Plus, UserPlus, Search, Filter, Shield, MessageCircle, Clock, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useState } from "react";

const agents = [
  { name: "John Doe", email: "john@example.com", role: "Admin", status: "online", chats: 42, avgResponse: "1m 20s", lastActive: "Now" },
  { name: "Sarah Chen", email: "sarah@example.com", role: "Agent", status: "online", chats: 28, avgResponse: "2m 05s", lastActive: "Now" },
  { name: "Amit Kumar", email: "amit@example.com", role: "Agent", status: "away", chats: 15, avgResponse: "3m 45s", lastActive: "10m ago" },
  { name: "Priya Patel", email: "priya@example.com", role: "Supervisor", status: "online", chats: 18, avgResponse: "1m 55s", lastActive: "Now" },
  { name: "David Wilson", email: "david@example.com", role: "Agent", status: "offline", chats: 0, avgResponse: "4m 12s", lastActive: "2h ago" },
  { name: "Meera Joshi", email: "meera@example.com", role: "Agent", status: "online", chats: 22, avgResponse: "2m 30s", lastActive: "Now" },
];

const roleColors: Record<string, string> = {
  Admin: "bg-destructive/10 text-destructive",
  Supervisor: "bg-indigo/10 text-indigo",
  Agent: "bg-primary/10 text-primary",
};

export default function TeamAgents() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = agents.filter(a => {
    const matchRole = roleFilter === "all" || a.role === roleFilter;
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchRole && matchStatus;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Team & Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your support team and their permissions</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <UserPlus className="h-4 w-4" /> Invite Agent
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Agents", value: agents.length, icon: Shield, color: "primary" },
          { label: "Online Now", value: agents.filter(a => a.status === "online").length, icon: MessageCircle, color: "cyan" },
          { label: "Active Chats", value: agents.reduce((s, a) => s + a.chats, 0), icon: MessageCircle, color: "indigo" },
          { label: "Avg Response", value: "2m 18s", icon: Clock, color: "amber" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl glass-card stat-card-glow p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <s.icon className="h-4 w-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search agents..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-4 rounded-lg glass-card p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Role:</span>
            {["all", "Admin", "Supervisor", "Agent"].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${roleFilter === r ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{r === "all" ? "All" : r}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {["all", "online", "away", "offline"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="overflow-hidden rounded-xl glass-card stat-card-glow">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              {["Agent", "Role", "Status", "Active Chats", "Avg Response", "Last Active", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((a, i) => (
              <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="transition-colors hover:bg-secondary/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{a.name.split(" ").map(n => n[0]).join("")}</div>
                      <span className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${a.status === "online" ? "bg-primary" : a.status === "away" ? "bg-amber" : "bg-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5"><span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${roleColors[a.role]}`}>{a.role}</span></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${a.status === "online" ? "bg-primary" : a.status === "away" ? "bg-amber" : "bg-muted-foreground"}`} />
                    <span className="text-xs font-medium text-muted-foreground capitalize">{a.status}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm tabular-nums text-foreground">{a.chats}</td>
                <td className="px-5 py-3.5 text-sm tabular-nums text-muted-foreground">{a.avgResponse}</td>
                <td className="px-5 py-3.5 text-xs text-muted-foreground">{a.lastActive}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit className="h-3.5 w-3.5" /></button>
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}