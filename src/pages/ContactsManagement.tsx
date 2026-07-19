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
import { useState } from "react";
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

  const { data, isLoading } = useContacts({
    search: searchQuery || undefined,
    tag: tagFilter !== "all" ? tagFilter : undefined,
  });
  const contacts = data?.contacts || [];

  const { mutate: createContact, isPending: creating } = useCreateContact();
  const { mutate: deleteContact } = useDeleteContact();
  const { mutate: bulkImport, isPending: importing } = useBulkImportContacts();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", tags: "" });

  const handleImport = () => {
    bulkImport(
      [{ name: "Sample", phone: "+919999999999", tags: ["Lead"] }],
      {
        onSuccess: () => {
          toast.success("Contacts imported successfully!");
          setShowUpload(false);
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Import failed");
        },
      }
    );
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
              <div className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 transition-colors hover:border-primary/50 hover:bg-primary/10">
                <Upload className="h-8 w-8 text-primary/60" />
                <p className="text-sm font-medium text-foreground">
                  Drop CSV file here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported: .csv, .xlsx — Max 50,000 rows
                </p>
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import Contacts"}
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
