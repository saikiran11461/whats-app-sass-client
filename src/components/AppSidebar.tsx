import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Building2, Users, UsersRound, LayoutTemplate,
  Megaphone, Send, Inbox, BotMessageSquare, Clock, FileText,
  Download, Settings, ChevronLeft, Sparkles, ChevronDown,
  Bot, ShieldCheck, Package, BarChart3, Plug, Zap, QrCode,
} from "lucide-react";
import { useState } from "react";

const brands = [
  { name: "Acme Store", status: "active" },
  { name: "Fresh Mart", status: "active" },
  { name: "Style Hub", status: "inactive" },
];

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
      { label: "Brands", icon: Building2, path: "/brands" },
    ],
  },
  {
    label: "Contacts",
    items: [
      { label: "Contacts", icon: Users, path: "/contacts" },
      { label: "Groups", icon: UsersRound, path: "/groups" },
    ],
  },
  {
    label: "Messaging",
    items: [
      { label: "Templates", icon: LayoutTemplate, path: "/templates" },
      { label: "Campaigns", icon: Megaphone, path: "/campaigns" },
      { label: "Messages", icon: Send, path: "/send" },
      { label: "Inbox", icon: Inbox, path: "/inbox" },
      { label: "Quick Replies", icon: Zap, path: "/quick-replies" },
    ],
  },
  {
    label: "Automation",
    items: [
      { label: "Auto Reply", icon: BotMessageSquare, path: "/auto-reply" },
      { label: "Chatbot Builder", icon: Bot, path: "/chatbot" },
      { label: "Scheduler", icon: Clock, path: "/scheduler" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Catalog", icon: Package, path: "/catalog" },
      { label: "QR & Widget", icon: QrCode, path: "/qr-widget" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Team & Agents", icon: ShieldCheck, path: "/team" },
      { label: "Integrations", icon: Plug, path: "/integrations" },
    ],
  },
  {
    label: "Reports",
    items: [
      { label: "Analytics", icon: BarChart3, path: "/analytics" },
      { label: "Logs", icon: FileText, path: "/logs" },
      { label: "Reports", icon: Download, path: "/reports" },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const [activeBrand, setActiveBrand] = useState(0);
  const [brandOpen, setBrandOpen] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative flex h-full flex-col glass-sidebar"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border/50">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary glow-emerald">
          <Sparkles className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="overflow-hidden"
            >
              <span className="text-base font-bold tracking-tight text-sidebar-accent-foreground">WA Command</span>
              <p className="text-[10px] font-medium text-sidebar-primary">Business Suite</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brand Switcher */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border/50">
          <div className="relative">
            <button
              onClick={() => setBrandOpen(!brandOpen)}
              className="flex w-full items-center gap-3 rounded-lg bg-sidebar-accent/60 px-3 py-2.5 transition-colors hover:bg-sidebar-accent"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary/20">
                <Building2 className="h-3.5 w-3.5 text-sidebar-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[12px] font-semibold text-sidebar-accent-foreground">{brands[activeBrand].name}</p>
                <p className="text-[10px] text-sidebar-primary">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-sidebar-primary mr-1" />
                  {brands[activeBrand].status === "active" ? "Active" : "Inactive"}
                </p>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-sidebar-foreground transition-transform ${brandOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {brandOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-sidebar-border/50 bg-sidebar overflow-hidden shadow-lg"
                >
                  {brands.map((b, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveBrand(i); setBrandOpen(false); }}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent ${i === activeBrand ? "bg-sidebar-accent" : ""}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${b.status === "active" ? "bg-sidebar-primary" : "bg-amber"}`} />
                      <span className="text-[12px] font-medium text-sidebar-accent-foreground">{b.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-3">
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/50"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.div
                      whileHover={{ x: collapsed ? 0 : 2 }}
                      transition={{ duration: 0.12 }}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? "sidebar-item-active"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <item.icon className={`h-[17px] w-[17px] shrink-0 transition-colors ${isActive ? "text-sidebar-primary" : ""}`} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings link */}
      <div className="border-t border-sidebar-border/50 px-3 py-2">
        <Link to="/settings">
          <div className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
            location.pathname === "/settings"
              ? "sidebar-item-active"
              : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          }`}>
            <Settings className="h-[17px] w-[17px] shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border/50 px-3 py-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center rounded-lg py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </button>
      </div>
    </motion.aside>
  );
}
