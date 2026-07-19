import { motion } from "framer-motion";
import { Plus, UsersRound, Send, Edit, Trash2, Users, Search, Filter, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup, useSendToGroup, type Group } from "@/hooks/useGroups";
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

  const filtered = groups.filter((g) => {
    const matchSearch = searchQuery === "" || g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSize = sizeFilter === "all" ||
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
      await updateGroup.mutateAsync({ id: editing._id, data: form }, {
        onSuccess: () => toast.success("Group updated!"),
        onError: (err: any) => toast.error(err?.response?.data?.message || "Failed"),
      });
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
      toast.success(`Queued ${res.sent} of ${res.total} message(s) to ${sendingGroup.name}`);
      if (res.failed > 0) {
        toast.error(`${res.failed} message(s) failed to send`);
      }
      setSendingGroup(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send messages");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contact Groups</h1>
          <p className="mt-1 text-sm text-muted-foreground">Organize contacts into groups for targeted messaging</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Create Group
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); const timer = setTimeout(() => setSearch(e.target.value), 300); return () => clearTimeout(timer); }} placeholder="Search groups..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-2 rounded-lg glass-card p-3">
          <span className="text-xs font-medium text-muted-foreground mr-2">Size:</span>
          {[{ key: "all", label: "All" }, { key: "small", label: "Small (<100)" }, { key: "medium", label: "Medium (100–999)" }, { key: "large", label: "Large (1000+)" }].map((f) => (
            <button key={f.key} onClick={() => setSizeFilter(f.key)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${sizeFilter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {f.label}
            </button>
          ))}
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((g, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-xl glass-card stat-card-glow p-5 hover-lift">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl`} style={{ backgroundColor: g.color || "#6366f1" }}>
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
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Members</span>
                  <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground"><Users className="h-3 w-3 text-muted-foreground" />{g.contactCount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Campaigns</span>
                  <p className="text-sm font-semibold tabular-nums text-foreground">—</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                <button onClick={() => openSend(g)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><Send className="h-3 w-3" /> Send Message</button>
                <button onClick={() => openEdit(g)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><Edit className="h-3 w-3" /> Edit</button>
                <button onClick={() => setDeleting(g)} className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
              </div>
            </motion.div>
          ))}
          {!isLoading && filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">No groups found</div>
          )}
        </div>
      )}

      {/* Create / Edit Modal (themed, same as Brands) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Group" : "Create Group"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Group name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
              <textarea placeholder="Description (optional)" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Color:</span>
                {COLORS.map((c) => (
                  <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} className={`h-6 w-6 rounded-full transition ${form.color === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""}`} style={{ backgroundColor: c }} />
                ))}
              </div>
              <button type="submit" disabled={createGroup.isPending || updateGroup.isPending} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
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
            <p className="mt-2 text-sm text-muted-foreground">Are you sure you want to delete <span className="font-semibold text-foreground">{deleting.name}</span>? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleDelete} disabled={deleteGroup.isPending} className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50">Delete</button>
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
              <button onClick={() => setSendingGroup(null)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">{sendingGroup.contactCount?.toLocaleString() || 0} member(s) in this group will receive the message.</p>
            <form onSubmit={handleSend} className="space-y-3">
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none"
              >
                <option value="">Select a template (optional)...</option>
                {templates.map((t: any) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.language}){t.status !== "approved" ? ` — ${t.status}` : ""}
                  </option>
                ))}
              </select>
              {templates.length === 0 && (
                <p className="text-xs text-muted-foreground">No templates found. Create one on the Templates page.</p>
              )}
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={5}
                placeholder={templateId ? "Template selected — message will use template body" : "Type your message here..."}
                disabled={!!templateId}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none disabled:opacity-50"
              />
              <button type="submit" disabled={sendToGroup.isPending} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {sendToGroup.isPending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
