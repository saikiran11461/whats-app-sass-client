import { motion } from "framer-motion";
import { Plus, Calendar, Clock, Repeat, Edit, Trash2, Play, Pause, Eye, Filter } from "lucide-react";
import { useState } from "react";

const scheduled = [
  { name: "Morning Greetings", template: "Welcome Message", schedule: "Daily at 9:00 AM", nextRun: "Tomorrow, 9:00 AM", recipients: 1200, status: "active", createdAt: "Mar 10, 2024" },
  { name: "Payment Reminders", template: "Payment Reminder", schedule: "Every Monday at 10:00 AM", nextRun: "Mon, 10:00 AM", recipients: 340, status: "active", createdAt: "Mar 8, 2024" },
  { name: "Weekly Newsletter", template: "Flash Sale Alert", schedule: "Every Friday at 2:00 PM", nextRun: "Fri, 2:00 PM", recipients: 4500, status: "paused", createdAt: "Feb 28, 2024" },
  { name: "Follow-up Messages", template: "Feedback Request", schedule: "3 days after purchase", nextRun: "Varies", recipients: 890, status: "active", createdAt: "Mar 5, 2024" },
  { name: "Birthday Wishes", template: "Welcome Message", schedule: "On contact birthday", nextRun: "Varies", recipients: 50, status: "active", createdAt: "Jan 15, 2024" },
  { name: "Monthly Summary", template: "Monthly Report", schedule: "1st of every month", nextRun: "Apr 1, 9:00 AM", recipients: 2100, status: "completed", createdAt: "Dec 1, 2023" },
];

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  paused: "bg-amber/10 text-amber",
  completed: "bg-secondary text-muted-foreground",
};

export default function Scheduler() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? scheduled : scheduled.filter(s => s.status === filter);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Scheduler</h1>
          <p className="mt-1 text-sm text-muted-foreground">Automate message delivery on custom schedules</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Schedule New
        </button>
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-2">
        {["all", "active", "paused", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            {f === "all" ? `All (${scheduled.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${scheduled.filter(s => s.status === f).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-5 rounded-xl glass-card stat-card-glow p-5 hover-lift">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.status === "active" ? "bg-primary/10" : s.status === "completed" ? "bg-secondary" : "bg-amber/10"}`}>
              {s.status === "active" ? <Play className="h-4 w-4 text-primary" /> : s.status === "completed" ? <Clock className="h-4 w-4 text-muted-foreground" /> : <Pause className="h-4 w-4 text-amber" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColors[s.status]}`}>{s.status}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Repeat className="h-3 w-3" />{s.schedule}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Next: {s.nextRun}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.recipients.toLocaleString()} recipients</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="View details"><Eye className="h-4 w-4" /></button>
              <button className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" title="Edit"><Edit className="h-4 w-4" /></button>
              <button className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
