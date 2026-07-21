import { motion } from "framer-motion";
import {
  Plus,
  UsersRound,
  Send,
  Edit,
  Trash2,
  Users,
  Search,
  Filter,
  X,
  Loader2,
  UserPlus,
  Upload,
  Check,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  useGroups,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useSendToGroup,
  useGroupContacts,
  useAddGroupContacts,
  useImportGroupContacts,
  useImportContactsToGroup,
  useRemoveGroupContact,
  type Group,
} from "@/hooks/useGroups";
import { useContacts, type Contact } from "@/hooks/useContacts";
import { useTemplates } from "@/hooks/useTemplates";
import { toast } from "sonner";

function formatTimeAgo(dateStr?: string) {
  if (!dateStr) return "recently";
  const diffMins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function emptyForm(): Partial<Group> {
  return { name: "", description: "" };
}

const COLORS = ["#6366f1", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState<Partial<Group>>(emptyForm());
  const [deleting, setDeleting] = useState<Group | null>(null);

  const { data, isLoading } = useGroups({ search: search || undefined });
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const sendToGroup = useSendToGroup();
  const { data: templatesData } = useTemplates();
  const templates = templatesData?.templates || [];
  const groups = data?.groups || [];

  const [sendingGroup, setSendingGroup] = useState<Group | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [templateId, setTemplateId] = useState("");

  // ---- Group member management ----
  const [membersGroup, setMembersGroup] = useState<Group | null>(null);

  const filtered = groups.filter((g) => {
    const matchSearch =
      searchQuery === "" || g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSize =
      sizeFilter === "all" ||
      (sizeFilter === "small" && g.contactCount < 100) ||
      (sizeFilter === "medium" && g.contactCount >= 100 && g.contactCount < 1000) ||
      (sizeFilter === "large" && g.contactCount >= 1000);
    return matchSearch && matchSize;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (g: Group) => {
    setEditing(g);
    setForm({ ...g });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateGroup.mutateAsync(
        { id: editing._id, data: form },
        {
          onSuccess: () => toast.success("Group updated!"),
          onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
        }
      );
    } else {
      await createGroup.mutateAsync(form, {
        onSuccess: () => toast.success("Group created!"),
        onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
      });
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteGroup.mutateAsync(deleting._id, {
      onSuccess: () => toast.success("Group deleted"),
      onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
    });
    setDeleting(null);
  };

  const openSend = (g: Group) => {
    if (!g.contactCount || g.contactCount === 0) {
      toast.error("This group has no contacts. Add contacts before sending.");
      return;
    }
    setSendingGroup(g);
    setMessageContent("");
    setTemplateId("");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendingGroup) return;
    if (!messageContent.trim() && !templateId) {
      toast.error("Please enter a message or select a template");
      return;
    }
    try {
      const res = await sendToGroup.mutateAsync({
        id: sendingGroup._id,
        content: messageContent.trim() || undefined,
        templateId: templateId || undefined,
      });
      toast.success(`Queued ${res.data.sent} of ${res.data.total} message(s) to ${sendingGroup.name}`);
      if (res.data.failed > 0) {
        toast.error(`${res.data.failed} message(s) failed to send`);
      }
      setSendingGroup(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send messages");
    }
  };

  const openMembers = (g: Group) => {
    setMembersGroup(g);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contact Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize contacts into groups for targeted messaging
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create Group
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              const timer = setTimeout(() => setSearch(e.target.value), 300);
              return () => clearTimeout(timer);
            }}
            placeholder="Search groups..."
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
          className="flex flex-wrap items-center gap-2 rounded-lg glass-card p-3"
        >
          <span className="text-xs font-medium text-muted-foreground mr-2">Size:</span>
          {[
            { key: "all", label: "All" },
            { key: "small", label: "Small (<100)" },
            { key: "medium", label: "Medium (100–999)" },
            { key: "large", label: "Large (1000+)" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSizeFilter(f.key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                sizeFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl glass-card stat-card-glow p-5 hover-lift"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl`}
                    style={{ backgroundColor: g.color || "#6366f1" }}
                  >
                    <UsersRound className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{g.name}</h3>
                    <p className="text-xs text-muted-foreground">Created {formatTimeAgo(g.createdAt)}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Members
                  </span>
                  <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    {g.contactCount?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Campaigns
                  </span>
                  <p className="text-sm font-semibold tabular-nums text-foreground">—</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                <Link
                  to={`/groups/${g._id}/chat`}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <MessageSquare className="h-3 w-3" /> View Chat
                </Link>
                <button
                  onClick={() => openSend(g)}
                  disabled={!g.contactCount || g.contactCount === 0}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-3 w-3" /> Send Message
                </button>
                <button
                  onClick={() => openMembers(g)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Users className="h-3 w-3" /> Members
                </button>
                <button
                  onClick={() => openEdit(g)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Edit className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => setDeleting(g)}
                  className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No groups found
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal (themed, same as Brands) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editing ? "Edit Group" : "Create Group"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Group name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <textarea
                placeholder="Description (optional)"
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Color:</span>
                {COLORS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-6 w-6 rounded-full transition ${
                      form.color === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={createGroup.isPending || updateGroup.isPending}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {editing ? "Update Group" : "Create Group"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation (themed, same as Brands) */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Delete Group</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleting.name}</span>? This
              action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteGroup.isPending}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal (themed, same as Brands) */}
      {sendingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Send to {sendingGroup.name}</h2>
              <button onClick={() => setSendingGroup(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {sendingGroup.contactCount?.toLocaleString() || 0} member(s) in this group will receive the message.
            </p>
            <form onSubmit={handleSend} className="space-y-3">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              >
                <option value="">Select a template (optional)...</option>
                {templates.map((t: any) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.language})
                    {t.status !== "approved" ? ` — ${t.status}` : ""}
                  </option>
                ))}
              </select>
              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No templates found. Create one on the Templates page.
                </p>
              )}
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={5}
                placeholder={
                  templateId ? "Template selected — message will use template body" : "Type your message here..."
                }
                disabled={!!templateId}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={sendToGroup.isPending}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {sendToGroup.isPending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {membersGroup && (
        <GroupMembersModal
          group={membersGroup}
          onClose={() => setMembersGroup(null)}
        />
      )}
    </motion.div>
  );
}

function GroupMembersModal({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const { data: membersData, isLoading } = useGroupContacts(group._id, { page: 1 });
  const members = membersData?.contacts || [];
  const addContacts = useAddGroupContacts();
  const bulkImport = useImportGroupContacts();
  const importContacts = useImportContactsToGroup();
  const removeContact = useRemoveGroupContact();

  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkText, setBulkText] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // available contacts to add (search)
  const { data: contactsData } = useContacts({ search: searchTerm || undefined, limit: 50 });
  const allContacts = contactsData?.contacts || [];

  const existingIds = new Set(members.map((m) => m._id));
  const available = allContacts.filter((c) => !existingIds.has(c._id));

  useEffect(() => {
    setSelected([]);
  }, [searchTerm]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const allSelected = available.length > 0 && available.every((c) => selected.includes(c._id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !available.some((c) => c._id === id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...available.map((c) => c._id)])));
    }
  };

  const handleAddSelected = async () => {
    if (selected.length === 0) {
      toast.error("Select at least one contact");
      return;
    }
    try {
      await addContacts.mutateAsync({ id: group._id, contactIds: selected });
      toast.success(`Added ${selected.length} contact(s)`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add contacts");
    }
  };

  const handleBulkImport = async () => {
    const ids = bulkText
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      toast.error("Enter contact IDs to import");
      return;
    }
    try {
      await bulkImport.mutateAsync({ id: group._id, contactIds: ids });
      toast.success(`Imported ${ids.length} contact(s)`);
      setBulkText("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to import contacts");
    }
  };

  /**
   * Parse a CSV string into contact objects.
   * Accepts headers (name, phone, email) or bare values. One row per contact.
   */
  const parseCsvToContacts = (csv: string) => {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return [];

    const splitRow = (row: string) =>
      row
        .split(/[,;]+/)
        .map((cell) => cell.trim().replace(/^"|"$/g, ""))
        .filter((c) => c.length > 0);

    let startIndex = 0;
    let cols = { name: 0, phone: 1, email: 2 };

    const first = splitRow(lines[0]).map((c) => c.toLowerCase());
    const hasHeader = first.some((c) => c.includes("phone") || c.includes("name") || c.includes("email"));
    if (hasHeader) {
      cols = {
        name: first.findIndex((c) => c.includes("name")),
        phone: first.findIndex((c) => c.includes("phone")),
        email: first.findIndex((c) => c.includes("email")),
      };
      startIndex = 1;
    }

    const contacts: { name?: string; phone: string; email?: string }[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const cells = splitRow(lines[i]);
      const phone = (cols.phone >= 0 ? cells[cols.phone] : cells[1] || cells[0])?.replace(/[^\d+]/g, "");
      if (!phone) continue;
      const name = cols.name >= 0 ? cells[cols.name] : undefined;
      const email = cols.email >= 0 ? cells[cols.email] : undefined;
      contacts.push({ name: name || undefined, phone, email: email || undefined });
    }
    return contacts;
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error("Choose a CSV file first");
      return;
    }
    try {
      const text = await csvFile.text();
      const contacts = parseCsvToContacts(text);
      if (contacts.length === 0) {
        toast.error("No valid contacts found in the CSV (need a phone number per row)");
        return;
      }
      const res = await importContacts.mutateAsync({ id: group._id, contacts });
      const data: any = res?.data || {};
      toast.success(
        `Imported ${data.created ?? contacts.length} contact(s)${
          data.skipped ? `, ${data.skipped} skipped (duplicates)` : ""
        }`
      );
      setCsvFile(null);
      const input = document.getElementById(`csv-input-${group._id}`) as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to import CSV");
    }
  };

  const handleRemove = async (contactId: string) => {
    try {
      await removeContact.mutateAsync({ id: group._id, contactId });
      toast.success("Contact removed from group");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove contact");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Manage Members — {group.name}</h2>
            <p className="text-xs text-muted-foreground">
              {members.length} member(s) in this group
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-2">
          {/* Current members */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Members
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No contacts yet. Add some from the right.
                </p>
              ) : (
                members.map((m: Contact) => (
                  <div
                    key={m._id}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{m.name || "Unnamed"}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.phone}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(m._id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Remove from group"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add contacts */}
          <div className="flex flex-col overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add Contacts
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search contacts..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>

              <div className="max-h-40 space-y-1 overflow-y-auto">
                {available.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
                    {searchTerm ? "No matching contacts" : "All contacts already added"}
                  </p>
                ) : (
                  <>
                    <label className="flex cursor-pointer items-center justify-between rounded-md bg-secondary/60 px-2 py-1.5 text-xs font-medium text-foreground">
                      <span>Select all ({available.length})</span>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 accent-primary"
                      />
                    </label>
                    {available.map((c: Contact) => (
                      <label
                        key={c._id}
                        className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-secondary"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{c.name || "Unnamed"}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.phone}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selected.includes(c._id)}
                          onChange={() => toggleSelect(c._id)}
                          className="h-4 w-4 accent-primary"
                        />
                      </label>
                    ))}
                  </>
                )}
              </div>

              <button
                onClick={handleAddSelected}
                disabled={selected.length === 0 || addContacts.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />
                {addContacts.isPending ? "Adding..." : `Add ${selected.length || ""} Selected`}
              </button>

              <div className="border-t border-border pt-3">
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Upload className="h-3.5 w-3.5" /> Bulk import (paste contact IDs)
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={3}
                  placeholder="One ID per line, or comma-separated"
                  className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none resize-none"
                />
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkText.trim() || bulkImport.isPending}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {bulkImport.isPending ? "Importing..." : "Import Contacts"}
                </button>
              </div>

              <div className="border-t border-border pt-3">
                <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Upload className="h-3.5 w-3.5" /> Upload CSV file
                </p>
                <p className="mb-2 text-[11px] text-muted-foreground">
                  Columns: name, phone, email (header optional). One contact per row.
                </p>
                <input
                  id={`csv-input-${group._id}`}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
                />
                <button
                  onClick={handleCsvUpload}
                  disabled={!csvFile || importContacts.isPending}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  {importContacts.isPending ? "Uploading..." : "Upload & Add to Group"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
