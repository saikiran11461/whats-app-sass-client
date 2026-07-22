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
  useUpdateContact,
  useDeleteContact,
  useBulkImportContacts,
  type Contact,
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
  const { mutate: updateContact, isPending: updating } = useUpdateContact();
  const { mutate: deleteContact, isPending: deleting } = useDeleteContact();
  const { mutate: bulkImport, isPending: importing } = useBulkImportContacts();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", tags: "" });

  // View / Edit / Delete modal state
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", tags: "", email: "", notes: "" });
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);

  // CSV import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<
    { name?: string; phone: string; email?: string; tags?: string[] }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Parse CSV (or plain-text) data into contact objects.
   * Handles a wide variety of customer uploads:
   *   - Just phone numbers (one per line, no header)
   *   - phone,name pairs
   *   - name,phone pairs
   *   - Full CSV with headers: name, phone, email, tags
   *   - Tab-separated, semicolon-separated
   *   - Quoted fields with commas inside
   * Tags may be separated by | or / in a single cell.
   */
  const parseCsv = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    // Split a row into cells: handles commas, tabs, semicolons, and quoted fields
    const splitRow = (row: string): string[] => {
      // Try tab first; if found, use tab as separator
      if (row.includes('\t')) {
        return row.split('\t').map((c) => c.trim().replace(/^"|"$/g, ''));
      }
      // Otherwise split by comma or semicolon, handling quoted fields
      const cells: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (inQuotes) {
          if (ch === '"') {
            if (row[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false;
          } else {
            cur += ch;
          }
        } else if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',' || ch === ';') {
          cells.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      cells.push(cur.trim());
      return cells.filter((c) => c.length > 0);
    };

    // Try to detect whether the first line is a header row
    const firstRow = splitRow(lines[0]);
    const firstRowLower = firstRow.map((c) => c.toLowerCase().replace(/['"]/g, ''));

    const isLikelyHeader = firstRowLower.some(
      (c) =>
        c.includes('phone') ||
        c.includes('mobile') ||
        c.includes('number') ||
        c.includes('name') ||
        c.includes('email') ||
        c.includes('tag') ||
        c.includes('label') ||
        c.includes('contact')
    );

    // If every line has exactly one cell that looks numeric, it's a bare-number list
    if (lines.every((l) => { const c = splitRow(l); return c.length === 1 && /^[\d\s\-\+\(\)]+$/.test(c[0]) && c[0].replace(/[^\d]/g, '').length >= 5; })) {
      return lines.map((line) => ({
        phone: splitRow(line)[0].replace(/[^\d+]/g, ''),
      }));
    }

    // Detect column indices from header or infer from data
    let startRow = 0;
    let nameIdx = -1;
    let phoneIdx = -1;
    let emailIdx = -1;
    let tagsIdx = -1;

    if (isLikelyHeader) {
      nameIdx = firstRowLower.findIndex(
        (c) => c.includes('name') || c.includes('first') || c.includes('contact')
      );
      phoneIdx = firstRowLower.findIndex(
        (c) => c.includes('phone') || c.includes('mobile') || c.includes('number') || c.includes('tel')
      );
      emailIdx = firstRowLower.findIndex((c) => c.includes('email') || c.includes('mail'));
      tagsIdx = firstRowLower.findIndex((c) => c.includes('tag') || c.includes('label'));
      startRow = 1;
    } else if (firstRow.length >= 2) {
      // No header, but multiple cells per row — guess phone from cell content
      // Assume the cell containing mostly digits is the phone
      for (let c = 0; c < firstRow.length; c++) {
        const digitRatio =
          firstRow[c].replace(/[^\d]/g, '').length / Math.max(firstRow[c].length, 1);
        if (digitRatio > 0.4 && phoneIdx === -1) {
          phoneIdx = c;
        } else if (digitRatio <= 0.4 && nameIdx === -1) {
          nameIdx = c;
        }
      }
      // Fallback: columns 0 and 1 are phone and name (or vice versa)
      if (phoneIdx === -1) phoneIdx = 0;
      if (nameIdx === -1) nameIdx = firstRow.length > 1 ? 1 : -1;
    }

    const out: { name?: string; phone: string; email?: string; tags?: string[] }[] = [];
    for (let i = startRow; i < lines.length; i++) {
      const cells = splitRow(lines[i]);
      if (cells.length === 0) continue;

      let phone = '';
      let name: string | undefined;
      let email: string | undefined;
      let tags: string[] | undefined;

      if (phoneIdx >= 0 && cells[phoneIdx]) {
        phone = cells[phoneIdx].replace(/[^\d+]/g, '');
      } else if (cells.length === 1) {
        // Single cell — treat as phone number
        phone = cells[0].replace(/[^\d+]/g, '');
      } else {
        // Try to find which cell looks like a phone
        for (const cell of cells) {
          const cleaned = cell.replace(/[^\d+]/g, '');
          if (cleaned.length >= 5) {
            phone = cleaned;
            break;
          }
        }
        // Fallback: first cell
        if (!phone) phone = cells[0].replace(/[^\d+]/g, '');
      }

      if (!phone) continue;

      if (nameIdx >= 0 && cells[nameIdx]) {
        name = cells[nameIdx] || undefined;
      } else if (phoneIdx >= 0) {
        // For cells with name/phone pair, name is in a different column
        for (let c = 0; c < cells.length; c++) {
          if (c !== phoneIdx && c !== emailIdx && c !== tagsIdx) {
            const v = cells[c];
            if (v && !/^[\d\s\-\+\(\)]+$/.test(v)) {
              name = v;
              break;
            }
          }
        }
      }

      if (emailIdx >= 0 && cells[emailIdx]) {
        email = cells[emailIdx] || undefined;
      }

      if (tagsIdx >= 0 && cells[tagsIdx]) {
        const raw = cells[tagsIdx];
        tags = raw
          .split(/[|/,;]+/)
          .map((t) => t.trim())
          .filter(Boolean);
        if (tags.length === 0) tags = undefined;
      }

      out.push({
        name: name || undefined,
        phone,
        email: email || undefined,
        tags,
      });
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

  const handleOpenView = (contact: Contact) => {
    setViewingContact(contact);
  };

  const handleOpenEdit = (contact: Contact) => {
    setEditingContact(contact);
    setEditForm({
      name: contact.name || "",
      phone: contact.phone || "",
      tags: (contact.tags || []).join(", "),
      email: contact.email || "",
      notes: contact.notes || "",
    });
  };

  const handleEditSave = () => {
    if (!editingContact) return;
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    updateContact(
      {
        id: editingContact._id,
        data: {
          name: editForm.name,
          phone: editForm.phone,
          email: editForm.email || undefined,
          notes: editForm.notes || undefined,
          tags: editForm.tags
            ? editForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
        },
      },
      {
        onSuccess: () => {
          toast.success("Contact updated!");
          setEditingContact(null);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update contact");
        },
      }
    );
  };

  const handleOpenDelete = (contact: Contact) => {
    setDeletingContact(contact);
  };

  const handleConfirmDelete = () => {
    if (!deletingContact) return;
    deleteContact(deletingContact._id, {
      onSuccess: () => {
        toast.success("Contact deleted");
        setDeletingContact(null);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Delete failed");
        setDeletingContact(null);
      },
    });
  };

  return (
    <>
      {/* View Contact Modal */}
      <AnimatePresence>
        {viewingContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setViewingContact(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl glass-card stat-card-glow p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {viewingContact.name
                      ? viewingContact.name.split(" ").map((n) => n[0]).join("")
                      : viewingContact.phone?.replace(/[^\d]/g, "").slice(0, 2) || "?"}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {viewingContact.name || viewingContact.phone || "Unknown"}
                    </h3>
                    <p className="text-xs text-muted-foreground">Contact Details</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingContact(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Phone
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground tabular-nums">
                      {viewingContact.phone || "—"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Email
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {viewingContact.email || "—"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tags
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {viewingContact.tags && viewingContact.tags.length > 0 ? (
                      viewingContact.tags.map((t) => (
                        <span
                          key={t}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            t === "VIP"
                              ? "bg-primary/10 text-primary"
                              : t === "Partner"
                                ? "bg-indigo/10 text-indigo"
                                : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No tags</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {viewingContact.notes || "No notes"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        viewingContact.status === "active"
                          ? "bg-primary/10 text-primary"
                          : viewingContact.status === "blocked"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {viewingContact.status}
                    </span>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Messages
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground tabular-nums">
                      {viewingContact.totalMessages}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Created
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatTimeAgo(viewingContact.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Last Active
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {viewingContact.lastMessageAt
                        ? formatTimeAgo(viewingContact.lastMessageAt)
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewingContact(null)}
                className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Contact Modal */}
      <AnimatePresence>
        {editingContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setEditingContact(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl glass-card stat-card-glow p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Edit Contact
                </h3>
                <button
                  onClick={() => setEditingContact(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <textarea
                  placeholder="Notes (optional)"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingContact(null)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={updating}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {updating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
            onClick={() => setDeletingContact(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-xl glass-card stat-card-glow p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Delete Contact</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">
                  {deletingContact.name || deletingContact.phone || "this contact"}
                </span>
                ?
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setDeletingContact(null)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="flex-1 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                            ? c.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                            : c.phone?.replace(/[^\d]/g, '').slice(0, 2) || '?'}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {c.name || c.phone || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm tabular-nums text-muted-foreground">
                      {c.phone || '—'}
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
                          onClick={() => handleOpenView(c)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(c)}
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
    </>
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
