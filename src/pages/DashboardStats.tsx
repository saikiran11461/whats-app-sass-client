import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Users,
  CheckCheck,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useDashboardStats, useDashboardGrowth } from "@/hooks/useDashboard";
import { useRecentActivity } from "@/hooks/useActivityLogs";
import { useSocketEvent } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function DashboardStats() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: growth } = useDashboardGrowth();
  const { data: recentActivity } = useRecentActivity(6);

  // ── Real-time socket listeners for live dashboard updates ──

  // When a new message arrives (from webhook), refresh stats immediately
  useSocketEvent("message:new", () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs.recent });
  });

  // When a message status changes (sent → delivered → read), refresh stats
  useSocketEvent("message:status", () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
  });

  // When a campaign completes, refresh stats
  useSocketEvent("campaign:completed", () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    queryClient.invalidateQueries({ queryKey: queryKeys.activityLogs.recent });
  });

  // When a template status updates (approved/rejected), refresh stats
  useSocketEvent("template:status:update", () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
  });

  const statCards = stats
    ? [
        {
          label: "Messages Sent",
          value: stats.totalMessages?.toLocaleString() || "0",
          change: "+12.5%",
          up: true,
          icon: MessageSquare,
          accent: "primary" as const,
        },
        {
          label: "Active Contacts",
          value: stats.totalContacts?.toLocaleString() || "0",
          change: "+8.2%",
          up: true,
          icon: Users,
          accent: "cyan" as const,
        },
        {
          label: "Delivery Rate",
          value: `${stats.deliveryRate?.toFixed(1) || "0"}%`,
          change: "+0.3%",
          up: true,
          icon: CheckCheck,
          accent: "indigo" as const,
        },
        {
          label: "Failed Messages",
          value: stats.failedMessages?.toLocaleString() || "0",
          change: "-4.1%",
          up: false,
          icon: AlertTriangle,
          accent: "amber" as const,
        },
      ]
    : [];

  const recentMessages = recentActivity?.map((log) => ({
    contact: log.userName || "User",
    message: log.description || "",
    time: formatRelativeTime(log.createdAt),
    status: log.action,
  })) || [];

  if (statsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div
        variants={fadeUp}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
            System Operational — Real-time WhatsApp Business API
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/8 border border-primary/20 px-3 py-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-primary tabular-nums">
            +{growth?.messages?.length || 0}% this week
          </span>
        </div>
      </motion.div>

      <motion.div
        variants={stagger}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {statCards.map((stat) => {
          const accentColorMap: Record<string, string> = {
            primary: "text-primary",
            cyan: "text-cyan",
            indigo: "text-indigo",
            amber: "text-amber",
          };
          const accentBgMap: Record<string, string> = {
            primary: "bg-primary/10",
            cyan: "bg-cyan/10",
            indigo: "bg-indigo/10",
            amber: "bg-amber/10",
          };
          return (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="relative overflow-hidden rounded-xl glass-card p-5 stat-card-glow hover-lift cursor-default"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentBgMap[stat.accent]}`}
                  >
                    <stat.icon
                      className={`h-4 w-4 ${accentColorMap[stat.accent]}`}
                    />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <div className="mt-4 flex items-end gap-3">
                  <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                    {stat.value}
                  </span>
                  <span
                    className={`mb-1 flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${stat.up ? "bg-primary/10 text-primary" : "bg-amber/10 text-amber"}`}
                  >
                    {stat.up ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stat.change}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          variants={fadeUp}
          className="col-span-2 rounded-xl glass-card stat-card-glow overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <h2 className="text-sm font-bold text-foreground">
              Recent Activity
            </h2>
            <span className="rounded-md bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">
              Live
            </span>
          </div>
          <div className="divide-y divide-border/30">
            {recentMessages.length > 0 ? (
              recentMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-secondary/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-xs font-bold text-primary">
                      {(msg.contact || "U")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">
                        {msg.contact}
                      </p>
                      <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={msg.status} />
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {msg.time}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="rounded-xl glass-card stat-card-glow overflow-hidden"
        >
          <div className="border-b border-border/50 px-5 py-4">
            <h2 className="text-sm font-bold text-foreground">
              Growth Overview
            </h2>
          </div>
          <div className="p-4">
            {growth && growth.messages ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-border/40 bg-secondary/20 p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Messages Trend
                  </span>
                  <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">
                    {Array.isArray(growth.messages)
                      ? growth.messages.reduce((a: number, b: number) => a + b, 0)
                      : 0}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-secondary/20 p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Contact Growth
                  </span>
                  <p className="mt-2 text-2xl font-extrabold tabular-nums text-foreground">
                    {Array.isArray(growth.contacts)
                      ? growth.contacts.reduce((a: number, b: number) => a + b, 0)
                      : 0}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No growth data available
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dotClass: string; label: string }> = {
    send: { dotClass: "bg-primary", label: "Sent" },
    create: { dotClass: "bg-cyan", label: "Created" },
    update: { dotClass: "bg-indigo", label: "Updated" },
    delete: { dotClass: "bg-amber", label: "Deleted" },
    login: { dotClass: "bg-primary", label: "Login" },
  };
  const c = config[status] || { dotClass: "bg-muted-foreground", label: status };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${c.dotClass}`} />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {c.label}
      </span>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
