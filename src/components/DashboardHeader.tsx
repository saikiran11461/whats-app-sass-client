import { Search, Bell, Wifi, Settings, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, useUnreadNotificationCount } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";

interface DashboardHeaderProps {
  onToggleSidebar: () => void;
}

export function DashboardHeader({ onToggleSidebar: _onToggleSidebar }: DashboardHeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { data: notificationsData } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationCount();

  const notifications = notificationsData?.notifications?.slice(0, 5) || [];
  const unread = unreadCount || 0;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 transition-all duration-200 ${searchFocused ? "border-primary/40 bg-surface shadow-sm w-96" : "border-border bg-surface w-64"}`}>
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts, logs, campaigns..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
          <Wifi className={`h-3 w-3 ${isConnected ? 'text-primary animate-pulse' : 'text-destructive'}`} />
          <span className={`text-xs font-semibold ${isConnected ? 'text-primary' : 'text-destructive'}`}>{isConnected ? 'Connected' : 'Offline'}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl glass-card stat-card-glow overflow-hidden"
              >
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {notifications.length > 0 ? notifications.map((n, i) => (
                    <div key={n._id || i} className="px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          n.type === 'campaign_completed' || n.type === 'template_approved' ? 'bg-primary' : n.type === 'campaign_failed' || n.type === 'device_disconnected' ? 'bg-destructive' : 'bg-indigo'
                        }`} />
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{n.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground/70">{formatTimeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link to="/settings" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Settings className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {user?.name?.split(" ").map(n => n[0]).join("")?.toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
