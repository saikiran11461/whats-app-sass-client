import { motion } from "framer-motion";
import { Search, Filter, CheckCheck, Check, AlertTriangle, Clock, RotateCcw, Eye, ChevronDown, Calendar, X } from "lucide-react";
import { useState } from "react";

const logs = [
  { id: "MSG-001", to: "+91 98765 43210", contact: "Rahul Sharma", template: "Order Confirmation", status: "read", time: "10:42 AM", date: "Today", error: null },
  { id: "MSG-002", to: "+91 87654 32109", contact: "Priya Patel", template: "Delivery Update", status: "delivered", time: "10:38 AM", date: "Today", error: null },
  { id: "MSG-003", to: "+44 7911 123456", contact: "David Wilson", template: "Welcome Message", status: "sent", time: "10:30 AM", date: "Today", error: null },
  { id: "MSG-004", to: "+91 76543 21098", contact: "Amit Kumar", template: "Payment Reminder", status: "failed", time: "10:15 AM", date: "Today", error: "Rate limit exceeded — too many messages in 24h window" },
  { id: "MSG-005", to: "+1 555 0123", contact: "Sarah Chen", template: "Flash Sale Alert", status: "read", time: "09:58 AM", date: "Today", error: null },
  { id: "MSG-006", to: "+91 65432 10987", contact: "Meera Joshi", template: "Feedback Request", status: "delivered", time: "09:45 AM", date: "Today", error: null },
  { id: "MSG-007", to: "+971 50 123 4567", contact: "Fatima Al-Rashid", template: "Order Confirmation", status: "failed", time: "09:20 AM", date: "Today", error: "Invalid WhatsApp number — recipient not registered" },
  { id: "MSG-008", to: "+1 555 9876", contact: "Alex Morgan", template: "Delivery Update", status: "pending", time: "09:10 AM", date: "Today", error: null },
];

const statusConfig: Record<string, { icon: typeof Check; color: string; label: string }> = {
  read: { icon: CheckCheck, color: "text-primary", label: "Read" },
  delivered: { icon: Check, color: "text-primary/60", label: "Delivered" },
  sent: { icon: Check, color: "text-muted-foreground", label: "Sent" },
  failed: { icon: AlertTriangle, color: "text-destructive", label: "Failed" },
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
};

export default function MessageLogs() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const filteredLogs = statusFilter === "all" ? logs : logs.filter(l => l.status === statusFilter);
  const failedCount = logs.filter(l => l.status === "failed").length;

  const handleRetry = (id: string) => {
    setRetrying(id);
    setTimeout(() => setRetrying(null), 2000);
  };

  const handleBulkRetry = () => {
    // Simulate bulk retry
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Message Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Complete audit trail of all dispatched messages</p>
        </div>
        {failedCount > 0 && (
          <button
            onClick={handleBulkRetry}
            className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Retry All Failed ({failedCount})
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by ID, phone, or contact..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
        >
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-2 rounded-lg glass-card p-3">
          <span className="text-xs font-medium text-muted-foreground mr-2">Status:</span>
          {["all", "read", "delivered", "sent", "failed", "pending"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-secondary">
              <Calendar className="h-3 w-3" /> Date Range
            </button>
          </div>
        </motion.div>
      )}

      <div className="overflow-hidden rounded-xl glass-card stat-card-glow">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-raised">
              {["ID", "Contact", "Phone", "Template", "Status", "Time", "Actions"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.map((log, i) => {
              const s = statusConfig[log.status];
              const isExpanded = expandedRow === log.id;
              return (
                <>
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className={`transition-colors hover:bg-secondary/30 cursor-pointer ${isExpanded ? "bg-secondary/20" : ""}`} onClick={() => setExpandedRow(isExpanded ? null : log.id)}>
                    <td className="px-5 py-3 text-xs font-mono tabular-nums text-muted-foreground">{log.id}</td>
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{log.contact}</td>
                    <td className="px-5 py-3 text-sm tabular-nums text-muted-foreground">{log.to}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{log.template}</td>
                    <td className="px-5 py-3">
                      <div className={`flex items-center gap-1.5 ${s.color}`}>
                        <s.icon className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">{s.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs tabular-nums text-muted-foreground">{log.time}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" title="View details">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {log.status === "failed" && (
                          <button
                            onClick={() => handleRetry(log.id)}
                            className={`rounded-md p-1.5 text-destructive hover:bg-destructive/10 ${retrying === log.id ? "animate-spin" : ""}`}
                            title="Retry"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                  {isExpanded && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan={7} className="bg-surface-raised px-5 py-3">
                        <div className="flex items-start gap-4 text-xs">
                          <div>
                            <span className="font-medium text-muted-foreground">Date:</span>
                            <span className="ml-2 text-foreground">{log.date}, {log.time}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Template:</span>
                            <span className="ml-2 text-foreground">{log.template}</span>
                          </div>
                          {log.error && (
                            <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                              <div>
                                <span className="font-medium text-destructive">Error:</span>
                                <span className="ml-1 text-destructive/80">{log.error}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
