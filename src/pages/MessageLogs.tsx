import { motion } from "framer-motion";
import {
  Search,
  Filter,
  CheckCheck,
  Check,
  AlertTriangle,
  Clock,
  RotateCcw,
  Eye,
  ChevronDown,
  Calendar,
  X,
  Loader2,
  MessageSquare,
  UserCheck,
  FileText,
  Image,
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useMessages, useMessageStats } from "@/hooks/useMessages";
import { useSocketEvent } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api";
import { Link } from "react-router-dom";

const statusConfig: Record<string, { icon: typeof Check; color: string; label: string }> = {
  read: { icon: CheckCheck, color: "text-primary", label: "Read" },
  delivered: { icon: Check, color: "text-primary/60", label: "Delivered" },
  sent: { icon: Check, color: "text-muted-foreground", label: "Sent" },
  failed: { icon: AlertTriangle, color: "text-destructive", label: "Failed" },
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  queued: { icon: Clock, color: "text-muted-foreground", label: "Queued" },
};

export default function MessageLogs() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const queryClient = useQueryClient();

  const { data: messagesData, isLoading } = useMessages({
    limit: 100,
  });
  const { data: stats } = useMessageStats();

  const messages = messagesData?.messages || [];
  const pagination = messagesData?.pagination;

  // Real-time: listen for new message status updates
  useSocketEvent("message:status", (data: any) => {
    // Update single message status in the cached data without full refetch
    queryClient.invalidateQueries({ queryKey: queryKeys.messages.list({}) });
    queryClient.invalidateQueries({ queryKey: queryKeys.messages.stats });
  });

  // Real-time: listen for new incoming messages
  useSocketEvent("message:new", (data: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.messages.list({}) });
    queryClient.invalidateQueries({ queryKey: queryKeys.messages.stats });
  });

  // Auto-refresh stats every 30 seconds as a fallback for missed socket events
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.stats });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter messages by status
  const filteredMessages = useMemo(() => {
    let filtered = [...messages];
    if (statusFilter !== "all") {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.content?.toLowerCase().includes(q) ||
          m.contactPhone?.includes(q) ||
          m.contactName?.toLowerCase().includes(q) ||
          m._id?.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [messages, statusFilter, searchQuery]);

  const failedCount = messages.filter((m) => m.status === "failed").length;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Message History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete audit trail of all dispatched messages — {pagination?.total || messages.length} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          <Link
            to="/inbox"
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Chat Inbox
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats?.total || 0, color: "text-foreground", bg: "bg-secondary/50" },
          { label: "Delivered/Read", value: (stats?.delivered || 0) + (stats?.read || 0), color: "text-primary", bg: "bg-primary/5" },
          { label: "Pending", value: (stats?.pending || 0) + (stats?.sent || 0), color: "text-amber", bg: "bg-amber/5" },
          { label: "Failed", value: stats?.failed || 0, color: "text-destructive", bg: "bg-destructive/5" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg ${stat.bg} px-4 py-3`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
            <p className={`mt-1 text-2xl font-bold tabular-nums ${stat.color}`}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, phone, contact, or content..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            showFilters
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap items-center gap-2 rounded-lg glass-card p-3"
        >
          <span className="text-xs font-medium text-muted-foreground mr-2">Status:</span>
          {["all", "read", "delivered", "sent", "queued", "failed", "pending"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </motion.div>
      )}

      {/* Message History Table */}
      <div className="overflow-hidden rounded-xl glass-card stat-card-glow">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredMessages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-surface-raised">
                  {["Contact", "Phone", "Message", "Type", "Status", "Sent At", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMessages.map((msg, i) => {
                  const s = statusConfig[msg.status] || statusConfig.pending;
                  const StatusIcon = s.icon;
                  const isExpanded = expandedRow === msg._id;

                  return (
                    <motion.tr
                      key={msg._id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.5) }}
                      className={`transition-colors hover:bg-secondary/30 cursor-pointer ${
                        isExpanded ? "bg-secondary/20" : ""
                      }`}
                      onClick={() => setExpandedRow(isExpanded ? null : msg._id)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {(msg.contactName || "U")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {msg.contactName || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm tabular-nums text-muted-foreground font-mono">
                        {msg.phone}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {msg.messageType !== "text" && msg.messageType !== "template" && (
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {msg.messageType === "image" ? (
                                <Image className="inline h-3 w-3 mr-0.5" />
                              ) : (
                                <FileText className="inline h-3 w-3 mr-0.5" />
                              )}
                              {msg.messageType}
                            </span>
                          )}
                          <span className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {msg.content || (msg.mediaUrl ? "[Media]" : "[Template]")}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                          {msg.messageType || "text"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className={`flex items-center gap-1.5 ${s.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">{s.label}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs tabular-nums text-muted-foreground">
                        {formatDate(msg.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        {msg.status === "failed" && (
                          <button
                            className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                            title="Retry"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "No messages match your filters"
                : "No messages sent yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Send your first message from the Messages page"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {pagination && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {filteredMessages.length} of {pagination.total} messages
          </span>
          {pagination.totalPages > 1 && (
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
