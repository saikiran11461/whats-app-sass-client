import { motion } from "framer-motion";
import {
  Wifi,
  Shield,
  Bell,
  Key,
  Smartphone,
  User,
  Copy,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Webhook,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings, useUpdateSettings, useUpdateSettingsSection } from "@/hooks/useSettings";
import { useDevices, useGenerateQR, useDisconnectDevice } from "@/hooks/useDevices";
import { useBrands } from "@/hooks/useBrands";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: devices, isLoading: devicesLoading } = useDevices();
  const { data: brands } = useBrands();
  const brand = Array.isArray(brands) ? brands[0] : brands;
  const { mutate: updateSettings } = useUpdateSettings();
  const { mutate: updateSection } = useUpdateSettingsSection();
  const { mutate: generateQR } = useGenerateQR();
  const { mutate: disconnectDevice } = useDisconnectDevice();

  const [showApiKey, setShowApiKey] = useState(false);
  const apiKey = "sk-wa-cmd-7a3f9b2c-4e5d-1234-abcd-567890ef1234";

  const handleToggleSetting = (section: string, field: string, value: boolean) => {
    updateSection(
      { section, data: { [field]: value } },
      {
        onSuccess: () => toast.success("Setting updated"),
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || "Update failed"),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, connections, and preferences
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-xl glass-card stat-card-glow p-5">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("") || "U"}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {user?.name || "User"}
            </h3>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
            <p className="mt-0.5 text-[10px] font-medium text-primary">
              {user?.role?.replace("_", " ").replace(/\b\w/g, (l) =>
                l.toUpperCase()
              ) || "User"}
            </p>
          </div>
          <button className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            <User className="h-3 w-3" /> Edit Profile
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Plan
            </span>
            <p className="text-sm font-semibold text-foreground">
              {brand?.businessName ? `${brand.businessName} Plan` : "Pro Plan"}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Messages Used
            </span>
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {settings?.general?.timezone || "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp Connections */}
      <div className="rounded-xl glass-card stat-card-glow overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Smartphone className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              WhatsApp Connections
            </h2>
          </div>
          <button
            onClick={() =>
              generateQR(undefined, {
                onSuccess: () => toast.success("QR code generated!"),
                onError: (err: any) =>
                  toast.error(err?.response?.data?.message || "Failed"),
              })
            }
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3 w-3" /> Add Number
          </button>
        </div>
        <div className="divide-y divide-border">
          {devicesLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : devices && devices.length > 0 ? (
            devices.map((device, i) => (
              <div
                key={device._id || i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${device.status === "connected" ? "bg-primary/10" : "bg-destructive/10"}`}
                  >
                    {device.status === "connected" ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {device.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {device.brandName} • API {device.apiVersion}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium ${device.tokenExpiry === "Expired" ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    Token: {device.tokenExpiry}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${device.status === "connected" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}
                  >
                    {device.status}
                  </span>
                  {device.status === "connected" && (
                    <button
                      onClick={() =>
                        disconnectDevice(device._id, {
                          onSuccess: () => toast.success("Disconnected"),
                        })
                      }
                      className="flex items-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20"
                    >
                      Disconnect
                    </button>
                  )}
                  {device.status === "disconnected" && (
                    <button
                      onClick={() =>
                        generateQR(undefined, {
                          onSuccess: () => toast.success("QR regenerated"),
                        })
                      }
                      className="flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                    >
                      <RefreshCw className="h-3 w-3" /> Reconnect
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No WhatsApp connections yet. Add one to get started.
            </div>
          )}
        </div>
      </div>

      {/* API & Webhooks */}
      <div className="rounded-xl glass-card stat-card-glow overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Key className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            API Configuration
          </h2>
        </div>
        <div className="divide-y divide-border">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">API Key</p>
                <p className="text-xs text-muted-foreground">
                  Use this key to authenticate API requests
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    toast.success("API key copied!");
                  }}
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
            </div>
            <div className="mt-2 rounded-md bg-surface-raised px-3 py-2">
              <code className="text-xs font-mono text-foreground tabular-nums">
                {showApiKey
                  ? apiKey
                  : "sk-wa-cmd-****-****-****-****-************"}
              </code>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Webhook URL
                </p>
                <p className="text-xs text-muted-foreground">
                  Receive real-time event notifications
                </p>
              </div>
              <button
                onClick={() => {
                  if (settings?.api?.webhookUrl) {
                    navigator.clipboard.writeText(settings.api.webhookUrl);
                    toast.success("Webhook URL copied!");
                  }
                }}
                className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <div className="mt-2">
              <input
                type="text"
                defaultValue={settings?.api?.webhookUrl || ""}
                placeholder="https://api.example.com/webhooks/whatsapp"
                className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 text-xs font-mono text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Webhook Events */}
      <div className="rounded-xl glass-card stat-card-glow overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Webhook className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Webhook Events
          </h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { event: "message.received", desc: "When a new message is received", enabled: true },
            { event: "message.status", desc: "When message status changes", enabled: true },
            { event: "message.failed", desc: "When a message fails to send", enabled: true },
            { event: "contact.created", desc: "When a new contact is added", enabled: settings?.api?.webhookEvents?.includes("contact.created") || false },
            { event: "campaign.completed", desc: "When a campaign finishes sending", enabled: settings?.api?.webhookEvents?.includes("campaign.completed") || false },
          ].map((evt, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {evt.event}
                </p>
                <p className="text-xs text-muted-foreground">{evt.desc}</p>
              </div>
              <button
                onClick={() =>
                  handleToggleSetting("api", "webhookEvents", !evt.enabled)
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${evt.enabled ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform ${evt.enabled ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl glass-card stat-card-glow overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Notifications
          </h2>
        </div>
        <div className="divide-y divide-border">
          {[
            {
              label: "Email Alerts",
              value: "Email",
              key: "notifications",
              field: "emailAlerts",
              enabled: settings?.notifications?.emailAlerts ?? true,
            },
            {
              label: "Push Notifications",
              value: "Push",
              key: "notifications",
              field: "pushAlerts",
              enabled: settings?.notifications?.pushAlerts ?? true,
            },
            {
              label: "Failed Message Alerts",
              value: settings?.notifications?.failedMessageAlerts || "Instant",
              key: "notifications",
              field: "failedMessageAlerts",
              enabled: settings?.notifications?.failedMessageAlerts !== "never",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.value}</p>
              </div>
              <button
                onClick={() =>
                  handleToggleSetting(item.key, item.field, !item.enabled)
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${item.enabled ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform ${item.enabled ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl glass-card stat-card-glow overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Security</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">
                Two-Factor Authentication
              </p>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
            <button
              onClick={() =>
                handleToggleSetting(
                  "security",
                  "twoFactorAuth",
                  !(settings?.security?.twoFactorAuth ?? false)
                )
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${settings?.security?.twoFactorAuth ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-card shadow transition-transform ${settings?.security?.twoFactorAuth ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-foreground">
                Session Timeout
              </p>
              <p className="text-xs text-muted-foreground">
                Automatically log out after inactivity
              </p>
            </div>
            <select
              value={settings?.security?.sessionTimeout || 30}
              onChange={(e) =>
                updateSection({
                  section: "security",
                  data: { sessionTimeout: parseInt(e.target.value) },
                })
              }
              className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs text-foreground focus:outline-none"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={240}>4 hours</option>
              <option value={0}>Never</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
