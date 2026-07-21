import { motion } from "framer-motion";
import {
  Send,
  Paperclip,
  Loader2,
  ArrowLeft,
  CheckCheck,
  Check,
  Clock,
  AlertTriangle,
  Users,
  MoreVertical,
  Phone,
  FileText,
  X,
  ChevronUp,
  Trash2,
  Forward,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroup, useSendToGroup } from "@/hooks/useGroups";
import { useGroupMessages, useDeleteMessage, useForwardMessage } from "@/hooks/useMessages";
import { useUploadFile } from "@/hooks/useUploads";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { toast } from "sonner";

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60000) return "just now";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatFullTime(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });
}

const statusConfig: Record<string, { icon: typeof Check; color: string; label: string }> = {
  read: { icon: CheckCheck, color: "text-primary", label: "Read" },
  delivered: { icon: CheckCheck, color: "text-primary/60", label: "Delivered" },
  sent: { icon: Check, color: "text-muted-foreground", label: "Sent" },
  queued: { icon: Clock, color: "text-muted-foreground", label: "Queued" },
  pending: { icon: Clock, color: "text-muted-foreground", label: "Pending" },
  failed: { icon: AlertTriangle, color: "text-destructive", label: "Failed" },
};

const PAGE_SIZE = 50;

export default function GroupChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [msgInput, setMsgInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("image");
  const [page, setPage] = useState(1);
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionMsgId, setActionMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isConnected } = useSocket();

  // Hooks
  const { data: group, isLoading: groupLoading } = useGroup(id || "");
  const {
    data: messagesData,
    isLoading: msgsLoading,
    refetch: refetchMessages,
  } = useGroupMessages(id || "", { page, limit: PAGE_SIZE });
  const rawMessages = messagesData?.messages || [];
  const pagination = messagesData?.pagination;
  const { mutate: uploadFile, isPending: uploading } = useUploadFile();
  const { mutate: sendToGroup, isPending: sending } = useSendToGroup();
  const { mutate: deleteMessage, isPending: deleting } = useDeleteMessage();
  const { mutate: forwardMessage, isPending: forwarding } = useForwardMessage();

  // Merge paginated messages — keep all loaded pages
  useEffect(() => {
    if (!rawMessages.length && page === 1) {
      setAllMessages([]);
      return;
    }
    if (page === 1) {
      setAllMessages(rawMessages);
    } else if (rawMessages.length > 0) {
      // Prepend older messages (dedup by _id)
      const existingIds = new Set(allMessages.map((m: any) => m._id));
      const newMsgs = rawMessages.filter((m: any) => !existingIds.has(m._id));
      setAllMessages((prev) => [...newMsgs, ...prev]);
    }
    setHasMore(pagination ? pagination.page < pagination.totalPages : rawMessages.length >= PAGE_SIZE);
    setLoadingMore(false);
  }, [rawMessages, pagination]);

  // Deduplicate displayed messages (group by content + 30s window)
  const displayMessages = (allMessages || []).reduce((unique: any[], msg: any) => {
    const sentMinute = new Date(msg.createdAt).getTime();
    const existing = unique.find(
      (u: any) =>
        u.content === msg.content &&
        Math.abs(new Date(u.createdAt).getTime() - sentMinute) < 30000
    );
    if (existing) {
      existing.contactCount = (existing.contactCount || 1) + 1;
      return unique;
    }
    return [...unique, { ...msg, contactCount: 1 }];
  }, []);

  // Auto-scroll to bottom on new messages (page 1 only)
  useEffect(() => {
    if (page === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayMessages.length]);

  // Socket event listeners
  useSocketEvent("message:new", (data: any) => {
    if (data.groupId === id) { setPage(1); refetchMessages(); }
  });
  useSocketEvent("message:status", (data: any) => {
    if (data.groupId === id) refetchMessages();
  });

  // Auto-refresh every 15s
  useEffect(() => {
    const interval = setInterval(() => { if (id) refetchMessages(); }, 15000);
    return () => clearInterval(interval);
  }, [id]);

  // Load more (older messages)
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setPage((p) => p + 1);
  }, [loadingMore, hasMore]);

  // File select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) setMediaType("image");
    else if (file.type.startsWith("video/")) setMediaType("video");
    else if (file.type.startsWith("audio/")) setMediaType("audio");
    else setMediaType("document");
    setMediaFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => setMediaPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    } else setMediaPreview(null);
  };

  const clearMedia = () => {
    setMediaFile(null); setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle send
  const handleSend = async () => {
    if (!id || !group) return;
    if (!msgInput.trim() && !mediaFile) { toast.error("Enter a message or attach media"); return; }
    try {
      let mediaUrl: string | undefined;
      if (mediaFile) {
        const result = await uploadFile.mutateAsync({ file: mediaFile });
        mediaUrl = (result as any)?.data?.url || (result as any)?.url;
      }
      sendToGroup(
        { id, content: mediaFile ? undefined : msgInput.trim(), mediaUrl, messageType: mediaFile ? mediaType : undefined },
        {
          onSuccess: (res: any) => { setMsgInput(""); clearMedia(); setPage(1); refetchMessages(); toast.success(`Sent to ${res?.data?.sent || 0} of ${res?.data?.total || 0} members`); },
          onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to send"),
        }
      );
    } catch (err: any) { toast.error(err?.message || "Failed"); }
  };

  // Delete message
  const handleDelete = (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    deleteMessage(msgId, {
      onSuccess: () => { toast.success("Message deleted"); refetchMessages(); setActionMsgId(null); },
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete"),
    });
  };

  // Forward message (to a phone number — simple prompt for now)
  const handleForward = (msg: any) => {
    const phone = prompt("Forward to phone number (e.g. +919876543210):");
    if (!phone) return;
    forwardMessage(
      { id: msg._id, contactId: msg.contactId || "new", phone },
      {
        onSuccess: () => { toast.success("Message forwarded"); setActionMsgId(null); },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to forward"),
      }
    );
  };

  // Organize by date
  const messagesByDate: Record<string, any[]> = {};
  const sortedMessages = [...displayMessages].sort(
    (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  sortedMessages.forEach((msg: any) => {
    const dateKey = new Date(msg.createdAt).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
    if (!messagesByDate[dateKey]) messagesByDate[dateKey] = [];
    messagesByDate[dateKey].push(msg);
  });

  // Loading state
  if (groupLoading) {
    return (
      <div className="flex h-[calc(100vh-7.5rem)] items-center justify-center rounded-xl glass-card">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!group) {
    return (
      <div className="flex h-[calc(100vh-7.5rem)] flex-col items-center justify-center gap-3 rounded-xl glass-card">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Group not found</p>
        <button onClick={() => navigate("/groups")} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Back to Groups</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[calc(100vh-7.5rem)] flex-col overflow-hidden rounded-xl glass-card stat-card-glow">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/groups")} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: group.color || "#6366f1" }}><Users className="h-5 w-5 text-white" /></div>
          <div>
            <p className="text-sm font-semibold text-foreground">{group.name}</p>
            <p className="text-[11px] text-muted-foreground">{group.contactCount?.toLocaleString() || 0} members{isConnected ? <span className="ml-2 text-primary">• Online</span> : <span className="ml-2 text-destructive">• Offline</span>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Phone className="h-4 w-4" /></button>
          <button onClick={() => setShowInfo(!showInfo)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><MoreVertical className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-secondary/5 to-secondary/10 p-4">
            {/* Load More */}
            {hasMore && (
              <div className="mb-4 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore || msgsLoading}
                  className="flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-secondary hover:text-foreground transition-all disabled:opacity-50"
                >
                  {loadingMore ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronUp className="h-3 w-3" />}
                  {loadingMore ? "Loading..." : `Load older messages`}
                </button>
              </div>
            )}

            {msgsLoading && page === 1 ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : Object.keys(messagesByDate).length > 0 ? (
              Object.entries(messagesByDate).map(([dateKey, dateMessages]) => (
                <div key={dateKey}>
                  <div className="mb-3 mt-2 flex justify-center">
                    <span className="rounded-full bg-background/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">{dateKey}</span>
                  </div>
                  {dateMessages.map((msg: any, i: number) => {
                    const isOutgoing = msg.sender === "user";
                    const s = statusConfig[msg.status] || statusConfig.pending;
                    const StatusIcon = s.icon;
                    const templateName = msg.templateId?.name;
                    const templateBody = msg.templateId?.body;
                    const isActionOpen = actionMsgId === msg._id;

                    return (
                      <motion.div
                        key={msg._id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.5) }}
                        className={`mb-2 flex ${isOutgoing ? "justify-end" : "justify-start"}`}
                        onClick={() => setActionMsgId(isActionOpen ? null : msg._id)}
                      >
                        <div className="group relative max-w-[75%]">
                          {/* Message Bubble */}
                          <div className={`rounded-2xl px-4 py-2.5 ${isOutgoing ? "rounded-br-md bg-primary/15 text-foreground" : "rounded-bl-md bg-secondary text-foreground"}`}>
                            {/* Contact name */}
                            {!isOutgoing && msg.contactId && <p className="mb-1 text-[11px] font-semibold text-primary">{msg.contactId?.name || msg.phone}</p>}

                            {/* Media */}
                            {msg.mediaUrl && (
                              <div className="mb-2 overflow-hidden rounded-lg">
                                {msg.messageType === "image" ? (
                                  <img src={msg.mediaUrl} alt="Media" className="max-h-48 w-full rounded-lg object-cover" loading="lazy" />
                                ) : (
                                  <div className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <span className="text-xs text-muted-foreground">{msg.fileName || "Attachment"}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Template */}
                            {(msg.templateId || msg.messageType === "template") && (
                              <div className="mb-1">
                                <p className="text-sm font-semibold text-primary">{templateName || "Template"}</p>
                                {templateBody && <p className="text-xs text-muted-foreground/80 mt-0.5">{templateBody}</p>}
                              </div>
                            )}

                            {/* Text */}
                            {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}

                            {/* Fallback */}
                            {!msg.content && !msg.mediaUrl && !msg.templateId && <p className="text-sm italic text-muted-foreground/70">Empty message</p>}

                            {/* Time & Status */}
                            <div className={`mt-1 flex items-center gap-1 ${isOutgoing ? "justify-end" : "justify-start"}`}>
                              {isOutgoing && msg.contactCount > 1 && <span className="text-[9px] tabular-nums text-muted-foreground/60 mr-1">{msg.contactCount} contacts</span>}
                              <span className="text-[10px] tabular-nums text-muted-foreground/70">{formatFullTime(msg.createdAt)}</span>
                              {isOutgoing && <StatusIcon className={`h-3 w-3 ${s.color}`} />}
                            </div>
                          </div>

                          {/* Error */}
                          {isOutgoing && msg.status === "failed" && msg.error && (
                            <div className="mt-1 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1">
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                              <span className="text-[10px] text-destructive/80">{msg.error}</span>
                            </div>
                          )}

                          {/* Action buttons (visible on click/tap) */}
                          {isActionOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`absolute top-0 ${isOutgoing ? "left-0 -translate-x-full -ml-2" : "right-0 translate-x-full mr-2"} flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg p-1 z-10`}
                            >
                              {/* Delete (only for outgoing) */}
                              {isOutgoing && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(msg._id); }}
                                  disabled={deleting}
                                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap"
                                >
                                  <Trash2 className="h-3 w-3" /> Delete
                                </button>
                              )}
                              {/* Forward */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleForward(msg); }}
                                disabled={forwarding}
                                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
                              >
                                <Forward className="h-3 w-3" /> Forward
                              </button>
                              {/* Copy text */}
                              {msg.content && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(msg.content); toast.success("Copied"); setActionMsgId(null); }}
                                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors whitespace-nowrap"
                                >
                                  <FileText className="h-3 w-3" /> Copy
                                </button>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><Send className="h-6 w-6 text-primary/60" /></div>
                <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground/70">Send your first message to {group.name}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border bg-background/50 p-3">
            {mediaFile && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-secondary/30 p-2">
                {mediaPreview ? <img src={mediaPreview} alt="Preview" className="h-10 w-10 rounded-lg object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>}
                <span className="flex-1 truncate text-xs text-foreground">{mediaFile.name}</span>
                <button onClick={clearMedia} className="rounded-full p-1 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
              </motion.div>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-2.5">
              <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-foreground" title="Attach media"><Paperclip className="h-4 w-4" /></button>
              <input type="text" value={msgInput} onChange={(e) => setMsgInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder={`Message ${group.name}...`} className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" disabled={sending || uploading} />
              <button onClick={handleSend} disabled={(!msgInput.trim() && !mediaFile) || sending || uploading} className="rounded-lg bg-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all">
                {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">Messages will be sent to all {group.contactCount} members via WhatsApp</p>
          </div>
        </div>

        {/* Info Sidebar */}
        {showInfo && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="hidden border-l border-border bg-background/30 md:block overflow-hidden">
            <div className="p-4">
              <div className="flex flex-col items-center gap-3 border-b border-border pb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ backgroundColor: group.color || "#6366f1" }}><Users className="h-8 w-8 text-white" /></div>
                <h3 className="text-lg font-bold text-foreground">{group.name}</h3>
                {group.description && <p className="text-center text-xs text-muted-foreground">{group.description}</p>}
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Group Info</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"><span className="text-xs text-muted-foreground">Members</span><span className="text-sm font-semibold text-foreground">{group.contactCount?.toLocaleString() || 0}</span></div>
                    <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"><span className="text-xs text-muted-foreground">Messages</span><span className="text-sm font-semibold text-foreground">{allMessages.length}</span></div>
                    <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"><span className="text-xs text-muted-foreground">Created</span><span className="text-sm font-semibold text-foreground">{formatTime(group.createdAt)}</span></div>
                    {pagination && (
                      <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"><span className="text-xs text-muted-foreground">Total</span><span className="text-sm font-semibold text-foreground">{pagination.total}</span></div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Delivery Stats</p>
                  <div className="mt-2 space-y-2">
                    {(() => {
                      const sent = displayMessages.filter((m: any) => ["sent", "delivered", "read"].includes(m.status)).length;
                      const failed = displayMessages.filter((m: any) => m.status === "failed").length;
                      const pending = displayMessages.filter((m: any) => ["pending", "queued"].includes(m.status)).length;
                      return (<>
                        <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="h-3 w-3 text-primary" /> Sent</span><span className="text-sm font-semibold text-foreground">{sent}</span></div>
                        <div className="flex items-center justify-between rounded-lg bg-amber/5 px-3 py-2"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3 text-amber" /> Pending</span><span className="text-sm font-semibold text-foreground">{pending}</span></div>
                        <div className="flex items-center justify-between rounded-lg bg-destructive/5 px-3 py-2"><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><AlertTriangle className="h-3 w-3 text-destructive" /> Failed</span><span className="text-sm font-semibold text-foreground">{failed}</span></div>
                      </>);
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
