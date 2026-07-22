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
  SendToBack,
  RefreshCw,
  BadgeCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  TimerReset,
  Variable as VariableIcon,
  ShieldAlert,
  HelpCircle,
  ArrowUpRight,
  Info,
  Timer,
  ThumbsUp,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  useTemplates,
  useMetaApprovedTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useCloneTemplate,
  useSubmitToMeta,
  useSyncWithMeta,
  useBulkSyncWithMeta,
  type Template,
  type MetaApprovedTemplate,
} from "@/hooks/useTemplates";
import { useSocketEvent } from "@/hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api";
import { useUploadFile } from "@/hooks/useUploads";
import { extractTemplateVariables } from "@/lib/template-utils";
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

// ── Business Account Verification Banner ────────

function BusinessAccountBanner() {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-amber-900">
              Business Account Not Verified
            </h3>
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-800">
              Slower Approval
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            Your WhatsApp Business Account is <strong>not yet verified</strong> with Meta. 
            This means templates go through a <strong>manual review queue</strong> that can take 
            <strong> from minutes to 24 hours</strong>. Once your business is verified, templates 
            are typically auto-approved within seconds.
          </p>
          
          {/* Toggle details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 flex items-center gap-1 text-[10px] font-medium text-amber-700 hover:text-amber-900 transition-colors"
          >
            <Info className="h-3 w-3" />
            {showDetails ? 'Hide details' : 'Show what this means for you'}
          </button>
          
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 space-y-1.5"
            >
              <div className="rounded-lg border border-amber-200 bg-white/60 p-2.5 space-y-2">
                <div className="flex items-start gap-2">
                  <Timer className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-[10px] font-semibold text-amber-900">Review Timeline</p>
                    <p className="text-[9px] leading-relaxed text-amber-700">
                      Simple templates (utility, no variables, clear text): auto-reviewed within minutes.<br />
                      Complex templates (marketing, variables, media): 1-24 hours manual review.<br />
                      Verified accounts: auto-approved within seconds.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ThumbsUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-[10px] font-semibold text-amber-900">How to Speed Up Approval</p>
                    <p className="text-[9px] leading-relaxed text-amber-700">
                      1. Verify your business at{' '}
                      <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" 
                         className="underline hover:text-amber-900">
                        business.facebook.com/settings
                      </a><br />
                      2. Use UTILITY category (marketing takes longer)<br />
                      3. Provide real example values for all variables<br />
                      4. Keep body text simple and non-promotional<br />
                      5. Don't start or end a message with a variable
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                  <div>
                    <p className="text-[10px] font-semibold text-green-800">Already Approved (on this account)</p>
                    <p className="text-[9px] leading-relaxed text-green-700">
                      Templates like <strong>"hello_world"</strong> were previously approved on this account. 
                      Approval IS possible — it just takes time for new templates to go through review.
                    </p>
                  </div>
                </div>
              </div>
          </motion.div>
        )}
      </div>
        <a
          href="https://business.facebook.com/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg bg-amber-200 px-3 py-2 text-[10px] font-semibold text-amber-800 hover:bg-amber-300 transition-colors flex items-center gap-1"
        >
          Verify Now
          <ArrowUpRight className="h-3 w-3" />
        </a>
      </div>
    </motion.div>
  );
}

// ── Status Explanation Tooltip ──────────────────

const statusExplanations: Record<string, {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  steps: string[];
}> = {
  pending: {
    title: 'Pending Review',
    description: 'Your template has been submitted to Meta for review. It will go through automated checks and then manual review if needed.',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-amber',
    steps: [
      'Meta reviews the template content and variables',
      'If approved: status changes to APPROVED (you can send it)',
      'If rejected: status changes to REJECTED with a reason',
      'Typical review time: 5 minutes to 24 hours',
      'Verify your business for faster approvals',
    ],
  },
  approved: {
    title: 'Approved by Meta',
    description: 'Your template has been approved by Meta and is ready to send to your contacts.',
    icon: <BadgeCheck className="h-4 w-4" />,
    color: 'text-primary',
    steps: [
      'Template is ready to use in campaigns and messages',
      'You can send it to any opted-in contact',
      'Quality rating may still be "Pending" initially',
      'Template will continue to be monitored for quality',
    ],
  },
  rejected: {
    title: 'Rejected by Meta',
    description: 'Meta rejected your template. Check the rejection reason below and fix the issues.',
    icon: <X className="h-4 w-4" />,
    color: 'text-destructive',
    steps: [
      'Read the rejection reason in the red banner below',
      'Click "Edit" to fix the template based on the reason',
      'Click "Submit to Meta" to re-submit for review',
      'Common issues: missing variable examples, policy violations, poor formatting',
    ],
  },
};

function StatusExplanation({ status, rejectionReason }: { status: string; rejectionReason?: string }) {
  const [show, setShow] = useState(false);
  const info = statusExplanations[status];
  if (!info) return null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-medium uppercase tracking-wider transition-colors ${
          status === 'pending'
            ? 'text-amber hover:bg-amber/10'
            : status === 'approved'
              ? 'text-primary hover:bg-primary/10'
              : 'text-destructive hover:bg-destructive/10'
        }`}
      >
        <HelpCircle className="h-3 w-3" />
        What does this mean?
      </button>
      
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setShow(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-80 rounded-xl border border-border bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="flex items-center gap-2 mb-2">
            <div className={`${info.color}`}>{info.icon}</div>
            <p className="text-xs font-bold text-foreground">{info.title}</p>
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground mb-2.5">
            {info.description}
          </p>
          {rejectionReason && (
            <div className="mb-2.5 rounded-md bg-destructive/10 p-2">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-destructive">Rejection Reason</p>
              <p className="mt-0.5 text-[10px] text-destructive/80">{rejectionReason}</p>
            </div>
          )}
          <ul className="space-y-1">
            {info.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[9px] text-muted-foreground">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
          {status === 'pending' && (
            <div className="mt-2 rounded-md bg-amber/10 p-2">
              <p className="text-[9px] font-semibold text-amber-800">⏳ Typical wait: 5 min - 24 hours</p>
              <p className="text-[8px] text-amber-700 mt-0.5">
                Verify your business with Meta for auto-approval within seconds.
              </p>
            </div>
          )}
        </motion.div>
        </div>
      )}
    </div>
  );
}

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

// ── Meta Approved Example Template Card ─────────

/** Render a Meta-approved template as a read-only reference card */
function MetaApprovedExampleCard({ template, index }: { template: MetaApprovedTemplate; index: number }) {
  // Extract body text from components
  const getBodyFromComponents = (): string => {
    const bodyComp = template.components?.find((c: any) => c.type === 'BODY');
    return bodyComp?.text || '';
  };

  // Extract header info
  const getHeaderInfo = (): { type: string; text: string } => {
    const header = template.components?.find((c: any) => c.type === 'HEADER');
    if (!header) return { type: 'none', text: '' };
    return { type: (header.format || 'text').toLowerCase(), text: header.text || '' };
  };

  // Extract buttons
  const getButtons = (): Array<{ type: string; text: string; url?: string }> => {
    const buttonsComp = template.components?.find((c: any) => c.type === 'BUTTONS');
    return buttonsComp?.buttons?.map((b: any) => ({
      type: (b.type || 'quick_reply').toLowerCase(),
      text: b.text || '',
      url: b.url || b.phone_number,
    })) || [];
  };

  // Extract footer
  const getFooter = (): string => {
    const footerComp = template.components?.find((c: any) => c.type === 'FOOTER');
    return footerComp?.text || '';
  };

  const headerInfo = getHeaderInfo();
  const bodyText = getBodyFromComponents();
  const buttons = getButtons();
  const footer = getFooter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-lg border border-primary/10 bg-white p-3 hover:border-primary/30 hover:shadow-sm transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
            <BadgeCheck className="h-3 w-3 text-primary" />
          </div>
          <p className="text-[11px] font-semibold text-foreground truncate">{template.name}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-primary">
            {template.category}
          </span>
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber/10" title="Protected - Read only">
            <ShieldAlert className="h-2.5 w-2.5 text-amber" />
          </div>
        </div>
      </div>

      {/* Components breakdown */}
      <div className="space-y-1">
        {headerInfo.type !== 'none' && headerInfo.type !== 'text' && (
          <div className="flex items-center gap-1">
            <ImageIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">{headerInfo.type} header</span>
          </div>
        )}
        {headerInfo.type === 'text' && headerInfo.text && (
          <p className="text-[10px] font-semibold text-foreground leading-relaxed truncate">
            {headerInfo.text}
          </p>
        )}
        <p className="text-[9px] text-muted-foreground leading-relaxed line-clamp-2">
          {renderWithVariables(bodyText) || <span className="italic">No body text</span>}
        </p>
        {footer && (
          <p className="text-[8px] text-muted-foreground/70 italic">{footer}</p>
        )}
        {buttons.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {buttons.map((btn, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-[7px] font-medium text-muted-foreground">
                {btn.type === 'url' ? <ExternalLink className="h-2 w-2" /> : btn.type === 'phone_number' ? <Phone className="h-2 w-2" /> : <MessageSquare className="h-2 w-2" />}
                {btn.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Language + Protected badge */}
      <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-1.5">
        <span className="text-[8px] text-muted-foreground">
          {template.language} · Approved by Meta
        </span>
        <span className="flex items-center gap-0.5 text-[7px] text-amber bg-amber/5 rounded px-1 py-0.5">
          <ShieldAlert className="h-2 w-2" />
          Protected
        </span>
      </div>
    </motion.div>
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
  const queryClient = useQueryClient();

  const { data, isLoading } = useTemplates({
    search: searchQuery || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const templates = data?.templates || [];

  const deleteTemplate = useDeleteTemplate();
  const cloneTemplate = useCloneTemplate();
  const submitToMeta = useSubmitToMeta();
  const syncWithMeta = useSyncWithMeta();
  const bulkSyncWithMeta = useBulkSyncWithMeta();
  const { data: metaApproved = [], isLoading: loadingMetaApproved } = useMetaApprovedTemplates();
  const [showMetaExamples, setShowMetaExamples] = useState(false);

  // ── Real-time template status updates via socket ──
  // When template status changes (approved → rejected → pending), auto-refresh the list
  // and show animated status transitions (like WATI/Interakt/Respond.io)
  const [statusTransition, setStatusTransition] = useState<{
    name: string;
    oldStatus?: string;
    newStatus: string;
    reason?: string;
  } | null>(null);

  useSocketEvent("template:status:update", (data: any) => {
    // Track the previous status from the current data before refresh
    // Normalize both old and new status to lowercase for comparison
    // (Meta webhook sends UPPERCASE like "APPROVED", while DB stores lowercase like "approved")
    const existing = templates.find((t: any) => t.name === data?.name || t._id === data?.templateId);
    const oldStatus = (existing?.status || "").toLowerCase();
    const newStatus = (data?.status || data?.providerStatus || "").toLowerCase();

    // Show status transition animation only if status actually changed
    if (oldStatus && newStatus && oldStatus !== newStatus) {
      setStatusTransition({
        name: data?.name || "",
        oldStatus,
        newStatus,
        reason: data?.rejectionReason,
      });
      // Clear transition after animation completes
      setTimeout(() => setStatusTransition(null), 4000);
    }

    queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });

    // Rich notifications with status-specific icons
    // Note: newStatus is already lowercased above for consistent comparison
    if (newStatus === "approved") {
      toast.success(`✅ Template "${data.name}" was approved by Meta!`, {
        description: "You can now send this template to your contacts",
        duration: 5000,
      });
    } else if (newStatus === "rejected") {
      toast.error(`❌ Template "${data.name}" was rejected by Meta`, {
        description: data?.rejectionReason ? `Reason: ${data.rejectionReason}` : "Check the rejection reason for details",
        duration: 8000,
      });
    } else if (newStatus === "pending") {
      toast.info(`⏳ Template "${data.name}" is pending review`, {
        description: "Meta is reviewing your template",
        duration: 4000,
      });
    }
  });

  // Listen for auto-sync events from the backend cron job
  const [autoSyncStatus, setAutoSyncStatus] = useState<{
    status: 'idle' | 'syncing' | 'completed' | 'error';
    lastSync?: string;
    message?: string;
    templatesChecked?: number;
    templatesUpdated?: number;
  }>({ status: 'idle' });

  useSocketEvent("template:auto-sync:start", (data: any) => {
    setAutoSyncStatus({
      status: 'syncing',
      message: data?.message || 'Auto-syncing templates with Meta...',
    });
  });

  useSocketEvent("template:auto-sync:complete", (data: any) => {
    setAutoSyncStatus({
      status: 'completed',
      lastSync: new Date().toISOString(),
      message: data?.message || 'Auto-sync completed',
      templatesChecked: data?.checked || 0,
      templatesUpdated: data?.updated || 0,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    // Show toast only if templates were actually updated
    if (data?.updated > 0) {
      toast.success(`🔄 Auto-sync: ${data.updated} template(s) updated`, {
        description: data.message,
        duration: 4000,
      });
    }
    // Clear status after 10 seconds
    setTimeout(() => setAutoSyncStatus({ status: 'idle' }), 10000);
  });

  useSocketEvent("template:auto-sync:error", (data: any) => {
    setAutoSyncStatus({
      status: 'error',
      lastSync: new Date().toISOString(),
      message: data?.message || 'Auto-sync failed',
    });
    setTimeout(() => setAutoSyncStatus({ status: 'idle' }), 15000);
  });

  // Calculate pending count for auto-sync status
  const pendingTemplates = templates.filter((t: any) => t.status === 'pending' || t.status === 'draft').length;
  const approvedTemplates = templates.filter((t: any) => t.status === 'approved').length;

  // When template is submitted to Meta
  useSocketEvent("template:submitted", (data: any) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    toast.success(`📤 Template "${data.name}" submitted to Meta for review`, {
      duration: 4000,
    });
  });

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              bulkSyncWithMeta.mutate(undefined, {
                onSuccess: (res: any) => {
                  const count = res?.data?.length || 0;
                  toast.success(`Synced ${count} template(s) with Meta`);
                },
                onError: (err: any) => toast.error(err?.response?.data?.message || "Sync failed"),
              });
            }}
            disabled={bulkSyncWithMeta.isPending}
            className="flex items-center gap-2 rounded-lg border border-primary/30 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
            title="Sync all template statuses from Meta Cloud API"
          >
            <RefreshCw className={`h-4 w-4 ${bulkSyncWithMeta.isPending ? "animate-spin" : ""}`} />
            Sync from Meta
          </button>
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
      </div>

      {/* Business Account Verification Banner */}
      <BusinessAccountBanner />

      {/* Auto-sync status bar */}
      {autoSyncStatus.status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border px-4 py-2.5 text-sm ${
            autoSyncStatus.status === 'syncing'
              ? 'border-primary/30 bg-primary/5 text-primary'
              : autoSyncStatus.status === 'completed'
                ? 'border-primary/30 bg-primary/5 text-primary'
                : 'border-destructive/30 bg-destructive/5 text-destructive'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {autoSyncStatus.status === 'syncing' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : autoSyncStatus.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="font-medium">
                {autoSyncStatus.message || (autoSyncStatus.status === 'syncing' ? 'Syncing templates with Meta...' : 'Sync complete')}
              </span>
              {autoSyncStatus.templatesChecked !== undefined && (
                <span className="text-xs opacity-75">
                  Checked {autoSyncStatus.templatesChecked} template(s)
                  {autoSyncStatus.templatesUpdated > 0 && `, ${autoSyncStatus.templatesUpdated} updated`}
                </span>
              )}
            </div>
            {autoSyncStatus.lastSync && (
              <span className="text-[10px] opacity-60 tabular-nums">
                {new Date(autoSyncStatus.lastSync).toLocaleTimeString()}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Template Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-lg glass-card px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-0.5 text-lg font-bold text-foreground tabular-nums">{templates.length}</p>
        </div>
        <div className="rounded-lg glass-card px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <BadgeCheck className="mr-1 inline h-3 w-3 text-primary" />
            Approved
          </p>
          <p className="mt-0.5 text-lg font-bold text-primary tabular-nums">{approvedTemplates}</p>
        </div>
        <div className="rounded-lg glass-card px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <RefreshCw className="mr-1 inline h-3 w-3 text-amber" />
            Pending
          </p>
          <p className="mt-0.5 text-lg font-bold text-amber tabular-nums">{pendingTemplates}</p>
        </div>
        <div className="rounded-lg glass-card px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <History className="mr-1 inline h-3 w-3 text-muted-foreground" />
            Sync
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {autoSyncStatus.lastSync
              ? new Date(autoSyncStatus.lastSync).toLocaleTimeString()
              : 'Auto'}
          </p>
        </div>
      </div>

      {/* ── Approved Example Templates from Meta ── */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/[0.02] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Example Templates from Meta</h3>
              {!loadingMetaApproved && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
                  {metaApproved.length} approved
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              These are read-only templates approved by Meta on this account. Use them as reference to create your own.
            </p>
          </div>
          <button
            onClick={() => setShowMetaExamples(!showMetaExamples)}
            className="flex items-center gap-1.5 rounded-lg border border-primary/20 px-3 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            {showMetaExamples ? 'Hide' : 'Show Examples'}
          </button>
        </div>

        {showMetaExamples && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            {loadingMetaApproved ? (
              <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading approved templates from Meta...
              </div>
            ) : metaApproved.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {metaApproved.map((tmpl: MetaApprovedTemplate, i: number) => (
                  <MetaApprovedExampleCard key={tmpl.id} template={tmpl} index={i} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-secondary/50 px-3 py-4 text-center text-[10px] text-muted-foreground">
                No approved templates found on this Meta account.
              </div>
            )}
          </motion.div>
        )}
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
                  <div className="flex items-start gap-1 shrink-0">
                    <StatusExplanation status={t.status} rejectionReason={t.rejectionReason} />
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        statusClass[t.status] || "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">
                  {getBody(t)}
                </p>
                {/* Show rejection reason for rejected templates */}
                {t.status === 'rejected' && t.rejectionReason && (
                  <div className="mt-2 rounded-md bg-destructive/10 p-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-destructive">
                      Rejection Reason
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-destructive/80">
                      {t.rejectionReason}
                    </p>
                  </div>
                )}
                {/* Show submission error for pending templates */}
                {t.status === 'pending' && t.error && (
                  <div className="mt-2 rounded-md bg-amber/10 p-2">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-amber">
                      Submission Issue
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-amber/80">
                      {t.error}
                    </p>
                  </div>
                )}
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
                  {/* Submit to Meta button — like WATI/Respond.io */}
                  {t.status !== "approved" && (
                    <button
                      onClick={() =>
                        submitToMeta.mutate(t._id, {
                          onSuccess: () => toast.success(`"${t.name}" submitted to Meta for approval`),
                          onError: (err: any) => toast.error(err?.response?.data?.message || "Submit failed"),
                        })
                      }
                      disabled={submitToMeta.isPending}
                      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                      title="Submit this template to Meta Cloud API for approval"
                    >
                      {submitToMeta.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <SendToBack className="h-3 w-3" />
                      )}
                      Submit to Meta
                    </button>
                  )}
                  <button
                    onClick={() => {
                      syncWithMeta.mutate(t._id, {
                        onSuccess: (res: any) => {
                          if (res?.data?.status === "approved") {
                            toast.success(`"${t.name}" is approved by Meta!`);
                          } else {
                            toast.success(`Status synced: ${res?.data?.status || t.status}`);
                          }
                        },
                        onError: (err: any) => toast.error(err?.response?.data?.message || "Sync failed"),
                      });
                    }}
                    disabled={syncWithMeta.isPending}
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition-colors"
                    title="Sync template status from Meta"
                  >
                    <RefreshCw className={`h-3 w-3 ${syncWithMeta.isPending ? "animate-spin" : ""}`} />
                  </button>
                  {t.status === "approved" && (
                    <span className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-primary bg-primary/5">
                      <BadgeCheck className="h-3 w-3" />
                      Approved
                    </span>
                  )}
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

      {/* Status Transition Animation — like WATI/Respond.io real-time status updates */}
      {statusTransition && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed right-6 top-6 z-[70] overflow-hidden rounded-xl border border-border bg-white shadow-2xl"
        >
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Status change icon */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  statusTransition.newStatus === "approved"
                    ? "bg-primary/10 text-primary"
                    : statusTransition.newStatus === "rejected"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-amber/10 text-amber"
                }`}
              >
                {statusTransition.newStatus === "approved" ? (
                  <BadgeCheck className="h-5 w-5" />
                ) : statusTransition.newStatus === "rejected" ? (
                  <X className="h-5 w-5" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {statusTransition.name}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                  {/* Old status badge */}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      statusClass[statusTransition.oldStatus || "pending"] || "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {statusTransition.oldStatus || "pending"}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  {/* New status badge */}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      statusClass[statusTransition.newStatus] || "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {statusTransition.newStatus}
                  </span>
                </div>
                {statusTransition.reason && (
                  <p className="mt-0.5 text-[10px] text-destructive">
                    {statusTransition.reason}
                  </p>
                )}
              </div>
            </div>
            {/* Progress bar for auto-dismiss */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4, ease: "linear" }}
              className={`mt-2 h-0.5 rounded-full ${
                statusTransition.newStatus === "approved"
                  ? "bg-primary"
                  : statusTransition.newStatus === "rejected"
                    ? "bg-destructive"
                    : "bg-amber"
              }`}
            />
          </div>
        </motion.div>
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
              {/* Submit to Meta - only shown when not yet approved */}
              {previewTemplate.status !== "approved" && (
                <button
                  onClick={() =>
                    submitToMeta.mutate(previewTemplate._id, {
                      onSuccess: () => {
                        toast.success(`"${previewTemplate.name}" submitted to Meta for approval`);
                        setPreviewTemplate(null);
                      },
                      onError: (err: any) => toast.error(err?.response?.data?.message || "Submit failed"),
                    })
                  }
                  disabled={submitToMeta.isPending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 px-3 py-2.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
                >
                  {submitToMeta.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <SendToBack className="h-3.5 w-3.5" />
                  )}
                  {submitToMeta.isPending ? "Submitting…" : "Submit to Meta"}
                </button>
              )}
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

  // ── Variable Declarations ──
  // Extract {{N}} placeholders FROM THE BODY TEXT using shared utility
  // Users can then give each variable a NAME and EXAMPLE VALUE
  const detectedVars = extractTemplateVariables(form.body);

  // Initialize variable declarations from existing template data or defaults
  const [variableDeclarations, setVariableDeclarations] = useState<Record<string, {
    label: string;      // e.g., "Customer Name"
    example: string;    // e.g., "John"
  }>>(() => {
    if (template?.variables) {
      const vars: Record<string, any> = {};
      template.variables.forEach((v: any) => {
        vars[String(v.name)] = {
          label: v.name === '1' ? 'Customer Name' : v.name === '2' ? 'Order ID' : v.name === '3' ? 'Date' : `Variable ${v.name}`,
          example: v.example || '',
        };
      });
      return vars;
    }
    return {};
  });

  // Sync variable declarations when body changes (keep in sync with detected variables)
  useEffect(() => {
    setVariableDeclarations((prev) => {
      const updated = { ...prev };
      // Add new detected vars with defaults
      detectedVars.forEach((v) => {
        if (!updated[String(v)]) {
          const labels: Record<number, string> = { 1: 'Customer Name', 2: 'Order ID', 3: 'Date', 4: 'Time', 5: 'Amount' };
          updated[String(v)] = { label: labels[v] || `Variable ${v}`, example: '' };
        }
      });
      // Remove vars that are no longer in body
      Object.keys(updated).forEach((k) => {
        if (!detectedVars.includes(parseInt(k))) delete updated[k];
      });
      return updated;
    });
  }, [form.body]);

  const handleVarLabelChange = (varNum: string, label: string) => {
    setVariableDeclarations((prev) => ({
      ...prev,
      [varNum]: { ...prev[varNum], label },
    }));
  };

  const handleVarExampleChange = (varNum: string, example: string) => {
    setVariableDeclarations((prev) => ({
      ...prev,
      [varNum]: { ...prev[varNum], example },
    }));
  };

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

    // Build variables array from declarations
    const payloadVariables = detectedVars.length > 0
      ? detectedVars.map((v) => ({
          name: String(v),
          type: 'text',
          label: variableDeclarations[String(v)]?.label || '',
          example: variableDeclarations[String(v)]?.example || '',
        }))
      : undefined;

    const payload: any = {
      name: form.name.trim(),
      body: form.body,
      header: headerPayload,
      footer: form.footer.trim() || undefined,
      category: form.category,
      language: form.language,
      channel: "whatsapp",
      variables: payloadVariables,
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

          {/* ── Variable Declarations ── */}
          {detectedVars.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden rounded-lg border border-amber/20 bg-amber/5 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <VariableIcon className="h-4 w-4 text-amber" />
                  <span className="text-xs font-semibold text-amber-800">
                    Template Variables
                  </span>
                  <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[9px] font-medium text-amber">
                    {detectedVars.length} detected
                  </span>
                </div>
              </div>
              
              {/* Info box */}
              <div className="rounded-md bg-blue-50 p-2 text-[10px] leading-relaxed text-blue-700">
                <strong>What are variables?</strong> The <code className="rounded bg-blue-100 px-1">{'{{1}}'}</code> placeholders in your message will be replaced with actual values when sending. 
                Give each variable a <strong>label</strong> (e.g., "Customer Name") so you know what to put there, 
                and an <strong>example value</strong> (e.g., "John") that Meta requires for approval.
              </div>

              {/* Variable rows */}
              {detectedVars.map((v) => (
                <div key={v} className="rounded-lg border border-amber-200 bg-white/80 p-2 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {'{{' + v + '}}'}
                    </span>
                    <input
                      type="text"
                      value={variableDeclarations[String(v)]?.label || ''}
                      onChange={(e) => handleVarLabelChange(String(v), e.target.value)}
                      placeholder="Enter a name for this variable..."
                      className="flex-1 rounded border border-amber-200 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-[9px] font-medium text-muted-foreground">Example:</span>
                    <input
                      type="text"
                      value={variableDeclarations[String(v)]?.example || ''}
                      onChange={(e) => handleVarExampleChange(String(v), e.target.value)}
                      placeholder={{
                        1: 'e.g. John Doe',
                        2: 'e.g. ORD-12345',
                        3: 'e.g. 2024-01-15',
                      }[v] || `e.g. Sample Value ${v}`}
                      className="flex-1 rounded border border-amber-200 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none"
                    />
                    {!variableDeclarations[String(v)]?.example && (
                      <span className="flex items-center gap-1 text-[9px] text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        Required
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Warning if examples missing */}
              {detectedVars.some((v) => !variableDeclarations[String(v)]?.example) && (
                <div className="flex items-start gap-1.5 rounded-md bg-destructive/10 p-2">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                  <p className="text-[10px] leading-relaxed text-destructive">
                    <strong>Required by Meta:</strong> All variables need example values. Without examples, 
                    Meta will reject your template submission. Add example values above before submitting.
                  </p>
                </div>
              )}
            </motion.div>
          )}

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
