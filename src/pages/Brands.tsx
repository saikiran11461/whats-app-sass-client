import { motion } from "framer-motion";
import { Plus, Building2, Edit, Trash2, MoreHorizontal, RefreshCw, AlertTriangle, CheckCircle, XCircle, Search, Filter, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand, useReconnectBrand, type Brand } from "@/hooks/useBrands";
import { useAuth } from "@/hooks/useAuth";

function formatRelativeTime(dateStr?: string | null) {
  if (!dateStr) return "never";
  const date = new Date(dateStr);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function emptyForm(): Partial<Brand> {
  return {
    businessName: "",
    phoneNumber: "",
    website: "",
    description: "",
    industry: "",
    timezone: "UTC",
    language: "en",
    theme: "light",
    connectionStatus: "healthy",
    status: "active",
  };
}

export default function Brands() {
  const { data: brands = [], isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const reconnectBrand = useReconnectBrand();
  const { user } = useAuth();
  const activeBrandId = user?.activeBrandId;

  const [statusFilter, setStatusFilter] = useState("all");
  const [connectionFilter, setConnectionFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<Partial<Brand>>(emptyForm());
  const [deleting, setDeleting] = useState<Brand | null>(null);
  const [reconnectingId, setReconnectingId] = useState<string | null>(null);

  const filtered = brands.filter((b) => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const matchConnection = connectionFilter === "all" || b.connectionStatus === connectionFilter;
    return matchStatus && matchConnection;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({ ...b });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateBrand.mutateAsync({ id: editing._id, data: form });
    } else {
      await createBrand.mutateAsync(form);
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteBrand.mutateAsync(deleting._id);
    setDeleting(null);
  };

  const handleReconnect = async (b: Brand) => {
    setReconnectingId(b._id);
    try {
      await reconnectBrand.mutateAsync(b._id);
    } finally {
      setReconnectingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Brand Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage multiple WhatsApp Business brands</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Brand
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search brands..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-4 rounded-lg glass-card p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {["all", "active", "inactive"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Connection:</span>
            {["all", "healthy", "token_expired"].map((c) => (
              <button key={c} onClick={() => setConnectionFilter(c)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${connectionFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {c === "all" ? "All" : c === "token_expired" ? "Expired" : "Healthy"}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((b, i) => (
          <motion.div key={b._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`rounded-xl glass-card stat-card-glow p-5 hover-lift ${b._id === activeBrandId ? "ring-2 ring-primary" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{b.businessName}</h3>
                    {b.isDefault && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">Default</span>}
                    {b._id === activeBrandId && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-500">Active</span>}
                  </div>
                  <p className="text-xs tabular-nums text-muted-foreground">{b.phoneNumber || "—"}</p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 rounded-lg border border-border bg-surface-raised p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Connection</span>
                {b.connectionStatus === "healthy" ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-primary"><CheckCircle className="h-3 w-3" /> Healthy</span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive"><XCircle className="h-3 w-3" /> Token Expired</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Token: {b.tokenExpiry ? new Date(b.tokenExpiry).toLocaleDateString() : "Active"}</span><span>•</span><span>Sync: {formatRelativeTime(b.lastSync)}</span>
              </div>
              {b.connectionStatus === "token_expired" && (
                <div className="mt-2 flex items-center gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  <span className="text-[11px] text-destructive">Reconnect required — token has expired</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${b.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${b.status === "active" ? "bg-primary" : "bg-muted-foreground"}`} />
                {b.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div><span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Messages</span><p className="text-sm font-semibold tabular-nums text-foreground">{(b.messageCount || 0).toLocaleString()}</p></div>
              <div><span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Contacts</span><p className="text-sm font-semibold tabular-nums text-foreground">{(b.contactCount || 0).toLocaleString()}</p></div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <button onClick={() => openEdit(b)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><Edit className="h-3 w-3" /> Edit</button>
              <button
                onClick={() => handleReconnect(b)}
                disabled={reconnectingId === b._id}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                {reconnectingId === b._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Reconnect
              </button>
              <button onClick={() => setDeleting(b)} className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={openCreate}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Plus className="h-6 w-6 text-primary" /></div>
          <p className="mt-3 text-sm font-semibold text-foreground">Add New Brand</p>
          <p className="mt-1 text-xs text-muted-foreground">Connect a new WhatsApp Business number</p>
        </motion.div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{editing ? "Edit Brand" : "Add Brand"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Business name" value={form.businessName || ""} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
              <input placeholder="Phone number" value={form.phoneNumber || ""} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
              <input placeholder="Website" value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
              <textarea placeholder="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
              <div className="flex items-center gap-3">
                <select value={form.status || "active"} onChange={(e) => setForm({ ...form, status: e.target.value as Brand["status"] })} className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select value={form.connectionStatus || "healthy"} onChange={(e) => setForm({ ...form, connectionStatus: e.target.value as Brand["connectionStatus"] })} className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none">
                  <option value="healthy">Healthy</option>
                  <option value="token_expired">Token Expired</option>
                  <option value="disconnected">Disconnected</option>
                </select>
              </div>
              <button type="submit" disabled={createBrand.isPending || updateBrand.isPending} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {editing ? "Update Brand" : "Create Brand"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Delete Brand</h2>
            <p className="mt-2 text-sm text-muted-foreground">Are you sure you want to delete <span className="font-semibold text-foreground">{deleting.businessName}</span>? This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDeleting(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={handleDelete} disabled={deleteBrand.isPending} className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-50">Delete</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
