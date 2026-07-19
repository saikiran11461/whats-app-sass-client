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
} from "lucide-react";
import { useState } from "react";
import {
  useTemplates,
  useCreateTemplate,
  useDeleteTemplate,
} from "@/hooks/useTemplates";
import { toast } from "sonner";

export default function Templates() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    body: "",
    category: "utility" as const,
    language: "English",
  });

  const { data, isLoading } = useTemplates({
    search: searchQuery || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const templates = data?.templates || [];

  const { mutate: createTemplate, isPending: creating } = useCreateTemplate();
  const { mutate: deleteTemplate } = useDeleteTemplate();

  const handleCreate = () => {
    if (!newTemplate.name || !newTemplate.body) {
      toast.error("Name and body are required");
      return;
    }
    createTemplate(newTemplate as any, {
      onSuccess: () => {
        toast.success("Template created!");
        setShowCreate(false);
        setNewTemplate({ name: "", body: "", category: "utility", language: "English" });
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to create template");
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this template?")) {
      deleteTemplate(id, {
        onSuccess: () => toast.success("Template deleted"),
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
            Templates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your WhatsApp approved message templates
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create Template
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowCreate(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="w-full max-w-lg rounded-xl glass-card stat-card-glow p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-foreground">
              Create Template
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Template Name"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <textarea
                placeholder="Template Body (use {{1}}, {{2}} for variables)"
                value={newTemplate.body}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, body: e.target.value })
                }
                rows={4}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              />
              <select
                value={newTemplate.category}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    category: e.target.value as any,
                  })
                }
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none"
              >
                <option value="utility">Utility</option>
                <option value="marketing">Marketing</option>
                <option value="authentication">Authentication</option>
                <option value="otp">OTP</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

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
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
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
            <span className="text-xs font-medium text-muted-foreground">
              Category:
            </span>
            {["all", "utility", "marketing", "authentication", "otp"].map(
              (c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Status:
            </span>
            {["all", "approved", "pending", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
              >
                {s === "all"
                  ? "All"
                  : s.charAt(0).toUpperCase() + s.slice(1)}
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
                transition={{ delay: i * 0.06 }}
                className="rounded-xl glass-card stat-card-glow p-5 hover-lift"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t.name}
                    </h3>
                    <span
                      className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        t.category === "marketing"
                          ? "bg-indigo/10 text-indigo"
                          : t.category === "utility"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {t.category}
                    </span>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      t.status === "approved"
                        ? "bg-primary/10 text-primary"
                        : t.status === "pending"
                          ? "bg-amber/10 text-amber"
                          : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground line-clamp-2">
                  {t.body}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Language
                    </span>
                    <p className="text-xs text-foreground">{t.language}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Total Uses
                    </span>
                    <p className="text-xs tabular-nums text-foreground">
                      {t.totalUses?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                  <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                  <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                  <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <Copy className="h-3 w-3" /> Clone
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
    </motion.div>
  );
}
