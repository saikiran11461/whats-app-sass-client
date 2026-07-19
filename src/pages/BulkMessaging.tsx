import { motion } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  Send,
  Check,
  X,
  Calendar,
  Filter,
  Loader2,
  Info,
} from "lucide-react";
import { useRef, useState } from "react";
import { useCampaigns, useCreateCampaign, useLaunchCampaign, usePauseCampaign, useCancelCampaign, useImportContacts } from "@/hooks/useCampaigns";
import { useTemplates } from "@/hooks/useTemplates";
import { toast } from "sonner";

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
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? "").trim(); });
    return obj;
  });
  return { headers, rows };
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

export default function BulkMessaging() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedContacts, setParsedContacts] = useState<Record<string, any>[]>([]);
  const [parseInfo, setParseInfo] = useState<{ total: number; valid: number; invalid: number } | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: campaignsData, isLoading } = useCampaigns({
    status: campaignFilter !== "all" ? campaignFilter : undefined,
  });
  const campaigns = campaignsData?.campaigns || [];

  const { data: templatesData } = useTemplates();
  const templates = templatesData?.templates || [];

  const { mutate: createCampaign, isPending: creating } = useCreateCampaign();
  const { mutate: launchCampaign } = useLaunchCampaign();
  const { mutate: pauseCampaign } = usePauseCampaign();
  const { mutate: cancelCampaign } = useCancelCampaign();
  const importContacts = useImportContacts();

  const filteredCampaigns =
    campaignFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === campaignFilter);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { rows } = parseCsv(text);
      const contacts = rows.map(rowToContact).filter((c) => c.phone);
      const invalid = rows.length - contacts.length;
      setFileName(file.name);
      setParsedContacts(contacts);
      setParseInfo({ total: rows.length, valid: contacts.length, invalid });
      if (contacts.length === 0) {
        toast.error("No valid rows found. Phone number is required for each contact.");
      } else {
        toast.success(`Parsed ${contacts.length} contact(s) from ${file.name}`);
      }
    } catch (err) {
      toast.error("Could not read the CSV file");
    } finally {
      e.target.value = "";
    }
  };

  const handleCreateAndLaunch = async () => {
    if (!campaignName || !selectedTemplate) {
      toast.error("Campaign name and template are required");
      return;
    }
    if (parsedContacts.length === 0) {
      toast.error("Please upload a CSV contact list first");
      return;
    }

    try {
      // 1. Import the contacts (backend dedupes by phone)
      const importRes = await importContacts.mutateAsync(parsedContacts);
      const contactIds: string[] = importRes.data?.contactIds || [];

      if (contactIds.length === 0) {
        toast.error("No new contacts were imported (all may already exist)");
        return;
      }

      // 2. Create the campaign linked to the imported contacts
      const campaignRes: any = await new Promise((resolve, reject) => {
        createCampaign(
          { name: campaignName, templateId: selectedTemplate, contactIds, status: "draft" } as any,
          {
            onSuccess: (res: any) => resolve(res),
            onError: (err: any) => reject(err),
          }
        );
      });

      // 3. Launch it
      launchCampaign(campaignRes.data?._id, {
        onSuccess: () => {
          toast.success(`Campaign launched to ${contactIds.length} contact(s)!`);
          setCampaignName("");
          setSelectedTemplate("");
          setFileName(null);
          setParsedContacts([]);
          setParseInfo(null);
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
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-raised px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
            >
              <option value="">Select a template...</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.status})
                </option>
              ))}
            </select>
          </div>
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

          {showFormat && (
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
phone,name,email,tags,status{'\n'}+15551234567,John Doe,john@x.com,vip,active{'\n'}+15559876543,Jane Smith,,lead,active
              </pre>
            </div>
          )}

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

          <button
            type="button"
            onClick={handleCreateAndLaunch}
            disabled={creating || !campaignName || !selectedTemplate || parsedContacts.length === 0}
            className={`w-full rounded-lg px-6 py-3 text-sm font-semibold transition-all ${campaignName && selectedTemplate && parsedContacts.length > 0 ? "shimmer-btn text-primary-foreground hover:opacity-90" : "bg-secondary text-muted-foreground cursor-not-allowed"}`}
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
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"}`}
          >
            <Filter className="h-3 w-3" /> Filter
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3 bg-surface-raised">
            <span className="text-xs font-medium text-muted-foreground mr-2">
              Status:
            </span>
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
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${campaignFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
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
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((c, i) => (
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
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColors[c.status] || "bg-secondary text-muted-foreground"}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-foreground">
                      {c.sentCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-foreground">
                      {c.deliveredCount?.toLocaleString() || 0}
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-destructive">
                      {c.failedCount > 0 ? c.failedCount : "—"}
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
    </motion.div>
  );
}
