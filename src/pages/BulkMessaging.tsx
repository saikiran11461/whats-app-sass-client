import { motion } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  Send,
  X,
  Filter,
  Loader2,
  Info,
  Users,
  Search,
  Trash2,
  Variable,
  Smartphone,
  Eye,
  Check,
  AlertCircle,
  RefreshCw,
  Table2,
  ListOrdered,
} from "lucide-react";
import { useRef, useState, useEffect, useMemo } from "react";
import {
  useCampaigns,
  useCreateCampaign,
  useLaunchCampaign,
  usePauseCampaign,
  useCancelCampaign,
  useDeleteCampaign,
  useImportContacts,
} from "@/hooks/useCampaigns";
import { useTemplates } from "@/hooks/useTemplates";
import { useContacts, type Contact } from "@/hooks/useContacts";
import { useSocket, useSocketEvent } from "@/hooks/useSocket";
import { extractTemplateVariables, previewBodyWithValues } from "@/lib/template-utils";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  completed: "bg-primary/10 text-primary",
  running: "bg-indigo/10 text-indigo",
  scheduled: "bg-amber/10 text-amber",
  draft: "bg-secondary text-muted-foreground",
  paused: "bg-amber/10 text-amber",
  cancelled: "bg-destructive/10 text-destructive",
  failed: "bg-destructive/10 text-destructive",
  pending: "bg-amber/10 text-amber",
};

/** Minimal CSV parser that handles quoted fields and escaped quotes */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const rawHeaders = parseCsvLine(lines[0]).map((h) => h.trim());
  const lowHeaders = rawHeaders.map((h) => h.toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const obj: Record<string, string> = {};
    lowHeaders.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim(); });
    return obj;
  });
  // Return original headers for display (preserving case), and lowercased for lookup
  return { headers: rawHeaders, rows };
}

const splitList = (v?: string) => (v ? v.split(/[;,]/).map((s) => s.trim()).filter(Boolean) : []);

function rowToContact(row: Record<string, string>) {
  return {
    phone: row.phone || row.mobile || row.number || "",
    name: row.name || row.firstname || row["first name"] || "",
    email: row.email || "",
    tags: splitList(row.tags),
    labels: splitList(row.labels),
    notes: row.notes || "",
    status: (row.status || "active").toLowerCase(),
  };
}

/**
 * Render the template body with variables filled from a contact row + column mapping.
 * Like WATI/Interakt — shows a live preview of the personalized message.
 */
function renderPreviewBodyWithValues(
  body: string,
  mapping: Record<string, string>,
  contact: Record<string, any>
): string {
  if (!body) return "";
  // Build a lookup of all available contact fields
  const contactFields: Record<string, string> = {};
  if (contact) {
    Object.keys(contact).forEach((key) => {
      const val = contact[key];
      if (typeof val === 'string') contactFields[key] = val;
      else if (typeof val === 'object' && val !== null) contactFields[key] = JSON.stringify(val);
    });
    // Also add raw CSV data if available
    if (contact._raw) {
      Object.keys(contact._raw).forEach((key) => {
        contactFields[key] = contact._raw[key];
      });
    }
  }

  return body.replace(/\{\{(\d+)\}\}/g, (_, num) => {
    const mappedCol = mapping[num];
    if (mappedCol && contactFields[mappedCol]) {
      return contactFields[mappedCol];
    }
    // Fallback: show the original placeholder
    return `{{${num}}}`;
  });
}

export default function BulkMessaging() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedContacts, setParsedContacts] = useState<Record<string, any>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parseInfo, setParseInfo] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [contactMode, setContactMode] = useState<"csv" | "existing">("csv");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({});
  const [previewContactIndex, setPreviewContactIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Selected template with body parsed for variables
  const selectedTemplateObj = useMemo(
    () => templates.find((t: any) => t._id === selectedTemplate),
    [selectedTemplate, templates]
  );
  const templateVars = useMemo(
    () => selectedTemplateObj ? extractTemplateVariables(selectedTemplateObj.body || "") : [],
    [selectedTemplateObj]
  );
  const { subscribeToCampaign, unsubscribeFromCampaign } = useSocket();

  const { data: campaignsData, isLoading } = useCampaigns({
    status: campaignFilter !== "all" ? campaignFilter : undefined,
  });
  const campaigns = campaignsData?.campaigns || [];

  // Subscribe to all campaigns for real-time progress updates
  // Re-subscribes when the campaigns list reference changes (query refetch)
  useEffect(() => {
    const activeCampaigns = campaigns.filter((c) =>
      ["running", "pending"].includes(c.status)
    );
    activeCampaigns.forEach((c) => subscribeToCampaign(c._id));
    return () => {
      activeCampaigns.forEach((c) => unsubscribeFromCampaign(c._id));
    };
  }, [campaigns]);

  // Listen for real-time campaign progress updates
  useSocketEvent("campaign:progress", (data: any) => {
    // Invalidate campaigns to refresh stats from server
    queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
  });

  // Listen for campaign completion/failure notifications
  useSocketEvent("campaign:completed", (data: any) => {
    if (data?.campaignId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      toast.success(`Campaign completed! ${data.stats?.sent || 0} messages sent`);
    }
  });

  useSocketEvent("campaign:failed", (data: any) => {
    if (data?.campaignId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      toast.error(`Campaign failed: ${data.error || "Unknown error"}`);
    }
  });

  const { data: templatesData } = useTemplates();
  const templates = templatesData?.templates || [];

  const { data: contactsData } = useContacts({ search: contactSearch || undefined, limit: 200 });
  const contacts = contactsData?.contacts || [];

  const { mutate: createCampaign, isPending: creating } = useCreateCampaign();
  const { mutate: launchCampaign } = useLaunchCampaign();
  const { mutate: pauseCampaign } = usePauseCampaign();
  const { mutate: cancelCampaign } = useCancelCampaign();
  const { mutate: deleteCampaign } = useDeleteCampaign();
  const importContacts = useImportContacts();

  const hasContacts = contactMode === "csv" ? parsedContacts.length > 0 : selectedContactIds.length > 0;

  const switchMode = (mode: "csv" | "existing") => {
    setContactMode(mode);
    if (mode === "csv") {
      setSelectedContactIds([]);
    } else {
      setFileName(null);
      setParsedContacts([]);
      setParseInfo(null);
    }
  };

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { headers, rows } = parseCsv(text);
      const contacts = rows.map(rowToContact).filter((c) => c.phone);
      const invalid = rows.length - contacts.length;
      setFileName(file.name);
      // Store both parsed contacts AND raw rows for variable mapping preview
      // The raw rows preserve original CSV column names (e.g., "Full Name")
      setParsedContacts(contacts.map((c, i) => ({ ...c, _raw: rows[i] })));
      setCsvHeaders(headers);
      setParseInfo({ total: rows.length, valid: contacts.length, invalid });
      if (contacts.length === 0) {
        toast.error("No valid rows found. Phone number is required for each contact.");
      } else {
        toast.success(`Parsed ${contacts.length} contact(s) from ${file.name}`);
        // Auto-map CSV headers to template variables if template is already selected
        if (selectedTemplateObj) {
          autoMapVariables(headers);
        }
      }
    } catch (err) {
      toast.error("Could not read the CSV file");
    } finally {
      e.target.value = "";
    }
  };

  /** Auto-map CSV headers to template variables based on common patterns */
  const autoMapVariables = (headers: string[]) => {
    if (!selectedTemplateObj || templateVars.length === 0) return;
    const mapping: Record<string, string> = {};
    const lowHeaders = headers.map((h) => h.toLowerCase().trim());
    templateVars.forEach((v) => {
      // Try to find a matching CSV column by pattern
      const patterns = [
        `var${v}`, `variable${v}`, `param${v}`, `value${v}`,
        ...(v === 1 ? ['name', 'fullname', 'firstname', 'customer', 'user', 'person'] : []),
        ...(v === 2 ? ['email', 'phone', 'order', 'id', 'code', 'number', 'city'] : []),
        ...(v === 3 ? ['date', 'time', 'price', 'amount', 'link', 'url', 'address'] : []),
      ];
      const match = patterns.find((p) => lowHeaders.includes(p));
      if (match) {
        mapping[String(v)] = headers[lowHeaders.indexOf(match)];
      }
    });
    setVariableMapping(mapping);
  };

  const resetForm = () => {
    setCampaignName("");
    setSelectedTemplate("");
    setFileName(null);
    setParsedContacts([]);
    setCsvHeaders([]);
    setParseInfo(null);
    setSelectedContactIds([]);
    setContactSearch("");
    setVariableMapping({});
  };

  const handleCreateAndLaunch = async () => {
    if (!campaignName || !selectedTemplate) {
      toast.error("Campaign name and template are required");
      return;
    }

    // Validate variable mapping if template has variables
    if (templateVars.length > 0) {
      const unmapped = templateVars.filter((v) => !variableMapping[String(v)]);
      if (unmapped.length > 0) {
        toast.error(`Please map all template variables to CSV columns or enter default values (unmapped: {{${unmapped.join(", ")}}})`);
        return;
      }
    }

    const csvContacts = contactMode === "csv" ? parsedContacts : [];
    const existingIds = contactMode === "existing" ? selectedContactIds : [];

    if (csvContacts.length === 0 && existingIds.length === 0) {
      toast.error(
        contactMode === "csv"
          ? "Please upload a CSV contact list first"
          : "Please select at least one contact"
      );
      return;
    }

    try {
      let contactIds: string[] = existingIds;

      if (contactMode === "csv") {
        const importRes = await importContacts.mutateAsync(csvContacts);
        contactIds = importRes.data?.contactIds || [];
        if (contactIds.length === 0) {
          toast.error("No new contacts were imported (all may already exist)");
          return;
        }
      }

      // 1. Create the campaign linked to the selected contacts
      // Include templateVariables mapping so the campaign can personalize each message
      const campaignData: any = {
        name: campaignName,
        templateId: selectedTemplate,
        contactIds,
        templateVariables: Object.fromEntries(
          Object.entries(variableMapping).filter(([_, v]) => v)
        ),
        status: "draft",
      };

      const campaignRes: any = await new Promise((resolve, reject) => {
        createCampaign(campaignData as any, {
          onSuccess: (res: any) => resolve(res),
          onError: (err: any) => reject(err),
        });
      });

      // 2. Launch it
      launchCampaign(campaignRes.data?._id, {
        onSuccess: () => {
          toast.success(`Campaign launched to ${contactIds.length} contact(s)!`);
          resetForm();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || "Launch failed"),
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create campaign");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bulk Messaging
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dispatch broadcasts to thousands of contacts at once
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl glass-card stat-card-glow p-6 space-y-5">
          <h2 className="text-sm font-semibold text-foreground">
            1. Campaign Details
          </h2>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Spring Sale 2024"
              className="w-full rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                setVariableMapping({});
                // Auto-map if CSV is already loaded
                if (csvHeaders.length > 0) {
                  setTimeout(() => autoMapVariables(csvHeaders), 100);
                }
              }}
              className="w-full rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No templates yet. Create one under the Templates page first.
              </p>
            )}
          </div>

          {/* ── Variable Mapping Section ── */}
          {selectedTemplateObj && templateVars.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden rounded-lg border border-amber/20 bg-amber/5 p-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Variable className="h-4 w-4 text-amber" />
                  <span className="text-xs font-semibold text-amber-700">
                    Template Variable Mapping
                  </span>
                  <span className="rounded-full bg-amber/10 px-2 py-0.5 text-[9px] font-medium text-amber">
                    {Object.keys(variableMapping).filter((k) => variableMapping[k]).length}/{templateVars.length} mapped
                  </span>
                </div>
                {csvHeaders.length > 0 && (
                  <button
                    onClick={() => autoMapVariables(csvHeaders)}
                    className="text-xs text-primary hover:underline"
                  >
                    Auto-map
                  </button>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground italic">
                Map CSV columns to template variables. Each contact will receive a personalized message with their data.
              </p>

              {/* Variable mapping rows */}
              <div className="space-y-2">
                {templateVars.map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 rounded bg-amber-100 px-1.5 py-1 text-center text-[10px] font-bold text-amber-700">
                      {`{{${v}}}`}
                    </span>
                    <span className="w-16 text-[10px] font-medium text-muted-foreground">
                      Variable {v}
                    </span>
                    {csvHeaders.length > 0 ? (
                      <select
                        value={variableMapping[String(v)] || ""}
                        onChange={(e) =>
                          setVariableMapping((prev) => ({
                            ...prev,
                            [String(v)]: e.target.value,
                          }))
                        }
                        className="flex-1 rounded-md border border-amber-200 bg-white/80 px-2 py-1 text-xs text-foreground focus:border-amber-400 focus:outline-none"
                      >
                        <option value="">— Select CSV column —</option>
                        {csvHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={variableMapping[String(v)] || ""}
                        onChange={(e) =>
                          setVariableMapping((prev) => ({
                            ...prev,
                            [String(v)]: e.target.value,
                          }))
                        }
                        placeholder="Enter a default value..."
                        className="flex-1 rounded-md border border-amber-200 bg-white/80 px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Live preview with first contact */}
              {parsedContacts.length > 0 && (
                <div className="rounded-lg border border-border bg-white/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Preview for first contact
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-muted-foreground">
                        Contact 1 of {parsedContacts.length}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-primary/5 px-3 py-2">
                    <div className="mb-1 flex items-center gap-2">
                      <Smartphone className="h-3 w-3 text-primary" />
                      <span className="truncate text-[11px] font-medium text-primary">
                        {parsedContacts[0]?.name || parsedContacts[0]?.phone || "Contact"}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground">
                      {renderPreviewBodyWithValues(selectedTemplateObj?.body || "", variableMapping, parsedContacts[0])}
                    </p>
                  </div>
                </div>
              )}

              {/* Usage tip */}
              <div className="flex items-start gap-1.5 rounded-md bg-blue-50 p-2">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-blue-500" />
                <p className="text-[10px] leading-relaxed text-blue-700">
                  <strong>Tip:</strong> Add columns to your CSV like <code className="rounded bg-blue-100 px-1">name</code>, <code className="rounded bg-blue-100 px-1">city</code>, <code className="rounded bg-blue-100 px-1">order_id</code> and they'll appear in the dropdown above for mapping.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="rounded-xl glass-card stat-card-glow p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              2. Contact List
            </h2>
            <button
              type="button"
              onClick={() => setShowFormat((s) => !s)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Info className="h-3 w-3" /> CSV format
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 rounded-lg bg-secondary/50 p-1">
            <button
              type="button"
              onClick={() => switchMode("csv")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                contactMode === "csv"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Upload className="mr-1 inline h-3 w-3" /> Upload CSV
            </button>
            <button
              type="button"
              onClick={() => switchMode("existing")}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                contactMode === "existing"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="mr-1 inline h-3 w-3" /> Pick from contacts
            </button>
          </div>

          {showFormat && contactMode === "csv" && (
            <div className="rounded-lg border border-border bg-surface-raised p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">CSV columns (first row = header)</p>
              <p><code className="text-primary">phone</code> *required* (e.g. +15551234567)</p>
              <p><code className="text-primary">name</code> optional</p>
              <p><code className="text-primary">email</code> optional</p>
              <p><code className="text-primary">tags</code> optional, comma-separated (vip, lead)</p>
              <p><code className="text-primary">labels</code> optional, comma-separated</p>
              <p><code className="text-primary">notes</code> optional</p>
              <p><code className="text-primary">status</code> optional (active/blocked) — defaults to active</p>
              <p className="mt-2 text-[11px]">Example:</p>
              <pre className="mt-1 overflow-x-auto rounded bg-background/60 p-2 text-[11px] leading-relaxed">
{`phone,name,email,tags,status\n+15551234567,John Doe,john@x.com,vip,active\n+15559876543,Jane Smith,,lead,active`}
              </pre>
            </div>
          )}

          {contactMode === "csv" ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Upload Contacts (CSV)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 transition-colors hover:border-primary/50 hover:bg-primary/10"
                >
                  <Upload className="h-8 w-8 text-primary/60" />
                  <p className="text-sm text-muted-foreground">
                    Drop CSV file here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max 50,000 contacts per batch
                  </p>
                </div>
                {fileName && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-3"
                  >
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {parseInfo
                          ? `${parseInfo.valid} valid contact(s)${parseInfo.invalid ? `, ${parseInfo.invalid} skipped (no phone)` : ""}`
                          : "Contacts list selected"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFileName(null);
                        setParsedContacts([]);
                        setParseInfo(null);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts by name or phone..."
                  className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {contacts.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No contacts found
                  </p>
                ) : (
                  contacts.map((ct: Contact) => (
                    <label
                      key={ct._id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-secondary/40"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContactIds.includes(ct._id)}
                        onChange={() => toggleContact(ct._id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {ct.name || "Unnamed"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{ct.phone}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedContactIds.length} contact(s) selected
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateAndLaunch}
            disabled={creating || !campaignName || !selectedTemplate || !hasContacts}
            className={`w-full rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
              campaignName && selectedTemplate && hasContacts
                ? "shimmer-btn text-primary-foreground hover:opacity-90"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {creating ? "Creating..." : "Create & Launch Campaign"}
            </span>
          </button>
        </div>
      </div>

      {/* Campaign List */}
      <div className="rounded-xl glass-card stat-card-glow overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            All Campaigns
          </h2>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              showFilters
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Filter className="h-3 w-3" /> Filter
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-raised px-5 py-3">
            <span className="mr-2 text-xs font-medium text-muted-foreground">Status:</span>
            {[
              "all",
              "draft",
              "running",
              "completed",
              "paused",
              "cancelled",
              "failed",
            ].map((s) => (
              <button
                key={s}
                onClick={() => setCampaignFilter(s)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  campaignFilter === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                {[
                  "Campaign",
                  "Status",
                  "Sent",
                  "Delivered",
                  "Failed",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCampaignsView().length > 0 ? (
                filteredCampaignsView().map((c, i) => (
                  <motion.tr
                    key={c._id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">
                      {c.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          statusColors[c.status] || "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-foreground">
                      {c.stats?.sent ?? c.sentCount ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-foreground">
                      {c.stats?.delivered ?? c.deliveredCount ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-destructive">
                      {c.stats?.failed ? c.stats.failed : c.failedCount ? c.failedCount : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {c.status === "draft" && (
                          <button
                            onClick={() =>
                              launchCampaign(c._id, {
                                onSuccess: () => toast.success("Launched!"),
                              })
                            }
                            className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                          >
                            Launch
                          </button>
                        )}
                        {c.status === "running" && (
                          <button
                            onClick={() =>
                              pauseCampaign(c._id, {
                                onSuccess: () => toast.success("Paused"),
                              })
                            }
                            className="rounded-md px-2 py-1 text-xs font-medium text-amber hover:bg-amber/10"
                          >
                            Pause
                          </button>
                        )}
                        {(c.status === "draft" || c.status === "paused") && (
                          <button
                            onClick={() =>
                              cancelCampaign(c._id, {
                                onSuccess: () => toast.success("Cancelled"),
                              })
                            }
                            className="rounded-md px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(c._id)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary"
                          title="Delete campaign"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-sm text-muted-foreground"
                  >
                    No campaigns yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Themed delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the campaign
              {deleteTarget ? ` “${campaigns.find((c) => c._id === deleteTarget)?.name}”` : ""}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteCampaign(deleteTarget, {
                    onSuccess: () => toast.success("Campaign deleted"),
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );

  function filteredCampaignsView() {
    return campaignFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === campaignFilter);
  }
}
