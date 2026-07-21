import { motion } from "framer-motion";
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Phone,
  MoreVertical,
  CheckCheck,
  Check,
  Clock,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useConversations, useMarkConversationRead } from "@/hooks/useConversations";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { useContact } from "@/hooks/useContacts";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api";
import { toast } from "sonner";

export default function ChatInbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversationsData, isLoading: convsLoading } = useConversations({
    search: searchQuery || undefined,
  });
  const conversations = conversationsData?.conversations || [];

  const {
    data: messagesData,
    isLoading: msgsLoading,
  } = useMessages({
    conversationId: selectedId || undefined,
  });
  const messages = messagesData?.messages || [];

  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { mutate: markRead } = useMarkConversationRead();
  const { isConnected, startTyping, stopTyping, joinConversation, leaveConversation } =
    useSocket();

  // Join conversation room
  useEffect(() => {
    if (selectedId) {
      joinConversation(selectedId);
      markRead(selectedId);
      return () => leaveConversation(selectedId);
    }
  }, [selectedId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for new messages via socket
  useSocketEvent("message:new", (data: any) => {
    if (data.conversationId === selectedId) {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    }
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  });

  const handleSend = () => {
    if (!msgInput.trim() || !selectedId) return;
    const conversation = conversations.find((c) => c._id === selectedId);
    if (!conversation) return;

    sendMessage(
      {
        phone: conversation.contactPhone,
        contactId: conversation.contactId,
        content: msgInput.trim(),
      },
      {
        onSuccess: () => {
          setMsgInput("");
          toast.success("Message sent");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to send message");
        },
      }
    );
  };

  const selectedConv = conversations.find((c) => c._id === selectedId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-[calc(100vh-7.5rem)] gap-0 overflow-hidden rounded-xl glass-card stat-card-glow"
    >
      {/* Contact List */}
      <div className="flex w-80 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length > 0 ? (
            conversations.map((c, i) => (
              <div
                key={c._id || i}
                onClick={() => setSelectedId(c._id)}
                className={`flex cursor-pointer items-center gap-3 border-b border-border px-4 py-3 transition-colors ${selectedId === c._id ? "bg-secondary/50" : "hover:bg-secondary/20"}`}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {c.contactName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {c.contactName}
                    </span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {formatTime(c.lastMessageAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {typeof c.lastMessage === "object" && c.lastMessage !== null
                      ? c.lastMessage.content || "[Media]"
                      : c.lastMessage || "No messages yet"}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              No conversations found
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {selectedConv ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {selectedConv.contactName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedConv.contactName}
                  </p>
                  <p className="text-[10px] text-primary">
                    {isConnected ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-muted-foreground hover:text-foreground">
                  <Phone className="h-4 w-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {msgsLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length > 0 ? (
                messages.map((m, i) => (
                  <motion.div
                    key={m._id || i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`flex ${m.contactId === selectedConv.contactId ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-xl px-4 py-2.5 ${m.contactId === selectedConv.contactId ? "bg-secondary text-foreground" : "bg-primary/15 text-foreground"}`}
                    >
                      {/* Media content */}
                      {m.mediaUrl && (
                        <div className="mb-2 overflow-hidden rounded-lg">
                          {m.messageType === "image" ? (
                            <img
                              src={m.mediaUrl}
                              alt="Media"
                              className="max-h-48 w-full rounded-lg object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex items-center gap-2 rounded-lg bg-background/50 px-3 py-2">
                              <Paperclip className="h-4 w-4 text-primary" />
                              <span className="text-xs text-muted-foreground">
                                {m.fileName || "Attachment"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Template indicator */}
                      {m.templateId && !m.content && (
                        <p className="text-sm text-primary/80 italic">
                          [Template Message]
                        </p>
                      )}
                      {/* Message text */}
                      {m.content && (
                        <p className="text-sm">{m.content}</p>
                      )}
                      <div className="mt-1 flex items-center gap-1 justify-end">
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {formatTime(m.createdAt)}
                        </span>
                        {m.contactId !== selectedConv.contactId && (
                          <>
                            {m.status === "read" && (
                              <CheckCheck className="h-3 w-3 text-primary" />
                            )}
                            {m.status === "delivered" && (
                              <CheckCheck className="h-3 w-3 text-muted-foreground" />
                            )}
                            {m.status === "sent" && (
                              <Check className="h-3 w-3 text-muted-foreground" />
                            )}
                            {(m.status === "pending" || m.status === "queued") && (
                              <Clock className="h-3 w-3 text-muted-foreground" />
                            )}
                            {m.status === "failed" && (
                              <AlertTriangle className="h-3 w-3 text-destructive" />
                            )}
                            {!m.status && (
                              <Check className="h-3 w-3 text-muted-foreground" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No messages yet. Start the conversation!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2">
                <button className="text-muted-foreground hover:text-foreground">
                  <Smile className="h-4 w-4" />
                </button>
                <button className="text-muted-foreground hover:text-foreground">
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!msgInput.trim() || sending}
                  className="rounded-lg bg-primary p-2 text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440)
    return `${Math.floor(diffMins / 60)}h`;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
