import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  CheckCheck,
  Check,
  Clock,
  AlertTriangle,
  Users,
  Inbox,
  Play,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { useContacts } from "@/hooks/useContacts";
import { useGroups } from "@/hooks/useGroups";
import { useConversations } from "@/hooks/useConversations";
import { toast } from "sonner";

const STATUS_STEPS = ["pending", "queued", "sent", "delivered", "read"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted-foreground",
  queued: "bg-amber",
  sent: "bg-primary",
  delivered: "bg-primary",
  read: "bg-primary",
  failed: "bg-destructive",
};

export default function TestConsole() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"outgoing" | "incoming" | "status">("outgoing");

  // Outgoing simulation
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [lastStatuses, setLastStatuses] = useState<string[]>([]);
  const [simMsgId, setSimMsgId] = useState<string | null>(null);

  // Incoming simulation
  const [inPhone, setInPhone] = useState("");
  const [inContent, setInContent] = useState("");
  const [inSending, setInSending] = useState(false);

  // Status update
  const [statusMsgId, setStatusMsgId] = useState("");
  const [targetStatus, setTargetStatus] = useState("delivered");
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Data
  const { data: contactsData } = useContacts({ limit: 20 });
  const contacts = contactsData?.contacts || [];
  const { data: groupsData } = useGroups();
  const groups = groupsData?.groups || [];
  const { data: convsData } = useConversations();
  const conversations = convsData?.conversations || [];

  // Simulate outgoing message
  const handleSimulateSend = async () => {
    if (!phone.trim() || !content.trim()) {
      toast.error("Enter both phone and message content");
      return;
    }
    setSending(true);
    setLastStatuses([]);
    setSimMsgId(null);

    try {
      const res: any = await api.post("/simulate/send", {
        phone: phone.replace(/\s/g, ""),
        contactId: "new",
        contactName: phone.replace(/\s/g, ""),
        content: content.trim(),
      });

      const msgId = res.data?._id || res.data?.id;
      setSimMsgId(msgId);
      toast.success("Simulation started! Watch status changes below...");

      // Listen for status updates via the timeline
      const statusTimeline = ["queued", "sent", "delivered", "read"];
      const delays = [500, 1500, 3000, 5000];

      statusTimeline.forEach((status, i) => {
        setTimeout(() => {
          setLastStatuses((prev) => [...prev, status]);
        }, delays[i]);
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Simulation failed");
    } finally {
      setSending(false);
    }
  };

  // Simulate incoming message
  const handleSimulateIncoming = async () => {
    if (!inPhone.trim() || !inContent.trim()) {
      toast.error("Enter both phone and message content");
      return;
    }
    setInSending(true);
    try {
      await api.post("/simulate/incoming", {
        phone: inPhone.replace(/\s/g, ""),
        contactId: "new",
        contactName: inPhone.replace(/\s/g, ""),
        content: inContent.trim(),
      });
      toast.success("Incoming message simulated! Check the Chat Inbox.");
      setInPhone("");
      setInContent("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to simulate");
    } finally {
      setInSending(false);
    }
  };

  // Manually update message status
  const handleUpdateStatus = async () => {
    if (!statusMsgId.trim()) {
      toast.error("Enter a message ID");
      return;
    }
    setStatusUpdating(true);
    try {
      await api.put(`/simulate/status/${statusMsgId.trim()}`, { status: targetStatus });
      toast.success(`Message status updated to ${targetStatus}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Quick fill from contacts/groups
  const fillFromContact = (c: any) => {
    setPhone(c.phone);
    setContent(`Hello ${c.name || c.phone}! This is a test message.`);
  };

  const fillIncomingContact = (c: any) => {
    setInPhone(c.phone);
    setInContent(`Hey! This is ${c.name || "a contact"} sending a test message.`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Test Console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Simulate messages and test the full lifecycle without WhatsApp API
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg glass-card p-1">
        {[
          { key: "outgoing" as const, label: "Send Outgoing", icon: Send },
          { key: "incoming" as const, label: "Receive Incoming", icon: Inbox },
          { key: "status" as const, label: "Update Status", icon: RefreshCw },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Outgoing Tab */}
      {activeTab === "outgoing" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl glass-card stat-card-glow p-6 space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">Simulate Outgoing Message</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Creates a message and progresses it through: pending → queued → sent → delivered → read
            </p>
          </div>

          {/* Quick fill from contacts */}
          {contacts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground self-center mr-1">Quick fill:</span>
              {contacts.slice(0, 5).map((c) => (
                <button
                  key={c._id}
                  onClick={() => fillFromContact(c)}
                  className="rounded-md bg-secondary/60 px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {c.name || c.phone}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                list="contact-list"
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <datalist id="contact-list">
                {contacts.map((c) => (
                  <option key={c._id} value={c.phone} label={c.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Message Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                placeholder="Type your test message..."
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSimulateSend}
              disabled={sending || !phone.trim() || !content.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {sending ? "Simulating..." : "Start Simulation"}
            </button>
          </div>

          {/* Live status tracker */}
          {lastStatuses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg border border-primary/20 bg-primary/5 p-4"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                Live Status Timeline
              </h3>
              <div className="space-y-2">
                {STATUS_STEPS.map((step, i) => {
                  const isReached = lastStatuses.includes(step);
                  const isLatest = lastStatuses[lastStatuses.length - 1] === step;
                  return (
                    <div key={step} className="flex items-center gap-3">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all duration-500 ${
                          isReached
                            ? isLatest
                              ? "bg-primary scale-110"
                              : "bg-primary/80"
                            : "bg-secondary"
                        }`}
                      >
                        {isReached ? (
                          isLatest ? (
                            <Loader2 className="h-3 w-3 animate-spin text-white" />
                          ) : (
                            <Check className="h-3 w-3 text-white" />
                          )
                        ) : (
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-medium capitalize ${
                              isReached ? "text-foreground" : "text-muted-foreground/50"
                            }`}
                          >
                            {step}
                          </span>
                          {isReached && (
                            <span className="text-[10px] text-muted-foreground">
                              {step === "queued" ? "~0.5s" : step === "sent" ? "~2s" : step === "delivered" ? "~3s" : step === "read" ? "~5s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isReached ? "bg-primary" : "bg-transparent"
                            }`}
                            style={{ width: isReached ? "100%" : "0%" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {lastStatuses.length >= 4 && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
                  <CheckCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Simulation complete — message lifecycle finished</span>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Incoming Tab */}
      {activeTab === "incoming" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl glass-card stat-card-glow p-6 space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">Simulate Incoming Message</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Creates a message as if a contact sent it to you. Check the Chat Inbox after.
            </p>
          </div>

          {contacts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground self-center mr-1">Quick fill:</span>
              {contacts.slice(0, 5).map((c) => (
                <button
                  key={c._id}
                  onClick={() => fillIncomingContact(c)}
                  className="rounded-md bg-secondary/60 px-2 py-1 text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  {c.name || c.phone}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">From Phone Number</label>
              <input
                type="text"
                value={inPhone}
                onChange={(e) => setInPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Message Content</label>
              <textarea
                value={inContent}
                onChange={(e) => setInContent(e.target.value)}
                rows={3}
                placeholder="Type the incoming message..."
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none resize-none"
              />
            </div>
            <button
              onClick={handleSimulateIncoming}
              disabled={inSending || !inPhone.trim() || !inContent.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {inSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Inbox className="h-4 w-4" />}
              {inSending ? "Simulating..." : "Simulate Incoming"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Status Update Tab */}
      {activeTab === "status" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl glass-card stat-card-glow p-6 space-y-5"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">Manually Update Message Status</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Update any message to a specific status. Useful for testing UI rendering.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Message ID</label>
              <input
                type="text"
                value={statusMsgId}
                onChange={(e) => setStatusMsgId(e.target.value)}
                placeholder="Paste message _id here..."
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground font-mono focus:border-primary/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Target Status</label>
              <div className="flex flex-wrap gap-2">
                {["pending", "queued", "sent", "delivered", "read", "failed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTargetStatus(s)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all capitalize ${
                      targetStatus === s
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleUpdateStatus}
              disabled={statusUpdating || !statusMsgId.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {statusUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {statusUpdating ? "Updating..." : "Update Status"}
            </button>
          </div>

          {/* Help section */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">How to find a Message ID</h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>1. Go to the <strong>Message Logs</strong> page</p>
              <p>2. Find a message in the list</p>
              <p>3. Click on the row to expand details</p>
              <p>4. Copy the message _id</p>
              <p>5. Paste it here and choose a status</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick stats */}
      <div className="rounded-xl glass-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Stats</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-secondary/30 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Contacts</p>
            <p className="text-lg font-bold text-foreground">{contacts.length}</p>
          </div>
          <div className="rounded-lg bg-secondary/30 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Groups</p>
            <p className="text-lg font-bold text-foreground">{groups.length}</p>
          </div>
          <div className="rounded-lg bg-secondary/30 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Conversations</p>
            <p className="text-lg font-bold text-foreground">{conversations.length}</p>
          </div>
          <div className="rounded-lg bg-secondary/30 px-3 py-2">
            <p className="text-[10px] text-muted-foreground">Simulation Mode</p>
            <p className="text-lg font-bold text-primary">Active</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
