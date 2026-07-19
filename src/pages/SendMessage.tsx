import { motion } from "framer-motion";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSendMessage } from "@/hooks/useMessages";
import { useTemplates } from "@/hooks/useTemplates";
import { toast } from "sonner";

export default function SendMessage() {
  const [phone, setPhone] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [message, setMessage] = useState("");
  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { data: templatesData } = useTemplates({ status: "approved" });
  const templates = templatesData?.templates || [];

  const handleSend = () => {
    if (!phone.trim() || (!message.trim() && !templateId)) {
      toast.error("Please enter a phone number and message");
      return;
    }

    sendMessage(
      {
        phone: phone.replace(/\s/g, ""),
        contactId: "new",
        content: message.trim() || undefined,
        templateId: templateId || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Message sent successfully!");
          setPhone("");
          setMessage("");
          setTemplateId("");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to send message");
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Send Message
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dispatch a single WhatsApp message to a contact
        </p>
      </div>

      <div className="rounded-xl glass-card stat-card-glow p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recipient Phone
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
            className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Template (Optional)
          </label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
          >
            <option value="">Select a template...</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.language})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={
              templateId
                ? "Template selected - message will use template body"
                : "Type your message here..."
            }
            disabled={!!templateId}
            className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none disabled:opacity-50"
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            {message.length}/4096 characters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Paperclip className="h-4 w-4" />
            Attach Media
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !phone.trim()}
          className="shimmer-btn w-full rounded-lg px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending ? "Sending..." : "Dispatch Message"}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
