import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserPlus,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  FileSpreadsheet,
  X,
  Check,
  Filter,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  useContacts,
  useCreateContact,
  useDeleteContact,
  useBulkImportContacts,
} from "@/hooks/useContacts";
import { toast } from "sonner";

const allTags = ["VIP", "Customer", "Lead", "Partner", "Support"];

export default function ContactsManagement() {
  const [showUpload, setShowUpload] = useState(false);
  const [tagFilter, setTagFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Reset to the first page whenever the search query or tag filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, tagFilter]);

  const { data, isLoading } = useContacts({
    search: searchQuery || undefined,
    tag: tagFilter !== "all" ? tagFilter : undefined,
    page,
    limit: PAGE_SIZE,
  });
  const contacts = data?.contacts || [];
  const pagination = data?.pagination;

  const { mutate: createContact, isPending: creating } = useCreateContact();
  const { mutate: deleteContact } = useDeleteContact();
  const { mutate: bulkImport, isPending: importing } = useBulkImportContacts();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", tags: "" });

  // CSV import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<
    { name?: string; phone: string; email?: string; tags?: string[] }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Parse a CSV string into contact objects.
   * Supports an optional header row (name, phone, email, tags). One contact per row.
   * Tags may be separated by | or / in a single cell.
   */
  const parseCsv = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return [];

    const splitRow = (row: string) =>
      row
        .split(/[,;]+/)
        .map((c) => c.trim().replace(/^"|"$/g, ""))
        .filter((c) => c.length > 0);

    let start = 0;
    let cols = { name: 0, phone: 1, email: 2, tags: 3 };

    const first = splitRow(lines[0]).map((c) => c.toLowerCase());
    const hasHeader = first.some(
      (c) => c.includes("phone") || c.includes("name") || c.includes("email") || c.includes("tag")
    );
    if (hasHeader) {
      cols = {
        name: first.findIndex((c) => c.includes("name")),
        phone: first.findIndex((c) => c.includes("phone")),
        email: first.findIndex((c) => c.includes("email")),
        tags: first.findIndex((c) => c.includes("tag")),
      };
      start = 1;
    }

    const out: { name?: string; phone: string; email?: string; tags?: string[] }[] = [];
    for (let i = start; i < lines.length; i++) {
      const cells = splitRow(lines[i]);
      const phone = (cols.phone >= 0 ? cells[cols.phone] : cells[1] || cells[0])?.replace(
        /[^\d+]/g,
        ""
      );
      if (!phone) continue;
      const name = cols.name >= 0 ? cells[cols.name] : undefined;
      const email = cols.email >= 0 ? cells[cols.email] : undefined;
      const tagsRaw = cols.tags >= 0 ? cells[cols.tags] : undefined;
      const tags = tagsRaw
        ? tagsRaw
            .split(/[|/]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : undefined;
      out.push({ name: name || undefined, phone, email: email || undefined, tags });
    }
    return out;
  };

  const handleFile = async (file: File) => {
    setCsvFile(file);
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      setParsedContacts(parsed);
      if (parsed.length === 0) {
        toast.error("No valid rows found — each row needs a phone number");
      }
    } catch {
      toast.error("Could not read the file");
    }
  };

  const handleImport = () => {
    if (parsedContacts.length === 0) {
      toast.error("Choose a CSV file with at least one contact");
      return;
    }
    bulkImport(parsedContacts, {
      onSuccess: (res: any) => {
        const d = res?.data || {};
        toast.success(
          `Imported ${d.created ?? parsedContacts.length} contact(s)${
            d.skipped ? `, ${d.skipped} skipped (duplicates)` : ""
          }`
        );
        setShowUpload(false);
        setCsvFile(null);
        setParsedContacts([]);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Import failed");
      },
    });
  };

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      toast.error("Name and phone are required");
      return;
    }
    createContact(
      {
        name: newContact.name,
        phone: newContact.phone,
        tags: newContact.tags
          ? newContact.tags.split(",").map((t) => t.trim())
          : [],
      },
      {
        onSuccess: () => {
          toast.success("Contact created!");
          setShowAddModal(false);
          setNewContact({ name: "", phone: "", tags: "" });
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to create contact");
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContact(id, {
        onSuccess: () => toast.success("Contact deleted"),
        onError: (err: any) => toast.error(err?.response?.data?.message || "Delete failed"),
      });
    }
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
            Contacts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.pagination?.total || contacts.length} contacts in your directory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* CSV Upload Panel */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl glass-card stat-card-glow p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Bulk Import Contacts
                </h3>
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFile(f);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <Upload className="h-8 w-8 text-primary/60" />
                <p className="text-sm font-medium text-foreground">
                  Drop CSV file here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported: .csv — columns: name, phone, email, tags (header optional) — Max 50,000 rows
                </p>
                {csvFile && (
                  <p className="mt-1 text-xs font-medium text-primary">
                    {csvFile.name} — {parsedContacts.length} contact(s) ready
                  </p>
                )}
              </div>
              <button
                onClick={handleImport}
                disabled={importing || parsedContacts.length === 0}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {importing ? "Importing..." : `Import ${parsedContacts.length || ""} Contacts`}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full max-w-md rounded-xl glass-card stat-card-glow p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-foreground">
                Add New Contact
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={newContact.tags}
                  onChange={(e) =>
                    setNewContact({ ...newContact, tags: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  disabled={creating}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Adding..." : "Add Contact"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts by name or phone..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
        >
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex flex-wrap items-center gap-2 rounded-lg glass-card p-3"
        >
          <span className="text-xs font-medium text-muted-foreground mr-2">
            Tag:
          </span>
          {["all", ...allTags].map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(t)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${tagFilter === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </motion.div>
      )}

      <div className="overflow-hidden rounded-xl glass-card stat-card-glow">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-raised">
                {[
                  "Contact",
                  "Phone",
                  "Tags",
                  "Messages",
                  "Last Active",
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
              {contacts.length > 0 ? (
                contacts.map((c, i) => (
                  <motion.tr
                    key={c._id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-muted-foreground">
                      {c.phone}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        {(c.tags || []).map((t) => (
                          <span
                            key={t}
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${t === "VIP" ? "bg-primary/10 text-primary" : t === "Partner" ? "bg-indigo/10 text-indigo" : "bg-secondary text-muted-foreground"}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-foreground">
                      {c.totalMessages}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {c.lastMessageAt
                        ? formatTimeAgo(c.lastMessageAt)
                        : "Never"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c._id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Delete"
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
                    No contacts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3 sm:flex-row">
            <span className="text-xs text-muted-foreground">
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage || isLoading}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
              >
                Prev
              </button>
              {getPageNumbers(pagination.page, pagination.totalPages).map((p, idx) =>
                p === "..." ? (
                  <span key={`e-${idx}`} className="px-2 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    disabled={isLoading}
                    className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors ${
                      p === pagination.page
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage || isLoading}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Build a compact list of page numbers with "…" gaps for large result sets.
 */
function getPageNumbers(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push("...");
  pages.push(totalPages);
  return pages;
}
