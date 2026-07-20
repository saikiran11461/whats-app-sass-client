import { motion } from "framer-motion";
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Loader2,
  CheckCheck,
  X,
  ImageIcon,
  VideoIcon,
  FileText,
  ExternalLink,
  Phone,
  MessageSquare,
  Upload,
  Smartphone,
} from "lucide-react";
import { useState, useRef } from "react";
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useCloneTemplate,
  type Template,
} from "@/hooks/useTemplates";
import { useUploadFile } from "@/hooks/useUploads";
import { toast } from "sonner";

const CATEGORIES = ["utility", "marketing", "authentication", "otp"] as const;
const LANGUAGES = ["English", "Hindi", "Spanish", "Arabic", "French", "German", "Portuguese"];

// ── Helpers ────────────────────────────────────

/** Safely extract the body string from a template record */
const getBody = (t: any): string => {
  const raw = t?.body ?? t?.content ?? "";
  if (raw && typeof raw === "object") return "";
  return String(raw);
};

/** Extract header content string from the header object (or string) */
const getHeaderContent = (t: any): string => {
  if (!t?.header) return "";
  const h = t.header;
  if (typeof h === "string") return h;
  if (typeof h === "object") {
    // Backend model: { type: 'text'|'image'|'video'|'document'|'none', content, mediaUrl }
    return h.content || "";
  }
  return "";
};

/** Extract header type string from the header object */
const getHeaderType = (t: any): string => {
  if (!t?.header) return "none";
  const h = t.header;
  if (typeof h === "object" && h.type) return h.type;
  return "text";
};

/** Extract header mediaUrl from the header object */
const getHeaderMediaUrl = (t: any): string | undefined => {
  if (!t?.header) return undefined;
  const h = t.header;
  if (typeof h === "object") return h.mediaUrl;
  return undefined;
};

// ── Style maps ─────────────────────────────────

const categoryClass: Record<string, string> = {
  marketing: "bg-indigo/10 text-indigo",
  utility: "bg-primary/10 text-primary",
  authentication: "bg-amber/10 text-amber",
  otp: "bg-emerald/10 text-emerald",
};

const statusClass: Record<string, string> = {
  approved: "bg-primary/10 text-primary",
  pending: "bg-amber/10 text-amber",
  rejected: "bg-destructive/10 text-destructive",
  disabled: "bg-secondary text-muted-foreground",
};

const buttonTypeIcon: Record<string, React.ReactNode> = {
  quick_reply: <MessageSquare className="h-3 w-3" />,
  url: <ExternalLink className="h-3 w-3" />,
  phone_number: <Phone className="h-3 w-3" />,
};

// ── Variable highlighter ───────────────────────

/** Highlight {{1}} style variables inside the template body */
function renderWithVariables(text: string) {
  if (!text) return null;
  const parts = text.split(/(\{\{\d+\}\})/g);
  return parts.map((part, i) =>
    /\{\{\d+\}\}/.test(part) ? (
      <span key={i} className="rounded bg-amber-100 px-1 font-semibold text-amber-700">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// ── WhatsApp-style preview ─────────────────────

/** Simulate a media placeholder for image/video/document headers */
function HeaderMediaPlaceholder({ headerType, url }: { headerType: string; url?: string }) {
  if (headerType === "none" || headerType === "text") return null;
  return (
    <div className="-mx-3 -mt-2 mb-2 overflow-hidden rounded-lg rounded-tl-none">
      {headerType === "image" && (
        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-pink-100 to-purple-200">
          {url ? (
            <img src={url} alt="header image" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <ImageIcon className="h-8 w-8 text-purple-400" />
              <span className="text-[9px] text-purple-500">Image header</span>
            </div>
          )}
        </div>
      )}
      {headerType === "video" && (
        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
          {url ? (
            <video src={url} controls className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <VideoIcon className="h-8 w-8 text-indigo-400" />
              <span className="text-[9px] text-indigo-500">Video header</span>
            </div>
          )}
        </div>
      )}
      {headerType === "document" && (
        <div className="flex h-16 items-center gap-2 bg-gradient-to-br from-orange-50 to-amber-100 px-3">
          <FileText className="h-6 w-6 text-amber-500" />
          <span className="text-xs font-medium text-amber-700">
            {url ? url.split("/").pop() || "document" : "document.pdf"}
          </span>
        </div>
      )}
    </div>
  );
}

/** WhatsApp-style phone preview of a template */
function TemplatePreview({
  name,
  headerType,
  headerContent,
  headerMediaUrl,
  body,
  footer,
  language,
  buttons,
  size = "md",
}: {
  name: string;
  headerType?: string;
  headerContent?: string;
  headerMediaUrl?: string;
  body: string;
  footer?: string;
  language?: string;
  buttons?: Array<{ type: string; text: string; url?: string; phoneNumber?: string }>;
  size?: "sm" | "md" | "lg";
}) {
  const hasButtons = buttons && buttons.length > 0;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClasses = {
    sm: "max-w-[240px]",
    md: "max-w-[300px]",
    lg: "max-w-[340px]",
  };

  return (
    <div className={`relative mx-auto w-full ${sizeClasses[size]}`}>
      {/* Phone outer frame */}
      <div className="overflow-hidden rounded-[28px] border-[3px] border-gray-800 bg-gray-800 shadow-xl">
        {/* Notch */}
        <div className="relative flex justify-center">
          <div className="absolute top-0 z-10 h-5 w-28 rounded-b-2xl bg-gray-800">
            <div className="mx-auto mt-1.5 h-2 w-16 rounded-full bg-gray-700" />
          </div>
        </div>
        {/* Chat header — WhatsApp green bar */}
        <div className="flex items-center gap-2 bg-[#075E54] px-3 py-2.5 pt-4 text-white">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold">
            {initials || "TP"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{name || "Template"}</p>
            <p className="text-[9px] opacity-80">{language || "English"}</p>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-400" />
          </div>
        </div>
        {/* Chat area — WhatsApp wallpaper style */}
        <div
          className="min-h-[240px] space-y-2 p-3"
          style={{ background: "linear-gradient(135deg, #ECE5DD 0%, #D9CFC1 100%)" }}
        >
          {/* Message bubble */}
          <div className="relative max-w-[88%] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
            {/* Media header placeholder */}
            <HeaderMediaPlaceholder headerType={headerType || "none"} url={headerMediaUrl} />
            {/* Text header */}
            {headerType === "text" && headerContent && (
              <p className="mb-1 text-sm font-semibold text-foreground">{headerContent}</p>
            )}
            {/* Body with variable highlighting */}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {renderWithVariables(body) || "Your message preview will appear here…"}
            </p>
            {/* Footer */}
            {footer && (
              <p className="mt-1 border-t border-gray-100 pt-1 text-[10px] text-muted-foreground">{footer}</p>
            )}
            {/* Timestamp + read receipt */}
            <div className="mt-1 flex items-center justify-end gap-1">
              <span className="text-[9px] text-muted-foreground">now</span>
              <CheckCheck className="h-3 w-3 text-[#53bdeb]" />
            </div>
          </div>
          {/* Buttons row */}
          {hasButtons && (
            <div className="max-w-[88%] space-y-1.5">
              {buttons!.map((btn, i) => (
                <div
                  key={i}
                  className="flex cursor-default items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                >
                  {buttonTypeIcon[btn.type] || <MessageSquare className="h-3 w-3" />}
                  {btn.text}
                </div>
              ))}
            </div>
          )}
          {/* Watermark */}
          <p className="px-1 pt-2 text-center text-[9px] text-muted-foreground/70">
            Template preview · not an actual message
          </p>
        </div>
        {/* Bottom bar */}
        <div className="flex justify-center bg-gray-800 py-1.5">
          <div className="h-1 w-28 rounded-full bg-gray-600" />
        </div>
      </div>
    </div>
  );
}

export default function Templates() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Template | null>(null);

  const [editorTemplate, setEditorTemplate] = useState<Template | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const { data, isLoading } = useTemplates({
    search: searchQuery || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const templates = data?.templates || [];

  const deleteTemplate = useDeleteTemplate();
  const cloneTemplate = useCloneTemplate();

  const handleDelete = (t: Template) => {
    deleteTemplate.mutate(t._id, {
      onSuccess: () => {
        toast.success("Template deleted");
        setConfirmDelete(null);
        if (previewTemplate?._id === t._id) setPreviewTemplate(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Delete failed");
        setConfirmDelete(null);
      },
    });
  };

  const handleClone = (t: Template) => {
    cloneTemplate.mutate(t._id, {
      onSuccess: () => toast.success(`Cloned "${t.name}"`),
      onError: (err: any) => toast.error(err?.response?.data?.message || "Clone failed"),
    });
  };

  const onEditFromPreview = () => {
    if (!previewTemplate) return;
    setEditorTemplate(previewTemplate);
    setPreviewTemplate(null);
    setShowCreate(true);
  };

  const onCloneFromPreview = () => {
    if (!previewTemplate) return;
    handleClone(previewTemplate);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your WhatsApp approved message templates
          </p>
        </div>
        <button
          onClick={() => {
            setEditorTemplate(null);
            setShowCreate(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Create Template
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
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

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap items-center gap-4 rounded-lg glass-card p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Category:</span>
            {["all", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {["all", "approved", "pending", "rejected"].map((s) => (
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
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.length > 0 ? (
            templates.map((t, i) => (
              <motion.div
                key={t._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl glass-card stat-card-glow p-5 hover-lift"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground">{t.name}</h3>
                    <span
                      className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        categoryClass[t.category] || "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {t.category}
                    </span>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      statusClass[t.status] || "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">
                  {getBody(t)}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Language
                    </span>
                    <p className="text-xs text-foreground">{t.language || "English"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Uses
                    </span>
                    <p className="text-xs tabular-nums text-foreground">
                      {t.usageCount?.toLocaleString() || t.totalUses?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 border-t border-border pt-3">
                  <button
                    onClick={() => setPreviewTemplate(t)}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                  <button
                    onClick={() => {
                      setEditorTemplate(t);
                      setShowCreate(true);
                    }}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleClone(t)}
                    disabled={cloneTemplate.isPending}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    <Copy className="h-3 w-3" /> Clone
                  </button>
                  <button
                    onClick={() => setConfirmDelete(t)}
                    className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No templates found. Create your first template to get started.
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal with live preview */}
      {showCreate && (
        <TemplateEditorModal
          template={editorTemplate}
          onClose={() => {
            setShowCreate(false);
            setEditorTemplate(null);
          }}
        />
      )}

      {/* Preview Modal — full WhatsApp preview with actions */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          onClick={() => setPreviewTemplate(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="w-full max-w-md rounded-2xl glass-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with title + close */}
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{previewTemplate.name}</h2>
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                      statusClass[previewTemplate.status] || "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {previewTemplate.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {previewTemplate.category} · {previewTemplate.language || "English"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* WhatsApp phone mockup */}
            <div className="flex justify-center">
              <TemplatePreview
                size="md"
                name={previewTemplate.name}
                headerType={getHeaderType(previewTemplate)}
                headerContent={getHeaderContent(previewTemplate)}
                headerMediaUrl={getHeaderMediaUrl(previewTemplate)}
                body={getBody(previewTemplate)}
                footer={previewTemplate.footer || undefined}
                language={previewTemplate.language || "English"}
                buttons={previewTemplate.buttons as any[]}
              />
            </div>

            {/* Template info */}
            {previewTemplate.rejectionReason && (
              <div className="mt-4 rounded-lg bg-destructive/10 p-3">
                <p className="text-xs font-medium text-destructive">Rejection Reason:</p>
                <p className="mt-0.5 text-xs text-destructive/80">{previewTemplate.rejectionReason}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
              <button
                onClick={onEditFromPreview}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                onClick={onCloneFromPreview}
                disabled={cloneTemplate.isPending}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" /> {cloneTemplate.isPending ? "Cloning…" : "Clone"}
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(previewTemplate);
                  setPreviewTemplate(null);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-xl glass-card p-6 shadow-xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Delete Template</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Are you sure you want to delete "{confirmDelete.name}"? This cannot be undone.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteTemplate.isPending}
                className="flex-1 rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {deleteTemplate.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function TemplateEditorModal({
  template,
  onClose,
}: {
  template: Template | null;
  onClose: () => void;
}) {
  const isEdit = !!template;

  // Initialise header fields: backend stores header as { type, content, mediaUrl }
  const initialHeaderType = template ? getHeaderType(template) : "none";
  const initialHeaderContent = template ? getHeaderContent(template) : "";

  const [form, setForm] = useState({
    name: template?.name || "",
    body: getBody(template || ({} as Template)),
    headerType: initialHeaderType as string,
    headerContent: initialHeaderContent,
    footer: template?.footer || "",
    category: (template?.category || "utility") as string,
    language: template?.language || "English",
  });

  const [buttons, setButtons] = useState<Array<{
    type: string;
    text: string;
    url?: string;
    phoneNumber?: string;
  }>>(template?.buttons || []);

  const [uploading, setUploading] = useState(false);
  const uploadFile = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const saving = createTemplate.isPending || updateTemplate.isPending;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile.mutateAsync({ file });
      const uploadedUrl = result.data?.url;
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, headerContent: uploadedUrl }));
        toast.success("Media uploaded!");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error("Name and message are required");
      return;
    }

    // Build header object matching backend schema
    let headerPayload: any = { type: "none" };
    if (form.headerType !== "none" && form.headerContent.trim()) {
      headerPayload = {
        type: form.headerType,
        content: form.headerContent.trim(),
      };
      // If media type and it's a local path, also set mediaUrl
      if (["image", "video", "document"].includes(form.headerType)) {
        headerPayload.mediaUrl = form.headerContent.trim();
      }
    }

    const payload: any = {
      name: form.name.trim(),
      body: form.body,
      header: headerPayload,
      footer: form.footer.trim() || undefined,
      category: form.category,
      language: form.language,
      channel: "whatsapp",
      buttons: buttons.length > 0 ? buttons : undefined,
    };

    if (isEdit && template) {
      updateTemplate.mutate(
        { id: template._id, data: payload },
        {
          onSuccess: () => {
            toast.success("Template updated!");
            onClose();
          },
          onError: (err: any) => toast.error(err?.response?.data?.message || "Update failed"),
        }
      );
    } else {
      createTemplate.mutate(payload, {
        onSuccess: () => {
          toast.success("Template created!");
          onClose();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Create failed"),
      });
    }
  };

  const addButton = () => {
    setButtons([...buttons, { type: "quick_reply", text: "" }]);
  };

  const updateButton = (i: number, field: string, value: string) => {
    const copy = [...buttons];
    (copy[i] as any)[field] = value;
    setButtons(copy);
  };

  const removeButton = (i: number) => {
    setButtons(buttons.filter((_, idx) => idx !== i));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl glass-card lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Form side */}
        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {isEdit ? "Edit Template" : "Create Template"}
            </h3>
            <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Template Name */}
          <input
            placeholder="Template Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />

          {/* Category + Language */}
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Header type selector */}
          <div>
            <div className="flex gap-2">
              <select
                value={form.headerType}
                onChange={(e) => setForm({ ...form, headerType: e.target.value })}
                className="w-32 rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm text-foreground focus:outline-none"
              >
                <option value="none">No header</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
              </select>
              {form.headerType !== "none" && form.headerType === "text" && (
                <input
                  placeholder="Header text"
                  value={form.headerContent}
                  onChange={(e) => setForm({ ...form, headerContent: e.target.value })}
                  className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              )}
              {(form.headerType === "image" || form.headerType === "video" || form.headerType === "document") && (
                <div className="flex flex-1 gap-1.5">
                  <input
                    placeholder={
                      form.headerType === "image"
                        ? "Image URL"
                        : form.headerType === "video"
                        ? "Video URL"
                        : "Document URL"
                    }
                    value={form.headerContent}
                    onChange={(e) => setForm({ ...form, headerContent: e.target.value })}
                    className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={form.headerType === "image" ? "image/*" : form.headerType === "video" ? "video/*" : ".pdf,.doc,.docx"}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Upload
                  </button>
                </div>
              )}
            </div>
            {/* Show thumbnail for image */}
            {form.headerType === "image" && form.headerContent && (
              <div className="mt-2 overflow-hidden rounded-lg border border-border">
                <img
                  src={form.headerContent}
                  alt="header preview"
                  className="h-20 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Message Body */}
          <textarea
            placeholder="Message body — use {{1}}, {{2}} for variables"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={5}
            className="w-full resize-none rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />

          {/* Footer */}
          <input
            placeholder="Footer (optional, max 60 chars)"
            value={form.footer}
            onChange={(e) =>
              setForm({ ...form, footer: e.target.value.slice(0, 60) })
            }
            maxLength={60}
            className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
          />

          {/* Buttons section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Buttons (optional)</span>
              {buttons.length < 3 && (
                <button
                  onClick={addButton}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Add Button
                </button>
              )}
            </div>
            {buttons.map((btn, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <select
                  value={btn.type}
                  onChange={(e) => updateButton(i, "type", e.target.value)}
                  className="w-28 rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="quick_reply">Reply</option>
                  <option value="url">URL</option>
                  <option value="phone_number">Call</option>
                </select>
                <input
                  placeholder="Button text"
                  value={btn.text}
                  onChange={(e) => updateButton(i, "text", e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {btn.type === "url" && (
                  <input
                    placeholder="https://…"
                    value={btn.url || ""}
                    onChange={(e) => updateButton(i, "url", e.target.value)}
                    className="w-28 rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                )}
                {btn.type === "phone_number" && (
                  <input
                    placeholder="+123456789"
                    value={btn.phoneNumber || ""}
                    onChange={(e) => updateButton(i, "phoneNumber", e.target.value)}
                    className="w-28 rounded-lg border border-border bg-secondary/50 px-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                )}
                <button
                  onClick={() => removeButton(i)}
                  className="rounded p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </div>

        {/* Live preview side */}
        <div className="flex items-center justify-center border-t border-border bg-secondary/30 p-6 lg:border-l lg:border-t-0">
          <TemplatePreview
            size="md"
            name={form.name}
            headerType={form.headerType}
            headerContent={form.headerType === "text" ? form.headerContent : ""}
            headerMediaUrl={form.headerType !== "none" && form.headerType !== "text" ? form.headerContent : undefined}
            body={form.body}
            footer={form.footer}
            language={form.language}
            buttons={buttons.filter((b) => b.text.trim())}
          />
        </div>
      </motion.div>
    </div>
  );
}
