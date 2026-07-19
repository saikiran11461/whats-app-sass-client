import { motion } from "framer-motion";
import {
  Plus,
  Power,
  Edit,
  Trash2,
  Zap,
  MessageSquare,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import {
  useAutoReplies,
  useToggleAutoReply,
  useDeleteAutoReply,
} from "@/hooks/useAutoReplies";
import { toast } from "sonner";

export default function AutoReply() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useAutoReplies({
    search: searchQuery || undefined,
  });
  const rules = data?.autoReplies || [];
  const { mutate: toggleAutoReply } = useToggleAutoReply();
  const { mutate: deleteAutoReply } = useDeleteAutoReply();

  const filtered = rules.filter((r) => {
    const matchActive =
      activeFilter === "all" ||
      (activeFilter === "active" && r.isActive) ||
      (activeFilter === "inactive" && !r.isActive);
    return matchActive;
  });

  const handleToggle = (id: string) => {
    toggleAutoReply(id, {
      onSuccess: () => toast.success("Auto reply rule updated"),
      onError: (err: any) => toast.error(err?.response?.data?.message || "Update failed"),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this auto reply rule?")) {
      deleteAutoReply(id, {
        onSuccess: () => toast.success("Rule deleted"),
        onError: (err: any) => toast.error(err?.response?.data?.message || "Delete failed"),
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Auto Reply
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure keyword-based automatic responses
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Rule
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keyword or template..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
        >
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap items-center gap-2 rounded-lg glass-card p-3"
        >
          <span className="text-xs font-medium text-muted-foreground mr-2">
            Status:
          </span>
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {f === "all"
                ? `All (${rules.length})`
                : `${f.charAt(0).toUpperCase() + f.slice(1)} (${rules.filter((r) => (f === "active" ? r.isActive : !r.isActive)).length})`}
            </button>
          ))}
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.length > 0 ? (
            filtered.map((r, i) => (
              <motion.div
                key={r._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl glass-card stat-card-glow p-5 hover-lift"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap
                      className={`h-4 w-4 ${r.isActive ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <h3 className="text-sm font-semibold text-foreground">
                      {r.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleToggle(r._id)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${r.isActive ? "bg-primary" : "bg-secondary"}`}
                  >
                    <motion.span
                      animate={{ x: r.isActive ? 20 : 2 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-1 h-4 w-4 rounded-full bg-foreground shadow-sm"
                    />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1">
                    <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">
                      {r.keyword || r.type}
                    </span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    {r.templateName || "Direct reply"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Triggers
                    </span>
                    <p className="text-xs tabular-nums text-foreground">
                      {r.triggerCount?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Last Trigger
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {r.lastTriggeredAt
                        ? formatTimeAgo(r.lastTriggeredAt)
                        : "Never"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                  <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No auto reply rules configured
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
