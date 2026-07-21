import { motion } from "framer-motion";
import {
  Send,
  Paperclip,
  Loader2,
  Image,
  FileText,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { useState, useRef } from "react";
import { useSendMessage } from "@/hooks/useMessages";
import { useTemplates } from "@/hooks/useTemplates";
import { useUploadFile } from "@/hooks/useUploads";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "sonner";

type MediaType = "image" | "document" | "video" | "audio";

export default function SendMessage() {
  const [phone, setPhone] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: sendMessage, isPending: sending } = useSendMessage();
  const { data: templatesData } = useTemplates();
  const { mutate: uploadFile, isPending: uploading } = useUploadFile();
  const { data: contactsData } = useContacts({ limit: 100 });
  const contacts = contactsData?.contacts || [];
  const templates = templatesData?.templates || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine media type
    if (file.type.startsWith("image/")) {
      setMediaType("image");
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
    } else if (file.type.startsWith("audio/")) {
      setMediaType("audio");
    } else {
      setMediaType("document");
    }

    setMediaFile(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMediaPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!phone.trim() && !templateId) {
      toast.error("Please enter a phone number");
      return;
    }

    if (!message.trim() && !templateId && !mediaFile) {
      toast.error("Please enter a message, select a template, or attach media");
      return;
    }

    try {
      // Upload media first if present
      let mediaUrl: string | undefined;
      if (mediaFile) {
        const uploadResult = await uploadFile.mutateAsync({ file: mediaFile });
        mediaUrl = (uploadResult as any)?.data?.url || (uploadResult as any)?.url;
      }

      // Find or create contact by phone
      const existingContact = contacts.find(
        (c) => c.phone === phone.replace(/\s/g, "")
      );

      const payload: any = {
        phone: phone.replace(/\s/g, ""),
        contactId: existingContact?._id || "new",
        contactName: existingContact?.name || phone.replace(/\s/g, ""),
        content: message.trim() || undefined,
        templateId: templateId || undefined,
      };

      if (mediaUrl) {
        payload.mediaUrl = mediaUrl;
        payload.messageType = mediaType;
      }

      sendMessage(payload, {
        onSuccess: () => {
          toast.success("Message sent successfully!");
          setPhone("");
          setMessage("");
          setTemplateId("");
          clearMedia();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to send message");
        },
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to send message");
    }
  };

  const handlePhoneSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
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
        {/* Phone with autocomplete */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recipient Phone
          </label>
          <div className="relative">
            <input
              type="text"
              value={phone}
              onChange={handlePhoneSelect}
              placeholder="+919876543210"
              list="contact-suggestions"
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <datalist id="contact-suggestions">
              {contacts.map((c) => (
                <option key={c._id} value={c.phone}>
                  {c.name || c.phone}
                </option>
              ))}
            </datalist>
          </div>
          {phone && (
            <p className="text-xs text-muted-foreground">
              Sending to:{" "}
              {contacts.find((c) => c.phone === phone.replace(/\s/g, ""))?.name ||
                phone}
            </p>
          )}
        </div>

        {/* Template Selection */}
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
            {templates.length === 0 && (
              <option value="" disabled>
                No templates available — create one on Templates page
              </option>
            )}
            {templates.map((t: any) => (
              <option key={t._id} value={t._id}>
                {t.name}{t.language ? ` (${t.language})` : ""}
                {t.status !== "approved" ? ` — ${t.status}` : ""}
              </option>
            ))}
          </select>
          {templateId && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs text-primary">
                <Check className="h-3 w-3" />
                Template selected — message body will use template content
              </p>
              {templates.find((t: any) => t._id === templateId)?.body && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {
                    templates.find((t: any) => t._id === templateId)
                      ?.body
                  }
                </p>
              )}
            </div>
          )}
        </div>

        {/* Message Input */}
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
                ? "Template selected — message will use template body"
                : "Type your message here..."
            }
            disabled={!!templateId}
            className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground tabular-nums">
              {message.length}/4096 characters
            </p>
            {message.length > 4000 && (
              <p className="flex items-center gap-1 text-xs text-amber">
                <AlertCircle className="h-3 w-3" />
                Approaching limit
              </p>
            )}
          </div>
        </div>

        {/* Media Attachment */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Attachments
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Attach Media"}
            </button>
            <span className="text-xs text-muted-foreground">
              Image, video, audio, or document
            </span>
          </div>

          {/* Media Preview */}
          {mediaFile && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-lg border border-border bg-secondary/30 p-3"
            >
              <button
                onClick={clearMedia}
                className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-3">
                {/* Preview */}
                {mediaPreview ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                    {mediaType === "document" ? (
                      <FileText className="h-6 w-6 text-primary" />
                    ) : mediaType === "video" ? (
                      <Image className="h-6 w-6 text-primary" />
                    ) : (
                      <FileText className="h-6 w-6 text-primary" />
                    )}
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {mediaFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(mediaFile.size / 1024 / 1024).toFixed(2)} MB —{" "}
                    {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
                  </p>
                </div>

                {uploading && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || uploading || !phone.trim()}
          className="shimmer-btn w-full rounded-lg px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            {sending || uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending
              ? "Sending..."
              : uploading
                ? "Uploading media..."
                : "Dispatch Message"}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
